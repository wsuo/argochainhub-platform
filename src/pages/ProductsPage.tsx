import { Layout } from "@/components/layout/Layout";
import { ProductCard } from "@/components/products/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { AlertCircle, RefreshCw, Database, Search, Star, Award, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/MockAuthContext";
import { useNavigate } from "react-router-dom";
import { productService } from "@/services/productService";
import { dictionaryService } from "@/services/dictionaryService";
import { Product, ProductFilters } from "@/types/product";
import { useQuery } from "@tanstack/react-query";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { useAuthGuard } from "@/hooks/useAuthGuard";

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
  const itemsPerPage = 12;

  // 使用认证守卫，但不需要在页面级别显示弹窗
  // 因为弹窗会在ProductCard组件中处理
  const {} = useAuthGuard();

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
    // 移除enabled条件，让游客也能获取产品分类
  });

  // 提取分类标签用于显示
  const categories = categoryDict.map(item => ({
    key: item.key,
    label: item.label
  }));

  // 多语言文本处理
  const getLocalizedText = (text: any): string => {
    if (!text) return '';
    if (typeof text === 'string') return text;
    const langKey = currentLanguage as keyof typeof text;
    return text[langKey] || text['zh-CN'] || text['en'] || '';
  };

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
      // 直接使用key作为category参数
      params.category = filters.category;
    }
    
    return params;
  }, [searchQuery, filters, currentPage]);

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
    // 移除enabled条件，让游客也能获取产品列表
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

  // 处理操作 - 现在这些操作由ProductCard内部的认证守卫处理
  const handleAddToCart = (product: Product) => {
    console.log('Add to cart:', product);
    // 购物车操作现在在ProductCard组件内部处理
    // 这个回调主要用于额外的日志记录或分析
  };

  const handleInquire = (product: Product) => {
    console.log('Opening inquiry dialog for product:', product);
    // 询价弹窗已经在 ProductCard 组件中处理，这里不需要额外操作
  };

  const handleRequestSample = (product: Product) => {
    console.log('Request sample for product:', product);
    // TODO: 实现申请样品逻辑
    // 实际的样品申请操作将在这里实现
  };

  return (
    <Layout userType={currentUserType}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 页面头部 */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-3xl mb-6 shadow-2xl shadow-green-500/20">
            <Database className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-green-600 to-emerald-600 bg-clip-text text-transparent mb-3">
            {t('products.title')}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t('products.subtitle')}
          </p>
        </div>
          
        {/* 搜索和筛选区域 */}
        <div className="bg-white/80 backdrop-blur-sm border border-white/30 rounded-2xl p-6 shadow-lg">
          <div className="space-y-4">
            {/* 搜索栏 */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="搜索农药产品名称或描述..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/90 border-gray-300 hover:border-green-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 rounded-xl"
              />
            </div>

            {/* 筛选器 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 产品分类筛选 */}
              <Select 
                value={filters.category === 'all' ? 'all' : filters.category || 'all'} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger className="bg-white/90 border-gray-300 rounded-xl">
                  <Database className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="产品分类" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部分类</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.key} value={category.key}>
                      {getLocalizedText(category.label)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* 供应商评级筛选 */}
              <Select 
                value={filters.supplierRating === 'all' ? 'all' : filters.supplierRating || 'all'} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, supplierRating: value }))}
              >
                <SelectTrigger className="bg-white/90 border-gray-300 rounded-xl">
                  <Star className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="供应商评级" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部评级</SelectItem>
                  <SelectItem value="4">4星以上</SelectItem>
                  <SelectItem value="3">3星以上</SelectItem>
                </SelectContent>
              </Select>

              {/* Top100筛选 */}
              <Select 
                value={filters.isTop100 === null ? 'all' : filters.isTop100.toString()} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, isTop100: value === 'all' ? null : value === 'true' }))}
              >
                <SelectTrigger className="bg-white/90 border-gray-300 rounded-xl">
                  <Award className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Top 100" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部供应商</SelectItem>
                  <SelectItem value="true">仅Top 100</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 重置按钮 */}
            <div className="flex justify-center">
              <Button 
                variant="ghost" 
                onClick={() => {
                  setFilters({ category: 'all', supplierRating: 'all', isTop100: null });
                  setSearchQuery('');
                }} 
                className="text-gray-600 hover:text-green-600"
              >
                重置筛选条件
              </Button>
            </div>
          </div>
        </div>

          {/* 结果统计 */}
          {productsResponse && (
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4" />
                <span>找到 {productsResponse.meta.totalItems} 个产品</span>
              </div>
              <div>
                第 {productsResponse.meta.currentPage || currentPage} 页，共 {productsResponse.meta.totalPages || totalPages} 页
              </div>
            </div>
          )}

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
                <div className="flex items-center justify-center gap-3 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1 || isLoading}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="bg-white/60 border-white/30 hover:bg-white/80 rounded-xl"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    上一页
                  </Button>
                  
                  <div className="flex items-center space-x-2">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let page;
                      if (totalPages <= 5) {
                        page = i + 1;
                      } else if (currentPage <= 3) {
                        page = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        page = totalPages - 4 + i;
                      } else {
                        page = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className={currentPage === page 
                            ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl" 
                            : "bg-white/60 border-white/30 hover:bg-white/80 rounded-xl"
                          }
                        >
                          {page}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages || isLoading}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className="bg-white/60 border-white/30 hover:bg-white/80 rounded-xl"
                  >
                    下一页
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}
      </div>
    </Layout>
  );
};

export default ProductsPage;