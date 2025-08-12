import React, { useState } from "react";
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
import { FileCheck, UserCheck, Plus, Clock, RefreshCw, CheckCircle, XCircle, Ban, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { RegistrationFiltersData } from "@/types/registration";
import { RegistrationFilters } from "@/components/registration/RegistrationFilters";
import { RegistrationList } from "@/components/registration/RegistrationList";
import { RegistrationService } from "@/services/registrationService";
import { dictionaryService } from "@/services/dictionaryService";
import { useLanguage } from "@/hooks/useLanguage";
import { CreateRegistrationDialog } from "@/components/registration/CreateRegistrationDialog";

const RegistrationManagementPage = () => {
  const { t } = useTranslation();
  const { currentUserType, isLoggedIn } = useAuth();
  const { currentLanguage } = useLanguage();
  const navigate = useNavigate();
  
  const [filters, setFilters] = useState<RegistrationFiltersData>({
    search: '',
    dateFrom: '',
    dateTo: '',
  });

  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // 获取登记状态字典
  const { data: statusDict = [] } = useQuery({
    queryKey: ['registration-status-dict'],
    queryFn: () => dictionaryService.getRegistrationStatuses(),
    staleTime: 10 * 60 * 1000,
  });

  // 获取统计信息
  const { data: statsResponse } = useQuery({
    queryKey: ['registration-stats'],
    queryFn: () => RegistrationService.getStats(),
    enabled: isLoggedIn,
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
    module: 'registration',
    action: 'read',
    resourceType: 'list'
  });

  // 处理筛选器变更
  const handleFilterChange = (newFilters: RegistrationFiltersData) => {
    setFilters(newFilters);
  };

  // 处理浏览产品（未登录用户点击时显示登录弹窗）
  const handleBrowseProducts = () => {
    executeWithAuth(() => {
      navigate('/products');
    }, {
      title: t('auth.loginToAccessRegistrations', '登录以访问登记管理'),
      description: t('auth.registrationAccessDesc', '请登录您的账户以查看和管理您的登记申请'),
      requiredUserType: 'buyer'
    });
  };

  // 错误处理和未登录状态处理
  if (errorHandler.hasError && errorHandler.parsedError) {
    if (errorHandler.isPermissionError) {
      return (
        <Layout userType={currentUserType}>
          <div className="flex items-center justify-center min-h-[60vh]">
            <PermissionError
              error={errorHandler.parsedError}
              businessContext="registration"
              onRetry={() => errorHandler.retry(() => {})}
              onNavigateBack={() => errorHandler.navigateBack('/')}
            />
          </div>
        </Layout>
      );
    }

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
                    {t('navigation.registrationManagement', '登记管理')}
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    {t('navigation.registrationManagementDesc', '管理产品登记申请，跟踪登记进度')}
                  </p>
                </div>
                {currentUserType === 'buyer' && (
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    {t('registration.createRegistration', '创建登记申请')}
                  </Button>
                )}
              </div>

              {/* 统计卡片 */}
              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            {t('registration.stats.total', '全部')}
                          </p>
                          <p className="text-2xl font-bold">{stats.total}</p>
                        </div>
                        <FileText className="h-8 w-8 text-primary opacity-80" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            {t('registration.stats.pendingResponse', '待回复')}
                          </p>
                          <p className="text-2xl font-bold">{stats.pendingResponse}</p>
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
                            {t('registration.stats.inProgress', '进行中')}
                          </p>
                          <p className="text-2xl font-bold">{stats.inProgress}</p>
                        </div>
                        <RefreshCw className="h-8 w-8 text-blue-600 opacity-80" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            {t('registration.stats.completed', '已完成')}
                          </p>
                          <p className="text-2xl font-bold">{stats.completed}</p>
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
                            {t('registration.stats.declined', '已拒绝')}
                          </p>
                          <p className="text-2xl font-bold">{stats.declined}</p>
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
                            {t('registration.stats.cancelled', '已取消')}
                          </p>
                          <p className="text-2xl font-bold">{stats.cancelled}</p>
                        </div>
                        <Ban className="h-8 w-8 text-gray-600 opacity-80" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* 筛选器 */}
              <Card>
                <CardContent className="pt-6">
                  <RegistrationFilters
                    filters={filters}
                    onFiltersChange={handleFilterChange}
                    loading={false}
                  />
                </CardContent>
              </Card>

              {/* 登记列表标签页 */}
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${(statusDict?.length || 0) + 1}, minmax(0, 1fr))` }}>
                  <TabsTrigger value="all" className="flex items-center gap-2">
                    {t('registration.status.all', '全部')}
                    {stats && ` (${stats.total})`}
                  </TabsTrigger>
                  {statusDict.map((status) => {
                    const count = stats ? (
                      status.code === 'pending_response' ? stats.pendingResponse :
                      status.code === 'in_progress' ? stats.inProgress :
                      status.code === 'completed' ? stats.completed :
                      status.code === 'declined' ? stats.declined :
                      status.code === 'cancelled' ? stats.cancelled : 0
                    ) : 0;
                    
                    return (
                      <TabsTrigger key={status.code} value={status.code} className="flex items-center gap-2">
                        {getStatusLabel(status.code)}
                        {` (${count})`}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                <TabsContent value="all" className="mt-6">
                  <RegistrationList filters={filters} />
                </TabsContent>
                {statusDict.map((status) => (
                  <TabsContent key={status.code} value={status.code} className="mt-6">
                    <RegistrationList filters={{ ...filters, status: status.code }} />
                  </TabsContent>
                ))}
              </Tabs>
            </>
          ) : (
            <div className="space-y-6">
              {/* 页面标题 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-agro-blue/20 rounded-lg flex items-center justify-center">
                    <FileCheck className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-foreground">
                      {t('navigation.registrationManagement')}
                    </h1>
                    <p className="text-muted-foreground">
                      {t('navigation.registrationManagementDesc')}
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
                    {t('auth.loginRequired', '请先登录')}
                  </h3>
                  
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    {t('auth.registrationLoginMessage', '登记管理功能需要登录后才能使用。请登录您的账户以查看和管理您的登记申请。')}
                  </p>
                  
                  <div className="space-y-3">
                    <Button 
                      onClick={handleBrowseProducts}
                      className="bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary"
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      {t('auth.loginNow', '立即登录')}
                    </Button>
                    
                    <div className="text-sm text-muted-foreground">
                      {t('auth.orBrowseProducts', '或者')}
                      <Button 
                        variant="link" 
                        onClick={() => navigate('/products')}
                        className="p-0 ml-1 h-auto text-primary"
                      >
                        {t('auth.browseProductsFirst', '先浏览产品')}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
      </div>

      {/* 创建登记申请对话框 */}
      {showCreateDialog && (
        <CreateRegistrationDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
        />
      )}

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

export default RegistrationManagementPage;