import { useState, useEffect } from "react";
import { ArrowLeft, User, Bot, Clock, DollarSign, MessageSquare, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTranslation } from "react-i18next";
import { ConversationService, ConversationDetail } from "@/services/conversationService";
import { getOrCreateGuestId } from "@/utils/guestId";
import { MessageContent } from "@/components/chat/MessageContent";

interface ConversationDetailViewProps {
  conversationId: string;
  onBack?: () => void;
  className?: string;
}

export const ConversationDetailView = ({ 
  conversationId, 
  onBack, 
  className 
}: ConversationDetailViewProps) => {
  const { t } = useTranslation();
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载对话详情
  const loadConversationDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const guestId = getOrCreateGuestId();
      const response = await ConversationService.getConversationDetail(conversationId, guestId);

      if (response.success) {
        setConversation(response.data);
      } else {
        setError(response.message || '加载对话详情失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载对话详情时出现错误');
    } finally {
      setLoading(false);
    }
  };

  // 格式化时间
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  // 格式化持续时间
  const formatDuration = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    if (seconds < 60) {
      return `${seconds}秒`;
    } else {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}分${remainingSeconds}秒`;
    }
  };

  // 格式化费用
  const formatCost = (cost: number | string | null | undefined) => {
    // 确保 cost 是有效数字
    const numericCost = typeof cost === 'number' ? cost : parseFloat(String(cost || '0'));
    return (!isNaN(numericCost) && numericCost > 0) ? `$${numericCost.toFixed(4)}` : '免费';
  };

  // 格式化延迟
  const formatLatency = (latency: number | string | null | undefined) => {
    // 确保 latency 是有效数字
    const numericLatency = typeof latency === 'number' ? latency : parseFloat(String(latency || '0'));
    return !isNaN(numericLatency) ? `${numericLatency.toFixed(2)}s` : '未知';
  };

  // 组件挂载时加载数据
  useEffect(() => {
    loadConversationDetail();
  }, [conversationId]); // 添加conversationId依赖

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">加载对话详情中...</h3>
          <p className="text-gray-600">正在获取完整的对话记录</p>
        </div>
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={onBack}
            className="bg-white/60 backdrop-blur-sm border-white/30 hover:bg-white/80"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('common.back') || '返回'}
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">加载失败</h1>
        </div>
        <Alert variant="destructive" className="bg-red-50/80 backdrop-blur-sm border-red-200/50">
          <AlertDescription>
            {error || '对话详情加载失败'}
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-2" 
              onClick={loadConversationDetail}
            >
              重试
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* 头部 - 返回按钮和标题 */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={onBack}
            className="bg-white/60 backdrop-blur-sm border-white/30 hover:bg-white/80"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('common.back') || '返回'}
          </Button>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-primary to-agro-blue rounded-2xl flex items-center justify-center shadow-lg">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-primary to-agro-blue bg-clip-text text-transparent">
                {conversation.title || "AI对话详情"}
              </h1>
              <p className="text-gray-600">
                {formatTime(conversation.createdAt)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 可滚动内容区域 */}
      <div className="flex-1 overflow-y-auto space-y-6">

        {/* 统计信息卡片 */}
        <div className="bg-white/40 backdrop-blur-sm border-0 rounded-2xl p-6 shadow-lg">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-primary/10 backdrop-blur-sm rounded-2xl mx-auto mb-3">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{conversation.totalMessages}</p>
              <p className="text-sm text-gray-600 mt-1">消息数量</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-agro-blue/10 backdrop-blur-sm rounded-2xl mx-auto mb-3">
                <Zap className="w-6 h-6 text-agro-blue" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{conversation.totalTokens}</p>
              <p className="text-sm text-gray-600 mt-1">消耗Tokens</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-emerald-500/10 backdrop-blur-sm rounded-2xl mx-auto mb-3">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatCost(conversation.totalCost)}</p>
              <p className="text-sm text-gray-600 mt-1">总费用</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-amber-500/10 backdrop-blur-sm rounded-2xl mx-auto mb-3">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatDuration(conversation.duration)}</p>
              <p className="text-sm text-gray-600 mt-1">对话时长</p>
            </div>
          </div>
        </div>

        {/* 对话消息 */}
        <div className="bg-white/40 backdrop-blur-sm border-0 rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 bg-white/20 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2 text-primary" />
              对话内容
            </h3>
          </div>
          <ScrollArea className="h-[60vh]">
            <div className="p-6 space-y-6">
              {conversation.messages.map((message, index) => (
                <div
                  key={message.id}
                  className={`flex ${message.messageType === 'user_query' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-3 max-w-[85%] ${message.messageType === 'user_query' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    {/* 头像 */}
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${
                      message.messageType === 'user_query' 
                        ? 'bg-gradient-to-r from-primary to-agro-blue text-white' 
                        : 'bg-gradient-to-r from-emerald-400 to-emerald-600 text-white'
                    }`}>
                      {message.messageType === 'user_query' ? (
                        <User className="w-5 h-5" />
                      ) : (
                        <Bot className="w-5 h-5" />
                      )}
                    </div>
                    
                    {/* 消息内容 */}
                    <div className={`rounded-2xl p-4 shadow-lg ${
                      message.messageType === 'user_query'
                        ? 'bg-gradient-to-r from-primary to-agro-blue text-white'
                        : 'bg-white/80 backdrop-blur-sm text-gray-900'
                    }`}>
                      <MessageContent 
                        content={message.content}
                        sender={message.messageType === 'user_query' ? 'user' : 'ai'}
                        useTypewriter={false}
                      />
                      <div className={`text-xs mt-3 ${
                        message.messageType === 'user_query' ? 'text-white/70' : 'text-gray-500'
                      }`}>
                        {formatTime(message.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* 使用统计详情 */}
        {conversation.usageStatistics && conversation.usageStatistics.length > 0 && (
          <div className="bg-white/40 backdrop-blur-sm border-0 rounded-2xl shadow-lg">
            <div className="p-6 bg-white/20 backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-agro-blue" />
                使用统计
              </h3>
            </div>
            <div className="p-6">
              {conversation.usageStatistics.map((usage, index) => (
                <div key={usage.id} className="mb-6 last:mb-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3">
                      <span className="text-gray-600 block text-xs mb-1">输入Tokens</span>
                      <span className="font-semibold text-gray-900">{usage.promptTokens}</span>
                    </div>
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3">
                      <span className="text-gray-600 block text-xs mb-1">输出Tokens</span>
                      <span className="font-semibold text-gray-900">{usage.completionTokens}</span>
                    </div>
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3">
                      <span className="text-gray-600 block text-xs mb-1">总计</span>
                      <span className="font-semibold text-gray-900">{usage.totalTokens}</span>
                    </div>
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3">
                      <span className="text-gray-600 block text-xs mb-1">费用</span>
                      <span className="font-semibold text-gray-900">{formatCost(usage.totalPrice)}</span>
                    </div>
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3">
                      <span className="text-gray-600 block text-xs mb-1">延迟</span>
                      <span className="font-semibold text-gray-900">{formatLatency(usage.latency)}</span>
                    </div>
                  </div>
                  {index < conversation.usageStatistics.length - 1 && (
                    <div className="h-px bg-white/30 my-4" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      
      </div> {/* 结束滚动容器 */}
    </div>
  );
};