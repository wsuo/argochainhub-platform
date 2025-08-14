// 供应商相关类型定义
export interface MultiLanguageText {
  'zh-CN': string;
  'en': string;
  'es'?: string;
}

// 收藏供应商接口
export interface FavoriteSupplier {
  id: number;
  userId: number;
  supplierId: number;
  note: string;
  createdAt: string;
  supplier: Supplier;
}

// 获取收藏列表参数
export interface GetFavoritesParams {
  search?: string;
  page?: number;
  limit?: number;
}

// 收藏列表响应
export interface FavoriteListResponse {
  success: boolean;
  message: string;
  data: FavoriteSupplier[];
  meta: {
    totalItems: number;
    itemCount: number;
    currentPage: number;
    totalPages: number;
    itemsPerPage: number;
  };
}

export interface SupplierProfile {
  description: MultiLanguageText;
  address: string;
  phone: string;
  website?: string;
}

export interface Price {
  amount: number;
  currency: string;
}

export interface SupplierProduct {
  id: number;
  name: MultiLanguageText;
  description?: MultiLanguageText;
  category: string;
  status: 'active' | 'inactive';
  price: Price;
  unit: string;
  minOrderQuantity: number;
  images: string[];
  supplierId: number;
  createdAt: string;
}

export interface Supplier {
  id: number;
  name: MultiLanguageText;
  type: 'supplier';
  status: 'active' | 'inactive';
  country: string | null;
  companySize: 'small' | 'medium' | 'large' | null;
  isTop100: boolean;
  rating: string | null; // API 返回字符串格式的评分，可能为 null
  businessCategories?: string[] | null;
  businessScope?: MultiLanguageText | null;
  mainProducts?: MultiLanguageText | null;
  annualImportExportValue?: string | null;
  profile: SupplierProfile | null; // profile 可能为 null
  products?: SupplierProduct[];
  email?: string | null;
  registrationNumber?: string | null;
  taxNumber?: string | null;
  businessLicenseUrl?: string | null;
  companyPhotosUrls?: string[] | null;
  createdAt: string;
  updatedAt?: string;
}

export interface SupplierSearchParams {
  search?: string;
  country?: string;
  companySize?: 'small' | 'medium' | 'large';
  sortBy?: 'createdAt' | 'productCount' | 'name';
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
  isTop100?: boolean; // 用于筛选Top100供应商
}

export interface SupplierFavorite {
  id: number;
  userId: number;
  supplierId: number;
  note?: string;
  createdAt: string;
  updatedAt?: string;
  supplier?: Supplier;
}

export interface FavoriteRequest {
  supplierId: number;
  note?: string;
}

export interface FavoriteUpdateRequest {
  note: string;
}

export interface FavoriteStatusResponse {
  isFavorited: boolean;
}

export interface GetFavoritesParams {
  search?: string;
  page?: number;
  limit?: number;
}

export interface SuppliersLookupParams {
  search?: string;
  page?: number;
  limit?: number;
}

export interface GetProductsParams {
  supplierId: number;
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    totalItems: number;
    itemCount: number;
    currentPage: number;
    totalPages: number;
    itemsPerPage: number;
    hasNextPage?: boolean;
    hasPrevious?: boolean;
  };
}

// 用于前端状态管理的类型
export interface SupplierFilters {
  search: string;
  country: string;
  companySize: string;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
}

export type SupplierTab = 'all' | 'top100' | 'favorites';

export interface SupplierPageState {
  suppliers: Supplier[];
  loading: boolean;
  error: string | null;
  activeTab: SupplierTab;
  filters: SupplierFilters;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
  favorites: Record<number, boolean>; // 供应商ID -> 是否收藏
}