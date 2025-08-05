import { useState, useEffect } from "react";
import { MessageSquare, Clock, Trash2, Eye, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTranslation } from "react-i18next";
import { ConversationService, ConversationSummary } from "@/services/conversationService";
import { getOrCreateGuestId } from "@/utils/guestId";

interface ConversationHistoryProps {
  onViewConversation?: (conversationId: string) => void;
  className?: string;
}

export const ConversationHistory = ({ onViewConversation, className }: ConversationHistoryProps) => {
  const { t } = useTranslation();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // 加载对话列表
  const loadConversations = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const guestId = getOrCreateGuestId();
      const response = await ConversationService.getGuestConversations(guestId, {
        page,
        limit: 20
      });

      if (response.success) {
        setConversations(response.data);
        if (response.meta) {
          setTotalPages(response.meta.totalPages);
          setCurrentPage(response.meta.currentPage);
        }
      } else {
        setError(response.message || '加载对话历史失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载对话历史时出现错误');
    } finally {
      setLoading(false);
    }
  };

  // 删除对话
  const handleDeleteConversation = async (conversationId: string) => {
    if (!confirm('确定要删除这条对话记录吗？此操作不可撤销。')) {
      return;
    }

    try {
      setDeletingId(conversationId);
      const guestId = getOrCreateGuestId();
      const response = await ConversationService.deleteConversation(conversationId, guestId);

      if (response.success) {
        // 删除成功，重新加载列表
        await loadConversations(currentPage);
      } else {
        setError(response.message || '删除对话失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除对话时出现错误');
    } finally {
      setDeletingId(null);
    }
  };

  // 格式化时间
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return '刚刚';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}小时前`;
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)}天前`;
    } else {
      return date.toLocaleDateString('zh-CN');
    }
  };

  // 格式化费用
  const formatCost = (cost: number) => {
    return cost > 0 ? `$${cost.toFixed(4)}` : '免费';
  };

  // 组件挂载时加载数据
  useEffect(() => {
    loadConversations();
  }, []);

  if (loading && conversations.length === 0) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-muted-foreground">加载对话历史中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-2" 
              onClick={() => loadConversations(currentPage)}
            >
              重试
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <MessageSquare className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">暂无对话记录</h3>
        <p className="text-muted-foreground">开始与AI助手对话，您的历史记录将显示在这里</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <ScrollArea className="h-full">
        <div className="space-y-3">
          {conversations.map((conversation) => (
            <Card key={conversation.conversationId} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {/* 标题和时间 */}
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-foreground truncate pr-2">
                      {conversation.title || conversation.userQuery}
                    </h4>
                    <div className="flex items-center text-xs text-muted-foreground whitespace-nowrap">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatTime(conversation.createdAt)}
                    </div>
                  </div>

                  {/* 用户查询预览 */}
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {conversation.userQuery}
                  </p>

                  {/* 统计信息 */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                    <span className="flex items-center">
                      <MessageSquare className="w-3 h-3 mr-1" />
                      {conversation.totalMessages} 条消息
                    </span>
                    <span>{conversation.totalTokens} tokens</span>
                    <Badge variant="outline" className="text-xs">
                      {formatCost(conversation.totalCost)}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary hover:text-primary/80"
                  onClick={() => onViewConversation?.(conversation.conversationId)}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  查看详情
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive/80"
                  disabled={deletingId === conversation.conversationId}
                  onClick={() => handleDeleteConversation(conversation.conversationId)}
                >
                  {deletingId === conversation.conversationId ? (
                    <div className="w-4 h-4 border-2 border-destructive/30 border-t-destructive rounded-full animate-spin mr-1" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-1" />
                  )}
                  删除
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* 分页控制 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6 pb-4">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1 || loading}
              onClick={() => loadConversations(currentPage - 1)}
            >
              上一页
            </Button>
            <span className="text-sm text-muted-foreground">
              第 {currentPage} 页，共 {totalPages} 页
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages || loading}
              onClick={() => loadConversations(currentPage + 1)}
            >
              下一页
            </Button>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};