import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/MockAuthContext";
import { Layout } from "@/components/layout/Layout";
import { ConversationHistory } from "@/components/conversation/ConversationHistory";
import { ConversationDetailView } from "@/components/conversation/ConversationDetailView";
import { History, MessageSquare, Sparkles } from "lucide-react";

export const ConversationHistoryPage = () => {
  const { t } = useTranslation();
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
      <div className="max-w-7xl mx-auto space-y-8">
        {selectedConversationId ? (
          // 对话详情视图
          <ConversationDetailView
            conversationId={selectedConversationId}
            onBack={handleBackToList}
            className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl shadow-xl p-6"
          />
        ) : (
          // 对话历史列表视图
          <>
            {/* 页面头部 */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary to-agro-blue rounded-3xl mb-6 shadow-2xl shadow-primary/20">
                <History className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-primary to-agro-blue bg-clip-text text-transparent mb-3">
                {t('navigation.conversationHistory') || 'AI对话历史'}
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                管理您与AI农药助手的所有对话记录，随时回顾专业建议
              </p>
            </div>

            {/* 统计信息卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">对话记录</h3>
                    <p className="text-gray-600 text-sm">查看所有历史对话</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">AI助手</h3>
                    <p className="text-gray-600 text-sm">专业农化咨询</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center">
                    <History className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">历史管理</h3>
                    <p className="text-gray-600 text-sm">便捷搜索与管理</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 对话历史列表 */}
            <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl shadow-xl p-6">
              <ConversationHistory
                onViewConversation={handleViewConversation}
                className="min-h-[500px]"
              />
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default ConversationHistoryPage;