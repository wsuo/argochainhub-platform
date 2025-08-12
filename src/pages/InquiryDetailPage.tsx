import { useMemo, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/MockAuthContext";
import { useInquiryMessaging } from "@/hooks/useInquiryMessaging";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, AlertCircle, RefreshCw, MessageSquare } from "lucide-react";
import { InquiryService } from "@/services/inquiryService";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { InquiryHeader } from "@/components/inquiries/InquiryHeader";
import { InquiryItems } from "@/components/inquiries/InquiryItems";
import { QuoteSection } from "@/components/inquiries/QuoteSection";
import { CompanyInfo } from "@/components/inquiries/CompanyInfo";
import { InquiryMessageList } from "@/components/inquiry/InquiryMessageList";
import { SendMessageForm } from "@/components/inquiry/SendMessageForm";

const InquiryDetailPage = () => {
  const { t } = useTranslation();
  const { currentUserType, user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<any[]>([]);

  // 获取询价详情
  const {
    data: inquiryResponse,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['inquiry-detail', id],
    queryFn: () => InquiryService.getInquiryDetail(id!),
    enabled: !!id,
    staleTime: 30 * 1000,
  });

  // 获取消息列表
  const {
    data: messagesResponse,
    isLoading: isMessagesLoading,
    refetch: refetchMessages
  } = useQuery({
    queryKey: ['inquiry-messages', id],
    queryFn: () => InquiryService.getInquiryMessages(id!, { limit: 50, desc: false }),
    enabled: !!id,
    staleTime: 10 * 1000,
  });

  // 同步消息数据到本地状态
  useEffect(() => {
    if (messagesResponse?.data) {
      setMessages(messagesResponse.data);
    }
  }, [messagesResponse?.data]);

  // 初始化消息推送功能
  useInquiryMessaging({
    currentInquiryId: id,
    onMessageReceived: (messageData) => {
      console.log('📍 收到新消息，刷新消息列表:', messageData);
      // 刷新消息列表查询，获取最新数据
      refetchMessages();
    },
    onStatusUpdated: (statusData) => {
      console.log('📋 询价状态更新，刷新页面数据');
      // 刷新询价详情数据
      refetch();
    }
  });

  // 监听页面事件
  useEffect(() => {
    const handleInquiryMessageReceived = (event: CustomEvent) => {
      console.log('🎯 页面事件：收到询价消息', event.detail);
    };

    const handleInquiryStatusUpdated = (event: CustomEvent) => {
      console.log('🎯 页面事件：询价状态更新', event.detail);
    };

    window.addEventListener('newInquiryMessage', handleInquiryMessageReceived as EventListener);
    window.addEventListener('inquiryStatusRefresh', handleInquiryStatusUpdated as EventListener);

    return () => {
      window.removeEventListener('newInquiryMessage', handleInquiryMessageReceived as EventListener);
      window.removeEventListener('inquiryStatusRefresh', handleInquiryStatusUpdated as EventListener);
    };
  }, []);

  const inquiry = inquiryResponse?.data;

  // 处理锚点滚动 - 只有明确指定 #messages 时才滚动
  useEffect(() => {
    if (inquiry && location.hash === '#messages') {
      // 延迟执行确保DOM已渲染
      const timer = setTimeout(() => {
        const messagesElement = document.getElementById('messages');
        if (messagesElement) {
          messagesElement.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
          // 清除hash，避免重复滚动
          window.history.replaceState(null, '', window.location.pathname);
        }
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [inquiry, location.hash]);

  // 错误状态
  if (error) {
    return (
      <Layout userType={currentUserType}>
        <div className="max-w-4xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{t('inquiry.errorLoadingDetail')}</span>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('common.retry')}
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }

  // 加载状态
  if (isLoading) {
    return (
      <Layout userType={currentUserType}>
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-96 w-full" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!inquiry) {
    return (
      <Layout userType={currentUserType}>
        <div className="max-w-4xl mx-auto text-center py-12">
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            {t('inquiry.notFound')}
          </h3>
          <p className="text-muted-foreground mb-4">
            {t('inquiry.notFoundDesc')}
          </p>
          <Button onClick={() => navigate('/inquiries')}>
            {t('inquiry.backToList')}
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout userType={currentUserType}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 返回按钮 */}
        <Button
          variant="ghost"
          onClick={() => navigate('/inquiries')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('inquiry.backToList')}
        </Button>

          {/* 询价头部信息 */}
          <InquiryHeader inquiry={inquiry} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 主内容区 */}
            <div className="lg:col-span-2 space-y-6">
              {/* 产品明细 */}
              <InquiryItems items={inquiry.items} />
              
              {/* 报价区域 */}
              <QuoteSection inquiry={inquiry} />

              {/* 消息历史 */}
              <div id="messages">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5" />
                      {t('inquiry.communicationHistory')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <InquiryMessageList
                      messages={messages}
                      isLoading={isMessagesLoading}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* 发送消息表单 */}
              <Card>
                <SendMessageForm
                  inquiryId={inquiry.id}
                  onMessageSent={() => {
                    // 重新获取消息列表
                    queryClient.invalidateQueries({ queryKey: ['inquiry-messages', inquiry.id] });
                  }}
                />
              </Card>
            </div>

            {/* 侧边栏 */}
            <div className="space-y-6">
              {/* 采购商信息 */}
              <CompanyInfo 
                company={inquiry.buyer} 
                title={t('inquiry.buyerInfo')}
              />
              
              {/* 供应商信息 */}
              <CompanyInfo 
                company={inquiry.supplier} 
                title={t('inquiry.supplierInfo')}
              />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default InquiryDetailPage;