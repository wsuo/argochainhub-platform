import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/MockAuthContext";
import { useQueryErrorHandler } from "@/hooks/useErrorHandler";
import { useInquiryMessaging } from "@/hooks/useInquiryMessaging";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { InquiryService } from "@/services/inquiryService";
import { Inquiry } from "@/types/inquiry";
import { InquiryFiltersData } from "./InquiryFilters";
import { InquiryTable } from "@/components/inquiry/InquiryTable";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

interface InquiryListProps {
  filters: InquiryFiltersData;
  isSupplierView?: boolean;
}

export const InquiryList = ({ filters, isSupplierView = false }: InquiryListProps) => {
  const { t } = useTranslation();
  const { isLoggedIn, currentUserType } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const pageSize = 10;

  // 错误处理Hook
  const errorHandler = useQueryErrorHandler({
    module: 'inquiry',
    action: 'read',
    resourceType: 'list'
  });

  // 初始化消息推送功能
  useInquiryMessaging({
    onListMessageUpdate: (inquiryId, messageData) => {
      // 更新列表中的最新消息
      setInquiries(prev => prev.map(inquiry => {
        if (inquiry.id === inquiryId.toString()) {
          return {
            ...inquiry,
            recentMessages: [
              {
                id: messageData.messageId.toString(),
                relatedService: 'inquiry',
                relatedId: messageData.inquiryId.toString(),
                message: messageData.message,
                senderId: messageData.senderId.toString(),
                createdAt: messageData.timestamp,
                sender: {
                  id: messageData.senderId.toString(),
                  name: messageData.senderName,
                  userType: messageData.senderCompanyType as 'buyer' | 'supplier',
                  company: {
                    id: messageData.senderId.toString(),
                    name: {
                      'zh-CN': messageData.senderCompany,
                      'en': messageData.senderCompany,
                      'es': messageData.senderCompany
                    },
                    type: messageData.senderCompanyType as 'buyer' | 'supplier'
                  }
                }
              },
              ...inquiry.recentMessages?.slice(0, 4) || []
            ]
          };
        }
        return inquiry;
      }));
    }
  });

  // 查询参数
  const queryParams = {
    page: currentPage,
    limit: pageSize,
    ...(filters.search && { keyword: filters.search }),
    ...(filters.status && { status: filters.status }),
    ...(filters.dateFrom && { createdStartDate: filters.dateFrom }),
    ...(filters.dateTo && { createdEndDate: filters.dateTo }),
  };

  // 获取询价列表 - 只在用户登录时才发起请求
  const {
    data: inquiryResponse,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['inquiries', isSupplierView ? 'supplier' : 'buyer', queryParams],
    queryFn: () => InquiryService.getInquiries(queryParams),
    staleTime: 30 * 1000, // 30秒缓存
    retry: false, // 禁用自动重试，避免重复请求
    enabled: isLoggedIn, // 只在用户登录时启用查询
  });

  const meta = inquiryResponse?.meta;

  // 同步服务器数据到本地状态
  useEffect(() => {
    if (inquiryResponse?.data) {
      setInquiries(inquiryResponse.data);
    }
  }, [inquiryResponse?.data]);

  // 手动处理错误
  if (error && !errorHandler.hasError) {
    errorHandler.handleError(error);
  }

  // 错误状态
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {t('inquiry.error.loadFailed', '加载询价列表失败，请稍后重试')}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* 表格 */}
      <InquiryTable
        loading={isLoading}
        items={inquiries}
        userType={currentUserType || 'buyer'}
        isSupplierView={isSupplierView}
      />

      {/* 分页 */}
      {meta && meta.totalPages > 1 && (
        <div className="mt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              
              {[...Array(Math.min(5, meta.totalPages))].map((_, index) => {
                const pageNumber = index + 1;
                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      onClick={() => setCurrentPage(pageNumber)}
                      isActive={currentPage === pageNumber}
                      className="cursor-pointer"
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              {meta.totalPages > 5 && (
                <>
                  <PaginationItem>
                    <span className="px-2">...</span>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink
                      onClick={() => setCurrentPage(meta.totalPages)}
                      isActive={currentPage === meta.totalPages}
                      className="cursor-pointer"
                    >
                      {meta.totalPages}
                    </PaginationLink>
                  </PaginationItem>
                </>
              )}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(p => Math.min(meta.totalPages, p + 1))}
                  className={currentPage === meta.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};