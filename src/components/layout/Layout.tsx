import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

interface LayoutProps {
  children: React.ReactNode;
  userType?: "buyer" | "supplier";
}

export const Layout = ({ children, userType = "buyer" }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 根据当前路径确定初始活跃菜单项
  const getInitialActiveItem = () => {
    const pathname = location.pathname;
    if (pathname.startsWith('/products')) return 'products';
    if (pathname === '/conversation-history') return 'conversation-history';
    if (pathname.startsWith('/inquiries')) return 'inquiries';
    if (pathname.startsWith('/quote-management')) return 'quote-management';
    if (pathname.startsWith('/registrations')) return 'registrations';
    if (pathname.startsWith('/supplier-registrations')) return 'registration-responses';
    if (pathname.startsWith('/samples')) return 'samples';
    if (pathname.startsWith('/sample-responses')) return 'sample-responses';
    if (pathname === '/cart') return 'cart';
    return 'ai-query';
  };

  const [activeItem, setActiveItem] = useState(getInitialActiveItem());

  // 根据当前路径确定活跃菜单项
  const getActiveItemFromPath = (pathname: string) => {
    if (pathname.startsWith('/products')) return 'products';
    if (pathname === '/conversation-history') return 'conversation-history';
    if (pathname.startsWith('/inquiries')) return 'inquiries';
    if (pathname.startsWith('/quote-management')) return 'quote-management';
    if (pathname.startsWith('/registrations')) return 'registrations';
    if (pathname.startsWith('/supplier-registrations')) return 'registration-responses';
    if (pathname.startsWith('/samples')) return 'samples';
    if (pathname.startsWith('/sample-responses')) return 'sample-responses';
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
      case 'registrations':
        navigate('/registrations');
        break;
      case 'registration-responses':
        navigate('/supplier-registrations');
        break;
      case 'samples':
        navigate('/samples');
        break;
      case 'sample-responses':
        navigate('/sample-responses');
        break;
      case 'quote-management':
        // 导航到报价管理路由
        navigate('/quote-management');
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
                         location.pathname === '/cart';
  const currentActiveItem = getActiveItemFromPath(location.pathname);

  const renderContent = () => {
    if (isExternalRoute) {
      return children;
    }

    // 所有其他路由都使用统一的背景和包装
    return (
      <main className="flex-1 p-3 md:p-4 xl:p-6 bg-gradient-to-br from-slate-50 via-agro-green-light/20 to-agro-blue-light/30 relative overflow-auto">
        {/* 内容区域 */}
        <div className="relative z-10">
          {children}
        </div>
      </main>
    );
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