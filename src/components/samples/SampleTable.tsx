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
import { SampleStatusBadge } from "./SampleStatusBadge";
import { Eye } from "lucide-react";
import type { SampleRequestListItem } from "@/types/sample";

interface SampleTableProps {
  loading: boolean;
  items: SampleRequestListItem[];
  userType: 'buyer' | 'supplier';
}

export function SampleTable({ loading, items, userType }: SampleTableProps) {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const navigate = useNavigate();

  const getLocalizedText = (text: any): string => {
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

  const handleView = (id: number) => {
    if (userType === 'buyer') {
      navigate(`/samples/${id}`);
    } else {
      navigate(`/sample-responses/${id}`);
    }
  };

  if (loading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('samples.table.reqNo')}</TableHead>
              <TableHead>{t('samples.table.product')}</TableHead>
              {userType === 'buyer' && <TableHead>{t('samples.table.supplier')}</TableHead>}
              {userType === 'supplier' && <TableHead>{t('samples.table.buyer')}</TableHead>}
              <TableHead>{t('samples.table.quantity')}</TableHead>
              <TableHead>{t('samples.table.deadline')}</TableHead>
              <TableHead>{t('samples.table.status')}</TableHead>
              <TableHead>{t('samples.table.actions')}</TableHead>
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
          {t('samples.table.noData')}
        </div>
        <div className="text-sm text-muted-foreground">
          {userType === 'buyer' 
            ? t('samples.table.noDataHintBuyer')
            : t('samples.table.noDataHintSupplier')}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('samples.table.reqNo')}</TableHead>
            <TableHead>{t('samples.table.product')}</TableHead>
            {userType === 'buyer' && <TableHead>{t('samples.table.supplier')}</TableHead>}
            {userType === 'supplier' && <TableHead>{t('samples.table.buyer')}</TableHead>}
            <TableHead>{t('samples.table.quantity')}</TableHead>
            <TableHead>{t('samples.table.deadline')}</TableHead>
            <TableHead>{t('samples.table.status')}</TableHead>
            <TableHead>{t('samples.table.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.sampleReqNo}</TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="font-medium">{getLocalizedText(item.productSnapshot.name)}</div>
                  <div className="text-xs text-muted-foreground">
                    {getLocalizedText(item.productSnapshot.category)} • {item.productSnapshot.content}
                  </div>
                </div>
              </TableCell>
              {userType === 'buyer' && (
                <TableCell>
                  <div className="space-y-1">
                    <div>{getLocalizedText(item.supplier.name)}</div>
                    {item.supplier.rating && (
                      <div className="text-xs text-muted-foreground">
                        ⭐ {item.supplier.rating}
                      </div>
                    )}
                  </div>
                </TableCell>
              )}
              {userType === 'supplier' && item.buyer && (
                <TableCell>{getLocalizedText(item.buyer.name)}</TableCell>
              )}
              <TableCell>
                {item.quantity} {item.unit}
              </TableCell>
              <TableCell>
                {new Date(item.deadline).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <SampleStatusBadge status={item.status} />
              </TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleView(item.id)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  {userType === 'buyer' 
                    ? t('samples.table.view')
                    : t('samples.table.process')}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}