// 供应商报价管理相关类型定义
import type { 
  Inquiry, 
  InquiryDetails, 
  InquiryItem, 
  InquiryMessage,
  InquiryStatus,
  InquiryCompany,
  PaginationMeta,
  ApiResponse 
} from './inquiry';
import { MultiLanguageText } from './product';

// 报价筛选参数
export interface QuoteFilters {
  status?: string;
  keyword?: string;
  startDate?: string;
  endDate?: string;
}

// 扩展的供应商报价详情
export interface SupplierQuoteDetails {
  totalPrice?: number;
  validUntil?: string;
  supplierRemarks?: string;
  currency?: string;
  unit?: string;
  termsAndConditions?: string;
}

// 完整的产品信息（包含在询价项中）
export interface ProductInfo {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: MultiLanguageText;
  pesticideName: MultiLanguageText;
  supplierId: string;
  minOrderQuantity: string;
  minOrderUnit: string;
  registrationNumber: string;
  registrationHolder: string;
  effectiveDate: string;
  firstApprovalDate: string;
  formulation: string;
  totalContent: string;
  toxicity: number;
  activeIngredient1?: {
    name: MultiLanguageText;
    content: string;
  };
  activeIngredient2?: {
    name: MultiLanguageText;
    content: string;
  };
  details: {
    remarks?: string;
    productCategory: string;
    exportRestrictedCountries: string[];
  };
  isListed: boolean;
  status: string;
}

// 扩展的询价项（包含完整产品信息）
export interface QuoteInquiryItem extends InquiryItem {
  inquiryId: string;
  productId: string;
  product?: ProductInfo;
}

// 扩展的买方公司信息
export interface QuoteBuyerCompany extends InquiryCompany {
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  status: string;
  profile: {
    phone: string;
    address: string;
    website?: string;
    description?: MultiLanguageText;
  };
  rating?: string;
  isTop100?: boolean;
  email: string;
  country: string;
  businessCategories: string[];
  businessScope?: MultiLanguageText;
  companySize?: string;
  mainProducts?: MultiLanguageText;
  annualImportExportValue?: string;
  registrationNumber?: string;
  taxNumber?: string;
  businessLicenseUrl?: string;
  companyPhotosUrls?: string;
}

// 扩展的供应商公司信息
export interface QuoteSupplierCompany extends InquiryCompany {
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  status: string;
  profile: {
    phone: string;
    address: string;
  };
  rating?: string;
  isTop100?: boolean;
  email?: string;
  country?: string;
  businessCategories?: string[];
  businessScope?: MultiLanguageText;
  companySize?: string;
  mainProducts?: MultiLanguageText;
  annualImportExportValue?: string;
  registrationNumber?: string;
  taxNumber?: string;
  businessLicenseUrl?: string;
  companyPhotosUrls?: string;
}

// 扩展的询价详情（包含供应商优先级）
export interface QuoteInquiryDetails extends InquiryDetails {
  supplierPriority?: 'low' | 'normal' | 'high' | 'urgent';
}

// 供应商报价主体（基于Inquiry，但包含扩展信息）
export interface Quote {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  inquiryNo: string;
  status: InquiryStatus;
  details: QuoteInquiryDetails;
  quoteDetails: SupplierQuoteDetails | null;
  deadline: string;
  buyerId: string;
  buyer: QuoteBuyerCompany;
  supplierId: string;
  supplier: QuoteSupplierCompany;
  items: QuoteInquiryItem[];
  recentMessages?: InquiryMessage[];
}

// 报价统计信息
export interface QuoteStats {
  pendingQuoteCount: number;
  quotedCount: number;
  confirmedCount: number;
  declinedCount: number;
  totalCount: number;
  monthlyQuoteCount: number;
  successRate: string;
}

// 批量操作请求
export interface BatchUpdateRequest {
  inquiryIds: number[];
  action: 'decline' | 'update_priority';
  reason?: string; // 拒绝原因（当action为decline时必填）
  priority?: 'low' | 'normal' | 'high' | 'urgent'; // 优先级（当action为update_priority时必填）
}

// 批量操作响应
export interface BatchUpdateResponse {
  success: boolean;
  message: string;
  data: {
    successCount: number;
    failCount: number;
    errors: string[];
  };
}

// 报价历史响应
export interface QuoteHistoryResponse {
  success: boolean;
  message: string;
  data: {
    inquiry: {
      id: number;
      inquiryNo: string;
      status: string;
      quoteDetails?: {
        totalPrice: number;
        validUntil: string;
        supplierRemarks: string;
      };
      buyer: {
        id: number;
        name: MultiLanguageText;
      };
    };
    history: Array<{
      id: number;
      message: string;
      createdAt: string;
      sender: {
        id: number;
        name: string;
      };
    }>;
  };
}

// API响应类型
export interface QuoteListResponse extends ApiResponse<Quote[]> {
  meta: PaginationMeta;
}

export interface QuoteDetailResponse extends ApiResponse<Quote> {}

export interface QuoteStatsResponse extends ApiResponse<QuoteStats> {}

// 查询参数
export interface QuoteQueryParams {
  page?: number;
  limit?: number;
  status?: InquiryStatus;
  startDate?: string;
  endDate?: string;
  inquiryNo?: string;
  buyerCompanyName?: string;
}

// 重新导出常用类型以便组件使用
export type { 
  Inquiry, 
  InquiryStatus, 
  InquiryMessage,
  MessageQueryParams,
  SendMessageRequest,
  SendMessageResponse,
  InquiryMessageListResponse,
  PaginationMeta 
} from './inquiry';