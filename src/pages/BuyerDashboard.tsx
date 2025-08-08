import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Package, 
  Users, 
  ShoppingBag, 
  TestTube, 
  ScrollText, 
  Heart,
  Bell,
  TrendingUp,
  ChevronRight,
  Calendar,
  CheckCircle2
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/MockAuthContext";
import { useNavigate } from "react-router-dom";

const BuyerDashboard = () => {
  const { t } = useTranslation();
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  
  // 验证用户类型，如果是供应商则自动跳转到供应商工作台
  useEffect(() => {
    if (isLoggedIn && user && user.userType === 'supplier') {
      navigate('/supplier', { replace: true });
    }
  }, [isLoggedIn, user, navigate]);
  
  const managementItems = [
    {
      id: "inquiry",
      title: t("dashboard.buyer.management.inquiry"),
      description: t("dashboard.buyer.management.inquiryDesc"),
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      id: "products", 
      title: t("dashboard.buyer.management.products"),
      description: t("dashboard.buyer.management.productsDesc"),
      icon: Package,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      id: "suppliers",
      title: t("dashboard.buyer.management.suppliers"), 
      description: t("dashboard.buyer.management.suppliersDesc"),
      icon: Users,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    },
    {
      id: "orders",
      title: t("dashboard.buyer.management.orders"),
      description: t("dashboard.buyer.management.ordersDesc"),
      icon: ShoppingBag,
      color: "text-purple-600", 
      bgColor: "bg-purple-50"
    },
    {
      id: "samples",
      title: t("dashboard.buyer.management.samples"),
      description: t("dashboard.buyer.management.samplesDesc"),
      icon: TestTube,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50"
    },
    {
      id: "contracts",
      title: t("dashboard.buyer.management.contracts"), 
      description: t("dashboard.buyer.management.contractsDesc"),
      icon: ScrollText,
      color: "text-teal-600",
      bgColor: "bg-teal-50"
    },
    {
      id: "favorites",
      title: t("dashboard.buyer.management.favorites"),
      description: t("dashboard.buyer.management.favoritesDesc"), 
      icon: Heart,
      color: "text-red-600",
      bgColor: "bg-red-50"
    }
  ];

  const notifications = [
    {
      id: 1,
      title: "供应商回复询价",
      description: "您的询价#INQ-2024-001已收到新报价",
      time: "2025/01/08 14:30:25",
      type: "info"
    }
  ];

  return (
    <Layout userType="buyer">
      <main className="flex-1 p-6 bg-gradient-to-br from-slate-50 via-agro-green-light/30 to-agro-blue-light/40 relative overflow-hidden">
        {/* 装饰性渐变叠层 */}
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-agro-blue/8 pointer-events-none" />
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-radial from-primary/10 via-primary/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-radial from-agro-blue/8 via-agro-blue/4 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        {/* 内容区域 */}
        <div className="relative z-10 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{t("dashboard.buyer.title")}</h1>
              <p className="text-muted-foreground mt-1">{t("dashboard.buyer.subtitle")}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-sm">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                {t("dashboard.buyer.verified")}
              </Badge>
            </div>
          </div>

          {/* Management Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {managementItems.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${item.bgColor}`}>
                        <Icon className={`w-5 h-5 ${item.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground text-sm">{item.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Dashboard Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Messages and Hot Products */}
            <div className="lg:col-span-2 space-y-6">
              {/* Latest Messages */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-lg font-medium flex items-center">
                    <Bell className="w-5 h-5 mr-2 text-blue-600" />
                    {t("dashboard.buyer.sections.latestMessages")}
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="text-blue-600">
                    {t("dashboard.buyer.sections.viewMore")}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div key={notification.id} className="flex items-start justify-between p-3 bg-blue-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{notification.time}</span>
                          </div>
                          <h4 className="font-medium text-foreground text-sm">{notification.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1">{notification.description}</p>
                        </div>
                        <Button size="sm" variant="outline" className="ml-3">
                          {t("common.view")}
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <Bell className="w-8 h-8 mb-2 text-muted-foreground/50" />
                      <p className="text-sm font-medium">{t("dashboard.buyer.empty.noMessages")}</p>
                      <p className="text-xs text-center mt-1">{t("dashboard.buyer.empty.noMessagesDesc")}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Hot Product Recommendations */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-lg font-medium flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                    {t("dashboard.buyer.sections.hotProducts")}
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="text-blue-600">
                    {t("dashboard.buyer.sections.viewMore")}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Package className="w-8 h-8 mb-2 text-muted-foreground/50" />
                    <p className="text-sm font-medium">{t("dashboard.buyer.empty.noProducts")}</p>
                    <p className="text-xs text-center mt-1">{t("dashboard.buyer.empty.noProductsDesc")}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Quick Stats */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">0</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {t("dashboard.buyer.stats.pendingInquiries")}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">0</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {t("dashboard.buyer.stats.todayViews")}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">0</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {t("dashboard.buyer.stats.sampleRequests")}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">0</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {t("dashboard.buyer.stats.favorites")}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
};

export default BuyerDashboard;