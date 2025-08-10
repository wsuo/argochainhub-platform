import React, { createContext, useContext, useState, useEffect } from 'react';
import AuthService, { 
  User, 
  UserType as ApiUserType, 
  RegisterRequest,
  LoginRequest,
  ApiError 
} from '@/services/authService';
import { processApiError, NetworkStatus } from '@/lib/errorHandler';

// 为了保持向后兼容，映射API类型到前端类型
export type UserType = 'buyer' | 'supplier';

// 扩展注册参数接口
export interface RegisterParams extends Omit<RegisterRequest, 'userType' | 'userName'> {
  name: string;
  userType: UserType;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  currentUserType: UserType;
  isLoading: boolean;
  error: string | null;
  isOnline: boolean;
  login: (email: string, password: string, userType: UserType) => Promise<boolean>;
  register: (params: RegisterParams) => Promise<boolean>;
  logout: () => void;
  switchUserType: (userType: UserType) => void;
  canSwitchToSupplier: boolean;
  clearError: () => void;
  retryLastOperation: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [currentUserType, setCurrentUserType] = useState<UserType>('buyer');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(NetworkStatus.isOnline());
  const [lastFailedOperation, setLastFailedOperation] = useState<(() => Promise<any>) | null>(null);

  // 监听网络状态变化
  useEffect(() => {
    const unsubscribe = NetworkStatus.subscribe((online) => {
      setIsOnline(online);
      if (!online) {
        setError('网络连接已断开，请检查网络设置');
      } else if (error === '网络连接已断开，请检查网络设置') {
        setError(null);
      }
    });

    return unsubscribe;
  }, [error]);

  // 统一错误处理函数
  const handleError = (error: any, operation?: () => Promise<any>) => {
    const processedError = processApiError(error);
    setError(processedError.message);
    
    // 如果错误可以重试，保存操作以便稍后重试
    if (processedError.shouldRetry && operation) {
      setLastFailedOperation(() => operation);
    } else {
      setLastFailedOperation(null);
    }
    
    console.error('Auth operation failed:', processedError);
  };

  // 重试上次失败的操作
  const retryLastOperation = async () => {
    if (!lastFailedOperation) return;
    
    if (!isOnline) {
      setError('网络连接不可用，请检查网络设置');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      await lastFailedOperation();
      setLastFailedOperation(null);
    } catch (error) {
      handleError(error, lastFailedOperation);
    } finally {
      setIsLoading(false);
    }
  };

  // 类型转换辅助函数
  const mapApiUserTypeToFrontend = (apiUserType: ApiUserType): UserType => {
    switch (apiUserType) {
      case 'individual_buyer':
        return 'buyer';
      case 'supplier':
        return 'supplier';
      default:
        return 'buyer';
    }
  };

  const mapFrontendUserTypeToApi = (userType: UserType): ApiUserType => {
    switch (userType) {
      case 'buyer':
        return 'individual_buyer';
      case 'supplier':
        return 'supplier';
      default:
        return 'individual_buyer';
    }
  };

  // 初始化：检查token和加载用户信息
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // 首先检查localStorage中的用户类型设置
        const savedUserType = localStorage.getItem('agro_user_type') as UserType;
        if (savedUserType) {
          setCurrentUserType(savedUserType);
        }

        // 检查是否有有效token
        if (AuthService.hasValidToken()) {
          try {
            const userData = await AuthService.getCurrentUser();
            setUser(userData);
            
            // 如果没有保存的用户类型设置，使用用户实际类型
            if (!savedUserType) {
              const frontendUserType = mapApiUserTypeToFrontend(userData.userType);
              setCurrentUserType(frontendUserType);
              localStorage.setItem('agro_user_type', frontendUserType);
            }
          } catch (error) {
            // Token可能过期或无效，清理本地存储
            console.error('Failed to get user info:', error);
            AuthService.logout();
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setError('初始化认证状态失败');
      } finally {
        setIsLoading(false);
      }
    };

    // 监听unauthorized事件，设置错误信息但不自动登出
    const handleUnauthorized = () => {
      console.log('Unauthorized detected, setting auth error message...');
      // 不立即登出，让ErrorBoundary来处理友好显示
      setError('需要登录才能访问此功能');
      // 不调用 logout() 避免页面闪烁
    };

