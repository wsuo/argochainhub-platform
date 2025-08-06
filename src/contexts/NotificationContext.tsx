import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import { 
  NotificationItem, 
  NotificationContextState, 
  NotificationActions,
  WebSocketStatus,
  NotificationQueryParams,
  NotificationType
} from '@/types/notification';
import { NotificationService } from '@/services/notificationService';
import { webSocketService } from '@/services/websocketService';
import { AuthService } from '@/services/authService';
import { useAuth } from './MockAuthContext';

// Action types
type NotificationAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_NOTIFICATIONS'; payload: NotificationItem[] }
  | { type: 'ADD_NOTIFICATION'; payload: NotificationItem }
  | { type: 'UPDATE_NOTIFICATION'; payload: { id: string; notification: Partial<NotificationItem> } }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'SET_UNREAD_COUNT'; payload: number }
  | { type: 'SET_WS_STATUS'; payload: WebSocketStatus }
  | { type: 'MARK_AS_READ'; payload: string }
  | { type: 'MARK_ALL_AS_READ' }
  | { type: 'RESET_STATE' };

// Reducer
function notificationReducer(state: NotificationContextState, action: NotificationAction): NotificationContextState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
      
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
      
    case 'SET_NOTIFICATIONS':
      return { ...state, notifications: action.payload, loading: false, error: null };
      
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: action.payload.status === 'unread' ? state.unreadCount + 1 : state.unreadCount
      };
      
    case 'UPDATE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === action.payload.id ? { ...n, ...action.payload.notification } : n
        )
      };
      
    case 'REMOVE_NOTIFICATION': {
      const removedNotification = state.notifications.find(n => n.id === action.payload);
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
        unreadCount: removedNotification?.status === 'unread' ? state.unreadCount - 1 : state.unreadCount
      };
    }
      
    case 'SET_UNREAD_COUNT':
      return { ...state, unreadCount: action.payload };
      
    case 'SET_WS_STATUS':
      return { ...state, wsStatus: action.payload };
      
    case 'MARK_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === action.payload && n.status === 'unread'
            ? { ...n, status: 'read', readAt: new Date().toISOString() }
            : n
        ),
        unreadCount: state.notifications.find(n => n.id === action.payload)?.status === 'unread' 
          ? state.unreadCount - 1 
          : state.unreadCount
      };
      
    case 'MARK_ALL_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(n => 
          n.status === 'unread' 
            ? { ...n, status: 'read', readAt: new Date().toISOString() }
            : n
        ),
        unreadCount: 0
      };
      
    case 'RESET_STATE':
      return {
        notifications: [],
        unreadCount: 0,
        loading: false,
        error: null,
        wsStatus: WebSocketStatus.DISCONNECTED
      };
      
    default:
      return state;
  }
}

// Initial state
const initialState: NotificationContextState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  wsStatus: WebSocketStatus.DISCONNECTED,
};

// Context
const NotificationContext = createContext<
  (NotificationContextState & NotificationActions) | null
>(null);

