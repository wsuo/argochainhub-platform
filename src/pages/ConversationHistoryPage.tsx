import { useState } from "react";
import { useAuth } from "@/contexts/MockAuthContext";
import { Layout } from "@/components/layout/Layout";
import { ConversationHistory } from "@/components/conversation/ConversationHistory";
import { ConversationDetailView } from "@/components/conversation/ConversationDetailView";

export const ConversationHistoryPage = () => {
  const { currentUserType } = useAuth();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  const handleViewConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
  };

  const handleBackToList = () => {
    setSelectedConversationId(null);
  };

  return (
    <Layout userType={currentUserType}>
      <main className="flex-1 p-6 bg-gradient-to-br from-slate-50 via-agro-green-light/30 to-agro-blue-light/40 relative overflow-hidden">
        {/* 装饰性渐变叠层 */}
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-agro-blue/8 pointer-events-none" />
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-radial from-primary/10 via-primary/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-radial from-agro-blue/8 via-agro-blue/4 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        {/* 内容区域 */}
        <div className="relative z-10 h-full">
          {selectedConversationId ? (
            <ConversationDetailView
              conversationId={selectedConversationId}
              onBack={handleBackToList}
              className="h-full"
            />
          ) : (
            <div className="h-full">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-foreground mb-2">AI对话历史</h1>
                <p className="text-muted-foreground">查看您与AI助手的所有对话记录</p>
              </div>
              <ConversationHistory
                onViewConversation={handleViewConversation}
                className="h-[calc(100%-120px)]"
              />
            </div>
          )}
        </div>
      </main>
    </Layout>
  );
};

export default ConversationHistoryPage;