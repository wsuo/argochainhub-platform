import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/contexts/MockAuthContext";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  FileText, 
  MessageSquare, 
  Clock, 
  Building2, 
  Package,
  AlertCircle,
  RefreshCw,
  Filter,
  Search,
  TrendingUp,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { InquiryService } from "@/services/inquiryService";
import { dictionaryService, DictionaryItem } from "@/services/dictionaryService";
import { Inquiry, InquiryStatus, MultiLanguageText } from "@/types/inquiry";
import { InquiryStatusBadge } from "@/components/inquiry/InquiryStatusBadge";
import { useNavigate, Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const InquiryResponsePage = () => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const { currentUserType } = useAuth();
  const navigate = useNavigate();
  
  const [statusFilter, setStatusFilter] = useState<InquiryStatus | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // 获取多语言文本的辅助函数
  const getLocalizedText = (text: MultiLanguageText): string => {
    const langKey = currentLanguage as keyof MultiLanguageText;
    return text[langKey] || text['zh-CN'];
  };

  // 获取询价状态字典数据
  const { data: statusDict = [] } = useQuery({
    queryKey: ['inquiry-status-dict'],
    queryFn: () => dictionaryService.getInquiryStatuses(),
    staleTime: 10 * 60 * 1000, // 10分钟缓存
  });

  // 获取状态显示文本
  const getStatusLabel = (statusCode: string): string => {
    const statusItem = statusDict.find((item: DictionaryItem) => item.code === statusCode);
    if (!statusItem) return statusCode;

    // 根据当前语言获取对应的显示文本
    const langKey = currentLanguage as keyof typeof statusItem.name;
    return statusItem.name[langKey] || statusItem.name['zh-CN'] || statusCode;
  };

  // 获取询价列表 (供应商看到的是发给他们的询价)
  const {
    data: inquiryResponse,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['supplier-inquiries', currentPage, statusFilter],
    queryFn: () => InquiryService.getInquiries({
      page: currentPage,
      limit: 20,
      ...(statusFilter && { status: statusFilter })
    }),
    staleTime: 30 * 1000,
  });

  const inquiries = inquiryResponse?.data || [];
  const meta = inquiryResponse?.meta;

  // 计算统计数据
  const stats = {
    total: inquiries.length,
    pending: inquiries.filter(i => i.status === 'pending_quote').length,
    quoted: inquiries.filter(i => i.status === 'quoted').length,
    confirmed: inquiries.filter(i => i.status === 'confirmed').length,
  };

  // 处理状态筛选
  const handleStatusFilter = (status: string) => {
    setStatusFilter(status as InquiryStatus);
    setCurrentPage(1);
  };

  // 获取优先级颜色
  const getPriorityColor = (inquiry: Inquiry) => {
    const remainingDays = Math.ceil((new Date(inquiry.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (remainingDays <= 1) return 'border-red-500';
    if (remainingDays <= 3) return 'border-orange-500';
    if (remainingDays <= 7) return 'border-yellow-500';
    return 'border-border';
  };

  // 渲染询价卡片 (供应商视角)
  const renderInquiryCard = (inquiry: Inquiry) => (
    <Card key={inquiry.id} className={`hover:shadow-lg transition-all duration-300 border-l-4 ${getPriorityColor(inquiry)} hover:border-primary/30`}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg mb-1 flex items-center gap-2">
              {inquiry.inquiryNo}
              {inquiry.status === 'pending_quote' && (
                <Badge variant="destructive" className="text-xs">
                  {t('inquiry.urgent')}
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              {t('inquiry.deadline')}: {InquiryService.formatDate(inquiry.deadline)}
              <span className="text-xs font-medium text-orange-600">
                ({InquiryService.getTimeRemaining(inquiry.deadline)})
              </span>
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            <InquiryStatusBadge status={inquiry.status} />
            {inquiry.status === 'pending_quote' && (
              <span className="text-xs text-muted-foreground">{t('inquiry.awaitingResponse')}</span>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 采购商信息 */}
        <div className="flex items-center gap-2 text-sm">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{t('inquiry.buyer')}:</span>
          <span>{getLocalizedText(inquiry.buyer.name)}</span>
        </div>

        {/* 产品信息 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{t('inquiry.products')}:</span>
          </div>
          <div className="pl-6 space-y-1">
            {inquiry.items.slice(0, 2).map((item) => (
              <div key={item.id} className="text-sm">
                <span className="font-medium">{getLocalizedText(item.productSnapshot.name)}</span>
                <span className="text-muted-foreground ml-2">
                  - {item.quantity} {item.unit}
                </span>
              </div>
            ))}
            {inquiry.items.length > 2 && (
              <div className="text-xs text-muted-foreground">
                {t('inquiry.andMoreItems', { count: inquiry.items.length - 2 })}
              </div>
            )}
          </div>
        </div>

        {/* 交易条件快览 */}
        <div className="bg-muted/30 rounded-lg p-3 space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-muted-foreground">{t('inquiry.deliveryLocation')}:</span>
              <div className="font-medium truncate">{inquiry.details.deliveryLocation}</div>
            </div>
            <div>
              <span className="text-muted-foreground">{t('inquiry.tradeTerms')}:</span>
              <div className="font-medium">{inquiry.details.tradeTerms}</div>
            </div>
          </div>
        </div>

        {/* 报价状态或报价信息 */}
        {inquiry.quoteDetails ? (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/50 dark:to-blue-950/50 rounded-lg p-3 border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800 dark:text-green-200">
                  {t('inquiry.hasQuoted')}
                </span>
              </div>
              <span className="text-lg font-bold text-primary">
                {InquiryService.formatPrice(inquiry.quoteDetails.totalPrice)}
              </span>
            </div>
            {inquiry.quoteDetails.validUntil && (
              <div className="text-xs text-muted-foreground">
                {t('inquiry.validUntil')}: {InquiryService.formatDate(inquiry.quoteDetails.validUntil)}
              </div>
            )}
          </div>
        ) : inquiry.status === 'pending_quote' ? (
          <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/50 dark:to-red-950/50 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                {t('inquiry.needQuote')}
              </span>
            </div>
          </div>
        ) : null}

        {/* 最近消息 */}
        {inquiry.recentMessages && inquiry.recentMessages.length > 0 && (
          <div className="border-t pt-3">
            <div className="flex items-center gap-2 text-sm mb-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{t('inquiry.recentMessage')}:</span>
            </div>
            <div className="text-sm text-muted-foreground line-clamp-2 pl-6">
              {inquiry.recentMessages[0].message}
            </div>
            <div className="text-xs text-muted-foreground pl-6 mt-1">
              {inquiry.recentMessages[0].sender.name} · {InquiryService.formatDateTime(inquiry.recentMessages[0].createdAt)}
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-2 pt-2">
          <Button
            asChild
            className="flex-1"
            variant={inquiry.status === 'pending_quote' ? 'default' : 'outline'}
          >
            <Link to={`/inquiry-responses/${inquiry.id}`}>
              {inquiry.status === 'pending_quote' 
                ? t('inquiry.respondNow') 
                : t('inquiry.viewDetails')
              }
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="px-3"
            asChild
          >
            <Link to={`/inquiry-responses/${inquiry.id}#messages`}>
              <MessageSquare className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // 错误状态
  if (error) {
    return (
      <Layout userType={currentUserType}>
        <main className="flex-1 p-6 bg-gradient-to-br from-slate-50 via-agro-green-light/30 to-agro-blue-light/40 relative overflow-auto">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-agro-blue/8 pointer-events-none" />
          <div className="relative z-10 max-w-6xl mx-auto">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{t('inquiry.errorLoading')}</span>
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

  return (
    <Layout userType={currentUserType}>
      <main className="flex-1 p-6 bg-gradient-to-br from-slate-50 via-agro-green-light/30 to-agro-blue-light/40 relative overflow-auto">
        {/* 装饰性渐变叠层 */}
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-agro-blue/8 pointer-events-none" />
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-radial from-primary/10 via-primary/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-radial from-agro-blue/8 via-agro-blue/4 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        {/* 内容区域 */}
        <div className="relative z-10 max-w-6xl mx-auto">
          {/* 页面标题 */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-agro-blue/20 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{t('navigation.inquiryResponse')}</h1>
                <p className="text-muted-foreground">{t('navigation.inquiryResponseDesc')}</p>
              </div>
            </div>
          </div>

          {/* 统计概览 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('inquiry.totalInquiries')}</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('inquiry.pendingQuotes')}</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('inquiry.quoted')}</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.quoted}</p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('inquiry.confirmed')}</p>
                    <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 筛选和搜索栏 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" />
                {t('inquiry.filterAndSearch')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">{t('inquiry.searchInquiry')}</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t('inquiry.searchSupplierPlaceholder')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-48">
                  <label className="text-sm font-medium mb-2 block">{t('inquiry.filterByStatus')}</label>
                  <Select value={statusFilter} onValueChange={handleStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('inquiry.allStatus')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">{t('inquiry.allStatus')}</SelectItem>
                      {statusDict.map((status) => (
                        <SelectItem key={status.code} value={status.code}>
                          {getStatusLabel(status.code)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 询价列表 */}
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-80 w-full" />
              ))}
            </div>
          ) : inquiries.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  {t('inquiry.noInquiryResponses')}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {t('inquiry.noInquiryResponsesDesc')}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {inquiries.map(renderInquiryCard)}
              </div>

              {/* 分页 */}
              {meta && meta.totalPages > 1 && (
                <div className="flex justify-center gap-2">
                  <Button
                    variant="outline"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    {t('common.previousPage')}
                  </Button>
                  <span className="px-4 py-2 text-sm text-muted-foreground">
                    {t('common.pageInfo', { current: currentPage, total: meta.totalPages })}
                  </span>
                  <Button
                    variant="outline"
                    disabled={currentPage >= meta.totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    {t('common.nextPage')}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </Layout>
  );
};

export default InquiryResponsePage;