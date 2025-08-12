import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Package, Clock, CheckCircle, XCircle, Truck } from "lucide-react";
import { CreateSampleRequestDialog } from "@/components/samples/CreateSampleRequestDialog";
import { SampleTable } from "@/components/samples/SampleTable";
import { SampleFiltersV2, SampleFiltersData } from "@/components/samples/SampleFiltersV2";
import { useSampleRequests, useSampleStats, useSampleStatusDict } from "@/hooks/useSample";
import { SampleRequestStatus } from "@/types/sample";
import { useLanguage } from "@/hooks/useLanguage";
import { dictionaryService } from "@/services/dictionaryService";

export default function Samples() {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const [tab, setTab] = useState<string>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
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
  
  const { data, isLoading } = useSampleRequests(queryParams);
  const { data: stats } = useSampleStats();
  const { data: statusDict = [] } = useSampleStatusDict();

  // 根据当前语言获取状态显示文本（使用字典数据）
  const getStatusLabel = (statusCode: string): string => {
    const status = statusDict.find(s => s.code === statusCode);
    if (!status) {
      // 如果字典没有找到，使用翻译文件
      return t(`samples.status.${statusCode}`) || statusCode;
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

  // Calculate statistics from actual data
  const calculatedStats = useMemo(() => {
    if (!data?.data) return { pending: 0, approved: 0, shipped: 0, delivered: 0, cancelled: 0, rejected: 0 };
    
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
        case SampleRequestStatus.CANCELLED:
          acc.cancelled++;
          break;
        case SampleRequestStatus.REJECTED:
          acc.rejected++;
          break;
      }
      return acc;
    }, { pending: 0, approved: 0, shipped: 0, delivered: 0, cancelled: 0, rejected: 0 });
  }, [data]);

  // 处理筛选器变更
  const handleFilterChange = (newFilters: SampleFiltersData) => {
    setFilters(newFilters);
  };

  return (
    <Layout userType="buyer">
      <div className="space-y-6">
          {/* 页面标题 */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {t('samples.title')}
              </h1>
              <p className="text-muted-foreground mt-1">
                {t('samples.description')}
              </p>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              {t('samples.createRequest')}
            </Button>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {t('samples.stats.pending')}
                    </p>
                    <p className="text-2xl font-bold">
                      {stats?.data?.byStatus?.pending || calculatedStats.pending}
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
                      {t('samples.stats.approved')}
                    </p>
                    <p className="text-2xl font-bold">
                      {stats?.data?.byStatus?.approved || calculatedStats.approved}
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
                      {t('samples.stats.shipped')}
                    </p>
                    <p className="text-2xl font-bold">
                      {stats?.data?.byStatus?.shipped || calculatedStats.shipped}
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
                      {t('samples.stats.delivered')}
                    </p>
                    <p className="text-2xl font-bold">
                      {stats?.data?.byStatus?.delivered || calculatedStats.delivered}
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
                      {t('samples.stats.cancelled')}
                    </p>
                    <p className="text-2xl font-bold">
                      {stats?.data?.byStatus?.cancelled || calculatedStats.cancelled}
                    </p>
                  </div>
                  <XCircle className="h-8 w-8 text-gray-600 opacity-80" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {t('samples.stats.rejected')}
                    </p>
                    <p className="text-2xl font-bold">
                      {stats?.data?.byStatus?.rejected || calculatedStats.rejected}
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
            <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${(statusDict?.length || 0) + 1}, minmax(0, 1fr))` }}>
              <TabsTrigger value="all" className="flex items-center gap-2">
                {t('samples.tabs.all')}
                {data?.meta && ` (${data.meta.totalItems})`}
              </TabsTrigger>
              {statusDict?.map((status) => {
                const count = calculatedStats[
                  status.code === 'pending_approval' ? 'pending' :
                  status.code === 'approved' ? 'approved' :
                  status.code === 'shipped' ? 'shipped' :
                  status.code === 'delivered' ? 'delivered' :
                  status.code === 'cancelled' ? 'cancelled' :
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
                userType="buyer"
              />
            </TabsContent>
          </Tabs>
      </div>

      <CreateSampleRequestDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen}
      />
    </Layout>
  );
}