import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ArrowLeft, 
  Star, 
  Building2, 
  Phone, 
  MapPin, 
  Globe, 
  Award, 
  ShoppingCart, 
  MessageSquare, 
  TestTube,
  AlertCircle,
  RefreshCw,
  Check
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/contexts/MockAuthContext";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { productService } from "@/services/productService";
import { Product, MultiLanguageText } from "@/types/product";
import { ProductCard } from "@/components/products/ProductCard";
import { useCart } from "@/contexts/CartContext";
import { CreateInquiryDialog } from "@/components/inquiries/CreateInquiryDialog";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useState } from "react";

const ProductDetailPage = () => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const { currentUserType } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart, isInCart } = useCart();
  const [showInquiryDialog, setShowInquiryDialog] = useState(false);

  // 使用认证守卫
  const {
    showAuthDialog,
    authConfig,
    executeWithAuth,
    handleAuthSuccess,
    closeAuthDialog
  } = useAuthGuard();

  // 获取多语言文本的辅助函数
  const getLocalizedText = (text: MultiLanguageText): string => {
    const langKey = currentLanguage as keyof MultiLanguageText;
    return text[langKey] || text['zh-CN'];
  };

  // 获取产品详情
  const {
    data: productResponse,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['product-detail', id],
    queryFn: () => productService.getProductDetail(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

  // 获取相关产品
  const { data: relatedProducts = [] } = useQuery({
    queryKey: ['related-products', id],
    queryFn: () => productService.getRelatedProducts(id!, 6),
    enabled: !!id && !!productResponse?.data,
    staleTime: 5 * 60 * 1000,
  });

  const product = productResponse?.data;

  // Check if product is already in cart
  const isProductInCart = product ? isInCart(product.id) : false;

  // 处理操作
  const handleAddToCart = () => {
    if (!product) return;
    
    if (isProductInCart) {
      // If already in cart, do nothing or show a message
      return;
    }

    executeWithAuth(async () => {
      await addToCart(product, 1, 'kg');
    }, {
      title: t('auth.loginToAddCart', { defaultValue: '登录以添加到购物车' }),
      description: t('auth.cartLoginDesc', { 
        defaultValue: '请登录您的账户以添加产品到购物车' 
      }),
      requiredUserType: 'buyer'
    });
  };

  const handleInquire = () => {
    if (!product) return;

    executeWithAuth(() => {
      setShowInquiryDialog(true);
    }, {
      title: t('auth.loginToInquire', { defaultValue: '登录以发起询价' }),
      description: t('auth.inquireLoginDesc', { 
        defaultValue: '请登录您的账户以向供应商发起产品询价' 
      }),
      requiredUserType: 'buyer'
    });
  };

  const handleRequestSample = () => {
    if (!product) return;

    executeWithAuth(() => {
      console.log('Request sample for product:', product);
      // TODO: 实现申请样品逻辑
    }, {
      title: t('auth.loginToRequestSample', { defaultValue: '登录以申请样品' }),
      description: t('auth.sampleLoginDesc', { 
        defaultValue: '请登录您的账户以向供应商申请产品样品' 
      }),
      requiredUserType: 'buyer'
    });
  };

  if (error) {
    return (
      <Layout userType={currentUserType}>
        <div className="max-w-4xl mx-auto">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{t('products.errorLoadingDesc')}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('products.retry')}
            </Button>
          </AlertDescription>
        </Alert>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout userType={currentUserType}>
        <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-64 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout userType={currentUserType}>
        <div className="max-w-4xl mx-auto text-center py-12">
        <h3 className="text-lg font-medium text-muted-foreground mb-2">
          {t('products.noResults')}
        </h3>
        <p className="text-muted-foreground mb-4">
          {t('products.noResultsDesc')}
        </p>
        <Button onClick={() => navigate('/products')}>
          {t('products.backToList')}
        </Button>
        </div>
      </Layout>
    );
  }

  const rating = parseFloat(product.supplier.rating);
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  return (
    <Layout userType={currentUserType}>
      <div className="max-w-6xl mx-auto">
        {/* 返回按钮 */}
        <Button
        variant="ghost"
        onClick={() => navigate('/products')}
        className="mb-6"
        >
        <ArrowLeft className="h-4 w-4 mr-2" />
        {t('products.backToList')}
        </Button>

        {/* 产品概览卡片 */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
              <div className="flex-1">
                <div className="flex items-start gap-3 mb-2">
                  <CardTitle className="text-2xl lg:text-3xl">
                    {getLocalizedText(product.name)}
                  </CardTitle>
                  {product.supplier.isTop100 && (
                    <Badge variant="secondary" className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30">
                      {t('products.top100Badge')}
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-lg">
                  {getLocalizedText(product.pesticideName)}
                </CardDescription>
              </div>
              
              {/* 操作按钮 */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={handleAddToCart} 
                  variant="outline"
                  disabled={isProductInCart}
                  className={isProductInCart 
                    ? "bg-green-500 text-white border-green-500 hover:bg-green-600" 
                    : "hover:bg-green-500 hover:text-white hover:border-green-500 transition-colors"
                  }
                >
                  {isProductInCart ? <Check className="h-4 w-4 mr-2" /> : <ShoppingCart className="h-4 w-4 mr-2" />}
                  {isProductInCart ? t('products.alreadyInCart') : t('products.addToCart')}
                </Button>
                <Button onClick={handleInquire}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {t('products.inquireNow')}
                </Button>
                <Button onClick={handleRequestSample} variant="outline">
                  <TestTube className="h-4 w-4 mr-2" />
                  {t('products.requestSample')}
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* 详情内容 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* 产品基本信息 */}
          <Card>
            <CardHeader>
              <CardTitle>{t('products.basicInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('products.formulation')}
                  </label>
                  <p className="font-medium">{product.formulation}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('products.totalContent')}
                  </label>
                  <p className="font-medium">{product.totalContent}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('products.category')}
                  </label>
                  <Badge variant="outline">{product.details.productCategory}</Badge>
                </div>
                {product.registrationNumber && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      {t('products.registrationNumber')}
                    </label>
                    <p className="font-medium">{product.registrationNumber}</p>
                  </div>
                )}
              </div>

              <Separator />

              {/* 活性成分 */}
              <div>
                <h4 className="font-medium mb-3">{t('products.activeIngredient')}</h4>
                <div className="space-y-2">
                  {product.activeIngredient1 && (
                    <div className="flex justify-between items-center">
                      <span>{getLocalizedText(product.activeIngredient1.name)}</span>
                      <Badge variant="secondary">{product.activeIngredient1.content}</Badge>
                    </div>
                  )}
                  {product.activeIngredient2 && (
                    <div className="flex justify-between items-center">
                      <span>{getLocalizedText(product.activeIngredient2.name)}</span>
                      <Badge variant="secondary">{product.activeIngredient2.content}</Badge>
                    </div>
                  )}
                  {product.activeIngredient3 && (
                    <div className="flex justify-between items-center">
                      <span>{getLocalizedText(product.activeIngredient3.name)}</span>
                      <Badge variant="secondary">{product.activeIngredient3.content}</Badge>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* 产品描述 */}
              {product.details.description && (
                <div>
                  <h4 className="font-medium mb-2">{t('products.description')}</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    {product.details.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 供应商信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {t('products.supplierInfo')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-lg">
                    {getLocalizedText(product.supplier.name)}
                  </h4>
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < fullStars
                            ? 'text-yellow-500 fill-yellow-500'
                            : i === fullStars && hasHalfStar
                            ? 'text-yellow-500 fill-yellow-500/50'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="text-sm text-muted-foreground ml-2">
                      {product.supplier.rating}
                    </span>
                  </div>
                </div>
              </div>

              {product.supplier.profile && (
                <>
                  <Separator />
                  
                  {/* 联系信息 */}
                  <div>
                    <h5 className="font-medium mb-3">{t('products.contactInfo')}</h5>
                    <div className="space-y-2">
                      {product.supplier.profile.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{product.supplier.profile.phone}</span>
                        </div>
                      )}
                      {product.supplier.profile.address && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{product.supplier.profile.address}</span>
                        </div>
                      )}
                      {product.supplier.profile.website && (
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <a 
                            href={product.supplier.profile.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            {product.supplier.profile.website}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 公司描述 */}
                  {product.supplier.profile.description && (
                    <>
                      <Separator />
                      <div>
                        <h5 className="font-medium mb-2">{t('products.companyDescription')}</h5>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {getLocalizedText(product.supplier.profile.description)}
                        </p>
                      </div>
                    </>
                  )}

                  {/* 资质证书 */}
                  {product.supplier.profile.certificates && product.supplier.profile.certificates.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h5 className="font-medium mb-3 flex items-center gap-2">
                          <Award className="h-4 w-4" />
                          {t('products.certificates')}
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {product.supplier.profile.certificates.map((cert, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {cert}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 相关产品 */}
        {relatedProducts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('products.relatedProducts')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {relatedProducts.slice(0, 6).map((relatedProduct) => (
                  <ProductCard
                    key={relatedProduct.id}
                    product={relatedProduct}
                    onAddToCart={() => console.log('Add related product to cart')}
                    onInquire={() => console.log('Inquire related product')}
                    onRequestSample={() => console.log('Request sample for related product')}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 询价弹窗 */}
      {product && (
        <CreateInquiryDialog
          open={showInquiryDialog}
          onOpenChange={setShowInquiryDialog}
          product={product}
        />
      )}

      {/* 认证弹窗 */}
      <AuthDialog
        open={showAuthDialog}
        onOpenChange={closeAuthDialog}
        onSuccess={handleAuthSuccess}
        title={authConfig.title}
        description={authConfig.description}
      />
    </Layout>
  );
};

export default ProductDetailPage;