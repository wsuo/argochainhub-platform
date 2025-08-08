import { httpClient } from './httpClient';

// 发送消息请求接口
export interface SendMessageRequest {
  message: string; // 消息内容，最大2000字符
}

// 发送消息响应接口
export interface SendMessageResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    relatedService: 'inquiry';
    relatedId: number;
    message: string;
    senderId: number;
    createdAt: string;
    sender: {
      id: number;
      name: string;
      email: string;
      company: {
        id: number;
        name: { [key: string]: string };
        type: 'buyer' | 'supplier';
      };
    };
  };
}

// 获取消息历史请求参数
export interface GetMessagesParams {
  page?: number;     // 页码，默认1
  limit?: number;    // 每页条数，默认20
  desc?: boolean;    // 是否倒序，默认true
}

// 消息项接口
export interface MessageItem {
  id: number;
  relatedService: 'inquiry';
  relatedId: number;
  message: string;
  senderId: number;
  createdAt: string;
  sender: {
    id: number;
    name: string;
    email: string;
    company: {
      id: number;
      name: { [key: string]: string };
      type: 'buyer' | 'supplier';
    };
  };
}

// 获取消息历史响应接口
export interface GetMessagesResponse {
  success: boolean;
  message: string;
  data: MessageItem[];
  meta: {
    totalItems: number;
    currentPage: number;
    totalPages: number;
    itemsPerPage: number;
  };
}

export class MessageService {
  /**
   * 发送询价消息
   */
  static async sendInquiryMessage(
    inquiryId: string | number,
    message: string
  ): Promise<SendMessageResponse> {
    try {
      const response = await httpClient.post<SendMessageResponse>(
        `/api/v1/inquiries/${inquiryId}/messages`,
        { message }
      );

      console.log('消息发送成功:', response.data);
      return response;
    } catch (error) {
      console.error('发送消息失败:', error);
      throw error;
    }
  }

  /**
   * 获取询价消息历史
   */
  static async getInquiryMessages(
    inquiryId: string | number,
    params?: GetMessagesParams
  ): Promise<GetMessagesResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.page) {
        queryParams.append('page', params.page.toString());
      }
      if (params?.limit) {
        queryParams.append('limit', params.limit.toString());
      }
      if (params?.desc !== undefined) {
        queryParams.append('desc', params.desc.toString());
      }

      const url = `/api/v1/inquiries/${inquiryId}/messages${
        queryParams.toString() ? `?${queryParams.toString()}` : ''
      }`;

      const response = await httpClient.get<GetMessagesResponse>(url);
      
      console.log('消息历史获取成功:', response.data);
      return response;
    } catch (error) {
      console.error('获取消息历史失败:', error);
      throw error;
    }
  }

  /**
   * 验证消息内容
   */
  static validateMessage(message: string): { valid: boolean; error?: string } {
    if (!message || message.trim().length === 0) {
      return { valid: false, error: '消息内容不能为空' };
    }

    if (message.length > 2000) {
      return { valid: false, error: '消息内容不能超过2000个字符' };
    }

    return { valid: true };
  }

  /**
   * 格式化消息时间
   */
  static formatMessageTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) {
      return '刚刚';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}分钟前`;
    } else if (diffInMinutes < 24 * 60) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}小时前`;
    } else {
      // 超过24小时显示具体日期
      return date.toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }
}