import { useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import { InquiryMessageEvent, InquiryStatusUpdateEvent } from '@/types/notification';
import { MessageSquare, Bell } from 'lucide-react';

export interface UseInquiryMessagingOptions {
  /**
   * 当前正在查看的询价单ID（如果在详情页面）
   */
  currentInquiryId?: string | number;
  
  /**
   * 消息接收回调
   */
  onMessageReceived?: (data: InquiryMessageEvent) => void;
  
  /**
   * 状态更新回调
   */
  onStatusUpdated?: (data: InquiryStatusUpdateEvent) => void;
  
  /**
   * 列表消息更新回调（用于更新列表中的最新消息）
   */
  onListMessageUpdate?: (inquiryId: number, data: InquiryMessageEvent) => void;
}

export interface UseInquiryMessagingReturn {
  /**
   * 发送自定义事件到页面
   */
  emitPageEvent: (eventName: string, data: any) => void;
  
  /**
   * 检查是否在询价详情页面
   */
  isInInquiryDetail: (inquiryId: number) => boolean;
}

export const useInquiryMessaging = (
  options: UseInquiryMessagingOptions = {}
): UseInquiryMessagingReturn => {
  const { toast } = useToast();
  const { currentLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    currentInquiryId,
    onMessageReceived,
    onStatusUpdated,
    onListMessageUpdate
  } = options;

  // 使用ref来避免闭包问题
  const currentInquiryIdRef = useRef(currentInquiryId);
  currentInquiryIdRef.current = currentInquiryId;

  /**
   * 检查是否在询价详情页面
   */
  const isInInquiryDetail = useCallback((inquiryId: number): boolean => {
    // 检查当前路径是否为询价详情页
    const isDetailPage = location.pathname.includes(`/inquiries/${inquiryId}`) || 
                         location.pathname.includes(`/quote-management/${inquiryId}`);
    
    // 检查当前正在查看的询价单ID是否匹配
    const isCurrentInquiry = currentInquiryIdRef.current && 
                            currentInquiryIdRef.current.toString() === inquiryId.toString();
    
    return isDetailPage || isCurrentInquiry;
  }, [location.pathname]);

  /**
   * 发送自定义事件到页面
   */
  const emitPageEvent = useCallback((eventName: string, data: any) => {
    window.dispatchEvent(new CustomEvent(eventName, { detail: data }));
  }, []);

  /**
   * 获取状态更新的Toast消息
   */
  const getStatusUpdateToastContent = useCallback((data: InquiryStatusUpdateEvent) => {
    const statusLabels: Record<string, Record<string, string>> = {
      quoted: {
        zh: '收到新报价',
        en: 'New Quote Received',
        es: 'Nueva Cotización Recibida'
      },
      confirmed: {
        zh: '报价已确认',
        en: 'Quote Confirmed',
        es: 'Cotización Confirmada'
      },
      declined: {
        zh: '报价被拒绝',
        en: 'Quote Declined',
        es: 'Cotización Rechazada'
      },
      cancelled: {
        zh: '询价已取消',
        en: 'Inquiry Cancelled',
        es: 'Consulta Cancelada'
      },
      expired: {
        zh: '询价已过期',
        en: 'Inquiry Expired',
        es: 'Consulta Expirada'
      }
    };

    const langKey = currentLanguage === 'zh' ? 'zh' : currentLanguage;
    const statusLabel = statusLabels[data.newStatus]?.[langKey] || 
                       statusLabels[data.newStatus]?.['zh'] || 
                       '状态更新';

    return {
      title: statusLabel,
      description: `询价单 ${data.inquiryNo}`
    };
  }, [currentLanguage]);

  /**
   * 处理收到的询价消息
   */
  const handleInquiryMessageReceived = useCallback((data: InquiryMessageEvent) => {
    console.log('🔔 收到询价消息推送:', data);

    // 如果用户正在查看该询价单详情页，直接推送到页面，不显示Toast
    if (isInInquiryDetail(data.inquiryId)) {
      console.log('📍 用户正在查看询价详情页，直接推送消息到页面');
      
      // 发送页面事件，让详情页组件接收消息
      emitPageEvent('newInquiryMessage', data);
      
      // 调用回调
      onMessageReceived?.(data);
    } else {
      console.log('📱 用户不在询价详情页，显示Toast通知');
      
      // 创建点击处理函数
      const handleToastClick = async () => {
        try {
          // 跳转到对应页面
          const targetUrl = data.senderCompanyType === 'buyer' 
            ? `/quote-management/${data.inquiryId}`
            : `/inquiries/${data.inquiryId}`;
          
          console.log('🔄 跳转到:', targetUrl);
          navigate(targetUrl);
          
          // 跳转后，让通知中心自动处理相关通知的已读状态
          // 通过全局事件通知，可以根据 inquiryId 和 messageId 来标记相关通知
          emitPageEvent('markInquiryNotificationRead', { 
            inquiryId: data.inquiryId, 
            messageId: data.messageId 
          });
        } catch (error) {
          console.error('处理Toast点击失败:', error);
        }
      };
      
      // 显示Toast通知
      toast({
        title: `来自 ${data.senderCompany} 的新消息`,
        description: data.message.length > 50 
          ? `${data.message.substring(0, 50)}...` 
          : data.message,
        variant: "default",
        onClick: handleToastClick
      });

      // 更新列表中的最新消息
      onListMessageUpdate?.(data.inquiryId, data);
      
      // 发送全局事件，通知其他组件（如通知中心）
      emitPageEvent('newInquiryMessage', data);
      
      // 调用回调
      onMessageReceived?.(data);
    }
  }, [isInInquiryDetail, emitPageEvent, onMessageReceived, onListMessageUpdate, toast, navigate]);

  /**
   * 处理询价状态更新
   */
  const handleInquiryStatusUpdated = useCallback((data: InquiryStatusUpdateEvent) => {
    console.log('📋 收到询价状态更新:', data);

    // 如果用户正在查看该询价单详情页，发送页面事件刷新数据
    if (isInInquiryDetail(data.inquiryId)) {
      console.log('📍 用户正在查看询价详情页，发送刷新事件');
      emitPageEvent('inquiryStatusRefresh', data);
    } else {
      console.log('📱 用户不在询价详情页，显示Toast通知');
      
      const toastContent = getStatusUpdateToastContent(data);
      
      // 创建点击处理函数
      const handleToastClick = async () => {
        try {
          // 跳转到对应页面
          const targetUrl = data.updatedBy.companyType === 'buyer' 
            ? `/quote-management/${data.inquiryId}`
            : `/inquiries/${data.inquiryId}`;
          
          console.log('🔄 跳转到:', targetUrl);
          navigate(targetUrl);
          
          // 跳转后，让通知中心自动处理相关通知的已读状态
          emitPageEvent('markInquiryStatusNotificationRead', { 
            inquiryId: data.inquiryId, 
            newStatus: data.newStatus 
          });
        } catch (error) {
          console.error('处理状态Toast点击失败:', error);
        }
      };
      
      // 显示Toast通知
      toast({
        title: toastContent.title,
        description: toastContent.description,
        variant: "default",
        onClick: handleToastClick
      });
    }

    // 发送全局事件，通知其他组件更新状态
    emitPageEvent('inquiryStatusChanged', data);
    
    // 调用回调
    onStatusUpdated?.(data);
  }, [isInInquiryDetail, emitPageEvent, onStatusUpdated, getStatusUpdateToastContent, toast, navigate]);

  // 注册全局事件监听器，与NotificationContext的WebSocket事件协作
  useEffect(() => {
    const handleGlobalMessageEvent = (event: CustomEvent) => {
      const messageData = event.detail as InquiryMessageEvent;
      handleInquiryMessageReceived(messageData);
    };

    const handleGlobalStatusEvent = (event: CustomEvent) => {
      const statusData = event.detail as InquiryStatusUpdateEvent;
      handleInquiryStatusUpdated(statusData);
    };

    // 监听全局事件
    window.addEventListener('inquiryMessageReceived', handleGlobalMessageEvent as EventListener);
    window.addEventListener('inquiryStatusUpdated', handleGlobalStatusEvent as EventListener);

    return () => {
      window.removeEventListener('inquiryMessageReceived', handleGlobalMessageEvent as EventListener);
      window.removeEventListener('inquiryStatusUpdated', handleGlobalStatusEvent as EventListener);
    };
  }, [handleInquiryMessageReceived, handleInquiryStatusUpdated]);

  return {
    emitPageEvent,
    isInInquiryDetail
  };
};