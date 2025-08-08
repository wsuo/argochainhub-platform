// 询价管理相关类型定义
import { MultiLanguageText } from './product';

// 询价状态枚举
export type InquiryStatus = 
  | 'pending_quote'   // 等待报价
  | 'quoted'          // 已报价
  | 'confirmed'       // 已确认
  | 'declined'        // 已拒绝
  | 'expired'         // 已过期
  | 'cancelled';      // 已取消

// 公司信息接口
export interface InquiryCompany {
  id: string;
  name: MultiLanguageText;
  type: 'buyer' | 'supplier';
}

// 询价商品明细
export interface InquiryItem {
  id: string;
  quantity: string;
  unit: string;
  packagingReq: string;
  productSnapshot: {
    name: MultiLanguageText;
    formulation: string;
    totalContent: string;
  };
}

// 询价详情
export interface InquiryDetails {
  deliveryLocation: string;
  tradeTerms: string;
  paymentMethod: string;
  buyerRemarks?: string;
}

// 报价详情
export interface QuoteDetails {
  totalPrice?: number;
  validUntil?: string;
  supplierRemarks?: string;
}

// 消息发送者信息
export interface MessageSender {
  id: string;
  name: string;
  userType: 'buyer' | 'supplier';
  company: {
    id: string;
    name: MultiLanguageText;
    type: 'buyer' | 'supplier';
  };
}

// 询价消息
export interface InquiryMessage {
  id: string;
  relatedService: 'inquiry';
  relatedId: string;
  message: string;
  senderId: string;
  createdAt: string;
  sender: MessageSender;
}

// 询价主体
export interface Inquiry {
  id: string;
  inquiryNo: string;
  status: InquiryStatus;
  details: InquiryDetails;
  quoteDetails?: QuoteDetails;
  deadline: string;
  buyer: InquiryCompany;
  supplier: InquiryCompany;
  items: InquiryItem[];
  recentMessages?: InquiryMessage[];
  messageCount: number; // 消息数量
  createdAt: string;
  updatedAt: string;
}

// API响应接口
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

// 分页元信息
export interface PaginationMeta {
  totalItems: number;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
}

// 询价列表响应
export interface InquiryListResponse {
  success: boolean;
  message: string;
  data: Inquiry[];
  meta: PaginationMeta;
}

// 询价详情响应
export interface InquiryDetailResponse {
  success: boolean;
  message: string;
  data: Inquiry;
}

// 消息列表响应
export interface InquiryMessageListResponse {
  success: boolean;
  message: string;
  data: InquiryMessage[];
  meta: PaginationMeta;
}

// 发送消息请求
export interface SendMessageRequest {
  message: string;
}

// 发送消息响应
export interface SendMessageResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    relatedService: 'inquiry';
    relatedId: number;
    message: string;
    senderId: string;
    createdAt: string;
  };
}

// 询价查询参数
export interface InquiryQueryParams {
  page?: number;
  limit?: number;
  status?: InquiryStatus;
}

// 消息查询参数
export interface MessageQueryParams {
  page?: number;
  limit?: number;
  desc?: boolean;
}

// 创建询价商品项（根据API文档调整）
export interface CreateInquiryItemRequest {
  productId: number;        // 改为number类型
  quantity: number;
  unit: string;             // 字段名从quantityUnit改为unit
  packagingReq?: string;    // 字段名从packagingRequirements改为packagingReq
}

// 创建询价详情（根据API文档调整）
export interface CreateInquiryDetailsRequest {
  deliveryLocation?: string;  // 改为可选
  tradeTerms?: string;
  paymentMethod?: string;
  buyerRemarks?: string;      // 字段名从remarks改为buyerRemarks
}

// 创建询价请求（根据API文档调整）
export interface CreateInquiryRequest {
  supplierId: number;        // 移到顶层，改为number类型
  deadline: string;          // 移到顶层
  items: CreateInquiryItemRequest[];
  details: CreateInquiryDetailsRequest;
}

// 询价状态本地化映射
export interface InquiryStatusLabels {
  'pending_quote': string;
  'quoted': string;
  'confirmed': string;
  'declined': string;
  'expired': string;
  'cancelled': string;
}