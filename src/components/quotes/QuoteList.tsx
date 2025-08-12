import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { useInquiryMessaging } from '@/hooks/useInquiryMessaging';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination';
import { 
  Eye, 
  MessageSquare, 
  Clock, 
  Package, 
  AlertTriangle,
  CheckSquare,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import { useQuotes } from '@/hooks/useQuotes';
import { useDeclineQuotes, useUpdatePriority } from '@/hooks/useQuoteActions';
import { useLanguage } from '@/hooks/useLanguage';
import { dictionaryService } from '@/services/dictionaryService';
import type { QuoteFilters, Quote } from '@/types/quote';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { useErrorHandler } from '@/hooks/useErrorHandler';

interface QuoteListProps {
  filters: QuoteFilters;
}

export const QuoteList = ({ filters }: QuoteListProps) => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedQuotes, setSelectedQuotes] = useState<string[]>([]);
  const [showBatchActions, setShowBatchActions] = useState(false);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  
  const { data, isLoading, error, refetch } = useQuotes(filters, currentPage, 10);
  
  const declineQuotesMutation = useDeclineQuotes();
  const updatePriorityMutation = useUpdatePriority();

  // 初始化消息推送功能
  useInquiryMessaging({
    onListMessageUpdate: (inquiryId, messageData) => {
      // 更新供应端报价列表中的最新消息
      setQuotes(prev => {
        const updated = prev.map(quote => {
          if (quote.id === inquiryId.toString()) {
            return {
              ...quote,
              recentMessages: [
                {
                  id: messageData.messageId,
                  message: messageData.message,
                  createdAt: messageData.timestamp,
                  senderId: messageData.senderId,
                  sender: {
                    id: messageData.senderId,
                    name: messageData.senderName,
                    userType: messageData.senderCompanyType as 'buyer' | 'supplier',
                    company: {
                      id: messageData.senderId,
                      name: {
                        'zh-CN': messageData.senderCompany,
                        'en': messageData.senderCompany,
                        'es': messageData.senderCompany
                      },
                      type: messageData.senderCompanyType as 'buyer' | 'supplier'
                    }
                  }
                },
                ...quote.recentMessages?.slice(0, 4) || []
              ]
            };
          }
          return quote;
        });
        return updated;
      });
    }
  });

  // 同步服务器数据到本地状态
  useEffect(() => {
    if (data?.data) {
      setQuotes(data.data);
    }
  }, [data?.data]);

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

  // 错误处理
  const errorHandler = useErrorHandler({
    module: 'quote',
    action: 'read',
    resourceType: 'list'
  });

  React.useEffect(() => {
    if (error && !errorHandler.hasError) {
      errorHandler.handleError(error);
    }
  }, [error, errorHandler]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_quote':
        return 'bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900 dark:text-orange-300';
      case 'quoted':
        return 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900 dark:text-blue-300';
      case 'confirmed':
        return 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900 dark:text-green-300';
      case 'declined':
        return 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900 dark:text-red-300';
      case 'cancelled':
        return 'bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300';
      case 'expired':
        return 'bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 dark:text-red-400';
      case 'high':
        return 'text-orange-600 dark:text-orange-400';
      case 'normal':
        return 'text-blue-600 dark:text-blue-400';
      case 'low':
        return 'text-gray-600 dark:text-gray-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getDateLocale = () => {
    return currentLanguage === 'zh' ? zhCN : enUS;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const locale = getDateLocale();
    
    if (currentLanguage === 'zh') {
      return format(date, 'yyyy年MM月dd日', { locale });
    }
    return format(date, 'MMM dd, yyyy', { locale });
  };

  const getLocalizedText = (text: { [key: string]: string } | string) => {
    if (typeof text === 'string') return text;
    return text[currentLanguage === 'zh' ? 'zh-CN' : 'en'] || text['zh-CN'] || '';
  };

  const isQuoteExpired = (deadline: string) => {
    return new Date(deadline) < new Date();
  };

  const handleSelectQuote = (quoteId: string, checked: boolean) => {
    setSelectedQuotes(prev => 
      checked 
        ? [...prev, quoteId]
        : prev.filter(id => id !== quoteId)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && quotes) {
      setSelectedQuotes(quotes.map(quote => quote.id));
    } else {
      setSelectedQuotes([]);
    }
  };

  const handleBatchDecline = async () => {
    if (selectedQuotes.length === 0) return;
    
    try {
      const inquiryIds = selectedQuotes.map(id => parseInt(id));
      await declineQuotesMutation.mutateAsync({
        inquiryIds,
        reason: '暂时无法处理此询价'
      });
      setSelectedQuotes([]);
      setShowBatchActions(false);
    } catch (error) {
      console.error('Batch decline failed:', error);
    }
  };

  const handleBatchUpdatePriority = async (priority: 'low' | 'normal' | 'high' | 'urgent') => {
    if (selectedQuotes.length === 0) return;
    
    try {
      const inquiryIds = selectedQuotes.map(id => parseInt(id));
      await updatePriorityMutation.mutateAsync({
        inquiryIds,
        priority
      });
      setSelectedQuotes([]);
      setShowBatchActions(false);
    } catch (error) {
      console.error('Batch update priority failed:', error);
    }
  };

  const handleViewQuote = (quoteId: string) => {
    navigate(`/quote-management/${quoteId}`);
  };

  // 错误状态处理
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('quote.list', '报价列表')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!quotes || quotes.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Package className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-medium text-foreground">
              {t('quote.empty', '暂无报价数据')}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('quote.empty.description', '没有找到符合条件的报价单')}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalPages = data?.meta?.totalPages || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{t('quote.list', '报价列表')}</span>
          <div className="flex items-center gap-4">
            <Badge variant="secondary">
              {t('quote.total', { count: data?.meta?.totalItems || 0 }, `共 ${data?.meta?.totalItems || 0} 条`)}
            </Badge>
            {selectedQuotes.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  已选择 {selectedQuotes.length} 项
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowBatchActions(!showBatchActions)}
                >
                  批量操作
                </Button>
              </div>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      {/* 批量操作按钮组 */}
      {showBatchActions && selectedQuotes.length > 0 && (
        <div className="px-6 pb-4">
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground">批量操作：</span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleBatchDecline}
              disabled={declineQuotesMutation.isPending}
            >
              <X className="h-4 w-4 mr-1" />
              拒绝
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBatchUpdatePriority('high')}
              disabled={updatePriorityMutation.isPending}
            >
              设为高优先级
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBatchUpdatePriority('normal')}
              disabled={updatePriorityMutation.isPending}
            >
              设为普通优先级
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSelectedQuotes([]);
                setShowBatchActions(false);
              }}
            >
              取消
            </Button>
          </div>
        </div>
      )}

      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedQuotes.length === quotes.length}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>{t('quote.inquiryNo', '询价单号')}</TableHead>
                <TableHead>{t('quote.status', '状态')}</TableHead>
                <TableHead>{t('quote.buyer', '采购商')}</TableHead>
                <TableHead>{t('quote.items', '商品数量')}</TableHead>
                <TableHead>{t('quote.priority', '优先级')}</TableHead>
                <TableHead>{t('quote.deadline', '截止时间')}</TableHead>
                <TableHead>{t('quote.createdAt', '创建时间')}</TableHead>
                <TableHead>{t('quote.actions', '操作')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotes.map((quote: Quote) => (
                <TableRow key={quote.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedQuotes.includes(quote.id)}
                      onCheckedChange={(checked) => 
                        handleSelectQuote(quote.id, checked as boolean)
                      }
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {quote.inquiryNo}
                      {isQuoteExpired(quote.deadline) && (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(quote.status)}>
                      {getStatusLabel(quote.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium">
                        {getLocalizedText(quote.buyer.name)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {quote.buyer.profile.address}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Package className="h-4 w-4" />
                      <span>{quote.items.length}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={getPriorityColor(quote.details.supplierPriority)}>
                      {t(`quote.priority.${quote.details.supplierPriority || 'normal'}`, 
                         quote.details.supplierPriority || '普通')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span className={isQuoteExpired(quote.deadline) ? 'text-red-500' : ''}>
                        {formatDate(quote.deadline)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(quote.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewQuote(quote.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        {t('quote.view', '查看')}
                      </Button>
                      {quote.recentMessages && quote.recentMessages.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewQuote(quote.id)}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          {quote.recentMessages.length}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="mt-6">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    className={
                      currentPage === 1 
                        ? 'pointer-events-none opacity-50' 
                        : 'cursor-pointer'
                    }
                  />
                </PaginationItem>
                
                {[...Array(totalPages)].map((_, i) => (
                  <PaginationItem key={i + 1}>
                    <PaginationLink
                      onClick={() => setCurrentPage(i + 1)}
                      isActive={currentPage === i + 1}
                      className="cursor-pointer"
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    className={
                      currentPage === totalPages 
                        ? 'pointer-events-none opacity-50' 
                        : 'cursor-pointer'
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </CardContent>
    </Card>
  );
};