    // 监听token刷新事件，更新用户信息
    const handleTokenRefresh = (event: CustomEvent) => {
      console.log('Token refresh detected, updating user info...');
      
      const { user: newUserInfo, reason } = event.detail;
      
      if (newUserInfo) {
        setUser(newUserInfo);
        console.log('User info updated after token refresh:', reason);
        
        // 如果是企业认证通过，显示成功消息
        if (reason === 'company_approved') {
          setError(null); // 清除任何现有错误
          // 可以在这里添加成功提示，但避免覆盖NotificationContext的处理
        }
      }
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    window.addEventListener('auth:token-refreshed', handleTokenRefresh as EventListener);
    
    initializeAuth();

    // 清理事件监听器
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
      window.removeEventListener('auth:token-refreshed', handleTokenRefresh as EventListener);
    };
  }, []);

  // 登录
  const login = async (email: string, password: string, userType: UserType): Promise<boolean> => {
    if (!isOnline) {
      setError('网络连接不可用，请检查网络设置');
      return false;
    }

    const loginOperation = async () => {
      const loginData: LoginRequest = { email, password };
      
      // 根据用户类型选择对应的登录接口
      let response;
      if (userType === 'buyer') {
        response = await AuthService.buyerLogin(loginData);
      } else {
        response = await AuthService.supplierLogin(loginData);
      }
      
      setUser(response.user);
      setCurrentUserType(userType);
      
      // 保存用户类型到localStorage
      localStorage.setItem('agro_user_type', userType);
      
      return true;
    };

    setIsLoading(true);
    setError(null);

    try {
      const result = await loginOperation();
      setLastFailedOperation(null);
      return result;
    } catch (error) {
      handleError(error, loginOperation);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // 注册
  const register = async (params: RegisterParams): Promise<boolean> => {
    if (!isOnline) {
      setError('网络连接不可用，请检查网络设置');
      return false;
    }

    const registerOperation = async () => {
      // 构建注册请求数据
      const registerData: RegisterRequest = {
        email: params.email,
        password: params.password,
        userName: params.name,
        userType: mapFrontendUserTypeToApi(params.userType),
        // 企业相关字段（供应商注册时使用）
        ...(params.userType === 'supplier' && {
          companyName: params.companyName,
          companyType: params.companyType,
          country: params.country,
          businessCategories: params.businessCategories,
          businessScope: params.businessScope,
          companySize: params.companySize,
          mainProducts: params.mainProducts,
          mainSuppliers: params.mainSuppliers,
          annualImportExportValue: params.annualImportExportValue,
          registrationNumber: params.registrationNumber,
          taxNumber: params.taxNumber,
          businessLicenseUrl: params.businessLicenseUrl,
          companyPhotosUrls: params.companyPhotosUrls,
        }),
      };

      const response = await AuthService.register(registerData);
      
      // 注册成功后，如果是个人采购商，直接登录
      if (params.userType === 'buyer') {
        // 个人采购商注册后立即可用，尝试自动登录
        // 使用专用的采购商登录接口
        const loginData: LoginRequest = { email: params.email, password: params.password };
        const loginResponse = await AuthService.buyerLogin(loginData);
        
        setUser(loginResponse.user);
        setCurrentUserType(params.userType);
        localStorage.setItem('agro_user_type', params.userType);
        
        return true;
      } else {
        // 供应商需要审核，不自动登录
        setError(`注册成功！${response.message}`);
        return true;
      }
    };

    setIsLoading(true);
    setError(null);

    try {
      const result = await registerOperation();
      setLastFailedOperation(null);
      return result;
    } catch (error) {
      handleError(error, registerOperation);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // 登出
  const logout = () => {
    AuthService.logout();
    setUser(null);
    setCurrentUserType('buyer'); // 重置为默认的采购商
    setError(null);
  };

  // 切换用户类型
  const switchUserType = (userType: UserType) => {
    setCurrentUserType(userType);
    localStorage.setItem('agro_user_type', userType);
  };

  // 清除错误
  const clearError = () => {
    setError(null);
  };

  // 刷新用户信息
  const refreshUser = async () => {
    if (!AuthService.hasValidToken()) {
      console.log('No valid token, cannot refresh user');
      return;
    }

    try {
      setIsLoading(true);
      const userInfo = await AuthService.getCurrentUser();
      setUser(userInfo);
      console.log('User info refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh user info:', error);
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  // 判断是否可以切换到供应商模式
  // 规则：供应商注册的用户可以体验采购商模式，但采购商注册的用户不能切换到供应商
  const canSwitchToSupplier = user ? 
    mapApiUserTypeToFrontend(user.userType) === 'supplier' : 
    true;

  const value: AuthContextType = {
    user,
    isLoggedIn: !!user,
    currentUserType,
    isLoading,
    error,
    isOnline,
    login,
    register,
    logout,
    switchUserType,
    canSwitchToSupplier,
    clearError,
    retryLastOperation,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};