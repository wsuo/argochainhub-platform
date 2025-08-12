import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { RegistrationService } from '@/services/registrationService';
import { RegistrationTable } from './RegistrationTable';
import { RegistrationFiltersData } from '@/types/registration';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/MockAuthContext';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

interface RegistrationListProps {
  filters: RegistrationFiltersData;
  isSupplierView?: boolean;
}

export const RegistrationList: React.FC<RegistrationListProps> = ({ 
  filters, 
  isSupplierView = false 
}) => {
  const { t } = useTranslation();
  const { currentUserType } = useAuth();
  const [currentPage, setCurrentPage] = React.useState(1);
  const pageSize = 10;

  // 查询参数
  const queryParams = {
    page: currentPage,
    limit: pageSize,
    ...(filters.search && { keyword: filters.search }),
    ...(filters.status && { status: filters.status }),
    ...(filters.targetCountry && { targetCountry: filters.targetCountry }),
    ...(filters.dateFrom && { createdStartDate: filters.dateFrom }),
    ...(filters.dateTo && { createdEndDate: filters.dateTo }),
  };

  // 获取登记列表
  const { data: response, isLoading, error } = useQuery({
    queryKey: ['registrations', isSupplierView ? 'received' : 'my', queryParams],
    queryFn: () => isSupplierView 
      ? RegistrationService.getReceivedRegistrationRequests(queryParams)
      : RegistrationService.getMyRegistrationRequests(queryParams),
    staleTime: 30 * 1000,
  });

  // 错误状态
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {t('registration.error.loadFailed', '加载登记列表失败，请稍后重试')}
        </AlertDescription>
      </Alert>
    );
  }

  const registrations = response?.data || [];
  const totalPages = response?.meta?.totalPages || 1;

  return (
    <div className="space-y-4">
      {/* 表格 */}
      <RegistrationTable
        loading={isLoading}
        items={registrations}
        userType={currentUserType || 'buyer'}
        isSupplierView={isSupplierView}
      />

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              
              {[...Array(Math.min(5, totalPages))].map((_, index) => {
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
              
              {totalPages > 5 && (
                <>
                  <PaginationItem>
                    <span className="px-2">...</span>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink
                      onClick={() => setCurrentPage(totalPages)}
                      isActive={currentPage === totalPages}
                      className="cursor-pointer"
                    >
                      {totalPages}
                    </PaginationLink>
                  </PaginationItem>
                </>
              )}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};