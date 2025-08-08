// 报价统计Hook
import { useQuery } from "@tanstack/react-query";
import { quoteApi } from "@/services/quoteApi";
import type { QuoteStats } from "@/types/quote";

export const useQuoteStats = () => {
  return useQuery<QuoteStats>({
    queryKey: ['quote-stats'],
    queryFn: () => quoteApi.getQuoteStats(),
    staleTime: 10 * 60 * 1000, // 10分钟缓存
    retry: (failureCount, error) => {
      if (error && typeof error === 'object' && 'type' in error) {
        const typedError = error as { type: string };
        if (typedError.type === 'permission') {
          return false;
        }
      }
      return failureCount < 2;
    },
  });
};