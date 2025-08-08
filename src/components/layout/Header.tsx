import { Bell, Globe, User, ChevronDown, LogIn, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/contexts/MockAuthContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";
import { SUPPORTED_LANGUAGES } from "@/i18n/config";
import { NotificationBell } from "@/components/notifications/NotificationBell";

interface HeaderProps {
  userType: "buyer" | "supplier";
}

export const Header = ({ userType }: HeaderProps) => {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage } = useLanguage();
  const { user, isLoggedIn, logout, canSwitchToSupplier } = useAuth();
  const { unreadCount, wsStatus } = useNotifications();
  const { getCartCount } = useCart();
  const navigate = useNavigate();
  
  const currentLangData = SUPPORTED_LANGUAGES.find(lang => lang.code === currentLanguage) || SUPPORTED_LANGUAGES[0];
  const cartCount = getCartCount();

  const handleLogin = () => {
    navigate('/auth');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleCartClick = () => {
    navigate('/cart');
  };

  const handleLogoClick = () => {
    // 如果用户已登录，根据用户实际类型跳转到相应的工作台
    if (isLoggedIn && user) {
      // 根据用户实际类型决定跳转目标
      const actualUserType = user.userType === 'supplier' ? 'supplier' : 'buyer';
      if (actualUserType === 'supplier') {
        navigate('/supplier');
      } else {
        navigate('/buyer');
      }
    } else {
      // 游客默认跳转到采购端
      navigate('/buyer');
    }
  };

  return (
    <header className="h-16 bg-background border-b border-border px-6 flex items-center justify-between">
      {/* Left side - Simple Logo - 从Sidebar移过来 */}
      <div className="flex items-center">
        <img 
          src="/logo.png" 
          alt="AgroChainHub Logo" 
          className="h-8 w-auto object-contain cursor-pointer hover:opacity-80 transition-opacity"
          onClick={handleLogoClick}
        />
      </div>

      {/* Right side */}
      <div className="flex items-center space-x-4">
        {/* Language Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="flex items-center space-x-1">
              <Globe className="w-4 h-4" />
              <span>{currentLangData.shortName}</span>
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={currentLanguage === lang.code ? "bg-accent" : ""}
              >
                {lang.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Conditional rendering based on login status */}
        {isLoggedIn ? (
          <>
            {/* Shopping Cart - Only for buyer users */}
            {userType === 'buyer' && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleCartClick}
                className="relative hover:bg-accent"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {cartCount > 99 ? '99+' : cartCount}
                  </Badge>
                )}
              </Button>
            )}

            {/* Notifications */}
            <NotificationBell 
              unreadCount={unreadCount}
              wsStatus={wsStatus}
              size="md"
              showConnectionStatus={true}
              animate={true}
            />

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <User className="w-3 h-3 text-primary-foreground" />
                  </div>
                  <span className="text-sm">{user?.name}</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>{t('common.profileSettings')}</DropdownMenuItem>
                <DropdownMenuItem>{t('common.companyInfo')}</DropdownMenuItem>
                <DropdownMenuItem>{t('common.membership')}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={handleLogout}
                >
                  {t('common.signOut')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          /* Login Button when not logged in */
          <Button 
            onClick={handleLogin}
            className="bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary"
          >
            <LogIn className="w-4 h-4 mr-2" />
            登录/注册
          </Button>
        )}
      </div>
    </header>
  );
};