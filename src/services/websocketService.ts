import { io, Socket } from 'socket.io-client';
import { NotificationItem, WebSocketStatus, WebSocketEvents, InquiryMessageEvent, InquiryStatusUpdateEvent } from '@/types/notification';

export interface WebSocketServiceConfig {
  url: string;
  namespace?: string;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
  timeout?: number;
}

export interface WebSocketCallbacks {
  onConnection?: () => void;
  onDisconnection?: (reason: string) => void;
  onNotification?: (notification: NotificationItem) => void;
  onUnreadCountUpdate?: (count: number) => void;
  onError?: (error: Error) => void;
  onReconnect?: (attempt: number) => void;
  onReconnectError?: (error: Error) => void;
  
  // 询价消息相关回调
  onInquiryMessageReceived?: (data: InquiryMessageEvent) => void;
  onInquiryStatusUpdated?: (data: InquiryStatusUpdateEvent) => void;
}

export class WebSocketService {
  private socket: Socket | null = null;
  private config: WebSocketServiceConfig;
  private callbacks: WebSocketCallbacks = {};
  private status: WebSocketStatus = WebSocketStatus.DISCONNECTED;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private listeners: Array<() => void> = [];

  constructor(config: WebSocketServiceConfig) {
    this.config = {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      ...config
    };
    
    this.maxReconnectAttempts = this.config.reconnectionAttempts || 5;
  }

