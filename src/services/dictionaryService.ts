// 字典服务
export interface DictionaryItem {
  key: string;
  value: string;
  label: string;
  sort_order?: number;
  parent_key?: string;
  is_active?: boolean;
}

export interface DictionaryResponse {
  success: boolean;
  message: string;
  data: DictionaryItem[];
}

const API_BASE_URL = 'http://localhost:3050/api/v1';

class DictionaryService {
  private getAuthToken(): string {
    // 使用与AuthService一致的token存储键
    const token = localStorage.getItem('agro_access_token');
    if (!token) {
      throw new Error('未找到认证token，请先登录');
    }
    return token;
  }

  private async makeRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
    const token = this.getAuthToken();
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
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
      const response = await this.makeRequest<DictionaryResponse>(url);
      
      // 按排序字段排序，如果没有则按key排序
      return response.data.sort((a, b) => {
        if (a.sort_order !== undefined && b.sort_order !== undefined) {
          return a.sort_order - b.sort_order;
        }
        return a.key.localeCompare(b.key);
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
   * 根据key获取字典项的显示标签
   */
  getDictionaryLabel(items: DictionaryItem[], key: string): string {
    const item = items.find(item => item.key === key || item.value === key);
    return item?.label || key;
  }
}

export const dictionaryService = new DictionaryService();