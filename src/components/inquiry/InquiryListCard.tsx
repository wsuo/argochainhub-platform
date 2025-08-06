import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  Building2, 
  Package,
  MessageSquare,
  MapPin,
  CreditCard
} from "lucide-react";
import { Inquiry, MultiLanguageText } from "@/types/inquiry";
import { InquiryService } from "@/services/inquiryService";
import { InquiryStatusBadge } from "./InquiryStatusBadge";
import { Link } from "react-router-dom";

interface InquiryListCardProps {
  inquiry: Inquiry;
  viewType?: 'buyer' | 'supplier';
  onInquiryClick?: (inquiry: Inquiry) => void;
  onMessageClick?: (inquiry: Inquiry) => void;
}

export const InquiryListCard = ({ 
  inquiry, 
  viewType = 'buyer',
  onInquiryClick,
  onMessageClick 
}: InquiryListCardProps) => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);

  // 获取多语言文本的辅助函数
  const getLocalizedText = (text: MultiLanguageText): string => {
    const langKey = currentLanguage as keyof MultiLanguageText;
    return text[langKey] || text['zh-CN'];
  };

  // 获取优先级样式 (供应商视角)
  const getPriorityStyle = () => {
    if (viewType === 'supplier' && inquiry.status === 'pending_quote') {
      const remainingDays = Math.ceil((new Date(inquiry.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      if (remainingDays <= 1) return 'border-l-4 border-l-red-500';
      if (remainingDays <= 3) return 'border-l-4 border-l-orange-500';
      if (remainingDays <= 7) return 'border-l-4 border-l-yellow-500';
    }
    return '';
  };

  const partnerCompany = viewType === 'buyer' ? inquiry.supplier : inquiry.buyer;
  const linkPrefix = viewType === 'buyer' ? '/inquiries' : '/inquiry-responses';

  return (
    <Card className={`hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30 ${getPriorityStyle()}`}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg mb-1 flex items-center gap-2">
              <span className="truncate">{inquiry.inquiryNo}</span>
              {viewType === 'supplier' && inquiry.status === 'pending_quote' && (
                <Badge variant="destructive" className="text-xs flex-shrink-0">
                  {t('inquiry.urgent')}
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">
                {t('inquiry.deadline')}: {InquiryService.formatDate(inquiry.deadline)}
              </span>
              <span className="text-xs text-orange-600 flex-shrink-0">
                ({InquiryService.getTimeRemaining(inquiry.deadline)})
              </span>
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <InquiryStatusBadge status={inquiry.status} />
            {viewType === 'supplier' && inquiry.status === 'pending_quote' && (
              <span className="text-xs text-muted-foreground">{t('inquiry.awaitingResponse')}</span>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 合作方信息 */}
        <div className="flex items-center gap-2 text-sm">
          <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="font-medium flex-shrink-0">
            {viewType === 'buyer' ? t('inquiry.supplier') : t('inquiry.buyer')}:
          </span>
          <span className="truncate">{getLocalizedText(partnerCompany.name)}</span>
        </div>

        {/* 产品信息 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="font-medium">{t('inquiry.products')}:</span>
          </div>
          <div className="pl-6 space-y-1">
            {inquiry.items.slice(0, isExpanded ? inquiry.items.length : 2).map((item) => (
              <div key={item.id} className="text-sm">
                <span className="font-medium">{getLocalizedText(item.productSnapshot.name)}</span>
                <span className="text-muted-foreground ml-2">
                  - {item.quantity} {item.unit}
                </span>
                <span className="text-xs text-muted-foreground ml-2">
                  ({item.productSnapshot.formulation} {item.productSnapshot.totalContent})
                </span>
              </div>
            ))}
            {inquiry.items.length > 2 && !isExpanded && (
              <button
                onClick={() => setIsExpanded(true)}
                className="text-xs text-primary hover:underline"
              >
                {t('inquiry.showMoreItems', { count: inquiry.items.length - 2 })}
              </button>
            )}
            {isExpanded && inquiry.items.length > 2 && (
              <button
                onClick={() => setIsExpanded(false)}
                className="text-xs text-primary hover:underline"
              >
                {t('inquiry.showLess')}
              </button>
            )}
          </div>
        </div>

        {/* 交易条件 */}
        <div className="bg-muted/30 rounded-lg p-3 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">{t('inquiry.deliveryLocation')}:</span>
              <span className="font-medium truncate">{inquiry.details.deliveryLocation}</span>
            </div>
            <div className="flex items-center gap-1">
              <Package className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">{t('inquiry.tradeTerms')}:</span>
              <span className="font-medium">{inquiry.details.tradeTerms}</span>
            </div>
            <div className="flex items-center gap-1 sm:col-span-2">
              <CreditCard className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">{t('inquiry.paymentMethod')}:</span>
              <span className="font-medium">{inquiry.details.paymentMethod}</span>
            </div>
          </div>
        </div>

        {/* 报价信息 */}
        {inquiry.quoteDetails && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/50 dark:to-blue-950/50 rounded-lg p-3 border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-green-800 dark:text-green-200">
                {t('inquiry.hasQuoted')}:
              </span>
              <span className="text-lg font-bold text-primary">
                {InquiryService.formatPrice(inquiry.quoteDetails.totalPrice)}
              </span>
            </div>
            {inquiry.quoteDetails.validUntil && (
              <div className="text-xs text-muted-foreground">
                {t('inquiry.validUntil')}: {InquiryService.formatDate(inquiry.quoteDetails.validUntil)}
              </div>
            )}
          </div>
        )}

        {/* 最近消息 */}
        {inquiry.recentMessages && inquiry.recentMessages.length > 0 && (
          <div className="border-t pt-3">
            <div className="flex items-center gap-2 text-sm mb-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{t('inquiry.recentMessage')}:</span>
            </div>
            <div className="text-sm text-muted-foreground line-clamp-2 pl-6 mb-1">
              {inquiry.recentMessages[0].message}
            </div>
            <div className="text-xs text-muted-foreground pl-6">
              {inquiry.recentMessages[0].sender.name} · {InquiryService.formatDateTime(inquiry.recentMessages[0].createdAt)}
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-2 pt-2">
          <Button
            asChild
            className="flex-1"
            variant={viewType === 'supplier' && inquiry.status === 'pending_quote' ? 'default' : 'outline'}
          >
            <Link 
              to={`${linkPrefix}/${inquiry.id}`}
              onClick={() => onInquiryClick?.(inquiry)}
            >
              {viewType === 'supplier' && inquiry.status === 'pending_quote' 
                ? t('inquiry.respondNow') 
                : t('inquiry.viewDetails')
              }
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="px-3"
            asChild
          >
            <Link 
              to={`${linkPrefix}/${inquiry.id}#messages`}
              onClick={() => onMessageClick?.(inquiry)}
            >
              <MessageSquare className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};