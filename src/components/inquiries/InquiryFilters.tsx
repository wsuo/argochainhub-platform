import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { InquiryStatus } from "@/types/inquiry";
import { dictionaryService, DictionaryItem } from "@/services/dictionaryService";
import { Search, Filter, X, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// 筛选器参数接口
export interface InquiryFiltersData {
  search?: string;
  status?: InquiryStatus;
  dateFrom?: string;
  dateTo?: string;
}

interface InquiryFiltersProps {
  filters: InquiryFiltersData;
  onFiltersChange: (filters: InquiryFiltersData) => void;
}

export const InquiryFilters = ({ filters, onFiltersChange }: InquiryFiltersProps) => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState<InquiryFiltersData>(filters);

  // 获取询价状态字典数据
  const { data: statusDict = [] } = useQuery({
    queryKey: ['inquiry-status-dict'],
    queryFn: () => dictionaryService.getInquiryStatuses(),
    staleTime: 10 * 60 * 1000, // 10分钟缓存
  });

  const handleFilterChange = (key: keyof InquiryFiltersData, value: string | undefined) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
  };

  const clearFilters = () => {
    const clearedFilters: InquiryFiltersData = {};
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters = Object.values(localFilters).some(value => value !== undefined && value !== '');

  // 获取状态显示文本
  const getStatusLabel = (statusCode: string): string => {
    const statusItem = statusDict.find((item: DictionaryItem) => item.code === statusCode);
    if (!statusItem) return statusCode;
    
    const langKey = currentLanguage as keyof typeof statusItem.name;
    return statusItem.name[langKey] || statusItem.name['zh-CN'] || statusCode;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            {t('inquiry.filterAndSearch')}
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-muted-foreground"
              >
                <X className="w-4 h-4 mr-2" />
                {t('common.clear')}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? t('common.collapse') : t('common.expand')}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Search */}
          <div className="space-y-2">
            <Label>{t('inquiry.searchInquiry')}</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder={t('inquiry.searchPlaceholder')}
                value={localFilters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {isExpanded && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Status Filter */}
              <div className="space-y-2">
                <Label>{t('inquiry.filterByStatus')}</Label>
                <Select
                  value={localFilters.status || 'all'}
                  onValueChange={(value) => handleFilterChange('status', value === 'all' ? undefined : value as InquiryStatus)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('inquiry.allStatus')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('inquiry.allStatus')}</SelectItem>
                    {statusDict.map((status) => (
                      <SelectItem key={status.code} value={status.code}>
                        {getStatusLabel(status.code)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date From */}
              <div className="space-y-2">
                <Label>{t('inquiry.dateFrom')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !localFilters.dateFrom && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {localFilters.dateFrom ? (
                        format(new Date(localFilters.dateFrom), "PPP")
                      ) : (
                        <span>{t('inquiry.selectDate')}</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={localFilters.dateFrom ? new Date(localFilters.dateFrom) : undefined}
                      onSelect={(date) => handleFilterChange('dateFrom', date?.toISOString().split('T')[0])}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Date To */}
              <div className="space-y-2">
                <Label>{t('inquiry.dateTo')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !localFilters.dateTo && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {localFilters.dateTo ? (
                        format(new Date(localFilters.dateTo), "PPP")
                      ) : (
                        <span>{t('inquiry.selectDate')}</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={localFilters.dateTo ? new Date(localFilters.dateTo) : undefined}
                      onSelect={(date) => handleFilterChange('dateTo', date?.toISOString().split('T')[0])}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          {/* Apply Filters Button */}
          <div className="flex justify-end">
            <Button onClick={applyFilters}>
              {t('inquiry.applyFilters')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};