import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Mail, Phone, Globe, MessageSquare, Star, MapPin } from "lucide-react";
import { InquiryCompany, MultiLanguageText } from "@/types/inquiry";

interface CompanyInfoProps {
  company: InquiryCompany;
  title?: string;
}

export const CompanyInfo = ({ company, title }: CompanyInfoProps) => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();

  // 获取多语言文本的辅助函数
  const getLocalizedText = (text: MultiLanguageText): string => {
    const langKey = currentLanguage as keyof MultiLanguageText;
    return text[langKey] || text['zh-CN'];
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Building2 className="w-5 h-5" />
          {title || t('inquiry.supplierInfo')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 公司名称 */}
        <div className="space-y-1">
          <h3 className="font-medium text-base">
            {getLocalizedText(company.name)}
          </h3>
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
            <span className="text-sm text-muted-foreground">3.00 / 5.0</span>
          </div>
        </div>

        {/* 地址 */}
        <div className="flex items-start gap-3">
          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
          <span className="text-sm text-muted-foreground leading-relaxed">
            江苏省南京市江宁区麒麟街道智汇路186号启迪城A6B
          </span>
        </div>

        {/* 电话 */}
        <div className="flex items-center gap-3">
          <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="text-sm text-muted-foreground">
            15888888888
          </span>
        </div>

        {/* 邮箱 */}
        <div className="flex items-center gap-3">
          <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="text-sm text-muted-foreground">
            shresta574@zoowayss.top
          </span>
        </div>

        {/* 网站 */}
        <div className="flex items-center gap-3">
          <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
          <a 
            href="http://www.baidu.com" 
            className="text-sm text-blue-600 hover:underline"
            target="_blank" 
            rel="noopener noreferrer"
          >
            http://www.baidu.com
          </a>
        </div>

        {/* 公司类型标签 */}
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
          <Badge variant="secondary" className="text-xs">
            小微企业
          </Badge>
        </div>

        {/* 经营范围等其他信息 */}
        <div className="space-y-2 pt-2 border-t">
          <div>
            <span className="text-sm font-medium">经营范围</span>
            <p className="text-sm text-muted-foreground mt-1">很广</p>
          </div>
          
          <div>
            <span className="text-sm font-medium">主营产品</span>
            <p className="text-sm text-muted-foreground mt-1">产品</p>
          </div>

          <div>
            <span className="text-sm font-medium">业务类别</span>
            <div className="flex gap-2 mt-1">
              <Badge variant="outline" className="text-xs">制剂生产</Badge>
              <Badge variant="outline" className="text-xs">国内贸易</Badge>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="space-y-2 pt-4 border-t">
          <Button 
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            size="sm"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            发送消息
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full" 
            size="sm"
          >
            <Building2 className="w-4 h-4 mr-2" />
            查看档案
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};