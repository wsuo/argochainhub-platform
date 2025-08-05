/**
 * 对话历史记录API服务
 * 与后端AI对话历史记录系统API交互
 */

// API配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3050';
const API_PREFIX = '/api/v1';

// 数据类型定义
export interface ConversationSummary {
  id: number;
  conversationId: string;
  guestId: string;
  userType: 'guest' | 'user' | 'admin';
  title: string;
  userQuery: string;
  finalAnswer: string;
  totalMessages: number;
  totalTokens: number;
  totalCost: number;
  duration: number;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationMessage {
  id: number;
  messageId: string;
  conversationId: string;
  messageType: 'user_query' | 'ai_response';
  content: string;
  createdAt: string;
}

export interface ConversationUsage {
  id: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  totalPrice: number;
  currency: string;
  latency: number;
}

export interface ConversationDetail extends ConversationSummary {
  messages: ConversationMessage[];
  usageStatistics: ConversationUsage[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    totalItems: number;
    itemCount: number;
    currentPage: number;
    totalPages: number;
    itemsPerPage: number;
  };
}

export interface StoreConversationRequest {
  conversationId: string;
  guestId: string;
  userQuery: string;
  userInputs?: Record<string, unknown>;
  user: string;
  finalAnswer?: string;
  usageStats?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    totalPrice: string;
    currency: string;
    latency: number;
  };
  workflowData?: unknown;
  streamMessages?: Array<{
    event: string;
    data: unknown;
    timestamp: number;
  }>;
  duration: number;
}

export interface ConversationListParams {
  page?: number;
  limit?: number;
}

/**
 * 对话历史记录API服务类
 */
export class ConversationService {
  /**
   * 存储完整对话记录
   */
  static async storeConversation(data: StoreConversationRequest): Promise<ApiResponse<{ conversationId: string; processed: boolean }>> {
    const response = await fetch(`${API_BASE_URL}${API_PREFIX}/ai/conversations/store-complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * 获取访客对话列表
   */
  static async getGuestConversations(
    guestId: string,
    params: ConversationListParams = {}
  ): Promise<ApiResponse<ConversationSummary[]>> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());

    const url = `${API_BASE_URL}${API_PREFIX}/ai/conversations/guest/${guestId}?${searchParams}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * 获取对话详情
   */
  static async getConversationDetail(
    conversationId: string,
    guestId: string
  ): Promise<ApiResponse<ConversationDetail>> {
    const url = `${API_BASE_URL}${API_PREFIX}/ai/conversations/${conversationId}?guest_id=${guestId}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * 删除对话记录
   */
  static async deleteConversation(
    conversationId: string,
    guestId: string
  ): Promise<ApiResponse<void>> {
    const url = `${API_BASE_URL}${API_PREFIX}/ai/conversations/${conversationId}?guest_id=${guestId}`;
    const response = await fetch(url, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
}

export default ConversationService;