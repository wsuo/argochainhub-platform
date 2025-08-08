import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  TestTube, 
  ClipboardList, 
  CheckCircle, 
  Package, 
  Building2, 
  Heart, 
  Bell,
  Eye,
  TrendingUp,
  ChevronRight,
  Calendar,
  CheckCircle2
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/MockAuthContext";
import { useNavigate } from "react-router-dom";

const SupplierDashboard = () => {
  const { t } = useTranslation();
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  
  // 验证用户类型，如果是采购商（非供应商）则自动跳转到采购商工作台
  useEffect(() => {
    if (isLoggedIn && user && user.userType !== 'supplier') {
      navigate('/buyer', { replace: true });
    }
  }, [isLoggedIn, user, navigate]);
  
  const managementItems = [
    {
      id: "quotes",
      title: "报价管理",
      description: "中国农药询价平台，精准匹配高效对接",
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      id: "samples", 
      title: "样品管理",
      description: "标准化样品对接流程，便捷匹配、快速响应",
      icon: TestTube,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      id: "registration",
      title: "登记管理", 
      description: "专业农药产品登记服务，合规资源、全程保障",
      icon: ClipboardList,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    },
    {
      id: "audit",
      title: "审核管理",
      description: "客户资质审核，保障交易安全",
      icon: CheckCircle,
      color: "text-purple-600", 
      bgColor: "bg-purple-50"
    },
    {
      id: "products",
      title: "产品管理",
      description: "维护产品信息，优化产品展示",
      icon: Package,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50"
    },
    {
      id: "company",
      title: "公司管理", 
      description: "完善公司资料，提升品牌形象",
      icon: Building2,
      color: "text-teal-600",
      bgColor: "bg-teal-50"
    },
    {
      id: "favorites",
      title: "我的收藏",
      description: "收藏优质买家，建立长期合作", 
      icon: Heart,
      color: "text-red-600",
      bgColor: "bg-red-50"
    }
  ];

  const notifications = [
    {
      id: 1,
      title: "供应商认证通过",
      description: "企业认证申请已通过",
      time: "2025/07/30 16:30:14",
      type: "success"
    }
  ];

  return (
    <Layout userType="supplier">
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
              <h1 className="text-3xl font-bold text-foreground">{t("dashboard.supplier.title")}</h1>
              <p className="text-muted-foreground mt-1">{t("dashboard.supplier.subtitle")}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-sm">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                已认证
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
            {/* Left Column - Messages and Ranking */}
            <div className="lg:col-span-2 space-y-6">
              {/* Latest Messages */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-lg font-medium flex items-center">
                    <Bell className="w-5 h-5 mr-2 text-blue-600" />
                    最新消息
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="text-blue-600">
                    查看更多
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div key={notification.id} className="flex items-start justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{notification.time}</span>
                          </div>
                          <h4 className="font-medium text-foreground text-sm">{notification.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1">{notification.description}</p>
                        </div>
                        <Button size="sm" variant="outline" className="ml-3">
                          去查看
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <Bell className="w-8 h-8 mb-2 text-muted-foreground/50" />
                      <p className="text-sm font-medium">暂无新消息</p>
                      <p className="text-xs text-center mt-1">系统消息和业务通知将在这里显示</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Product Ranking */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-lg font-medium flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                    产品浏览排行
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="text-blue-600">
                    查看更多
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Eye className="w-8 h-8 mb-2 text-muted-foreground/50" />
                    <p className="text-sm font-medium">暂无产品</p>
                    <p className="text-xs text-center mt-1">添加产品后可查看浏览数据</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Latest Inquiries */}
            <div className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-lg font-medium flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-orange-600" />
                    最新询价
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="text-blue-600">
                    查看更多
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <FileText className="w-8 h-8 mb-2 text-muted-foreground/50" />
                    <p className="text-sm font-medium">暂无最新询价</p>
                    <p className="text-xs text-center mt-1">采购商询价将在这里显示</p>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">0</div>
                    <div className="text-xs text-muted-foreground mt-1">待处理询价</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">0</div>
                    <div className="text-xs text-muted-foreground mt-1">今日浏览</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">0</div>
                    <div className="text-xs text-muted-foreground mt-1">样品申请</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">0</div>
                    <div className="text-xs text-muted-foreground mt-1">产品数量</div>
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

export default SupplierDashboard;