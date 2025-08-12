import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RegistrationStatusBadge } from "./RegistrationStatusBadge";
import { Eye, User, Building } from "lucide-react";
import type { RegistrationRequest } from "@/types/registration";

interface RegistrationTableProps {
  loading: boolean;
  items: RegistrationRequest[];
  userType: 'buyer' | 'supplier';
  isSupplierView?: boolean;
}

export function RegistrationTable({ loading, items, userType, isSupplierView = false }: RegistrationTableProps) {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const navigate = useNavigate();

  const getLocalizedText = (text: string | Record<string, string> | undefined): string => {
    if (typeof text === 'string') {
      // 尝试解析JSON字符串
      try {
        const parsed = JSON.parse(text);
        if (typeof parsed === 'object' && parsed !== null) {
          const langKey = currentLanguage === 'zh' ? 'zh-CN' : currentLanguage;
          return parsed[langKey] || parsed['zh-CN'] || text;
        }
      } catch {
        // 如果不是JSON字符串，直接返回
        return text;
      }
      return text;
    }
    if (typeof text === 'object' && text !== null) {
      const langKey = currentLanguage === 'zh' ? 'zh-CN' : currentLanguage;
      return text[langKey] || text['zh-CN'] || '';
    }
    return '';
  };

  const formatCurrency = (amount: number | undefined, currency: string | undefined) => {
    if (amount === undefined || amount === null || currency === undefined || currency === null) {
      return '--';
    }
    return `${currency} ${amount.toLocaleString()}`;
  };

  const handleView = (id: number) => {
    navigate(`/registrations/${id}`);
  };

  if (loading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('registration.table.reqNo', '登记单号')}</TableHead>
              <TableHead>{t('registration.table.product', '产品信息')}</TableHead>
              {!isSupplierView && <TableHead>{t('registration.table.supplier', '供应商')}</TableHead>}
              {isSupplierView && <TableHead>{t('registration.table.buyer', '采购商')}</TableHead>}
              <TableHead>{t('registration.table.targetCountry', '目标国家')}</TableHead>
              <TableHead>{t('registration.table.budget', '预算')}</TableHead>
              <TableHead>{t('registration.table.deadline', '截止日期')}</TableHead>
              <TableHead>{t('registration.table.status', '状态')}</TableHead>
              <TableHead>{t('registration.table.actions', '操作')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(3)].map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-8 w-16" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-muted-foreground mb-2">
          {t('registration.table.noData', '暂无登记数据')}
        </div>
        <div className="text-sm text-muted-foreground">
          {isSupplierView
            ? t('registration.table.noDataHintSupplier', '暂时没有收到任何登记申请')
            : t('registration.table.noDataHintBuyer', '您还没有创建任何登记申请')}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('registration.table.reqNo', '登记单号')}</TableHead>
            <TableHead>{t('registration.table.product', '产品信息')}</TableHead>
            {!isSupplierView && <TableHead>{t('registration.table.supplier', '供应商')}</TableHead>}
            {isSupplierView && <TableHead>{t('registration.table.buyer', '采购商')}</TableHead>}
            <TableHead>{t('registration.table.targetCountry', '目标国家')}</TableHead>
            <TableHead>{t('registration.table.budget', '预算')}</TableHead>
            <TableHead>{t('registration.table.deadline', '截止日期')}</TableHead>
            <TableHead>{t('registration.table.status', '状态')}</TableHead>
            <TableHead>{t('registration.table.actions', '操作')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.regReqNo}</TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="font-medium">{getLocalizedText(item.productSnapshot?.name || item.product?.name)}</div>
                  <div className="text-xs text-muted-foreground">
                    {getLocalizedText(item.productSnapshot?.category || item.product?.category)} 
                    {item.productSnapshot?.content && <> • {item.productSnapshot.content}</>}
                  </div>
                </div>
              </TableCell>
              {!isSupplierView && item.supplier && (
                <TableCell>
                  <div className="flex items-center space-y-1">
                    <Building className="h-4 w-4 text-muted-foreground mr-2" />
                    <div>
                      <div>{getLocalizedText(item.supplier.companyName)}</div>
                      <div className="text-xs text-muted-foreground">
                        {getLocalizedText(item.supplier.contactName)}
                      </div>
                    </div>
                  </div>
                </TableCell>
              )}
              {isSupplierView && item.buyer && (
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div>{getLocalizedText(item.buyer.companyName)}</div>
                      <div className="text-xs text-muted-foreground">
                        {getLocalizedText(item.buyer.contactName)}
                      </div>
                    </div>
                  </div>
                </TableCell>
              )}
              <TableCell>
                <div className="flex items-center space-x-2">
                  <span>{getLocalizedText(item.targetCountryName) || item.details?.targetCountry}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="font-medium">
                  {formatCurrency(item.details?.budget?.amount, item.details?.budget?.currency)}
                </div>
                {item.details?.isExclusive && (
                  <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded mt-1 inline-block">
                    {t('registration.exclusive', '独家')}
                  </div>
                )}
              </TableCell>
              <TableCell>
                {new Date(item.deadline).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <RegistrationStatusBadge status={item.status} />
              </TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleView(item.id)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  {isSupplierView 
                    ? t('registration.table.process', '处理')
                    : t('registration.table.view', '查看')}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}