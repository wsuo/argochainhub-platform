import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/hooks/useLanguage';
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
import { useQuery } from '@tanstack/react-query';
import { dictionaryService } from '@/services/dictionaryService';
import type { InquiryFiltersData } from './InquiryFilters';

interface InquiryFiltersV2Props {
  filters: InquiryFiltersData;
  onFiltersChange: (filters: InquiryFiltersData) => void;
  loading?: boolean;
}

export const InquiryFiltersV2 = ({ filters, onFiltersChange, loading = false }: InquiryFiltersV2Props) => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();

  // 获取询价状态字典
  const { data: statusDict = [] } = useQuery({
    queryKey: ['inquiry-status-dict'],
    queryFn: () => dictionaryService.getInquiryStatuses(),
    staleTime: 10 * 60 * 1000,
  });

  const getLocalizedLabel = (item: { name?: Record<string, string>; label?: string; code: string }) => {
    const langKey = currentLanguage === 'zh' ? 'zh-CN' : currentLanguage;
    return item.name?.[langKey] || item.name?.['zh-CN'] || item.label || item.code;
  };

  const handleFilterChange = (key: keyof InquiryFiltersData, value: string | undefined) => {
    onFiltersChange({
      ...filters,
      [key]: value || '',
    });
  };

  const handleReset = () => {
    onFiltersChange({
      search: '',
      status: '',
      dateFrom: '',
      dateTo: '',
    });
  };

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'status' && (value === 'all' || value === '')) return false;
    return value !== '' && value !== undefined;
  });

  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'status' && (value === 'all' || value === '')) return false;
    return value !== '' && value !== undefined;
  }).length;

  return (
    <div className="space-y-4">
      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span className="text-primary">{activeFilterCount} 个筛选条件已激活</span>
        </div>
      )}
      
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        {/* 筛选条件区域 */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 flex-1">
          {/* 关键词搜索 */}
          <div className="space-y-2 flex-1 sm:min-w-[280px] lg:max-w-md">
            <Label htmlFor="search">{t('inquiry.filters.search', '搜索')}</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder={t('inquiry.filters.searchPlaceholder', '询价单号、公司名称、产品名称...')}
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
                disabled={loading}
              />
            </div>
          </div>

          {/* 状态筛选 */}
          <div className="space-y-2 w-full sm:w-44">
            <Label htmlFor="status">{t('inquiry.filters.status', '状态')}</Label>
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => handleFilterChange('status', value === 'all' ? '' : value)}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder={t('inquiry.filters.allStatus', '全部状态')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('inquiry.filters.allStatus', '全部状态')}</SelectItem>
                {statusDict.map((status) => (
                  <SelectItem key={status.code} value={status.code}>
                    {getLocalizedLabel(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 日期范围 */}
          <div className="space-y-2 w-full sm:w-auto">
            <Label>{t('inquiry.filters.dateRange', '日期范围')}</Label>
            <div className="flex items-center gap-1">
              <Input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                disabled={loading}
                className="text-sm flex-1 min-w-0"
              />
              <span className="text-muted-foreground text-xs px-1 shrink-0">至</span>
              <Input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                disabled={loading}
                className="text-sm flex-1 min-w-0"
              />
            </div>
          </div>
        </div>

        {/* 重置按钮 */}
        <div className="flex justify-end sm:justify-start">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={loading || !hasActiveFilters}
            className="w-full sm:w-auto"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            {t('common.reset', '重置')}
          </Button>
        </div>
      </div>
    </div>
  );
};