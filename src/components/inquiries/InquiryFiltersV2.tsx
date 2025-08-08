import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, RotateCcw, Filter } from 'lucide-react';
import type { InquiryFiltersData } from './InquiryFilters';

interface InquiryFiltersV2Props {
  filters: InquiryFiltersData;
  onFiltersChange: (filters: InquiryFiltersData) => void;
  loading?: boolean;
}

export const InquiryFiltersV2 = ({ filters, onFiltersChange, loading = false }: InquiryFiltersV2Props) => {
  const { t } = useTranslation();

  const handleFilterChange = (key: keyof InquiryFiltersData, value: string | undefined) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const handleReset = () => {
    onFiltersChange({
      search: '',
      dateFrom: '',
      dateTo: '',
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '' && value !== undefined);

  return (
    <div className="space-y-4">
      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span className="text-primary">{Object.values(filters).filter(v => v).length} 个筛选条件已激活</span>
        </div>
      )}
      
      <div className="flex items-end justify-between gap-4">
        {/* 筛选条件区域 */}
        <div className="flex items-end gap-4">
          {/* 关键词搜索 */}
          <div className="space-y-2 w-80">
            <Label htmlFor="search">{t('inquiry.searchInquiry', '关键词搜索')}</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder={t('inquiry.searchPlaceholder', '询价单号、公司名称、产品名称等')}
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
                disabled={loading}
              />
            </div>
          </div>

          {/* 日期范围 */}
          <div className="space-y-2 w-72">
            <Label>{t('inquiry.dateRange', '日期范围')}</Label>
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
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={loading || !hasActiveFilters}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          {t('inquiry.reset', '重置')}
        </Button>
      </div>
    </div>
  );
};