import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  Calendar, 
  FileText, 
  AlertCircle,
  CheckCircle,
  Edit,
  Send,
  MapPin,
  CreditCard
} from "lucide-react";
import { Inquiry } from "@/types/inquiry";
import { InquiryService } from "@/services/inquiryService";
import { format } from "date-fns";
import { zhCN, enUS, es } from "date-fns/locale";

interface QuoteSectionProps {
  inquiry: Inquiry;
}

export const QuoteSection = ({ inquiry }: QuoteSectionProps) => {
  const { t, i18n } = useTranslation();

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

  if (!inquiry.quoteDetails) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            {t('inquiry.quoteDetails')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium text-lg mb-2">
              {t('inquiry.noQuoteYet')}
            </h3>
            <p className="text-muted-foreground mb-6">
              {t('inquiry.noQuoteDesc')}
            </p>
            {inquiry.status === 'pending_quote' && (
              <div className="flex justify-center gap-2">
                <Button>
                  <Send className="w-4 h-4 mr-2" />
                  {t('inquiry.sendReminder')}
                </Button>
                <Button variant="outline">
                  <Edit className="w-4 h-4 mr-2" />
                  {t('inquiry.editInquiry')}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            {t('inquiry.quoteDetails')}
          </CardTitle>
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle className="w-3 h-3 mr-1" />
            {t('inquiry.quoted')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Price Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <DollarSign className="w-4 h-4 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('inquiry.quotedPrice')}</p>
              <p className="font-semibold text-lg text-green-600">
                {InquiryService.formatPrice(inquiry.quoteDetails.totalPrice)}
              </p>
            </div>
          </div>

          {inquiry.quoteDetails.validUntil && (
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Calendar className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('inquiry.validUntil')}</p>
                <p className="font-medium">
                  {formatDate(inquiry.quoteDetails.validUntil)}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <FileText className="w-4 h-4 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('inquiry.tradeTerms')}</p>
              <p className="font-medium">{inquiry.details.tradeTerms}</p>
            </div>
          </div>
        </div>

        {/* Trade Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <MapPin className="w-4 h-4 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('inquiry.deliveryLocation')}</p>
              <p className="font-medium">{inquiry.details.deliveryLocation}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <CreditCard className="w-4 h-4 text-indigo-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('inquiry.paymentMethod')}</p>
              <p className="font-medium">{inquiry.details.paymentMethod}</p>
            </div>
          </div>
        </div>

        {/* Supplier Remarks */}
        {inquiry.quoteDetails.supplierRemarks && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-400 mb-2">
              {t('inquiry.supplierRemarks')}
            </h4>
            <p className="text-blue-800 dark:text-blue-300">
              {inquiry.quoteDetails.supplierRemarks}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button className="flex-1">
            <CheckCircle className="w-4 h-4 mr-2" />
            {t('inquiry.acceptQuote')}
          </Button>
          <Button variant="outline" className="flex-1">
            <Edit className="w-4 h-4 mr-2" />
            {t('inquiry.negotiate')}
          </Button>
          <Button variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            {t('inquiry.downloadQuote')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};