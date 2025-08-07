import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Hash, Scale, Boxes, FileText } from "lucide-react";
import { InquiryItem, MultiLanguageText } from "@/types/inquiry";

interface InquiryItemsProps {
  items: InquiryItem[];
}

export const InquiryItems = ({ items }: InquiryItemsProps) => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();

  // 获取多语言文本的辅助函数
  const getLocalizedText = (text: MultiLanguageText): string => {
    const langKey = currentLanguage as keyof MultiLanguageText;
    return text[langKey] || text['zh-CN'];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          {t('inquiry.productDetails')} ({items.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={item.id} className="border rounded-lg p-4 hover:bg-muted/30 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-medium text-lg">
                  {getLocalizedText(item.productSnapshot.name)}
                </h4>
                <Badge variant="outline" className="ml-2">
                  <Hash className="w-3 h-3 mr-1" />
                  {index + 1}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-blue-500/10 rounded">
                    <FileText className="w-3 h-3 text-blue-500" />
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('products.formulation')}:</span>
                    <span className="ml-2 font-medium">{item.productSnapshot.formulation}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="p-1 bg-green-500/10 rounded">
                    <Scale className="w-3 h-3 text-green-500" />
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('products.totalContent')}:</span>
                    <span className="ml-2 font-medium">{item.productSnapshot.totalContent}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="p-1 bg-purple-500/10 rounded">
                    <Package className="w-3 h-3 text-purple-500" />
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('inquiry.quantity')}:</span>
                    <span className="ml-2 font-medium text-primary">
                      {item.quantity} {item.unit}
                    </span>
                  </div>
                </div>

                {item.packagingReq && (
                  <div className="md:col-span-2 lg:col-span-3 flex items-start gap-2">
                    <div className="p-1 bg-orange-500/10 rounded mt-0.5">
                      <Boxes className="w-3 h-3 text-orange-500" />
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t('inquiry.packagingReq')}:</span>
                      <span className="ml-2 font-medium">{item.packagingReq}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Product Summary Card */}
              <div className="mt-4 p-3 bg-gradient-to-r from-primary/5 to-blue/5 rounded-lg border border-primary/10">
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="text-muted-foreground">{t('inquiry.itemSummary')}:</span>
                    <span className="ml-2 font-medium">
                      {getLocalizedText(item.productSnapshot.name)}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-primary">
                    {item.quantity} {item.unit}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Items Summary */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-medium">{t('inquiry.totalItems')}:</span>
            <span className="text-lg font-bold text-primary">
              {items.length} {t('inquiry.itemsUnit')}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};