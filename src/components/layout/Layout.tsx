import { useState } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { ConversationHistoryPage } from "@/pages/ConversationHistoryPage";

interface LayoutProps {
  children: React.ReactNode;
  userType?: "buyer" | "supplier";
}

export const Layout = ({ children, userType = "buyer" }: LayoutProps) => {
  const [activeItem, setActiveItem] = useState("ai-query");

  const renderContent = () => {
    switch (activeItem) {
      case "conversation-history":
        return <ConversationHistoryPage />;
      default:
        return (
          <main className="flex-1 p-6 bg-gradient-to-br from-slate-50 via-agro-green-light/30 to-agro-blue-light/40 relative overflow-hidden">
            {/* 装饰性渐变叠层 */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-agro-blue/8 pointer-events-none" />
            <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-radial from-primary/10 via-primary/5 to-transparent rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-radial from-agro-blue/8 via-agro-blue/4 to-transparent rounded-full blur-3xl pointer-events-none" />
            
            {/* 内容区域 */}
            <div className="relative z-10">
              {children}
            </div>
          </main>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header userType={userType} />
      <div className="flex">
        <Sidebar 
          userType={userType} 
          activeItem={activeItem}
          onItemClick={setActiveItem}
        />
        {renderContent()}
      </div>
    </div>
  );
};