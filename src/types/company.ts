// 企业认证相关类型定义
export interface MultiLanguageText {
  'zh-CN': string;
  'en': string;
  'es': string;
}

export interface CompanyAuthRequest {
  companyName: MultiLanguageText;
  businessScope: MultiLanguageText;
  mainProducts: MultiLanguageText;
  mainSuppliers: MultiLanguageText;
  companySize: 'small' | 'medium' | 'large';
  country: string;
  businessCategories: string[];
  phone: string;
  address: string;
  website?: string;
  registrationNumber: string;
  taxNumber?: string;
  annualImportExportValue?: number;
  businessLicenseUrl?: string;
  companyPhotosUrls?: string[];
}

export interface CompanyAuthResponse {
  id: string;
  name: MultiLanguageText;
  type: 'buyer' | 'supplier';
  status: 'pending_review' | 'active' | 'disabled';
}

export interface Company {
  id: string;
  name: MultiLanguageText;
  type: 'buyer' | 'supplier';
  status: 'pending_review' | 'active' | 'disabled';
  businessScope?: MultiLanguageText;
  mainProducts?: MultiLanguageText;
  mainSuppliers?: MultiLanguageText;
  companySize?: 'small' | 'medium' | 'large';
  country?: string;
  businessCategories?: string[];
  phone?: string;
  address?: string;
  website?: string;
  registrationNumber?: string;
  taxNumber?: string;
  annualImportExportValue?: number;
  businessLicenseUrl?: string;
  companyPhotosUrls?: string[];
}

export const COMPANY_SIZES = [
  { value: 'small', label: '小型企业' },
  { value: 'medium', label: '中型企业' },
  { value: 'large', label: '大型企业' }
] as const;

export const BUSINESS_CATEGORIES = [
  { value: 'domestic_trade', label: '国内贸易' },
  { value: 'international_trade', label: '国际贸易' },
  { value: 'manufacturing', label: '生产制造' },
  { value: 'distribution', label: '分销代理' },
  { value: 'retail', label: '零售' }
] as const;

export const COUNTRIES = [
  { value: 'cn', label: '中国' },
  { value: 'us', label: '美国' },
  { value: 'jp', label: '日本' },
  { value: 'kr', label: '韩国' },
  { value: 'de', label: '德国' },
  { value: 'fr', label: '法国' },
  { value: 'gb', label: '英国' },
  { value: 'it', label: '意大利' },
  { value: 'es', label: '西班牙' },
  { value: 'nl', label: '荷兰' },
  { value: 'in', label: '印度' },
  { value: 'br', label: '巴西' },
  { value: 'au', label: '澳大利亚' },
  { value: 'ca', label: '加拿大' }
] as const;