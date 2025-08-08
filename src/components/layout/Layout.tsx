import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { ConversationHistoryPage } from "@/pages/ConversationHistoryPage";

interface LayoutProps {
  children: React.ReactNode;
  userType?: "buyer" | "supplier";
}

export const Layout = ({ children, userType = "buyer" }: LayoutProps) => {
  const [activeItem, setActiveItem] = useState("ai-query");
  const navigate = useNavigate();
  const location = useLocation();

  // 根据当前路径确定活跃菜单项
  const getActiveItemFromPath = (pathname: string) => {
    if (pathname.startsWith('/products')) return 'products';
    if (pathname === '/conversation-history') return 'conversation-history';
    if (pathname.startsWith('/inquiries')) return 'inquiries';
    if (pathname.startsWith('/inquiry-responses')) return 'inquiry-responses';
    if (pathname === '/cart') return 'cart';
    return 'ai-query';
  };

  const handleItemClick = (itemId: string) => {
    setActiveItem(itemId);
    
    // 处理路由导航
    switch (itemId) {
      case 'products':
        navigate('/products');
        break;
      case 'cart':
        navigate('/cart');
        break;
      case 'conversation-history':
        navigate('/conversation-history');
        break;
      case 'inquiries':
        navigate('/inquiries');
        break;
      case 'inquiry-responses':
        navigate('/inquiry-responses');
        break;
      case 'ai-query':
        navigate('/');
        break;
      default:
        // 其他菜单项暂时保持在当前页面
        console.log(`Menu item clicked: ${itemId}`);
        break;
    }
  };

  // 如果是特定路由，直接渲染children，不使用Layout的内部路由逻辑
  const isExternalRoute = location.pathname.startsWith('/products') || 
                         location.pathname === '/auth' || 
                         location.pathname === '/supplier' || 
                         location.pathname === '/buyer' ||
                         location.pathname === '/conversation-history' ||
                         location.pathname.startsWith('/inquiries') ||
                         location.pathname.startsWith('/inquiry-responses') ||
                         location.pathname === '/cart';
  const currentActiveItem = getActiveItemFromPath(location.pathname);

  const renderContent = () => {
    if (isExternalRoute) {
      return children;
    }

    switch (activeItem) {
      case "conversation-history":
        return <ConversationHistoryPage />;
      default:
        return (
          <main className="flex-1 p-3 md:p-4 xl:p-6 bg-gradient-to-br from-slate-50 via-agro-green-light/30 to-agro-blue-light/40 relative overflow-hidden">
            {/* 装饰性渐变叠层 */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-agro-blue/8 pointer-events-none" />
            <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-radial from-primary/10 via-primary/5 to-transparent rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-radial from-agro-blue/8 via-agro-blue/4 to-transparent rounded-full blur-3xl pointer-events-none" />
            
            {/* 内容区域 */}
            <div className="relative z-10 h-full">
              {children}
            </div>
          </main>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header userType={userType} />
      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar 
          userType={userType} 
          activeItem={isExternalRoute ? currentActiveItem : activeItem}
          onItemClick={handleItemClick}
        />
        {renderContent()}
      </div>
    </div>
  );
};