import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Building2, 
  Search, 
  Star, 
  Heart, 
  MapPin, 
  Users, 
  Eye,
  Filter,
  SortAsc,
  SortDesc,
  Globe,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { SupplierService } from '@/services/supplierService';
import { dictionaryService } from '@/services/dictionaryService';
import { 
  Supplier, 
  SupplierTab, 
  SupplierFilters,
  SupplierSearchParams,
  SupplierFavorite,
  GetFavoritesParams 
} from '@/types/supplier';
import { useLanguage } from '@/hooks/useLanguage';

const SuppliersPage = () => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const navigate = useNavigate();

  // 状态管理
  const [activeTab, setActiveTab] = useState<SupplierTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [favorites, setFavorites] = useState<Record<number, boolean>>({});
  const [filters, setFilters] = useState<SupplierFilters>({
    search: '',
    country: 'ALL_COUNTRIES',
    companySize: 'ALL_SIZES',
    sortBy: 'createdAt',
    sortOrder: 'DESC'
  });

  // 搜索防抖处理
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 800);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 构建API查询参数
  const searchParams = useMemo((): SupplierSearchParams => {
    return {
      search: debouncedSearchQuery || undefined,
      country: filters.country === 'ALL_COUNTRIES' ? undefined : filters.country || undefined,
      companySize: filters.companySize === 'ALL_SIZES' ? undefined : (filters.companySize as any) || undefined,
      sortBy: filters.sortBy as any,
      sortOrder: filters.sortOrder,
      page: currentPage,
      limit: 20,
      isTop100: activeTab === 'top100' ? true : undefined
    };
  }, [debouncedSearchQuery, filters, currentPage, activeTab]);

  // 构建收藏查询参数
  const favoritesParams = useMemo((): GetFavoritesParams => {
    return {
      search: debouncedSearchQuery || undefined,
      page: currentPage,
      limit: 20
    };
  }, [debouncedSearchQuery, currentPage]);

  // 获取字典数据
  const { data: companySizeDict = [] } = useQuery({
    queryKey: ['company-size-dict'],
    queryFn: () => dictionaryService.getDictionary('company_size'),
    staleTime: 10 * 60 * 1000, // 10分钟缓存
  });

  const { data: companyStatusDict = [] } = useQuery({
    queryKey: ['company-status-dict'],
    queryFn: () => dictionaryService.getDictionary('company_status'),
    staleTime: 10 * 60 * 1000,
  });

  const { data: countriesDict = [] } = useQuery({
    queryKey: ['countries-dict'],
    queryFn: () => dictionaryService.getDictionary('countries'),
    staleTime: 10 * 60 * 1000,
  });

  const { data: businessTypeDict = [] } = useQuery({
    queryKey: ['business-type-dict'],
    queryFn: () => dictionaryService.getDictionary('business_type'),
    staleTime: 10 * 60 * 1000,
  });
  const { 
    data: suppliersResponse, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['suppliers', searchParams],
    queryFn: () => SupplierService.searchSuppliers(searchParams),
    staleTime: 10 * 60 * 1000, // 10分钟缓存
    enabled: activeTab !== 'favorites'
  });

  // 获取收藏供应商列表
  const {
    data: favoritesResponse,
    isLoading: favoritesLoading,
    error: favoritesError,
    refetch: refetchFavorites
  } = useQuery({
    queryKey: ['favorite-suppliers', favoritesParams],
    queryFn: () => SupplierService.getFavorites(favoritesParams),
    staleTime: 5 * 60 * 1000, // 5分钟缓存（收藏状态可能变化较快）
    enabled: activeTab === 'favorites'
  });

  // 根据当前tab确定显示的数据
  const suppliers = activeTab === 'favorites' 
    ? (favoritesResponse?.data?.map(fav => fav.supplier) || []).filter(Boolean)
    : (suppliersResponse?.data || []);
  const meta = activeTab === 'favorites' ? favoritesResponse?.meta : suppliersResponse?.meta;
  const currentLoading = activeTab === 'favorites' ? favoritesLoading : isLoading;
  const currentError = activeTab === 'favorites' ? favoritesError : error;
  const currentRefetch = activeTab === 'favorites' ? refetchFavorites : refetch;

  // 获取收藏状态
  useEffect(() => {
    if (suppliers.length > 0) {
      const supplierIds = suppliers.map(s => s.id);
      SupplierService.batchCheckFavoriteStatus(supplierIds)
        .then(favoriteStatus => {
          setFavorites(prev => ({ ...prev, ...favoriteStatus }));
        })
        .catch(error => {
          console.warn('Failed to fetch favorite status:', error);
        });
    }
  }, [suppliers]);

  // 处理收藏/取消收藏
  const handleToggleFavorite = async (supplier: Supplier) => {
    try {
      const isFavorited = favorites[supplier.id];
      
      if (isFavorited) {
        await SupplierService.removeFavorite(supplier.id);
        setFavorites(prev => ({ ...prev, [supplier.id]: false }));
      } else {
        await SupplierService.addToFavorites({
          supplierId: supplier.id,
          note: `收藏了 ${getLocalizedText(supplier.name)}`
        });
        setFavorites(prev => ({ ...prev, [supplier.id]: true }));
      }
    } catch (error) {
      console.error('Toggle favorite failed:', error);
    }
  };

  // 多语言文本处理
  const getLocalizedText = (text: any) => {
    if (typeof text === 'string') return text;
    const langKey = currentLanguage as keyof typeof text;
    return text[langKey] || text['zh-CN'] || '';
  };

  // 获取字典项显示文本
  const getDictLabel = (dictArray: any[], key: string) => {
    const item = dictArray.find(item => item.key === key);
    return item ? getLocalizedText(item.label) : key;
  };

  // 获取企业名称首字符
  const getCompanyInitial = (name: any) => {
    const displayName = getLocalizedText(name);
    return displayName.charAt(0).toUpperCase();
  };

  // 获取国家标识
  const getCountryFlag = (countryCode: string | null) => {
    if (!countryCode) {
      return '🌍'; // 默认地球图标
    }
    
    // 使用字典数据获取国家信息
    const countryItem = countriesDict.find(item => item.key === countryCode.toLowerCase());
    if (countryItem && countryItem.flag) {
      return countryItem.flag;
    }
    
    // 降级处理：硬编码常见国家
    const flags: Record<string, string> = {
      'CN': '🇨🇳',
      'US': '🇺🇸', 
      'DE': '🇩🇪',
      'JP': '🇯🇵',
      'IN': '🇮🇳',
      'GB': '🇬🇧'
    };
    return flags[countryCode.toUpperCase()] || '🌍';
  };

  // 获取企业规模标签
  const getCompanySizeLabel = (size: string | null) => {
    if (!size) {
      return '未知规模';
    }
    return getDictLabel(companySizeDict, size);
  };

  // 获取企业状态标签
  const getCompanyStatusLabel = (status: string) => {
    return getDictLabel(companyStatusDict, status);
  };

  // 渲染星级评分
  const renderRating = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  // 重置筛选器
  const resetFilters = () => {
    setFilters({
      search: '',
      country: 'ALL_COUNTRIES',
      companySize: 'ALL_SIZES',
      sortBy: 'createdAt',
      sortOrder: 'DESC'
    });
    setSearchQuery('');
    setCurrentPage(1);
  };

  return (
    <Layout userType="buyer">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 页面头部 */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl mb-6 shadow-2xl shadow-blue-500/20">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">
            供应商列表
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            发现优质供应商，建立长期合作伙伴关系
          </p>
        </div>

        {/* Tab切换器 */}
        <div className="flex items-center justify-center">
          <Tabs value={activeTab} onValueChange={(value) => {
            setActiveTab(value as SupplierTab);
            setCurrentPage(1);
          }} className="w-full max-w-2xl">
            <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm border border-white/30 rounded-2xl p-1">
              <TabsTrigger value="all" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
                <Users className="w-4 h-4 mr-2" />
                全部供应商
              </TabsTrigger>
              <TabsTrigger value="top100" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white">
                <Star className="w-4 h-4 mr-2" />
                Top 100
              </TabsTrigger>
              <TabsTrigger value="favorites" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-pink-600 data-[state=active]:text-white">
                <Heart className="w-4 h-4 mr-2" />
                收藏供应商
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* 搜索和筛选区域 */}
        <div className="bg-white/80 backdrop-blur-sm border border-white/30 rounded-2xl p-6 shadow-lg">
          <div className="space-y-4">
            {/* 搜索栏 */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="搜索供应商名称或描述..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/90 border-gray-300 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl"
              />
            </div>

            {/* 筛选器 - 收藏Tab隐藏部分筛选条件 */}
            {activeTab !== 'favorites' && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* 国家筛选 */}
                <Select value={filters.country} onValueChange={(value) => 
                  setFilters(prev => ({ ...prev, country: value }))
                }>
                  <SelectTrigger className="bg-white/90 border-gray-300 rounded-xl">
                    <Globe className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="选择国家" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL_COUNTRIES">全部国家</SelectItem>
                    {countriesDict.map((country) => (
                      <SelectItem key={country.key} value={country.key}>
                        {country.flag ? `${country.flag} ` : ''}{getLocalizedText(country.label)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* 企业规模筛选 */}
                <Select value={filters.companySize} onValueChange={(value) =>
                  setFilters(prev => ({ ...prev, companySize: value }))
                }>
                  <SelectTrigger className="bg-white/90 border-gray-300 rounded-xl">
                    <Building2 className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="企业规模" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL_SIZES">全部规模</SelectItem>
                    {companySizeDict.map((size) => (
                      <SelectItem key={size.key} value={size.key}>
                        {getLocalizedText(size.label)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* 排序字段 */}
                <Select value={filters.sortBy} onValueChange={(value) =>
                  setFilters(prev => ({ ...prev, sortBy: value }))
                }>
                  <SelectTrigger className="bg-white/90 border-gray-300 rounded-xl">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="排序方式" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt">注册时间</SelectItem>
                    <SelectItem value="productCount">产品数量</SelectItem>
                    <SelectItem value="name">公司名称</SelectItem>
                  </SelectContent>
                </Select>

                {/* 排序方向 */}
                <div className="flex space-x-2">
                  <Button
                    variant={filters.sortOrder === 'DESC' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilters(prev => ({ ...prev, sortOrder: 'DESC' }))}
                    className="flex-1 rounded-xl"
                  >
                    <SortDesc className="w-4 h-4 mr-1" />
                    降序
                  </Button>
                  <Button
                    variant={filters.sortOrder === 'ASC' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilters(prev => ({ ...prev, sortOrder: 'ASC' }))}
                    className="flex-1 rounded-xl"
                  >
                    <SortAsc className="w-4 h-4 mr-1" />
                    升序
                  </Button>
                </div>
              </div>
            )}

            {/* 重置按钮 */}
            <div className="flex justify-center">
              <Button variant="ghost" onClick={resetFilters} className="text-gray-600 hover:text-blue-600">
                重置筛选条件
              </Button>
            </div>
          </div>
        </div>

        {/* 结果统计 */}
        {meta && (
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>找到 {meta.totalItems} 个{activeTab === 'top100' ? 'Top 100 ' : activeTab === 'favorites' ? '收藏的' : ''}供应商</span>
            </div>
            <div>
              第 {meta.currentPage} 页，共 {meta.totalPages} 页
            </div>
          </div>
        )}

        {/* 供应商列表 */}
        {currentLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="bg-white/80 backdrop-blur-sm border border-white/30 rounded-2xl p-6 shadow-lg">
                <div className="animate-pulse space-y-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-2xl"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : suppliers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suppliers.map((supplier) => (
              <Card key={supplier.id} className="group bg-white/80 backdrop-blur-sm border border-white/30 hover:border-blue-400/30 hover:bg-white/90 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
                <CardContent className="p-0 space-y-4">
                  {/* 供应商头部 */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                        <span className="text-white font-bold text-lg">
                          {getCompanyInitial(supplier.name)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                          {getLocalizedText(supplier.name)}
                        </h3>
                        <div className="flex items-center space-x-2 mt-1">
                          {supplier.country && <span className="text-lg">{getCountryFlag(supplier.country)}</span>}
                          <Badge variant="outline" className="text-xs">
                            {getCompanySizeLabel(supplier.companySize)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    {/* 收藏按钮 */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(supplier);
                      }}
                      className={`${favorites[supplier.id] ? 'text-red-500 hover:text-red-600' : 'text-gray-400 hover:text-red-500'} transition-colors`}
                    >
                      <Heart className={`w-4 h-4 ${favorites[supplier.id] ? 'fill-current' : ''}`} />
                    </Button>
                  </div>

                  {/* 特殊徽章 */}
                  <div className="flex items-center space-x-2">
                    {supplier.isTop100 && (
                      <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0">
                        <Star className="w-3 h-3 mr-1" />
                        Top 100
                      </Badge>
                    )}
                    <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                      {getCompanyStatusLabel(supplier.status)}
                    </Badge>
                  </div>

                  {/* 评分 */}
                  {supplier.rating ? renderRating(Number(supplier.rating)) : (
                    <div className="flex items-center space-x-1">
                      <span className="text-sm text-gray-500">暂无评分</span>
                    </div>
                  )}

                  {/* 描述 */}
                  <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
                    {supplier.profile?.description 
                      ? getLocalizedText(supplier.profile.description)
                      : '暂无公司描述信息'
                    }
                  </p>

                  {/* 地址 */}
                  <div className="flex items-center text-sm text-gray-500">
                    <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">
                      {supplier.profile?.address || '地址信息待完善'}
                    </span>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center space-x-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 rounded-xl text-blue-600 border-blue-200 hover:bg-blue-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/suppliers/${supplier.id}`);
                      }}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      查看详情
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Building2 className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">
              {activeTab === 'top100' ? '暂无Top 100供应商' : activeTab === 'favorites' ? '暂无收藏的供应商' : '暂无供应商'}
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {activeTab === 'favorites'
                ? '您还没有收藏任何供应商，去供应商列表收藏感兴趣的供应商吧！'
                : debouncedSearchQuery || filters.country || filters.companySize
                ? '当前筛选条件下没有找到匹配的供应商，请尝试调整筛选条件。'
                : '系统中还没有供应商信息，请稍后再试。'
              }
            </p>
            {(debouncedSearchQuery || (filters.country && filters.country !== 'ALL_COUNTRIES') || (filters.companySize && filters.companySize !== 'ALL_SIZES')) && (
              <Button onClick={resetFilters} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl">
                清空筛选条件
              </Button>
            )}
          </div>
        )}

        {/* 分页 */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-8">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1 || currentLoading}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="bg-white/60 border-white/30 hover:bg-white/80 rounded-xl"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              上一页
            </Button>
            
            <div className="flex items-center space-x-2">
              {Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => {
                let page;
                if (meta.totalPages <= 5) {
                  page = i + 1;
                } else if (currentPage <= 3) {
                  page = i + 1;
                } else if (currentPage >= meta.totalPages - 2) {
                  page = meta.totalPages - 4 + i;
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
                      ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl" 
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
              disabled={currentPage >= meta.totalPages || currentLoading}
              onClick={() => setCurrentPage(prev => Math.min(meta.totalPages, prev + 1))}
              className="bg-white/60 border-white/30 hover:bg-white/80 rounded-xl"
            >
              下一页
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SuppliersPage;