// 字典服务
export interface DictionaryItem {
  id: string;
  code: string;
  name: {
    'zh-CN': string;
    en: string;
    es: string;
  };
  description?: string;
  sortOrder: number;
  isActive: boolean;
  // 为了兼容现有代码，添加计算属性
  key: string;
  label: string;
  value: string;
}

export interface DictionaryResponse {
  success: boolean;
  message: string;
  data: DictionaryItem[];
}

const API_BASE_URL = 'http://localhost:3050/api/v1';

class DictionaryService {
  private getAuthToken(): string | null {
    // 使用与AuthService一致的token存储键
    const token = localStorage.getItem('agro_access_token');
    return token;
  }

  private async makeRequest<T>(url: string, options: RequestInit = {}, requireAuth: boolean = true): Promise<T> {
    const token = this.getAuthToken();
    
    // 如果需要认证但没有token，抛出错误
    if (requireAuth && !token) {
      throw new Error('未找到认证token，请先登录');
    }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>
    };

    // 只在有token时才添加Authorization header
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  /**
   * 获取字典数据
   * @param dictType 字典类型，如 'product_category'
   */
  async getDictionary(dictType: string): Promise<DictionaryItem[]> {
    try {
      const url = `${API_BASE_URL}/dictionaries/${dictType}`;
      const response = await this.makeRequest<DictionaryResponse>(url, {}, false); // 字典数据不需要认证
      
      // 转换后端数据格式为前端需要的格式
      const transformedData = response.data.map(item => ({
        ...item,
        key: item.code,
        value: item.code,
        label: item.name['zh-CN'] || item.name.en || item.code
      }));
      
      // 按排序字段排序，如果没有则按code排序
      return transformedData.sort((a, b) => {
        if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
          return a.sortOrder - b.sortOrder;
        }
        return a.code.localeCompare(b.code);
      });
    } catch (error) {
      console.warn(`Failed to fetch dictionary ${dictType}:`, error);
      
      // 返回空数组作为回退
      return [];
    }
  }

  /**
   * 获取产品分类字典
   */
  async getProductCategories(): Promise<DictionaryItem[]> {
    return this.getDictionary('product_category');
  }

  /**
   * 获取询价状态字典
   */
  async getInquiryStatuses(): Promise<DictionaryItem[]> {
    return this.getDictionary('inquiry_status');
  }

  /**
   * 根据key获取字典项的显示标签
   */
  getDictionaryLabel(items: DictionaryItem[], key: string): string {
    const item = items.find(item => item.key === key || item.value === key);
    return item?.label || key;
  }
}

export const dictionaryService = new DictionaryService();