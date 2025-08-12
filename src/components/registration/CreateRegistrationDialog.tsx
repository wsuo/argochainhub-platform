import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RegistrationService } from '@/services/registrationService';
import { dictionaryService } from '@/services/dictionaryService';
import { toast } from 'sonner';
import { useLanguage } from '@/hooks/useLanguage';
import { CreateRegistrationRequestPayload } from '@/types/registration';
import { Loader2 } from 'lucide-react';

interface CreateRegistrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateRegistrationDialog: React.FC<CreateRegistrationDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<Partial<CreateRegistrationRequestPayload>>({
    supplierId: undefined,
    productId: undefined,
    targetCountry: '',
    isExclusive: false,
    docReqs: [],
    sampleReq: {
      needed: false,
      quantity: undefined,
      unit: '',
    },
    timeline: '',
    budgetAmount: undefined,
    budgetCurrency: 'USD',
    additionalRequirements: '',
    deadline: '',
  });

  // 获取字典数据
  const { data: countryDict = [] } = useQuery({
    queryKey: ['country-dict'],
    queryFn: () => dictionaryService.getCountries(),
    staleTime: 10 * 60 * 1000,
  });

  const { data: documentDict = [] } = useQuery({
    queryKey: ['document-type-dict'],
    queryFn: () => dictionaryService.getDocumentTypes(),
    staleTime: 10 * 60 * 1000,
  });

  const { data: currencyDict = [] } = useQuery({
    queryKey: ['currency-dict'],
    queryFn: () => dictionaryService.getCurrencies(),
    staleTime: 10 * 60 * 1000,
  });

  const getLocalizedLabel = (item: { name?: Record<string, string>; label?: string; code: string }) => {
    const langKey = currentLanguage === 'zh' ? 'zh-CN' : currentLanguage;
    return item.name?.[langKey] || item.name?.['zh-CN'] || item.label || item.code;
  };

  // 创建登记申请
  const createMutation = useMutation({
    mutationFn: (payload: CreateRegistrationRequestPayload) => 
      RegistrationService.createRegistrationRequest(payload),
    onSuccess: () => {
      toast.success(t('registration.createSuccess', '登记申请创建成功'));
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
      queryClient.invalidateQueries({ queryKey: ['registration-stats'] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || t('registration.createFailed', '创建登记申请失败'));
    },
  });

  const resetForm = () => {
    setFormData({
      supplierId: undefined,
      productId: undefined,
      targetCountry: '',
      isExclusive: false,
      docReqs: [],
      sampleReq: {
        needed: false,
        quantity: undefined,
        unit: '',
      },
      timeline: '',
      budgetAmount: undefined,
      budgetCurrency: 'USD',
      additionalRequirements: '',
      deadline: '',
    });
  };

  const handleSubmit = () => {
    // 验证必填字段
    if (!formData.supplierId || !formData.productId || !formData.targetCountry || 
        !formData.timeline || !formData.budgetAmount || !formData.deadline) {
      toast.error(t('registration.fillRequired', '请填写所有必填字段'));
      return;
    }

    if (formData.docReqs?.length === 0) {
      toast.error(t('registration.selectDocuments', '请至少选择一个文档要求'));
      return;
    }

    createMutation.mutate(formData as CreateRegistrationRequestPayload);
  };

  const handleDocReqChange = (docType: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      docReqs: checked 
        ? [...(prev.docReqs || []), docType]
        : (prev.docReqs || []).filter(d => d !== docType)
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('registration.createTitle', '创建登记申请')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 供应商和产品选择 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier">{t('registration.supplier', '供应商')} *</Label>
              <Input
                id="supplier"
                type="number"
                placeholder={t('registration.enterSupplierId', '输入供应商ID')}
                value={formData.supplierId || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, supplierId: parseInt(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product">{t('registration.product', '产品')} *</Label>
              <Input
                id="product"
                type="number"
                placeholder={t('registration.enterProductId', '输入产品ID')}
                value={formData.productId || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, productId: parseInt(e.target.value) }))}
              />
            </div>
          </div>

          {/* 目标国家和截止日期 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country">{t('registration.targetCountry', '目标国家')} *</Label>
              <Select
                value={formData.targetCountry}
                onValueChange={(value) => setFormData(prev => ({ ...prev, targetCountry: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('registration.selectCountry', '选择国家')} />
                </SelectTrigger>
                <SelectContent>
                  {countryDict.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {getLocalizedLabel(country)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">{t('registration.deadline', '截止日期')} *</Label>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
              />
            </div>
          </div>

          {/* 独家登记 */}
          <div className="flex items-center space-x-2">
            <Switch
              id="exclusive"
              checked={formData.isExclusive}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isExclusive: checked }))}
            />
            <Label htmlFor="exclusive">{t('registration.exclusive', '独家登记')}</Label>
          </div>

          {/* 文档要求 */}
          <div className="space-y-2">
            <Label>{t('registration.documentRequirements', '文档要求')} *</Label>
            <div className="grid grid-cols-2 gap-2">
              {documentDict.map((doc) => (
                <div key={doc.code} className="flex items-center space-x-2">
                  <Checkbox
                    id={doc.code}
                    checked={formData.docReqs?.includes(doc.code)}
                    onCheckedChange={(checked) => handleDocReqChange(doc.code, checked as boolean)}
                  />
                  <Label htmlFor={doc.code} className="text-sm font-normal">
                    {getLocalizedLabel(doc)}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* 样品要求 */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Switch
                id="sample"
                checked={formData.sampleReq?.needed}
                onCheckedChange={(checked) => setFormData(prev => ({ 
                  ...prev, 
                  sampleReq: { ...prev.sampleReq!, needed: checked }
                }))}
              />
              <Label htmlFor="sample">{t('registration.sampleRequired', '需要样品')}</Label>
            </div>
            {formData.sampleReq?.needed && (
              <div className="grid grid-cols-2 gap-4 mt-2">
                <Input
                  type="number"
                  placeholder={t('registration.sampleQuantity', '样品数量')}
                  value={formData.sampleReq.quantity || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    sampleReq: { ...prev.sampleReq!, quantity: parseInt(e.target.value) }
                  }))}
                />
                <Input
                  placeholder={t('registration.sampleUnit', '单位 (如: g, ml)')}
                  value={formData.sampleReq.unit || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    sampleReq: { ...prev.sampleReq!, unit: e.target.value }
                  }))}
                />
              </div>
            )}
          </div>

          {/* 时间周期 */}
          <div className="space-y-2">
            <Label htmlFor="timeline">{t('registration.timeline', '时间周期')} *</Label>
            <Input
              id="timeline"
              placeholder={t('registration.timelinePlaceholder', '如: 6个月内')}
              value={formData.timeline}
              onChange={(e) => setFormData(prev => ({ ...prev, timeline: e.target.value }))}
            />
          </div>

          {/* 预算 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget">{t('registration.budgetAmount', '预算金额')} *</Label>
              <Input
                id="budget"
                type="number"
                placeholder={t('registration.enterAmount', '输入金额')}
                value={formData.budgetAmount || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, budgetAmount: parseFloat(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">{t('registration.currency', '货币')}</Label>
              <Select
                value={formData.budgetCurrency}
                onValueChange={(value) => setFormData(prev => ({ ...prev, budgetCurrency: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencyDict.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.code} - {getLocalizedLabel(currency)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 其他要求 */}
          <div className="space-y-2">
            <Label htmlFor="additional">{t('registration.additionalRequirements', '其他要求')}</Label>
            <Textarea
              id="additional"
              placeholder={t('registration.additionalPlaceholder', '请输入其他特殊要求...')}
              value={formData.additionalRequirements}
              onChange={(e) => setFormData(prev => ({ ...prev, additionalRequirements: e.target.value }))}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel', '取消')}
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={createMutation.isPending}
          >
            {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('common.submit', '提交')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};