import { Bell, Globe, User, ChevronDown, LogIn } from "lucide-react";
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
import { useNavigate } from "react-router-dom";
import { SUPPORTED_LANGUAGES } from "@/i18n/config";

interface HeaderProps {
  userType: "buyer" | "supplier";
}

export const Header = ({ userType }: HeaderProps) => {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage } = useLanguage();
  const { user, isLoggedIn, logout, canSwitchToSupplier } = useAuth();
  const navigate = useNavigate();
  
  const currentLangData = SUPPORTED_LANGUAGES.find(lang => lang.code === currentLanguage) || SUPPORTED_LANGUAGES[0];

  const handleLogin = () => {
    navigate('/auth');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="h-16 bg-background border-b border-border px-6 flex items-center justify-between">
      {/* Left side - Simple Logo - 从Sidebar移过来 */}
      <div className="flex items-center">
        <img 
          src="/logo.png" 
          alt="AgroChainHub Logo" 
          className="h-8 w-auto object-contain"
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
            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full"></span>
            </Button>

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