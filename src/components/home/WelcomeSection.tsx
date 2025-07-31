import heroImage from "@/assets/hero-agro.jpg";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Globe, Zap, Shield, TrendingUp } from "lucide-react";

interface WelcomeSectionProps {
  userType: "buyer" | "supplier";
}

export const WelcomeSection = ({ userType }: WelcomeSectionProps) => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-agro-blue/5 to-agro-green-light/50 border border-primary/20">
      <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-transparent z-10" />
      
      <div className="relative z-20 p-8 lg:p-12">
        <div className="max-w-2xl">
          <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
            全球农化B2B智慧平台
          </Badge>
          
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4 leading-tight">
            {userType === "buyer" ? (
              <>
                连接全球<br />
                <span className="bg-gradient-to-r from-primary to-agro-blue bg-clip-text text-transparent">
                  优质农药供应商
                </span>
              </>
            ) : (
              <>
                拓展海外市场<br />
                <span className="bg-gradient-to-r from-primary to-agro-blue bg-clip-text text-transparent">
                  获得更多订单
                </span>
              </>
            )}
          </h1>
          
          <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
            {userType === "buyer" 
              ? "基于AI和大数据技术，为海外采购商提供一站式中国农药采购解决方案，解决信息不对称，提升交易效率。"
              : "为中国农药供应商提供精准的海外市场推广渠道，通过智能匹配系统连接全球买家，提升订单转化率。"
            }
          </p>
          
          <div className="flex flex-wrap gap-4 mb-8">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Globe className="w-4 h-4 text-agro-blue" />
              <span>覆盖100+国家</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Zap className="w-4 h-4 text-agro-blue" />
              <span>AI智能匹配</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Shield className="w-4 h-4 text-agro-blue" />
              <span>安全可信赖</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <TrendingUp className="w-4 h-4 text-agro-blue" />
              <span>效率提升80%</span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" className="bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary shadow-lg">
              {userType === "buyer" ? "开始采购" : "发布产品"}
            </Button>
            <Button size="lg" variant="outline" className="border-primary/30 hover:bg-primary/10">
              了解更多
            </Button>
          </div>
        </div>
      </div>
      
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage} 
          alt="Agricultural technology background"
          className="w-full h-full object-cover opacity-20"
        />
      </div>
    </div>
  );
};