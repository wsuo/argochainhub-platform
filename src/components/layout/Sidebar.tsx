import { 
  MessageSquare, 
  Database, 
  ShoppingCart, 
  FileText, 
  TestTube, 
  ClipboardList,
  Building2,
  Users,
  Star,
  History
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/MockAuthContext";

interface SidebarProps {
  userType: "buyer" | "supplier";
  activeItem: string;
  onItemClick: (item: string) => void;
}

export const Sidebar = ({ userType, activeItem, onItemClick }: SidebarProps) => {
  const { user, isLoggedIn } = useAuth();
  const buyerMenuItems = [
    {
      id: "ai-query",
      label: "AI农药查询",
      icon: MessageSquare,
      description: "智能问答服务"
    },
    {
      id: "conversation-history",
      label: "对话历史",
      icon: History,
      description: "查看AI对话记录"
    },
    {
      id: "products",
      label: "农药产品库",
      icon: Database,
      description: "浏览所有产品"
    },
    {
      id: "cart",
      label: "购物车",
      icon: ShoppingCart,
      description: "临时产品列表"
    },
    {
      id: "inquiries",
      label: "询价管理",
      icon: FileText,
      description: "管理询价单"
    },
    {
      id: "samples",
      label: "样品管理",
      icon: TestTube,
      description: "管理样品申请"
    },
    {
      id: "registrations",
      label: "登记管理",
      icon: ClipboardList,
      description: "管理登记申请"
    },
    {
      id: "suppliers",
      label: "供应商列表",
      icon: Building2,
      description: "查看供应商"
    },
    {
      id: "top100",
      label: "Top 100供应商",
      icon: Star,
      description: "优质供应商排名"
    }
  ];

  const supplierMenuItems = [
    {
      id: "ai-query",
      label: "AI农药查询",
      icon: MessageSquare,
      description: "智能问答服务"
    },
    {
      id: "conversation-history",
      label: "对话历史",
      icon: History,
      description: "查看AI对话记录"
    },
    {
      id: "my-products",
      label: "我的产品库",
      icon: Database,
      description: "管理我的产品"
    },
    {
      id: "inquiry-responses",
      label: "询价响应",
      icon: FileText,
      description: "处理询价请求"
    },
    {
      id: "sample-responses",
      label: "样品响应",
      icon: TestTube,
      description: "处理样品申请"
    },
    {
      id: "registration-responses",
      label: "登记响应",
      icon: ClipboardList,
      description: "协助登记申请"
    },
    {
      id: "customers",
      label: "客户管理",
      icon: Users,
      description: "管理客户关系"
    }
  ];

  const menuItems = userType === "buyer" ? buyerMenuItems : supplierMenuItems;

  return (
    <aside className="w-64 bg-card border-r border-border h-[calc(100vh-4rem)] flex flex-col">
      {/* Logo and Company Info - 从Header移过来 */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-9 h-9 bg-gradient-to-br from-primary to-agro-blue rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-foreground leading-tight">
              {userType === "buyer" ? "采购商中心" : "供应商中心"}
            </h1>
            <p className="text-xs text-muted-foreground leading-tight">
              智慧农化采购平台
            </p>
          </div>
        </div>
        
        {isLoggedIn && (
          <div className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
            欢迎回来，{user?.name}
          </div>
        )}
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;
          
          return (
            <Button
              key={item.id}
              variant={isActive ? "default" : "ghost"}
              className={cn(
                "w-full justify-start h-auto p-3 transition-all duration-200",
                isActive && "shadow-sm"
              )}
              onClick={() => onItemClick(item.id)}
            >
              <div className="flex items-center space-x-3 w-full">
                <Icon className="w-4 h-4 shrink-0" />
                <div className="text-left">
                  <div className="font-medium">{item.label}</div>
                  <div className="text-xs opacity-70">{item.description}</div>
                </div>
              </div>
            </Button>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-border">
        <div className="bg-gradient-to-r from-primary/10 to-agro-blue/10 rounded-lg p-3">
          <div className="text-sm font-medium text-foreground">会员计划</div>
          <div className="text-xs text-muted-foreground mt-1">
            升级获得更多权限
          </div>
          <Button size="sm" className="mt-2 w-full">
            立即升级
          </Button>
        </div>
      </div>
    </aside>
  );
};