import { EnhancedHttpClient } from './httpClient';
import { BusinessErrorContext } from '@/types/error';
import { 
  NotificationItem,
  NotificationListResponse,
  UnreadCountResponse,
  SingleNotificationResponse,
  NotificationResponse,
  NotificationQueryParams,
  UpdateNotificationRequest,
  NotificationStatus 
} from '@/types/notification';

// 基础配置
const API_PREFIX = '/api/v1/notifications';

// 通知服务专用HTTP客户端
export const notificationHttpClient = new EnhancedHttpClient('http://localhost:3050')
  .setTimeout(15000); // 通知模块超时15秒

export class NotificationService {
  /**
   * 获取通知列表
   */
  static async getNotifications(params: NotificationQueryParams = {}): Promise<NotificationListResponse> {
    const businessContext: BusinessErrorContext = {
      module: 'notification',
      action: 'read',
      resourceType: 'list'
    };

    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.status) searchParams.append('status', params.status);
    if (params.type) searchParams.append('type', params.type);

    const queryString = searchParams.toString();
    const endpoint = `${API_PREFIX}${queryString ? `?${queryString}` : ''}`;

    console.log('Fetching notifications from:', endpoint);

    return notificationHttpClient.get<NotificationListResponse>(endpoint, businessContext);
  }

  /**
   * 获取未读通知数量
   */
  static async getUnreadCount(): Promise<UnreadCountResponse> {
    const businessContext: BusinessErrorContext = {
      module: 'notification',
      action: 'read', 
      resourceType: 'count'
    };

    return notificationHttpClient.get<UnreadCountResponse>(
      `${API_PREFIX}/unread-count`,
      businessContext
    );
  }

  /**
   * 标记通知为已读
   */
  static async markAsRead(notificationId: string): Promise<SingleNotificationResponse> {
    const businessContext: BusinessErrorContext = {
      module: 'notification',
      action: 'update',
      resourceType: 'status',
      resourceId: notificationId
    };

    return notificationHttpClient.patch<SingleNotificationResponse>(
      `${API_PREFIX}/${notificationId}/read`,
      {},
      businessContext
    );
  }

  /**
   * 标记所有通知为已读
   */
  static async markAllAsRead(): Promise<NotificationResponse> {
    const businessContext: BusinessErrorContext = {
      module: 'notification',
      action: 'update',
      resourceType: 'bulk-read'
    };

    return notificationHttpClient.patch<NotificationResponse>(
      `${API_PREFIX}/read-all`,
      {},
      businessContext
    );
  }

  /**
   * 更新通知状态
   */
  static async updateNotification(
    notificationId: string, 
    updateData: UpdateNotificationRequest
  ): Promise<SingleNotificationResponse> {
    const businessContext: BusinessErrorContext = {
      module: 'notification',
      action: 'update',
      resourceType: 'notification',
      resourceId: notificationId
    };

    return notificationHttpClient.patch<SingleNotificationResponse>(
      `${API_PREFIX}/${notificationId}`,
      updateData,
      businessContext
    );
  }

  /**
   * 删除通知
   */
  static async deleteNotification(notificationId: string): Promise<NotificationResponse> {
    const businessContext: BusinessErrorContext = {
      module: 'notification',
      action: 'delete',
      resourceType: 'notification',
      resourceId: notificationId
    };

    return notificationHttpClient.delete<NotificationResponse>(
      `${API_PREFIX}/${notificationId}`,
      businessContext
    );
  }

  /**
   * 获取通知详情
   */
  static async getNotificationDetail(notificationId: string): Promise<SingleNotificationResponse> {
    const businessContext: BusinessErrorContext = {
      module: 'notification',
      action: 'read',
      resourceType: 'detail',
      resourceId: notificationId
    };

    return notificationHttpClient.get<SingleNotificationResponse>(
      `${API_PREFIX}/${notificationId}`,
      businessContext
    );
  }

  /**
   * 格式化通知时间显示
   */
  static formatNotificationTime(createdAt: string): string {
    try {
      const now = new Date();
      const notificationTime = new Date(createdAt);
      const diffInSeconds = Math.floor((now.getTime() - notificationTime.getTime()) / 1000);

      if (diffInSeconds < 60) {
        return '刚刚';
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes}分钟前`;
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours}小时前`;
      } else if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days}天前`;
      } else {
        return notificationTime.toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
    } catch {
      return createdAt;
    }
  }

  /**
   * 获取通知优先级
   */
  static getNotificationPriority(notification: NotificationItem): 'high' | 'medium' | 'low' {
    // 企业认证相关通知优先级最高
    if (notification.type.includes('COMPANY_')) {
      return 'high';
    }
    
    // 询价相关通知优先级中等
    if (notification.type.includes('INQUIRY_')) {
      return 'medium';
    }
    
    // 其他通知优先级较低
    return 'low';
  }

  /**
   * 检查通知是否需要特殊处理
   */
  static requiresSpecialHandling(notification: NotificationItem): boolean {
    return notification.data?.requiresTokenRefresh === true;
  }

  /**
   * 获取通知跳转链接
   */
  static getNotificationActionUrl(notification: NotificationItem): string | null {
    if (notification.data?.actionUrl) {
      return notification.data.actionUrl;
    }

    // 根据通知类型生成默认跳转链接
    switch (notification.type) {
      case 'COMPANY_APPROVED':
      case 'COMPANY_REJECTED':
        return '/company/profile';
      case 'INQUIRY_NEW':
      case 'INQUIRY_QUOTED':
      case 'INQUIRY_CONFIRMED':
      case 'INQUIRY_DECLINED':
        return notification.data?.relatedId ? `/inquiries/${notification.data.relatedId}` : '/inquiries';
      case 'PRODUCT_APPROVED':
      case 'PRODUCT_REJECTED':
        return notification.data?.relatedId ? `/products/${notification.data.relatedId}` : '/products';
      default:
        return null;
    }
  }

  /**
   * 批量标记通知为已读
   */
  static async batchMarkAsRead(notificationIds: string[]): Promise<NotificationResponse> {
    const businessContext: BusinessErrorContext = {
      module: 'notification',
      action: 'update',
      resourceType: 'batch-read'
    };

    return notificationHttpClient.patch<NotificationResponse>(
      `${API_PREFIX}/batch-read`,
      { notificationIds },
      businessContext
    );
  }

  /**
   * 获取通知统计信息
   */
  static async getNotificationStats(): Promise<NotificationResponse<{
    totalCount: number;
    unreadCount: number;
    readCount: number;
    typeStats: Record<string, number>;
  }>> {
    const businessContext: BusinessErrorContext = {
      module: 'notification',
      action: 'read',
      resourceType: 'stats'
    };

    return notificationHttpClient.get<NotificationResponse<{
      totalCount: number;
      unreadCount: number; 
      readCount: number;
      typeStats: Record<string, number>;
    }>>(
      `${API_PREFIX}/stats`,
      businessContext
    );
  }
}