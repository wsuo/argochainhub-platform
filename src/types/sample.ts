// Type definitions for Sample Management module

export enum SampleRequestStatus {
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled'
}

export enum ShippingMethod {
  EXPRESS_DELIVERY = 'express_delivery',
  LOGISTICS_DELIVERY = 'logistics_delivery',
  SELF_PICKUP = 'self_pickup',
  AIR_FREIGHT = 'air_freight',
  SEA_FREIGHT = 'sea_freight'
}

export interface MultiLanguageText {
  'zh-CN': string;
  'en': string;
  'es'?: string;
}

export interface ProductSnapshot {
  id?: number;
  name: string;
  category: string;
  formulation?: string;
  activeIngredient?: string;
  content?: string;
  image?: string;
}

export interface SupplierInfo {
  id: number;
  name: MultiLanguageText | string;
  logo?: string;
  rating?: number;
  location?: string;
}

export interface BuyerInfo {
  id: number;
  name: MultiLanguageText | string;
}

export interface SampleRequestDetails {
  purpose?: string;
  shippingAddress?: string;
  shippingMethod?: string;
  willingnessToPay?: {
    paid: boolean;
    amount?: number;
  };
  specialRequirements?: string;
}

export interface TrackingInfo {
  carrier: string;
  trackingNumber: string;
  shippedAt?: string;
  estimatedDelivery?: string;
}

export interface SampleRequestListItem {
  id: number;
  sampleReqNo: string;
  status: SampleRequestStatus;
  quantity: number;
  unit: string;
  deadline: string;
  createdAt: string;
  updatedAt?: string;
  productSnapshot: ProductSnapshot;
  supplier: SupplierInfo;
  buyer?: BuyerInfo;
  details?: SampleRequestDetails;
  trackingInfo?: TrackingInfo;
}

export interface SampleRequestListResponse {
  success: boolean;
  message: string;
  data: SampleRequestListItem[];
  meta: {
    totalItems: number;
    currentPage: number;
    totalPages: number;
    itemsPerPage: number;
  };
}

export interface TimelineItem {
  id: number;
  action: string;
  status: SampleRequestStatus;
  description: string;
  operatorType: 'buyer' | 'supplier' | 'system';
  operatorName?: string;
  timestamp: string;
  notes?: string;
}

export interface SampleRequestDetail extends SampleRequestListItem {
  approvalInfo?: {
    approvedAt?: string;
    rejectedAt?: string;
    rejectionReason?: string;
    approverNotes?: string;
  };
  timeline?: TimelineItem[];
}

export interface CreateSampleRequestForm {
  productId: number;
  supplierId: number;
  quantity: number;
  unit: string;
  deadline: string;
  details: {
    purpose?: string;
    shippingAddress?: string;
    shippingMethod?: string;
    willingnessToPay?: {
      paid: boolean;
      amount?: number;
    };
    specialRequirements?: string;
  };
  contactInfo?: {
    contactPerson?: string;
    phone?: string;
    email?: string;
  };
}

export interface CreateSampleRequestResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    sampleReqNo: string;
    status: SampleRequestStatus;
    quantity: number;
    unit: string;
    deadline: string;
    createdAt: string;
  };
}

export interface SampleRequestQueryParams {
  page?: number;
  limit?: number;
  status?: SampleRequestStatus;
  supplierId?: number;
  keyword?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface CancelSampleRequestData {
  reason: string;
}

export interface ConfirmDeliveryData {
  receivedAt: string;
  condition: 'good' | 'damaged' | 'partial';
  notes?: string;
  images?: string[];
}

export interface SampleEvaluationData {
  rating: number;
  qualityRating: number;
  packagingRating: number;
  deliveryRating: number;
  comment: string;
  wouldRecommend: boolean;
}

export interface ApproveRequestData {
  notes?: string;
  estimatedShipDate?: string;
}

export interface RejectRequestData {
  reason: string;
}

export interface ShipRequestData {
  carrier: string;
  trackingNumber: string;
  notes?: string;
}

export interface SampleFiltersResponse {
  success: boolean;
  message: string;
  data: {
    statuses: Array<{
      value: string;
      label: string | {
        'zh-CN'?: string;
        'en'?: string;
        'es'?: string;
        [key: string]: string | undefined;
      };
      // 字典数据结构
      code?: string;
      name?: {
        'zh-CN'?: string;
        'en'?: string;
        'es'?: string;
        [key: string]: string | undefined;
      };
    }>;
    shippingMethods: Array<{
      value: string;
      label: string | {
        'zh-CN'?: string;
        'en'?: string;
        'es'?: string;
        [key: string]: string | undefined;
      };
    }>;
  };
}

export interface SampleStats {
  total: number;
  pendingApproval: number;
  approved: number;
  shipped: number;
  delivered: number;
  rejected: number;
  cancelled: number;
}