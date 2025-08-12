import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/MockAuthContext';
import { useLanguage } from '@/hooks/useLanguage';
import { CartInquiryDialog } from '@/components/cart/CartInquiryDialog';
import { CartSampleDialog } from '@/components/cart/CartSampleDialog';
import { CartRegistrationDialog } from '@/components/cart/CartRegistrationDialog';
import { SupplierCheckbox } from '@/components/cart/SupplierCheckbox';
import { 
  ShoppingCart, 
  Trash2, 
  MessageSquare, 
  TestTube,
  FileText,
  Star,
  Building2,
  Package,
  AlertCircle,
  Plus,
  Minus
} from 'lucide-react';
import { Link } from 'react-router-dom';

const CartPage = () => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const { currentUserType } = useAuth();
  const { 
    cart, 
    supplierGroups, 
    totalItems,
    isLoading,
    removeFromCart, 
    updateCartItem,
    toggleSelectItem, 
    toggleSelectAll, 
    toggleSelectSupplier,
    clearCart,
    getSelectedCount,
    getSelectedItems,
    isSupplierSelected,
    isSupplierPartiallySelected,
    getSupplierSelectedItems,
    refreshCart
  } = useCart();

  const [showInquiryDialog, setShowInquiryDialog] = useState(false);
  const [showSampleDialog, setShowSampleDialog] = useState(false);
  const [showRegistrationDialog, setShowRegistrationDialog] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [selectedSupplierName, setSelectedSupplierName] = useState('');
  const [editingQuantity, setEditingQuantity] = useState<Record<string, { quantity: string; unit: string }>>({});

  // Get current language key for multilanguage text
  const getLangKey = (): 'zh-CN' | 'en' | 'es' => {
    return currentLanguage as 'zh-CN' | 'en' | 'es';
  };

  // Handle quantity editing
  const startEditingQuantity = (itemId: string, currentQuantity: number, currentUnit: string) => {
    setEditingQuantity(prev => ({
      ...prev,
      [itemId]: { quantity: currentQuantity.toString(), unit: currentUnit }
    }));
  };

  const cancelEditingQuantity = (itemId: string) => {
    setEditingQuantity(prev => {
      const { [itemId]: _, ...rest } = prev;
      return rest;
    });
  };

  const saveQuantity = async (itemId: string) => {
    const editing = editingQuantity[itemId];
    if (!editing) return;

    const quantity = parseFloat(editing.quantity);
    if (quantity <= 0) {
      return;
    }

    await updateCartItem(itemId, quantity, editing.unit);
    cancelEditingQuantity(itemId);
  };

  // Handle batch operations
  // 检查选中的商品是否来自同一供应商
  const getSelectedSuppliersInfo = () => {
    const selectedItems = getSelectedItems();
    const supplierIds = [...new Set(selectedItems.map(item => item.supplierId))];
    return {
      supplierIds,
      isSingleSupplier: supplierIds.length <= 1,
      hasItems: selectedItems.length > 0
    };
  };

  const handleBatchInquiry = () => {
    const { isSingleSupplier, supplierIds } = getSelectedSuppliersInfo();
    if (!isSingleSupplier || supplierIds.length === 0) return;
    
    const selectedItems = getSelectedItems();
    const supplierId = supplierIds[0];
    const supplier = selectedItems[0].supplier;
    
    setSelectedSupplierId(supplierId);
    setSelectedSupplierName(supplier.name[getLangKey()] || supplier.name['zh-CN']);
    setShowInquiryDialog(true);
  };

  const handleBatchSample = () => {
    const { isSingleSupplier, supplierIds } = getSelectedSuppliersInfo();
    if (!isSingleSupplier || supplierIds.length === 0) return;
    
    const selectedItems = getSelectedItems();
    const supplierId = supplierIds[0];
    const supplier = selectedItems[0].supplier;
    
    setSelectedSupplierId(supplierId);
    setSelectedSupplierName(supplier.name[getLangKey()] || supplier.name['zh-CN']);
    setShowSampleDialog(true);
  };

  const handleBatchRegistration = () => {
    const { isSingleSupplier, supplierIds } = getSelectedSuppliersInfo();
    if (!isSingleSupplier || supplierIds.length === 0) return;
    
    const selectedItems = getSelectedItems();
    const supplierId = supplierIds[0];
    const supplier = selectedItems[0].supplier;
    
    setSelectedSupplierId(supplierId);
    setSelectedSupplierName(supplier.name[getLangKey()] || supplier.name['zh-CN']);
    setShowRegistrationDialog(true);
  };

  const handleDialogSuccess = () => {
    refreshCart();
  };

  // Show loading state
  if (isLoading) {
    return (
      <Layout userType={currentUserType}>
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 space-y-6">
              {[...Array(3)].map((_, index) => (
                <Skeleton key={index} className="h-96 w-full" />
              ))}
            </div>
            <div className="lg:col-span-1">
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Show empty cart state
  if (totalItems === 0) {
    return (
      <Layout userType={currentUserType}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-16">
              <ShoppingCart className="w-24 h-24 mx-auto text-muted-foreground mb-6" />
              <h2 className="text-2xl font-semibold text-foreground mb-4">购物车为空</h2>
              <p className="text-muted-foreground mb-8">
                快去选择您感兴趣的农药产品吧！
              </p>
              <Button asChild>
                <Link to="/products">浏览产品</Link>
              </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout userType={currentUserType}>
      <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold text-foreground">购物车</h1>
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {totalItems} 件商品
                </Badge>
              </div>
              
              <div className="flex items-center gap-3">
                <Checkbox
                  id="select-all"
                  checked={getSelectedCount() === totalItems && totalItems > 0}
                  onCheckedChange={toggleSelectAll}
                />
                <label htmlFor="select-all" className="text-sm font-medium">
                  全选
                </label>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearCart}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  清空购物车
                </Button>
              </div>
            </div>
            
            <Separator />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Cart Items - Grouped by Supplier */}
            <div className="lg:col-span-3 space-y-6">
              {supplierGroups.map((group) => {
                const supplierSelectedItems = getSupplierSelectedItems(group.supplier.id);
                const hasSelectedItems = supplierSelectedItems.length > 0;
                
                return (
                  <Card key={group.supplier.id} className="overflow-auto">
                    {/* Supplier Header */}
                    <CardHeader className="bg-muted/50 pb-4">
                      <div className="flex items-center gap-4">
                        <SupplierCheckbox
                          checked={isSupplierSelected(group.supplier.id)}
                          indeterminate={isSupplierPartiallySelected(group.supplier.id)}
                          onCheckedChange={() => toggleSelectSupplier(group.supplier.id)}
                        />
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Building2 className="w-5 h-5 text-primary" />
                            <h3 className="text-lg font-semibold text-foreground">
                              {group.supplier.name[getLangKey()] || group.supplier.name['zh-CN']}
                            </h3>
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-agro-warning text-agro-warning" />
                              <span className="text-sm text-muted-foreground">
                                {group.supplier.rating}
                              </span>
                            </div>
                            {group.supplier.isTop100 && (
                              <Badge variant="secondary" className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20">
                                TOP100
                              </Badge>
                            )}
                            <Badge variant="secondary">
                              {group.items.length} 件商品
                            </Badge>
                          </div>
                          
                        </div>
                      </div>
                    </CardHeader>

                    {/* Products under this supplier */}
                    <CardContent className="p-0">
                      <div className="space-y-0">
                        {group.items.map((item, index) => {
                          const isEditing = editingQuantity[item.id];
                          
                          return (
                            <div key={item.id} className={`p-6 ${index !== group.items.length - 1 ? 'border-b' : ''}`}>
                              <div className="flex items-start gap-4">
                                <Checkbox
                                  checked={getSelectedItems().some(selected => selected.id === item.id)}
                                  onCheckedChange={() => toggleSelectItem(item.id)}
                                  className="mt-1"
                                />
                                
                                <div className="flex-1 space-y-3">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <h4 className="font-semibold text-foreground">
                                        {item.productSnapshot.name[getLangKey()] || item.productSnapshot.name['zh-CN']}
                                      </h4>
                                      <p className="text-sm text-muted-foreground">
                                        {item.productSnapshot.pesticideName[getLangKey()] || item.productSnapshot.pesticideName['zh-CN']}
                                      </p>
                                    </div>
                                    
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeFromCart(item.id)}
                                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>

                                  <div className="flex flex-wrap gap-2">
                                    <Badge variant="outline">
                                      {item.product?.details?.productCategory || '未分类'}
                                    </Badge>
                                    <Badge variant="outline">
                                      {item.productSnapshot.formulation} {item.productSnapshot.totalContent}
                                    </Badge>
                                  </div>

                                  {/* Quantity Controls */}
                                  <div className="flex items-center gap-2">
                                    <Label className="text-sm text-muted-foreground">数量:</Label>
                                    {isEditing ? (
                                      <div className="flex items-center gap-2">
                                        <Input
                                          type="number"
                                          value={isEditing.quantity}
                                          onChange={(e) => setEditingQuantity(prev => ({
                                            ...prev,
                                            [item.id]: { ...prev[item.id], quantity: e.target.value }
                                          }))}
                                          className="w-20 h-8 text-sm"
                                          min="0.1"
                                          step="0.1"
                                        />
                                        <Select
                                          value={isEditing.unit}
                                          onValueChange={(value) => setEditingQuantity(prev => ({
                                            ...prev,
                                            [item.id]: { ...prev[item.id], unit: value }
                                          }))}
                                        >
                                          <SelectTrigger className="w-16 h-8 text-sm">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="g">g</SelectItem>
                                            <SelectItem value="kg">kg</SelectItem>
                                            <SelectItem value="ml">ml</SelectItem>
                                            <SelectItem value="L">L</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <Button size="sm" variant="outline" onClick={() => saveQuantity(item.id)}>
                                          保存
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={() => cancelEditingQuantity(item.id)}>
                                          取消
                                        </Button>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">
                                          {item.quantity} {item.unit}
                                        </span>
                                        <Button 
                                          size="sm" 
                                          variant="ghost"
                                          onClick={() => startEditingQuantity(item.id, item.quantity, item.unit)}
                                        >
                                          编辑
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Actions Panel */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="text-lg">批量操作</CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    已选择 <span className="font-medium text-foreground">{getSelectedCount()}</span> 件商品
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <Button 
                      className="w-full" 
                      onClick={handleBatchInquiry}
                      disabled={!getSelectedSuppliersInfo().isSingleSupplier || !getSelectedSuppliersInfo().hasItems}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      批量询价
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={handleBatchSample}
                      disabled={!getSelectedSuppliersInfo().isSingleSupplier || !getSelectedSuppliersInfo().hasItems}
                    >
                      <TestTube className="w-4 h-4 mr-2" />
                      申请样品
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={handleBatchRegistration}
                      disabled={!getSelectedSuppliersInfo().isSingleSupplier || !getSelectedSuppliersInfo().hasItems}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      申请登记
                    </Button>
                    
                    {(() => {
                      const { isSingleSupplier, hasItems, supplierIds } = getSelectedSuppliersInfo();
                      
                      if (!hasItems) {
                        return (
                          <p className="text-xs text-muted-foreground text-center mt-3">
                            请选择商品以使用批量操作功能
                          </p>
                        );
                      }
                      
                      if (!isSingleSupplier) {
                        return (
                          <div className="mt-3">
                            <Alert>
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription className="text-xs">
                                批量操作只能选择同一供应商的产品
                              </AlertDescription>
                            </Alert>
                          </div>
                        );
                      }
                      
                      return null;
                    })()}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      
      {/* Dialogs */}
      <CartInquiryDialog 
        open={showInquiryDialog}
        onOpenChange={setShowInquiryDialog}
        selectedItems={getSupplierSelectedItems(selectedSupplierId)}
        supplierId={selectedSupplierId}
        supplierName={selectedSupplierName}
        onSuccess={handleDialogSuccess}
      />
      
      <CartSampleDialog
        open={showSampleDialog}
        onOpenChange={setShowSampleDialog}
        selectedItems={getSupplierSelectedItems(selectedSupplierId)}
        supplierId={selectedSupplierId}
        supplierName={selectedSupplierName}
        onSuccess={handleDialogSuccess}
      />

      <CartRegistrationDialog
        open={showRegistrationDialog}
        onOpenChange={setShowRegistrationDialog}
        selectedItems={getSupplierSelectedItems(selectedSupplierId)}
        supplierId={selectedSupplierId}
        supplierName={selectedSupplierName}
        onSuccess={handleDialogSuccess}
      />
    </Layout>
  );
};

export default CartPage;