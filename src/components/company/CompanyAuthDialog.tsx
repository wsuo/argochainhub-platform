import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/hooks/useLanguage';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/MockAuthContext';
import { CompanyAuthService } from '@/services/companyAuthService';
import { CompanyAuthRequest, COMPANY_SIZES, BUSINESS_CATEGORIES, COUNTRIES } from '@/types/company';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Building2, CheckCircle, AlertCircle } from 'lucide-react';

interface CompanyAuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// 表单验证schema
const companyAuthSchema = z.object({
  companyName: z.string().min(2, '公司名称至少2个字符'),
  businessScope: z.string().min(10, '业务范围至少10个字符'),
  mainProducts: z.string().min(5, '主营产品至少5个字符'),
  mainSuppliers: z.string().min(3, '主要供应商至少3个字符'),
  companySize: z.enum(['small', 'medium', 'large']),
  country: z.string().min(2, '请选择国家'),
  businessCategories: z.array(z.string()).min(1, '至少选择一个业务类别'),
  phone: z.string().min(10, '电话号码至少10个字符'),
  address: z.string().min(10, '地址至少10个字符'),
  registrationNumber: z.string().min(5, '注册号至少5个字符'),
  website: z.string().optional(),
  taxNumber: z.string().optional(),
  annualImportExportValue: z.number().optional(),
});

type FormData = z.infer<typeof companyAuthSchema>;

