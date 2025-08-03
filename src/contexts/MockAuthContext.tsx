import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserType = 'buyer' | 'supplier';

export interface User {
  id: string;
  email: string;
  name: string;
  userType: UserType;
  isLoggedIn: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  currentUserType: UserType;
  login: (email: string, password: string, userType: UserType) => Promise<boolean>;
  register: (email: string, password: string, name: string, userType: UserType) => Promise<boolean>;
  logout: () => void;
  switchUserType: (userType: UserType) => void;
  canSwitchToSupplier: boolean;
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

  // 从localStorage加载用户状态
  useEffect(() => {
    const savedUser = localStorage.getItem('agro_user');
    const savedUserType = localStorage.getItem('agro_user_type') as UserType;
    
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setCurrentUserType(savedUserType || parsedUser.userType || 'buyer');
      } catch (error) {
        console.error('Failed to parse saved user:', error);
        localStorage.removeItem('agro_user');
        localStorage.removeItem('agro_user_type');
      }
    } else {
      // 默认用户类型为采购商
      setCurrentUserType('buyer');
    }
  }, []);

  // 模拟登录
  const login = async (email: string, password: string, userType: UserType): Promise<boolean> => {
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 简单的模拟验证（任何邮箱+密码都能登录）
    if (email && password) {
      const newUser: User = {
        id: Date.now().toString(),
        email,
        name: email.split('@')[0] || '用户',
        userType,
        isLoggedIn: true
      };
      
      setUser(newUser);
      setCurrentUserType(userType);
      
      // 保存到localStorage
      localStorage.setItem('agro_user', JSON.stringify(newUser));
      localStorage.setItem('agro_user_type', userType);
      
      return true;
    }
    
    return false;
  };

  // 模拟注册
  const register = async (email: string, password: string, name: string, userType: UserType): Promise<boolean> => {
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // 简单的模拟验证
    if (email && password && name) {
      const newUser: User = {
        id: Date.now().toString(),
        email,
        name,
        userType,
        isLoggedIn: true
      };
      
      setUser(newUser);
      setCurrentUserType(userType);
      
      // 保存到localStorage
      localStorage.setItem('agro_user', JSON.stringify(newUser));
      localStorage.setItem('agro_user_type', userType);
      
      return true;
    }
    
    return false;
  };

  // 登出
  const logout = () => {
    setUser(null);
    setCurrentUserType('buyer'); // 重置为默认的采购商
    localStorage.removeItem('agro_user');
    localStorage.removeItem('agro_user_type');
  };

  // 切换用户类型
  const switchUserType = (userType: UserType) => {
    setCurrentUserType(userType);
    localStorage.setItem('agro_user_type', userType);
  };

  // 判断是否可以切换到供应商模式
  // 规则：供应商注册的用户可以体验采购商模式，但采购商注册的用户不能切换到供应商
  const canSwitchToSupplier = user ? user.userType === 'supplier' : true;

  const value: AuthContextType = {
    user,
    isLoggedIn: !!user,
    currentUserType,
    login,
    register,
    logout,
    switchUserType,
    canSwitchToSupplier
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};