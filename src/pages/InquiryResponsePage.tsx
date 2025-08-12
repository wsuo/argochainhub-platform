import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/contexts/MockAuthContext";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  FileText, 
  Clock, 
  CheckCircle2,
  XCircle,
  Package,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { InquiryService } from "@/services/inquiryService";
import { dictionaryService } from "@/services/dictionaryService";
import { InquiryStatus } from "@/types/inquiry";
import { InquiryFiltersV2 } from "@/components/inquiries/InquiryFiltersV2";
import { InquiryList } from "@/components/inquiries/InquiryList";
import type { InquiryFiltersData } from "@/components/inquiries/InquiryFilters";

const InquiryResponsePage = () => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const { currentUserType } = useAuth();
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

  // 获取询价状态字典数据
  const { data: statusDict = [] } = useQuery({
    queryKey: ['inquiry-status-dict'],
    queryFn: () => dictionaryService.getInquiryStatuses(),
    staleTime: 10 * 60 * 1000, // 10分钟缓存
  });

  // 获取供应商报价统计数据
  const { data: statsResponse } = useQuery({
    queryKey: ['supplier-quote-stats'],
    queryFn: () => InquiryService.getSupplierQuoteStats(),
    enabled: currentUserType === 'supplier',
    staleTime: 30 * 1000,
  });

  const stats = statsResponse?.data;

  // 获取状态显示文本
  const getStatusLabel = (statusCode: string): string => {
    const status = statusDict.find(s => s.code === statusCode);
    if (!status) return statusCode;
    
    const langKey = currentLanguage === 'zh' ? 'zh-CN' : currentLanguage;
    return status.name?.[langKey] || status.name?.['zh-CN'] || status.code;
  };

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

  // 处理筛选器变更
  const handleFilterChange = (newFilters: InquiryFiltersData) => {
    setFilters(newFilters);
  };

  return (
    <Layout userType={currentUserType}>
      <main className="flex-1 p-6 bg-gradient-to-br from-slate-50 via-agro-green-light/30 to-agro-blue-light/40 relative overflow-auto">
        {/* 装饰性渐变叠层 */}
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-agro-blue/8 pointer-events-none" />
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-radial from-primary/10 via-primary/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-radial from-agro-blue/8 via-agro-blue/4 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        {/* 内容区域 */}
        <div className="relative z-10 space-y-6">
          {/* 页面标题 */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {t('inquiry.supplierTitle', '询价响应')}
              </h1>
              <p className="text-muted-foreground mt-1">
                {t('inquiry.supplierDescription', '查看和响应收到的询价申请')}
              </p>
            </div>
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
                    <Clock className="h-8 w-8 text-orange-500 opacity-80" />
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
                    <CheckCircle2 className="h-8 w-8 text-green-500 opacity-80" />
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
                isSupplierView={true}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </Layout>
  );
};

export default InquiryResponsePage;