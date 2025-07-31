import { useState } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

interface LayoutProps {
  children: React.ReactNode;
  userType?: "buyer" | "supplier";
}

export const Layout = ({ children, userType = "buyer" }: LayoutProps) => {
  const [activeItem, setActiveItem] = useState("ai-query");

  return (
    <div className="min-h-screen bg-background">
      <Header userType={userType} />
      <div className="flex">
        <Sidebar 
          userType={userType} 
          activeItem={activeItem}
          onItemClick={setActiveItem}
        />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};