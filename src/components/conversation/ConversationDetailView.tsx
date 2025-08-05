import { useState, useEffect } from "react";
import { ArrowLeft, User, Bot, Clock, DollarSign, MessageSquare, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
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
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-muted-foreground">加载对话详情中...</p>
        </div>
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className={className}>
        <div className="flex items-center mb-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Button>
        </div>
        <Alert variant="destructive">
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
    <div className={`${className} flex flex-col`}>
      {/* 头部 - 固定不滚动 */}
      <div className="flex items-center justify-between mb-4 lg:mb-6 flex-shrink-0">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" onClick={onBack} className="mr-3">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Button>
          <div>
            <h2 className="text-lg lg:text-xl font-semibold text-foreground">
              {conversation.title || "AI对话详情"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {formatTime(conversation.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {/* 可滚动内容区域 */}
      <div className="flex-1 overflow-y-auto space-y-4 lg:space-y-6 pr-2">{/* 添加右边距避免滚动条遮挡内容 */}

        {/* 统计信息卡片 */}
        <Card className="p-3 lg:p-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg mx-auto mb-2">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">{conversation.totalMessages}</p>
            <p className="text-xs text-muted-foreground">消息数量</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center w-10 h-10 bg-agro-blue/10 rounded-lg mx-auto mb-2">
              <Zap className="w-5 h-5 text-agro-blue" />
            </div>
            <p className="text-2xl font-bold text-foreground">{conversation.totalTokens}</p>
            <p className="text-xs text-muted-foreground">消耗Tokens</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center w-10 h-10 bg-green-500/10 rounded-lg mx-auto mb-2">
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-foreground">{formatCost(conversation.totalCost)}</p>
            <p className="text-xs text-muted-foreground">总费用</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center w-10 h-10 bg-orange-500/10 rounded-lg mx-auto mb-2">
              <Clock className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-2xl font-bold text-foreground">{formatDuration(conversation.duration)}</p>
            <p className="text-xs text-muted-foreground">对话时长</p>
          </div>
        </div>
      </Card>

        {/* 对话消息 */}
        <Card className="flex-1 min-h-0">
          <div className="p-3 lg:p-4 border-b border-border">
            <h3 className="font-medium text-foreground">对话内容</h3>
          </div>
          <ScrollArea className="h-[50vh] lg:h-[60vh]">
            <div className="p-3 lg:p-4 space-y-3 lg:space-y-4">
            {conversation.messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex ${message.messageType === 'user_query' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start space-x-2 max-w-[85%] lg:max-w-[80%] ${
                  message.messageType === 'user_query' ? 'flex-row-reverse space-x-reverse' : ''
                }`}>
                  {/* 头像 */}
                  <div className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.messageType === 'user_query' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}>
                    {message.messageType === 'user_query' ? (
                      <User className="w-3 h-3 lg:w-4 lg:h-4" />
                    ) : (
                      <Bot className="w-3 h-3 lg:w-4 lg:h-4" />
                    )}
                  </div>
                  
                  {/* 消息内容 */}
                  <div className={`rounded-lg p-2 lg:p-3 ${
                    message.messageType === 'user_query'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}>
                    <MessageContent 
                      content={message.content}
                      sender={message.messageType === 'user_query' ? 'user' : 'ai'}
                      useTypewriter={false}
                    />
                    <div className="text-xs mt-2 opacity-70">
                      {formatTime(message.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* 使用统计详情 */}
      {conversation.usageStatistics && conversation.usageStatistics.length > 0 && (
        <Card className="mt-6">
          <div className="p-4 border-b border-border">
            <h3 className="font-medium text-foreground">使用统计</h3>
          </div>
          <div className="p-4">
            {conversation.usageStatistics.map((usage, index) => (
              <div key={usage.id} className="mb-4 last:mb-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2 lg:gap-3 text-xs lg:text-sm">
                  <div>
                    <span className="text-muted-foreground">输入Tokens:</span>
                    <span className="ml-2 font-medium">{usage.promptTokens}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">输出Tokens:</span>
                    <span className="ml-2 font-medium">{usage.completionTokens}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">总计:</span>
                    <span className="ml-2 font-medium">{usage.totalTokens}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">费用:</span>
                    <span className="ml-2 font-medium">{formatCost(usage.totalPrice)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">延迟:</span>
                    <span className="ml-2 font-medium">{formatLatency(usage.latency)}</span>
                  </div>
                </div>
                {index < conversation.usageStatistics.length - 1 && (
                  <Separator className="mt-3" />
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
      
      </div> {/* 结束滚动容器 */}
    </div>
  );
};