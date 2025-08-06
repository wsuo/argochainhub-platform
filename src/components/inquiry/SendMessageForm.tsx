import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";
import { InquiryService } from "@/services/inquiryService";
import { toast } from "@/hooks/use-toast";

interface SendMessageFormProps {
  inquiryId: string;
  onMessageSent?: () => void;
}

export const SendMessageForm = ({ inquiryId, onMessageSent }: SendMessageFormProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');

  // 发送消息的mutation
  const sendMessageMutation = useMutation({
    mutationFn: (messageText: string) => InquiryService.sendMessage(inquiryId, { message: messageText }),
    onSuccess: () => {
      setMessage('');
      toast({
        title: t('inquiry.messageSuccess'),
        description: t('inquiry.messageSuccessDesc'),
      });
      
      // 刷新相关查询
      queryClient.invalidateQueries({ queryKey: ['inquiry-messages', inquiryId] });
      queryClient.invalidateQueries({ queryKey: ['inquiry-detail', inquiryId] });
      
      onMessageSent?.();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: t('inquiry.messageFailed'),
        description: error.message || t('inquiry.messageFailedDesc'),
      });
    }
  });

  const handleSendMessage = () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;
    
    if (trimmedMessage.length > 1000) {
      toast({
        variant: "destructive",
        title: t('inquiry.messageTooLong'),
        description: t('inquiry.messageTooLongDesc'),
      });
      return;
    }

    sendMessageMutation.mutate(trimmedMessage);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="space-y-3">
      <Textarea
        placeholder={t('inquiry.typeMessage')}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        className="min-h-[60px] resize-none"
        disabled={sendMessageMutation.isPending}
        maxLength={1000}
      />
      
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {message.length}/1000 · {t('inquiry.messageHint')}
        </span>
        
        <Button
          onClick={handleSendMessage}
          disabled={!message.trim() || sendMessageMutation.isPending}
          size="sm"
        >
          {sendMessageMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          {t('inquiry.send')}
        </Button>
      </div>
    </div>
  );
};