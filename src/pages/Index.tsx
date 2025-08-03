import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { FeatureCards } from "@/components/home/FeatureCards";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/MockAuthContext";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const [isChatMode, setIsChatMode] = useState(false);
  const { t } = useTranslation();
  const { currentUserType, canSwitchToSupplier, user } = useAuth();
  const navigate = useNavigate();

  const handleChatToggle = (isActive: boolean) => {
    setIsChatMode(isActive);
  };

  const handleGoToSupplierCenter = () => {
    navigate('/supplier');
  };

  return (
    <Layout userType={currentUserType}>
      <div className="h-[calc(100vh-4rem-3rem)] flex flex-col overflow-hidden">
        {/* Supplier Center Access - 仅供应商用户在采购商体验模式下显示 */}
        {!isChatMode && user && user.userType === 'supplier' && currentUserType === 'buyer' && (
          <div className="bg-gradient-to-r from-agro-blue/10 to-primary/10 rounded-lg p-4 border border-primary/20 mb-6 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">正在体验采购商模式</p>
                <p className="text-xs text-muted-foreground">您可以随时切换回供应商中心</p>
              </div>
              <Button 
                onClick={handleGoToSupplierCenter}
                variant="outline"
                size="sm"
                className="border-primary hover:bg-primary hover:text-primary-foreground"
              >
                <Building2 className="w-4 h-4 mr-2" />
                返回供应商中心
              </Button>
            </div>
          </div>
        )}

        {/* Feature Cards - 核心采购功能，限制宽度为70% */}
        {!isChatMode && (
          <div className="mb-6 flex-shrink-0">
            <div className="w-[70%] mx-auto">
              <h3 className="text-xl font-semibold text-foreground mb-6">
                {t('features.coreBuyerFeatures')}
              </h3>
              <FeatureCards userType={currentUserType} />
            </div>
          </div>
        )}

        {/* Spacer to push AI Query Interface to bottom */}
        <div className="flex-1 min-h-0"></div>

        {/* AI Query Interface - 贴底显示，与核心功能区域宽度一致 */}
        <div className="flex-shrink-0">
          <div className="w-[70%] mx-auto">
            <ChatInterface onToggle={handleChatToggle} />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
