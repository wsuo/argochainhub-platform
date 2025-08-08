// 通知系统类型定义

// 通知类型枚举
export enum NotificationType {
  COMPANY_APPROVED = 'COMPANY_APPROVED',         // 企业认证通过
  COMPANY_REJECTED = 'COMPANY_REJECTED',         // 企业认证拒绝
  INQUIRY_NEW = 'INQUIRY_NEW',                   // 新询价
  INQUIRY_QUOTED = 'INQUIRY_QUOTED',             // 询价已报价
  INQUIRY_CONFIRMED = 'INQUIRY_CONFIRMED',       // 询价已确认
  INQUIRY_DECLINED = 'INQUIRY_DECLINED',         // 询价已拒绝
  PRODUCT_APPROVED = 'PRODUCT_APPROVED',         // 产品审核通过
  PRODUCT_REJECTED = 'PRODUCT_REJECTED',         // 产品审核拒绝
  SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE',     // 系统维护
  SYSTEM_UPDATE = 'SYSTEM_UPDATE',               // 系统更新
}

// 通知状态枚举
export enum NotificationStatus {
  UNREAD = 'unread',     // 未读
  READ = 'read',         // 已读
}

// 通知数据接口
export interface NotificationData {
  relatedId?: string | number;
  relatedType?: string;
  actionUrl?: string;
  requiresTokenRefresh?: boolean;
  [key: string]: unknown;
}

// 通知基础接口
export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  content: string;
  status: NotificationStatus;
  data?: NotificationData;
  readAt?: string | null;
  userId: string | number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

// 分页元信息
export interface NotificationMeta {
  totalItems: number;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
}

// API响应接口
export interface NotificationResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

// 通知列表响应
export interface NotificationListResponse extends NotificationResponse<NotificationItem[]> {
  meta: NotificationMeta;
}

// 未读通知数量响应
export interface UnreadCountResponse extends NotificationResponse<{ count: number }> {}

// 单个通知响应
export interface SingleNotificationResponse extends NotificationResponse<NotificationItem> {}

// 通知查询参数
export interface NotificationQueryParams {
  page?: number;
  limit?: number;
  status?: NotificationStatus;
  type?: NotificationType;
}

// 更新通知状态请求
export interface UpdateNotificationRequest {
  status: NotificationStatus;
}

// WebSocket连接状态
export enum WebSocketStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting', 
  CONNECTED = 'connected',
  ERROR = 'error',
}

// WebSocket事件类型
export interface WebSocketEvents {
  // 客户端发送事件
  'ping': () => void;
  'join-room': (data: { userId: string }) => void;
  'leave-room': (data: { userId: string }) => void;
  
  // 服务端发送事件
  'pong': (timestamp: string) => void;
  'connection-confirmed': (data: { message: string }) => void;
  'notification': (notification: NotificationItem) => void;
  'unread-count-update': (data: { count: number }) => void;
  
  // 询价消息相关事件
  'inquiry_message_received': (data: InquiryMessageEvent) => void;
  'inquiry_status_updated': (data: InquiryStatusUpdateEvent) => void;
  
  // 连接事件
  'connect_error': (error: Error) => void;
  'disconnect': (reason: string) => void;
}

// 询价消息事件接口
export interface InquiryMessageEvent {
  inquiryId: number;           // 询价单ID
  messageId: number;           // 消息ID
  senderId: number;            // 发送者用户ID
  senderName: string;          // 发送者姓名
  senderCompany: string;       // 发送者企业名称
  senderCompanyType: string;   // 发送者企业类型 (buyer/supplier)
  message: string;             // 消息内容
  timestamp: string;           // 发送时间 (ISO格式)
  inquiryNo: string;          // 询价单编号
}

// 询价状态更新事件接口
export interface InquiryStatusUpdateEvent {
  inquiryId: number;           // 询价单ID
  inquiryNo: string;          // 询价单编号
  oldStatus: string;          // 旧状态
  newStatus: string;          // 新状态
  timestamp: string;          // 更新时间
  updatedBy: {                // 操作者信息
    userId: number;
    userName: string;
    companyName: string;
    companyType: string;
  };
}

// 通知处理器接口
export interface NotificationHandler {
  type: NotificationType;
  handler: (notification: NotificationItem) => Promise<void> | void;
}

// 通知上下文状态
export interface NotificationContextState {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  wsStatus: WebSocketStatus;
}

// 通知操作接口
export interface NotificationActions {
  fetchNotifications: (params?: NotificationQueryParams) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  connectWebSocket: () => void;
  disconnectWebSocket: () => void;
}

// 通知类型标签映射
export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, { 
  zh: string; 
  en: string; 
  es: string; 
}> = {
  [NotificationType.COMPANY_APPROVED]: {
    zh: '企业认证通过',
    en: 'Company Approved',
    es: 'Empresa Aprobada'
  },
  [NotificationType.COMPANY_REJECTED]: {
    zh: '企业认证拒绝',
    en: 'Company Rejected', 
    es: 'Empresa Rechazada'
  },
  [NotificationType.INQUIRY_NEW]: {
    zh: '新询价',
    en: 'New Inquiry',
    es: 'Nueva Consulta'
  },
  [NotificationType.INQUIRY_QUOTED]: {
    zh: '询价已报价',
    en: 'Inquiry Quoted',
    es: 'Consulta Cotizada'
  },
  [NotificationType.INQUIRY_CONFIRMED]: {
    zh: '询价已确认',
    en: 'Inquiry Confirmed',
    es: 'Consulta Confirmada'
  },
  [NotificationType.INQUIRY_DECLINED]: {
    zh: '询价已拒绝',
    en: 'Inquiry Declined',
    es: 'Consulta Rechazada'
  },
  [NotificationType.PRODUCT_APPROVED]: {
    zh: '产品审核通过',
    en: 'Product Approved',
    es: 'Producto Aprobado'
  },
  [NotificationType.PRODUCT_REJECTED]: {
    zh: '产品审核拒绝',
    en: 'Product Rejected',
    es: 'Producto Rechazado'
  },
  [NotificationType.SYSTEM_MAINTENANCE]: {
    zh: '系统维护',
    en: 'System Maintenance',
    es: 'Mantenimiento del Sistema'
  },
  [NotificationType.SYSTEM_UPDATE]: {
    zh: '系统更新',
    en: 'System Update',
    es: 'Actualización del Sistema'
  },
};

// 通知颜色主题映射
export const NOTIFICATION_COLORS: Record<NotificationType, {
  bg: string;
  text: string;
  border: string;
}> = {
  [NotificationType.COMPANY_APPROVED]: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200'
  },
  [NotificationType.COMPANY_REJECTED]: {
    bg: 'bg-red-50',
    text: 'text-red-700', 
    border: 'border-red-200'
  },
  [NotificationType.INQUIRY_NEW]: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200'
  },
  [NotificationType.INQUIRY_QUOTED]: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200'
  },
  [NotificationType.INQUIRY_CONFIRMED]: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200'
  },
  [NotificationType.INQUIRY_DECLINED]: {
    bg: 'bg-red-50', 
    text: 'text-red-700',
    border: 'border-red-200'
  },
  [NotificationType.PRODUCT_APPROVED]: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200'
  },
  [NotificationType.PRODUCT_REJECTED]: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200'
  },
  [NotificationType.SYSTEM_MAINTENANCE]: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200'
  },
  [NotificationType.SYSTEM_UPDATE]: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200'
  },
};