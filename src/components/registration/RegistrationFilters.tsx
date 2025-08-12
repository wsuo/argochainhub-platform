import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Search, Filter, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { RegistrationFiltersData } from '@/types/registration';
import { useQuery } from '@tanstack/react-query';
import { dictionaryService } from '@/services/dictionaryService';
import { useLanguage } from '@/hooks/useLanguage';

interface RegistrationFiltersProps {
  filters: RegistrationFiltersData;
  onFiltersChange: (filters: RegistrationFiltersData) => void;
  loading?: boolean;
}

export const RegistrationFilters: React.FC<RegistrationFiltersProps> = ({
  filters,
  onFiltersChange,
  loading = false,
}) => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();

  // 获取登记状态字典
  const { data: statusDict = [] } = useQuery({
    queryKey: ['registration-status-dict'],
    queryFn: () => dictionaryService.getRegistrationStatuses(),
    staleTime: 10 * 60 * 1000,
  });

  // 获取国家字典
  const { data: countryDict = [] } = useQuery({
    queryKey: ['country-dict'],
    queryFn: () => dictionaryService.getCountries(),
    staleTime: 10 * 60 * 1000,
  });

  const getLocalizedLabel = (item: { name?: Record<string, string>; label?: string; code: string }) => {
    const langKey = currentLanguage === 'zh' ? 'zh-CN' : currentLanguage;
    return item.name?.[langKey] || item.name?.['zh-CN'] || item.label || item.code;
  };

  const handleInputChange = (field: keyof RegistrationFiltersData, value: string) => {
    onFiltersChange({ ...filters, [field]: value });
  };

  const handleReset = () => {
    onFiltersChange({
      search: '',
      status: '',
      targetCountry: '',
      dateFrom: '',
      dateTo: '',
    });
  };

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'status' && (value === 'all' || value === '')) return false;
    if (key === 'targetCountry' && (value === 'all' || value === '')) return false;
    return value !== '' && value !== undefined;
  });

  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'status' && (value === 'all' || value === '')) return false;
    if (key === 'targetCountry' && (value === 'all' || value === '')) return false;
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
            <Label htmlFor="search">{t('registration.filters.search', '搜索')}</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder={t('registration.filters.searchPlaceholder', '登记单号、产品名称...')}
                value={filters.search || ''}
                onChange={(e) => handleInputChange('search', e.target.value)}
                className="pl-10"
                disabled={loading}
              />
            </div>
          </div>

          {/* 状态筛选 */}
          <div className="space-y-2 w-full sm:w-44">
            <Label htmlFor="status">{t('registration.filters.status', '状态')}</Label>
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => handleInputChange('status', value === 'all' ? '' : value)}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder={t('registration.filters.allStatus', '全部状态')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('registration.filters.allStatus', '全部状态')}</SelectItem>
                {statusDict.map((status) => (
                  <SelectItem key={status.code} value={status.code}>
                    {getLocalizedLabel(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 目标国家筛选 */}
          <div className="space-y-2 w-full sm:w-44">
            <Label htmlFor="country">{t('registration.filters.targetCountry', '目标国家')}</Label>
            <Select
              value={filters.targetCountry || 'all'}
              onValueChange={(value) => handleInputChange('targetCountry', value === 'all' ? '' : value)}
            >
              <SelectTrigger id="country">
                <SelectValue placeholder={t('registration.filters.allCountries', '全部国家')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('registration.filters.allCountries', '全部国家')}</SelectItem>
                {countryDict.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {getLocalizedLabel(country)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            {t('registration.filters.reset', '重置')}
          </Button>
        </div>
      </div>
    </div>
  );
};