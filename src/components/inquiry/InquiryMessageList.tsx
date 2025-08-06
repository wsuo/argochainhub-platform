import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/contexts/MockAuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { User, MessageSquare } from "lucide-react";
import { InquiryMessage, MultiLanguageText } from "@/types/inquiry";
import { InquiryService } from "@/services/inquiryService";

interface InquiryMessageListProps {
  messages: InquiryMessage[];
  isLoading?: boolean;
  className?: string;
}

export const InquiryMessageList = ({ messages, isLoading, className }: InquiryMessageListProps) => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 获取多语言文本的辅助函数
  const getLocalizedText = (text: MultiLanguageText): string => {
    const langKey = currentLanguage as keyof MultiLanguageText;
    return text[langKey] || text['zh-CN'];
  };

  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 渲染消息项
  const renderMessage = (message: InquiryMessage, index: number) => {
    const isCurrentUser = message.senderId === user?.id;
    const showSender = index === 0 || messages[index - 1]?.senderId !== message.senderId;
    const showTime = index === messages.length - 1 || 
                    messages[index + 1]?.senderId !== message.senderId ||
                    (new Date(messages[index + 1]?.createdAt).getTime() - new Date(message.createdAt).getTime()) > 5 * 60 * 1000; // 5分钟间隔

    return (
      <div key={message.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-[70%] ${isCurrentUser ? 'order-2' : 'order-1'}`}>
          {/* 发送者信息 */}
          {showSender && (
            <div className={`flex items-center gap-2 mb-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex items-center gap-2 text-xs text-muted-foreground ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-6 h-6 rounded-full bg-gradient-to-br from-primary/20 to-agro-blue/20 flex items-center justify-center`}>
                  <User className="h-3 w-3" />
                </div>
                <div className={`${isCurrentUser ? 'text-right' : 'text-left'}`}>
                  <div className="font-medium">{message.sender.name}</div>
                  <div className="text-xs opacity-75">
                    {getLocalizedText(message.sender.company.name)}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* 消息内容 */}
          <div
            className={`rounded-lg px-4 py-3 shadow-sm ${
              isCurrentUser
                ? 'bg-primary text-primary-foreground ml-4'
                : 'bg-muted mr-4'
            }`}
          >
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {message.message}
            </p>
          </div>
          
          {/* 时间戳 */}
          {showTime && (
            <div className={`text-xs text-muted-foreground mt-1 ${isCurrentUser ? 'text-right mr-4' : 'text-left ml-4'}`}>
              {InquiryService.formatDateTime(message.createdAt)}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <ScrollArea className={`h-96 w-full pr-4 ${className}`}>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
              <Skeleton className={`h-16 ${i % 2 === 0 ? 'w-3/4' : 'w-2/3'}`} />
            </div>
          ))}
        </div>
      </ScrollArea>
    );
  }

  if (messages.length === 0) {
    return (
      <ScrollArea className={`h-96 w-full pr-4 ${className}`}>
        <div className="text-center py-12 text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">{t('inquiry.noMessages')}</p>
          <p className="text-sm mt-1">{t('inquiry.noMessagesDesc')}</p>
        </div>
      </ScrollArea>
    );
  }

  return (
    <ScrollArea className={`h-96 w-full pr-4 ${className}`}>
      <div className="space-y-2">
        {messages.map((message, index) => renderMessage(message, index))}
      </div>
      <div ref={messagesEndRef} />
    </ScrollArea>
  );
};