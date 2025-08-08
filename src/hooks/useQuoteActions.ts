// 报价操作Hook
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { quoteApi } from "@/services/quoteApi";
import type { 
  BatchUpdateRequest, 
  BatchUpdateResponse,
  SendMessageRequest,
  SendMessageResponse,
  InquiryMessageListResponse
} from "@/types/quote";
import { useQuery } from "@tanstack/react-query";

// 批量操作Hook
export const useBatchUpdateQuotes = () => {
  const queryClient = useQueryClient();

  return useMutation<BatchUpdateResponse, Error, BatchUpdateRequest>({
    mutationFn: (request) => quoteApi.batchUpdateQuotes(request),
    onSuccess: () => {
      // 刷新报价列表和统计数据
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['quote-stats'] });
    },
  });
};

// 拒绝报价Hook
export const useDeclineQuotes = () => {
  const queryClient = useQueryClient();

  return useMutation<BatchUpdateResponse, Error, { inquiryIds: number[]; reason: string }>({
    mutationFn: ({ inquiryIds, reason }) => quoteApi.declineQuote(inquiryIds, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['quote-stats'] });
    },
  });
};

// 更新优先级Hook
export const useUpdatePriority = () => {
  const queryClient = useQueryClient();

  return useMutation<
    BatchUpdateResponse, 
    Error, 
    { inquiryIds: number[]; priority: 'low' | 'normal' | 'high' | 'urgent' }
  >({
    mutationFn: ({ inquiryIds, priority }) => quoteApi.updatePriority(inquiryIds, priority),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
  });
};

// 发送消息Hook
export const useSendMessage = (inquiryId: string) => {
  const queryClient = useQueryClient();

  return useMutation<SendMessageResponse, Error, SendMessageRequest>({
    mutationFn: (request) => quoteApi.sendMessage(inquiryId, request),
    onSuccess: () => {
      // 刷新消息列表
      queryClient.invalidateQueries({ queryKey: ['quote-messages', inquiryId] });
      queryClient.invalidateQueries({ queryKey: ['quote', inquiryId] });
    },
  });
};

// 获取消息列表Hook
export const useQuoteMessages = (
  inquiryId: string, 
  page: number = 1, 
  limit: number = 20,
  desc: boolean = true
) => {
  return useQuery<InquiryMessageListResponse>({
    queryKey: ['quote-messages', inquiryId, page, limit, desc],
    queryFn: () => quoteApi.getMessages(inquiryId, { page, limit, desc }),
    enabled: !!inquiryId,
    staleTime: 2 * 60 * 1000, // 2分钟缓存
  });
};

// 获取报价历史Hook
export const useQuoteHistory = (inquiryId: string) => {
  return useQuery({
    queryKey: ['quote-history', inquiryId],
    queryFn: () => quoteApi.getQuoteHistory(inquiryId),
    enabled: !!inquiryId,
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  });
};