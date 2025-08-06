import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Bell, 
  CheckCircle2, 
  Trash2, 
  Settings, 
  RefreshCw,
  Filter,
  Search,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  NotificationItem as NotificationItemType, 
  NotificationStatus, 
  NotificationType,
  NOTIFICATION_TYPE_LABELS 
} from '@/types/notification';
import { useNotifications } from '@/contexts/NotificationContext';
import { NotificationItem } from './NotificationItem';
import { cn } from '@/lib/utils';

interface NotificationCenterProps {
  onClose?: () => void;
  compact?: boolean;
  maxHeight?: number;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  onClose,
  compact = false,
  maxHeight = 500
}) => {
  const { t } = useTranslation();
  const {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshUnreadCount
  } = useNotifications();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<NotificationType | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  // 过滤通知
  const filteredNotifications = React.useMemo(() => {
    let filtered = notifications;

    // 按标签页筛选
    if (activeTab === 'unread') {
      filtered = filtered.filter(n => n.status === 'unread');
    }

    // 按类型筛选
    if (filterType !== 'all') {
      filtered = filtered.filter(n => n.type === filterType);
    }

    // 按搜索关键词筛选
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(query) ||
        n.content.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [notifications, activeTab, filterType, searchQuery]);

  // 获取通知类型选项
  const getTypeOptions = () => {
    const types = Array.from(new Set(notifications.map(n => n.type)));
    return types.map(type => ({
      value: type,
      label: NOTIFICATION_TYPE_LABELS[type as NotificationType]?.zh || type
    }));
  };

  // 处理刷新
  const handleRefresh = () => {
    fetchNotifications();
    refreshUnreadCount();
  };

  // 处理标记所有为已读
  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  // 处理通知点击
  const handleNotificationClick = (notification: NotificationItemType) => {
    // 如果是紧凑模式，点击后关闭通知中心
    if (compact && onClose) {
      onClose();
    }
  };

  // 组件挂载时加载通知
  useEffect(() => {
    if (notifications.length === 0 && !loading) {
      fetchNotifications();
    }
  }, [notifications.length, loading, fetchNotifications]);

  return (
    <div className={cn(
      'bg-white border rounded-lg shadow-lg',
      compact ? 'w-80' : 'w-96'
    )}>
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <Bell className="h-5 w-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">通知中心</h3>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {unreadCount}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="h-8 w-8 p-0"
            title="刷新"
          >
            <RefreshCw className={cn(
              'h-4 w-4',
              loading && 'animate-spin'
            )} />
          </Button>
          
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="h-8 w-8 p-0"
              title="全部标记为已读"
            >
              <CheckCircle2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* 搜索和筛选 */}
      {!compact && (
        <div className="p-4 space-y-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="搜索通知..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          
          <Select
            value={filterType}
            onValueChange={(value) => setFilterType(value as NotificationType | 'all')}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="筛选类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              {getTypeOptions().map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* 标签页 */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'all' | 'unread')}>
        <div className="px-4 pt-3">
          <TabsList className="grid w-full grid-cols-2 h-8">
            <TabsTrigger value="all" className="text-xs">
              全部 ({notifications.length})
            </TabsTrigger>
            <TabsTrigger value="unread" className="text-xs">
              未读 ({unreadCount})
            </TabsTrigger>
          </TabsList>
        </div>

        {/* 通知列表 */}
        <TabsContent value={activeTab} className="mt-0">
          <ScrollArea className="h-auto" style={{ maxHeight }}>
            {error && (
              <div className="p-4 text-center">
                <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-sm text-red-600">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefresh}
                  className="mt-2"
                >
                  重试
                </Button>
              </div>
            )}

            {loading && notifications.length === 0 && (
              <div className="p-8 text-center">
                <RefreshCw className="h-8 w-8 text-gray-400 mx-auto mb-2 animate-spin" />
                <p className="text-sm text-gray-500">加载中...</p>
              </div>
            )}

            {!loading && !error && filteredNotifications.length === 0 && (
              <div className="p-8 text-center">
                <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  {activeTab === 'unread' ? '暂无未读通知' : '暂无通知'}
                </p>
              </div>
            )}

            {filteredNotifications.length > 0 && (
              <div className="divide-y divide-gray-100">
                {filteredNotifications.map((notification, index) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={markAsRead}
                    onDelete={deleteNotification}
                    onClick={handleNotificationClick}
                    compact={compact}
                    showActions={!compact}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* 底部操作 */}
      {!compact && filteredNotifications.length > 0 && (
        <div className="p-4 border-t bg-gray-50">
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {/* TODO: 打开通知设置 */}}
            >
              <Settings className="h-4 w-4 mr-2" />
              设置
            </Button>
            
            <div className="text-xs text-gray-500">
              共 {notifications.length} 条通知
            </div>
          </div>
        </div>
      )}
    </div>
  );
};