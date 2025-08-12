import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/hooks/useLanguage';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Check, ChevronsUpDown, Search, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { lookupService } from '@/services/lookupService';

interface ProductItem {
  id: string;
  name: {
    'zh-CN': string;
    en?: string;
    es?: string;
  };
  supplierId: string;
}

interface ProductSelectorProps {
  value?: string;
  onValueChange: (productId: string, productName: string) => void;
  supplierId?: string;
  placeholder?: string;
  disabled?: boolean;
}

export const ProductSelector = ({
  value,
  onValueChange,
  supplierId,
  placeholder,
  disabled = false
}: ProductSelectorProps) => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 防抖处理搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  // ESC 键关闭下拉框
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscKey);
      return () => document.removeEventListener('keydown', handleEscKey);
    }
  }, [open]);

  // 获取本地化名称
  const getLocalizedName = useCallback((nameObj: ProductItem['name']): string => {
    const langKey = currentLanguage === 'zh' ? 'zh-CN' : currentLanguage;
    return nameObj[langKey as keyof typeof nameObj] || nameObj['zh-CN'] || '';
  }, [currentLanguage]);

  // 过滤空名称的函数
  const filterValidProducts = useCallback((products: ProductItem[]) => {
    return products.filter(product => {
      const name = getLocalizedName(product.name);
      return name && name.trim().length > 0;
    });
  }, [getLocalizedName]);

  // 使用无限查询获取产品列表
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage
  } = useInfiniteQuery({
    queryKey: ['products-lookup-infinite', supplierId, debouncedSearchTerm],
    queryFn: ({ pageParam = 1 }) => lookupService.getProducts({
      search: debouncedSearchTerm || undefined,
      supplierId: supplierId ? Number(supplierId) : undefined,
      limit: 20,
      page: pageParam
    }),
    getNextPageParam: (lastPage) => {
      // 使用后端返回的 hasNextPage 来判断是否有下一页
      return lastPage.meta?.hasNextPage ? (lastPage.meta.currentPage + 1) : undefined;
    },
    staleTime: 5 * 60 * 1000, // 5分钟缓存
    enabled: !!supplierId, // 只有选择了供应商才启用查询
    initialPageParam: 1
  });

  // 合并所有页面的数据并过滤空名称
  const products = data?.pages.flatMap(page => page.data || []) || [];
  const validProducts = filterValidProducts(products);

  // 处理滚动事件
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 50; // 提前50px触发
    
    if (isNearBottom && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // 当供应商变化时清空已选产品
  useEffect(() => {
    if (value && supplierId) {
      // 需要重新获取产品列表后再检查
      const checkProductValidity = async () => {
        try {
          const response = await lookupService.getProducts({
            supplierId: Number(supplierId),
            limit: 50
          });
          const products = response?.data || [];
          
          // 检查当前选中的产品是否属于新选择的供应商
          const selectedProduct = products.find(p => p.id === value);
          if (!selectedProduct || selectedProduct.supplierId !== supplierId) {
            onValueChange('', '');
          }
        } catch (error) {
          // 如果查询失败，为安全起见清空选择
          onValueChange('', '');
        }
      };
      
      checkProductValidity();
    }
  }, [supplierId, value, onValueChange]);

  // 找到当前选中的产品
  const selectedProduct = validProducts.find(product => product.id === value);

  const handleSelect = (productId: string) => {
    const product = validProducts.find(p => p.id === productId);
    if (product) {
      onValueChange(productId, getLocalizedName(product.name));
    }
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      <Label>{t('samples.createDialog.product')}</Label>
      <div className="relative" ref={dropdownRef}>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled || !supplierId}
          onClick={() => setOpen(!open)}
        >
          {selectedProduct ? (
            <span className="truncate">{getLocalizedName(selectedProduct.name)}</span>
          ) : (
            <span className="text-muted-foreground">
              {!supplierId 
                ? t('samples.createDialog.selectSupplierFirst')
                : placeholder || t('samples.createDialog.selectProduct')
              }
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
        
        {open && (
          <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg z-[80] max-w-[400px]">
            <div className="flex flex-col">
              <div className="flex items-center border-b px-3">
                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                <input
                  placeholder={t('samples.createDialog.searchProduct')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  autoFocus
                />
              </div>
              <div 
                ref={scrollRef}
                className="max-h-[240px] overflow-y-auto overscroll-contain"
                onScroll={handleScroll}
                style={{ 
                  scrollBehavior: 'smooth',
                  WebkitOverflowScrolling: 'touch' // iOS Safari 优化
                }}
              >
                {!supplierId ? (
                  <div className="py-6 text-center text-sm text-muted-foreground pointer-events-none">
                    {t('samples.createDialog.selectSupplierFirst')}
                  </div>
                ) : isLoading && validProducts.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground pointer-events-none">
                    {t('common.loading')}
                  </div>
                ) : validProducts.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground pointer-events-none">
                    {searchTerm ? t('common.noSearchResults') : t('samples.createDialog.noProductsFound')}
                  </div>
                ) : (
                  <div className="p-1">
                    {validProducts.map((product) => (
                      <div
                        key={product.id}
                        className={cn(
                          "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                          value === product.id && "bg-accent text-accent-foreground"
                        )}
                        onClick={() => handleSelect(product.id)}
                        onMouseDown={(e) => e.preventDefault()} // 防止影响滚动
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4 flex-shrink-0",
                            value === product.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex items-center gap-2 w-full">
                          <Package className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <span className="truncate">{getLocalizedName(product.name)}</span>
                        </div>
                      </div>
                    ))}
                    {isFetchingNextPage && (
                      <div className="py-2 text-center text-sm text-muted-foreground pointer-events-none">
                        {t('common.loadingMore')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};