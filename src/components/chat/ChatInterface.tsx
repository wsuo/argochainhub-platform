import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Bot, User, MinusCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // 示例查询
  const exampleQueries = [
    "推荐用于番茄晚疫病的杀菌剂",
    "查询草铵膦在欧盟的登记状况",
    "有什么有效成分可以防治玉米螟？",
    "寻找环保型除草剂供应商"
  ];

  // 模拟AI响应
  const simulateAIResponse = (userQuery: string): string => {
    const responses = {
      "番茄晚疫病": "针对番茄晚疫病，推荐使用以下杀菌剂：\n\n1. **丙森锌** - 广谱保护性杀菌剂\n2. **氟菌·霜霉威** - 内吸性治疗剂\n3. **烯酰吗啉** - 专用于疫病防治\n\n使用时建议轮换用药，避免抗性产生。",
      "草铵膦": "草铵膦在欧盟的登记状况：\n\n✅ **已批准使用**\n📅 **有效期至2025年**\n⚠️ **限制条件**：仅限专业用户使用\n\n主要供应商包括拜耳、巴斯夫等国际厂商。",
      "玉米螟": "防治玉米螟的有效成分推荐：\n\n🔸 **生物防治**：苏云金杆菌（Bt）\n🔸 **化学防治**：氯虫苯甲酰胺、茚虫威\n🔸 **物理防治**：性诱剂、杀虫灯\n\n建议采用综合防治策略，效果更佳。",
      "环保型除草剂": "环保型除草剂供应商推荐：\n\n🌱 **科迪华农业科技** - 专注可持续农业\n🌱 **先正达集团** - 生物除草剂领导者\n🌱 **住友化学** - 低毒环保产品\n\n这些供应商都有完整的环保认证。"
    };

    // 简单的关键词匹配
    for (const [keyword, response] of Object.entries(responses)) {
      if (userQuery.includes(keyword)) {
        return response;
      }
    }

    return `感谢您的咨询："${userQuery}"\n\n我正在为您查询相关信息，这可能包括：\n• 产品技术参数\n• 供应商信息\n• 登记状况\n• 使用建议\n\n如需更详细信息，请提供更具体的要求。`;
  };

  // 折叠聊天界面
  const handleCollapse = () => {
    setIsExpanded(false);
    onToggle?.(false);
    setMessages([]);
    setQuery("");
  };

  // 发送消息
  const handleSubmit = async () => {
    if (!query.trim()) return;
    
    // 首次发送消息时展开聊天界面
    if (!isExpanded) {
      setIsExpanded(true);
      onToggle?.(true);
    }
    
    const userMessage: Message = {
      id: Date.now().toString(),
      content: query.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setQuery("");
    setIsLoading(true);

    // 模拟AI响应延迟
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: simulateAIResponse(userMessage.content),
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1500);
  };

  // 自动滚动到底部
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

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
        <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
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
                  <div className={`rounded-lg p-3 ${
                    message.sender === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}>
                    <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                    <div className={`text-xs mt-1 opacity-70`}>
                      {message.timestamp.toLocaleTimeString('zh-CN', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-2">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

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
      <div className="flex items-center space-x-3 mb-4">
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
          <div className="flex items-center justify-between mt-2">
            <div className="text-xs text-muted-foreground">
              按Enter发送，Shift+Enter换行
            </div>
            <Button 
              onClick={handleSubmit}
              disabled={!query.trim() || isLoading}
              className="bg-gradient-to-r from-primary to-agro-blue hover:from-primary/90 hover:to-agro-blue/90 h-10 px-4 rounded-xl"
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
            <div className="grid grid-cols-2 gap-3 mt-3">
              {exampleQueries.map((example, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="justify-start h-auto p-3 text-left border-border hover:bg-muted/50 hover:border-primary/50"
                  onClick={() => {
                    setQuery(example);
                    setShowExamples(false); // 选择后自动收起
                    // 可选：聚焦到输入框
                    setTimeout(() => {
                      textareaRef.current?.focus();
                    }, 100);
                  }}
                >
                  <div className="text-sm text-foreground">{example}</div>
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};