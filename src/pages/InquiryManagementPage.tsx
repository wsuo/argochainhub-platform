import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/MockAuthContext";
import { useQueryErrorHandler } from "@/hooks/useErrorHandler";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { PermissionError } from "@/components/common/PermissionError";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { FileText, UserCheck, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { InquiryFilters, InquiryFiltersData } from "@/components/inquiries/InquiryFilters";
import { InquiryList } from "@/components/inquiries/InquiryList";
import { Card, CardContent } from "@/components/ui/card";

const InquiryManagementPage = () => {
  const { t } = useTranslation();
  const { currentUserType, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  
  const [filters, setFilters] = useState<InquiryFiltersData>({});

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
                onRetry={() => errorHandler.retry(() => {})}
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
              loading={false}
              onRetry={() => errorHandler.retry(() => {})}
              onNavigateBack={() => errorHandler.navigateBack('/')}
            />
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
        <div className="relative z-10 max-w-6xl mx-auto space-y-6">
          {/* 页面标题 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-agro-blue/20 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  {t('navigation.inquiryManagement')}
                </h1>
                <p className="text-muted-foreground">
                  {t('navigation.inquiryManagementDesc')}
                </p>
              </div>
            </div>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              {t('inquiry.createInquiry')}
            </Button>
          </div>

          {isLoggedIn ? (
            <>
              {/* 筛选器 */}
              <InquiryFilters 
                filters={filters} 
                onFiltersChange={handleFilterChange}
              />

              {/* 询价列表 */}
              <InquiryList filters={filters} />
            </>
          ) : (
            /* 未登录提示卡片 */
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
      </main>
    </Layout>
  );
};

export default InquiryManagementPage;