export const CompanyAuthDialog: React.FC<CompanyAuthDialogProps> = ({
  open,
  onOpenChange
}) => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [step, setStep] = useState<'form' | 'success'>('form');

  const errorHandler = useErrorHandler({
    businessContext: { module: 'company', action: 'create', resourceType: 'authentication' }
  });

  const form = useForm<FormData>({
    resolver: zodResolver(companyAuthSchema),
    defaultValues: {
      companySize: 'medium',
      country: 'cn',
      businessCategories: [],
    }
  });

  const submitMutation = useMutation({
    mutationFn: async (data: FormData) => {
      // 根据当前语言创建多语言文本对象
      const createMultiLanguageText = (text: string) => {
        const multiLangText: any = {};
        
        // 只设置当前语言，其他语言留空
        if (currentLanguage === 'zh') {
          multiLangText['zh-CN'] = text;
          multiLangText['en'] = '';
          multiLangText['es'] = '';
        } else if (currentLanguage === 'en') {
          multiLangText['zh-CN'] = '';
          multiLangText['en'] = text;
          multiLangText['es'] = '';
        } else if (currentLanguage === 'es') {
          multiLangText['zh-CN'] = '';
          multiLangText['en'] = '';
          multiLangText['es'] = text;
        } else {
          // 默认情况，设置为中文
          multiLangText['zh-CN'] = text;
          multiLangText['en'] = '';
          multiLangText['es'] = '';
        }
        
        return multiLangText;
      };

      // 转换表单数据为API格式
      const requestData: CompanyAuthRequest = {
        companyName: createMultiLanguageText(data.companyName),
        businessScope: createMultiLanguageText(data.businessScope),
        mainProducts: createMultiLanguageText(data.mainProducts),
        mainSuppliers: createMultiLanguageText(data.mainSuppliers),
        companySize: data.companySize,
        country: data.country,
        businessCategories: data.businessCategories,
        phone: data.phone,
        address: data.address,
        registrationNumber: data.registrationNumber,
        website: data.website,
        taxNumber: data.taxNumber,
        annualImportExportValue: data.annualImportExportValue,
      };

      return CompanyAuthService.submitCompanyAuth(requestData);
    },
    onSuccess: (data) => {
      setStep('success');
      // 可以选择刷新用户信息
      // refreshUser();
    },
    onError: (error) => {
      errorHandler.handleError(error);
    }
  });

  const handleSubmit = (data: FormData) => {
    submitMutation.mutate(data);
  };

  const handleClose = () => {
    if (step === 'success') {
      // 认证成功后返回首页
      onOpenChange(false);
      navigate('/');
    } else {
      onOpenChange(false);
    }
  };

  const handleBusinessCategoryChange = (categoryValue: string, checked: boolean) => {
    const currentCategories = form.getValues('businessCategories');
    if (checked) {
      form.setValue('businessCategories', [...currentCategories, categoryValue]);
    } else {
      form.setValue('businessCategories', currentCategories.filter(c => c !== categoryValue));
    }
  };

  if (step === 'success') {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 p-3 rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <DialogTitle className="text-xl">认证申请提交成功</DialogTitle>
            <DialogDescription className="text-base">
              您的企业认证申请已提交成功，请等待管理员审核通过。审核结果将通过邮件或系统通知告知您。
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center pt-4">
            <Button onClick={handleClose} className="min-w-32">
              返回首页
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">企业认证申请</DialogTitle>
              <DialogDescription>
                完善企业信息以获得完整的平台功能访问权限
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* 错误提示 */}
          {errorHandler.hasError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {errorHandler.getErrorMessage()}
              </AlertDescription>
            </Alert>
          )}

          {/* 企业基本信息 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">企业基本信息</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="companyName">公司名称 *</Label>
                <Input
                  id="companyName"
                  {...form.register('companyName')}
                  placeholder={currentLanguage === 'zh' ? '请输入公司名称' : 'Company Name'}
                />
                {form.formState.errors.companyName && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.companyName.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="phone">联系电话 *</Label>
                <Input
                  id="phone"
                  {...form.register('phone')}
                  placeholder="+86-21-12345678"
                />
                {form.formState.errors.phone && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.phone.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="registrationNumber">工商注册号 *</Label>
                <Input
                  id="registrationNumber"
                  {...form.register('registrationNumber')}
                  placeholder="91310000123456789X"
                />
                {form.formState.errors.registrationNumber && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.registrationNumber.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="address">公司地址 *</Label>
                <Input
                  id="address"
                  {...form.register('address')}
                  placeholder={currentLanguage === 'zh' ? '请输入详细的公司地址' : 'Company Address'}
                />
                {form.formState.errors.address && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.address.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 业务信息 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">业务信息</h3>
            
            <div>
              <Label htmlFor="businessScope">业务范围 *</Label>
              <Textarea
                id="businessScope"
                {...form.register('businessScope')}
                placeholder={
                  currentLanguage === 'zh' 
                    ? '描述公司的主要业务范围'
                    : 'Describe the main business scope'
                }
                rows={3}
              />
              {form.formState.errors.businessScope && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.businessScope.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="mainProducts">主营产品 *</Label>
                <Textarea
                  id="mainProducts"
                  {...form.register('mainProducts')}
                  placeholder={
                    currentLanguage === 'zh' 
                      ? '主要经营的产品类型'
                      : 'Main products and services'
                  }
                  rows={2}
                />
                {form.formState.errors.mainProducts && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.mainProducts.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="mainSuppliers">主要供应商 *</Label>
                <Input
                  id="mainSuppliers"
                  {...form.register('mainSuppliers')}
                  placeholder={
                    currentLanguage === 'zh' 
                      ? '先正达、拜耳作物科学、巴斯夫'
                      : 'Syngenta, Bayer Crop Science, BASF'
                  }
                />
                {form.formState.errors.mainSuppliers && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.mainSuppliers.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 企业规模和地区 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">企业规模和地区</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>企业规模 *</Label>
                <Controller
                  name="companySize"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择企业规模" />
                      </SelectTrigger>
                      <SelectContent>
                        {COMPANY_SIZES.map((size) => (
                          <SelectItem key={size.value} value={size.value}>
                            {size.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.companySize && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.companySize.message}
                  </p>
                )}
              </div>

              <div>
                <Label>所在国家 *</Label>
                <Controller
                  name="country"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择国家" />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map((country) => (
                          <SelectItem key={country.value} value={country.value}>
                            {country.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.country && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.country.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="annualImportExportValue">年进出口额（美元）</Label>
                <Input
                  id="annualImportExportValue"
                  type="number"
                  {...form.register('annualImportExportValue', { valueAsNumber: true })}
                  placeholder="1500000"
                />
              </div>
            </div>
          </div>

          {/* 业务类别 */}
          <div className="space-y-4">
            <Label>业务类别 *（至少选择一项）</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {BUSINESS_CATEGORIES.map((category) => (
                <div key={category.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`category-${category.value}`}
                    onCheckedChange={(checked) => 
                      handleBusinessCategoryChange(category.value, checked as boolean)
                    }
                  />
                  <Label htmlFor={`category-${category.value}`} className="text-sm">
                    {category.label}
                  </Label>
                </div>
              ))}
            </div>
            {form.formState.errors.businessCategories && (
              <p className="text-sm text-red-600">
                {form.formState.errors.businessCategories.message}
              </p>
            )}
          </div>

          {/* 可选信息 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">可选信息</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="website">公司网站</Label>
                <Input
                  id="website"
                  {...form.register('website')}
                  placeholder="https://www.company.com"
                />
              </div>

              <div>
                <Label htmlFor="taxNumber">税号</Label>
                <Input
                  id="taxNumber"
                  {...form.register('taxNumber')}
                  placeholder="310000123456789"
                />
              </div>
            </div>
          </div>

          {/* 提交按钮 */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitMutation.isPending}
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={submitMutation.isPending}
              className="min-w-32"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  提交中...
                </>
              ) : (
                '提交认证申请'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};