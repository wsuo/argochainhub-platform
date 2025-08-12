import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, MessageSquare, Clock, Package, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN, enUS, es } from 'date-fns/locale';
import type { Quote } from '@/types/quote';

interface QuoteTableProps {
  loading: boolean;
  items: Quote[];
  userType: 'buyer' | 'supplier';
}

export function QuoteTable({ loading, items, userType }: QuoteTableProps) {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const navigate = useNavigate();

  const getDateLocale = () => {
    if (currentLanguage === 'zh') return zhCN;
    if (currentLanguage === 'es') return es;
    return enUS;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const locale = getDateLocale();
    
    if (currentLanguage === 'zh') {
      return format(date, 'yyyy年MM月dd日', { locale });
    }
    return format(date, 'MMM dd, yyyy', { locale });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_quote':
        return 'bg-yellow-100 text-yellow-800';
      case 'quoted':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    return t(`quote.status.${status}`, status);
  };

  const getLocalizedText = (text: { [key: string]: string } | string) => {
    if (typeof text === 'string') return text;
    return text[currentLanguage === 'zh' ? 'zh-CN' : currentLanguage] || text['zh-CN'] || '';
  };

  const handleViewQuote = (quoteId: string) => {
    navigate(`/quote-management/${quoteId}`);
  };

  const handleViewMessages = (quoteId: string) => {
    navigate(`/quote-management/${quoteId}#messages`);
  };

  // 获取产品信息的展示文本
  const getProductsDisplay = (items: any[]) => {
    if (!items || items.length === 0) return '-';
    
    const firstItem = items[0];
    const productName = firstItem.productSnapshot?.name || firstItem.product?.name;
    const productNameText = productName ? getLocalizedText(productName) : '';
    
    if (items.length === 1) {
      return productNameText;
    }
    
    return `${productNameText} 等${items.length}个产品`;
  };

  // 获取产品规格信息
  const getProductSpec = (items: any[]) => {
    if (!items || items.length === 0) return '-';
    
    const firstItem = items[0];
    const quantity = firstItem.quantity || '';
    const unit = firstItem.unit || '';
    const packaging = firstItem.packagingReq || '';
    
    return `${quantity} ${unit} ${packaging ? `(${packaging})` : ''}`.trim() || '-';
  };

  if (loading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('quote.table.inquiryNo', '询价单号')}</TableHead>
              <TableHead>{t('quote.table.buyer', '采购商')}</TableHead>
              <TableHead>{t('quote.table.products', '产品信息')}</TableHead>
              <TableHead>{t('quote.table.quantity', '数量规格')}</TableHead>
              <TableHead>{t('quote.table.deadline', '截止日期')}</TableHead>
              <TableHead>{t('quote.table.createdAt', '创建时间')}</TableHead>
              <TableHead>{t('quote.table.status', '状态')}</TableHead>
              <TableHead>{t('quote.table.actions', '操作')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                <TableCell><Skeleton className="h-8 w-16" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="rounded-md border p-8">
        <div className="text-center">
          <Package className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-medium text-foreground">
            {t('quote.table.empty', '暂无报价数据')}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('quote.table.empty.description', '没有找到符合条件的报价单')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('quote.table.inquiryNo', '询价单号')}</TableHead>
            <TableHead>{t('quote.table.buyer', '采购商')}</TableHead>
            <TableHead>{t('quote.table.products', '产品信息')}</TableHead>
            <TableHead>{t('quote.table.quantity', '数量规格')}</TableHead>
            <TableHead>{t('quote.table.deadline', '截止日期')}</TableHead>
            <TableHead>{t('quote.table.createdAt', '创建时间')}</TableHead>
            <TableHead>{t('quote.table.status', '状态')}</TableHead>
            <TableHead>{t('quote.table.actions', '操作')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">
                {item.inquiryNo}
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">
                    {getLocalizedText(item.buyer?.name || '')}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {item.buyer?.profile?.address || ''}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">
                    {getProductsDisplay(item.items)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {item.items?.[0]?.productSnapshot?.formulation && 
                     item.items?.[0]?.productSnapshot?.totalContent && 
                     `${item.items[0].productSnapshot.formulation} ${item.items[0].productSnapshot.totalContent}`
                    }
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  {getProductSpec(item.items)}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className={new Date(item.deadline) < new Date() ? 'text-red-500' : ''}>
                    {formatDate(item.deadline)}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-muted-foreground text-sm">
                  <Calendar className="h-4 w-4" />
                  {formatDate(item.createdAt)}
                </div>
              </TableCell>
              <TableCell>
                <Badge className={getStatusColor(item.status)}>
                  {getStatusLabel(item.status)}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewQuote(item.id)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    {t('quote.table.view', '查看')}
                  </Button>
                  {(item.recentMessages?.length || 0) > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewMessages(item.id)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      {item.recentMessages?.length || 0}
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