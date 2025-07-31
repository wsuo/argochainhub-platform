import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { WelcomeSection } from "@/components/home/WelcomeSection";
import { AIQueryBox } from "@/components/home/AIQueryBox";
import { FeatureCards } from "@/components/home/FeatureCards";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Building2, ShoppingCart } from "lucide-react";
import { useTranslation } from "react-i18next";

const Index = () => {
  const [userType, setUserType] = useState<"buyer" | "supplier">("buyer");
  const { t } = useTranslation();

  return (
    <Layout userType={userType}>
      <div className="space-y-8">
        {/* User Type Switcher for Demo */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{t('common.welcome')}</h2>
            <p className="text-muted-foreground">{t('common.tagline')}</p>
          </div>
          
          <ToggleGroup type="single" value={userType} onValueChange={(value) => value && setUserType(value as "buyer" | "supplier")}>
            <ToggleGroupItem value="buyer" aria-label={t('home.buyerView')} className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
              <ShoppingCart className="w-4 h-4 mr-2" />
              {t('home.buyerView')}
            </ToggleGroupItem>
            <ToggleGroupItem value="supplier" aria-label={t('home.supplierView')} className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
              <Building2 className="w-4 h-4 mr-2" />
              {t('home.supplierView')}
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Welcome Section */}
        <WelcomeSection userType={userType} />

        {/* AI Query Box */}
        <AIQueryBox />

        {/* Feature Cards */}
        <div>
          <h3 className="text-xl font-semibold text-foreground mb-6">
            {userType === "buyer" ? t('features.coreBuyerFeatures') : t('features.coreSupplierFeatures')}
          </h3>
          <FeatureCards userType={userType} />
        </div>

        {/* Quick Stats */}
        <div className="bg-gradient-to-r from-agro-green-light to-agro-blue-light rounded-xl p-6 border border-primary/20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">20,000+</div>
              <div className="text-sm text-muted-foreground">{t('stats.products')}</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">500+</div>
              <div className="text-sm text-muted-foreground">{t('stats.suppliers')}</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">100+</div>
              <div className="text-sm text-muted-foreground">{t('stats.countries')}</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">24h</div>
              <div className="text-sm text-muted-foreground">{t('stats.responseTime')}</div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
