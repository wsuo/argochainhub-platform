// 农药产品相关类型定义

export interface MultiLanguageText {
  'zh-CN': string;
  en: string;
  es: string;
}

export interface ActiveIngredient {
  name: MultiLanguageText;
  content: string;
}

export interface ProductDetails {
  description: string;
  productCategory: string;
}

export interface SupplierProfile {
  phone: string;
  address: string;
  website: string;
  description: MultiLanguageText;
  certificates: string[];
}

export interface Supplier {
  id: string;
  name: MultiLanguageText;
  profile?: SupplierProfile;
  rating: string;
  isTop100: boolean;
}

export interface Product {
  id: string;
  name: MultiLanguageText;
  pesticideName: MultiLanguageText;
  formulation: string;
  totalContent: string;
  activeIngredient1?: ActiveIngredient;
  activeIngredient2?: ActiveIngredient;
  activeIngredient3?: ActiveIngredient;
  details: ProductDetails;
  supplier: Supplier;
  status: 'active' | 'inactive';
  isListed: boolean;
  registrationNumber?: string;
}

export interface ProductListResponse {
  success: boolean;
  message: string;
  data: Product[];
  meta: {
    totalItems: number;
    currentPage: number;
    totalPages: number;
    itemsPerPage: number;
  };
}

export interface ProductDetailResponse {
  success: boolean;
  message: string;
  data: Product;
}

export interface ProductSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  language?: string;
}

export interface ProductFilters {
  category: string;
  supplierRating: string;
  isTop100: boolean | null;
}

export interface SearchSuggestion {
  type: 'product' | 'category' | 'supplier';
  label: string;
  value: string;
}