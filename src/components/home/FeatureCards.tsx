import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Database, FileText, TestTube, ClipboardList, ShoppingCart, Building2 } from "lucide-react";
import aiIcon from "@/assets/ai-icon.jpg";
import productsIcon from "@/assets/products-icon.jpg";
import inquiryIcon from "@/assets/inquiry-icon.jpg";

interface FeatureCardsProps {
  userType: "buyer" | "supplier";
}

export const FeatureCards = ({ userType }: FeatureCardsProps) => {
  const buyerFeatures = [
    {
      id: "products",
      title: "农药产品库",
      description: "浏览数千种优质农药产品，精准筛选符合需求的产品和供应商",
      icon: Database,
      image: productsIcon,
      stats: "20,000+ 产品",
      buttonText: "浏览产品"
    },
    {
      id: "inquiries",
      title: "询价管理",
      description: "一键发起询价请求，实时跟踪报价状态，高效管理采购流程",
      icon: FileText,
      image: inquiryIcon,
      stats: "平均24h响应",
      buttonText: "发起询价"
    },
    {
      id: "samples",
      title: "样品管理",
      description: "在线申请产品样品，跟踪样品寄送状态，确保产品质量",
      icon: TestTube,
      stats: "全球配送",
      buttonText: "申请样品"
    },
    {
      id: "registrations",
      title: "登记管理",
      description: "协助产品登记申请，提供专业法规支持，加速市场准入",
      icon: ClipboardList,
      stats: "100+ 国家法规",
      buttonText: "申请登记"
    },
    {
      id: "cart",
      title: "智能购物车",
      description: "收集心仪产品，批量发起询价、样品和登记申请",
      icon: ShoppingCart,
      stats: "批量操作",
      buttonText: "查看购物车"
    },
    {
      id: "suppliers",
      title: "供应商网络",
      description: "访问Top 100优质供应商，查看详细企业信息和产品目录",
      icon: Building2,
      stats: "500+ 供应商",
      buttonText: "查看供应商"
    }
  ];

  const supplierFeatures = [
    {
      id: "my-products",
      title: "产品管理",
      description: "管理您的产品目录，优化产品信息，提升曝光度",
      icon: Database,
      image: productsIcon,
      stats: "智能推荐",
      buttonText: "管理产品"
    },
    {
      id: "inquiry-responses",
      title: "询价响应",
      description: "及时响应买方询价，提供专业报价，赢得更多订单",
      icon: FileText,
      image: inquiryIcon,
      stats: "实时通知",
      buttonText: "查看询价"
    },
    {
      id: "sample-responses",
      title: "样品管理",
      description: "高效处理样品申请，管理样品库存，提升客户体验",
      icon: TestTube,
      stats: "库存管理",
      buttonText: "管理样品"
    },
    {
      id: "registration-responses",
      title: "登记支持",
      description: "协助客户产品登记，提供技术支持，建立长期合作",
      icon: ClipboardList,
      stats: "专业支持",
      buttonText: "登记协助"
    }
  ];

  const features = userType === "buyer" ? buyerFeatures : supplierFeatures;

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {features.map((feature) => {
        const Icon = feature.icon;
        
        return (
          <Card key={feature.id} className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-agro-blue/20 rounded-lg flex items-center justify-center group-hover:from-primary/30 group-hover:to-agro-blue/30 transition-colors">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base group-hover:text-primary transition-colors">
                      {feature.title}
                    </CardTitle>
                    {feature.stats && (
                      <div className="text-xs text-agro-blue font-medium mt-0.5">
                        {feature.stats}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3 pt-0">
              <CardDescription className="text-sm leading-relaxed">
                {feature.description}
              </CardDescription>
              
              <Button
                variant="outline"
                size="sm"
                className="w-full group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all"
              >
                {feature.buttonText}
                <ArrowRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};