import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { Search, Sparkles, Bot, History, BookOpen, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AISearchService, WorkflowStatus, DifyStreamEvent } from '@/services/aiSearchService';
import { WorkflowProgress } from '@/components/chat/WorkflowProgress';
import { MessageContent } from '@/components/chat/MessageContent';
import { useTypewriterEffect, throttle } from '@/hooks/useTypewriterEffect';
import { conversationManager } from '@/managers/ConversationManager';
import { useQueryErrorHandler } from '@/hooks/useErrorHandler';
import { PopularQueriesService } from '@/services/popularQueriesService';
import { PopularQuestionCard } from '@/types/popularQueries';

// Search result interface
interface SearchResult {
  id: string;
  title: string;
  content: string;
  confidence: number;
  tags: string[];
}

// Message interface
interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isStreaming?: boolean;
}

// Conversation interface
interface ConversationItem {
  id: string;
  userQuery: string;
  aiResponse: string;
  timestamp: Date;
  isComplete: boolean;
}

const AISearchPage = () => {
  const { t } = useTranslation();
  
  // Basic search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ query: string; results: SearchResult[] } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // AI streaming states
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus>({
    isRunning: false,
    completedNodes: []
  });
  const [streamingContent, setStreamingContent] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [aiResponseComplete, setAiResponseComplete] = useState(false); // AI响应完全完成状态
  
  // 连续对话状态
  const [conversationHistory, setConversationHistory] = useState<ConversationItem[]>([]);
  const [showContinueSearch, setShowContinueSearch] = useState(false);
  const [nextSearchQuery, setNextSearchQuery] = useState('');
  
  // Refs for performance optimization
  const streamingContentRef = useRef<string>('');
  const continueLoadingRef = useRef<HTMLDivElement>(null); // 继续提问时的加载区域引用
  
  // Error handling
  const errorHandler = useQueryErrorHandler({
    module: 'ai-search',
    action: 'query',
    resourceType: 'pesticide-assistant'
  });

  // 获取热门问题数据
  const { data: popularQuestions = [], isLoading: isLoadingPopular, error: popularError } = useQuery({
    queryKey: ['popular-questions'],
    queryFn: () => PopularQueriesService.getPopularQuestionCards(4),
    staleTime: 5 * 60 * 1000, // 5分钟缓存
    retry: 1, // 失败时重试1次
  });

  // Enhanced throttled streaming content update with typewriter effect support
  const [isStreamingComplete, setIsStreamingComplete] = useState(false);
  const lastUpdateTime = useRef(0);
  const lastContentLength = useRef(0);
  const pendingUpdateRef = useRef<NodeJS.Timeout | null>(null);

  const throttledContentUpdate = useCallback((content: string, isStreaming: boolean = true) => {
    const now = Date.now();
    const contentLength = content.length;

    // 动态调整节流时间以优化打字机效果
    let throttleTime = 150; // 基础节流时间，适中的速度

    // 如果内容长度大幅增加，使用更长的节流时间
    if (contentLength > lastContentLength.current + 100) {
      throttleTime = 250;
    } else if (contentLength > 500) {
      throttleTime = 200;
    }

    // 清除之前的延迟更新
    if (pendingUpdateRef.current) {
      clearTimeout(pendingUpdateRef.current);
      pendingUpdateRef.current = null;
    }

    if (now - lastUpdateTime.current > throttleTime) {
      setStreamingContent(content);
      setIsStreamingComplete(!isStreaming);
      lastUpdateTime.current = now;
      lastContentLength.current = contentLength;
    } else {
      // 如果流式传输结束，确保最后的内容被更新
      if (!isStreaming) {
        setStreamingContent(content);
        setIsStreamingComplete(true);
        lastUpdateTime.current = now;
        lastContentLength.current = contentLength;
      } else {
        // 设置延迟更新，确保内容不会丢失
        const remainingTime = throttleTime - (now - lastUpdateTime.current);
        pendingUpdateRef.current = setTimeout(() => {
          setStreamingContent(content);
          setIsStreamingComplete(!isStreaming);
          lastUpdateTime.current = Date.now();
          lastContentLength.current = contentLength;
          pendingUpdateRef.current = null;
        }, remainingTime);
      }
    }
  }, []);

  // 移除自动滚动，让用户自然浏览内容
  // 原有的自动滚动逻辑已删除，避免页面抖动

  // 滚动到继续提问的加载区域
  const scrollToContinueLoading = useCallback(() => {
    if (continueLoadingRef.current) {
      continueLoadingRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center', // 滚动到屏幕中间
        inline: 'nearest'
      });
    }
  }, []);

  // Workflow status update handler
  const updateWorkflowStatus = useCallback((event: DifyStreamEvent) => {
    if (event.event === 'workflow_started') {
      setWorkflowStatus(prev => ({
        ...prev,
        isRunning: true,
        currentNode: {
          title: "工作流已启动",
          nodeType: "workflow",
          index: 0
        }
      }));
    } else if (event.event === 'node_started') {
      const nodeData = (event as any).data;
      setWorkflowStatus(prev => ({
        ...prev,
        completedNodes: prev.currentNode 
          ? [...prev.completedNodes, prev.currentNode]
          : prev.completedNodes,
        currentNode: {
          title: nodeData.title,
          nodeType: nodeData.node_type,
          index: nodeData.index
        }
      }));
    } else if (event.event === 'workflow_finished') {
      setWorkflowStatus(prev => ({
        ...prev,
        isRunning: false,
        completedNodes: prev.currentNode
          ? [...prev.completedNodes, prev.currentNode]
          : prev.completedNodes,
        currentNode: undefined
      }));
    }
  }, []);

  // Error handling helper
  const handleSearchError = useCallback((error: any, tempConversationId: string) => {
    console.error('AI搜索错误:', error);
    setError(error.message || '搜索时出现错误，请重试');
    setIsSearching(false);
    setWorkflowStatus({ isRunning: false, completedNodes: [] });
    
    // 清理流式内容状态
    setStreamingContent('');
    setIsStreamingComplete(false);
    setAiResponseComplete(false); // 重置AI响应完成状态
    streamingContentRef.current = '';
    
    conversationManager.clearConversation(tempConversationId);
    errorHandler.handleError(error);
  }, [errorHandler]);

  // Content parsing functions
  const extractTitle = (firstLine: string): string | null => {
    const titlePatterns = [
      /^#+\s*(.+)$/,           // markdown标题
      /^\*\*(.+)\*\*$/,        // 粗体标题
      /^(.{1,50})[：:]\s*$/,    // 冒号结尾的标题
    ];
    
    for (const pattern of titlePatterns) {
      const match = firstLine.match(pattern);
      if (match) return match[1].trim();
    }
    
    return firstLine.length <= 50 ? firstLine : null;
  };

  const calculateConfidence = (content: string): number => {
    let confidence = 0.7; // 基础可信度
    
    if (content.length > 200) confidence += 0.1;
    if (content.includes('推荐') || content.includes('建议')) confidence += 0.1;
    if (content.includes('%') || content.includes('倍液')) confidence += 0.1;
    
    return Math.min(confidence, 0.99);
  };

  const extractTags = (content: string): string[] => {
    const commonTags = [
      '杀菌剂', '除草剂', '杀虫剂', '农药', '防治', '病害', '虫害',
      '水稻', '小麦', '玉米', '蔬菜', '果树'
    ];
    
    return commonTags.filter(tag => content.includes(tag));
  };

  const parseStreamingContentToResults = useCallback((content: string): SearchResult[] => {
    if (!content.trim()) {
      return [{
        id: '1',
        title: '搜索结果',
        content: '抱歉，未能获取到有效的搜索结果，请重试。',
        confidence: 0.5,
        tags: ['重试']
      }];
    }

    // 智能解析AI响应内容
    const sections = content.split(/\n\n+/).filter(s => s.trim().length > 0);
    
    return sections.map((section, index) => {
      const lines = section.trim().split('\n');
      const title = extractTitle(lines[0]) || `解答 ${index + 1}`;
      const sectionContent = lines.slice(title !== lines[0] ? 0 : 1).join('\n');
      
      return {
        id: (index + 1).toString(),
        title,
        content: sectionContent,
        confidence: calculateConfidence(sectionContent),
        tags: extractTags(sectionContent)
      };
    });
  }, []);

  const handleSearch = async (query: string, isNewConversation: boolean = false) => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    setSearchQuery(query);
    setSearchResults(null);
    setError(null);
    
    // 清理当前对话状态，准备新的流式内容
    setStreamingContent('');
    setIsStreamingComplete(false);
    setAiResponseComplete(false);
    streamingContentRef.current = '';
    
    // 如果是继续对话，隐藏继续提问选项
    if (!isNewConversation) {
      setShowContinueSearch(false);
      // 延迟滚动，确保加载组件已渲染
      setTimeout(() => {
        scrollToContinueLoading();
      }, 100);
    }
    
    // 立即显示工作流状态
    setWorkflowStatus({
      isRunning: true,
      completedNodes: [],
      currentNode: {
        title: "正在分析您的问题...",
        nodeType: "start",
        index: 0
      }
    });

    // 判断是否使用现有对话ID还是生成新的
    let currentConversationId = conversationId;
    if (isNewConversation || !currentConversationId) {
      currentConversationId = crypto.randomUUID();
      setConversationId(currentConversationId);
    }
    
    // 开始对话管理
    conversationManager.startConversation({
      conversation_id: currentConversationId,
      query,
      inputs: {},
      user: AISearchService.getUserId()
    });

    try {
      await AISearchService.sendMessage(
        query,
        // onChunk - 处理流式响应
        (chunk) => {
          if (chunk.event === 'message' && chunk.answer) {
            streamingContentRef.current += chunk.answer;
            // 实时更新流式内容以显示打字机效果
            throttledContentUpdate(streamingContentRef.current, true);
          }
        },
        // onError - 处理错误
        (error) => {
          handleSearchError(error, currentConversationId);
        },
        // onComplete - 完成回调
        async () => {
          setIsSearching(false);
          setWorkflowStatus({ isRunning: false, completedNodes: [] });
          
          // 确保最后的流式内容更新完成
          throttledContentUpdate(streamingContentRef.current, false);
          
          // 标记AI响应完成
          setAiResponseComplete(true);
          
          // 立即添加到历史记录，避免布局抖动
          const newConversationItem: ConversationItem = {
            id: crypto.randomUUID(),
            userQuery: query,
            aiResponse: streamingContentRef.current,
            timestamp: new Date(),
            isComplete: true
          };
          setConversationHistory(prev => [...prev, newConversationItem]);
          
          // 清理当前对话显示状态
          setStreamingContent('');
          setAiResponseComplete(false);
          setIsStreamingComplete(false);
          streamingContentRef.current = '';
          
          // 显示继续提问选项
          setShowContinueSearch(true);
          
          // 保存对话记录
          await conversationManager.finishConversation(currentConversationId);
        },
        // onWorkflowEvent - 处理工作流事件
        (event) => {
          conversationManager.onStreamMessage(currentConversationId, event);
          updateWorkflowStatus(event);
        }
      );
    } catch (error) {
      handleSearchError(error, currentConversationId);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchQuery, true); // 第一次搜索总是新对话
  };

  const handleContinueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nextSearchQuery.trim()) return;
    handleSearch(nextSearchQuery, false); // 继续对话，使用现有对话ID
    setNextSearchQuery(''); // 清空继续提问的输入框
  };

  return (
    <Layout userType="buyer">
      <div className="max-w-4xl mx-auto space-y-16 pt-16">
        {/* 头部标题区域 */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-primary to-agro-blue rounded-3xl mb-8 shadow-2xl shadow-primary/20">
            <Sparkles className="w-10 h-10 text-white animate-pulse" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-primary to-agro-blue bg-clip-text text-transparent mb-4 leading-tight">
            AI农药助手
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            专业农化知识智能问答，提供准确的植保咨询服务
          </p>
        </div>

        {/* 主搜索区域 - 只在没有对话历史时显示 */}
        {!conversationHistory.length && !streamingContent && (
          <div>
            <form onSubmit={handleSubmit}>
              {/* 搜索框容器 */}
              <div className="relative max-w-3xl mx-auto">
                <div className="relative flex items-center">
                  <div className="absolute left-6 top-1/2 transform -translate-y-1/2 z-10">
                    {isSearching ? (
                      <div className="animate-spin">
                        <Sparkles className="w-5 h-5 text-primary" />
                      </div>
                    ) : (
                      <Search className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="描述您的农化问题，例如：玉米叶片黄斑、病害防治..."
                    className="w-full pl-14 pr-32 py-4 text-lg bg-white/90 backdrop-blur-sm border-2 border-gray-200/50 hover:border-primary/30 focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/10 rounded-2xl transition-all duration-300 placeholder:text-gray-400 shadow-lg shadow-gray-200/30"
                    disabled={isSearching}
                  />
                  
                  {/* 内联的AI搜索按钮 */}
                  <Button
                    type="submit"
                    disabled={!searchQuery.trim() || isSearching}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-primary to-agro-blue hover:from-primary-dark hover:to-agro-blue/90 text-white px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSearching ? (
                      <>
                        <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                        分析中
                      </>
                    ) : (
                      <>
                        <Bot className="w-4 h-4 mr-2" />
                        AI搜索
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* 热门问题 */}
        {!conversationHistory.length && !isSearching && !streamingContent && (
          <div>
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                热门咨询问题
              </h3>
              <p className="text-gray-600 text-sm">点击快速开始咨询</p>
              {popularError && (
                <p className="text-red-500 text-xs mt-1">
                  获取热门问题失败，显示默认问题
                </p>
              )}
            </div>
            
            {isLoadingPopular ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((index) => (
                  <div key={index} className="animate-pulse bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl p-4 shadow-lg">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {popularQuestions.map((item, index) => (
                  <div
                    key={item.id}
                    className="group cursor-pointer bg-white/60 backdrop-blur-sm border border-white/20 hover:border-primary/30 hover:bg-white/80 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300"
                    onClick={() => {
                      setSearchQuery(item.query);
                      handleSearch(item.query, true);
                    }}
                  >
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900 group-hover:text-primary transition-colors text-sm leading-tight">
                        {item.text}
                      </h4>
                      <p className="text-gray-600 text-xs leading-relaxed line-clamp-2">
                        {item.query}
                      </p>
                      {item.count > 0 && (
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-xs text-emerald-600 font-medium">
                            {item.count}次咨询
                          </span>
                          {item.percentage > 0 && (
                            <span className="text-xs text-gray-500">
                              {item.percentage.toFixed(1)}%
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 首次搜索的加载动画 - 只在没有对话历史时显示 */}
        {isSearching && conversationHistory.length === 0 && (
          <div className="text-center py-20">
            {/* 工作流进度显示 */}
            <WorkflowProgress 
              status={workflowStatus}
              className="max-w-md mx-auto mb-8"
            />
            
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-primary to-agro-blue rounded-3xl mb-8 animate-pulse shadow-2xl shadow-primary/30">
              <Sparkles className="w-10 h-10 text-white animate-spin" />
            </div>
            <h3 className="text-3xl font-bold text-gray-800 mb-4">AI正在思考中...</h3>
            <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">正在分析您的问题，为您提供最专业的建议</p>
            
            {/* 加载动画效果 */}
            <div className="flex justify-center space-x-3">
              <div className="w-4 h-4 bg-primary rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
              <div className="w-4 h-4 bg-agro-blue rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
              <div className="w-4 h-4 bg-amber-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
            </div>
          </div>
        )}
        
        {/* 对话历史显示 - 只显示已完成的对话 */}
        {conversationHistory.length > 0 && (
          <div className="space-y-6">
            {conversationHistory.map((conversation, index) => (
              <div key={conversation.id} className="space-y-4">
                {/* 用户问题 */}
                <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-primary/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <span className="text-primary font-semibold text-sm">Q{index + 1}</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900 font-medium">{conversation.userQuery}</p>
                      <p className="text-gray-500 text-sm mt-1">
                        {conversation.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* AI回答 */}
                <div className="bg-emerald-50/60 backdrop-blur-sm border border-emerald-100/50 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-emerald-500/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <Bot className="w-4 h-4 text-emerald-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <MessageContent 
                        content={conversation.aiResponse}
                        isStreaming={false}
                        sender="ai"
                        useTypewriter={false}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 当前对话显示 - 只在AI正在回答时显示 */}
        {isSearching && streamingContent ? (
          <div className="space-y-4">
            {/* 最新的用户问题 */}
            <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-lg">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-primary/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <span className="text-primary font-semibold text-sm">Q{conversationHistory.length + 1}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 font-medium">{searchQuery}</p>
                  <p className="text-gray-500 text-sm mt-1">
                    {new Date().toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
            
            {/* AI回答 */}
            <div className="bg-emerald-50/60 backdrop-blur-sm border border-emerald-100/50 rounded-2xl p-6 shadow-lg">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-emerald-500/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-emerald-600" />
                  </div>
                </div>
                <div className="flex-1">
                  {isSearching && (
                    <div className="flex items-center space-x-2 mb-3">
                      <span className="text-sm text-emerald-600 font-medium">AI正在思考中</span>
                      <div className="animate-spin">
                        <Sparkles className="w-4 h-4 text-emerald-500" />
                      </div>
                    </div>
                  )}
                  <MessageContent 
                    content={streamingContent}
                    isStreaming={!isStreamingComplete}
                    sender="ai"
                    useTypewriter={isSearching}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* 继续提问区域 */}
        {showContinueSearch && !isSearching && (
          <div className="mt-8">
            <form onSubmit={handleContinueSubmit}>
              <div className="relative max-w-3xl mx-auto">
                <div className="relative flex items-center">
                  <div className="absolute left-6 top-1/2 transform -translate-y-1/2 z-10">
                    <Search className="w-5 h-5 text-gray-400" />
                  </div>
                  
                  <input
                    type="text"
                    value={nextSearchQuery}
                    onChange={(e) => setNextSearchQuery(e.target.value)}
                    placeholder="继续提问..."
                    className="w-full pl-14 pr-32 py-4 text-lg bg-white/60 backdrop-blur-sm border border-white/30 hover:border-primary/30 focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/10 rounded-2xl transition-all duration-300 placeholder:text-gray-400 shadow-lg"
                  />
                  
                  <Button
                    type="submit"
                    disabled={!nextSearchQuery.trim()}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-primary to-agro-blue hover:from-primary-dark hover:to-agro-blue/90 text-white px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Bot className="w-4 h-4 mr-2" />
                    提问
                  </Button>
                </div>
              </div>
            </form>
            
            {/* 结束对话按钮 */}
            <div className="text-center mt-6">
              <Button
                onClick={() => {
                  // 重置所有状态，开始新对话
                  setConversationHistory([]);
                  setShowContinueSearch(false);
                  setStreamingContent('');
                  setAiResponseComplete(false);
                  setIsStreamingComplete(false);
                  streamingContentRef.current = '';
                  setSearchQuery('');
                  setNextSearchQuery('');
                  setConversationId(null);
                  setError(null);
                  setWorkflowStatus({ isRunning: false, completedNodes: [] });
                }}
                variant="outline"
                className="text-gray-600 hover:text-gray-800 border-gray-300 hover:border-gray-400 bg-white/60 backdrop-blur-sm"
              >
                开始新话题
              </Button>
            </div>
          </div>
        )}

        {/* 继续提问时的加载动画 - 只在有对话历史且正在搜索时显示 */}
        {isSearching && conversationHistory.length > 0 && (
          <div ref={continueLoadingRef} className="mt-8 text-center py-12">
            {/* 工作流进度显示 */}
            <WorkflowProgress 
              status={workflowStatus}
              className="max-w-md mx-auto mb-6"
            />
            
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary to-agro-blue rounded-2xl mb-6 animate-pulse shadow-xl shadow-primary/20">
              <Sparkles className="w-8 h-8 text-white animate-spin" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">AI正在思考中...</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">正在为您的追问生成专业回答</p>
            
            {/* 加载动画效果 */}
            <div className="flex justify-center space-x-3">
              <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
              <div className="w-3 h-3 bg-agro-blue rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
              <div className="w-3 h-3 bg-amber-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
            </div>
          </div>
        )}

        {/* 错误状态显示 */}
        {error && !isSearching && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl mb-6 shadow-xl shadow-red-500/20">
              <Search className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-3xl font-bold text-gray-800 mb-4">搜索遇到问题</h3>
            <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">{error}</p>
            <Button
              onClick={() => {
                setError(null);
                if (searchQuery) {
                  handleSearch(searchQuery);
                }
              }}
              className="bg-gradient-to-r from-primary to-agro-blue hover:from-primary-dark hover:to-agro-blue/90 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-200"
            >
              重试搜索
            </Button>
          </div>
        )}

      </div>
    </Layout>
  );
};

export default AISearchPage;