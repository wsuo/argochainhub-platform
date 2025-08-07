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

interface CartSampleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItems: CartItem[];
  supplierId: string;
  supplierName: string;
  onSuccess?: () => void;
}

export function CartSampleDialog({ 
  open, 
  onOpenChange, 
  selectedItems, 
  supplierId, 
  supplierName,
  onSuccess 
}: CartSampleDialogProps) {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  
  const [formData, setFormData] = useState({
    purpose: '',
    shippingAddress: '',
    shippingMethod: '',
    sampleRequests: {} as Record<string, { quantity: number; unit: string }>
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!formData.shippingAddress) {
      toast({
        title: "请填写完整信息",
        description: "请填写收货地址",
        variant: "destructive"
      });
      return;
    }

    // Check if all items have quantity set
    const hasIncompleteItems = selectedItems.some(item => 
      !formData.sampleRequests[item.id] || !formData.sampleRequests[item.id].quantity
    );

    if (hasIncompleteItems) {
      toast({
        title: "请填写样品数量",
        description: "请为所有产品填写样品数量",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const sampleData = {
        supplierId,
        items: selectedItems.map(item => ({
          cartItemId: item.id,
          quantity: formData.sampleRequests[item.id].quantity,
          unit: formData.sampleRequests[item.id].unit
        })),
        purpose: formData.purpose,
        shippingAddress: formData.shippingAddress,
        shippingMethod: formData.shippingMethod
      };

      const response = await cartService.batchRequestSample(sampleData);
      
      if (response.success) {
        toast({
          title: "样品申请已提交",
          description: `已为${selectedItems.length}个产品提交样品申请`,
          variant: "default"
        });
        
        onOpenChange(false);
        onSuccess?.();
        
        // Reset form
        setFormData({
          purpose: '',
          shippingAddress: '',
          shippingMethod: '',
          sampleRequests: {}
        });
      }
    } catch (error) {
      console.error('Failed to submit sample request:', error);
      toast({
        title: "提交失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateSampleRequest = (itemId: string, field: 'quantity' | 'unit', value: any) => {
    setFormData(prev => ({
      ...prev,
      sampleRequests: {
        ...prev.sampleRequests,
        [itemId]: {
          quantity: 1,
          unit: 'kg',
          ...prev.sampleRequests[itemId],
          [field]: field === 'quantity' ? parseFloat(value) || 1 : value
        }
      }
    }));
  };

  // Initialize sample requests with default values
  const initializeSampleRequest = (itemId: string) => {
    if (!formData.sampleRequests[itemId]) {
      updateSampleRequest(itemId, 'quantity', 1);
      updateSampleRequest(itemId, 'unit', 'kg');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>申请样品 - {supplierName}</DialogTitle>
          <DialogDescription>
            为选中的 {selectedItems.length} 个产品申请样品
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Selected Products */}
          <div>
            <Label className="text-base font-medium mb-3 block">选中的产品</Label>
            <div className="space-y-3 max-h-40 overflow-y-auto">
              {selectedItems.map((item) => {
                initializeSampleRequest(item.id);
                const sampleReq = formData.sampleRequests[item.id] || { quantity: 1, unit: 'kg' };
                
                return (
                  <div key={item.id} className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium">
                        {item.productSnapshot.name[currentLanguage as keyof typeof item.productSnapshot.name] || 
                         item.productSnapshot.name['zh-CN']}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        原购物车: {item.quantity} {item.unit}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">样品数量 *</Label>
                        <Input
                          type="number"
                          placeholder="数量"
                          value={sampleReq.quantity}
                          onChange={(e) => updateSampleRequest(item.id, 'quantity', e.target.value)}
                          className="text-sm h-8"
                          min="0.1"
                          step="0.1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">单位</Label>
                        <Select 
                          value={sampleReq.unit} 
                          onValueChange={(value) => updateSampleRequest(item.id, 'unit', value)}
                        >
                          <SelectTrigger className="text-sm h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="g">克 (g)</SelectItem>
                            <SelectItem value="kg">千克 (kg)</SelectItem>
                            <SelectItem value="ml">毫升 (ml)</SelectItem>
                            <SelectItem value="L">升 (L)</SelectItem>
                            <SelectItem value="piece">件</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Fields */}
          <div>
            <Label htmlFor="purpose">申请目的</Label>
            <Input
              id="purpose"
              value={formData.purpose}
              onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
              placeholder="例如：产品测试、质量验证等"
            />
          </div>

          <div>
            <Label htmlFor="shippingAddress">收货地址 *</Label>
            <Textarea
              id="shippingAddress"
              value={formData.shippingAddress}
              onChange={(e) => setFormData(prev => ({ ...prev, shippingAddress: e.target.value }))}
              placeholder="请输入详细的收货地址..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="shippingMethod">物流方式</Label>
            <Select value={formData.shippingMethod} onValueChange={(value) => 
              setFormData(prev => ({ ...prev, shippingMethod: value }))
            }>
              <SelectTrigger>
                <SelectValue placeholder="选择物流方式（可选）" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DHL">DHL</SelectItem>
                <SelectItem value="FedEx">FedEx</SelectItem>
                <SelectItem value="UPS">UPS</SelectItem>
                <SelectItem value="TNT">TNT</SelectItem>
                <SelectItem value="EMS">EMS</SelectItem>
                <SelectItem value="顺丰">顺丰速运</SelectItem>
                <SelectItem value="韵达">韵达快递</SelectItem>
                <SelectItem value="中通">中通快递</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? '提交中...' : '提交申请'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}