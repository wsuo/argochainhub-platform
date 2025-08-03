import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthCard } from "@/components/auth/AuthCard";
import { useAuth } from "@/contexts/MockAuthContext";
import { useTranslation } from "react-i18next";
import heroImage from "@/assets/hero-agro.jpg";

const AuthPage = () => {
  const navigate = useNavigate();
  const { isLoggedIn, currentUserType } = useAuth();
  const { t } = useTranslation();

  // 如果已登录，根据用户类型跳转到相应页面
  useEffect(() => {
    if (isLoggedIn) {
      if (currentUserType === 'supplier') {
        navigate('/supplier');
      } else {
        navigate('/');
      }
    }
  }, [isLoggedIn, currentUserType, navigate]);

  const handleAuthSuccess = () => {
    // AuthCard内部会更新认证状态，这里的useEffect会处理跳转
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage} 
          alt="Agricultural technology background"
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-agro-blue/3 to-agro-green-light/10" />
      </div>
      
      {/* Platform Stats - 简化版统计展示 */}
      <div className="relative z-10 w-full max-w-4xl px-6 mb-6">
        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="opacity-80">
              <div className="text-lg font-semibold text-foreground/90 mb-1">20,000+</div>
              <div className="text-xs text-muted-foreground/80">农药产品</div>
            </div>
            <div className="opacity-80">
              <div className="text-lg font-semibold text-foreground/90 mb-1">500+</div>
              <div className="text-xs text-muted-foreground/80">优质供应商</div>
            </div>
            <div className="opacity-80">
              <div className="text-lg font-semibold text-foreground/90 mb-1">100+</div>
              <div className="text-xs text-muted-foreground/80">覆盖国家</div>
            </div>
            <div className="opacity-80">
              <div className="text-lg font-semibold text-foreground/90 mb-1">24h</div>
              <div className="text-xs text-muted-foreground/80">快速响应</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 w-full max-w-md mx-auto p-6">
        <AuthCard onSuccess={handleAuthSuccess} />
        
        {/* Back to Home Link */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            ← 返回主页
          </button>
        </div>
      </div>
      
      {/* Decorative Elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-gradient-to-br from-primary/20 to-agro-blue/20 rounded-full blur-xl" />
      <div className="absolute bottom-10 right-10 w-32 h-32 bg-gradient-to-br from-agro-green-light/30 to-primary/20 rounded-full blur-xl" />
      <div className="absolute top-1/2 right-20 w-16 h-16 bg-gradient-to-br from-agro-blue/20 to-agro-green-light/20 rounded-full blur-lg" />
    </div>
  );
};

export default AuthPage;