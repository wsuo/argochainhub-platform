import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Clock, CheckCircle, XCircle, Truck, AlertCircle } from "lucide-react";
import { SampleTable } from "@/components/samples/SampleTable";
import { SampleFiltersV2, SampleFiltersData } from "@/components/samples/SampleFiltersV2";
import { useSupplierSampleRequests, useSampleStatusDict } from "@/hooks/useSample";
import { SampleRequestStatus } from "@/types/sample";
import { useLanguage } from "@/hooks/useLanguage";
import { dictionaryService } from "@/services/dictionaryService";

export default function SampleResponses() {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const [tab, setTab] = useState<string>("all");
  
  const [filters, setFilters] = useState<SampleFiltersData>({
    keyword: '',
    status: '',
    dateFrom: '',
    dateTo: '',
  });

  const queryParams = useMemo(() => {
    const params: any = {};
    if (filters.keyword) params.keyword = filters.keyword;
    if (filters.status && filters.status !== "all") params.status = filters.status as SampleRequestStatus;
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo) params.dateTo = filters.dateTo;
    return params;
  }, [filters]);
  
  const { data, isLoading } = useSupplierSampleRequests(queryParams);
  const { data: statusDict = [] } = useSampleStatusDict();

  // 根据当前语言获取状态显示文本（使用字典数据）
  const getStatusLabel = (statusCode: string): string => {
    const status = statusDict.find(s => s.code === statusCode);
    if (!status) {
      // 如果字典没有找到，使用翻译文件
      return t(`sampleResponses.status.${statusCode}`) || statusCode;
    }
    // 从字典获取多语言名称
    return dictionaryService.getLocalizedName(
      status,
      currentLanguage === 'zh' ? 'zh-CN' : currentLanguage as 'en' | 'es'
    );
  };

  // Filter items based on tab
  const filteredItems = useMemo(() => {
    if (!data?.data) return [];
    
    if (tab === "all") return data.data;
    
    return data.data.filter(item => item.status === tab);
  }, [data, tab]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!data?.data) return { pending: 0, approved: 0, shipped: 0, delivered: 0, rejected: 0 };
    
    return data.data.reduce((acc, item) => {
      switch (item.status) {
        case SampleRequestStatus.PENDING_APPROVAL:
          acc.pending++;
          break;
        case SampleRequestStatus.APPROVED:
          acc.approved++;
          break;
        case SampleRequestStatus.SHIPPED:
          acc.shipped++;
          break;
        case SampleRequestStatus.DELIVERED:
          acc.delivered++;
          break;
        case SampleRequestStatus.REJECTED:
          acc.rejected++;
          break;
      }
      return acc;
    }, { pending: 0, approved: 0, shipped: 0, delivered: 0, rejected: 0 });
  }, [data]);

  // 处理筛选器变更
  const handleFilterChange = (newFilters: SampleFiltersData) => {
    setFilters(newFilters);
  };

  return (
    <Layout userType="supplier">
      <div className="space-y-6">
          {/* 页面标题 */}
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {t('sampleResponses.title')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('sampleResponses.description')}
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {t('sampleResponses.stats.pending')}
                    </p>
                    <p className="text-2xl font-bold">{stats.pending}</p>
                    <p className="text-xs text-muted-foreground">
                      {t('sampleResponses.stats.needsAttention')}
                    </p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-yellow-600 opacity-80" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {t('sampleResponses.stats.approved')}
                    </p>
                    <p className="text-2xl font-bold">{stats.approved}</p>
                    <p className="text-xs text-muted-foreground">
                      {t('sampleResponses.stats.readyToShip')}
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
                      {t('sampleResponses.stats.shipped')}
                    </p>
                    <p className="text-2xl font-bold">{stats.shipped}</p>
                    <p className="text-xs text-muted-foreground">
                      {t('sampleResponses.stats.inTransit')}
                    </p>
                  </div>
                  <Truck className="h-8 w-8 text-blue-600 opacity-80" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {t('sampleResponses.stats.delivered')}
                    </p>
                    <p className="text-2xl font-bold">{stats.delivered}</p>
                    <p className="text-xs text-muted-foreground">
                      {t('sampleResponses.stats.completed')}
                    </p>
                  </div>
                  <Package className="h-8 w-8 text-emerald-600 opacity-80" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {t('sampleResponses.stats.rejected')}
                    </p>
                    <p className="text-2xl font-bold">{stats.rejected}</p>
                    <p className="text-xs text-muted-foreground">
                      {t('sampleResponses.stats.declined')}
                    </p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-600 opacity-80" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 筛选器 */}
          <Card>
            <CardContent className="pt-6">
              <SampleFiltersV2
                filters={filters}
                onFiltersChange={handleFilterChange}
                loading={isLoading}
              />
            </CardContent>
          </Card>

          {/* 样品列表标签页 */}
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${(statusDict?.filter(s => s.code !== 'cancelled').length || 0) + 1}, minmax(0, 1fr))` }}>
              <TabsTrigger value="all" className="flex items-center gap-2">
                {t('sampleResponses.tabs.all')}
                {data?.meta && ` (${data.meta.totalItems})`}
              </TabsTrigger>
              {statusDict?.filter(status => status.code !== 'cancelled').map((status) => {
                const count = stats[
                  status.code === 'pending_approval' ? 'pending' :
                  status.code === 'approved' ? 'approved' :
                  status.code === 'shipped' ? 'shipped' :
                  status.code === 'delivered' ? 'delivered' :
                  status.code === 'rejected' ? 'rejected' : 0
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
              <SampleTable 
                loading={isLoading} 
                items={filteredItems} 
                userType="supplier"
              />
            </TabsContent>
          </Tabs>
      </div>
    </Layout>
  );
}