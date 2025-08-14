import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Building2, 
  ArrowLeft, 
  MapPin, 
  Users, 
  Star, 
  Heart,
  Phone,
  Globe,
  Mail,
  Calendar,
  TrendingUp,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { SupplierService } from '@/services/supplierService';
import { dictionaryService } from '@/services/dictionaryService';
import { useLanguage } from '@/hooks/useLanguage';
import { Supplier, GetProductsParams, SupplierProduct } from '@/types/supplier';

const SupplierDetailPage = () => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isFavorited, setIsFavorited] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [productPage, setProductPage] = useState(1);

  const {
    data: supplierResponse,
    isLoading,
    error
  } = useQuery({
    queryKey: ['supplier-detail', id],
    queryFn: () => SupplierService.getSupplierDetails(Number(id)),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10分钟缓存
  });

  const supplier = supplierResponse?.data;

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

  const { data: companyTypeDict = [] } = useQuery({
    queryKey: ['company-type-dict'],
    queryFn: () => dictionaryService.getDictionary('company_type'),
    staleTime: 10 * 60 * 1000,
  });

  const { data: businessTypeDict = [] } = useQuery({
    queryKey: ['business-type-dict'],
    queryFn: () => dictionaryService.getDictionary('business_type'),
    staleTime: 10 * 60 * 1000,
  });

  // 获取供应商产品列表
  const {
    data: productsResponse,
    isLoading: productsLoading,
    error: productsError
  } = useQuery({
    queryKey: ['supplier-products', id, productSearch, productPage],
    queryFn: () => SupplierService.getSupplierProducts({
      supplierId: Number(id),
      search: productSearch || undefined,
      page: productPage,
      limit: 10
    }),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  });

  const products = productsResponse?.data || [];
  const productsMeta = productsResponse?.meta;

  // 检查收藏状态
  useEffect(() => {
    if (supplier?.id) {
      SupplierService.checkFavoriteStatus(supplier.id)
        .then(response => {
          setIsFavorited(response.data.isFavorited);
        })
        .catch(error => {
          console.warn('Failed to check favorite status:', error);
        });
    }
  }, [supplier?.id]);

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

  // 获取国家标签
  const getCountryLabel = (countryCode: string | null) => {
    if (!countryCode) {
      return '未知国家';
    }
    return getDictLabel(countriesDict, countryCode);
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

  // 获取企业名称首字符
  const getCompanyInitial = (name: any) => {
    const displayName = getLocalizedText(name);
    return displayName.charAt(0).toUpperCase();
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

  // 处理收藏/取消收藏
  const handleToggleFavorite = async () => {
    if (!supplier) return;
    
    try {
      if (isFavorited) {
        await SupplierService.removeFavorite(supplier.id);
        setIsFavorited(false);
      } else {
        await SupplierService.addToFavorites({
          supplierId: supplier.id,
          note: `收藏了 ${getLocalizedText(supplier.name)}`
        });
        setIsFavorited(true);
      }
    } catch (error) {
      console.error('Toggle favorite failed:', error);
    }
  };

  if (isLoading) {
    return (
      <Layout userType="buyer">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !supplier) {
    return (
      <Layout userType="buyer">
        <div className="max-w-4xl mx-auto text-center py-16">
          <div className="w-20 h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Building2 className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">供应商不存在</h2>
          <p className="text-gray-600 mb-6">您要查看的供应商可能已被删除或不存在</p>
          <Button onClick={() => navigate('/suppliers')} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回供应商列表
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout userType="buyer">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* 返回按钮 */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/suppliers')}
          className="text-gray-600 hover:text-blue-600"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回供应商列表
        </Button>

        {/* 供应商基本信息卡片 */}
        <Card className="bg-white/80 backdrop-blur-sm border border-white/30 rounded-2xl p-8 shadow-lg">
          <CardContent className="p-0 space-y-6">
            {/* 头部信息 */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-2xl">
                    {getCompanyInitial(supplier.name)}
                  </span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {getLocalizedText(supplier.name)}
                  </h1>
                  <div className="flex items-center space-x-4">
                    {supplier.country && (
                      <div className="flex items-center space-x-1">
                        <span className="text-lg">{getCountryFlag(supplier.country)}</span>
                        <span className="text-gray-600">{getCountryLabel(supplier.country)}</span>
                      </div>
                    )}
                    {supplier.companySize && (
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">{getCompanySizeLabel(supplier.companySize)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* 收藏按钮 */}
              <Button
                variant="outline"
                size="lg"
                onClick={handleToggleFavorite}
                className={`${isFavorited ? 'text-red-500 border-red-200 hover:bg-red-50' : 'text-gray-600 hover:text-red-500'} transition-colors rounded-xl`}
              >
                <Heart className={`w-5 h-5 mr-2 ${isFavorited ? 'fill-current' : ''}`} />
                {isFavorited ? '已收藏' : '收藏'}
              </Button>
            </div>

            {/* 徽章和评分 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
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
            </div>

            {/* 公司描述 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">公司介绍</h3>
              <p className="text-gray-600 leading-relaxed">
                {supplier.profile?.description 
                  ? getLocalizedText(supplier.profile.description)
                  : '该供应商暂未提供公司介绍信息。'
                }
              </p>
            </div>

            {/* 联系信息 */}
            {supplier.profile && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">联系信息</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {supplier.profile.address && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">{supplier.profile.address}</span>
                    </div>
                  )}
                  {supplier.profile.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">{supplier.profile.phone}</span>
                    </div>
                  )}
                  {supplier.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">{supplier.email}</span>
                    </div>
                  )}
                  {supplier.profile.website && (
                    <div className="flex items-center space-x-2">
                      <Globe className="w-4 h-4 text-gray-500" />
                      <a 
                        href={supplier.profile.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {supplier.profile.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 注册信息 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">注册信息</h3>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">
                  注册时间：{new Date(supplier.createdAt).toLocaleDateString('zh-CN')}
                </span>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center space-x-4 pt-4">
              <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl">
                <Mail className="w-4 h-4 mr-2" />
                发起询价
              </Button>
              <Button variant="outline" className="rounded-xl">
                <Phone className="w-4 h-4 mr-2" />
                联系供应商
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 供应商产品列表 */}
        <Card className="bg-white/80 backdrop-blur-sm border border-white/30 rounded-2xl p-8 shadow-lg">
          <CardContent className="p-0 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">产品列表</h2>
              <div className="flex items-center space-x-4">
                {productsMeta && (
                  <span className="text-sm text-gray-600">
                    共 {productsMeta.totalItems} 个产品
                  </span>
                )}
              </div>
            </div>

            {/* 产品搜索 */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="搜索产品名称..."
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  setProductPage(1); // 重置页码
                }}
                className="pl-10 bg-white/90 border-gray-300 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl"
              />
            </div>

            {/* 产品列表 */}
            {productsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse p-4 bg-gray-50 rounded-xl">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {products.map((product) => (
                    <div 
                      key={product.id} 
                      className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate(`/products/${product.id}?from=supplier&supplierId=${id}`)}
                    >
                      <div className="space-y-2">
                        <h3 className="font-semibold text-gray-900 line-clamp-2">
                          {getLocalizedText(product.name)}
                        </h3>
                        
                        {product.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {getLocalizedText(product.description)}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>分类: {product.category || '未分类'}</span>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            product.status === 'active' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {product.status === 'active' ? '在售' : '停售'}
                          </span>
                        </div>
                        
                        {product.price && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-blue-600">
                              {product.price.currency} {product.price.amount}
                            </span>
                            {product.unit && (
                              <span className="text-xs text-gray-500">
                                单位: {product.unit}
                              </span>
                            )}
                          </div>
                        )}
                        
                        {product.minOrderQuantity && (
                          <div className="text-xs text-gray-500">
                            起订量: {product.minOrderQuantity} {product.unit || '件'}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* 产品分页 */}
                {productsMeta && productsMeta.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={productPage <= 1 || productsLoading}
                      onClick={() => setProductPage(prev => Math.max(1, prev - 1))}
                      className="bg-white/60 border-white/30 hover:bg-white/80 rounded-xl"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      上一页
                    </Button>
                    
                    <span className="text-sm text-gray-600">
                      第 {productPage} 页，共 {productsMeta.totalPages} 页
                    </span>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={productPage >= productsMeta.totalPages || productsLoading}
                      onClick={() => setProductPage(prev => Math.min(productsMeta.totalPages, prev + 1))}
                      className="bg-white/60 border-white/30 hover:bg-white/80 rounded-xl"
                    >
                      下一页
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无产品</h3>
                <p className="text-gray-600">
                  {productSearch 
                    ? `没有找到包含"${productSearch}"的产品，请尝试其他关键词。`
                    : '该供应商暂未发布任何产品。'
                  }
                </p>
                {productSearch && (
                  <Button 
                    variant="ghost" 
                    onClick={() => setProductSearch('')}
                    className="mt-4 text-blue-600 hover:text-blue-700"
                  >
                    清除搜索条件
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default SupplierDetailPage;