import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { RegistrationStatusBadge } from './RegistrationStatusBadge';
import { RegistrationRequest } from '@/types/registration';
import { useTranslation } from 'react-i18next';
import { CalendarDays, Globe, FileText, Building2, Package, Target } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN, enUS, es } from 'date-fns/locale';
import { useLanguage } from '@/hooks/useLanguage';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/MockAuthContext';

interface RegistrationListCardProps {
  registration: RegistrationRequest;
}

export const RegistrationListCard: React.FC<RegistrationListCardProps> = ({ registration }) => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const navigate = useNavigate();
  const { currentUserType } = useAuth();

  const getDateLocale = () => {
    switch (currentLanguage) {
      case 'zh':
        return zhCN;
      case 'es':
        return es;
      default:
        return enUS;
    }
  };

  const handleClick = () => {
    navigate(`/registrations/${registration.id}`);
  };

  const formatBudget = () => {
    const { amount, currency } = registration.details.budget;
    return new Intl.NumberFormat(currentLanguage === 'zh' ? 'zh-CN' : currentLanguage === 'es' ? 'es-ES' : 'en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  return (
    <Card 
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* 头部信息 */}
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-foreground">
                  {registration.regReqNo}
                </h3>
                <RegistrationStatusBadge status={registration.status} />
              </div>
              <p className="text-sm text-muted-foreground">
                {t('registration.createdAt', '创建时间')}: {format(new Date(registration.createdAt), 'PPP', { locale: getDateLocale() })}
              </p>
            </div>
            {registration.deadline && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <CalendarDays className="w-4 h-4" />
                <span>{t('registration.deadline', '截止日期')}: {format(new Date(registration.deadline), 'PP', { locale: getDateLocale() })}</span>
              </div>
            )}
          </div>

          {/* 产品信息 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Package className="w-5 h-5 text-primary mt-0.5" />
              <div className="flex-1 space-y-2">
                <h4 className="font-medium text-foreground">
                  {registration.productSnapshot.name}
                </h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <div>{t('product.category', '类别')}: {registration.productSnapshot.category}</div>
                  <div>{t('product.formulation', '剂型')}: {registration.productSnapshot.formulation}</div>
                  <div>{t('product.activeIngredient', '有效成分')}: {registration.productSnapshot.activeIngredient}</div>
                  <div>{t('product.content', '含量')}: {registration.productSnapshot.content}</div>
                </div>
              </div>
            </div>
          </div>

          {/* 登记详情 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t('registration.targetCountry', '目标国家')}</p>
                <p className="text-sm font-medium">{registration.details.targetCountry}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t('registration.budget', '预算')}</p>
                <p className="text-sm font-medium">{formatBudget()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t('registration.docs', '文档要求')}</p>
                <p className="text-sm font-medium">{registration.details.docReqs.length} {t('registration.items', '项')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">
                  {currentUserType === 'buyer' ? t('registration.supplier', '供应商') : t('registration.buyer', '采购商')}
                </p>
                <p className="text-sm font-medium">
                  {currentUserType === 'buyer' 
                    ? registration.supplier?.companyName || '-'
                    : registration.buyer?.companyName || '-'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* 其他信息 */}
          <div className="flex flex-wrap gap-2 text-sm">
            {registration.details.isExclusive && (
              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">
                {t('registration.exclusive', '独家登记')}
              </span>
            )}
            {registration.details.sampleReq.needed && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                {t('registration.sampleRequired', '需要样品')}
              </span>
            )}
            <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded">
              {t('registration.timeline', '时间周期')}: {registration.details.timeline}
            </span>
          </div>

          {/* 进度信息 */}
          {registration.status === 'in_progress' && registration.progressNote && (
            <div className="border-t pt-3">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">{t('registration.latestProgress', '最新进展')}:</span> {registration.progressNote}
              </p>
              {registration.estimatedCompletionDate && (
                <p className="text-sm text-muted-foreground mt-1">
                  {t('registration.estimatedCompletion', '预计完成')}: {format(new Date(registration.estimatedCompletionDate), 'PP', { locale: getDateLocale() })}
                </p>
              )}
            </div>
          )}

          {/* 拒绝原因 */}
          {registration.status === 'declined' && registration.rejectReason && (
            <div className="border-t pt-3">
              <p className="text-sm text-red-600">
                <span className="font-medium">{t('registration.rejectReason', '拒绝原因')}:</span> {registration.rejectReason}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};