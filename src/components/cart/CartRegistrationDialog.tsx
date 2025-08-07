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
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CartItem } from '@/types/cart';
import { cartService } from '@/services/cartService';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';

interface CartRegistrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItems: CartItem[];
  supplierId: string;
  supplierName: string;
  onSuccess?: () => void;
}

export function CartRegistrationDialog({ 
  open, 
  onOpenChange, 
  selectedItems, 
  supplierId, 
  supplierName,
  onSuccess 
}: CartRegistrationDialogProps) {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  
  const [formData, setFormData] = useState({
    targetCountry: '',
    isExclusive: false,
    docReqs: [] as string[],
    timeline: '',
    budgetAmount: '',
    budgetCurrency: 'USD',
    additionalRequirements: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableDocuments = [
    { value: 'COA', label: '分析证书 (COA)' },
    { value: 'MSDS', label: '安全数据表 (MSDS)' },
    { value: 'GLP', label: 'GLP研究报告' },
    { value: 'Toxicology', label: '毒理学数据' },
    { value: 'Residue', label: '残留数据' },
    { value: 'Environmental', label: '环境影响数据' },
    { value: 'Efficacy', label: '药效试验数据' },
    { value: 'Analytical', label: '分析方法' }
  ];

  const handleSubmit = async () => {
    if (!formData.targetCountry) {
      toast({
        title: "请填写必填信息",
        description: "请选择目标国家",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const registrationData = {
        supplierId,
        items: selectedItems.map(item => ({
          cartItemId: item.id
        })),
        targetCountry: formData.targetCountry,
        isExclusive: formData.isExclusive,
        docReqs: formData.docReqs,
        timeline: formData.timeline,
        budgetAmount: formData.budgetAmount ? parseFloat(formData.budgetAmount) : undefined,
        budgetCurrency: formData.budgetCurrency,
        additionalRequirements: formData.additionalRequirements
      };

      const response = await cartService.batchRequestRegistration(registrationData);
      
      if (response.success) {
        toast({
          title: "登记申请已提交",
          description: `已为${selectedItems.length}个产品提交登记申请`,
          variant: "default"
        });
        
        onOpenChange(false);
        onSuccess?.();
        
        // Reset form
        setFormData({
          targetCountry: '',
          isExclusive: false,
          docReqs: [],
          timeline: '',
          budgetAmount: '',
          budgetCurrency: 'USD',
          additionalRequirements: ''
        });
      }
    } catch (error) {
      console.error('Failed to submit registration request:', error);
      toast({
        title: "提交失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleDocReq = (docValue: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      docReqs: checked 
        ? [...prev.docReqs, docValue]
        : prev.docReqs.filter(doc => doc !== docValue)
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>申请登记 - {supplierName}</DialogTitle>
          <DialogDescription>
            为选中的 {selectedItems.length} 个产品申请产品登记服务
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Selected Products */}
          <div>
            <Label className="text-base font-medium mb-3 block">选中的产品</Label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {selectedItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">
                    {item.productSnapshot.name[currentLanguage as keyof typeof item.productSnapshot.name] || 
                     item.productSnapshot.name['zh-CN']}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {item.productSnapshot.formulation} {item.productSnapshot.totalContent}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="targetCountry">目标国家 *</Label>
              <Select value={formData.targetCountry} onValueChange={(value) => 
                setFormData(prev => ({ ...prev, targetCountry: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="选择目标国家" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CN">中国 (CN)</SelectItem>
                  <SelectItem value="US">美国 (US)</SelectItem>
                  <SelectItem value="EU">欧盟 (EU)</SelectItem>
                  <SelectItem value="BR">巴西 (BR)</SelectItem>
                  <SelectItem value="AR">阿根廷 (AR)</SelectItem>
                  <SelectItem value="IN">印度 (IN)</SelectItem>
                  <SelectItem value="AU">澳大利亚 (AU)</SelectItem>
                  <SelectItem value="CA">加拿大 (CA)</SelectItem>
                  <SelectItem value="MX">墨西哥 (MX)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="timeline">时间要求</Label>
              <Input
                id="timeline"
                value={formData.timeline}
                onChange={(e) => setFormData(prev => ({ ...prev, timeline: e.target.value }))}
                placeholder="例如：6个月内、1年内等"
              />
            </div>
          </div>

          {/* Exclusive checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isExclusive"
              checked={formData.isExclusive}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isExclusive: checked as boolean }))}
            />
            <Label htmlFor="isExclusive" className="text-sm">
              申请独家登记权
            </Label>
          </div>

          {/* Document Requirements */}
          <div>
            <Label className="text-base font-medium mb-3 block">所需文档</Label>
            <div className="grid grid-cols-2 gap-3">
              {availableDocuments.map((doc) => (
                <div key={doc.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={doc.value}
                    checked={formData.docReqs.includes(doc.value)}
                    onCheckedChange={(checked) => toggleDocReq(doc.value, checked as boolean)}
                  />
                  <Label htmlFor={doc.value} className="text-sm">
                    {doc.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Budget */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Label htmlFor="budgetAmount">预算金额</Label>
              <Input
                id="budgetAmount"
                type="number"
                value={formData.budgetAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, budgetAmount: e.target.value }))}
                placeholder="输入预算金额（可选）"
                min="0"
              />
            </div>
            <div>
              <Label htmlFor="budgetCurrency">货币</Label>
              <Select value={formData.budgetCurrency} onValueChange={(value) => 
                setFormData(prev => ({ ...prev, budgetCurrency: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">美元 (USD)</SelectItem>
                  <SelectItem value="EUR">欧元 (EUR)</SelectItem>
                  <SelectItem value="CNY">人民币 (CNY)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Additional Requirements */}
          <div>
            <Label htmlFor="additionalRequirements">其他要求</Label>
            <Textarea
              id="additionalRequirements"
              value={formData.additionalRequirements}
              onChange={(e) => setFormData(prev => ({ ...prev, additionalRequirements: e.target.value }))}
              placeholder="请输入其他特殊要求或说明..."
              rows={3}
            />
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