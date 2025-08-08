// 单个报价查询Hook
import { useQuery } from "@tanstack/react-query";
import { quoteApi } from "@/services/quoteApi";
import type { Quote } from "@/types/quote";

export const useQuote = (id: string) => {
  return useQuery<Quote>({
    queryKey: ['quote', id],
    queryFn: () => quoteApi.getQuote(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5分钟缓存
    retry: (failureCount, error) => {
      // 权限错误和404错误不重试
      if (error && typeof error === 'object' && 'type' in error) {
        const typedError = error as { type: string };
        if (['permission', 'data'].includes(typedError.type)) {
          return false;
        }
      }
      return failureCount < 2;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
};