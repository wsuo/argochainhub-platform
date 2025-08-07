import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  AlertCircle, 
  RefreshCw, 
  ArrowLeft,
  Shield,
  Wifi,
  Database,
  Settings,
  HelpCircle
} from 'lucide-react';
import { 
  ParsedError, 
  ErrorType, 
  ErrorSeverity, 
  ErrorActionConfig,
  ErrorDisplayConfig 
} from '@/types/error';
import { ErrorParser } from '@/utils/errorParser';

interface ErrorBoundaryProps {
  error: ParsedError | null;
  loading?: boolean;
  title?: string;
  description?: string;
  config?: ErrorDisplayConfig;
  onRetry?: () => void;
  onNavigateBack?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({
  error,
  loading = false,
  title,
  description,
  config,
  onRetry,
  onNavigateBack,
  className = '',
  children
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // 如果没有错误，渲染子组件
  if (!error) {
    return <>{children}</>;
  }

  // 获取错误图标
  const getErrorIcon = (errorType: ErrorType) => {
    if (ErrorParser.isPermissionError(errorType)) return Shield;
    if (ErrorParser.isAuthError(errorType)) return Shield;
    if (ErrorParser.isNetworkError(errorType)) return Wifi;
    if (errorType === ErrorType.DATA_NOT_FOUND) return Database;
    if (errorType === ErrorType.SYSTEM_MAINTENANCE) return Settings;
    return AlertCircle;
  };

  // 获取错误变体
  const getErrorVariant = (severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return 'destructive';
      case ErrorSeverity.HIGH:
        return 'destructive';
      case ErrorSeverity.MEDIUM:
        return 'default';
      case ErrorSeverity.LOW:
        return 'default';
      default:
        return 'default';
    }
  };

  // 构建默认操作按钮
  const buildDefaultActions = (): ErrorActionConfig[] => {
    const actions: ErrorActionConfig[] = [];

    // 认证错误：提供登录按钮
    if (ErrorParser.isAuthError(error.type)) {
      actions.push({
        type: 'button',
        label: '去登录',
        variant: 'default',
        action: () => navigate('/auth')
      });
    }

    // 重试按钮
    if (ErrorParser.isRetryable(error.type) && onRetry) {
      actions.push({
        type: 'button',
        label: t('common.retry'),
        variant: 'outline',
        action: onRetry
      });
    }

    // 返回按钮
    if (onNavigateBack) {
      actions.push({
        type: 'button',
        label: t('common.goBack'),
        variant: 'ghost',
        action: onNavigateBack
      });
    }

    // 帮助按钮
    if (ErrorParser.isPermissionError(error.type)) {
      actions.push({
        type: 'button',
        label: t('common.getHelp'),
        variant: 'outline',
        action: () => {
          // 可以打开帮助文档或联系客服
          console.log('Open help documentation');
        }
      });
    }

    return actions;
  };

  const ErrorIcon = config?.icon || getErrorIcon(error.type);
  const variant = config?.variant || getErrorVariant(error.severity);
  const actions = config?.actions || buildDefaultActions();
  const showDetails = config?.showDetails ?? error.severity !== ErrorSeverity.LOW;

  // 分离返回按钮和其他操作
  const backAction = actions.find(action => action.label === t('common.goBack'));
  const otherActions = actions.filter(action => action.label !== t('common.goBack'));

  // 获取翻译文本
  const errorTitle = title || t(error.title, { defaultValue: 'An error occurred' });
  const errorMessage = description || t(error.message, { 
    defaultValue: 'Please try again or contact support if the problem persists'
  });

  // 处理验证错误的详细信息展示
  const getValidationErrorDisplay = () => {
    if (error.statusCode === 400 && error.details) {
      const details = typeof error.details === 'string' ? error.details.split('\n') : [];
      if (details.length > 0) {
        return (
          <div className="mt-2 space-y-1">
            <p className="text-sm font-medium">{t('errors.validationErrors', { defaultValue: '验证错误详情：' })}</p>
            <ul className="text-sm text-muted-foreground space-y-1 pl-4">
              {details.map((detail, index) => (
                <li key={index} className="list-disc">{detail}</li>
              ))}
            </ul>
          </div>
        );
      }
    }
    return null;
  };

  return (
    <div className={`w-full ${className}`}>
      {/* 返回按钮 - 左上角 */}
      {backAction && (
        <div className="mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={backAction.action}
            disabled={loading}
            className="p-2 h-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {backAction.label}
          </Button>
        </div>
      )}
      
      <Card className="border-border/50">
        <CardContent className="p-6">
          <Alert variant={variant as any}>
            <ErrorIcon className="h-5 w-5" />
            <AlertTitle className="text-lg font-semibold mb-2">
              {errorTitle}
            </AlertTitle>
            <AlertDescription>
              <div className="space-y-4">
                <p className="text-sm leading-relaxed">
                  {errorMessage}
                </p>
                
                {/* 验证错误详情展示 */}
                {getValidationErrorDisplay()}
                
                {showDetails && error.details && (
                  <details className="text-xs text-muted-foreground">
                    <summary className="cursor-pointer hover:text-foreground">
                      {t('errors.technicalDetails', { defaultValue: 'Technical Details' })}
                    </summary>
                    <div className="mt-2 p-2 bg-muted rounded text-xs font-mono">
                      {error.details}
                    </div>
                  </details>
                )}

                {otherActions.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {otherActions.map((action, index) => (
                      <Button
                        key={index}
                        variant={action.variant || 'outline'}
                        size="sm"
                        onClick={action.action}
                        disabled={loading}
                        className="text-xs"
                      >
                        {action.type === 'button' && action.label === t('common.retry') && loading && (
                          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                        )}
                        {action.type === 'button' && action.label === t('common.getHelp') && (
                          <HelpCircle className="h-3 w-3 mr-1" />
                        )}
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};