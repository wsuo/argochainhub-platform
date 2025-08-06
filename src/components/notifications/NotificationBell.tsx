import React, { useState, useEffect } from 'react';
import { Bell, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { WebSocketStatus } from '@/types/notification';
import { cn } from '@/lib/utils';
import { NotificationCenter } from './NotificationCenter';

interface NotificationBellProps {
  unreadCount: number;
  wsStatus: WebSocketStatus;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showConnectionStatus?: boolean;
  animate?: boolean;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  unreadCount = 0,
  wsStatus = WebSocketStatus.DISCONNECTED,
  className,
  size = 'md',
  showConnectionStatus = true,
  animate = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  // 当未读数量增加时触发动画
  useEffect(() => {
    if (animate && unreadCount > 0) {
      setShouldAnimate(true);
      const timer = setTimeout(() => setShouldAnimate(false), 600);
      return () => clearTimeout(timer);
    }
  }, [unreadCount, animate]);

  // 获取铃铛大小样式
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          button: 'h-8 w-8',
          icon: 'h-4 w-4',
          badge: 'text-xs min-w-[16px] h-4 px-1'
        };
      case 'lg':
        return {
          button: 'h-12 w-12',
          icon: 'h-6 w-6',
          badge: 'text-sm min-w-[20px] h-5 px-1.5'
        };
      case 'md':
      default:
        return {
          button: 'h-10 w-10',
          icon: 'h-5 w-5',
          badge: 'text-xs min-w-[18px] h-4.5 px-1'
        };
    }
  };

  // 获取连接状态样式
  const getConnectionStatusStyles = () => {
    switch (wsStatus) {
      case WebSocketStatus.CONNECTED:
        return {
          color: 'text-green-600',
          icon: Wifi,
          title: 'WebSocket已连接'
        };
      case WebSocketStatus.CONNECTING:
        return {
          color: 'text-yellow-600',
          icon: Wifi,
          title: 'WebSocket连接中...'
        };
      case WebSocketStatus.ERROR:
        return {
          color: 'text-red-600',
          icon: WifiOff,
          title: 'WebSocket连接错误'
        };
      case WebSocketStatus.DISCONNECTED:
      default:
        return {
          color: 'text-gray-400',
          icon: WifiOff,
          title: 'WebSocket未连接'
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const connectionStatus = getConnectionStatusStyles();
  const ConnectionIcon = connectionStatus.icon;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={cn(
            'relative',
            sizeStyles.button,
            shouldAnimate && 'animate-pulse',
            className
          )}
          title={`通知 (${unreadCount} 条未读)`}
        >
          {/* 铃铛图标 */}
          <Bell 
            className={cn(
              sizeStyles.icon,
              'transition-colors',
              unreadCount > 0 ? 'text-primary' : 'text-muted-foreground',
              shouldAnimate && 'animate-bounce'
            )} 
          />
          
          {/* 未读数量徽章 */}
          {unreadCount > 0 && (
            <Badge 
              className={cn(
                'absolute -top-1 -right-1 bg-red-500 hover:bg-red-500 border-0',
                sizeStyles.badge,
                shouldAnimate && 'animate-bounce'
              )}
              variant="destructive"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
          
          {/* 连接状态指示器 */}
          {showConnectionStatus && (
            <div 
              className="absolute -bottom-0.5 -right-0.5"
              title={connectionStatus.title}
            >
              <ConnectionIcon 
                className={cn(
                  'h-3 w-3',
                  connectionStatus.color,
                  wsStatus === WebSocketStatus.CONNECTING && 'animate-pulse'
                )} 
              />
            </div>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-80 p-0" 
        align="end"
        sideOffset={8}
      >
        <NotificationCenter 
          onClose={() => setIsOpen(false)}
          compact={true}
        />
      </PopoverContent>
    </Popover>
  );
};