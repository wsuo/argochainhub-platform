import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { WelcomeSection } from "@/components/home/WelcomeSection";
import { FeatureCards } from "@/components/home/FeatureCards";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Building2, ShoppingCart } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/MockAuthContext";
import { useNavigate } from "react-router-dom";

const SupplierDashboard = () => {
  const { t } = useTranslation();
  const { currentUserType, switchUserType, canSwitchToSupplier } = useAuth();
  const navigate = useNavigate();

  const handleViewModeChange = (mode: "buyer" | "supplier") => {
    if (mode) {
      switchUserType(mode);
      
      // 如果切换到采购商视图，跳转到主页
      if (mode === 'buyer') {
        navigate('/');
      }
    }
  };

  return (
    <Layout userType={currentUserType}>
      <div className="space-y-8">
        {/* View Mode Switcher for Supplier */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {currentUserType === "supplier" ? "供应商中心" : "采购商体验"}
            </h2>
            <p className="text-muted-foreground">
              {currentUserType === "supplier" 
                ? "管理您的产品，拓展海外市场，获得更多订单"
                : "体验采购商使用本平台的效果"
              }
            </p>
          </div>
          
          <ToggleGroup 
            type="single" 
            value={currentUserType} 
            onValueChange={handleViewModeChange}
          >
            <ToggleGroupItem 
              value="supplier" 
              aria-label="供应商视图" 
              className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              <Building2 className="w-4 h-4 mr-2" />
              供应商视图
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="buyer" 
              aria-label="采购商体验" 
              className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              采购商体验
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Welcome Section */}
        <WelcomeSection userType={currentUserType} />

        {/* Feature Cards */}
        <div>
          <h3 className="text-xl font-semibold text-foreground mb-6">
            {currentUserType === "buyer" ? t('features.coreBuyerFeatures') : t('features.coreSupplierFeatures')}
          </h3>
          <FeatureCards userType={currentUserType} />
        </div>

        {/* Supplier-specific Stats */}
        <div className="bg-gradient-to-r from-agro-green-light to-agro-blue-light rounded-xl p-6 border border-primary/20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">150+</div>
              <div className="text-sm text-muted-foreground">
                {currentUserType === "supplier" ? "我的产品" : "20,000+ 产品"}
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">85%</div>
              <div className="text-sm text-muted-foreground">
                {currentUserType === "supplier" ? "询价响应率" : "500+ 供应商"}
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">50+</div>
              <div className="text-sm text-muted-foreground">
                {currentUserType === "supplier" ? "海外客户" : "100+ 国家"}
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">2h</div>
              <div className="text-sm text-muted-foreground">
                {currentUserType === "supplier" ? "平均响应时间" : "24h 响应时间"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SupplierDashboard;