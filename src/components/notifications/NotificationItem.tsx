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
  CheckCircle2,
  XCircle,
  Info,
  MessageSquare,
  FileText,
  AlertCircle,
  TrendingUp
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

  // 获取通知图标和颜色
  const getNotificationIconAndColor = (type: NotificationType) => {
    switch (type) {
      case NotificationType.COMPANY_APPROVED:
        return { 
          icon: <CheckCircle2 className="h-5 w-5" />,
          bgColor: 'bg-green-50',
          iconColor: 'text-green-600',
          dotColor: 'bg-green-500'
        };
      case NotificationType.COMPANY_REJECTED:
        return { 
          icon: <XCircle className="h-5 w-5" />,
          bgColor: 'bg-red-50',
          iconColor: 'text-red-600',
          dotColor: 'bg-red-500'
        };
      case NotificationType.INQUIRY_NEW:
      case NotificationType.INQUIRY_QUOTED:
        return { 
          icon: <MessageSquare className="h-5 w-5" />,
          bgColor: 'bg-blue-50',
          iconColor: 'text-blue-600',
          dotColor: 'bg-blue-500'
        };
      case NotificationType.INQUIRY_CONFIRMED:
        return { 
          icon: <CheckCircle className="h-5 w-5" />,
          bgColor: 'bg-green-50',
          iconColor: 'text-green-600',
          dotColor: 'bg-green-500'
        };
      case NotificationType.INQUIRY_DECLINED:
        return { 
          icon: <XCircle className="h-5 w-5" />,
          bgColor: 'bg-orange-50',
          iconColor: 'text-orange-600',
          dotColor: 'bg-orange-500'
        };
      case NotificationType.PRODUCT_APPROVED:
      case NotificationType.PRODUCT_REJECTED:
        return { 
          icon: <Package className="h-5 w-5" />,
          bgColor: type === NotificationType.PRODUCT_APPROVED ? 'bg-green-50' : 'bg-red-50',
          iconColor: type === NotificationType.PRODUCT_APPROVED ? 'text-green-600' : 'text-red-600',
          dotColor: type === NotificationType.PRODUCT_APPROVED ? 'bg-green-500' : 'bg-red-500'
        };
      case NotificationType.SYSTEM_MAINTENANCE:
        return { 
          icon: <AlertTriangle className="h-5 w-5" />,
          bgColor: 'bg-yellow-50',
          iconColor: 'text-yellow-600',
          dotColor: 'bg-yellow-500'
        };
      case NotificationType.SYSTEM_UPDATE:
        return { 
          icon: <TrendingUp className="h-5 w-5" />,
          bgColor: 'bg-blue-50',
          iconColor: 'text-blue-600',
          dotColor: 'bg-blue-500'
        };
      default:
        return { 
          icon: <Info className="h-5 w-5" />,
          bgColor: 'bg-gray-50',
          iconColor: 'text-gray-600',
          dotColor: 'bg-gray-500'
        };
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

  const isUnread = notification.status === 'unread';
  const timeAgo = NotificationService.formatNotificationTime(notification.createdAt);
  const typeLabel = getTypeLabel(notification.type as NotificationType);
  const priority = NotificationService.getNotificationPriority(notification);
  const { icon, bgColor, iconColor, dotColor } = getNotificationIconAndColor(notification.type as NotificationType);

  return (
    <div
      className={cn(
        'group relative bg-white hover:bg-gray-50/50 transition-all cursor-pointer',
        compact ? 'p-3' : 'p-4',
        'hover:shadow-sm'
      )}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        {/* 左侧图标区域 */}
        <div className="relative flex-shrink-0">
          <div className={cn(
            'rounded-full p-2',
            bgColor
          )}>
            <div className={iconColor}>
              {icon}
            </div>
          </div>
          {/* 未读状态点 */}
          {isUnread && (
            <div className={cn(
              'absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full',
              dotColor
            )} />
          )}
        </div>

        {/* 通知内容 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {/* 标题行 - 包含标题和标签 */}
              <div className="flex items-center gap-2 mb-1">
                <h4 className={cn(
                  'font-medium',
                  isUnread ? 'text-gray-900' : 'text-gray-700',
                  compact ? 'text-sm' : 'text-base'
                )}>
                  {notification.title}
                </h4>
                {/* 类型标签 */}
                {!compact && (
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      'text-xs px-2 py-0.5',
                      isUnread && 'bg-blue-100 text-blue-700'
                    )}
                  >
                    {typeLabel}
                  </Badge>
                )}
              </div>

              {/* 内容 */}
              <p className={cn(
                'text-gray-600 line-clamp-2',
                compact ? 'text-xs' : 'text-sm'
              )}>
                {notification.content}
              </p>

              {/* 底部信息栏 */}
              <div className="flex items-center gap-3 mt-2">
                {/* 时间 */}
                <span className={cn(
                  'text-gray-500',
                  compact ? 'text-xs' : 'text-sm'
                )}>
                  {timeAgo}
                </span>
                
                {/* 优先级指示器 */}
                {priority === 'high' && !compact && (
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                    <span className="text-xs text-red-600">重要</span>
                  </div>
                )}
                
                {/* 已读状态标签 */}
                {!isUnread && !compact && (
                  <Badge variant="outline" className="text-xs px-2 py-0">
                    已读
                  </Badge>
                )}
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

    </div>
  );
};