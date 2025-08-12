import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  AlertCircle, 
  RefreshCw, 
  Package, 
  Globe, 
  FileText, 
  Building2, 
  Calendar,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { RegistrationService } from '@/services/registrationService';
import { RegistrationStatusBadge } from '@/components/registration/RegistrationStatusBadge';
import { useAuth } from '@/contexts/MockAuthContext';
import { format } from 'date-fns';
import { zhCN, enUS, es } from 'date-fns/locale';
import { useLanguage } from '@/hooks/useLanguage';
import { toast } from 'sonner';

const RegistrationDetailPage = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUserType } = useAuth();
  const { currentLanguage } = useLanguage();
  const queryClient = useQueryClient();

  const [rejectReason, setRejectReason] = useState('');
  const [progressNote, setProgressNote] = useState('');
  const [estimatedDate, setEstimatedDate] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showProgressDialog, setShowProgressDialog] = useState(false);

  const isSupplierView = currentUserType === 'supplier';

  // 获取登记详情
  const { data: response, isLoading, error, refetch } = useQuery({
    queryKey: ['registration-detail', id, isSupplierView],
    queryFn: () => isSupplierView 
      ? RegistrationService.getReceivedRegistrationRequestDetail(id!)
      : RegistrationService.getRegistrationRequestDetail(id!),
    enabled: !!id,
    staleTime: 30 * 1000,
  });

  const registration = response?.data;

  // 接受申请
  const acceptMutation = useMutation({
    mutationFn: () => RegistrationService.acceptRegistrationRequest(id!),
    onSuccess: () => {
      toast.success(t('registration.acceptSuccess', '已接受登记申请'));
      queryClient.invalidateQueries({ queryKey: ['registration-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
    },
    onError: (error: any) => {
      toast.error(error.message || t('registration.acceptFailed', '接受申请失败'));
    },
  });

  // 拒绝申请
  const rejectMutation = useMutation({
    mutationFn: () => RegistrationService.rejectRegistrationRequest(id!, { rejectReason }),
    onSuccess: () => {
      toast.success(t('registration.rejectSuccess', '已拒绝登记申请'));
      setShowRejectDialog(false);
      setRejectReason('');
      queryClient.invalidateQueries({ queryKey: ['registration-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
    },
    onError: (error: any) => {
      toast.error(error.message || t('registration.rejectFailed', '拒绝申请失败'));
    },
  });

  // 更新进度
  const updateProgressMutation = useMutation({
    mutationFn: () => RegistrationService.updateProgress(id!, { 
      progressNote, 
      estimatedCompletionDate: estimatedDate || undefined 
    }),
    onSuccess: () => {
      toast.success(t('registration.progressUpdateSuccess', '进度更新成功'));
      setShowProgressDialog(false);
      setProgressNote('');
      setEstimatedDate('');
      queryClient.invalidateQueries({ queryKey: ['registration-detail', id] });
    },
    onError: (error: any) => {
      toast.error(error.message || t('registration.progressUpdateFailed', '更新进度失败'));
    },
  });

  // 完成申请
  const completeMutation = useMutation({
    mutationFn: () => RegistrationService.completeRegistrationRequest(id!),
    onSuccess: () => {
      toast.success(t('registration.completeSuccess', '登记申请已完成'));
      queryClient.invalidateQueries({ queryKey: ['registration-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
    },
    onError: (error: any) => {
      toast.error(error.message || t('registration.completeFailed', '完成申请失败'));
    },
  });

  // 取消申请
  const cancelMutation = useMutation({
    mutationFn: () => RegistrationService.cancelRegistrationRequest(id!),
    onSuccess: () => {
      toast.success(t('registration.cancelSuccess', '登记申请已取消'));
      queryClient.invalidateQueries({ queryKey: ['registration-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
    },
    onError: (error: any) => {
      toast.error(error.message || t('registration.cancelFailed', '取消申请失败'));
    },
  });

  const getDateLocale = () => {
    switch (currentLanguage) {
      case 'zh':
        return zhCN;
      case 'es':
        return es;
      default:
        return enUS;
    }
  };

  const formatBudget = () => {
    if (!registration) return '';
    const { amount, currency } = registration.details.budget;
    return new Intl.NumberFormat(currentLanguage === 'zh' ? 'zh-CN' : currentLanguage === 'es' ? 'es-ES' : 'en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  if (isLoading) {
    return (
      <Layout userType={currentUserType}>
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-60 w-full" />
        </div>
      </Layout>
    );
  }

  if (error || !registration) {
    return (
      <Layout userType={currentUserType}>
        <div className="max-w-6xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {t('registration.error.loadFailed', '加载登记详情失败')}
            </AlertDescription>
          </Alert>
          <Button className="mt-4" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('common.back', '返回')}
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout userType={currentUserType}>
      <div className="max-w-6xl mx-auto space-y-6">
          {/* 头部信息 */}
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <Button variant="ghost" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('common.back', '返回')}
              </Button>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{registration.regReqNo}</h1>
                <RegistrationStatusBadge status={registration.status} />
              </div>
              <p className="text-muted-foreground">
                {t('registration.createdAt', '创建时间')}: {format(new Date(registration.createdAt), 'PPP', { locale: getDateLocale() })}
              </p>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2">
              {isSupplierView && registration.status === 'pending_response' && (
                <>
                  <Button 
                    onClick={() => acceptMutation.mutate()}
                    disabled={acceptMutation.isPending}
                  >
                    {acceptMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {t('registration.accept', '接受')}
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => setShowRejectDialog(true)}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    {t('registration.reject', '拒绝')}
                  </Button>
                </>
              )}
              {isSupplierView && registration.status === 'in_progress' && (
                <>
                  <Button 
                    variant="outline"
                    onClick={() => setShowProgressDialog(true)}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {t('registration.updateProgress', '更新进度')}
                  </Button>
                  <Button 
                    onClick={() => completeMutation.mutate()}
                    disabled={completeMutation.isPending}
                  >
                    {completeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {t('registration.complete', '完成')}
                  </Button>
                </>
              )}
              {!isSupplierView && ['pending_response', 'in_progress'].includes(registration.status) && (
                <Button 
                  variant="destructive"
                  onClick={() => cancelMutation.mutate()}
                  disabled={cancelMutation.isPending}
                >
                  {cancelMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <XCircle className="w-4 h-4 mr-2" />
                  {t('registration.cancel', '取消')}
                </Button>
              )}
            </div>
          </div>

          {/* 产品信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                {t('registration.productInfo', '产品信息')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('product.name', '产品名称')}</Label>
                  <p className="font-medium">{registration.productSnapshot.name}</p>
                </div>
                <div>
                  <Label>{t('product.category', '类别')}</Label>
                  <p className="font-medium">{registration.productSnapshot.category}</p>
                </div>
                <div>
                  <Label>{t('product.formulation', '剂型')}</Label>
                  <p className="font-medium">{registration.productSnapshot.formulation}</p>
                </div>
                <div>
                  <Label>{t('product.activeIngredient', '有效成分')}</Label>
                  <p className="font-medium">{registration.productSnapshot.activeIngredient}</p>
                </div>
                <div>
                  <Label>{t('product.content', '含量')}</Label>
                  <p className="font-medium">{registration.productSnapshot.content}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 登记要求 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {t('registration.requirements', '登记要求')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('registration.targetCountry', '目标国家')}</Label>
                  <p className="font-medium flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    {registration.details.targetCountry}
                  </p>
                </div>
                <div>
                  <Label>{t('registration.deadline', '截止日期')}</Label>
                  <p className="font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(registration.deadline), 'PP', { locale: getDateLocale() })}
                  </p>
                </div>
                <div>
                  <Label>{t('registration.budget', '预算')}</Label>
                  <p className="font-medium flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    {formatBudget()}
                  </p>
                </div>
                <div>
                  <Label>{t('registration.timeline', '时间周期')}</Label>
                  <p className="font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {registration.details.timeline}
                  </p>
                </div>
              </div>

              <div>
                <Label>{t('registration.documentRequirements', '文档要求')}</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {registration.details.docReqs.map(doc => (
                    <Badge key={doc} variant="secondary">{doc}</Badge>
                  ))}
                </div>
              </div>

              {registration.details.isExclusive && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {t('registration.exclusiveNote', '此为独家登记申请')}
                  </AlertDescription>
                </Alert>
              )}

              {registration.details.sampleReq.needed && (
                <div>
                  <Label>{t('registration.sampleRequirement', '样品要求')}</Label>
                  <p className="font-medium">
                    {registration.details.sampleReq.quantity} {registration.details.sampleReq.unit}
                  </p>
                </div>
              )}

              {registration.details.additionalRequirements && (
                <div>
                  <Label>{t('registration.additionalRequirements', '其他要求')}</Label>
                  <p className="mt-2 p-3 bg-muted rounded-md">
                    {registration.details.additionalRequirements}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 公司信息 */}
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  {t('registration.buyerInfo', '采购商信息')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <Label>{t('company.name', '公司名称')}</Label>
                    <p className="font-medium">{registration.buyer?.companyName}</p>
                  </div>
                  <div>
                    <Label>{t('company.contact', '联系人')}</Label>
                    <p className="font-medium">{registration.buyer?.contactName}</p>
                  </div>
                  <div>
                    <Label>{t('company.email', '邮箱')}</Label>
                    <p className="font-medium">{registration.buyer?.contactEmail}</p>
                  </div>
                  {registration.buyer?.contactPhone && (
                    <div>
                      <Label>{t('company.phone', '电话')}</Label>
                      <p className="font-medium">{registration.buyer.contactPhone}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  {t('registration.supplierInfo', '供应商信息')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <Label>{t('company.name', '公司名称')}</Label>
                    <p className="font-medium">{registration.supplier?.companyName}</p>
                  </div>
                  <div>
                    <Label>{t('company.contact', '联系人')}</Label>
                    <p className="font-medium">{registration.supplier?.contactName}</p>
                  </div>
                  <div>
                    <Label>{t('company.email', '邮箱')}</Label>
                    <p className="font-medium">{registration.supplier?.contactEmail}</p>
                  </div>
                  {registration.supplier?.contactPhone && (
                    <div>
                      <Label>{t('company.phone', '电话')}</Label>
                      <p className="font-medium">{registration.supplier.contactPhone}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 进度信息 */}
          {registration.progressNote && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5" />
                  {t('registration.progressInfo', '进度信息')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>{registration.progressNote}</p>
                {registration.estimatedCompletionDate && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t('registration.estimatedCompletion', '预计完成')}: {format(new Date(registration.estimatedCompletionDate), 'PP', { locale: getDateLocale() })}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* 拒绝原因 */}
          {registration.rejectReason && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>{t('registration.rejectReason', '拒绝原因')}:</strong> {registration.rejectReason}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* 拒绝对话框 */}
        {showRejectDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>{t('registration.rejectTitle', '拒绝登记申请')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('registration.rejectReasonLabel', '拒绝原因')}</Label>
                  <Textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder={t('registration.rejectReasonPlaceholder', '请输入拒绝原因...')}
                    rows={4}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                    {t('common.cancel', '取消')}
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => rejectMutation.mutate()}
                    disabled={!rejectReason || rejectMutation.isPending}
                  >
                    {rejectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('common.confirm', '确认')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 更新进度对话框 */}
        {showProgressDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>{t('registration.updateProgressTitle', '更新进度')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('registration.progressNoteLabel', '进度说明')}</Label>
                  <Textarea
                    value={progressNote}
                    onChange={(e) => setProgressNote(e.target.value)}
                    placeholder={t('registration.progressNotePlaceholder', '请输入当前进度...')}
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('registration.estimatedDateLabel', '预计完成日期')}</Label>
                  <Input
                    type="date"
                    value={estimatedDate}
                    onChange={(e) => setEstimatedDate(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowProgressDialog(false)}>
                    {t('common.cancel', '取消')}
                  </Button>
                  <Button 
                    onClick={() => updateProgressMutation.mutate()}
                    disabled={!progressNote || updateProgressMutation.isPending}
                  >
                    {updateProgressMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('common.submit', '提交')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
    </Layout>
  );
};

export default RegistrationDetailPage;