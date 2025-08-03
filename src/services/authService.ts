// 基础API配置
const API_BASE_URL = 'http://localhost:3050';
const API_PREFIX = '/api/v1/auth';

// 数据类型定义
export type UserType = 'individual_buyer' | 'supplier';
export type CompanyType = 'buyer' | 'supplier';
export type CompanySize = 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
export type CompanyStatus = 'pending_review' | 'active' | 'disabled';
export type UserRole = 'owner' | 'admin' | 'member';

// 多语言文本接口
export interface MultiLanguageText {
  'zh-CN': string;
  'en': string;
  'es'?: string;
}

// 企业信息接口
export interface Company {
  id: string;
  name: MultiLanguageText;
  type: CompanyType;
  status: CompanyStatus;
  profile?: any;
  rating?: number;
  isTop100: boolean;
  country?: string;
  businessCategories?: string[];
  businessScope?: MultiLanguageText;
  companySize?: CompanySize;
  mainProducts?: MultiLanguageText;
  mainSuppliers?: MultiLanguageText;
  annualImportExportValue?: number;
  registrationNumber?: string;
  taxNumber?: string;
  businessLicenseUrl?: string;
  companyPhotosUrls?: string[];
}

// 用户信息接口
export interface User {
  id: string;
  email: string;
  name: string;
  userType: UserType;
  role: UserRole;
  lastLoginAt?: string;
  type: 'user';
  company?: Company | null;
}

// 注册请求接口
export interface RegisterRequest {
  email: string;
  password: string;
  userName: string;
  userType: UserType;
  // 供应商特有字段
  companyName?: MultiLanguageText;
  companyType?: CompanyType;
  country?: string;
  businessCategories?: string[];
  businessScope?: MultiLanguageText;
  companySize?: CompanySize;
  mainProducts?: MultiLanguageText;
  mainSuppliers?: MultiLanguageText;
  annualImportExportValue?: number;
  registrationNumber?: string;
  taxNumber?: string;
  businessLicenseUrl?: string;
  companyPhotosUrls?: string[];
}

// 登录请求接口
export interface LoginRequest {
  email: string;
  password: string;
}

// API响应接口
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

// 注册响应数据
export interface RegisterResponseData {
  message: string;
  userType: UserType;
  needsApproval: boolean;
}

// 登录响应数据
export interface LoginResponseData {
  accessToken: string;
  user: User;
}

// API错误接口
export interface ApiError {
  message: string;
  error: string;
  statusCode: number;
}

// HTTP请求工具
class HttpClient {
  private baseURL: string;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private processQueue(error: ApiError | null, token: string | null = null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });
    
    this.failedQueue = [];
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    // 获取存储的token
    let token = localStorage.getItem('agro_access_token');
    
    // 检查token是否即将过期（提前5分钟刷新）
    if (token && this.isTokenExpiringSoon(token)) {
      if (!this.isRefreshing) {
        this.isRefreshing = true;
        
        try {
          // 这里应该实现token刷新逻辑
          // 由于当前后端API没有提供refresh token，我们先跳过自动刷新
          console.warn('Token is expiring soon, but refresh not implemented');
        } catch (error) {
          console.error('Token refresh failed:', error);
          // 刷新失败，清除token
          this.clearTokens();
          token = null;
        } finally {
          this.isRefreshing = false;
        }
      } else {
        // 如果正在刷新，等待刷新完成
        return new Promise((resolve, reject) => {
          this.failedQueue.push({ resolve, reject });
        });
      }
    }
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        // 处理HTTP错误
        const errorData: ApiError = await response.json().catch(() => ({
          message: '网络请求失败',
          error: 'Network Error',
          statusCode: response.status,
        }));

        // 处理401错误（未授权）
        if (response.status === 401) {
          this.clearTokens();
          
          // 如果是获取用户信息接口失败，不要重复处理
          if (!endpoint.includes('/me')) {
            // 可以在这里触发重新登录逻辑
            window.dispatchEvent(new CustomEvent('auth:unauthorized'));
          }
        }
        
        throw errorData;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof TypeError) {
        // 网络错误
        throw {
          message: '网络连接失败，请检查网络连接',
          error: 'Network Error',
          statusCode: 0,
        } as ApiError;
      }
      throw error;
    }
  }

  private isTokenExpiringSoon(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return false;

      const payload = JSON.parse(atob(parts[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      const expirationTime = payload.exp;
      
      // 如果token在5分钟内过期，返回true
      return (expirationTime - currentTime) < 300;
    } catch {
      return false;
    }
  }

  private clearTokens(): void {
    localStorage.removeItem('agro_access_token');
    localStorage.removeItem('agro_user');
    localStorage.removeItem('agro_user_type');
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// 创建HTTP客户端实例
const httpClient = new HttpClient(API_BASE_URL);

// 认证服务类
export class AuthService {
  /**
   * 用户注册
   */
  static async register(data: RegisterRequest): Promise<RegisterResponseData> {
    const response = await httpClient.post<ApiResponse<RegisterResponseData>>(
      `${API_PREFIX}/register`,
      data
    );
    return response.data!;
  }

  /**
   * 用户登录
   */
  static async login(data: LoginRequest): Promise<LoginResponseData> {
    const response = await httpClient.post<ApiResponse<LoginResponseData>>(
      `${API_PREFIX}/login`,
      data
    );
    
    // 保存token到localStorage
    if (response.data?.accessToken) {
      localStorage.setItem('agro_access_token', response.data.accessToken);
    }
    
    return response.data!;
  }

  /**
   * 获取当前用户信息
   */
  static async getCurrentUser(): Promise<User> {
    const response = await httpClient.get<ApiResponse<User>>(
      `${API_PREFIX}/me`
    );
    return response.data!;
  }

  /**
   * 登出
   */
  static logout(): void {
    localStorage.removeItem('agro_access_token');
    localStorage.removeItem('agro_user');
    localStorage.removeItem('agro_user_type');
  }

  /**
   * 检查是否有有效token
   */
  static hasValidToken(): boolean {
    const token = localStorage.getItem('agro_access_token');
    if (!token) return false;

    try {
      // 简单检查token格式（JWT应该有3部分）
      const parts = token.split('.');
      if (parts.length !== 3) return false;

      // 解码payload检查过期时间
      const payload = JSON.parse(atob(parts[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      return payload.exp > currentTime;
    } catch {
      return false;
    }
  }

  /**
   * 获取token信息
   */
  static getTokenInfo(): any | null {
    const token = localStorage.getItem('agro_access_token');
    if (!token) return null;

    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      return JSON.parse(atob(parts[1]));
    } catch {
      return null;
    }
  }
}

export default AuthService;