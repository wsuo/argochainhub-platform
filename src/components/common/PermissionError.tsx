import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CompanyAuthDialog } from '@/components/company/CompanyAuthDialog';
import { 
  Shield, 
  Building2, 
  UserCheck, 
  ArrowLeft,
  MessageCircle,
  ExternalLink
} from 'lucide-react';
import { ErrorType, ParsedError } from '@/types/error';
import { ErrorParser } from '@/utils/errorParser';

interface PermissionErrorProps {
  error: ParsedError;
  businessContext?: string;
  onRetry?: () => void;
  onNavigateBack?: () => void;
  className?: string;
}

export const PermissionError: React.FC<PermissionErrorProps> = ({
  error,
  businessContext = 'system',
  onRetry,
  onNavigateBack,
  className = ''
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showCompanyAuthDialog, setShowCompanyAuthDialog] = useState(false);

  // 只处理权限相关错误
  if (!ErrorParser.isPermissionError(error.type)) {
    return null;
  }

  // 获取权限错误的具体信息和解决方案
  const getPermissionErrorInfo = (errorType: ErrorType) => {
    switch (errorType) {
      case ErrorType.PERMISSION_COMPANY_NOT_ASSOCIATED:
        return {
          icon: Building2,
          title: t('errors.permission.companyNotAssociated.title', { 
            defaultValue: '需要公司认证' 
          }),
          description: t('errors.permission.companyNotAssociated.description', { 
            defaultValue: '您的账户尚未关联公司，无法访问此功能。请先完成公司认证流程。' 
          }),
          solutions: [
            {
              type: 'primary' as const,
              label: t('errors.permission.companyNotAssociated.gotoAuth', { 
                defaultValue: '前往公司认证' 
              }),
              icon: Building2,
              action: () => setShowCompanyAuthDialog(true)
            },
            {
              type: 'secondary' as const,
              label: t('common.contactSupport', { 
                defaultValue: '联系客服' 
              }),
              icon: MessageCircle,
              action: () => {
                // 打开客服聊天或跳转到帮助页面
                window.open('/help/contact', '_blank');
              }
            }
          ]
        };

      case ErrorType.PERMISSION_INVALID_COMPANY_TYPE:
        return {
          icon: UserCheck,
          title: t('errors.permission.invalidCompanyType.title', { 
            defaultValue: '公司类型不匹配' 
          }),
          description: t('errors.permission.invalidCompanyType.description', { 
            defaultValue: '您的公司类型无法访问此功能。此功能仅限特定类型的公司使用。' 
          }),
          solutions: [
            {
              type: 'primary' as const,
              label: t('errors.permission.invalidCompanyType.checkProfile', { 
                defaultValue: '查看公司资料' 
              }),
              icon: Building2,
              action: () => navigate('/profile/company')
            },
            {
              type: 'secondary' as const,
              label: t('common.contactSupport', { 
                defaultValue: '联系客服' 
              }),
              icon: MessageCircle,
              action: () => {
                window.open('/help/contact', '_blank');
              }
            }
          ]
        };

      case ErrorType.PERMISSION_ACCESS_DENIED:
        return {
          icon: Shield,
          title: t('errors.permission.accessDenied.title', { 
            defaultValue: '访问权限不足' 
          }),
          description: t('errors.permission.accessDenied.description', { 
            defaultValue: '您没有权限访问此资源。可能是因为您不是相关的业务参与方。' 
          }),
          solutions: [
            {
              type: 'primary' as const,
              label: t('common.goBack', { 
                defaultValue: '返回上一页' 
              }),
              icon: ArrowLeft,
              action: () => {
                if (onNavigateBack) {
                  onNavigateBack();
                } else {
                  navigate(-1);
                }
              }
            }
          ]
        };

      case ErrorType.PERMISSION_ONLY_BUYER:
        return {
          icon: UserCheck,
          title: t('errors.permission.onlyBuyer.title', { 
            defaultValue: '仅限采购商' 
          }),
          description: t('errors.permission.onlyBuyer.description', { 
            defaultValue: '此功能仅限采购商使用。如果您是供应商，请使用相应的供应商功能。' 
          }),
          solutions: [
            {
              type: 'primary' as const,
              label: t('errors.permission.onlyBuyer.switchToSupplier', { 
                defaultValue: '前往供应商功能' 
              }),
              icon: ExternalLink,
              action: () => navigate('/supplier')
            }
          ]
        };

      case ErrorType.PERMISSION_ONLY_SUPPLIER:
        return {
          icon: UserCheck,
          title: t('errors.permission.onlySupplier.title', { 
            defaultValue: '仅限供应商' 
          }),
          description: t('errors.permission.onlySupplier.description', { 
            defaultValue: '此功能仅限供应商使用。如果您是采购商，请使用相应的采购商功能。' 
          }),
          solutions: [
            {
              type: 'primary' as const,
              label: t('errors.permission.onlySupplier.switchToBuyer', { 
                defaultValue: '前往采购商功能' 
              }),
              icon: ExternalLink,
              action: () => navigate('/buyer')
            }
          ]
        };

      default:
        return {
          icon: Shield,
          title: t('errors.permission.generic.title', { 
            defaultValue: '权限不足' 
          }),
          description: t('errors.permission.generic.description', { 
            defaultValue: '您暂时无法访问此功能，请检查您的账户权限设置。' 
          }),
          solutions: []
        };
    }
  };

  const errorInfo = getPermissionErrorInfo(error.type);
  const ErrorIcon = errorInfo.icon;

  return (
    <div className={`w-full max-w-2xl mx-auto ${className}`}>
      <Card className="relative border-orange-200 bg-gradient-to-br from-orange-50/50 to-yellow-50/50 shadow-lg">
        {/* 返回按钮 - 左上角 */}
        {onNavigateBack && (
          <div className="absolute top-4 left-4 z-10">
            <Button variant="ghost" size="sm" onClick={onNavigateBack} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              {t('common.goBack', { defaultValue: '返回' })}
            </Button>
          </div>
        )}
        
        <CardHeader className="text-center pb-6 pt-12">
          <div className="mx-auto mb-4 p-4 rounded-full bg-gradient-to-br from-orange-100 to-orange-200">
            <ErrorIcon className="h-10 w-10 text-orange-600" />
          </div>
          <CardTitle className="text-xl text-gray-800 mb-2">
            {errorInfo.title}
          </CardTitle>
          <CardDescription className="text-gray-600 text-base leading-relaxed max-w-lg mx-auto">
            {errorInfo.description}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* 解决方案按钮 */}
          {errorInfo.solutions.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-800 text-center">
                {t('errors.suggestedActions', { defaultValue: '建议操作' })}
              </h4>
              <div className="flex flex-col gap-3 max-w-md mx-auto">
                {errorInfo.solutions.map((solution, index) => {
                  const SolutionIcon = solution.icon;
                  return (
                    <Button
                      key={index}
                      variant={solution.type === 'primary' ? 'default' : 'outline'}
                      onClick={solution.action}
                      className="flex items-center justify-center gap-2 w-full h-11 text-base"
                      size="lg"
                    >
                      <SolutionIcon className="h-5 w-5" />
                      {solution.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 技术详情（折叠显示） */}
          {error.details && (
            <Alert variant="default" className="border-gray-200">
              <AlertDescription className="text-sm text-gray-600">
                <details>
                  <summary className="cursor-pointer text-gray-800 font-medium hover:text-gray-900">
                    {t('errors.technicalDetails', { defaultValue: '技术详情' })}
                  </summary>
                  <div className="mt-3 p-3 bg-gray-50 rounded-md text-xs font-mono border border-gray-200">
                    {error.details}
                  </div>
                </details>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* 企业认证弹窗 */}
      <CompanyAuthDialog
        open={showCompanyAuthDialog}
        onOpenChange={setShowCompanyAuthDialog}
      />
    </div>
  );
};