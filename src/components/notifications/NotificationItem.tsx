import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/hooks/useLanguage';
import { 
  NotificationItem as NotificationItemType, 
  NOTIFICATION_TYPE_LABELS, 
  NOTIFICATION_COLORS,
  NotificationType 
} from '@/types/notification';
import { NotificationService } from '@/services/notificationService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MoreHorizontal, 
  Check, 
  Trash2, 
  ExternalLink,
  Building2,
  ShoppingCart,
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface NotificationItemProps {
  notification: NotificationItemType;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClick?: (notification: NotificationItemType) => void;
  showActions?: boolean;
  compact?: boolean;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onDelete,
  onClick,
  showActions = true,
  compact = false
}) => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const navigate = useNavigate();

  // 获取通知类型标签
  const getTypeLabel = (type: NotificationType): string => {
    const labels = NOTIFICATION_TYPE_LABELS[type];
    if (!labels) return type;
    
    switch (currentLanguage) {
      case 'en': return labels.en;
      case 'es': return labels.es;
      case 'zh':
      default: return labels.zh;
    }
  };

  // 获取通知图标
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.COMPANY_APPROVED:
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case NotificationType.COMPANY_REJECTED:
        return <XCircle className="h-5 w-5 text-red-600" />;
      case NotificationType.INQUIRY_NEW:
        return <ShoppingCart className="h-5 w-5 text-blue-600" />;
      case NotificationType.INQUIRY_QUOTED:
        return <Package className="h-5 w-5 text-purple-600" />;
      case NotificationType.INQUIRY_CONFIRMED:
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case NotificationType.INQUIRY_DECLINED:
        return <XCircle className="h-5 w-5 text-red-600" />;
      case NotificationType.PRODUCT_APPROVED:
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case NotificationType.PRODUCT_REJECTED:
        return <XCircle className="h-5 w-5 text-red-600" />;
      case NotificationType.SYSTEM_MAINTENANCE:
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case NotificationType.SYSTEM_UPDATE:
        return <Info className="h-5 w-5 text-blue-600" />;
      default:
        return <Info className="h-5 w-5 text-gray-600" />;
    }
  };

  // 处理点击事件
  const handleClick = () => {
    // 如果是未读通知，点击时标记为已读
    if (notification.status === 'unread' && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }

    // 执行自定义点击处理
    if (onClick) {
      onClick(notification);
      return;
    }

    // 默认跳转逻辑
    const actionUrl = NotificationService.getNotificationActionUrl(notification);
    if (actionUrl) {
      navigate(actionUrl);
    }
  };

  // 处理标记已读
  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMarkAsRead?.(notification.id);
  };

  // 处理删除
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(notification.id);
  };

  // 获取通知样式
  const colors = NOTIFICATION_COLORS[notification.type as NotificationType] || {
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    border: 'border-gray-200'
  };

  const isUnread = notification.status === 'unread';
  const timeAgo = NotificationService.formatNotificationTime(notification.createdAt);
  const typeLabel = getTypeLabel(notification.type as NotificationType);
  const priority = NotificationService.getNotificationPriority(notification);

  return (
    <div
      className={cn(
        'group relative border-l-4 bg-white hover:bg-gray-50 transition-colors cursor-pointer',
        colors.border,
        isUnread && 'bg-blue-50/30',
        compact ? 'p-3' : 'p-4'
      )}
      onClick={handleClick}
    >
      {/* 未读指示器 */}
      {isUnread && (
        <div className="absolute left-2 top-2 w-2 h-2 bg-blue-500 rounded-full"></div>
      )}

      <div className="flex items-start space-x-3">
        {/* 通知图标 */}
        <div className="flex-shrink-0 mt-0.5">
          {getNotificationIcon(notification.type as NotificationType)}
        </div>

        {/* 通知内容 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              {/* 标题 */}
              <h4 className={cn(
                'text-sm font-medium mb-1',
                isUnread ? 'text-gray-900' : 'text-gray-700'
              )}>
                {notification.title}
              </h4>

              {/* 内容 */}
              <p className="text-sm text-gray-600 line-clamp-2">
                {notification.content}
              </p>

              {/* 时间 */}
              <div className="flex items-center mt-2 text-xs text-gray-500">
                <span>{timeAgo}</span>
              </div>
            </div>

            {/* 操作按钮 */}
            {showActions && (
              <div className="flex-shrink-0 ml-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {isUnread && onMarkAsRead && (
                      <DropdownMenuItem onClick={handleMarkAsRead}>
                        <Check className="h-4 w-4 mr-2" />
                        标记为已读
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem 
                        onClick={handleDelete}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        删除通知
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 点击提示 */}
      {NotificationService.getNotificationActionUrl(notification) && (
        <div className="absolute inset-0 bg-transparent group-hover:bg-blue-50/10 transition-colors pointer-events-none" />
      )}
    </div>
  );
};