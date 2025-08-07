import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  DollarSign, 
  FileText, 
  MessageSquare,
  Download,
  Share2,
  Clock,
  Package,
  MapPin,
  CreditCard
} from "lucide-react";
import { Inquiry, MultiLanguageText } from "@/types/inquiry";
import { InquiryStatusBadge } from "@/components/inquiry/InquiryStatusBadge";
import { InquiryService } from "@/services/inquiryService";
import { format } from "date-fns";
import { zhCN, enUS, es } from "date-fns/locale";

interface InquiryHeaderProps {
  inquiry: Inquiry;
}

export const InquiryHeader = ({ inquiry }: InquiryHeaderProps) => {
  const { t, i18n } = useTranslation();
  const { currentLanguage } = useLanguage();

  // 获取多语言文本的辅助函数
  const getLocalizedText = (text: MultiLanguageText): string => {
    const langKey = currentLanguage as keyof MultiLanguageText;
    return text[langKey] || text['zh-CN'];
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <CardTitle className="text-2xl">
                {inquiry.inquiryNo}
              </CardTitle>
              <InquiryStatusBadge 
                status={inquiry.status} 
                className="text-base px-3 py-1"
              />
            </div>
            <p className="text-muted-foreground">
              {t('inquiry.inquiryDetail')}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              {t('common.share')}
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              {t('common.export')}
            </Button>
            <Button size="sm" asChild>
              <a href="#messages">
                <MessageSquare className="w-4 h-4 mr-2" />
                {t('inquiry.sendMessage')}
              </a>
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* 统一使用4列网格布局 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* 第一行：创建时间、截止日期、产品项目、总报价 */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Calendar className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('inquiry.createdAt')}</p>
              <p className="font-medium">
                {formatDate(inquiry.createdAt)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-lg">
              <Clock className="w-4 h-4 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('inquiry.deadline')}</p>
              <div className="space-y-1">
                <p className="font-medium">
                  {formatDate(inquiry.deadline)}
                </p>
                <p className="text-xs text-muted-foreground">
                  ({InquiryService.getTimeRemaining(inquiry.deadline)})
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Package className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('inquiry.items')}</p>
              <p className="font-medium">
                {inquiry.items.length} {t('inquiry.itemsUnit')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <DollarSign className="w-4 h-4 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('inquiry.totalPrice')}</p>
              <p className="font-medium">
                {inquiry.quoteDetails?.totalPrice 
                  ? InquiryService.formatPrice(inquiry.quoteDetails.totalPrice)
                  : t('inquiry.pending')
                }
              </p>
            </div>
          </div>

          {/* 第二行：贸易条件、交货地点、付款方式，与第一行前三个对齐 */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <FileText className="w-4 h-4 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('inquiry.tradeTerms')}</p>
              <p className="font-medium">
                {inquiry.details.tradeTerms}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <MapPin className="w-4 h-4 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('inquiry.deliveryLocation')}</p>
              <p className="font-medium">
                {inquiry.details.deliveryLocation}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <CreditCard className="w-4 h-4 text-indigo-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('inquiry.paymentMethod')}</p>
              <p className="font-medium">
                {inquiry.details.paymentMethod}
              </p>
            </div>
          </div>

          {/* 空白占位，保持网格结构 */}
          <div></div>
        </div>
        
        {inquiry.details.buyerRemarks && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">{t('inquiry.buyerRemarks')}</h4>
            <p className="text-muted-foreground">{inquiry.details.buyerRemarks}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};