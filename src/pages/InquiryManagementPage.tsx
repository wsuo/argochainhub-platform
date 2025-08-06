import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/contexts/MockAuthContext";
import { useQueryErrorHandler } from "@/hooks/useErrorHandler";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { PermissionError } from "@/components/common/PermissionError";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { useAuthGuard } from "@/hooks/useAuthGuard";
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
  UserCheck
} from "lucide-react";
import { InquiryService } from "@/services/inquiryService";
import { dictionaryService, DictionaryItem } from "@/services/dictionaryService";
import { Inquiry, InquiryStatus, MultiLanguageText } from "@/types/inquiry";
import { InquiryStatusBadge } from "@/components/inquiry/InquiryStatusBadge";
import { ErrorParser } from "@/utils/errorParser";
import { useNavigate, Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const InquiryManagementPage = () => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const { currentUserType, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  
  const [statusFilter, setStatusFilter] = useState<InquiryStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // 使用认证守卫
  const {
    showAuthDialog,
    authConfig,
    executeWithAuth,
    handleAuthSuccess,
    closeAuthDialog
  } = useAuthGuard();

  // 错误处理Hook
  const errorHandler = useQueryErrorHandler({
    module: 'inquiry',
    action: 'read',
    resourceType: 'list'
  });

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

  // 获取询价列表 - 只在用户登录时才发起请求
  const {
    data: inquiryResponse,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['inquiries', currentPage, statusFilter],
    queryFn: () => InquiryService.getInquiries({
      page: currentPage,
      limit: 20,
      ...(statusFilter && statusFilter !== 'all' && { status: statusFilter })
    }),
    staleTime: 30 * 1000, // 30秒缓存
    retry: false, // 禁用自动重试，避免重复请求
    enabled: isLoggedIn, // 只在用户登录时启用查询
  });

  // 手动处理错误 - 使用useEffect避免渲染循环
  React.useEffect(() => {
    if (error && !errorHandler.hasError) {
      errorHandler.handleError(error);
    }
  }, [error, errorHandler]);

  const inquiries = inquiryResponse?.data || [];
  const meta = inquiryResponse?.meta;

  // 获取状态显示文本
  const getStatusLabel = (statusCode: string): string => {
    const statusItem = statusDict.find((item: DictionaryItem) => item.code === statusCode);
    if (!statusItem) return statusCode;

    // 根据当前语言获取对应的显示文本
    const langKey = currentLanguage as keyof typeof statusItem.name;
    return statusItem.name[langKey] || statusItem.name['zh-CN'] || statusCode;
  };

  // 处理状态筛选
  const handleStatusFilter = (status: string) => {
    setStatusFilter(status as InquiryStatus | 'all');
    setCurrentPage(1);
  };

  // 处理浏览产品（未登录用户点击时显示登录弹窗）
  const handleBrowseProducts = () => {
    executeWithAuth(() => {
      navigate('/products');
    }, {
      title: t('auth.loginToAccessInquiries', { defaultValue: '登录以访问询价管理' }),
      description: t('auth.inquiryAccessDesc', { 
        defaultValue: '请登录您的账户以查看和管理您的询价记录' 
      }),
      requiredUserType: 'buyer'
    });
  };

  // 渲染询价卡片
  const renderInquiryCard = (inquiry: Inquiry) => (
    <Card key={inquiry.id} className="hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg mb-1">
              {t('inquiry.inquiryNo')}: {inquiry.inquiryNo}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              {t('inquiry.deadline')}: {InquiryService.formatDate(inquiry.deadline)}
              <span className="text-xs text-muted-foreground">
                ({InquiryService.getTimeRemaining(inquiry.deadline)})
              </span>
            </CardDescription>
          </div>
          <InquiryStatusBadge status={inquiry.status} />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 供应商信息 */}
        <div className="flex items-center gap-2 text-sm">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{t('inquiry.supplier')}:</span>
          <span>{getLocalizedText(inquiry.supplier.name)}</span>
        </div>

        {/* 产品信息 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{t('inquiry.products')}:</span>
          </div>
          <div className="pl-6 space-y-1">
            {inquiry.items.slice(0, 2).map((item) => (
              <div key={item.id} className="text-sm text-muted-foreground">
                {getLocalizedText(item.productSnapshot.name)} - {item.quantity} {item.unit}
              </div>
            ))}
            {inquiry.items.length > 2 && (
              <div className="text-xs text-muted-foreground">
                {t('inquiry.andMoreItems', { count: inquiry.items.length - 2 })}
              </div>
            )}
          </div>
        </div>

        {/* 交易条件 */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">{t('inquiry.tradeTerms')}:</span>
            <span className="ml-2 font-medium">{inquiry.details.tradeTerms}</span>
          </div>
          <div>
            <span className="text-muted-foreground">{t('inquiry.paymentMethod')}:</span>
            <span className="ml-2 font-medium">{inquiry.details.paymentMethod}</span>
          </div>
        </div>

        {/* 报价信息 */}
        {inquiry.quoteDetails && (
          <div className="bg-muted/30 rounded-lg p-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">{t('inquiry.totalPrice')}:</span>
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
        )}

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
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-2 pt-2">
          <Button
            asChild
            className="flex-1"
          >
            <Link to={`/inquiries/${inquiry.id}`}>
              {t('inquiry.viewDetails')}
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="px-3"
            asChild
          >
            <Link to={`/inquiries/${inquiry.id}#messages`}>
              <MessageSquare className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // 错误处理和未登录状态处理
  if (errorHandler.hasError && errorHandler.parsedError) {
    // 权限错误使用专用组件
    if (errorHandler.isPermissionError) {
      return (
        <Layout userType={currentUserType}>
          <main className="flex-1 p-6 bg-gradient-to-br from-slate-50 via-agro-green-light/30 to-agro-blue-light/40 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-agro-blue/8 pointer-events-none" />
            <div className="relative z-10 max-w-6xl mx-auto flex items-center justify-center min-h-[60vh]">
              <PermissionError
                error={errorHandler.parsedError}
                businessContext="inquiry"
                onRetry={() => errorHandler.retry(refetch)}
                onNavigateBack={() => errorHandler.navigateBack('/')}
              />
            </div>
          </main>
        </Layout>
      );
    }

    // 其他错误使用通用ErrorBoundary
    return (
      <Layout userType={currentUserType}>
        <main className="flex-1 p-6 bg-gradient-to-br from-slate-50 via-agro-green-light/30 to-agro-blue-light/40 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-agro-blue/8 pointer-events-none" />
          <div className="relative z-10 max-w-6xl mx-auto">
            <ErrorBoundary
              error={errorHandler.parsedError}
              loading={isLoading}
              onRetry={() => errorHandler.retry(refetch)}
              onNavigateBack={() => errorHandler.navigateBack('/')}
            />
          </div>
        </main>
      </Layout>
    );
  }

  // 未登录用户显示友好的登录提示
  if (!isLoggedIn) {
    return (
      <Layout userType={currentUserType}>
        <main className="flex-1 p-6 bg-gradient-to-br from-slate-50 via-agro-green-light/30 to-agro-blue-light/40 relative overflow-hidden">
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
                  <h1 className="text-2xl font-bold">{t('navigation.inquiryManagement')}</h1>
                  <p className="text-muted-foreground">{t('navigation.inquiryManagementDesc')}</p>
                </div>
              </div>
            </div>

            {/* 未登录提示卡片 */}
            <Card>
              <CardContent className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-primary/20 to-agro-blue/20 rounded-full flex items-center justify-center">
                  <UserCheck className="h-8 w-8 text-primary" />
                </div>
                
                <h3 className="text-2xl font-bold text-foreground mb-3">
                  {t('auth.loginRequired', { defaultValue: '请先登录' })}
                </h3>
                
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {t('auth.inquiryLoginMessage', { 
                    defaultValue: '询价管理功能需要登录后才能使用。请登录您的账户以查看和管理您的询价记录。' 
                  })}
                </p>
                
                <div className="space-y-3">
                  <Button 
                    onClick={handleBrowseProducts}
                    className="bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary"
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    {t('auth.loginNow', { defaultValue: '立即登录' })}
                  </Button>
                  
                  <div className="text-sm text-muted-foreground">
                    {t('auth.orBrowseProducts', { defaultValue: '或者' })}
                    <Button 
                      variant="link" 
                      onClick={() => navigate('/products')}
                      className="p-0 ml-1 h-auto text-primary"
                    >
                      {t('auth.browseProductsFirst', { defaultValue: '先浏览产品' })}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 认证弹窗 */}
          <AuthDialog
            open={showAuthDialog}
            onOpenChange={closeAuthDialog}
            onSuccess={handleAuthSuccess}
            title={authConfig.title}
            description={authConfig.description}
          />
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
          {/* 页面标题 */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-agro-blue/20 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{t('navigation.inquiryManagement')}</h1>
                <p className="text-muted-foreground">{t('navigation.inquiryManagementDesc')}</p>
              </div>
            </div>
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
                      placeholder={t('inquiry.searchPlaceholder')}
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
                      <SelectItem value="all">{t('inquiry.allStatus')}</SelectItem>
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
                  {t('inquiry.noInquiries')}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {t('inquiry.noInquiriesDesc')}
                </p>
                <Button onClick={() => navigate('/products')}>
                  {t('inquiry.browseProducts')}
                </Button>
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

export default InquiryManagementPage;