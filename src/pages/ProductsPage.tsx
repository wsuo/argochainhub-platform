import { Layout } from "@/components/layout/Layout";
import { ProductSearchBar } from "@/components/products/ProductSearchBar";
import { ProductCard } from "@/components/products/ProductCard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/MockAuthContext";
import { useNavigate } from "react-router-dom";
import { productService } from "@/services/productService";
import { dictionaryService } from "@/services/dictionaryService";
import { Product, ProductFilters } from "@/types/product";
import { useQuery } from "@tanstack/react-query";

const ProductsPage = () => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const { currentUserType } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<ProductFilters>({
    category: 'all',
    supplierRating: 'all',
    isTop100: null
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('relevance');
  const [hasToken, setHasToken] = useState(!!localStorage.getItem('agro_access_token'));
  const itemsPerPage = 12;

  // 监听token变化
  useEffect(() => {
    const checkToken = () => {
      const token = !!localStorage.getItem('agro_access_token');
      if (token !== hasToken) {
        console.log('Token status changed:', token);
        setHasToken(token);
      }
    };

    // 立即检查一次
    checkToken();

    // 监听storage变化
    window.addEventListener('storage', checkToken);
    
    // 定期检查（防止同页面内的token变化）
    const interval = setInterval(checkToken, 1000);

    return () => {
      window.removeEventListener('storage', checkToken);
      clearInterval(interval);
    };
  }, [hasToken]);

  // 构建多语言产品计数文本
  const getProductCountText = (count: number) => {
    switch (currentLanguage) {
      case 'en':
        return `Found ${count} products`;
      case 'es': 
        return `Se encontraron ${count} productos`;
      case 'zh':
      default:
        return `共找到 ${count} 个产品`;
    }
  };

  // 获取产品分类字典
  const { data: categoryDict = [], isLoading: isCategoryLoading } = useQuery({
    queryKey: ['product-categories-dict'],
    queryFn: () => {
      console.log('Fetching product categories...');
      return dictionaryService.getProductCategories();
    },
    staleTime: 10 * 60 * 1000, // 10分钟缓存，字典数据变化较少
    enabled: hasToken, // 使用状态变量而不是直接检查localStorage
  });

  // 提取分类标签用于显示
  const categories = categoryDict.map(item => item.label);

  // 构建查询参数
  const queryParams = useMemo(() => {
    const params: Record<string, string | number> = {
      page: currentPage,
      limit: itemsPerPage,
    };
    
    if (searchQuery.trim()) {
      params.search = searchQuery.trim();
    }
    
    if (filters.category && filters.category !== 'all') {
      // 找到对应的字典key
      const categoryItem = categoryDict.find(item => item.label === filters.category);
      if (categoryItem) {
        params.category = categoryItem.key;
      }
    }
    
    return params;
  }, [searchQuery, filters, currentPage, categoryDict]);

  // 获取产品列表
  const {
    data: productsResponse,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['products', queryParams],
    queryFn: () => {
      console.log('Fetching products with params:', queryParams);
      return productService.getProducts(queryParams);
    },
    staleTime: 2 * 60 * 1000, // 2分钟缓存
    enabled: hasToken, // 使用状态变量而不是直接检查localStorage
  });

  // 过滤和排序产品
  const filteredAndSortedProducts = useMemo(() => {
    if (!productsResponse?.data) return [];
    
    let products = [...productsResponse.data];
    
    // 客户端过滤（补充服务端过滤）
    if (filters.supplierRating && filters.supplierRating !== 'all') {
      const minRating = parseFloat(filters.supplierRating);
      products = products.filter(product => parseFloat(product.supplier.rating) >= minRating);
    }
    
    if (filters.isTop100 !== null) {
      products = products.filter(product => product.supplier.isTop100 === filters.isTop100);
    }
    
    // 排序
    switch (sortBy) {
      case 'rating':
        products.sort((a, b) => parseFloat(b.supplier.rating) - parseFloat(a.supplier.rating));
        break;
      case 'name':
        products.sort((a, b) => a.name['zh-CN'].localeCompare(b.name['zh-CN']));
        break;
      case 'relevance':
      default:
        // 保持默认排序（相关度）
        break;
    }
    
    return products;
  }, [productsResponse?.data, filters, sortBy]);

  // 重置页码当搜索条件改变时
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters]);

  // 处理分页
  const totalPages = productsResponse?.meta.totalPages || 1;

  // 处理操作
  const handleAddToCart = (product: Product) => {
    console.log('Add to cart:', product);
    // TODO: 实现添加到购物车逻辑
  };

  const handleInquire = (product: Product) => {
    console.log('Opening inquiry dialog for product:', product);
    // 询价弹窗已经在 ProductCard 组件中处理，这里不需要额外操作
  };

  const handleRequestSample = (product: Product) => {
    console.log('Request sample for product:', product);
    // TODO: 实现申请样品逻辑
  };

  return (
    <Layout userType={currentUserType}>
      <main className="flex-1 p-6 bg-gradient-to-br from-slate-50 via-agro-green-light/30 to-agro-blue-light/40 relative overflow-auto min-h-full">
        {/* 装饰性渐变叠层 */}
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-agro-blue/8 pointer-events-none" />
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-radial from-primary/10 via-primary/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-radial from-agro-blue/8 via-agro-blue/4 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        {/* 内容区域 */}
        <div className="relative z-10 max-w-7xl mx-auto space-y-8 pb-16">
          {/* 页面标题 */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-3">
              {t('products.title')}
            </h1>
            <p className="text-lg text-muted-foreground">
              {t('products.subtitle')}
            </p>
          </div>
          
          {/* 搜索栏 */}
          <div className="mb-8">
            <ProductSearchBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              filters={filters}
              onFiltersChange={setFilters}
              categories={categories}
              isLoading={isLoading}
            />
          </div>

          {/* 结果信息和排序 */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div className="flex items-center space-x-4">
              {productsResponse && (
                <span className="text-base font-medium text-foreground">
                  {getProductCountText(productsResponse.meta.totalItems)}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-muted-foreground">{t('products.sortBy')}:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-44 h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">{t('products.sortByRelevance')}</SelectItem>
                  <SelectItem value="rating">{t('products.sortByRating')}</SelectItem>
                  <SelectItem value="name">{t('products.sortByName')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 内容区域 */}
          {error ? (
            <Alert variant="destructive" className="max-w-2xl mx-auto">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{t('products.errorLoadingDesc')}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  className="ml-4"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {t('products.retry')}
                </Button>
              </AlertDescription>
            </Alert>
          ) : isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(itemsPerPage)].map((_, index) => (
                <div key={index} className="space-y-4">
                  <Skeleton className="h-72 w-full rounded-xl" />
                </div>
              ))}
            </div>
          ) : filteredAndSortedProducts.length === 0 ? (
            <div className="text-center py-16 max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/30 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-muted-foreground mb-2">
                {t('products.noResults')}
              </h3>
              <p className="text-muted-foreground">
                {t('products.noResultsDesc')}
              </p>
            </div>
          ) : (
            <>
              {/* 产品网格 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
                {filteredAndSortedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={() => handleAddToCart(product)}
                    onInquire={() => handleInquire(product)}
                    onRequestSample={() => handleRequestSample(product)}
                  />
                ))}
              </div>

              {/* 分页 */}
              {totalPages > 1 && (
                <div className="flex justify-center pt-8">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                        />
                      </PaginationItem>
                      
                      {[...Array(Math.min(5, totalPages))].map((_, index) => {
                        const pageNumber = index + 1;
                        return (
                          <PaginationItem key={pageNumber}>
                            <PaginationLink
                              onClick={() => setCurrentPage(pageNumber)}
                              isActive={currentPage === pageNumber}
                            >
                              {pageNumber}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </Layout>
  );
};

export default ProductsPage;