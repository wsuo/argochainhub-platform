// 错误解析器 - 智能识别和分类错误
import { 
  ErrorType, 
  ErrorSeverity, 
  ParsedError, 
  BusinessErrorContext,
  HTTP_STATUS_ERROR_MAP,
  ALL_ERROR_PATTERNS
} from '@/types/error';

export class ErrorParser {
  /**
   * 解析HTTP响应错误
   */
  static parseHttpError(
    error: any,
    businessContext?: BusinessErrorContext
  ): ParsedError {
    const statusCode = error?.statusCode || error?.status || 0;
    const message = error?.message || error?.error || 'Unknown error';
    const details = error?.details || error?.description;

    // 首先尝试从状态码映射
    let errorType = HTTP_STATUS_ERROR_MAP[statusCode] || ErrorType.UNKNOWN_ERROR;
    let severity = ErrorSeverity.MEDIUM;

    // 然后尝试从错误消息模式匹配
    const patternMatch = this.matchErrorPattern(message);
    if (patternMatch) {
      errorType = patternMatch.errorType;
      severity = patternMatch.severity;
    }

    // 特殊处理网络错误
    if (error instanceof TypeError && error.message.includes('fetch')) {
      errorType = ErrorType.NETWORK_CONNECTION_ERROR;
      severity = ErrorSeverity.HIGH;
    }

    // 处理详细的验证错误信息
    let processedDetails = details;
    if (statusCode === 400 && Array.isArray(message)) {
      // 400错误且消息是数组时，将验证错误信息整合到details中
      processedDetails = message.join('\n');
    }

    return {
      type: errorType,
      severity,
      title: this.getErrorTitle(errorType, businessContext),
      message: this.getErrorMessage(errorType, message, businessContext),
      details: processedDetails,
      statusCode,
      originalError: error,
      timestamp: new Date(),
      businessContext: businessContext?.module
    };
  }

  /**
   * 匹配错误消息模式
   */
  private static matchErrorPattern(message: string | string[]) {
    // 如果是数组，转换为字符串进行匹配
    const messageStr = Array.isArray(message) ? message.join(' ') : message;
    
    for (const pattern of ALL_ERROR_PATTERNS) {
      if (pattern.pattern.test(messageStr)) {
        return pattern;
      }
    }
    return null;
  }

  /**
   * 获取错误标题
   */
  private static getErrorTitle(
    errorType: ErrorType, 
    businessContext?: BusinessErrorContext
  ): string {
    const contextPrefix = businessContext?.module ? `${businessContext.module}.` : '';
    return `errors.${contextPrefix}${errorType}.title`;
  }

  /**
   * 获取错误消息
   */
  private static getErrorMessage(
    errorType: ErrorType, 
    originalMessage: string,
    businessContext?: BusinessErrorContext
  ): string {
    const contextPrefix = businessContext?.module ? `${businessContext.module}.` : '';
    
    // 优先使用业务上下文的翻译
    const contextualKey = `errors.${contextPrefix}${errorType}.message`;
    
    // 回退到通用翻译
    const genericKey = `errors.${errorType}.message`;
    
    return contextualKey;
  }

  /**
   * 判断是否为权限相关错误
   */
  static isPermissionError(errorType: ErrorType): boolean {
    return [
      ErrorType.PERMISSION_COMPANY_NOT_ASSOCIATED,
      ErrorType.PERMISSION_INVALID_COMPANY_TYPE,
      ErrorType.PERMISSION_ACCESS_DENIED,
      ErrorType.PERMISSION_ONLY_BUYER,
      ErrorType.PERMISSION_ONLY_SUPPLIER
    ].includes(errorType);
  }

  /**
   * 判断是否为认证相关错误
   */
  static isAuthError(errorType: ErrorType): boolean {
    return [
      ErrorType.AUTH_TOKEN_EXPIRED,
      ErrorType.AUTH_TOKEN_INVALID,
      ErrorType.AUTH_UNAUTHORIZED,
      ErrorType.AUTH_LOGIN_REQUIRED
    ].includes(errorType);
  }

  /**
   * 判断是否为网络相关错误
   */
  static isNetworkError(errorType: ErrorType): boolean {
    return [
      ErrorType.NETWORK_CONNECTION_ERROR,
      ErrorType.NETWORK_TIMEOUT,
      ErrorType.NETWORK_SERVER_ERROR
    ].includes(errorType);
  }

  /**
   * 判断是否可以重试
   */
  static isRetryable(errorType: ErrorType): boolean {
    return [
      ErrorType.NETWORK_CONNECTION_ERROR,
      ErrorType.NETWORK_TIMEOUT,
      ErrorType.NETWORK_SERVER_ERROR,
      ErrorType.SYSTEM_MAINTENANCE
    ].includes(errorType);
  }

  /**
   * 获取建议的重试延迟（毫秒）
   */
  static getRetryDelay(errorType: ErrorType, attempt: number): number {
    if (!this.isRetryable(errorType)) return 0;
    
    // 指数退避策略
    const baseDelay = 1000; // 1秒
    const maxDelay = 30000; // 30秒
    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    
    return delay;
  }

  /**
   * 创建简化的错误对象（用于日志记录）
   */
  static createErrorSummary(parsedError: ParsedError) {
    return {
      type: parsedError.type,
      severity: parsedError.severity,
      statusCode: parsedError.statusCode,
      businessContext: parsedError.businessContext,
      timestamp: parsedError.timestamp,
      message: parsedError.message
    };
  }
}