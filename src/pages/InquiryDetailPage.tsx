import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/MockAuthContext";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, AlertCircle, RefreshCw, MessageSquare } from "lucide-react";
import { InquiryService } from "@/services/inquiryService";
import { useParams, useNavigate } from "react-router-dom";
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
  const queryClient = useQueryClient();

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
    isLoading: isMessagesLoading
  } = useQuery({
    queryKey: ['inquiry-messages', id],
    queryFn: () => InquiryService.getInquiryMessages(id!, { limit: 50, desc: false }),
    enabled: !!id,
    staleTime: 10 * 1000,
  });

  const inquiry = inquiryResponse?.data;
  const messages = useMemo(() => messagesResponse?.data || [], [messagesResponse?.data]);

  // 错误状态
  if (error) {
    return (
      <Layout userType={currentUserType}>
        <main className="flex-1 p-6 bg-gradient-to-br from-slate-50 via-agro-green-light/30 to-agro-blue-light/40 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-agro-blue/8 pointer-events-none" />
          <div className="relative z-10 max-w-4xl mx-auto">
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
        </main>
      </Layout>
    );
  }

  // 加载状态
  if (isLoading) {
    return (
      <Layout userType={currentUserType}>
        <main className="flex-1 p-6 bg-gradient-to-br from-slate-50 via-agro-green-light/30 to-agro-blue-light/40 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-agro-blue/8 pointer-events-none" />
          <div className="relative z-10 max-w-6xl mx-auto space-y-6">
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
        </main>
      </Layout>
    );
  }

  if (!inquiry) {
    return (
      <Layout userType={currentUserType}>
        <main className="flex-1 p-6">
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
        </main>
      </Layout>
    );
  }

  return (
    <Layout userType={currentUserType}>
      <main className="flex-1 p-6 bg-gradient-to-br from-slate-50 via-agro-green-light/30 to-agro-blue-light/40 relative overflow-auto">
        {/* 装饰性渐变叠层 */}
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-agro-blue/8 pointer-events-none" />
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-radial from-primary/10 via-primary/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-radial from-agro-blue/8 via-agro-blue/4 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        {/* 内容区域 */}
        <div className="relative z-10 max-w-6xl mx-auto space-y-6">
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
      </main>
    </Layout>
  );
};

export default InquiryDetailPage;