  /**
   * 设置事件回调
   */
  setCallbacks(callbacks: WebSocketCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * 获取连接状态
   */
  getStatus(): WebSocketStatus {
    return this.status;
  }

  /**
   * 获取Socket实例
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * 连接WebSocket
   */
  connect(token: string): void {
    if (this.socket?.connected) {
      console.log('WebSocket already connected');
      return;
    }

    this.setStatus(WebSocketStatus.CONNECTING);
    
    console.log('Connecting to WebSocket:', this.config.url);

    // 构建完整的URL
    const fullUrl = this.config.namespace 
      ? `${this.config.url}${this.config.namespace}`
      : this.config.url;

    try {
      this.socket = io(fullUrl, {
        auth: {
          token: token.startsWith('Bearer ') ? token.slice(7) : token
        },
        reconnection: this.config.reconnection,
        reconnectionAttempts: this.config.reconnectionAttempts,
        reconnectionDelay: this.config.reconnectionDelay,
        timeout: this.config.timeout,
        transports: ['websocket', 'polling'] // 支持降级
      });

      this.setupEventListeners();
      
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.setStatus(WebSocketStatus.ERROR);
      this.callbacks.onError?.(error as Error);
    }
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    console.log('Disconnecting WebSocket...');
    
    this.clearHeartbeat();
    this.clearListeners();
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.setStatus(WebSocketStatus.DISCONNECTED);
    this.reconnectAttempts = 0;
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // 连接成功
    const onConnect = () => {
      console.log('✅ WebSocket连接成功, Socket ID:', this.socket?.id);
      this.setStatus(WebSocketStatus.CONNECTED);
      this.reconnectAttempts = 0;
      this.callbacks.onConnection?.();
      this.startHeartbeat();
    };

    // 连接确认
    const onConnectionConfirmed = (data: { message: string }) => {
      console.log('📱 服务端连接确认:', data);
    };

    // 收到新通知
    const onNotification = (notification: NotificationItem) => {
      console.log('🔔 收到实时通知:', notification);
      this.callbacks.onNotification?.(notification);
      
      // 播放通知声音（可选）
      this.playNotificationSound();
    };

    // 未读数量更新
    const onUnreadCountUpdate = (data: { count: number }) => {
      console.log('📊 未读通知数量更新:', data.count);
      this.callbacks.onUnreadCountUpdate?.(data.count);
    };

    // Pong响应
    const onPong = (timestamp: string) => {
      console.log('✅ Pong响应:', timestamp);
    };

    // 收到询价消息
    const onInquiryMessageReceived = (data: InquiryMessageEvent) => {
      console.log('💬 收到询价消息:', data);
      this.callbacks.onInquiryMessageReceived?.(data);
      
      // 播放消息提示音
      this.playNotificationSound();
    };

    // 询价状态更新
    const onInquiryStatusUpdated = (data: InquiryStatusUpdateEvent) => {
      console.log('📋 询价状态更新:', data);
      this.callbacks.onInquiryStatusUpdated?.(data);
      
      // 播放状态更新提示音
      this.playNotificationSound();
    };

    // 连接错误
    const onConnectError = (error: Error) => {
      console.error('❌ WebSocket连接失败:', error);
      this.setStatus(WebSocketStatus.ERROR);
      this.callbacks.onError?.(error);
    };

    // 断开连接
    const onDisconnect = (reason: string) => {
      console.log('❌ WebSocket断开连接:', reason);
      this.setStatus(WebSocketStatus.DISCONNECTED);
      this.clearHeartbeat();
      this.callbacks.onDisconnection?.(reason);
      
      // 处理重连
      this.handleReconnection(reason);
    };

    // 重连尝试
    const onReconnectAttempt = (attempt: number) => {
      console.log(`🔄 重连尝试 ${attempt}/${this.maxReconnectAttempts}`);
      this.setStatus(WebSocketStatus.CONNECTING);
      this.callbacks.onReconnect?.(attempt);
    };

    // 重连错误
    const onReconnectError = (error: Error) => {
      console.error('🔄❌ 重连失败:', error);
      this.callbacks.onReconnectError?.(error);
    };

    // 重连失败
    const onReconnectFailed = () => {
      console.error('🔄❌ 达到最大重连次数，停止重连');
      this.setStatus(WebSocketStatus.ERROR);
      this.callbacks.onError?.(new Error('达到最大重连次数'));
    };

    // 注册事件监听器
    this.socket.on('connect', onConnect);
    this.socket.on('connection-confirmed', onConnectionConfirmed);
    this.socket.on('notification', onNotification);
    this.socket.on('unread-count-update', onUnreadCountUpdate);
    this.socket.on('pong', onPong);
    this.socket.on('inquiry_message_received', onInquiryMessageReceived);
    this.socket.on('inquiry_status_updated', onInquiryStatusUpdated);
    this.socket.on('connect_error', onConnectError);
    this.socket.on('disconnect', onDisconnect);
    this.socket.on('reconnect_attempt', onReconnectAttempt);
    this.socket.on('reconnect_error', onReconnectError);
    this.socket.on('reconnect_failed', onReconnectFailed);

    // 保存监听器引用以便清理
    this.listeners = [
      () => this.socket?.off('connect', onConnect),
      () => this.socket?.off('connection-confirmed', onConnectionConfirmed),
      () => this.socket?.off('notification', onNotification),
      () => this.socket?.off('unread-count-update', onUnreadCountUpdate),
      () => this.socket?.off('pong', onPong),
      () => this.socket?.off('inquiry_message_received', onInquiryMessageReceived),
      () => this.socket?.off('inquiry_status_updated', onInquiryStatusUpdated),
      () => this.socket?.off('connect_error', onConnectError),
      () => this.socket?.off('disconnect', onDisconnect),
      () => this.socket?.off('reconnect_attempt', onReconnectAttempt),
      () => this.socket?.off('reconnect_error', onReconnectError),
      () => this.socket?.off('reconnect_failed', onReconnectFailed),
    ];
  }

  /**
   * 清理事件监听器
   */
  private clearListeners(): void {
    this.listeners.forEach(cleanup => cleanup());
    this.listeners = [];
  }

  /**
   * 设置状态
   */
  private setStatus(status: WebSocketStatus): void {
    this.status = status;
  }

  /**
   * 处理重连逻辑
   */
  private handleReconnection(reason: string): void {
    // 某些情况下不需要重连
    if (reason === 'io client disconnect') {
      return;
    }

    this.reconnectAttempts++;
    
    if (this.reconnectAttempts > this.maxReconnectAttempts) {
      console.error('达到最大重连次数，停止重连');
      this.setStatus(WebSocketStatus.ERROR);
      return;
    }
  }

  /**
   * 开始心跳检测
   */
  private startHeartbeat(): void {
    this.clearHeartbeat();
    
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        console.log('🔄 发送ping测试...');
        this.socket.emit('ping');
      }
    }, 30000); // 每30秒发送一次心跳
  }

  /**
   * 清除心跳检测
   */
  private clearHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * 播放通知声音
   */
  private playNotificationSound(): void {
    try {
      // 创建一个简单的提示音
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      // 静默处理音频错误
      console.debug('无法播放通知声音:', error);
    }
  }

  /**
   * 发送消息到服务器
   */
  emit<K extends keyof WebSocketEvents>(event: K, ...args: Parameters<WebSocketEvents[K]>): void {
    if (this.socket?.connected) {
      this.socket.emit(event, ...args);
    } else {
      console.warn('WebSocket未连接，无法发送消息:', event);
    }
  }

  /**
   * 加入房间
   */
  joinRoom(userId: string): void {
    this.emit('join-room', { userId });
  }

  /**
   * 离开房间
   */
  leaveRoom(userId: string): void {
    this.emit('leave-room', { userId });
  }

  /**
   * 手动触发重连
   */
  forceReconnect(token: string): void {
    console.log('手动触发重连...');
    this.disconnect();
    setTimeout(() => {
      this.connect(token);
    }, 1000);
  }

  /**
   * 获取连接统计信息
   */
  getConnectionStats(): {
    status: WebSocketStatus;
    socketId: string | null;
    reconnectAttempts: number;
    maxReconnectAttempts: number;
    isConnected: boolean;
  } {
    return {
      status: this.status,
      socketId: this.socket?.id || null,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      isConnected: this.socket?.connected || false,
    };
  }
}

// 全局WebSocket服务实例
export const webSocketService = new WebSocketService({
  url: 'http://localhost:3050',
  namespace: '/notifications',
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 2000,
  timeout: 20000,
});