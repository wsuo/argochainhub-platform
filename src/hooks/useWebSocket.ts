import { useEffect, useRef, useCallback } from 'react';
import { webSocketService, WebSocketCallbacks } from '@/services/websocketService';
import { WebSocketStatus } from '@/types/notification';
import { useAuth } from '@/contexts/MockAuthContext';

export interface UseWebSocketOptions {
  /**
   * 是否自动连接（默认为true）
   */
  autoConnect?: boolean;
  
  /**
   * 连接失败时是否自动重试（默认为true）
   */
  autoReconnect?: boolean;
  
  /**
   * 最大重试次数（默认为5次）
   */
  maxReconnectAttempts?: number;
  
  /**
   * 重试间隔（毫秒，默认为2000）
   */
  reconnectDelay?: number;
  
  /**
   * WebSocket事件回调
   */
  callbacks?: WebSocketCallbacks;
}

export interface UseWebSocketReturn {
  /**
   * 当前连接状态
   */
  status: WebSocketStatus;
  
  /**
   * 是否已连接
   */
  isConnected: boolean;
  
  /**
   * 连接统计信息
   */
  connectionStats: {
    status: WebSocketStatus;
    socketId: string | null;
    reconnectAttempts: number;
    maxReconnectAttempts: number;
    isConnected: boolean;
  };
  
  /**
   * 手动连接
   */
  connect: () => void;
  
  /**
   * 手动断开连接
   */
  disconnect: () => void;
  
  /**
   * 强制重连
   */
  forceReconnect: () => void;
  
  /**
   * 发送消息
   */
  emit: (event: string, ...args: any[]) => void;
  
  /**
   * 加入房间
   */
  joinRoom: (userId: string) => void;
  
  /**
   * 离开房间  
   */
  leaveRoom: (userId: string) => void;
}

export const useWebSocket = (options: UseWebSocketOptions = {}): UseWebSocketReturn => {
  const {
    autoConnect = true,
    callbacks = {},
  } = options;
  
  const { isLoggedIn, user } = useAuth();
  const statusRef = useRef<WebSocketStatus>(WebSocketStatus.DISCONNECTED);
  const isConnectedRef = useRef<boolean>(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // 更新状态引用
  const updateStatus = useCallback((newStatus: WebSocketStatus) => {
    statusRef.current = newStatus;
    isConnectedRef.current = newStatus === WebSocketStatus.CONNECTED;
  }, []);

  /**
   * 连接WebSocket
   */
  const connect = useCallback(() => {
    if (!isLoggedIn) {
      console.warn('用户未登录，无法建立WebSocket连接');
      return;
    }

    const token = localStorage.getItem('agro_access_token');
    if (!token) {
      console.warn('未找到访问令牌，无法建立WebSocket连接');
      return;
    }

    if (webSocketService.getStatus() === WebSocketStatus.CONNECTED) {
      console.log('WebSocket已连接');
      return;
    }

    console.log('开始建立WebSocket连接...');
    updateStatus(WebSocketStatus.CONNECTING);
    
    // 设置回调
    webSocketService.setCallbacks({
      onConnection: () => {
        console.log('WebSocket连接成功');
        updateStatus(WebSocketStatus.CONNECTED);
        callbacks.onConnection?.();
        
        // 连接成功后清除重连定时器
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      },
      
      onDisconnection: (reason) => {
        console.log('WebSocket断开连接:', reason);
        updateStatus(WebSocketStatus.DISCONNECTED);
        callbacks.onDisconnection?.(reason);
      },
      
      onNotification: (notification) => {
        callbacks.onNotification?.(notification);
      },
      
      onUnreadCountUpdate: (count) => {
        callbacks.onUnreadCountUpdate?.(count);
      },
      
      onError: (error) => {
        console.error('WebSocket连接错误:', error);
        updateStatus(WebSocketStatus.ERROR);
        callbacks.onError?.(error);
      },
      
      onReconnect: (attempt) => {
        console.log('WebSocket重连尝试:', attempt);
        updateStatus(WebSocketStatus.CONNECTING);
        callbacks.onReconnect?.(attempt);
      },
      
      onReconnectError: (error) => {
        console.error('WebSocket重连错误:', error);
        callbacks.onReconnectError?.(error);
      }
    });

    // 开始连接
    webSocketService.connect(token);
  }, [isLoggedIn, callbacks, updateStatus]);

  /**
   * 断开WebSocket连接
   */
  const disconnect = useCallback(() => {
    console.log('断开WebSocket连接');
    
    // 清除重连定时器
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    webSocketService.disconnect();
    updateStatus(WebSocketStatus.DISCONNECTED);
  }, [updateStatus]);

  /**
   * 强制重连
   */
  const forceReconnect = useCallback(() => {
    console.log('强制重连WebSocket');
    
    const token = localStorage.getItem('agro_access_token');
    if (!token || !isLoggedIn) {
      console.warn('无法重连：用户未登录或token不存在');
      return;
    }
    
    disconnect();
    
    // 延迟1秒后重新连接
    setTimeout(() => {
      connect();
    }, 1000);
  }, [isLoggedIn, connect, disconnect]);

  /**
   * 发送消息
   */
  const emit = useCallback((event: string, ...args: unknown[]) => {
    if (webSocketService.getStatus() === WebSocketStatus.CONNECTED) {
      webSocketService.emit(event as any, ...args);
    } else {
      console.warn('WebSocket未连接，无法发送消息:', event);
    }
  }, []);

  /**
   * 加入房间
   */
  const joinRoom = useCallback((userId: string) => {
    webSocketService.joinRoom(userId);
  }, []);

  /**
   * 离开房间
   */
  const leaveRoom = useCallback((userId: string) => {
    webSocketService.leaveRoom(userId);
  }, []);

  /**
   * 获取连接统计信息
   */
  const getConnectionStats = useCallback(() => {
    return webSocketService.getConnectionStats();
  }, []);

  // 自动连接逻辑
  useEffect(() => {
    if (autoConnect && isLoggedIn && user) {
      connect();
    }
    
    return () => {
      if (!isLoggedIn) {
        disconnect();
      }
    };
  }, [autoConnect, isLoggedIn, user, connect, disconnect]);

  // 监听认证状态变化
  useEffect(() => {
    if (!isLoggedIn) {
      disconnect();
    }
  }, [isLoggedIn, disconnect]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // 监听token刷新事件
  useEffect(() => {
    const handleTokenRefresh = () => {
      console.log('检测到token刷新，重新建立WebSocket连接');
      forceReconnect();
    };

    window.addEventListener('auth:token-refreshed', handleTokenRefresh);
    
    return () => {
      window.removeEventListener('auth:token-refreshed', handleTokenRefresh);
    };
  }, [forceReconnect]);

  return {
    status: statusRef.current,
    isConnected: isConnectedRef.current,
    connectionStats: getConnectionStats(),
    connect,
    disconnect,
    forceReconnect,
    emit,
    joinRoom,
    leaveRoom,
  };
};