import { ApiError } from '@/services/authService';

// 错误类型定义
export type ErrorType = 'network' | 'auth' | 'validation' | 'server' | 'unknown';

export interface ProcessedError {
  type: ErrorType;
  message: string;
  originalError: any;
  shouldRetry: boolean;
  isUserFriendly: boolean;
}

// 错误消息映射
const ERROR_MESSAGES: Record<string, string> = {
  // 网络错误
  'Network Error': '网络连接失败，请检查网络连接后重试',
  'Failed to fetch': '网络请求失败，请检查网络连接',
  
  // 认证错误
  '用户不存在或账户未激活': '用户不存在或账户未激活，请检查账号信息',
  '密码错误': '密码错误，请重新输入正确密码',
  '邮箱已存在': '该邮箱已被注册，请使用其他邮箱或直接登录',
  '企业尚未通过审核，请等待审核完成': '您的企业正在审核中，审核完成后将通过邮件通知您',
  '登录已过期，请重新登录': '登录状态已过期，请重新登录',
  
  // 验证错误
  '供应商注册必须提供企业名称': '供应商注册时企业名称为必填项',
  '请求参数错误': '提交的信息有误，请检查表单内容',
  
  // 服务器错误
  '服务器内部错误': '服务器暂时异常，请稍后重试',
  'Internal Server Error': '服务器内部错误，请稍后重试',
};

// 根据状态码确定错误类型
function getErrorTypeByStatusCode(statusCode: number): ErrorType {
  if (statusCode === 0) return 'network';
  if (statusCode === 401) return 'auth';
  if (statusCode >= 400 && statusCode < 500) return 'validation';
  if (statusCode >= 500) return 'server';
  return 'unknown';
}

// 处理API错误
export function processApiError(error: any): ProcessedError {
  // 如果是我们的ApiError类型
  if (error && typeof error === 'object' && 'statusCode' in error) {
    const apiError = error as ApiError;
    const type = getErrorTypeByStatusCode(apiError.statusCode);
    
    return {
      type,
      message: ERROR_MESSAGES[apiError.message] || apiError.message,
      originalError: error,
      shouldRetry: type === 'network' || type === 'server',
      isUserFriendly: true,
    };
  }
  
  // 网络错误
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      type: 'network',
      message: ERROR_MESSAGES['Network Error'],
      originalError: error,
      shouldRetry: true,
      isUserFriendly: true,
    };
  }
  
  // 其他错误
  const errorMessage = error?.message || error?.toString() || '未知错误';
  return {
    type: 'unknown',
    message: ERROR_MESSAGES[errorMessage] || '操作失败，请稍后重试',
    originalError: error,
    shouldRetry: false,
    isUserFriendly: true,
  };
}

// 网络状态检测
export class NetworkStatus {
  private static callbacks: Array<(isOnline: boolean) => void> = [];
  
  static isOnline(): boolean {
    return navigator.onLine;
  }
  
  static subscribe(callback: (isOnline: boolean) => void): () => void {
    this.callbacks.push(callback);
    
    const onOnline = () => callback(true);
    const onOffline = () => callback(false);
    
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    
    // 返回取消订阅函数
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }
}

// 重试机制
export class RetryHandler {
  private maxRetries: number;
  private baseDelay: number;
  
  constructor(maxRetries = 3, baseDelay = 1000) {
    this.maxRetries = maxRetries;
    this.baseDelay = baseDelay;
  }
  
  async execute<T>(
    operation: () => Promise<T>,
    shouldRetry: (error: any) => boolean = () => true
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === this.maxRetries || !shouldRetry(error)) {
          throw error;
        }
        
        // 指数退避延迟
        const delay = this.baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }
}

// 创建默认重试处理器
export const defaultRetryHandler = new RetryHandler();

// 用户友好的错误处理Hook
export function useErrorHandler() {
  const handleError = (error: any): ProcessedError => {
    const processedError = processApiError(error);
    
    // 记录错误（生产环境中可以发送到错误监控服务）
    if (process.env.NODE_ENV === 'development') {
      console.error('Error handled:', {
        type: processedError.type,
        message: processedError.message,
        original: processedError.originalError,
      });
    }
    
    return processedError;
  };
  
  return { handleError };
}

// 全局错误边界支持
export class GlobalErrorHandler {
  private static errorCallbacks: Array<(error: ProcessedError) => void> = [];
  
  static subscribe(callback: (error: ProcessedError) => void): () => void {
    this.errorCallbacks.push(callback);
    
    return () => {
      this.errorCallbacks = this.errorCallbacks.filter(cb => cb !== callback);
    };
  }
  
  static handleError(error: any): void {
    const processedError = processApiError(error);
    this.errorCallbacks.forEach(callback => {
      try {
        callback(processedError);
      } catch (err) {
        console.error('Error in error callback:', err);
      }
    });
  }
}

export default {
  processApiError,
  NetworkStatus,
  RetryHandler,
  defaultRetryHandler,
  useErrorHandler,
  GlobalErrorHandler,
};