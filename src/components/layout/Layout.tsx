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
    if (pathname === '/buyer' || pathname === '/supplier') return ''; // 工作台页面不选中任何菜单项
    if (pathname.startsWith('/products')) return 'products';
    if (pathname === '/conversation-history') return 'conversation-history';
    if (pathname.startsWith('/inquiries')) return 'inquiries';
    if (pathname.startsWith('/quote-management')) return 'quote-management';
    if (pathname.startsWith('/registrations')) return 'registrations';
    if (pathname.startsWith('/supplier-registrations')) return 'registration-responses';
    if (pathname.startsWith('/samples')) return 'samples';
    if (pathname.startsWith('/sample-responses')) return 'sample-responses';
    if (pathname === '/cart') return 'cart';
    if (pathname === '/ai-search') return 'ai-search';
    if (pathname === '/suppliers') return 'suppliers';
    if (pathname === '/') return 'ai-search'; // 默认页面也是AI农药助手
    return 'ai-search'; // 默认回退到AI农药助手
  };

  const [activeItem, setActiveItem] = useState(getInitialActiveItem());

  // 根据当前路径确定活跃菜单项
  const getActiveItemFromPath = (pathname: string) => {
    if (pathname === '/buyer' || pathname === '/supplier') return ''; // 工作台页面不选中任何菜单项
    if (pathname.startsWith('/products')) return 'products';
    if (pathname === '/conversation-history') return 'conversation-history';
    if (pathname.startsWith('/inquiries')) return 'inquiries';
    if (pathname.startsWith('/quote-management')) return 'quote-management';
    if (pathname.startsWith('/registrations')) return 'registrations';
    if (pathname.startsWith('/supplier-registrations')) return 'registration-responses';
    if (pathname.startsWith('/samples')) return 'samples';
    if (pathname.startsWith('/sample-responses')) return 'sample-responses';
    if (pathname === '/cart') return 'cart';
    if (pathname === '/ai-search') return 'ai-search';
    if (pathname === '/suppliers') return 'suppliers';
    if (pathname === '/') return 'ai-search'; // 默认页面也是AI农药助手
    return 'ai-search'; // 默认回退到AI农药助手
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
      case 'ai-search':
        navigate('/ai-search');
        break;
      case 'suppliers':
        navigate('/suppliers');
        break;
      case 'dashboard':
        // 根据用户类型跳转到对应的工作台
        if (userType === 'supplier') {
          navigate('/supplier');
        } else {
          navigate('/buyer');
        }
        break;
      default:
        // 其他菜单项暂时保持在当前页面
        console.log(`Menu item clicked: ${itemId}`);
        break;
    }
  };

  // 如果是特定路由，直接渲染children，不使用Layout的内部路由逻辑
  const isExternalRoute = location.pathname === '/auth';
  const currentActiveItem = getActiveItemFromPath(location.pathname);

  const renderContent = () => {
    if (isExternalRoute) {
      return children;
    }

    // 所有其他路由都使用统一的背景和包装
    return (
      <main className="flex-1 relative overflow-hidden">
        {/* 固定的渐变背景层 - 不随内容滚动 */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-slate-50/60 to-slate-100/50" />
        
        {/* 装饰性渐变叠层 - 固定不动 */}
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-200/20 via-transparent to-blue-200/15 pointer-events-none" />
        <div className="absolute top-0 right-0 w-2/5 h-2/5 bg-gradient-radial from-emerald-300/30 via-emerald-200/15 to-transparent rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-3/5 h-3/5 bg-gradient-radial from-blue-300/25 via-blue-200/10 to-transparent rounded-full blur-2xl pointer-events-none" />
        
        {/* 可滚动的内容区域 */}
        <div className="relative z-10 h-full overflow-auto p-6">
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
