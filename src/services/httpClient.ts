// 增强的HTTP客户端 - 统一错误处理
import { ErrorParser } from '@/utils/errorParser';
import { ParsedError, BusinessErrorContext } from '@/types/error';

export class EnhancedHttpClient {
  private baseURL: string;
  private defaultTimeout: number = 30000; // 30秒

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  /**
   * 通用HTTP请求方法
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    businessContext?: BusinessErrorContext
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    // 获取存储的token
    const token = localStorage.getItem('agro_access_token');
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.defaultTimeout);

      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: 'Network request failed',
          error: 'Network Error',
          statusCode: response.status,
        }));

        // 处理401错误（未授权）
        if (response.status === 401) {
          this.handleUnauthorized();
        }
        
        // 解析并抛出结构化错误
        const parsedError = ErrorParser.parseHttpError(
          { ...errorData, statusCode: response.status },
          businessContext
        );
        
        throw parsedError;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      // 处理网络连接错误
      if (error instanceof TypeError && error.message.includes('fetch')) {
        const parsedError = ErrorParser.parseHttpError(
          {
            message: 'Network connection failed, please check your internet connection',
            error: 'Network Error',
            statusCode: 0,
          },
          businessContext
        );
        throw parsedError;
      }

      // 处理超时错误
      if (error instanceof DOMException && error.name === 'AbortError') {
        const parsedError = ErrorParser.parseHttpError(
          {
            message: 'Request timeout, please try again',
            error: 'Timeout Error',
            statusCode: 408,
          },
          businessContext
        );
        throw parsedError;
      }

      // 如果已经是解析过的错误，直接抛出
      if (error && typeof error === 'object' && 'type' in error) {
        throw error;
      }

      // 其他未知错误
      const parsedError = ErrorParser.parseHttpError(
        error,
        businessContext
      );
      throw parsedError;
    }
  }

  /**
   * 处理401未授权错误
   */
  private handleUnauthorized() {
    localStorage.removeItem('agro_access_token');
    localStorage.removeItem('agro_user');
    localStorage.removeItem('agro_user_type');
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
  }

  /**
   * GET请求
   */
  async get<T>(endpoint: string, businessContext?: BusinessErrorContext): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' }, businessContext);
  }

  /**
   * POST请求
   */
  async post<T>(
    endpoint: string, 
    data?: unknown, 
    businessContext?: BusinessErrorContext
  ): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      },
      businessContext
    );
  }

  /**
   * PUT请求
   */
  async put<T>(
    endpoint: string, 
    data?: unknown, 
    businessContext?: BusinessErrorContext
  ): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      },
      businessContext
    );
  }

  /**
   * DELETE请求
   */
  async delete<T>(endpoint: string, businessContext?: BusinessErrorContext): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' }, businessContext);
  }

  /**
   * PATCH请求
   */
  async patch<T>(
    endpoint: string, 
    data?: unknown, 
    businessContext?: BusinessErrorContext
  ): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: 'PATCH',
        body: data ? JSON.stringify(data) : undefined,
      },
      businessContext
    );
  }

  /**
   * 设置请求超时时间
   */
  setTimeout(timeout: number) {
    this.defaultTimeout = timeout;
    return this;
  }
}

// 创建全局HTTP客户端实例
export const httpClient = new EnhancedHttpClient('http://localhost:3050');

// 为不同业务模块创建专用客户端
export const inquiryHttpClient = new EnhancedHttpClient('http://localhost:3050')
  .setTimeout(45000); // 询价模块使用更长的超时时间

export const productHttpClient = new EnhancedHttpClient('http://localhost:3050')
  .setTimeout(30000);

export const authHttpClient = new EnhancedHttpClient('http://localhost:3050')
  .setTimeout(20000);

export const companyHttpClient = new EnhancedHttpClient('http://localhost:3050')
  .setTimeout(30000); // 企业认证模块