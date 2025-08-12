import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { QuoteTable } from '@/components/quotes/QuoteTable';
import { QuoteFiltersV2, QuoteFiltersData } from '@/components/quotes/QuoteFiltersV2';
import { useLanguage } from '@/hooks/useLanguage';
import { dictionaryService } from '@/services/dictionaryService';
import { quoteApi } from '@/services/quoteApi';
import type { QuoteFilters } from '@/types/quote';

export default function QuoteManagement() {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const [tab, setTab] = useState<string>('all');
  const [currentPage] = useState(1);
  
  const [filters, setFilters] = useState<QuoteFiltersData>({
    keyword: '',
    status: '',
    dateFrom: '',
    dateTo: '',
  });

  // 转换筛选器格式
  const apiFilters = useMemo<QuoteFilters>(() => {
    const result: QuoteFilters = {};
    if (filters.keyword) result.keyword = filters.keyword;
    if (filters.dateFrom) result.startDate = filters.dateFrom;
    if (filters.dateTo) result.endDate = filters.dateTo;
    
    // 处理状态筛选：Tab优先级高于筛选器
    if (tab !== 'all') {
      result.status = tab;
    } else if (filters.status && filters.status !== 'all') {
      result.status = filters.status;
    }
    
    return result;
  }, [filters, tab]);
  
  // 获取报价列表数据
  const { data: quotesData, isLoading: quotesLoading } = useQuery({
    queryKey: ['quotes', apiFilters, currentPage],
    queryFn: () => quoteApi.getQuotes(apiFilters, currentPage, 10),
    staleTime: 5 * 60 * 1000,
  });
  
  // 获取询价状态字典数据
  const { data: statusDict = [] } = useQuery({
    queryKey: ['inquiry-status-dict'],
    queryFn: () => dictionaryService.getInquiryStatuses(),
    staleTime: 10 * 60 * 1000,
  });

  // 获取供应商报价统计数据
  const { data: statsData } = useQuery({
    queryKey: ['quote-stats'],
    queryFn: () => quoteApi.getQuoteStats(),
    staleTime: 30 * 1000,
  });

  // 计算统计数据
  const stats = useMemo(() => {
    if (!statsData) {
      return {
        pendingQuote: 0,
        quoted: 0,
        confirmed: 0,
        declined: 0,
        cancelled: 0,
        total: 0
      };
    }
    
    return {
      pendingQuote: statsData.pendingQuoteCount || 0,
      quoted: statsData.quotedCount || 0,
      confirmed: statsData.confirmedCount || 0,
      declined: statsData.declinedCount || 0,
      cancelled: statsData.cancelledCount || 0,
      total: statsData.totalCount || 0
    };
  }, [statsData]);

  // 处理筛选器变更
  const handleFilterChange = (newFilters: QuoteFiltersData) => {
    setFilters(newFilters);
  };

  return (
    <Layout userType="supplier">
      <div className="space-y-6">
        {/* 页面标题 */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t('quote.management', '报价管理')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('quote.management.description', '管理和处理来自采购商的询价单，及时响应报价需求')}
          </p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('quote.stats.pending', '待报价')}
                  </p>
                  <p className="text-2xl font-bold">{stats.pendingQuote}</p>
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
                    {t('quote.stats.quoted', '已报价')}
                  </p>
                  <p className="text-2xl font-bold">{stats.quoted}</p>
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
                    {t('quote.stats.confirmed', '已确认')}
                  </p>
                  <p className="text-2xl font-bold">{stats.confirmed}</p>
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
                    {t('quote.stats.declined', '已拒绝')}
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
                    {t('quote.stats.cancelled', '已取消')}
                  </p>
                  <p className="text-2xl font-bold">{stats.cancelled}</p>
                </div>
                <Clock className="h-8 w-8 text-gray-600 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 筛选器 */}
        <Card>
          <CardContent className="pt-6">
            <QuoteFiltersV2
              filters={filters}
              onFiltersChange={handleFilterChange}
              loading={quotesLoading}
            />
          </CardContent>
        </Card>

        {/* 报价列表标签页 */}
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${(statusDict?.length || 0) + 1}, minmax(0, 1fr))` }}>
            <TabsTrigger value="all" className="flex items-center gap-2">
              {t('quote.tabs.all', '全部')}
              {` (${stats.total})`}
            </TabsTrigger>
            {statusDict?.map((status) => {
              const count = stats[
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
            <QuoteTable 
              loading={quotesLoading} 
              items={quotesData?.data || []} 
              userType="supplier"
            />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}