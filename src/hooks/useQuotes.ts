// 报价列表查询Hook
import { useQuery } from "@tanstack/react-query";
import { quoteApi } from "@/services/quoteApi";
import type { QuoteFilters, QuoteListResponse } from "@/types/quote";

export const useQuotes = (
  filters: QuoteFilters = {},
  page: number = 1,
  limit: number = 10
) => {
  return useQuery<QuoteListResponse>({
    queryKey: ['quotes', filters, page, limit],
    queryFn: () => quoteApi.getQuotes(filters, page, limit),
    staleTime: 5 * 60 * 1000, // 5分钟缓存
    retry: (failureCount, error) => {
      // 权限错误不重试
      if (error && typeof error === 'object' && 'type' in error) {
        const typedError = error as { type: string };
        if (typedError.type === 'permission') {
          return false;
        }
      }
      return failureCount < 3;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};