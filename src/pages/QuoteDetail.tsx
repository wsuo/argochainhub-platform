import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useQuote } from '@/hooks/useQuote';
import { useQuoteMessages, useSendMessage } from '@/hooks/useQuoteActions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, MessageSquare, Send, FileText, Download, Edit, Loader2 } from 'lucide-react';
import { InquiryHeader } from '@/components/inquiries/InquiryHeader';
import { InquiryItems } from '@/components/inquiries/InquiryItems';
import { CompanyInfo } from '@/components/inquiries/CompanyInfo';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/contexts/MockAuthContext';
import { dictionaryService } from '@/services/dictionaryService';
import { format } from 'date-fns';
import { zhCN, enUS, es } from 'date-fns/locale';

// 供应商报价区块组件
const SupplierQuoteSection = ({ quote }: { quote: any }) => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();

  // 获取询价状态字典
  const { data: statusDict = [] } = useQuery({
    queryKey: ['inquiry-status-dict'],
    queryFn: () => dictionaryService.getInquiryStatuses(),
    staleTime: 10 * 60 * 1000, // 10分钟缓存
  });

  // 根据当前语言获取状态显示文本
  const getStatusLabel = (statusCode: string): string => {
    const status = statusDict.find(s => s.code === statusCode);
    if (!status) return statusCode;
    
    const langKey = currentLanguage === 'zh' ? 'zh-CN' : currentLanguage;
    return status.name?.[langKey] || status.name?.['zh-CN'] || status.code;
  };

  const getLocalizedText = (text: any): string => {
    if (typeof text === 'string') return text;
    const langKey = currentLanguage === 'zh' ? 'zh-CN' : 'en';
    return text?.[langKey] || text?.['zh-CN'] || '';
  };

  if (!quote.quoteDetails && quote.status === 'pending_quote') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{t('quote.details.title', '报价详情')}</span>
            <Badge variant="secondary">{getStatusLabel('pending_quote')}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {t('quote.details.pending.title', '尚未提交报价')}
            </h3>
            <p className="text-muted-foreground mb-6">
              {t('quote.details.pending.description', '请尽快处理这个询价单，避免错过商机。')}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button>
                <Edit className="h-4 w-4 mr-2" />
                {t('quote.actions.createQuote', '立即报价')}
              </Button>
              <Button variant="outline">
                {t('quote.actions.saveDraft', '保存草稿')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const quoteDetails = quote.quoteDetails;
  if (!quoteDetails) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{t('quote.details.title', '报价详情')}</span>
          <Badge>{getStatusLabel('quoted')}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-muted-foreground mb-1">
              {t('quote.details.price', '报价')}
            </div>
            <div className="text-lg font-medium">
              {quoteDetails.currency || 'USD'} {quoteDetails.totalPrice?.toLocaleString() || '-'}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">
              {t('quote.details.validUntil', '有效期至')}
            </div>
            <div className="text-lg font-medium">
              {quoteDetails.validUntil || '-'}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">
              {t('quote.details.paymentMethod', '付款条款')}
            </div>
            <div className="text-lg font-medium">
              {quote.details?.paymentMethod || '-'}
            </div>
          </div>
        </div>

        {quoteDetails.supplierRemarks && (
          <div className="mt-6">
            <div className="text-sm text-muted-foreground mb-2">
              {t('quote.details.supplierRemarks', '供应商备注')}
            </div>
            <div className="text-foreground whitespace-pre-line p-3 bg-muted/50 rounded-lg">
              {quoteDetails.supplierRemarks}
            </div>
          </div>
        )}

        {quoteDetails.termsAndConditions && (
          <div className="mt-4">
            <div className="text-sm text-muted-foreground mb-2">
              {t('quote.details.termsAndConditions', '条款与条件')}
            </div>
            <div className="text-foreground whitespace-pre-line p-3 bg-muted/50 rounded-lg">
              {quoteDetails.termsAndConditions}
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="default">
            <Edit className="h-4 w-4 mr-2" />
            {t('quote.actions.editQuote', '修改报价')}
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            {t('quote.actions.exportQuote', '导出报价')}
          </Button>
          <Button variant="ghost">
            <MessageSquare className="h-4 w-4 mr-2" />
            {t('quote.actions.sendMessage', '发送消息')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// 消息区块组件
const MessageSection = ({ inquiryId }: { inquiryId: string }) => {
  const { t } = useTranslation();
  const [newMessage, setNewMessage] = useState('');
  const { data: messages, refetch } = useQuoteMessages(inquiryId, 1, 20);
  const sendMessageMutation = useSendMessage(inquiryId);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages?.data]);
  
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    try {
      await sendMessageMutation.mutateAsync({ message: newMessage.trim() });
      setNewMessage('');
      refetch();
    } catch (error) {
      console.error('Send message failed:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 渲染消息项
  const renderMessage = (message: any, index: number) => {
    const isCurrentUser = message.sender.id === user?.id;
    const showSender = index === 0 || messages?.data[index - 1]?.sender.id !== message.sender.id;
    const showTime = index === messages?.data?.length - 1 || 
                    messages?.data[index + 1]?.sender.id !== message.sender.id ||
                    (new Date(messages?.data[index + 1]?.createdAt).getTime() - new Date(message.createdAt).getTime()) > 5 * 60 * 1000;

    return (
      <div key={message.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-3`}>
        <div className={`max-w-[75%] ${isCurrentUser ? 'order-2' : 'order-1'}`}>
          {/* 发送者信息 */}
          {showSender && (
            <div className={`mb-1 text-xs text-muted-foreground ${isCurrentUser ? 'text-right' : 'text-left'}`}>
              <span className="font-medium">{message.sender.name}</span>
              <span className="opacity-75 ml-1">
                ({message.sender.userType === 'buyer' ? '采购商' : '供应商'})
              </span>
            </div>
          )}
          
          {/* 消息内容 */}
          <div
            className={`rounded-lg px-3 py-2 shadow-sm text-sm leading-relaxed ${
              isCurrentUser
                ? 'bg-green-600 text-white ml-2'
                : 'bg-gray-100 text-gray-800 mr-2'
            }`}
          >
            <p className="whitespace-pre-wrap break-words">
              {message.message}
            </p>
          </div>
          
          {/* 时间戳 */}
          {showTime && (
            <div className={`text-xs text-muted-foreground mt-1 ${isCurrentUser ? 'text-right mr-2' : 'text-left ml-2'}`}>
              {format(new Date(message.createdAt), 'MM-dd HH:mm')}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          {t('quote.messages.title', '沟通记录')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* 消息列表 */}
        <ScrollArea className="h-96 w-full pr-4">
          <div className="p-4">
            {messages?.data && messages.data.length > 0 ? (
              <div className="space-y-2">
                {messages.data.map((message, index) => renderMessage(message, index))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">{t('quote.messages.empty', '暂无沟通记录')}</p>
                <p className="text-sm mt-1">发送第一条消息开始沟通吧</p>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </ScrollArea>

        {/* 发送消息表单 */}
        <div className="border-t p-4 space-y-3">
          <Textarea
            placeholder={t('quote.messages.placeholder', '输入消息内容...')}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[60px] resize-none border-gray-200 focus:border-green-500 focus:ring-green-500"
            disabled={sendMessageMutation.isPending}
            maxLength={1000}
          />
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {newMessage.length}/1000 · 按Enter发送，Shift+Enter换行
            </span>
            
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sendMessageMutation.isPending}
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {sendMessageMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-1" />
              )}
              {t('quote.messages.send', '发送')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function QuoteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: quote, isLoading, error, refetch } = useQuote(id || '');

  // 错误处理
  const errorHandler = useErrorHandler({
    module: 'quote',
    action: 'read',
    resourceType: 'detail',
    resourceId: id
  });

  useEffect(() => {
    if (error && !errorHandler.hasError) {
      errorHandler.handleError(error);
    }
  }, [error, errorHandler]);

  useEffect(() => {
    const title = quote?.inquiryNo 
      ? `${t('quote.detail.title', '报价详情')} | ${quote.inquiryNo}` 
      : t('quote.detail.title', '报价详情');
    document.title = title;
  }, [quote?.inquiryNo, t]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-28 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-60 w-full" />
            <Skeleton className="h-60 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (errorHandler.hasError) {
    return (
      <ErrorBoundary
        error={errorHandler.parsedError}
        loading={isLoading}
        onRetry={() => errorHandler.retry(refetch)}
        onNavigateBack={() => errorHandler.navigateBack('/quote-management')}
      />
    );
  }

  if (!quote) {
    return (
      <Card>
        <CardContent className="py-10 text-center space-y-4">
          <div className="text-muted-foreground">
            {t('quote.detail.notFound', '未找到该报价，或加载失败。')}
          </div>
          <Button onClick={() => navigate('/quote-management')}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t('quote.actions.backToList', '返回报价管理')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 返回按钮和标题 */}
        <div>
          <Button 
            variant="ghost" 
            onClick={() => navigate('/quote-management')} 
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('quote.actions.backToList', '返回列表')}
          </Button>
          <h1 className="text-2xl font-bold">
            {t('quote.detail.title', '报价详情')}
          </h1>
        </div>

        {/* 询价头部信息 */}
        <InquiryHeader inquiry={quote} />

        {/* 主要内容区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧内容 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 商品明细 */}
            <InquiryItems items={quote.items} />
            
            {/* 供应商报价区块 */}
            <SupplierQuoteSection quote={quote} />
            
            {/* 消息沟通 */}
            <MessageSection inquiryId={quote.id} />
          </div>
          
          {/* 右侧信息 */}
          <div className="space-y-6">
            {/* 采购商信息 */}
            <CompanyInfo 
              company={quote.buyer} 
              title={t('quote.buyer.title', '采购商信息')} 
            />
            
            {/* 供应商信息 */}
            {quote.supplier && (
              <CompanyInfo 
                company={quote.supplier} 
                title={t('quote.supplier.title', '供应商信息')} 
              />
            )}
          </div>
        </div>
      </div>
    );
  }