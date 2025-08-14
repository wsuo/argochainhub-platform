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
  CheckCircle2,
  Bot,
  History,
  Database,
  ShoppingCart,
  Star,
  Activity,
  Sparkles
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
  
  const quickAccessItems = [
    {
      id: "ai-search",
      title: "AI农药助手",
      description: "智能问答服务，快速获取专业建议",
      icon: Bot,
      color: "from-emerald-500 to-emerald-600",
      textColor: "text-emerald-600",
      bgColor: "bg-emerald-50",
      onClick: () => navigate('/ai-search')
    },
    {
      id: "products",
      title: "农药产品库",
      description: "浏览优质农药产品，对接可靠供应商",
      icon: Database,
      color: "from-blue-500 to-blue-600",
      textColor: "text-blue-600",
      bgColor: "bg-blue-50",
      onClick: () => navigate('/products')
    },
    {
      id: "cart",
      title: "购物车",
      description: "管理已选产品，批量询价采购",
      icon: ShoppingCart,
      color: "from-orange-500 to-orange-600",
      textColor: "text-orange-600",
      bgColor: "bg-orange-50",
      onClick: () => navigate('/cart')
    },
    {
      id: "conversation-history",
      title: "对话历史",
      description: "查看AI咨询记录，回顾专业建议",
      icon: History,
      color: "from-purple-500 to-purple-600",
      textColor: "text-purple-600",
      bgColor: "bg-purple-50",
      onClick: () => navigate('/conversation-history')
    }
  ];

  const managementItems = [
    {
      id: "inquiry",
      title: "询价管理",
      description: "发布询价需求，跟踪报价进度",
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      onClick: () => navigate('/inquiries')
    },
    {
      id: "samples",
      title: "样品管理",
      description: "申请产品样品，跟踪样品状态",
      icon: TestTube,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      onClick: () => navigate('/samples')
    },
    {
      id: "registrations",
      title: "登记管理",
      description: "管理产品登记申请，跟踪登记进度",
      icon: ScrollText,
      color: "text-teal-600",
      bgColor: "bg-teal-50",
      onClick: () => navigate('/registrations')
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
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 页面头部 */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary to-agro-blue rounded-3xl mb-6 shadow-2xl shadow-primary/20">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-primary to-agro-blue bg-clip-text text-transparent mb-3">
            采购商工作台
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            智能采购管理，高效业务协同
          </p>
          {isLoggedIn && (
            <div className="mt-4">
              <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                已认证用户 • 欢迎回来，{user?.name}
              </Badge>
            </div>
          )}
        </div>

        {/* 快速访问区域 */}
        <div>
          <div className="flex items-center space-x-3 mb-6">
            <Sparkles className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-gray-900">快速访问</h2>
            <p className="text-gray-600">常用功能，一键直达</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickAccessItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className="group bg-white/80 backdrop-blur-sm border border-white/30 hover:border-primary/30 hover:bg-white/90 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
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
            <FileText className="w-6 h-6 text-agro-blue" />
            <h2 className="text-2xl font-bold text-gray-900">业务管理</h2>
            <p className="text-gray-600">专业采购工具</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {managementItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className="group bg-white/80 backdrop-blur-sm border border-white/30 hover:border-primary/30 hover:bg-white/90 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
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
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors mt-2" />
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
            <TrendingUp className="w-6 h-6 text-emerald-600" />
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
                <Star className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-emerald-600 mb-1">0</div>
              <div className="text-sm text-gray-600">收藏产品</div>
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
                <Activity className="w-6 h-6 text-white" />
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
              <Bell className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">最新动态</h2>
            </div>
            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
              查看更多
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          
          {notifications.length > 0 ? (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div key={notification.id} className="bg-blue-50/80 rounded-xl p-4 border border-blue-100">
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

export default BuyerDashboard;