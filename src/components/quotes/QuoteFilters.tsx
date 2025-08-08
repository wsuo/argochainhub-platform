import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Search, RotateCcw, Filter } from 'lucide-react';
import { dictionaryService } from '@/services/dictionaryService';
import { useLanguage } from '@/hooks/useLanguage';
import type { QuoteFilters } from '@/types/quote';

interface QuoteFiltersProps {
  filters: QuoteFilters;
  onFiltersChange: (filters: QuoteFilters) => void;
  loading?: boolean;
}

export const QuoteFilters = ({ filters, onFiltersChange, loading = false }: QuoteFiltersProps) => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();

  // 获取询价状态字典
  const { data: statusDict = [] } = useQuery({
    queryKey: ['inquiry-status-dict'],
    queryFn: () => dictionaryService.getInquiryStatuses(),
    staleTime: 10 * 60 * 1000, // 10分钟缓存
  });

  // 根据当前语言获取状态显示文本
  const getStatusLabel = (status: any): string => {
    const langKey = currentLanguage === 'zh' ? 'zh-CN' : currentLanguage;
    return status.name?.[langKey] || status.name?.['zh-CN'] || status.code || '';
  };

  const handleFilterChange = (key: keyof QuoteFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const handleReset = () => {
    onFiltersChange({
      status: '',
      keyword: '',
      startDate: '',
      endDate: '',
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '' && value !== undefined);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Filter className="h-4 w-4" />
        <span>{t('quote.filters.title', '筛选条件')}</span>
        {hasActiveFilters && (
          <span className="text-primary">({Object.values(filters).filter(v => v).length} 个条件有效)</span>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* 关键词搜索 */}
        <div className="space-y-2 lg:col-span-2">
          <Label htmlFor="keyword">{t('quote.keyword', '关键词搜索')}</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="keyword"
              placeholder={t('quote.keyword.placeholder', '询价单号、公司名称、产品名称等')}
              value={filters.keyword || ''}
              onChange={(e) => handleFilterChange('keyword', e.target.value)}
              className="pl-10"
              disabled={loading}
            />
          </div>
        </div>

        {/* 状态筛选 */}
        <div className="space-y-2">
          <Label>{t('quote.status', '状态')}</Label>
          <Select
            value={filters.status || 'all'}
            onValueChange={(value) => handleFilterChange('status', value === 'all' ? '' : value)}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('quote.status.select', '选择状态')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('quote.status.all', '全部状态')}</SelectItem>
              {statusDict.map((status) => (
                <SelectItem key={status.code} value={status.code}>
                  {getStatusLabel(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 日期范围 */}
        <div className="space-y-2 lg:col-span-2">
          <Label>{t('quote.dateRange', '日期范围')}</Label>
          <div className="flex items-center gap-1">
            <Input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              disabled={loading}
              className="text-sm flex-1 min-w-0"
            />
            <span className="text-muted-foreground text-xs px-1 shrink-0">至</span>
            <Input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              disabled={loading}
              className="text-sm flex-1 min-w-0"
            />
          </div>
        </div>

        {/* 重置按钮 */}
        <div className="flex items-end">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={loading || !hasActiveFilters}
            className="w-full"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            {t('quote.reset', '重置')}
          </Button>
        </div>
      </div>
    </div>
  );
};