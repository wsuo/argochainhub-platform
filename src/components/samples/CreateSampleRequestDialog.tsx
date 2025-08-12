import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useCreateSampleRequest, useSampleFilters } from "@/hooks/useSample";
import { ShippingMethod, type CreateSampleRequestForm } from "@/types/sample";
import type { Product } from "@/types/product";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  product?: Product;
  supplierId?: number;
  supplierName?: string;
}

export const CreateSampleRequestDialog = ({ 
  open, 
  onOpenChange, 
  product, 
  supplierId,
  supplierName 
}: Props) => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const { mutateAsync, isPending } = useCreateSampleRequest();
  const { data: filters } = useSampleFilters();
  
  // Form state
  const [formData, setFormData] = useState<Partial<CreateSampleRequestForm>>({
    productId: product?.id,
    supplierId: supplierId,
    quantity: 1,
    unit: 'kg',
    deadline: '',
    details: {
      purpose: '',
      shippingAddress: '',
      shippingMethod: ShippingMethod.EXPRESS_DELIVERY,
      willingnessToPay: {
        paid: false,
        amount: undefined
      },
      specialRequirements: ''
    },
    contactInfo: {
      contactPerson: '',
      phone: '',
      email: ''
    }
  });

  const [deadlineDate, setDeadlineDate] = useState<Date>();
  const [isPaid, setIsPaid] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData(prev => ({ ...prev, productId: product.id }));
    }
    if (supplierId) {
      setFormData(prev => ({ ...prev, supplierId }));
    }
  }, [product, supplierId]);

  const handleSubmit = async () => {
    if (!formData.productId || !formData.supplierId || !formData.quantity || !deadlineDate) {
      return;
    }

    const submitData: CreateSampleRequestForm = {
      productId: formData.productId,
      supplierId: formData.supplierId,
      quantity: formData.quantity!,
      unit: formData.unit!,
      deadline: format(deadlineDate, 'yyyy-MM-dd'),
      details: {
        ...formData.details!,
        willingnessToPay: {
          paid: isPaid,
          amount: isPaid ? formData.details?.willingnessToPay?.amount : undefined
        }
      },
      contactInfo: formData.contactInfo
    };

    await mutateAsync(submitData);
    onOpenChange(false);
    
    // Reset form
    setFormData({
      productId: undefined,
      supplierId: undefined,
      quantity: 1,
      unit: 'kg',
      deadline: '',
      details: {
        purpose: '',
        shippingAddress: '',
        shippingMethod: ShippingMethod.EXPRESS_DELIVERY,
        willingnessToPay: {
          paid: false,
          amount: undefined
        },
        specialRequirements: ''
      },
      contactInfo: {
        contactPerson: '',
        phone: '',
        email: ''
      }
    });
    setDeadlineDate(undefined);
    setIsPaid(false);
  };

  const getLocalizedText = (text: any): string => {
    if (typeof text === 'string') {
      // 尝试解析JSON字符串
      try {
        const parsed = JSON.parse(text);
        if (typeof parsed === 'object' && parsed !== null) {
          const langKey = currentLanguage === 'zh' ? 'zh-CN' : currentLanguage;
          return parsed[langKey] || parsed['zh-CN'] || text;
        }
      } catch {
        // 如果不是JSON字符串，直接返回
        return text;
      }
      return text;
    }
    if (typeof text === 'object' && text !== null) {
      const langKey = currentLanguage === 'zh' ? 'zh-CN' : currentLanguage;
      return text[langKey] || text['zh-CN'] || '';
    }
    return '';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('samples.createDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('samples.createDialog.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Product info */}
          {product && (
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="font-medium">{getLocalizedText(product.name)}</div>
              <div className="text-sm text-muted-foreground">
                {getLocalizedText(product.pesticideName)} • {product.formulation} • {product.totalContent}
              </div>
            </div>
          )}
          
          {/* Supplier info */}
          {supplierName && (
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="text-sm text-muted-foreground">{t('samples.createDialog.supplier')}</div>
              <div className="font-medium">{supplierName}</div>
            </div>
          )}

          {/* Basic info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity">{t('samples.createDialog.quantity')}</Label>
              <Input
                id="quantity"
                type="number"
                min="0.1"
                step="0.1"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  quantity: parseFloat(e.target.value) 
                }))}
              />
            </div>
            <div>
              <Label htmlFor="unit">{t('samples.createDialog.unit')}</Label>
              <Select 
                value={formData.unit} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}
              >
                <SelectTrigger id="unit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="g">g</SelectItem>
                  <SelectItem value="L">L</SelectItem>
                  <SelectItem value="mL">mL</SelectItem>
                  <SelectItem value="ton">ton</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Deadline */}
          <div>
            <Label>{t('samples.createDialog.deadline')}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !deadlineDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {deadlineDate ? format(deadlineDate, "yyyy-MM-dd") : t('samples.createDialog.selectDeadline')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={deadlineDate}
                  onSelect={setDeadlineDate}
                  initialFocus
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Purpose */}
          <div>
            <Label htmlFor="purpose">{t('samples.createDialog.purpose')}</Label>
            <Textarea
              id="purpose"
              placeholder={t('samples.createDialog.purposePlaceholder')}
              value={formData.details?.purpose}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                details: { ...prev.details!, purpose: e.target.value }
              }))}
            />
          </div>

          {/* Shipping info */}
          <div>
            <Label htmlFor="shippingAddress">{t('samples.createDialog.shippingAddress')}</Label>
            <Input
              id="shippingAddress"
              placeholder={t('samples.createDialog.shippingAddressPlaceholder')}
              value={formData.details?.shippingAddress}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                details: { ...prev.details!, shippingAddress: e.target.value }
              }))}
            />
          </div>

          <div>
            <Label htmlFor="shippingMethod">{t('samples.createDialog.shippingMethod')}</Label>
            <Select 
              value={formData.details?.shippingMethod} 
              onValueChange={(value) => setFormData(prev => ({
                ...prev,
                details: { ...prev.details!, shippingMethod: value }
              }))}
            >
              <SelectTrigger id="shippingMethod">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {filters?.data.shippingMethods.map(method => (
                  <SelectItem key={method.value} value={method.value}>
                    {getLocalizedText(method.label)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment willingness */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Switch
                id="isPaid"
                checked={isPaid}
                onCheckedChange={setIsPaid}
              />
              <Label htmlFor="isPaid">{t('samples.createDialog.willingToPay')}</Label>
            </div>
            {isPaid && (
              <div>
                <Label htmlFor="amount">{t('samples.createDialog.amount')}</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={t('samples.createDialog.amountPlaceholder')}
                  value={formData.details?.willingnessToPay?.amount || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    details: {
                      ...prev.details!,
                      willingnessToPay: {
                        paid: true,
                        amount: parseFloat(e.target.value)
                      }
                    }
                  }))}
                />
              </div>
            )}
          </div>

          {/* Special requirements */}
          <div>
            <Label htmlFor="specialRequirements">{t('samples.createDialog.specialRequirements')}</Label>
            <Textarea
              id="specialRequirements"
              placeholder={t('samples.createDialog.specialRequirementsPlaceholder')}
              value={formData.details?.specialRequirements}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                details: { ...prev.details!, specialRequirements: e.target.value }
              }))}
            />
          </div>

          {/* Contact info */}
          <div className="space-y-4">
            <h3 className="font-medium">{t('samples.createDialog.contactInfo')}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contactPerson">{t('samples.createDialog.contactPerson')}</Label>
                <Input
                  id="contactPerson"
                  value={formData.contactInfo?.contactPerson}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    contactInfo: { ...prev.contactInfo!, contactPerson: e.target.value }
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="phone">{t('samples.createDialog.phone')}</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.contactInfo?.phone}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    contactInfo: { ...prev.contactInfo!, phone: e.target.value }
                  }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email">{t('samples.createDialog.email')}</Label>
              <Input
                id="email"
                type="email"
                value={formData.contactInfo?.email}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  contactInfo: { ...prev.contactInfo!, email: e.target.value }
                }))}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isPending || !formData.productId || !formData.supplierId || !deadlineDate}
          >
            {isPending ? t('common.submitting') : t('common.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};