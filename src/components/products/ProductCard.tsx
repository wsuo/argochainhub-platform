import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Building2, Eye, ShoppingCart, MessageSquare, TestTube, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import { Product, MultiLanguageText } from "@/types/product";
import { Link } from "react-router-dom";
import { CreateInquiryDialog } from "@/components/inquiries/CreateInquiryDialog";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useCart } from "@/contexts/CartContext";
import { useState } from "react";

interface ProductCardProps {
  product: Product;
  onAddToCart?: () => void;
  onInquire?: () => void;
  onRequestSample?: () => void;
}

export const ProductCard = ({ 
  product, 
  onAddToCart, 
  onInquire, 
  onRequestSample 
}: ProductCardProps) => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const [showInquiryDialog, setShowInquiryDialog] = useState(false);
  const { addToCart, isInCart } = useCart();
  
  // 使用认证守卫
  const {
    showAuthDialog,
    authConfig,
    executeWithAuth,
    handleAuthSuccess,
    closeAuthDialog
  } = useAuthGuard();

  // Check if product is already in cart
  const isProductInCart = isInCart(product.id);

  // 获取多语言文本的辅助函数
  const getLocalizedText = (text: MultiLanguageText | null): string => {
    if (!text) return '';
    const langKey = currentLanguage as keyof MultiLanguageText;
    return text[langKey] || text['zh-CN'] || '';
  };

  // 处理询价
  const handleInquire = () => {
    executeWithAuth(() => {
      setShowInquiryDialog(true);
      onInquire?.();
    }, {
      title: t('auth.loginToInquire', { defaultValue: '登录以发起询价' }),
      description: t('auth.inquireLoginDesc', { 
        defaultValue: '请登录您的账户以向供应商发起产品询价' 
      }),
      requiredUserType: 'buyer'
    });
  };

  // 处理添加到购物车
  const handleAddToCart = () => {
    if (isProductInCart) {
      // If already in cart, do nothing or show a message
      return;
    }

    executeWithAuth(async () => {
      // Default quantity and unit - you could make these configurable
      await addToCart(product, 1, 'kg');
      onAddToCart?.();
    }, {
      title: t('auth.loginToAddCart', { defaultValue: '登录以添加到购物车' }),
      description: t('auth.cartLoginDesc', { 
        defaultValue: '请登录您的账户以添加产品到购物车' 
      }),
      requiredUserType: 'buyer'
    });
  };

  // 处理申请样品
  const handleRequestSample = () => {
    executeWithAuth(() => {
      onRequestSample?.();
    }, {
      title: t('auth.loginToRequestSample', { defaultValue: '登录以申请样品' }),
      description: t('auth.sampleLoginDesc', { 
        defaultValue: '请登录您的账户以向供应商申请产品样品' 
      }),
      requiredUserType: 'buyer'
    });
  };

  // 获取评级星级
  const rating = parseFloat(product.supplier.rating);
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30 h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg line-clamp-2 hover:text-primary transition-colors">
              {getLocalizedText(product.name)}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground mt-1">
              {getLocalizedText(product.pesticideName)}
            </CardDescription>
          </div>
          {product.supplier.isTop100 && (
            <Badge variant="secondary" className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30">
              {t('products.top100Badge')}
            </Badge>
          )}
        </div>

        {/* 产品基本信息 */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('products.formulation')}:</span>
            <span className="font-medium">{product.formulation}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('products.totalContent')}:</span>
            <span className="font-medium">{product.totalContent}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('products.category')}:</span>
            <Badge variant="outline" className="text-xs">
              {product.details.productCategory}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 flex-1 flex flex-col">
        {/* 活性成分 */}
        {product.activeIngredient1 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2">{t('products.activeIngredient')}:</h4>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>{getLocalizedText(product.activeIngredient1.name)}</span>
                <span className="font-medium">{product.activeIngredient1.content}</span>
              </div>
              {product.activeIngredient2 && (
                <div className="flex justify-between">
                  <span>{getLocalizedText(product.activeIngredient2.name)}</span>
                  <span className="font-medium">{product.activeIngredient2.content}</span>
                </div>
              )}
              {product.activeIngredient3 && (
                <div className="flex justify-between">
                  <span>{getLocalizedText(product.activeIngredient3.name)}</span>
                  <span className="font-medium">{product.activeIngredient3.content}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 供应商信息 */}
        <div className="mb-4 p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2 min-w-0">
              <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm font-medium truncate">
                {getLocalizedText(product.supplier.name)}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < fullStars
                      ? 'text-yellow-500 fill-yellow-500'
                      : i === fullStars && hasHalfStar
                      ? 'text-yellow-500 fill-yellow-500/50'
                      : 'text-gray-300'
                  }`}
                />
              ))}
              <span className="text-xs text-muted-foreground ml-1">
                {product.supplier.rating}
              </span>
            </div>
          </div>
        </div>

        {/* 产品描述 */}
        {product.details.description && (
          <div className="mb-4 flex-1">
            <p className="text-sm text-muted-foreground line-clamp-3">
              {product.details.description}
            </p>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="space-y-2 mt-auto">
          <Link to={`/products/${product.id}`}>
            <Button variant="outline" className="w-full hover:bg-primary hover:text-primary-foreground transition-all">
              <Eye className="h-4 w-4 mr-2" />
              {t('products.viewDetails')}
            </Button>
          </Link>
          
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddToCart}
              disabled={isProductInCart}
              className={isProductInCart 
                ? "hover:bg-green-500 hover:text-white hover:border-green-500 transition-colors bg-green-500 text-white border-green-500" 
                : "hover:bg-green-500 hover:text-white hover:border-green-500 transition-colors"
              }
              title={isProductInCart ? t('products.alreadyInCart') : t('products.addToCart')}
            >
              {isProductInCart ? <Check className="h-3 w-3" /> : <ShoppingCart className="h-3 w-3" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleInquire}
              className="hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
              title={t('products.inquireNow')}
            >
              <MessageSquare className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRequestSample}
              className="hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-colors"
              title={t('products.requestSample')}
            >
              <TestTube className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>

      {/* 询价弹窗 */}
      <CreateInquiryDialog
        open={showInquiryDialog}
        onOpenChange={setShowInquiryDialog}
        product={product}
      />

      {/* 认证弹窗 */}
      <AuthDialog
        open={showAuthDialog}
        onOpenChange={closeAuthDialog}
        onSuccess={handleAuthSuccess}
        title={authConfig.title}
        description={authConfig.description}
      />
    </Card>
  );
};