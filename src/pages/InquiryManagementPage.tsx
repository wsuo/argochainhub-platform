import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/MockAuthContext";
import { useQueryErrorHandler } from "@/hooks/useErrorHandler";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { PermissionError } from "@/components/common/PermissionError";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { FileText, UserCheck, Plus, Clock, CheckCircle, XCircle, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { InquiryFiltersData } from "@/components/inquiries/InquiryFilters";
import { InquiryFiltersV2 } from "@/components/inquiries/InquiryFiltersV2";
import { InquiryList } from "@/components/inquiries/InquiryList";
import { dictionaryService } from "@/services/dictionaryService";
import { InquiryService } from "@/services/inquiryService";
import { useLanguage } from "@/hooks/useLanguage";
import { InquiryStatus } from "@/types/inquiry";

const InquiryManagementPage = () => {
  const { t } = useTranslation();
  const { currentUserType, isLoggedIn } = useAuth();
  const { currentLanguage } = useLanguage();
  const navigate = useNavigate();
  const [tab, setTab] = useState<string>("all");
  
  const [filters, setFilters] = useState<InquiryFiltersData>({
    search: '',
    dateFrom: '',
    dateTo: '',
  });

  const queryParams = useMemo(() => {
    const params: any = {};
    if (filters.search) params.keyword = filters.search;
    if (filters.status && filters.status !== "all") params.status = filters.status as InquiryStatus;
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo) params.dateTo = filters.dateTo;
    return params;
  }, [filters]);

  // 获取询价状态字典
  const { data: statusDict = [] } = useQuery({
    queryKey: ['inquiry-status-dict'],
    queryFn: () => dictionaryService.getInquiryStatuses(),
    staleTime: 10 * 60 * 1000, // 10分钟缓存
  });

  // 获取询价统计数据
  const { data: statsResponse } = useQuery({
    queryKey: ['buyer-inquiry-stats'],
    queryFn: () => InquiryService.getBuyerInquiryStats(),
    enabled: isLoggedIn && currentUserType === 'buyer',
    staleTime: 30 * 1000,
  });

  const stats = statsResponse?.data;

  // 根据当前语言获取状态显示文本
  const getStatusLabel = (statusCode: string): string => {
    const status = statusDict.find(s => s.code === statusCode);
    if (!status) return statusCode;
    
    const langKey = currentLanguage === 'zh' ? 'zh-CN' : currentLanguage;
    return status.name?.[langKey] || status.name?.['zh-CN'] || status.code;
  };

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

  // 处理筛选器变更
  const handleFilterChange = (newFilters: InquiryFiltersData) => {
    setFilters(newFilters);
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

  // Filter items based on tab
  const filteredItems = useMemo(() => {
    // This will be handled by the InquiryList component based on filters
    return [];
  }, []);

  // Calculate statistics from stats response
  const calculatedStats = useMemo(() => {
    if (!stats) return { pendingQuote: 0, quoted: 0, confirmed: 0, declined: 0, cancelled: 0 };
    
    return {
      pendingQuote: stats.pendingQuoteCount || 0,
      quoted: stats.quotedCount || 0,
      confirmed: stats.confirmedCount || 0,
      declined: stats.declinedCount || 0,
      cancelled: stats.cancelledCount || 0,
    };
  }, [stats]);

  // 错误处理和未登录状态处理
  if (errorHandler.hasError && errorHandler.parsedError) {
    // 权限错误使用专用组件
    if (errorHandler.isPermissionError) {
      return (
        <Layout userType={currentUserType}>
          <div className="flex items-center justify-center min-h-[60vh]">
            <PermissionError
              error={errorHandler.parsedError}
              businessContext="inquiry"
              onRetry={() => errorHandler.retry(() => {})}
              onNavigateBack={() => errorHandler.navigateBack('/')}
            />
          </div>
        </Layout>
      );
    }

    // 其他错误使用通用ErrorBoundary
    return (
      <Layout userType={currentUserType}>
        <ErrorBoundary
          error={errorHandler.parsedError}
          loading={false}
          onRetry={() => errorHandler.retry(() => {})}
          onNavigateBack={() => errorHandler.navigateBack('/')}
        />
      </Layout>
    );
  }

  return (
    <Layout userType={currentUserType}>
      <div className="space-y-6">
          {isLoggedIn ? (
            <>
              {/* 页面标题 */}
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    {t('inquiry.title', '询价管理')}
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    {t('inquiry.description', '管理和跟踪您的询价单，查看报价响应')}
                  </p>
                </div>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  {t('inquiry.createInquiry', '创建询价')}
                </Button>
              </div>

              {/* 统计卡片 */}
              {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            {t('inquiry.stats.pending', '待报价')}
                          </p>
                          <p className="text-2xl font-bold">
                            {calculatedStats.pendingQuote}
                          </p>
                        </div>
                        <Clock className="h-8 w-8 text-yellow-600 opacity-80" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            {t('inquiry.stats.quoted', '已报价')}
                          </p>
                          <p className="text-2xl font-bold">
                            {calculatedStats.quoted}
                          </p>
                        </div>
                        <FileText className="h-8 w-8 text-blue-600 opacity-80" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            {t('inquiry.stats.confirmed', '已确认')}
                          </p>
                          <p className="text-2xl font-bold">
                            {calculatedStats.confirmed}
                          </p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-green-600 opacity-80" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            {t('inquiry.stats.declined', '已拒绝')}
                          </p>
                          <p className="text-2xl font-bold">
                            {calculatedStats.declined}
                          </p>
                        </div>
                        <XCircle className="h-8 w-8 text-red-600 opacity-80" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            {t('inquiry.stats.cancelled', '已取消')}
                          </p>
                          <p className="text-2xl font-bold">
                            {calculatedStats.cancelled}
                          </p>
                        </div>
                        <XCircle className="h-8 w-8 text-gray-600 opacity-80" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* 筛选器 */}
              <Card>
                <CardContent className="pt-6">
                  <InquiryFiltersV2
                    filters={filters}
                    onFiltersChange={handleFilterChange}
                    loading={false}
                  />
                </CardContent>
              </Card>

              {/* 询价列表标签页 */}
              <Tabs value={tab} onValueChange={setTab} className="w-full">
                <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${(statusDict?.length || 0) + 1}, minmax(0, 1fr))` }}>
                  <TabsTrigger value="all" className="flex items-center gap-2">
                    {t('inquiry.tabs.all', '全部')}
                    {stats && ` (${stats.totalCount})`}
                  </TabsTrigger>
                  {statusDict?.map((status) => {
                    const count = calculatedStats[
                      status.code === 'pending_quote' ? 'pendingQuote' :
                      status.code === 'quoted' ? 'quoted' :
                      status.code === 'confirmed' ? 'confirmed' :
                      status.code === 'declined' ? 'declined' :
                      status.code === 'cancelled' ? 'cancelled' : 0
                    ] || 0;
                    
                    return (
                      <TabsTrigger key={status.code} value={status.code} className="flex items-center gap-2">
                        {dictionaryService.getLocalizedName(
                          status,
                          currentLanguage === 'zh' ? 'zh-CN' : currentLanguage as 'en' | 'es'
                        )}
                        {` (${count})`}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                <TabsContent value={tab} className="mt-6">
                  <InquiryList 
                    filters={{ ...filters, ...(tab !== 'all' && { status: tab as any }) }}
                    isSupplierView={false}
                  />
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <div className="space-y-6">
              {/* 页面标题 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-agro-blue/20 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-foreground">
                      {t('navigation.inquiryManagement', '询价管理')}
                    </h1>
                    <p className="text-muted-foreground">
                      {t('navigation.inquiryManagementDesc', '管理和跟踪您的询价单，查看报价响应')}
                    </p>
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
          )}
      </div>

      {/* 认证弹窗 */}
      <AuthDialog
        open={showAuthDialog}
        onOpenChange={closeAuthDialog}
        onSuccess={handleAuthSuccess}
        title={authConfig.title}
        description={authConfig.description}
      />
    </Layout>
  );
};

export default InquiryManagementPage;