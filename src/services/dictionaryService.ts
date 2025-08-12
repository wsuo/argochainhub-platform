// 字典服务
import { httpClient } from './httpClient';

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

// API路径前缀
const API_PREFIX = '/api/v1';

class DictionaryService {
  /**
   * 获取字典数据
   * @param dictType 字典类型，如 'product_category'
   */
  async getDictionary(dictType: string): Promise<DictionaryItem[]> {
    try {
      const url = `${API_PREFIX}/dictionaries/${dictType}`;
      const response = await httpClient.get<DictionaryResponse>(url, {
        module: 'dictionary',
        action: 'read',
        resourceType: dictType,
      });
      
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

  /**
   * 获取通知类型字典
   * 从后端字典接口动态获取所有可用的通知类型
   */
  async getNotificationTypes(): Promise<DictionaryItem[]> {
    try {
      const url = `${API_PREFIX}/admin/dictionaries/notification_type/items`;
      const response = await httpClient.get<DictionaryResponse>(url, {
        module: 'dictionary',
        action: 'read',
        resourceType: 'notification_type',
      });
      
      // 转换后端数据格式为前端需要的格式
      const transformedData = response.data.map(item => ({
        ...item,
        key: item.code,
        value: item.code,
        label: item.name['zh-CN'] || item.name.en || item.code
      }));
      
      // 按排序字段排序
      return transformedData.sort((a, b) => {
        if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
          return a.sortOrder - b.sortOrder;
        }
        return a.code.localeCompare(b.code);
      });
    } catch (error) {
      console.warn('Failed to fetch notification types:', error);
      // 返回空数组作为回退
      return [];
    }
  }

  /**
   * 根据当前语言获取字典项的本地化名称
   */
  getLocalizedName(item: DictionaryItem, language: 'zh-CN' | 'en' | 'es' = 'zh-CN'): string {
    return item.name[language] || item.name['zh-CN'] || item.code;
  }

  /**
   * 获取通知状态字典
   */
  async getNotificationStatuses(): Promise<DictionaryItem[]> {
    try {
      const url = `${API_PREFIX}/admin/dictionaries/admin_notification_status/items`;
      const response = await httpClient.get<DictionaryResponse>(url, {
        module: 'dictionary',
        action: 'read',
        resourceType: 'admin_notification_status',
      });
      
      const transformedData = response.data.map(item => ({
        ...item,
        key: item.code,
        value: item.code,
        label: item.name['zh-CN'] || item.name.en || item.code
      }));
      
      return transformedData.sort((a, b) => {
        if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
          return a.sortOrder - b.sortOrder;
        }
        return a.code.localeCompare(b.code);
      });
    } catch (error) {
      console.warn('Failed to fetch notification statuses:', error);
      return [];
    }
  }

  /**
   * 获取样品申请状态字典
   */
  async getSampleRequestStatuses(): Promise<DictionaryItem[]> {
    return this.getDictionary('sample_request_status');
  }

  /**
   * 获取运输方式字典
   */
  async getShippingMethods(): Promise<DictionaryItem[]> {
    return this.getDictionary('shipping_method');
  }

  /**
   * 获取登记状态字典
   */
  async getRegistrationStatuses(): Promise<DictionaryItem[]> {
    return this.getDictionary('registration_request_status');
  }

  /**
   * 获取国家字典
   */
  async getCountries(): Promise<DictionaryItem[]> {
    return this.getDictionary('countries');
  }

  /**
   * 获取文档类型字典
   */
  async getDocumentTypes(): Promise<DictionaryItem[]> {
    return this.getDictionary('registration_document_type');
  }

  /**
   * 获取货币字典
   */
  async getCurrencies(): Promise<DictionaryItem[]> {
    return this.getDictionary('currencies');
  }
}

export const dictionaryService = new DictionaryService();