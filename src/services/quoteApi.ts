// 供应商报价管理API服务
import { inquiryHttpClient } from './httpClient';
import type {
  Quote,
  QuoteFilters,
  QuoteListResponse,
  QuoteDetailResponse,
  QuoteStats,
  QuoteStatsResponse,
  QuoteQueryParams,
  BatchUpdateRequest,
  BatchUpdateResponse,
  QuoteHistoryResponse,
  InquiryMessageListResponse,
  SendMessageRequest,
  SendMessageResponse,
  MessageQueryParams
} from '@/types/quote';
import { BusinessErrorContext } from '@/types/error';

class QuoteApiService {
  /**
   * 获取供应商的报价列表
   */
  async getQuotes(
    filters: QuoteFilters = {},
    page: number = 1,
    limit: number = 10
  ): Promise<QuoteListResponse> {
    const params = new URLSearchParams();
    
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    if (filters.status) params.append('status', filters.status);
    if (filters.keyword) params.append('keyword', filters.keyword);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const businessContext: BusinessErrorContext = {
      module: 'quote',
      action: 'read',
      resourceType: 'list',
      errorCodeMapping: {
        404: 'quote.error.noQuotes',
        403: 'quote.error.accessDenied',
      }
    };

    const queryString = params.toString();
    const endpoint = `/api/v1/inquiries/supplier/quotes${queryString ? `?${queryString}` : ''}`;
    
    return inquiryHttpClient.get<QuoteListResponse>(endpoint, businessContext);
  }

  /**
   * 获取单个报价详情
   */
  async getQuote(id: string): Promise<Quote> {
    const businessContext: BusinessErrorContext = {
      module: 'quote',
      action: 'read',
      resourceType: 'detail',
      resourceId: id,
      errorCodeMapping: {
        404: 'quote.error.notFound',
        403: 'quote.error.accessDenied',
      }
    };

    // 由于API返回的是列表，我们需要先获取列表，然后找到对应的报价
    const listResponse = await this.getQuotes({ search: id }, 1, 100);
    const quote = listResponse.data.find(q => q.id === id);
    
    if (!quote) {
      throw new Error('Quote not found');
    }

    return quote;
  }

  /**
   * 获取供应商报价统计
   */
  async getQuoteStats(): Promise<QuoteStats> {
    const businessContext: BusinessErrorContext = {
      module: 'quote',
      action: 'read',
      resourceType: 'stats',
      errorCodeMapping: {
        403: 'quote.error.accessDenied',
      }
    };

    const response = await inquiryHttpClient.get<QuoteStatsResponse>(
      '/api/v1/inquiries/supplier/quotes/stats', 
      businessContext
    );
    
    return response.data;
  }

  /**
   * 批量操作报价
   */
  async batchUpdateQuotes(request: BatchUpdateRequest): Promise<BatchUpdateResponse> {
    const businessContext: BusinessErrorContext = {
      module: 'quote',
      action: 'update',
      resourceType: 'batch',
      errorCodeMapping: {
        400: 'quote.error.invalidRequest',
        403: 'quote.error.accessDenied',
      }
    };

    return inquiryHttpClient.post<BatchUpdateResponse>(
      '/api/v1/inquiries/supplier/quotes/batch-update',
      request,
      businessContext
    );
  }

  /**
   * 获取询价单报价历史
   */
  async getQuoteHistory(id: string): Promise<QuoteHistoryResponse> {
    const businessContext: BusinessErrorContext = {
      module: 'quote',
      action: 'read',
      resourceType: 'history',
      resourceId: id,
      errorCodeMapping: {
        404: 'quote.error.notFound',
        403: 'quote.error.accessDenied',
      }
    };

    return inquiryHttpClient.get<QuoteHistoryResponse>(
      `/api/v1/inquiries/supplier/quotes/${id}/history`,
      businessContext
    );
  }

  /**
   * 发送询价消息
   */
  async sendMessage(
    inquiryId: string,
    request: SendMessageRequest
  ): Promise<SendMessageResponse> {
    const businessContext: BusinessErrorContext = {
      module: 'quote',
      action: 'create',
      resourceType: 'message',
      resourceId: inquiryId,
      errorCodeMapping: {
        400: 'quote.error.messageEmpty',
        404: 'quote.error.inquiryNotFound',
        403: 'quote.error.accessDenied',
      }
    };

    return inquiryHttpClient.post<SendMessageResponse>(
      `/api/v1/inquiries/${inquiryId}/messages`,
      request,
      businessContext
    );
  }

  /**
   * 获取询价消息历史
   */
  async getMessages(
    inquiryId: string,
    params: MessageQueryParams = {}
  ): Promise<InquiryMessageListResponse> {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.desc !== undefined) searchParams.append('desc', params.desc.toString());

    const businessContext: BusinessErrorContext = {
      module: 'quote',
      action: 'read',
      resourceType: 'messages',
      resourceId: inquiryId,
      errorCodeMapping: {
        404: 'quote.error.inquiryNotFound',
        403: 'quote.error.accessDenied',
      }
    };

    const queryString = searchParams.toString();
    const endpoint = `/api/v1/inquiries/${inquiryId}/messages${queryString ? `?${queryString}` : ''}`;
    
    return inquiryHttpClient.get<InquiryMessageListResponse>(endpoint, businessContext);
  }

  /**
   * 拒绝报价
   */
  async declineQuote(
    inquiryIds: number[],
    reason: string
  ): Promise<BatchUpdateResponse> {
    return this.batchUpdateQuotes({
      inquiryIds,
      action: 'decline',
      reason
    });
  }

  /**
   * 更新报价优先级
   */
  async updatePriority(
    inquiryIds: number[],
    priority: 'low' | 'normal' | 'high' | 'urgent'
  ): Promise<BatchUpdateResponse> {
    return this.batchUpdateQuotes({
      inquiryIds,
      action: 'update_priority',
      priority
    });
  }

  /**
   * 检查报价是否可以编辑
   */
  isQuoteEditable(quote: Quote): boolean {
    return ['pending_quote', 'quoted'].includes(quote.status);
  }

  /**
   * 检查报价是否已过期
   */
  isQuoteExpired(quote: Quote): boolean {
    const deadline = new Date(quote.deadline);
    const now = new Date();
    return deadline < now;
  }

  /**
   * 格式化报价状态显示文本
   */
  getStatusDisplayText(status: string): string {
    const statusMap: Record<string, string> = {
      'pending_quote': '待报价',
      'quoted': '已报价',
      'confirmed': '已确认',
      'declined': '已拒绝',
      'expired': '已过期',
      'cancelled': '已取消'
    };
    return statusMap[status] || status;
  }

  /**
   * 获取优先级显示文本
   */
  getPriorityDisplayText(priority?: string): string {
    const priorityMap: Record<string, string> = {
      'low': '低优先级',
      'normal': '普通',
      'high': '高优先级',
      'urgent': '紧急'
    };
    return priorityMap[priority || 'normal'] || '普通';
  }
}

// 创建并导出API服务实例
export const quoteApi = new QuoteApiService();

// 导出服务类以便测试
export { QuoteApiService };