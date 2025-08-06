import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/MockAuthContext';
import { useTranslation } from 'react-i18next';

export interface AuthGuardConfig {
  title?: string;
  description?: string;
  requiredUserType?: 'buyer' | 'supplier' | 'any';
}

export const useAuthGuard = () => {
  const { isLoggedIn, currentUserType } = useAuth();
  const { t } = useTranslation();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [authConfig, setAuthConfig] = useState<AuthGuardConfig>({});

  // 检查用户权限
  const checkPermission = useCallback((config?: AuthGuardConfig) => {
    // 如果用户已登录
    if (isLoggedIn) {
      // 检查用户类型权限
      if (config?.requiredUserType && config.requiredUserType !== 'any') {
        return currentUserType === config.requiredUserType;
      }
      return true;
    }
    return false;
  }, [isLoggedIn, currentUserType]);

  // 执行需要认证的操作
  const executeWithAuth = useCallback((
    action: () => void,
    config?: AuthGuardConfig
  ) => {
    if (checkPermission(config)) {
      // 有权限，直接执行
      action();
    } else if (!isLoggedIn) {
      // 未登录，显示登录弹窗
      setPendingAction(() => action);
      setAuthConfig({
        title: config?.title || t('auth.loginTocontinue', { defaultValue: '登录以继续' }),
        description: config?.description || t('auth.loginRequired', { 
          defaultValue: '请登录您的账户以访问此功能' 
        }),
        ...config
      });
      setShowAuthDialog(true);
    } else {
      // 已登录但权限不足
      console.warn('用户权限不足:', {
        currentUserType,
        requiredUserType: config?.requiredUserType
      });
      // 这里可以显示权限不足的提示，暂时不处理
    }
  }, [isLoggedIn, currentUserType, checkPermission, t]);

  // 登录成功后的处理
  const handleAuthSuccess = useCallback(() => {
    setShowAuthDialog(false);
    if (pendingAction) {
      // 延迟执行，确保认证状态已更新
      setTimeout(() => {
        pendingAction();
        setPendingAction(null);
      }, 100);
    }
  }, [pendingAction]);

  // 关闭认证弹窗
  const closeAuthDialog = useCallback(() => {
    setShowAuthDialog(false);
    setPendingAction(null);
    setAuthConfig({});
  }, []);

  return {
    isLoggedIn,
    currentUserType,
    showAuthDialog,
    authConfig,
    executeWithAuth,
    handleAuthSuccess,
    closeAuthDialog,
    checkPermission
  };
};