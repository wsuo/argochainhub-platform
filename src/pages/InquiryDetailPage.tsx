import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/contexts/MockAuthContext";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowLeft,
  MessageSquare, 
  Clock, 
  Building2, 
  Package,
  MapPin,
  CreditCard,
  FileText,
  User,
  Send,
  AlertCircle,
  RefreshCw,
  CheckCircle2
} from "lucide-react";
import { InquiryService } from "@/services/inquiryService";
import { dictionaryService, DictionaryItem } from "@/services/dictionaryService";
import { MultiLanguageText, InquiryMessage } from "@/types/inquiry";
import { InquiryStatusBadge } from "@/components/inquiry/InquiryStatusBadge";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const InquiryDetailPage = () => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const { currentUserType, user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [newMessage, setNewMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 获取多语言文本的辅助函数
  const getLocalizedText = (text: MultiLanguageText): string => {
    const langKey = currentLanguage as keyof MultiLanguageText;
    return text[langKey] || text['zh-CN'];
  };

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
  const messages = messagesResponse?.data || [];

  // 发送消息的mutation
  const sendMessageMutation = useMutation({
    mutationFn: (message: string) => InquiryService.sendMessage(id!, { message }),
    onMutate: () => {
      setIsSendingMessage(true);
    },
    onSuccess: () => {
      setNewMessage('');
      toast({
        title: t('inquiry.messageSuccess'),
        description: t('inquiry.messageSuccessDesc'),
      });
      // 重新获取消息列表
      queryClient.invalidateQueries({ queryKey: ['inquiry-messages', id] });
      queryClient.invalidateQueries({ queryKey: ['inquiry-detail', id] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: t('inquiry.messageFailed'),
        description: error.message || t('inquiry.messageFailedDesc'),
      });
    },
    onSettled: () => {
      setIsSendingMessage(false);
    }
  });

  // 处理发送消息
  const handleSendMessage = () => {
    const trimmedMessage = newMessage.trim();
    if (!trimmedMessage) return;
    
    if (trimmedMessage.length > 1000) {
      toast({
        variant: "destructive",
        title: t('inquiry.messageTooLong'),
        description: t('inquiry.messageTooLongDesc'),
      });
      return;
    }

    sendMessageMutation.mutate(trimmedMessage);
  };

  // 处理键盘快捷键
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 根据URL hash滚动到消息区域
  useEffect(() => {
    if (window.location.hash === '#messages') {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    }
  }, [inquiry]);

  // 渲染消息项
  const renderMessage = (message: InquiryMessage, index: number) => {
    const isCurrentUser = message.senderId === user?.id;
    const showSender = index === 0 || messages[index - 1]?.senderId !== message.senderId;

    return (
      <div key={message.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-[70%] ${isCurrentUser ? 'order-2' : 'order-1'}`}>
          {showSender && (
            <div className={`flex items-center gap-2 mb-1 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex items-center gap-2 text-xs text-muted-foreground ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
                <User className="h-3 w-3" />
                <span>{message.sender.name}</span>
                <span>·</span>
                <span>{getLocalizedText(message.sender.company.name)}</span>
              </div>
            </div>
          )}
          <div
            className={`rounded-lg px-4 py-3 ${
              isCurrentUser
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted'
            }`}
          >
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.message}
            </p>
          </div>
          <div className={`text-xs text-muted-foreground mt-1 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
            {InquiryService.formatDateTime(message.createdAt)}
          </div>
        </div>
      </div>
    );
  };

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
          <div className="relative z-10 max-w-4xl mx-auto space-y-6">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-96 w-full" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
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
      <main className="flex-1 p-6 bg-gradient-to-br from-slate-50 via-agro-green-light/30 to-agro-blue-light/40 relative overflow-hidden">
        {/* 装饰性渐变叠层 */}
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-agro-blue/8 pointer-events-none" />
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-radial from-primary/10 via-primary/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-radial from-agro-blue/8 via-agro-blue/4 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        {/* 内容区域 */}
        <div className="relative z-10 max-w-6xl mx-auto">
          {/* 返回按钮 */}
          <Button
            variant="ghost"
            onClick={() => navigate('/inquiries')}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('inquiry.backToList')}
          </Button>

          {/* 询价概览 */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl mb-2">
                    {inquiry.inquiryNo}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-4 text-base">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {t('inquiry.deadline')}: {InquiryService.formatDate(inquiry.deadline)}
                    </div>
                    <span className="text-muted-foreground">
                      ({InquiryService.getTimeRemaining(inquiry.deadline)})
                    </span>
                  </CardDescription>
                </div>
                <InquiryStatusBadge 
                  status={inquiry.status} 
                  className="text-base px-3 py-1"
                />
              </div>
            </CardHeader>
          </Card>

          {/* 详情内容 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* 基本信息 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {t('inquiry.basicInfo')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 供应商信息 */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{t('inquiry.supplier')}:</span>
                  </div>
                  <p className="text-lg pl-6">{getLocalizedText(inquiry.supplier.name)}</p>
                </div>

                <Separator />

                {/* 交易条件 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{t('inquiry.deliveryLocation')}:</span>
                    </div>
                    <p className="pl-6">{inquiry.details.deliveryLocation}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{t('inquiry.tradeTerms')}:</span>
                    </div>
                    <p className="pl-6">{inquiry.details.tradeTerms}</p>
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center gap-2 mb-1">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{t('inquiry.paymentMethod')}:</span>
                    </div>
                    <p className="pl-6">{inquiry.details.paymentMethod}</p>
                  </div>
                </div>

                {/* 采购商备注 */}
                {inquiry.details.buyerRemarks && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-2">{t('inquiry.buyerRemarks')}:</h4>
                      <p className="text-muted-foreground leading-relaxed">
                        {inquiry.details.buyerRemarks}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* 产品明细 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  {t('inquiry.productDetails')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {inquiry.items.map((item, index) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-medium text-lg">
                          {getLocalizedText(item.productSnapshot.name)}
                        </h4>
                        <span className="text-sm text-muted-foreground">#{index + 1}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">{t('products.formulation')}:</span>
                          <span className="ml-2 font-medium">{item.productSnapshot.formulation}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('products.totalContent')}:</span>
                          <span className="ml-2 font-medium">{item.productSnapshot.totalContent}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('inquiry.quantity')}:</span>
                          <span className="ml-2 font-medium">{item.quantity} {item.unit}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-muted-foreground">{t('inquiry.packagingReq')}:</span>
                          <span className="ml-2 font-medium">{item.packagingReq}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 报价信息 */}
                {inquiry.quoteDetails && (
                  <>
                    <Separator className="my-4" />
                    <div className="bg-gradient-to-r from-primary/10 to-agro-blue/10 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        <h4 className="font-medium text-lg">{t('inquiry.quoteDetails')}</h4>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">{t('inquiry.totalPrice')}:</span>
                          <span className="text-2xl font-bold text-primary">
                            {InquiryService.formatPrice(inquiry.quoteDetails.totalPrice)}
                          </span>
                        </div>
                        
                        {inquiry.quoteDetails.validUntil && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">{t('inquiry.validUntil')}:</span>
                            <span>{InquiryService.formatDate(inquiry.quoteDetails.validUntil)}</span>
                          </div>
                        )}
                        
                        {inquiry.quoteDetails.supplierRemarks && (
                          <div>
                            <h5 className="font-medium mb-1">{t('inquiry.supplierRemarks')}:</h5>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {inquiry.quoteDetails.supplierRemarks}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 消息区域 */}
          <Card id="messages">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                {t('inquiry.communicationHistory')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96 w-full pr-4 mb-4">
                {isMessagesLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex justify-start">
                        <Skeleton className="h-16 w-3/4" />
                      </div>
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>{t('inquiry.noMessages')}</p>
                    <p className="text-sm">{t('inquiry.noMessagesDesc')}</p>
                  </div>
                ) : (
                  <div>
                    {messages.map((message, index) => renderMessage(message, index))}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </ScrollArea>

              {/* 发送消息表单 */}
              <div className="border-t pt-4">
                <div className="flex gap-3">
                  <Textarea
                    placeholder={t('inquiry.typeMessage')}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 min-h-[60px] resize-none"
                    disabled={isSendingMessage}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || isSendingMessage}
                    className="self-end px-4"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {t('inquiry.messageHint')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </Layout>
  );
};

export default InquiryDetailPage;