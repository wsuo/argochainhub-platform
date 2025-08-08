import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/contexts/MockAuthContext";
import { useQueryErrorHandler } from "@/hooks/useErrorHandler";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Eye, 
  Calendar, 
  Building2, 
  MessageSquare, 
  Clock,
  Package
} from "lucide-react";
import { InquiryService } from "@/services/inquiryService";
import { dictionaryService, DictionaryItem } from "@/services/dictionaryService";
import { Inquiry, InquiryStatus, MultiLanguageText } from "@/types/inquiry";
import { InquiryStatusBadge } from "@/components/inquiry/InquiryStatusBadge";
import { InquiryFiltersData } from "./InquiryFilters";
import { format } from "date-fns";
import { zhCN, enUS, es } from "date-fns/locale";

interface InquiryListProps {
  filters: InquiryFiltersData;
}

export const InquiryList = ({ filters }: InquiryListProps) => {
  const { t, i18n } = useTranslation();
  const { currentLanguage } = useLanguage();
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);

  // 错误处理Hook
  const errorHandler = useQueryErrorHandler({
    module: 'inquiry',
    action: 'read',
    resourceType: 'list'
  });

  const handleViewInquiry = (inquiryId: string) => {
    navigate(`/inquiries/${inquiryId}`);
  };

  // 获取多语言文本的辅助函数
  const getLocalizedText = (text: MultiLanguageText): string => {
    const langKey = currentLanguage as keyof MultiLanguageText;
    return text[langKey] || text['zh-CN'];
  };

  // 获取询价状态字典数据
  const { data: statusDict = [] } = useQuery({
    queryKey: ['inquiry-status-dict'],
    queryFn: () => dictionaryService.getInquiryStatuses(),
    staleTime: 10 * 60 * 1000, // 10分钟缓存
  });

  // 获取询价列表 - 只在用户登录时才发起请求
  const {
    data: inquiryResponse,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['inquiries', currentPage, filters],
    queryFn: () => InquiryService.getInquiries({
      page: currentPage,
      limit: 20,
      ...(filters.status && { status: filters.status })
    }),
    staleTime: 30 * 1000, // 30秒缓存
    retry: false, // 禁用自动重试，避免重复请求
    enabled: isLoggedIn, // 只在用户登录时启用查询
  });

  const inquiries = inquiryResponse?.data || [];
  const meta = inquiryResponse?.meta;

  // 获取状态显示文本
  const getStatusLabel = (statusCode: string): string => {
    const statusItem = statusDict.find((item: DictionaryItem) => item.code === statusCode);
    if (!statusItem) return statusCode;

    // 根据当前语言获取对应的显示文本
    const langKey = currentLanguage as keyof typeof statusItem.name;
    return statusItem.name[langKey] || statusItem.name['zh-CN'] || statusCode;
  };

  const getDateLocale = () => {
    switch (i18n.language) {
      case 'zh':
        return zhCN;
      case 'es':
        return es;
      default:
        return enUS;
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'PPP', { locale: getDateLocale() });
  };

  // 手动处理错误
  if (error && !errorHandler.hasError) {
    errorHandler.handleError(error);
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (errorHandler.hasError) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">{t('common.error')}</p>
        </CardContent>
      </Card>
    );
  }

  if (!inquiries.length) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Package className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-medium text-foreground">
              {t('inquiry.noData', '暂无询价数据')}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('inquiry.noDataDesc', '没有找到符合条件的询价单')}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              {t('inquiry.inquiryList')} ({meta?.totalItems || inquiries.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('inquiry.inquiryNo')}</TableHead>
                <TableHead>{t('inquiry.status')}</TableHead>
                <TableHead>{t('inquiry.supplier')}</TableHead>
                <TableHead>{t('inquiry.items')}</TableHead>
                <TableHead>{t('inquiry.deadline')}</TableHead>
                <TableHead>{t('inquiry.totalPrice')}</TableHead>
                <TableHead>{t('inquiry.createdAt')}</TableHead>
                <TableHead>{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inquiries.map((inquiry) => (
                <TableRow key={inquiry.id}>
                  <TableCell className="font-mono text-sm">
                    {inquiry.inquiryNo}
                  </TableCell>
                  <TableCell>
                    <InquiryStatusBadge status={inquiry.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span className="truncate max-w-32">
                        {getLocalizedText(inquiry.supplier.name)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {inquiry.items.length} {t('inquiry.itemsUnit')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <div className="flex flex-col">
                        <span className="text-sm">
                          {formatDate(inquiry.deadline)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({InquiryService.getTimeRemaining(inquiry.deadline)})
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {inquiry.quoteDetails?.totalPrice ? (
                      <span className="font-medium text-primary">
                        {InquiryService.formatPrice(inquiry.quoteDetails.totalPrice)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {formatDate(inquiry.createdAt)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewInquiry(inquiry.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        {t('inquiry.viewDetails')}
                      </Button>
                      {inquiry.recentMessages && inquiry.recentMessages.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewInquiry(inquiry.id)}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          {inquiry.recentMessages.length}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            {t('common.previousPage')}
          </Button>
          <span className="px-4 py-2 text-sm text-muted-foreground">
            {t('common.pageInfo', { current: currentPage, total: meta.totalPages })}
          </span>
          <Button
            variant="outline"
            disabled={currentPage >= meta.totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            {t('common.nextPage')}
          </Button>
        </div>
      )}
    </div>
  );
};