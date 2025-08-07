import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/hooks/useLanguage';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/contexts/MockAuthContext';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Product, MultiLanguageText } from '@/types/product';
import { CreateInquiryRequest } from '@/types/inquiry';
import { InquiryService } from '@/services/inquiryService';
import { useErrorHandler } from '@/hooks/useErrorHandler';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, MessageSquare, CheckCircle, AlertCircle, Package, Building2, Star } from 'lucide-react';

interface CreateInquiryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product; // 可选的产品信息，用于自动填充
}

// 表单验证schema
const inquirySchema = z.object({
  productName: z.string().min(2, '产品名称至少2个字符'),
  quantity: z.number().min(1, '数量必须大于0'),
  quantityUnit: z.string().min(1, '请选择数量单位'),
  deliveryLocation: z.string().min(2, '交货地点至少2个字符'),
  deadline: z.string().min(1, '请选择截止日期'),
  tradeTerms: z.string().optional(),
  paymentMethod: z.string().optional(),
  packagingRequirements: z.string().optional(),
  remarks: z.string().optional(),
});

type FormData = z.infer<typeof inquirySchema>;

export const CreateInquiryDialog: React.FC<CreateInquiryDialogProps> = ({
  open,
  onOpenChange,
  product
}) => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const { user } = useAuth();
  const [step, setStep] = useState<'form' | 'success'>('form');
  const quantityInputRef = useRef<HTMLInputElement>(null);

  const errorHandler = useErrorHandler({
    businessContext: { module: 'inquiry', action: 'create', resourceType: 'inquiry' }
  });

  // 获取多语言文本的辅助函数
  const getLocalizedText = (text: MultiLanguageText | null): string => {
    if (!text) return '';
    const langKey = currentLanguage as keyof MultiLanguageText;
    return text[langKey] || text['zh-CN'] || '';
  };

  const form = useForm<FormData>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      productName: product ? getLocalizedText(product.name) : '',
      quantity: 1,
      quantityUnit: 'kg',
      deliveryLocation: '',
      deadline: '',
      tradeTerms: 'FOB',
      paymentMethod: 'T/T',
      packagingRequirements: '',
      remarks: '',
    }
  });

  const submitMutation = useMutation({
    mutationFn: async (data: FormData) => {
      // 转换表单数据为API请求格式
      const inquiryRequest: CreateInquiryRequest = {
        productName: data.productName,
        productId: product?.id,
        supplierId: product?.supplier.id,
        quantity: data.quantity,
        quantityUnit: data.quantityUnit,
        deliveryLocation: data.deliveryLocation,
        deadline: data.deadline,
        tradeTerms: data.tradeTerms,
        paymentMethod: data.paymentMethod,
        packagingRequirements: data.packagingRequirements,
        remarks: data.remarks,
      };

      return InquiryService.createInquiry(inquiryRequest);
    },
    onSuccess: (response) => {
      console.log('Inquiry created successfully:', response);
      setStep('success');
    },
    onError: (error) => {
      console.error('Failed to create inquiry:', error);
      errorHandler.handleError(error);
    }
  });

  const handleSubmit = (data: FormData) => {
    submitMutation.mutate(data);
  };

  // 对话框打开时聚焦到数量输入框
  useEffect(() => {
    if (open && step === 'form') {
      // 使用多个定时器确保聚焦生效，覆盖其他可能的聚焦逻辑
      const timer1 = setTimeout(() => {
        quantityInputRef.current?.focus();
        quantityInputRef.current?.select();
      }, 50);
      
      const timer2 = setTimeout(() => {
        quantityInputRef.current?.focus();
        quantityInputRef.current?.select();
      }, 200);
      
      const timer3 = setTimeout(() => {
        quantityInputRef.current?.focus();
        quantityInputRef.current?.select();
      }, 500);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [open, step]);

  const handleClose = () => {
    if (step === 'success') {
      // 询价创建成功后关闭弹窗
      onOpenChange(false);
      setStep('form');
      form.reset();
    } else {
      onOpenChange(false);
    }
  };

  // 成功状态
  if (step === 'success') {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 p-3 rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <DialogTitle className="text-xl">询价提交成功</DialogTitle>
            <DialogDescription className="text-base">
              您的询价请求已成功发送给供应商，供应商会尽快回复报价信息。您可以在询价管理中查看进度。
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center pt-4">
            <Button onClick={handleClose} className="min-w-32">
              确定
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">创建询价</DialogTitle>
              <DialogDescription>
                向供应商发起询价，获取产品报价和详细信息
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* 如果有产品信息，显示产品和供应商信息卡片 */}
        {product && (
          <div className="space-y-3">
            {/* 产品信息 */}
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">{getLocalizedText(product.name)}</p>
                  <p className="text-sm text-muted-foreground">
                    {getLocalizedText(product.pesticideName)} • {product.formulation}
                  </p>
                </div>
              </div>
            </div>
            
            {/* 供应商信息 */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">询价供应商</p>
                  <p className="text-sm text-blue-700">
                    {getLocalizedText(product.supplier.name)}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${
                          i < Math.floor(parseFloat(product.supplier.rating))
                            ? 'text-yellow-500 fill-yellow-500'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="text-xs text-blue-600 ml-1">
                      {product.supplier.rating}
                    </span>
                    {product.supplier.isTop100 && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded ml-2">
                        Top100
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {/* 错误提示 */}
          {errorHandler.hasError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {errorHandler.getErrorMessage()}
              </AlertDescription>
            </Alert>
          )}

          {/* 产品和数量信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="productName">产品名称 *</Label>
              <Input
                id="productName"
                {...form.register('productName')}
                placeholder="请输入产品名称"
                readOnly={!!product}
                className={product ? 'bg-muted cursor-not-allowed' : ''}
                autoFocus={false}
                tabIndex={product ? -1 : 1}
              />
              {form.formState.errors.productName && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.productName.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="quantity">需求数量 *</Label>
                <Input
                  id="quantity"
                  ref={quantityInputRef}
                  type="number"
                  {...form.register('quantity', { valueAsNumber: true })}
                  placeholder="1000"
                  autoFocus={true}
                  tabIndex={0}
                />
                {form.formState.errors.quantity && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.quantity.message}
                  </p>
                )}
              </div>
              
              <div>
                <Label>单位 *</Label>
                <Controller
                  name="quantityUnit"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择单位" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">千克(kg)</SelectItem>
                        <SelectItem value="ton">吨(ton)</SelectItem>
                        <SelectItem value="l">升(L)</SelectItem>
                        <SelectItem value="box">箱</SelectItem>
                        <SelectItem value="bottle">瓶</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          </div>

          {/* 交货和时间信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="deliveryLocation">交货地点 *</Label>
              <Input
                id="deliveryLocation"
                {...form.register('deliveryLocation')}
                placeholder="如：中国上海"
              />
              {form.formState.errors.deliveryLocation && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.deliveryLocation.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="deadline">截止日期 *</Label>
              <Input
                id="deadline"
                type="date"
                {...form.register('deadline')}
                min={new Date().toISOString().split('T')[0]}
              />
              {form.formState.errors.deadline && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.deadline.message}
                </p>
              )}
            </div>
          </div>

          {/* 贸易条件 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>贸易条件</Label>
              <Controller
                name="tradeTerms"
                control={form.control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择贸易条件" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FOB">FOB</SelectItem>
                      <SelectItem value="CIF">CIF</SelectItem>
                      <SelectItem value="CFR">CFR</SelectItem>
                      <SelectItem value="EXW">EXW</SelectItem>
                      <SelectItem value="DDP">DDP</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div>
              <Label>付款方式</Label>
              <Controller
                name="paymentMethod"
                control={form.control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择付款方式" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="T/T">电汇 (T/T)</SelectItem>
                      <SelectItem value="L/C">信用证 (L/C)</SelectItem>
                      <SelectItem value="D/P">付款交单 (D/P)</SelectItem>
                      <SelectItem value="D/A">承兑交单 (D/A)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {/* 包装要求 */}
          <div>
            <Label htmlFor="packagingRequirements">包装要求</Label>
            <Input
              id="packagingRequirements"
              {...form.register('packagingRequirements')}
              placeholder="请描述包装要求"
            />
          </div>

          {/* 备注信息 */}
          <div>
            <Label htmlFor="remarks">备注信息</Label>
            <Textarea
              id="remarks"
              {...form.register('remarks')}
              placeholder="其他要求或备注信息"
              rows={3}
            />
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
                '提交询价'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};