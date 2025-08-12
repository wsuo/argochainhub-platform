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
import { InquiryStatusBadge } from "@/components/inquiry/InquiryStatusBadge";
import { Eye, Building2, Package, Clock, Calendar, MessageSquare } from "lucide-react";
import type { Inquiry, MultiLanguageText } from "@/types/inquiry";
import { InquiryService } from "@/services/inquiryService";
import { format } from "date-fns";
import { zhCN, enUS, es } from "date-fns/locale";

interface InquiryTableProps {
  loading: boolean;
  items: Inquiry[];
  userType: 'buyer' | 'supplier';
  isSupplierView?: boolean;
}

export function InquiryTable({ loading, items, userType, isSupplierView = false }: InquiryTableProps) {
  const { t, i18n } = useTranslation();
  const { currentLanguage } = useLanguage();
  const navigate = useNavigate();

  const getLocalizedText = (text: MultiLanguageText | string | undefined): string => {
    if (!text) return '';
    if (typeof text === 'string') return text;
    
    const langKey = currentLanguage as keyof MultiLanguageText;
    return text[langKey] || text['zh-CN'] || '';
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
    try {
      return format(new Date(dateString), 'PPP', { locale: getDateLocale() });
    } catch {
      return dateString;
    }
  };

  const handleView = (id: string) => {
    if (isSupplierView) {
      navigate(`/inquiry-responses/${id}`);
    } else {
      navigate(`/inquiries/${id}`);
    }
  };

  const handleViewMessages = (id: string) => {
    if (isSupplierView) {
      navigate(`/inquiry-responses/${id}#messages`);
    } else {
      navigate(`/inquiries/${id}#messages`);
    }
  };

  if (loading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('inquiry.table.inquiryNo', '询价单号')}</TableHead>
              <TableHead>{t('inquiry.table.product', '产品信息')}</TableHead>
              {!isSupplierView && <TableHead>{t('inquiry.table.supplier', '供应商')}</TableHead>}
              {isSupplierView && <TableHead>{t('inquiry.table.buyer', '采购商')}</TableHead>}
              <TableHead>{t('inquiry.table.items', '商品数量')}</TableHead>
              <TableHead>{t('inquiry.table.deadline', '截止日期')}</TableHead>
              <TableHead>{t('inquiry.table.totalPrice', '报价')}</TableHead>
              <TableHead>{t('inquiry.table.status', '状态')}</TableHead>
              <TableHead>{t('inquiry.table.actions', '操作')}</TableHead>
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
          {t('inquiry.table.noData', '暂无询价数据')}
        </div>
        <div className="text-sm text-muted-foreground">
          {isSupplierView
            ? t('inquiry.table.noDataHintSupplier', '暂时没有收到任何询价')
            : t('inquiry.table.noDataHintBuyer', '您还没有创建任何询价')}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('inquiry.table.inquiryNo', '询价单号')}</TableHead>
            <TableHead>{t('inquiry.table.product', '产品信息')}</TableHead>
            {!isSupplierView && <TableHead>{t('inquiry.table.supplier', '供应商')}</TableHead>}
            {isSupplierView && <TableHead>{t('inquiry.table.buyer', '采购商')}</TableHead>}
            <TableHead>{t('inquiry.table.items', '商品数量')}</TableHead>
            <TableHead>{t('inquiry.table.deadline', '截止日期')}</TableHead>
            <TableHead>{t('inquiry.table.totalPrice', '报价')}</TableHead>
            <TableHead>{t('inquiry.table.status', '状态')}</TableHead>
            <TableHead>{t('inquiry.table.actions', '操作')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium font-mono text-sm">{item.inquiryNo}</TableCell>
              <TableCell>
                <div className="space-y-1">
                  {item.items.slice(0, 2).map((productItem, index) => (
                    <div key={index} className="text-sm">
                      <div className="font-medium">{getLocalizedText(productItem.productSnapshot.name)}</div>
                      <div className="text-xs text-muted-foreground">
                        {productItem.productSnapshot.formulation} • {productItem.quantity} {productItem.unit}
                      </div>
                    </div>
                  ))}
                  {item.items.length > 2 && (
                    <div className="text-xs text-muted-foreground">
                      +{item.items.length - 2} {t('inquiry.moreItems', '更多商品')}
                    </div>
                  )}
                </div>
              </TableCell>
              {!isSupplierView && (
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div className="truncate max-w-32">
                      {getLocalizedText(item.supplier?.name)}
                    </div>
                  </div>
                </TableCell>
              )}
              {isSupplierView && (
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div className="truncate max-w-32">
                      {getLocalizedText(item.buyer?.name)}
                    </div>
                  </div>
                </TableCell>
              )}
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {item.items.length} {t('inquiry.itemsUnit', '项')}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {formatDate(item.deadline)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {InquiryService.getTimeRemaining(item.deadline)}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {item.quoteDetails?.totalPrice ? (
                  <div className="font-medium text-primary">
                    {InquiryService.formatPrice(item.quoteDetails.totalPrice)}
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">--</span>
                )}
              </TableCell>
              <TableCell>
                <InquiryStatusBadge status={item.status} />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleView(item.id)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    {isSupplierView 
                      ? t('inquiry.table.respond', '响应')
                      : t('inquiry.table.view', '查看')}
                  </Button>
                  {(item.messageCount > 0 || (item.recentMessages && item.recentMessages.length > 0)) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewMessages(item.id)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      {item.messageCount || item.recentMessages?.length || 0}
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}