// Provider component
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const { user, isLoggedIn } = useAuth();

  /**
   * 获取通知列表
   */
  const fetchNotifications = useCallback(async (params: NotificationQueryParams = {}) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const defaultParams = {
        page: 1,
        limit: 50,
        ...params
      };
      
      const response = await NotificationService.getNotifications(defaultParams);
      
      if (response.success && response.data) {
        dispatch({ type: 'SET_NOTIFICATIONS', payload: response.data });
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.message || '获取通知失败' });
      }
    } catch (error) {
      console.error('获取通知失败:', error);
      dispatch({ type: 'SET_ERROR', payload: '获取通知失败' });
    }
  }, []);

  /**
   * 刷新未读数量
   */
  const refreshUnreadCount = useCallback(async () => {
    try {
      const response = await NotificationService.getUnreadCount();
      if (response.success && response.data) {
        dispatch({ type: 'SET_UNREAD_COUNT', payload: response.data.count });
      }
    } catch (error) {
      console.error('获取未读数量失败:', error);
    }
  }, []);

  /**
   * 标记为已读
   */
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await NotificationService.markAsRead(notificationId);
      if (response.success) {
        dispatch({ type: 'MARK_AS_READ', payload: notificationId });
      }
    } catch (error) {
      console.error('标记已读失败:', error);
      dispatch({ type: 'SET_ERROR', payload: '标记已读失败' });
    }
  }, []);

  /**
   * 标记所有为已读
   */
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await NotificationService.markAllAsRead();
      if (response.success) {
        dispatch({ type: 'MARK_ALL_AS_READ' });
      }
    } catch (error) {
      console.error('标记所有已读失败:', error);
      dispatch({ type: 'SET_ERROR', payload: '标记所有已读失败' });
    }
  }, []);

  /**
   * 删除通知
   */
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await NotificationService.deleteNotification(notificationId);
      if (response.success) {
        dispatch({ type: 'REMOVE_NOTIFICATION', payload: notificationId });
      }
    } catch (error) {
      console.error('删除通知失败:', error);
      dispatch({ type: 'SET_ERROR', payload: '删除通知失败' });
    }
  }, []);

  /**
   * 处理企业认证通过通知
   */
  const handleCompanyApprovedNotification = useCallback(async (notification: NotificationItem) => {
    try {
      console.log('处理企业认证通过通知，准备刷新Token...');
      
      // 刷新Token
      const refreshResponse = await AuthService.refreshToken();
      
      if (refreshResponse.accessToken) {
        console.log('Token刷新成功，企业认证状态已更新');
        
        // 这里可以触发用户信息更新
        // 如果需要的话，可以通过事件或回调通知其他组件
        window.dispatchEvent(new CustomEvent('auth:token-refreshed', {
          detail: {
            user: refreshResponse.user,
            reason: 'company_approved'
          }
        }));
      }
    } catch (error) {
      console.error('处理企业认证通知失败:', error);
    }
  }, []);

  /**
   * 处理通知特殊逻辑
   */
  const handleSpecialNotification = useCallback(async (notification: NotificationItem) => {
    // 企业认证通过需要刷新Token
    if (notification.type === NotificationType.COMPANY_APPROVED && 
        notification.data?.requiresTokenRefresh) {
      await handleCompanyApprovedNotification(notification);
    }
    
    // 其他特殊处理逻辑可以在这里添加
  }, [handleCompanyApprovedNotification]);

  /**
   * WebSocket连接
   */
  const connectWebSocket = useCallback(() => {
    if (!isLoggedIn) return;
    
    const token = localStorage.getItem('agro_access_token');
    if (!token) return;

    // 设置WebSocket回调
    webSocketService.setCallbacks({
      onConnection: () => {
        console.log('WebSocket连接成功');
        dispatch({ type: 'SET_WS_STATUS', payload: WebSocketStatus.CONNECTED });
        
        // 连接成功后刷新未读数量
        refreshUnreadCount();
      },
      
      onDisconnection: (reason) => {
        console.log('WebSocket断开连接:', reason);
        dispatch({ type: 'SET_WS_STATUS', payload: WebSocketStatus.DISCONNECTED });
      },
      
      onNotification: (notification) => {
        console.log('收到新通知:', notification);
        dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
        
        // 处理特殊通知
        handleSpecialNotification(notification);
        
        // 显示浏览器通知
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.content,
            icon: '/logo.png'
          });
        }
      },
      
      onUnreadCountUpdate: (count) => {
        console.log('未读数量更新:', count);
        dispatch({ type: 'SET_UNREAD_COUNT', payload: count });
      },
      
      onError: (error) => {
        console.error('WebSocket错误:', error);
        dispatch({ type: 'SET_WS_STATUS', payload: WebSocketStatus.ERROR });
        dispatch({ type: 'SET_ERROR', payload: 'WebSocket连接错误' });
      },
      
      onReconnect: (attempt) => {
        console.log('WebSocket重连尝试:', attempt);
        dispatch({ type: 'SET_WS_STATUS', payload: WebSocketStatus.CONNECTING });
      }
    });

    // 开始连接
    dispatch({ type: 'SET_WS_STATUS', payload: WebSocketStatus.CONNECTING });
    webSocketService.connect(token);
  }, [isLoggedIn, refreshUnreadCount, handleSpecialNotification]);

  /**
   * WebSocket断开连接
   */
  const disconnectWebSocket = useCallback(() => {
    webSocketService.disconnect();
    dispatch({ type: 'SET_WS_STATUS', payload: WebSocketStatus.DISCONNECTED });
  }, []);

  // 登录状态变化时的处理
  useEffect(() => {
    if (isLoggedIn && user) {
      // 用户登录时初始化
      fetchNotifications();
      refreshUnreadCount();
      connectWebSocket();
      
      // 请求浏览器通知权限
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    } else {
      // 用户登出时清理
      disconnectWebSocket();
      dispatch({ type: 'RESET_STATE' });
    }
    
    return () => {
      if (!isLoggedIn) {
        disconnectWebSocket();
      }
    };
  }, [isLoggedIn, user, fetchNotifications, refreshUnreadCount, connectWebSocket, disconnectWebSocket]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      disconnectWebSocket();
    };
  }, [disconnectWebSocket]);

  const value = {
    ...state,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshUnreadCount,
    connectWebSocket,
    disconnectWebSocket,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Hook to use notification context
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};