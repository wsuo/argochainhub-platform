import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { QuoteList } from '@/components/quotes/QuoteList';
import { QuoteFilters } from '@/components/quotes/QuoteFilters';
import { dictionaryService } from '@/services/dictionaryService';
import { useLanguage } from '@/hooks/useLanguage';
import type { QuoteFilters as QuoteFiltersType } from '@/types/quote';

export default function QuoteManagement() {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const [filters, setFilters] = useState<QuoteFiltersType>({
    status: '',
    keyword: '',
    startDate: '',
    endDate: '',
  });

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

  const handleFiltersChange = (newFilters: QuoteFiltersType) => {
    setFilters(newFilters);
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t('quote.management', '报价管理')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('quote.management.description', '管理和处理来自采购商的询价单，及时响应报价需求')}
          </p>
        </div>
      </div>

      {/* 筛选器 */}
      <Card>
        <CardContent className="pt-6">
          <QuoteFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
        </CardContent>
      </Card>

      {/* 报价列表标签页 */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all" className="flex items-center gap-2">
            {t('quote.status.all', '全部')}
          </TabsTrigger>
          {statusDict.slice(0, 5).map((status) => (
            <TabsTrigger key={status.code} value={status.code} className="flex items-center gap-2">
              {getStatusLabel(status.code)}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <QuoteList filters={filters} />
        </TabsContent>
        {statusDict.map((status) => (
          <TabsContent key={status.code} value={status.code} className="mt-6">
            <QuoteList filters={{ ...filters, status: status.code }} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}