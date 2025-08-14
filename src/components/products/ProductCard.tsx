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
    <Card className="group bg-white/80 backdrop-blur-sm border border-white/30 hover:border-green-400/30 hover:bg-white/90 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer h-full flex flex-col">
      <CardContent className="p-0 flex flex-col h-full">
        {/* 上部内容区域 - 允许弹性增长 */}
        <div className="flex-1 space-y-4">
          {/* 产品头部 */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                <span className="text-white font-bold text-lg">
                  {getLocalizedText(product.name).charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors line-clamp-2 text-base">
                  {getLocalizedText(product.name)}
                </h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                  {getLocalizedText(product.pesticideName)}
                </p>
              </div>
            </div>
          </div>

          {/* 特殊徽章 */}
          <div className="flex items-center space-x-2">
            {product.supplier.isTop100 && (
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0">
                <Star className="w-3 h-3 mr-1" />
                Top 100
              </Badge>
            )}
            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
              {product.details?.productCategory || '未知类别'}
            </Badge>
          </div>

          {/* 产品基本信息 */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">{t('products.formulation')}:</span>
              <span className="font-medium">{product.formulation}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t('products.totalContent')}:</span>
              <span className="font-medium">{product.totalContent}</span>
            </div>
          </div>

          {/* 活性成分 */}
          {product.activeIngredient1 && (
            <div>
              <h4 className="text-sm font-medium mb-2">{t('products.activeIngredient')}:</h4>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">{getLocalizedText(product.activeIngredient1.name)}</span>
                  <span className="font-medium text-green-600">{product.activeIngredient1.content}</span>
                </div>
                {product.activeIngredient2 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">{getLocalizedText(product.activeIngredient2.name)}</span>
                    <span className="font-medium text-green-600">{product.activeIngredient2.content}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 供应商信息 */}
          <div className="p-3 bg-gradient-to-r from-gray-50 to-green-50 rounded-xl border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 min-w-0">
                <Building2 className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <span className="text-sm font-medium truncate text-gray-700">
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
                <span className="text-xs text-gray-500 ml-1">
                  {product.supplier.rating}
                </span>
              </div>
            </div>
          </div>

          {/* 产品描述 */}
          {product.details?.description && (
            <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
              {product.details.description}
            </p>
          )}
        </div>

        {/* 底部按钮区域 - 固定在底部 */}
        <div className="space-y-2 pt-4 mt-4 border-t border-gray-100">
          {/* 查看详情按钮独占一行 */}
          <Link to={`/products/${product.id}`} className="block">
            <Button
              variant="outline"
              size="sm"
              className="w-full rounded-xl text-green-600 border-green-200 hover:bg-green-50"
            >
              <Eye className="w-3 h-3 mr-1" />
              查看详情
            </Button>
          </Link>
          
          {/* 其他三个按钮在一行 */}
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddToCart}
              disabled={isProductInCart}
              className={`flex-1 rounded-xl ${isProductInCart 
                ? "bg-green-500 text-white border-green-500 hover:bg-green-600" 
                : "text-green-600 border-green-200 hover:bg-green-500 hover:text-white hover:border-green-500"
              } transition-colors`}
              title={isProductInCart ? t('products.alreadyInCart') : t('products.addToCart')}
            >
              {isProductInCart ? <Check className="h-3 w-3" /> : <ShoppingCart className="h-3 w-3" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleInquire}
              className="flex-1 rounded-xl text-blue-600 border-blue-200 hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-colors"
              title={t('products.inquireNow')}
            >
              <MessageSquare className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRequestSample}
              className="flex-1 rounded-xl text-purple-600 border-purple-200 hover:bg-purple-500 hover:text-white hover:border-purple-500 transition-colors"
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