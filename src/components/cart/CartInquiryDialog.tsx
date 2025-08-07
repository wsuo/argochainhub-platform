import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CartItem } from '@/types/cart';
import { cartService } from '@/services/cartService';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';

interface CartInquiryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItems: CartItem[];
  supplierId: string;
  supplierName: string;
  onSuccess?: () => void;
}

export function CartInquiryDialog({ 
  open, 
  onOpenChange, 
  selectedItems, 
  supplierId, 
  supplierName,
  onSuccess 
}: CartInquiryDialogProps) {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  
  const [formData, setFormData] = useState({
    deliveryLocation: '',
    tradeTerms: '',
    paymentMethod: '',
    buyerRemarks: '',
    packagingReqs: {} as Record<string, string>
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!formData.deliveryLocation || !formData.tradeTerms || !formData.paymentMethod) {
      toast({
        title: "请填写完整信息",
        description: "请填写所有必填字段",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const inquiryData = {
        supplierId,
        items: selectedItems.map(item => ({
          cartItemId: item.id,
          packagingReq: formData.packagingReqs[item.id] || ''
        })),
        deliveryLocation: formData.deliveryLocation,
        tradeTerms: formData.tradeTerms,
        paymentMethod: formData.paymentMethod,
        buyerRemarks: formData.buyerRemarks
      };

      const response = await cartService.batchCreateInquiry(inquiryData);
      
      if (response.success) {
        toast({
          title: "询价请求已提交",
          description: `已为${selectedItems.length}个产品提交询价请求`,
          variant: "default"
        });
        
        onOpenChange(false);
        onSuccess?.();
        
        // Reset form
        setFormData({
          deliveryLocation: '',
          tradeTerms: '',
          paymentMethod: '',
          buyerRemarks: '',
          packagingReqs: {}
        });
      }
    } catch (error) {
      console.error('Failed to submit inquiry:', error);
      toast({
        title: "提交失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updatePackagingReq = (itemId: string, req: string) => {
    setFormData(prev => ({
      ...prev,
      packagingReqs: {
        ...prev.packagingReqs,
        [itemId]: req
      }
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>批量询价 - {supplierName}</DialogTitle>
          <DialogDescription>
            为选中的 {selectedItems.length} 个产品提交询价请求
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Selected Products */}
          <div>
            <Label className="text-base font-medium mb-3 block">选中的产品</Label>
            <div className="space-y-3 max-h-40 overflow-y-auto">
              {selectedItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">
                        {item.productSnapshot.name[currentLanguage as keyof typeof item.productSnapshot.name] || 
                         item.productSnapshot.name['zh-CN']}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {item.quantity} {item.unit}
                      </Badge>
                    </div>
                    <div className="mt-2">
                      <Label className="text-xs text-muted-foreground mb-1 block">包装要求</Label>
                      <Input
                        placeholder="请输入包装要求（可选）"
                        value={formData.packagingReqs[item.id] || ''}
                        onChange={(e) => updatePackagingReq(item.id, e.target.value)}
                        className="text-sm h-8"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="deliveryLocation">交货地点 *</Label>
              <Input
                id="deliveryLocation"
                value={formData.deliveryLocation}
                onChange={(e) => setFormData(prev => ({ ...prev, deliveryLocation: e.target.value }))}
                placeholder="请输入交货地点"
              />
            </div>

            <div>
              <Label htmlFor="tradeTerms">贸易条款 *</Label>
              <Select value={formData.tradeTerms} onValueChange={(value) => 
                setFormData(prev => ({ ...prev, tradeTerms: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="选择贸易条款" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FOB">FOB</SelectItem>
                  <SelectItem value="CIF">CIF</SelectItem>
                  <SelectItem value="CFR">CFR</SelectItem>
                  <SelectItem value="EXW">EXW</SelectItem>
                  <SelectItem value="DDP">DDP</SelectItem>
                  <SelectItem value="DDU">DDU</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="paymentMethod">付款方式 *</Label>
            <Select value={formData.paymentMethod} onValueChange={(value) => 
              setFormData(prev => ({ ...prev, paymentMethod: value }))
            }>
              <SelectTrigger>
                <SelectValue placeholder="选择付款方式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="T/T">T/T (电汇)</SelectItem>
                <SelectItem value="L/C">L/C (信用证)</SelectItem>
                <SelectItem value="D/P">D/P (付款交单)</SelectItem>
                <SelectItem value="D/A">D/A (承兑交单)</SelectItem>
                <SelectItem value="Cash">现金</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="buyerRemarks">备注信息</Label>
            <Textarea
              id="buyerRemarks"
              value={formData.buyerRemarks}
              onChange={(e) => setFormData(prev => ({ ...prev, buyerRemarks: e.target.value }))}
              placeholder="请输入其他要求或备注信息..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? '提交中...' : '提交询价'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}