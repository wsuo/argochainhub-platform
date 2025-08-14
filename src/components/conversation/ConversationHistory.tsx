import { useState, useEffect, useCallback } from "react";
import { MessageSquare, Clock, Trash2, Eye, AlertCircle, Search, User, Bot, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
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
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // 加载对话列表
  const loadConversations = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const guestId = getOrCreateGuestId();
      const response = await ConversationService.searchConversations({
        page,
        limit: 20,
        search: debouncedSearchQuery.trim() || undefined, // 使用防抖后的搜索词
      }, guestId);

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
  const formatCost = (cost: number | string | null | undefined) => {
    // 确保 cost 是有效数字
    const numericCost = typeof cost === 'number' ? cost : parseFloat(String(cost || '0'));
    return (!isNaN(numericCost) && numericCost > 0) ? `$${numericCost.toFixed(4)}` : '免费';
  };

  // 防抖处理搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 800); // 800ms防抖延迟，适合中文输入

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 当防抖搜索词改变时，重新加载数据
  useEffect(() => {
    loadConversations(1); // 重置到第一页
  }, [debouncedSearchQuery]);

  // 组件挂载时加载数据
  useEffect(() => {
    loadConversations();
  }, []);

  if (loading && conversations.length === 0) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">加载对话历史中...</h3>
          <p className="text-gray-600">正在获取您的对话记录</p>
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
      <div className={`text-center py-16 ${className}`}>
        <div className="w-20 h-20 bg-gradient-to-r from-primary/10 to-agro-blue/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <MessageSquare className="w-10 h-10 text-primary" />
        </div>
        <h3 className="text-2xl font-semibold text-gray-900 mb-3">暂无对话记录</h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          开始与AI农药助手对话，您的历史记录将显示在这里。每次对话都会为您提供专业的农化建议。
        </p>
        <Button 
          onClick={() => window.location.href = '/ai-search'}
          className="bg-gradient-to-r from-primary to-agro-blue hover:from-primary-dark hover:to-agro-blue/90 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
        >
          开始AI咨询
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* 搜索栏 */}
      <div className="mb-6">
        <div className="max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="搜索对话记录..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/90 border-gray-300 hover:border-primary/60 focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
        
        {/* 搜索结果统计 */}
        {debouncedSearchQuery && (
          <div className="text-sm text-gray-600 mt-2">
            找到 {conversations.length} 条相关对话记录
          </div>
        )}
      </div>

      <ScrollArea className="h-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {conversations.map((conversation) => (
            <Card key={conversation.conversationId} className="group bg-white/80 backdrop-blur-sm border-white/30 hover:border-primary/30 hover:bg-white/90 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
              <div className="space-y-4">
                {/* 对话头部信息 */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 group-hover:text-primary transition-colors truncate">
                        {conversation.title || '农化咨询'}
                      </h4>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatTime(conversation.createdAt)}
                      </div>
                    </div>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      conversation.totalCost && parseFloat(String(conversation.totalCost)) > 0 
                        ? 'border-amber-200 text-amber-700 bg-amber-50'
                        : 'border-emerald-200 text-emerald-700 bg-emerald-50'
                    }`}
                  >
                    {formatCost(conversation.totalCost)}
                  </Badge>
                </div>

                {/* 对话预览 */}
                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <User className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed">
                      {conversation.userQuery}
                    </p>
                  </div>
                </div>

                {/* 统计信息 */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span className="flex items-center">
                      <MessageSquare className="w-3 h-3 mr-1" />
                      {conversation.totalMessages}
                    </span>
                    <span className="flex items-center">
                      <Zap className="w-3 h-3 mr-1" />
                      {conversation.totalTokens}
                    </span>
                  </div>
                  
                  {/* 操作按钮 */}
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary hover:text-primary/80 hover:bg-primary/10 h-8 px-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewConversation?.(conversation.conversationId);
                      }}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      查看
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 px-3"
                      disabled={deletingId === conversation.conversationId}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConversation(conversation.conversationId);
                      }}
                    >
                      {deletingId === conversation.conversationId ? (
                        <div className="w-3 h-3 border border-red-300 border-t-red-500 rounded-full animate-spin mr-1" />
                      ) : (
                        <Trash2 className="w-3 h-3 mr-1" />
                      )}
                      删除
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* 分页控制 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-8 pb-6">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1 || loading}
              onClick={() => loadConversations(currentPage - 1)}
              className="bg-white/60 border-white/30 hover:bg-white/80"
            >
              上一页
            </Button>
            <div className="flex items-center space-x-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => loadConversations(page)}
                    className={currentPage === page 
                      ? "bg-gradient-to-r from-primary to-agro-blue text-white" 
                      : "bg-white/60 border-white/30 hover:bg-white/80"
                    }
                  >
                    {page}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages || loading}
              onClick={() => loadConversations(currentPage + 1)}
              className="bg-white/60 border-white/30 hover:bg-white/80"
            >
              下一页
            </Button>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};