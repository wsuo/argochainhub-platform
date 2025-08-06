// 询价管理服务
import {
  InquiryListResponse,
  InquiryDetailResponse,
  InquiryMessageListResponse,
  SendMessageRequest,
  SendMessageResponse,
  InquiryQueryParams,
  MessageQueryParams,
  CreateInquiryRequest,
  ApiResponse,
} from '@/types/inquiry';
import { inquiryHttpClient } from './httpClient';
import { BusinessErrorContext } from '@/types/error';

// API路径前缀
const API_PREFIX = '/api/v1';

// 询价服务类
export class InquiryService {
  /**
   * 创建询价
   */
  static async createInquiry(data: CreateInquiryRequest): Promise<ApiResponse<{ id: string; inquiryNo: string }>> {
    const businessContext: BusinessErrorContext = {
      module: 'inquiry',
      action: 'create',
      resourceType: 'inquiry'
    };

    console.log('Creating inquiry with data:', data);

    return inquiryHttpClient.post<ApiResponse<{ id: string; inquiryNo: string }>>(
      `${API_PREFIX}/inquiries`,
      data,
      businessContext
    );
  }

  /**
   * 获取我的询价列表
   * 采购商看到自己发起的询价，供应商看到收到的询价
   */
  static async getInquiries(params: InquiryQueryParams = {}): Promise<InquiryListResponse> {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.status) searchParams.append('status', params.status);

    const queryString = searchParams.toString();
    const endpoint = `${API_PREFIX}/inquiries${queryString ? `?${queryString}` : ''}`;
    
    const businessContext: BusinessErrorContext = {
      module: 'inquiry',
      action: 'read',
      resourceType: 'list'
    };
    
    return inquiryHttpClient.get<InquiryListResponse>(endpoint, businessContext);
  }

  /**
   * 获取询价详情（包含消息记录）
   */
  static async getInquiryDetail(inquiryId: string): Promise<InquiryDetailResponse> {
    const businessContext: BusinessErrorContext = {
      module: 'inquiry',
      action: 'read',
      resourceType: 'detail',
      resourceId: inquiryId
    };

    return inquiryHttpClient.get<InquiryDetailResponse>(
      `${API_PREFIX}/inquiries/${inquiryId}`,
      businessContext
    );
  }

  /**
   * 发送询价消息
   */
  static async sendMessage(
    inquiryId: string, 
    messageData: SendMessageRequest
  ): Promise<SendMessageResponse> {
    const businessContext: BusinessErrorContext = {
      module: 'inquiry',
      action: 'create',
      resourceType: 'message',
      resourceId: inquiryId
    };

    return inquiryHttpClient.post<SendMessageResponse>(
      `${API_PREFIX}/inquiries/${inquiryId}/messages`,
      messageData,
      businessContext
    );
  }

  /**
   * 获取询价消息历史
   */
  static async getInquiryMessages(
    inquiryId: string, 
    params: MessageQueryParams = {}
  ): Promise<InquiryMessageListResponse> {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.desc !== undefined) searchParams.append('desc', params.desc.toString());

    const queryString = searchParams.toString();
    const endpoint = `${API_PREFIX}/inquiries/${inquiryId}/messages${queryString ? `?${queryString}` : ''}`;
    
    const businessContext: BusinessErrorContext = {
      module: 'inquiry',
      action: 'read',
      resourceType: 'messages',
      resourceId: inquiryId
    };
    
    return inquiryHttpClient.get<InquiryMessageListResponse>(endpoint, businessContext);
  }

  /**
   * 获取询价状态颜色（用于UI显示）
   */
  static getStatusColor(status: string): string {
    const colorMap: Record<string, string> = {
      'pending_quote': 'orange',
      'quoted': 'blue',
      'confirmed': 'green',
      'declined': 'red',
      'expired': 'gray',
      'cancelled': 'gray',
    };
    
    return colorMap[status] || 'gray';
  }

  /**
   * 格式化价格显示
   */
  static formatPrice(price?: number): string {
    if (!price) return '-';
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  }

  /**
   * 格式化日期显示
   */
  static formatDate(dateString: string): string {
    try {
      return new Date(dateString).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  }

  /**
   * 格式化日期时间显示
   */
  static formatDateTime(dateString: string): string {
    try {
      return new Date(dateString).toLocaleString('zh-CN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  }

  /**
   * 检查询价是否过期
   */
  static isInquiryExpired(deadline: string): boolean {
    try {
      return new Date(deadline) < new Date();
    } catch {
      return false;
    }
  }

  /**
   * 获取询价剩余时间显示
   */
  static getTimeRemaining(deadline: string): string {
    try {
      const now = new Date();
      const deadlineDate = new Date(deadline);
      const diff = deadlineDate.getTime() - now.getTime();
      
      if (diff <= 0) return '已过期';
      
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      if (days === 1) return '1天内';
      if (days <= 7) return `${days}天内`;
      if (days <= 30) return `${Math.ceil(days / 7)}周内`;
      
      return this.formatDate(deadline);
    } catch {
      return deadline;
    }
  }
}

export default InquiryService;