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
import { useSampleFilters } from '@/hooks/useSample';

export interface SampleFiltersData {
  keyword: string;
  status: string;
  dateFrom?: string;
  dateTo?: string;
}

interface SampleFiltersV2Props {
  filters: SampleFiltersData;
  onFiltersChange: (filters: SampleFiltersData) => void;
  loading?: boolean;
}

export const SampleFiltersV2 = ({ filters, onFiltersChange, loading = false }: SampleFiltersV2Props) => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const { data: filterOptions } = useSampleFilters();

  const handleFilterChange = (key: keyof SampleFiltersData, value: string | undefined) => {
    onFiltersChange({
      ...filters,
      [key]: value || '',
    });
  };

  const handleReset = () => {
    onFiltersChange({
      keyword: '',
      status: '',
      dateFrom: '',
      dateTo: '',
    });
  };

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'status' && value === 'all') return false;
    return value !== '' && value !== undefined;
  });

  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'status' && (value === 'all' || value === '')) return false;
    return value !== '' && value !== undefined;
  }).length;

  // 获取状态标签的多语言文本
  const getStatusLabel = (status: any): string => {
    const langKey = currentLanguage === 'zh' ? 'zh-CN' : currentLanguage;
    
    // 优先使用 name 字段（字典标准字段）
    if (status.name && typeof status.name === 'object') {
      return status.name[langKey] || status.name['zh-CN'] || status.value;
    }
    
    // 其次使用 label 字段
    if (typeof status.label === 'object' && status.label !== null) {
      return status.label[langKey] || status.label['zh-CN'] || status.value;
    }
    
    return status.label || status.value;
  };

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
          <div className="space-y-2 flex-1 sm:min-w-[240px] lg:max-w-sm">
            <Label htmlFor="search">{t('samples.filters.search')}</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder={t('samples.filters.searchPlaceholder')}
                value={filters.keyword || ''}
                onChange={(e) => handleFilterChange('keyword', e.target.value)}
                className="pl-10"
                disabled={loading}
              />
            </div>
          </div>

          {/* 状态筛选 */}
          <div className="space-y-2 w-full sm:w-48">
            <Label htmlFor="status">{t('samples.filters.status')}</Label>
            <Select 
              value={filters.status || "all"} 
              onValueChange={(value) => handleFilterChange('status', value === 'all' ? '' : value)}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder={t('samples.filters.statusPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('samples.filters.allStatus')}</SelectItem>
                {filterOptions?.data.statuses.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {getStatusLabel(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 日期范围 */}
          <div className="space-y-2 w-full sm:w-auto">
            <Label>{t('samples.filters.dateRange')}</Label>
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
            {t('common.reset')}
          </Button>
        </div>
      </div>
    </div>
  );
};