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
  CheckCircle2,
  Activity,
  Sparkles,
  Database,
  Users,
  Star,
  ShoppingCart,
  BarChart3
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
  
  const quickAccessItems = [
    {
      id: "quote-management",
      title: "报价管理",
      description: "快速响应询价，提升成交率",
      icon: FileText,
      color: "from-blue-500 to-blue-600",
      textColor: "text-blue-600",
      bgColor: "bg-blue-50",
      onClick: () => navigate('/quote-management')
    },
    {
      id: "my-products",
      title: "产品管理",
      description: "维护产品信息，优化展示效果",
      icon: Database,
      color: "from-emerald-500 to-emerald-600",
      textColor: "text-emerald-600",
      bgColor: "bg-emerald-50",
      onClick: () => navigate('/my-products')
    },
    {
      id: "sample-responses",
      title: "样品响应",
      description: "处理样品申请，展示产品品质",
      icon: TestTube,
      color: "from-orange-500 to-orange-600",
      textColor: "text-orange-600",
      bgColor: "bg-orange-50",
      onClick: () => navigate('/sample-responses')
    },
    {
      id: "customers",
      title: "客户管理",
      description: "维护客户关系，拓展业务机会",
      icon: Users,
      color: "from-purple-500 to-purple-600",
      textColor: "text-purple-600",
      bgColor: "bg-purple-50",
      onClick: () => navigate('/customers')
    }
  ];

  const managementItems = [
    {
      id: "registration-responses",
      title: "登记响应",
      description: "协助客户完成产品登记申请",
      icon: ClipboardList,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      onClick: () => navigate('/supplier-registrations')
    },
    {
      id: "company-profile",
      title: "公司管理",
      description: "完善企业资料，提升品牌形象",
      icon: Building2,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      onClick: () => navigate('/company-profile')
    },
    {
      id: "favorites",
      title: "我的收藏",
      description: "收藏优质买家，建立长期合作",
      icon: Heart,
      color: "text-teal-600",
      bgColor: "bg-teal-50",
      onClick: () => navigate('/favorites')
    }
  ];

  const notifications = [
    {
      id: 1,
      title: "新询价通知",
      description: "您收到了新的产品询价请求",
      time: "2025/01/08 14:30:25",
      type: "info"
    }
  ];

  return (
    <Layout userType="supplier">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 页面头部 */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-emerald-500 to-agro-blue rounded-3xl mb-6 shadow-2xl shadow-emerald-500/20">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-emerald-600 to-agro-blue bg-clip-text text-transparent mb-3">
            供应商工作台
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            专业供应服务，高效业务协同
          </p>
          {isLoggedIn && (
            <div className="mt-4">
              <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                已认证企业 • 欢迎回来，{user?.name}
              </Badge>
            </div>
          )}
        </div>

        {/* 快速访问区域 */}
        <div>
          <div className="flex items-center space-x-3 mb-6">
            <Sparkles className="w-6 h-6 text-emerald-600" />
            <h2 className="text-2xl font-bold text-gray-900">快速访问</h2>
            <p className="text-gray-600">核心业务，一键直达</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickAccessItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className="group bg-white/80 backdrop-blur-sm border border-white/30 hover:border-emerald-400/30 hover:bg-white/90 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
                  onClick={item.onClick}
                >
                  <div className="space-y-4">
                    <div className={`w-12 h-12 bg-gradient-to-r ${item.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className={`font-semibold text-gray-900 group-hover:${item.textColor} transition-colors mb-2`}>
                        {item.title}
                      </h3>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 业务管理区域 */}
        <div>
          <div className="flex items-center space-x-3 mb-6">
            <Building2 className="w-6 h-6 text-agro-blue" />
            <h2 className="text-2xl font-bold text-gray-900">业务管理</h2>
            <p className="text-gray-600">专业供应工具</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {managementItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className="group bg-white/80 backdrop-blur-sm border border-white/30 hover:border-emerald-400/30 hover:bg-white/90 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
                  onClick={item.onClick}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-2xl ${item.bgColor}`}>
                      <Icon className={`w-6 h-6 ${item.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {item.title}
                      </h3>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {item.description}
                      </p>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 transition-colors mt-2" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 统计概览 */}
        <div>
          <div className="flex items-center space-x-3 mb-6">
            <BarChart3 className="w-6 h-6 text-emerald-600" />
            <h2 className="text-2xl font-bold text-gray-900">数据概览</h2>
            <p className="text-gray-600">业务统计信息</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white/80 backdrop-blur-sm border border-white/30 rounded-2xl p-6 shadow-lg text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-blue-600 mb-1">0</div>
              <div className="text-sm text-gray-600">待处理询价</div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm border border-white/30 rounded-2xl p-6 shadow-lg text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-emerald-600 mb-1">0</div>
              <div className="text-sm text-gray-600">产品数量</div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm border border-white/30 rounded-2xl p-6 shadow-lg text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <TestTube className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-orange-600 mb-1">0</div>
              <div className="text-sm text-gray-600">样品申请</div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm border border-white/30 rounded-2xl p-6 shadow-lg text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-purple-600 mb-1">0</div>
              <div className="text-sm text-gray-600">今日访问</div>
            </div>
          </div>
        </div>

        {/* 最新动态 */}
        <div className="bg-white/80 backdrop-blur-sm border border-white/30 rounded-2xl shadow-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Bell className="w-6 h-6 text-emerald-600" />
              <h2 className="text-xl font-bold text-gray-900">最新动态</h2>
            </div>
            <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700">
              查看更多
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          
          {notifications.length > 0 ? (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div key={notification.id} className="bg-emerald-50/80 rounded-xl p-4 border border-emerald-100">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-500">{notification.time}</span>
                      </div>
                      <h4 className="font-medium text-gray-900 mb-1">{notification.title}</h4>
                      <p className="text-sm text-gray-600">{notification.description}</p>
                    </div>
                    <Button size="sm" variant="outline" className="ml-4">
                      查看
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无新动态</h3>
              <p className="text-gray-600">系统消息和业务通知将显示在这里</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SupplierDashboard;