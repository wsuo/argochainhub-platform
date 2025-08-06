// 错误处理Hook - 统一处理React Query错误
import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ErrorParser } from '@/utils/errorParser';
import { ParsedError, BusinessErrorContext, ErrorType } from '@/types/error';

interface UseErrorHandlerOptions {
  businessContext?: BusinessErrorContext;
  showToast?: boolean;
  autoRedirect?: boolean;
  retryable?: boolean;
}

export const useErrorHandler = (options: UseErrorHandlerOptions = {}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [parsedError, setParsedError] = useState<ParsedError | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // 解析错误
  const parseError = useCallback((error: any): ParsedError => {
    if (error && typeof error === 'object' && 'type' in error) {
      // 已经是解析过的错误
      return error as ParsedError;
    }
    
    return ErrorParser.parseHttpError(error, options.businessContext);
  }, [options.businessContext]);

  // 处理错误
  const handleError = useCallback((error: any) => {
    const parsed = parseError(error);
    setParsedError(parsed);

    // 自动处理认证错误 - 不再强制跳转，让组件处理显示
    if (ErrorParser.isAuthError(parsed.type)) {
      // 认证错误让ErrorBoundary组件友好显示，不再强制跳转
      console.log('认证错误检测到，将通过错误组件显示友好提示');
      return;
    }

    // 自动处理权限错误（不做跳转，让组件自己处理）
    if (ErrorParser.isPermissionError(parsed.type)) {
      // 权限错误由PermissionError组件处理
      return;
    }

    // 记录错误日志
    console.error('Application Error:', ErrorParser.createErrorSummary(parsed));

    // TODO: 这里可以集成错误上报服务
    // errorReportingService.report(parsed);
  }, [parseError, navigate, options.autoRedirect]);

  // 重试逻辑
  const retry = useCallback(async (retryFn?: () => Promise<void> | void) => {
    if (!parsedError || !ErrorParser.isRetryable(parsedError.type)) {
      return;
    }

    const delay = ErrorParser.getRetryDelay(parsedError.type, retryCount);
    
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    setRetryCount(prev => prev + 1);
    setParsedError(null);

    if (retryFn) {
      try {
        await retryFn();
      } catch (newError) {
        handleError(newError);
      }
    }
  }, [parsedError, retryCount, handleError]);

  // 清除错误
  const clearError = useCallback(() => {
    setParsedError(null);
    setRetryCount(0);
  }, []);

  // 导航回上一页或指定页面
  const navigateBack = useCallback((fallbackPath?: string) => {
    if (fallbackPath) {
      navigate(fallbackPath);
    } else {
      navigate(-1);
    }
    clearError();
  }, [navigate, clearError]);

  // 错误状态计算
  const errorState = useMemo(() => ({
    hasError: !!parsedError,
    isPermissionError: parsedError ? ErrorParser.isPermissionError(parsedError.type) : false,
    isNetworkError: parsedError ? ErrorParser.isNetworkError(parsedError.type) : false,
    isAuthError: parsedError ? ErrorParser.isAuthError(parsedError.type) : false,
    isRetryable: parsedError ? ErrorParser.isRetryable(parsedError.type) : false,
    canRetry: parsedError ? ErrorParser.isRetryable(parsedError.type) && retryCount < 3 : false,
    retryCount,
  }), [parsedError, retryCount]);

  return {
    // 错误状态
    parsedError,
    ...errorState,
    
    // 错误处理方法
    handleError,
    parseError,
    retry,
    clearError,
    navigateBack,
    
    // 工具方法
    isErrorType: useCallback((type: ErrorType) => {
      return parsedError?.type === type;
    }, [parsedError]),
    
    getErrorMessage: useCallback((key?: string) => {
      if (!parsedError) return '';
      return key ? t(key, { defaultValue: parsedError.message }) : t(parsedError.message);
    }, [parsedError, t]),
  };
};

// React Query专用错误处理Hook
export const useQueryErrorHandler = (businessContext?: BusinessErrorContext) => {
  const errorHandler = useErrorHandler({ 
    businessContext, 
    showToast: false, // React Query有自己的错误显示机制
    autoRedirect: true 
  });

  // React Query onError回调
  const onError = useCallback((error: any) => {
    errorHandler.handleError(error);
  }, [errorHandler.handleError]);

  return {
    onError,
    ...errorHandler,
  };
};