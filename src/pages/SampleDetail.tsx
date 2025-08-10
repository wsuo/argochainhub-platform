import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SampleStatusBadge } from "@/components/samples/SampleStatusBadge";
import { useSampleRequest, useBuyerActions } from "@/hooks/useSample";
import { SampleRequestStatus } from "@/types/sample";
import { 
  ArrowLeft, 
  Package, 
  Truck, 
  Calendar, 
  MapPin, 
  User,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  Star
} from "lucide-react";
import { format } from "date-fns";

export default function SampleDetail() {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const params = useParams();
  const navigate = useNavigate();
  const id = Number(params.id);
  
  const { data: response, isLoading } = useSampleRequest(id);
  const buyerActions = useBuyerActions(id);
  
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [deliveryCondition, setDeliveryCondition] = useState<'good' | 'damaged' | 'partial'>('good');
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [evaluateDialogOpen, setEvaluateDialogOpen] = useState(false);
  const [evaluation, setEvaluation] = useState({
    rating: 5,
    qualityRating: 5,
    packagingRating: 5,
    deliveryRating: 5,
    comment: "",
    wouldRecommend: true
  });

  const data = response?.data;

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
        // 如果解析失败，返回原始字符串
        return text;
      }
    }
    if (typeof text === 'object' && text !== null) {
      const langKey = currentLanguage === 'zh' ? 'zh-CN' : currentLanguage;
      return text[langKey] || text['zh-CN'] || '';
    }
    return '';
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) return;
    await buyerActions.cancel.mutateAsync({ reason: cancelReason });
    setCancelDialogOpen(false);
    setCancelReason("");
  };

  const handleConfirmDelivery = async () => {
    await buyerActions.confirmDelivery.mutateAsync({
      receivedAt: new Date().toISOString(),
      condition: deliveryCondition,
      notes: deliveryNotes || undefined
    });
    setConfirmDialogOpen(false);
    setDeliveryNotes("");
  };

  const handleEvaluate = async () => {
    await buyerActions.evaluate.mutateAsync(evaluation);
    setEvaluateDialogOpen(false);
  };

  const canCancel = data?.status === SampleRequestStatus.PENDING_APPROVAL || 
                   data?.status === SampleRequestStatus.APPROVED;
  const canConfirm = data?.status === SampleRequestStatus.SHIPPED;
  const canEvaluate = data?.status === SampleRequestStatus.DELIVERED;

  if (isLoading) {
    return (
      <Layout userType="buyer">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-muted-foreground">{t('common.loading')}</div>
        </div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout userType="buyer">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-muted-foreground">{t('samples.detail.notFound')}</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout userType="buyer">
      <main className="flex-1 p-6 bg-gradient-to-br from-slate-50 via-agro-green-light/30 to-agro-blue-light/40 relative overflow-auto">
        {/* 装饰性渐变叠层 */}
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-agro-blue/8 pointer-events-none" />
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-radial from-primary/10 via-primary/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-radial from-agro-blue/8 via-agro-blue/4 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        {/* 内容区域 */}
        <div className="relative z-10">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/samples')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('common.back')}
            </Button>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {t('samples.detail.title')}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  {t('samples.detail.reqNo')}: {data.sampleReqNo}
                </p>
              </div>
              <SampleStatusBadge status={data.status} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Product Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="h-5 w-5 mr-2" />
                    {t('samples.detail.productInfo')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{getLocalizedText(data.productSnapshot.name)}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {getLocalizedText(data.productSnapshot.category)} • {data.productSnapshot.content}
                    </p>
                    {data.productSnapshot.activeIngredient && (() => {
                      try {
                        const activeIngredient = typeof data.productSnapshot.activeIngredient === 'string' 
                          ? JSON.parse(data.productSnapshot.activeIngredient) 
                          : data.productSnapshot.activeIngredient;
                        return (
                          <p className="text-sm text-muted-foreground">
                            {getLocalizedText(activeIngredient.name)} • {activeIngredient.content}
                          </p>
                        );
                      } catch {
                        return null;
                      }
                    })()}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">{t('samples.detail.quantity')}:</span>
                      <span className="ml-2 font-medium">{data.quantity} {data.unit}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t('samples.detail.deadline')}:</span>
                      <span className="ml-2 font-medium">
                        {format(new Date(data.deadline), 'yyyy-MM-dd')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Supplier Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    {t('samples.detail.supplierInfo')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold">{getLocalizedText(data.supplier.name)}</h3>
                    {data.supplier.location && (
                      <p className="text-sm text-muted-foreground mt-1">
                        <MapPin className="inline h-3 w-3 mr-1" />
                        {data.supplier.location}
                      </p>
                    )}
                    {data.supplier.rating && (
                      <p className="text-sm text-muted-foreground mt-1">
                        ⭐ {data.supplier.rating}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Truck className="h-5 w-5 mr-2" />
                    {t('samples.detail.shippingInfo')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-start">
                      <MapPin className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{t('samples.detail.shippingAddress')}</p>
                        <p className="text-sm text-muted-foreground">
                          {data.details?.shippingAddress || t('samples.detail.notProvided')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Truck className="h-4 w-4 mr-2 text-muted-foreground" />
                      <div>
                        <span className="text-sm font-medium">{t('samples.detail.shippingMethod')}: </span>
                        <span className="text-sm text-muted-foreground">
                          {data.details?.shippingMethod || t('samples.detail.notProvided')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {data.trackingInfo && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <h4 className="font-medium">{t('samples.detail.trackingInfo')}</h4>
                        <div className="text-sm space-y-1">
                          <p>
                            <span className="text-muted-foreground">{t('samples.detail.carrier')}:</span>
                            <span className="ml-2">{data.trackingInfo.carrier}</span>
                          </p>
                          <p>
                            <span className="text-muted-foreground">{t('samples.detail.trackingNumber')}:</span>
                            <span className="ml-2 font-mono">{data.trackingInfo.trackingNumber}</span>
                          </p>
                          {data.trackingInfo.estimatedDelivery && (
                            <p>
                              <span className="text-muted-foreground">{t('samples.detail.estimatedDelivery')}:</span>
                              <span className="ml-2">
                                {format(new Date(data.trackingInfo.estimatedDelivery), 'yyyy-MM-dd')}
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Timeline */}
              {data.timeline && data.timeline.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Clock className="h-5 w-5 mr-2" />
                      {t('samples.detail.timeline')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {data.timeline.map((item, index) => (
                        <div key={item.id} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-3 h-3 bg-primary rounded-full" />
                            {index < data.timeline!.length - 1 && (
                              <div className="w-0.5 h-full bg-muted flex-1 mt-2" />
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <div className="flex items-center gap-2 mb-1">
                              <SampleStatusBadge status={item.status} />
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(item.timestamp), 'yyyy-MM-dd HH:mm')}
                              </span>
                            </div>
                            <p className="text-sm font-medium">{item.description}</p>
                            {item.notes && (
                              <p className="text-sm text-muted-foreground mt-1">{item.notes}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Actions Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('samples.detail.actions')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {canCancel && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setCancelDialogOpen(true)}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      {t('samples.detail.cancel')}
                    </Button>
                  )}
                  {canConfirm && (
                    <Button
                      className="w-full"
                      onClick={() => setConfirmDialogOpen(true)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {t('samples.detail.confirmDelivery')}
                    </Button>
                  )}
                  {canEvaluate && (
                    <Button
                      className="w-full"
                      onClick={() => setEvaluateDialogOpen(true)}
                    >
                      <Star className="h-4 w-4 mr-2" />
                      {t('samples.detail.evaluate')}
                    </Button>
                  )}
                  {!canCancel && !canConfirm && !canEvaluate && (
                    <p className="text-sm text-muted-foreground text-center">
                      {t('samples.detail.noActions')}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Request Details */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('samples.detail.requestDetails')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">{t('samples.detail.purpose')}</p>
                    <p className="font-medium">
                      {data.details?.purpose || t('samples.detail.notProvided')}
                    </p>
                  </div>
                  {data.details?.willingnessToPay && (
                    <div>
                      <p className="text-muted-foreground">{t('samples.detail.payment')}</p>
                      <p className="font-medium">
                        {data.details.willingnessToPay.paid 
                          ? `${t('samples.detail.paid')} - ${data.details.willingnessToPay.amount}`
                          : t('samples.detail.free')}
                      </p>
                    </div>
                  )}
                  {data.details?.specialRequirements && (
                    <div>
                      <p className="text-muted-foreground">{t('samples.detail.specialRequirements')}</p>
                      <p className="font-medium">{data.details.specialRequirements}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('samples.detail.cancelDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('samples.detail.cancelDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('samples.detail.cancelDialog.reason')}</Label>
              <Textarea
                placeholder={t('samples.detail.cancelDialog.reasonPlaceholder')}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={handleCancel}
              disabled={!cancelReason.trim() || buyerActions.cancel.isPending}
            >
              {buyerActions.cancel.isPending ? t('common.submitting') : t('common.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Delivery Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('samples.detail.confirmDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('samples.detail.confirmDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('samples.detail.confirmDialog.condition')}</Label>
              <Select value={deliveryCondition} onValueChange={(v: any) => setDeliveryCondition(v)}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="good">{t('samples.detail.confirmDialog.conditionGood')}</SelectItem>
                  <SelectItem value="damaged">{t('samples.detail.confirmDialog.conditionDamaged')}</SelectItem>
                  <SelectItem value="partial">{t('samples.detail.confirmDialog.conditionPartial')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('samples.detail.confirmDialog.notes')}</Label>
              <Textarea
                placeholder={t('samples.detail.confirmDialog.notesPlaceholder')}
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={handleConfirmDelivery}
              disabled={buyerActions.confirmDelivery.isPending}
            >
              {buyerActions.confirmDelivery.isPending ? t('common.submitting') : t('common.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Evaluate Dialog */}
      <Dialog open={evaluateDialogOpen} onOpenChange={setEvaluateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('samples.detail.evaluateDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('samples.detail.evaluateDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('samples.detail.evaluateDialog.overallRating')}</Label>
                <Select 
                  value={evaluation.rating.toString()} 
                  onValueChange={(v) => setEvaluation(prev => ({ ...prev, rating: parseInt(v) }))}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[5,4,3,2,1].map(n => (
                      <SelectItem key={n} value={n.toString()}>
                        {'⭐'.repeat(n)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t('samples.detail.evaluateDialog.qualityRating')}</Label>
                <Select 
                  value={evaluation.qualityRating.toString()} 
                  onValueChange={(v) => setEvaluation(prev => ({ ...prev, qualityRating: parseInt(v) }))}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[5,4,3,2,1].map(n => (
                      <SelectItem key={n} value={n.toString()}>
                        {'⭐'.repeat(n)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t('samples.detail.evaluateDialog.packagingRating')}</Label>
                <Select 
                  value={evaluation.packagingRating.toString()} 
                  onValueChange={(v) => setEvaluation(prev => ({ ...prev, packagingRating: parseInt(v) }))}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[5,4,3,2,1].map(n => (
                      <SelectItem key={n} value={n.toString()}>
                        {'⭐'.repeat(n)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t('samples.detail.evaluateDialog.deliveryRating')}</Label>
                <Select 
                  value={evaluation.deliveryRating.toString()} 
                  onValueChange={(v) => setEvaluation(prev => ({ ...prev, deliveryRating: parseInt(v) }))}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[5,4,3,2,1].map(n => (
                      <SelectItem key={n} value={n.toString()}>
                        {'⭐'.repeat(n)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>{t('samples.detail.evaluateDialog.comment')}</Label>
              <Textarea
                placeholder={t('samples.detail.evaluateDialog.commentPlaceholder')}
                value={evaluation.comment}
                onChange={(e) => setEvaluation(prev => ({ ...prev, comment: e.target.value }))}
                className="mt-2"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="recommend"
                checked={evaluation.wouldRecommend}
                onChange={(e) => setEvaluation(prev => ({ ...prev, wouldRecommend: e.target.checked }))}
              />
              <Label htmlFor="recommend">{t('samples.detail.evaluateDialog.wouldRecommend')}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEvaluateDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={handleEvaluate}
              disabled={!evaluation.comment.trim() || buyerActions.evaluate.isPending}
            >
              {buyerActions.evaluate.isPending ? t('common.submitting') : t('common.submit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}