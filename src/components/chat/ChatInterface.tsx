import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Sparkles, Bot, User, MinusCircle, ChevronDown, ChevronUp, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { AISearchService, WorkflowStatus, DifyStreamEvent } from "@/services/aiSearchService";
import { useTypewriterEffect, throttle } from "@/hooks/useTypewriterEffect";
import { MessageContent } from "@/components/chat/MessageContent";
import { WorkflowProgress } from "@/components/chat/WorkflowProgress";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isStreaming?: boolean;
  showBubble?: boolean; // 控制是否显示气泡内容
}

interface ChatInterfaceProps {
  onToggle?: (isActive: boolean) => void;
}

export const ChatInterface = ({ onToggle }: ChatInterfaceProps) => {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const [hasConversationHistory, setHasConversationHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus>({
    isRunning: false,
    completedNodes: []
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const currentAssistantMessageRef = useRef<string>('');
  const currentMessageIdRef = useRef<string>('');
  const streamingContentRef = useRef<string>('');

  // 节流更新消息内容
  const throttledUpdateMessage = useCallback((messageId: string, content: string, isStreaming: boolean = false) => {
    setMessages(prev => {
      const newMessages = prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, content, isStreaming }
          : msg
      );
      return newMessages;
    });
  }, []);

  // 使用ref来实现节流 - 优化节流时间，配合新的打字机效果
  const lastUpdateTime = useRef(0);
  const lastContentLength = useRef(0);
  const pendingUpdateRef = useRef<NodeJS.Timeout | null>(null);

  const throttledUpdate = useCallback((messageId: string, content: string, isStreaming: boolean = false) => {
    const now = Date.now();
    const contentLength = content.length;

    // 动态调整节流时间
    let throttleTime = 200; // 基础节流时间

    // 如果内容长度大幅增加，使用更长的节流时间
    if (contentLength > lastContentLength.current + 100) {
      throttleTime = 400;
    } else if (contentLength > 500) {
      throttleTime = 300;
    }

    // 清除之前的延迟更新
    if (pendingUpdateRef.current) {
      clearTimeout(pendingUpdateRef.current);
      pendingUpdateRef.current = null;
    }

    if (now - lastUpdateTime.current > throttleTime) {
      throttledUpdateMessage(messageId, content, isStreaming);
      lastUpdateTime.current = now;
      lastContentLength.current = contentLength;
    } else {
      // 如果流式传输结束，确保最后的内容被更新
      if (!isStreaming) {
        throttledUpdateMessage(messageId, content, isStreaming);
        lastUpdateTime.current = now;
        lastContentLength.current = contentLength;
      } else {
        // 设置延迟更新，确保内容不会丢失
        const remainingTime = throttleTime - (now - lastUpdateTime.current);
        pendingUpdateRef.current = setTimeout(() => {
          throttledUpdateMessage(messageId, content, isStreaming);
          lastUpdateTime.current = Date.now();
          lastContentLength.current = contentLength;
          pendingUpdateRef.current = null;
        }, remainingTime);
      }
    }
  }, [throttledUpdateMessage]);

  // 示例查询
  const exampleQueries = [
    "推荐用于番茄晚疫病的杀菌剂",
    "查询草铵膦在欧盟的登记状况",
    "有什么有效成分可以防治玉米螟？",
    "寻找环保型除草剂供应商",
    "小麦锈病的防治方案有哪些？",
    "吡虫啉的作用机理是什么？"
  ];



  // 折叠聊天界面
  const handleCollapse = () => {
    setIsExpanded(false);
    onToggle?.(false);
    // 不清空messages，保持对话历史用于显示"查看对话"按钮
    // setMessages([]);
    setQuery("");
    setError(null);
    // 保持工作流状态，以便在重新展开时显示
    // setWorkflowStatus({ isRunning: false, completedNodes: [] });
    // AISearchService.resetConversation();
  };

  // 发送消息
  const handleSubmit = async () => {
    if (!query.trim() || isLoading) return;

    // 首次发送消息时展开聊天界面
    if (!isExpanded) {
      setIsExpanded(true);
      onToggle?.(true);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: query.trim(),
      sender: 'user',
      timestamp: new Date(),
      showBubble: true // 用户消息默认显示气泡
    };

    setMessages(prev => [...prev, userMessage]);
    setHasConversationHistory(true); // 标记有对话历史
    const currentQuery = query.trim();
    setQuery("");
    setIsLoading(true);
    setError(null);
    streamingContentRef.current = ''; // 重置流式内容
    
    // 立即显示工作流状态 - 用户提问后立即展示
    setWorkflowStatus({ 
      isRunning: true, 
      completedNodes: [],
      currentNode: {
        title: "准备处理查询...",
        nodeType: "start",
        index: 0
      }
    });

    // 立即创建助手消息占位符 - 先不显示气泡，只显示工作流
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      content: '',
      sender: 'ai',
      timestamp: new Date(),
      isStreaming: true,
      showBubble: false // 先不显示气泡
    };

    setMessages(prev => [...prev, assistantMessage]);
    currentMessageIdRef.current = assistantMessageId;

    try {
      await AISearchService.sendMessage(
        currentQuery,
        // onChunk - 处理流式响应
        (chunk) => {
          if (chunk.event === 'message' && chunk.answer) {
            // 如果是首次收到内容，启用气泡显示
            if (streamingContentRef.current === '') {
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === currentMessageIdRef.current
                    ? { ...msg, showBubble: true }
                    : msg
                )
              );
            }
            
            // 累积内容
            const previousLength = streamingContentRef.current.length;
            streamingContentRef.current += chunk.answer;
            
            // 使用节流更新UI
            throttledUpdate(
              currentMessageIdRef.current, 
              streamingContentRef.current,
              true
            );
          }
        },
        // onError - 处理错误
        (error) => {
          console.error('AI搜索流式传输错误:', error);
          setError(error.message || '发送消息时出现错误');
          setIsLoading(false);
          setWorkflowStatus({ isRunning: false, completedNodes: [] });

          // 更新助手消息为错误提示
          setMessages(prev =>
            prev.map(msg =>
              msg.id === currentMessageIdRef.current
                ? { ...msg, content: '抱歉，发生了错误，请稍后重试。', isStreaming: false, showBubble: true }
                : msg
            )
          );
        },
        // onComplete - 完成回调
        () => {
          setIsLoading(false);
          
          // 清理工作流状态
          setWorkflowStatus({
            isRunning: false, 
            completedNodes: []
          });
          
          // 标记流式传输完成 - 确保内容稳定后再停止流式状态
          setTimeout(() => {
            setMessages(prev =>
              prev.map(msg =>
                msg.id === currentMessageIdRef.current
                  ? { ...msg, isStreaming: false, showBubble: true }
                  : msg
              )
            );
          }, 100); // 短暂延迟，确保最后的内容更新完成
        },
        // onWorkflowEvent - 处理工作流事件
        (event: DifyStreamEvent) => {
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
            const nodeData = event.data;
            setWorkflowStatus(prev => ({
              ...prev,
              isRunning: true,
              // 将之前的当前节点添加到已完成列表（如果存在且不是初始节点）
              completedNodes: prev.currentNode && prev.currentNode.title !== "准备处理查询..." && prev.currentNode.title !== "工作流已启动"
                ? [...prev.completedNodes, prev.currentNode]
                : prev.completedNodes,
              currentNode: {
                title: nodeData.title,
                nodeType: nodeData.node_type,
                index: nodeData.index
              }
            }));
          }
        }
      );
    } catch (error) {
      console.error('AI搜索错误:', error);
      setError(error instanceof Error ? error.message : '发送消息时出现错误');
      setIsLoading(false);
      setWorkflowStatus({ isRunning: false, completedNodes: [] });

      // 更新助手消息为错误提示
      setMessages(prev =>
        prev.map(msg =>
          msg.id === currentMessageIdRef.current
            ? { ...msg, content: '抱歉，发生了错误，请稍后重试。', isStreaming: false, showBubble: true }
            : msg
        )
      );
    }
  };

  // 自动滚动到底部的函数
  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, []);

  // 立即定位到底部的函数（无动画）
  const scrollToBottomInstantly = useCallback(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        // 临时禁用滚动动画
        const originalScrollBehavior = scrollContainer.style.scrollBehavior;
        scrollContainer.style.scrollBehavior = 'auto';
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
        // 恢复原来的滚动行为
        setTimeout(() => {
          scrollContainer.style.scrollBehavior = originalScrollBehavior;
        }, 0);
      }
    }
  }, []);

  // 自动滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // 当展开聊天时立即定位到底部（无滚动动画）
  useEffect(() => {
    if (isExpanded) {
      // 使用 requestAnimationFrame 确保DOM完全渲染后再定位
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollToBottomInstantly();
        });
      });
    }
  }, [isExpanded, scrollToBottomInstantly]);

  if (isExpanded) {
    // 展开的聊天界面
    return (
      <div className="h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-agro-blue rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">AI农药智能查询</h3>
              <p className="text-sm text-muted-foreground">基于专业农药知识库的智能问答</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCollapse}
            className="text-muted-foreground hover:text-foreground"
          >
            <MinusCircle className="w-4 h-4" />
          </Button>
        </div>

        {/* Messages */}
        <ScrollArea 
          ref={scrollAreaRef} 
          className="flex-1 p-4"
          style={{ scrollBehavior: 'auto' }}
        >
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-agro-blue/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bot className="w-8 h-8 text-primary" />
                </div>
                <h4 className="text-lg font-medium text-foreground mb-2">AI助手已就绪</h4>
                <p className="text-muted-foreground mb-6">请输入您的农药相关问题，我会为您提供专业解答</p>
                
                {/* 示例查询 */}
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">常用查询示例：</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {exampleQueries.map((example, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="text-xs h-8 border-primary/30 hover:bg-primary/10"
                        onClick={() => setQuery(example)}
                      >
                        {example}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}


            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start space-x-2 max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    message.sender === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}>
                    {message.sender === 'user' ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex flex-col space-y-2">
                    {/* 如果是AI消息，只在执行过程中显示工作流 */}
                    {message.sender === 'ai' && message.isStreaming && message.id === currentMessageIdRef.current && workflowStatus.isRunning && (
                      <WorkflowProgress 
                        status={workflowStatus} 
                        className="max-w-full"
                      />
                    )}
                    {/* 只有当showBubble为true时才显示气泡内容 */}
                    {(message.sender === 'user' || message.showBubble !== false) && (
                      <div className={`rounded-lg p-3 ${
                        message.sender === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}>
                        <MessageContent 
                          content={message.content}
                          isStreaming={message.isStreaming}
                          sender={message.sender}
                          useTypewriter={message.isStreaming && message.sender === 'ai'}
                        />
                        <div className={`text-xs mt-1 opacity-70`}>
                          {message.timestamp.toLocaleTimeString('zh-CN', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* 仅在没有消息或消息为空时显示当前工作流 */}
            {workflowStatus.isRunning && messages.length === 0 && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-2 max-w-[80%]">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col space-y-2">
                    <WorkflowProgress 
                      status={workflowStatus} 
                      className="max-w-full"
                    />
                  </div>
                </div>
              </div>
            )}

          </div>
        </ScrollArea>

        {/* Error Message */}
        {error && (
          <div className="px-4 py-2 bg-red-50 border-t border-red-200">
            <div className="text-red-700 text-sm">
              ❌ {error}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-border">
          <div className="flex space-x-2">
            <Textarea
              ref={textareaRef}
              placeholder="请输入您的问题..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-h-[44px] resize-none border-primary/30 focus:border-primary"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            <Button 
              onClick={handleSubmit}
              disabled={!query.trim() || isLoading}
              className="bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            按Enter发送，Shift+Enter换行
          </div>
        </div>
      </div>
    );
  }

  // 折叠状态的AI查询框
  return (
    <Card className="p-6 bg-background border border-border shadow-sm rounded-xl">
      {/* 头部区域 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="relative w-10 h-10 bg-gradient-to-br from-primary to-agro-blue rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
            {/* 简化的闪亮效果 */}
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">AI农药智能查询</h3>
            <p className="text-sm text-muted-foreground">专业问答</p>
          </div>
        </div>
        
        {/* 展开聊天按钮 */}
        {hasConversationHistory && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsExpanded(true);
              onToggle?.(true);
            }}
            className="text-primary hover:bg-primary/10 border-primary/30"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            查看对话
          </Button>
        )}
      </div>
      
      <div className="space-y-4">
        {/* 输入区域 */}
        <div>
          <div className={cn(
            "glow-border",
            isFocused && "glow-border-focused"
          )}>
            <Textarea
              ref={textareaRef}
              placeholder="请输入您的问题，例如：推荐用于小麦锈病的杀菌剂..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className="w-full min-h-[100px] resize-none border-0 bg-transparent rounded-xl focus:ring-0 focus:outline-none transition-all duration-300"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
          </div>
          
          {/* 提示文字和发送按钮在同一行 */}
          <div className="flex items-end justify-between mt-2">
            <div className="text-xs text-muted-foreground">
              按Enter发送，Shift+Enter换行
            </div>
            <Button 
              onClick={handleSubmit}
              disabled={!query.trim() || isLoading}
              className="bg-gradient-to-r from-primary to-agro-blue hover:from-primary/90 hover:to-agro-blue/90 h-10 px-4 rounded-xl self-end"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  发送查询
                </>
              )}
            </Button>
          </div>
        </div>
        
        {/* 示例查询区域 */}
        <div className="border-t border-border pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowExamples(!showExamples)}
            className="w-full justify-between text-sm text-muted-foreground hover:text-foreground p-0 h-auto"
          >
            <span>常用查询示例</span>
            {showExamples ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
          
          {showExamples && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 max-h-32 overflow-y-auto">
              {exampleQueries.map((example, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="justify-start h-auto p-2 text-left border-border hover:bg-muted/50 hover:border-primary/50 text-xs"
                  onClick={() => {
                    setQuery(example);
                    setShowExamples(false); // 选择后自动收起
                    // 可选：聚焦到输入框
                    setTimeout(() => {
                      textareaRef.current?.focus();
                    }, 100);
                  }}
                >
                  <div className="text-xs text-foreground leading-tight">{example}</div>
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};