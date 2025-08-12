import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SampleStatusBadge } from "@/components/samples/SampleStatusBadge";
import { SupplierDecisionBar } from "@/components/samples/SupplierDecisionBar";
import { useSampleRequest, useSupplierActions } from "@/hooks/useSample";
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
  DollarSign,
  FileText
} from "lucide-react";
import { format } from "date-fns";

export default function SampleResponseDetail() {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const params = useParams();
  const navigate = useNavigate();
  const id = Number(params.id);
  
  const { data: response, isLoading } = useSampleRequest(id);
  const actions = useSupplierActions(id);
  
  const [shipDialogOpen, setShipDialogOpen] = useState(false);
  const [shipmentData, setShipmentData] = useState({
    carrier: "",
    trackingNumber: "",
    notes: ""
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

  const handleApprove = async (approveData: { notes?: string; estimatedShipDate?: string }) => {
    await actions.approve.mutateAsync(approveData);
  };

  const handleReject = async (reason: string) => {
    await actions.reject.mutateAsync({ reason });
  };

  const handleShip = async () => {
    if (!shipmentData.carrier || !shipmentData.trackingNumber) return;
    
    await actions.ship.mutateAsync({
      carrier: shipmentData.carrier,
      trackingNumber: shipmentData.trackingNumber,
      notes: shipmentData.notes || undefined
    });
    
    setShipDialogOpen(false);
    setShipmentData({ carrier: "", trackingNumber: "", notes: "" });
  };

  const canDecide = data?.status === SampleRequestStatus.PENDING_APPROVAL;
  const canShip = data?.status === SampleRequestStatus.APPROVED;

  if (isLoading) {
    return (
      <Layout userType="supplier">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-muted-foreground">{t('common.loading')}</div>
        </div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout userType="supplier">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-muted-foreground">{t('sampleResponses.detail.notFound')}</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout userType="supplier">
      <div>
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/sample-responses')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('common.back')}
            </Button>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {t('sampleResponses.detail.title')}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  {t('sampleResponses.detail.reqNo')}: {data.sampleReqNo}
                </p>
              </div>
              <SampleStatusBadge status={data.status} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Request Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="h-5 w-5 mr-2" />
                    {t('sampleResponses.detail.requestInfo')}
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
                      <span className="text-muted-foreground">{t('sampleResponses.detail.quantity')}:</span>
                      <span className="ml-2 font-medium">{data.quantity} {data.unit}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t('sampleResponses.detail.deadline')}:</span>
                      <span className="ml-2 font-medium">
                        {format(new Date(data.deadline), 'yyyy-MM-dd')}
                      </span>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-muted-foreground">{t('sampleResponses.detail.purpose')}:</span>
                      <p className="text-sm mt-1">{data.details?.purpose || t('sampleResponses.detail.notProvided')}</p>
                    </div>
                    {data.details?.specialRequirements && (
                      <div>
                        <span className="text-sm text-muted-foreground">{t('sampleResponses.detail.specialRequirements')}:</span>
                        <p className="text-sm mt-1">{data.details.specialRequirements}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Buyer Information */}
              {data.buyer && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      {t('sampleResponses.detail.buyerInfo')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-semibold">{getLocalizedText(data.buyer.name)}</h3>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Shipping Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Truck className="h-5 w-5 mr-2" />
                    {t('sampleResponses.detail.shippingInfo')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-start">
                      <MapPin className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{t('sampleResponses.detail.shippingAddress')}</p>
                        <p className="text-sm text-muted-foreground">
                          {data.details?.shippingAddress || t('sampleResponses.detail.notProvided')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Truck className="h-4 w-4 mr-2 text-muted-foreground" />
                      <div>
                        <span className="text-sm font-medium">{t('sampleResponses.detail.shippingMethod')}: </span>
                        <span className="text-sm text-muted-foreground">
                          {data.details?.shippingMethod || t('sampleResponses.detail.notProvided')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                      <div>
                        <span className="text-sm font-medium">{t('sampleResponses.detail.payment')}: </span>
                        <span className="text-sm text-muted-foreground">
                          {data.details?.willingnessToPay?.paid 
                            ? `${t('sampleResponses.detail.paid')} - ${data.details.willingnessToPay.amount}`
                            : t('sampleResponses.detail.free')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {data.trackingInfo && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <h4 className="font-medium">{t('sampleResponses.detail.trackingInfo')}</h4>
                        <div className="text-sm space-y-1">
                          <p>
                            <span className="text-muted-foreground">{t('sampleResponses.detail.carrier')}:</span>
                            <span className="ml-2">{data.trackingInfo.carrier}</span>
                          </p>
                          <p>
                            <span className="text-muted-foreground">{t('sampleResponses.detail.trackingNumber')}:</span>
                            <span className="ml-2 font-mono">{data.trackingInfo.trackingNumber}</span>
                          </p>
                          {data.trackingInfo.estimatedDelivery && (
                            <p>
                              <span className="text-muted-foreground">{t('sampleResponses.detail.estimatedDelivery')}:</span>
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
                      {t('sampleResponses.detail.timeline')}
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
              {/* Decision Making */}
              {canDecide && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t('sampleResponses.detail.decision')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SupplierDecisionBar
                      disabled={!canDecide}
                      onApprove={handleApprove}
                      onReject={handleReject}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Shipping Action */}
              {canShip && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t('sampleResponses.detail.shipping')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={() => setShipDialogOpen(true)}
                      className="w-full"
                    >
                      <Truck className="h-4 w-4 mr-2" />
                      {t('sampleResponses.detail.markAsShipped')}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Status Info */}
              {!canDecide && !canShip && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t('sampleResponses.detail.statusInfo')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {data.status === SampleRequestStatus.SHIPPED && (
                        <div className="text-sm text-muted-foreground">
                          <p>{t('sampleResponses.detail.shippedInfo')}</p>
                        </div>
                      )}
                      {data.status === SampleRequestStatus.DELIVERED && (
                        <div className="text-sm text-muted-foreground">
                          <p>{t('sampleResponses.detail.deliveredInfo')}</p>
                        </div>
                      )}
                      {data.status === SampleRequestStatus.REJECTED && data.approvalInfo?.rejectionReason && (
                        <div>
                          <p className="text-sm font-medium text-red-600">
                            {t('sampleResponses.detail.rejectionReason')}:
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {data.approvalInfo.rejectionReason}
                          </p>
                        </div>
                      )}
                      {data.status === SampleRequestStatus.CANCELLED && (
                        <div className="text-sm text-muted-foreground">
                          <p>{t('sampleResponses.detail.cancelledInfo')}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Approval Info */}
              {data.approvalInfo && data.status === SampleRequestStatus.APPROVED && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t('sampleResponses.detail.approvalInfo')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {data.approvalInfo.approvedAt && (
                        <div>
                          <p className="text-muted-foreground">{t('sampleResponses.detail.approvedAt')}</p>
                          <p className="font-medium">
                            {format(new Date(data.approvalInfo.approvedAt), 'yyyy-MM-dd HH:mm')}
                          </p>
                        </div>
                      )}
                      {data.approvalInfo.approverNotes && (
                        <div>
                          <p className="text-muted-foreground">{t('sampleResponses.detail.notes')}</p>
                          <p className="font-medium">{data.approvalInfo.approverNotes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
      </div>

      {/* Ship Dialog */}
      <Dialog open={shipDialogOpen} onOpenChange={setShipDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('sampleResponses.detail.shipDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('sampleResponses.detail.shipDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('sampleResponses.detail.shipDialog.carrier')}</Label>
              <Input
                placeholder={t('sampleResponses.detail.shipDialog.carrierPlaceholder')}
                value={shipmentData.carrier}
                onChange={(e) => setShipmentData(prev => ({ ...prev, carrier: e.target.value }))}
                className="mt-2"
              />
            </div>
            <div>
              <Label>{t('sampleResponses.detail.shipDialog.trackingNumber')}</Label>
              <Input
                placeholder={t('sampleResponses.detail.shipDialog.trackingNumberPlaceholder')}
                value={shipmentData.trackingNumber}
                onChange={(e) => setShipmentData(prev => ({ ...prev, trackingNumber: e.target.value }))}
                className="mt-2"
              />
            </div>
            <div>
              <Label>{t('sampleResponses.detail.shipDialog.notes')}</Label>
              <Textarea
                placeholder={t('sampleResponses.detail.shipDialog.notesPlaceholder')}
                value={shipmentData.notes}
                onChange={(e) => setShipmentData(prev => ({ ...prev, notes: e.target.value }))}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShipDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={handleShip}
              disabled={!shipmentData.carrier || !shipmentData.trackingNumber || actions.ship.isPending}
            >
              {actions.ship.isPending ? t('common.submitting') : t('common.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}