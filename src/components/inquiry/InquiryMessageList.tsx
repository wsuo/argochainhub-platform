import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/contexts/MockAuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare } from "lucide-react";
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
      <div key={message.id} className="mb-3">
        <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
          <div className={`flex ${isCurrentUser ? 'flex-col items-end' : 'flex-col items-start'} max-w-[75%]`}>
            {/* 发送者信息 */}
            {showSender && (
              <div className={`mb-1 text-xs text-muted-foreground ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                <span className="font-medium">{message.sender.name}</span>
                <span className="opacity-75 ml-1">
                  ({getLocalizedText(message.sender.company.name)})
                </span>
              </div>
            )}
            
            {/* 消息内容 */}
            <div
              className={`rounded-lg px-3 py-2 shadow-sm text-sm leading-relaxed ${
                isCurrentUser
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <span className="break-words">
                {message.message}
              </span>
            </div>
            
            {/* 时间戳 */}
            {showTime && (
              <div className={`text-xs text-muted-foreground mt-1 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                {InquiryService.formatDateTime(message.createdAt)}
              </div>
            )}
          </div>
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
      <div className="p-4">
        <div className="space-y-2">
          {/* 修复消息顺序：最新消息在下面 */}
          {[...messages].reverse().map((message, index) => 
            renderMessage(message, messages.length - 1 - index)
          )}
        </div>
      </div>
      <div ref={messagesEndRef} />
    </ScrollArea>
  );
};