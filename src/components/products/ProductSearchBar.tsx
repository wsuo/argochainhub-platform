import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, X, Filter } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import { useState, useEffect } from "react";
import { ProductFilters } from "@/types/product";

interface ProductSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
  categories: string[];
  isLoading?: boolean;
}

export const ProductSearchBar = ({
  searchQuery,
  onSearchChange,
  filters,
  onFiltersChange,
  categories,
  isLoading = false
}: ProductSearchBarProps) => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const [showFilters, setShowFilters] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 搜索会通过searchQuery的变化自动触发
  };

  const clearSearch = () => {
    onSearchChange('');
  };

  const clearFilters = () => {
    onFiltersChange({
      category: 'all',
      supplierRating: 'all',
      isTop100: null
    });
  };

  const hasActiveFilters = filters.category && filters.category !== 'all' || 
                          filters.supplierRating && filters.supplierRating !== 'all' || 
                          filters.isTop100 !== null;

  return (
    <div className="space-y-4">
      {/* 搜索栏 */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder={t('products.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-20"
            disabled={isLoading}
          />
          {searchQuery && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="absolute right-12 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        
        {/* 筛选按钮 */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="absolute right-1 top-1/2 transform -translate-y-1/2"
        >
          <Filter className="h-4 w-4 mr-1" />
          {t('products.filterTitle')}
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-1 h-4 text-xs">
              {[
                filters.category && filters.category !== 'all' ? 1 : 0,
                filters.supplierRating && filters.supplierRating !== 'all' ? 1 : 0,
                filters.isTop100 !== null ? 1 : 0
              ].reduce((sum, count) => sum + count, 0)}
            </Badge>
          )}
        </Button>
      </form>

      {/* 筛选面板 */}
      {showFilters && (
        <div className="bg-card border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">{t('products.filterTitle')}</h3>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-muted-foreground"
              >
                {t('products.clearSearch')}
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 产品分类筛选 */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                {t('products.categoryFilter')}
              </label>
              <Select
                value={filters.category || 'all'}
                onValueChange={(value) => onFiltersChange({ ...filters, category: value === 'all' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('products.allCategories')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('products.allCategories')}</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 供应商评级筛选 */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                {t('products.supplierRatingFilter')}
              </label>
              <Select
                value={filters.supplierRating || 'all'}
                onValueChange={(value) => onFiltersChange({ ...filters, supplierRating: value === 'all' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('products.allRatings')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('products.allRatings')}</SelectItem>
                  <SelectItem value="4">{t('products.ratingAbove4')}</SelectItem>
                  <SelectItem value="3">{t('products.ratingAbove3')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Top100供应商筛选 */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                {t('products.top100Filter')}
              </label>
              <Select
                value={filters.isTop100 === null ? 'all' : filters.isTop100.toString()}
                onValueChange={(value) => onFiltersChange({ 
                  ...filters, 
                  isTop100: value === 'all' ? null : value === 'true' 
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('products.allCategories')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('products.allCategories')}</SelectItem>
                  <SelectItem value="true">{t('products.onlyTop100')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};