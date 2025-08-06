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
    <div className="space-y-6">
      {/* 搜索栏 */}
      <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-4 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="relative">
          <div className="flex gap-3">
            {/* 搜索输入框 */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                type="text"
                placeholder={t('products.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-12 pr-12 h-12 text-base border-border/30 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 bg-background/50"
                disabled={isLoading}
              />
              {searchQuery && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted/80 rounded-md"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            {/* 筛选按钮 */}
            <Button
              type="button"
              variant={hasActiveFilters ? "default" : "outline"}
              size="lg"
              onClick={() => setShowFilters(!showFilters)}
              className="h-12 px-6 font-medium whitespace-nowrap border-border/30 hover:border-primary/50 transition-all duration-200"
            >
              <Filter className="h-5 w-5 mr-2" />
              {t('products.filterTitle')}
              {hasActiveFilters && (
                <Badge 
                  variant="secondary" 
                  className="ml-2 h-5 min-w-5 text-xs bg-primary/20 text-primary-foreground border-primary/30"
                >
                  {[
                    filters.category && filters.category !== 'all' ? 1 : 0,
                    filters.supplierRating && filters.supplierRating !== 'all' ? 1 : 0,
                    filters.isTop100 !== null ? 1 : 0
                  ].reduce((sum, count) => sum + count, 0)}
                </Badge>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* 筛选面板 */}
      {showFilters && (
        <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-6 space-y-6 shadow-sm animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">{t('products.filterTitle')}</h3>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4 mr-2" />
                {t('products.clearSearch')}
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 产品分类筛选 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">
                {t('products.categoryFilter')}
              </label>
              <Select
                value={filters.category || 'all'}
                onValueChange={(value) => onFiltersChange({ ...filters, category: value === 'all' ? '' : value })}
              >
                <SelectTrigger className="h-11 border-border/30 focus:border-primary/50 bg-background/50">
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
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">
                {t('products.supplierRatingFilter')}
              </label>
              <Select
                value={filters.supplierRating || 'all'}
                onValueChange={(value) => onFiltersChange({ ...filters, supplierRating: value === 'all' ? '' : value })}
              >
                <SelectTrigger className="h-11 border-border/30 focus:border-primary/50 bg-background/50">
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
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">
                {t('products.top100Filter')}
              </label>
              <Select
                value={filters.isTop100 === null ? 'all' : filters.isTop100.toString()}
                onValueChange={(value) => onFiltersChange({ 
                  ...filters, 
                  isTop100: value === 'all' ? null : value === 'true' 
                })}
              >
                <SelectTrigger className="h-11 border-border/30 focus:border-primary/50 bg-background/50">
                  <SelectValue placeholder={t('products.allSuppliers')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('products.allSuppliers')}</SelectItem>
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