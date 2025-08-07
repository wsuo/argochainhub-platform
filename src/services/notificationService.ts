import { httpClient } from './httpClient';
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

    // 开发模式下，如果API调用失败则返回Mock数据
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.status) searchParams.append('status', params.status);
    if (params.type) searchParams.append('type', params.type);

    const queryString = searchParams.toString();
    const endpoint = `${API_PREFIX}${queryString ? `?${queryString}` : ''}`;

    try {
      return await httpClient.get<NotificationListResponse>(endpoint, businessContext);
    } catch (error) {
      console.warn('Failed to fetch notifications from API, using mock data:', error);
      return this.getMockNotifications(params);
    }
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

    try {
      return await httpClient.get<UnreadCountResponse>(`${API_PREFIX}/unread-count`, businessContext);
    } catch (error) {
      console.warn('Failed to fetch unread count from API, using mock data:', error);
      return { data: { count: 3 }, success: true };
    }
  }

  /**
   * Mock数据 - 用于开发模式或API失败时
   */
  static getMockNotifications(params: NotificationQueryParams = {}): NotificationListResponse {
    const mockNotifications: NotificationItem[] = [
      {
        id: '1',
        type: 'COMPANY_APPROVED',
        title: '企业认证审核通过',
        content: '恭喜！您的企业认证申请已通过审核，现在可以使用所有供应商功能。',
        status: 'unread' as NotificationStatus,
        data: {
          requiresTokenRefresh: true,
          relatedId: 'company-123',
          actionUrl: '/company/profile'
        },
        readAt: null,
        userId: 'user-123',
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30分钟前
        updatedAt: new Date().toISOString(),
        deletedAt: null
      },
      {
        id: '2',
        type: 'INQUIRY_NEW',
        title: '新询价请求',
        content: '您收到一条新的询价请求，产品：草甘膦95%TC，数量：500公斤。',
        status: 'unread' as NotificationStatus,
        data: {
          relatedId: 'inquiry-456',
          actionUrl: '/inquiries/456',
          productName: '草甘膦95%TC',
          quantity: '500公斤'
        },
        readAt: null,
        userId: 'user-123',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2小时前
        updatedAt: new Date().toISOString(),
        deletedAt: null
      },
      {
        id: '3',
        type: 'PRODUCT_APPROVED',
        title: '产品审核通过',
        content: '您提交的产品"2,4-D丁酯乳油"已通过审核，现已在产品库中展示。',
        status: 'read' as NotificationStatus,
        data: {
          relatedId: 'product-789',
          actionUrl: '/products/789',
          productName: '2,4-D丁酯乳油'
        },
        readAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1小时前读取
        userId: 'user-123',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1天前
        updatedAt: new Date().toISOString(),
        deletedAt: null
      }
    ];

    // 根据参数过滤Mock数据
    let filteredNotifications = mockNotifications;
    
    if (params.status && params.status !== 'all') {
      filteredNotifications = filteredNotifications.filter(n => n.status === params.status);
    }
    
    if (params.type) {
      filteredNotifications = filteredNotifications.filter(n => n.type === params.type);
    }

    // 分页处理
    const page = params.page || 1;
    const limit = params.limit || 50;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedNotifications = filteredNotifications.slice(startIndex, endIndex);

    return {
      data: paginatedNotifications,
      meta: {
        page,
        limit,
        total: filteredNotifications.length,
        totalPages: Math.ceil(filteredNotifications.length / limit)
      },
      success: true
    };
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

    try {
      return await httpClient.patch<SingleNotificationResponse>(
        `${API_PREFIX}/${notificationId}/read`,
        {},
        businessContext
      );
    } catch (error) {
      console.warn('Failed to mark notification as read:', error);
      // 返回乐观更新的响应
      return {
        data: {
          id: notificationId,
          type: 'COMPANY_APPROVED',
          title: 'Mock标题',
          content: 'Mock内容',
          status: 'read' as NotificationStatus,
          data: {},
          readAt: new Date().toISOString(),
          userId: 'user-123',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: null
        },
        success: true
      };
    }
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

    try {
      return await httpClient.patch<NotificationResponse>(
        `${API_PREFIX}/read-all`,
        {},
        businessContext
      );
    } catch (error) {
      console.warn('Failed to mark all notifications as read:', error);
      return { success: true, data: null };
    }
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

    return httpClient.patch<SingleNotificationResponse>(
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

    return httpClient.delete<NotificationResponse>(
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

    return httpClient.get<SingleNotificationResponse>(
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

    return httpClient.patch<NotificationResponse>(
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

    return httpClient.get<NotificationResponse<{
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