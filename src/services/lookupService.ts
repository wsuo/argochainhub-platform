import { httpClient } from './httpClient';
import { ApiResponse } from '@/types/api';

// 供应商查询接口类型
interface SupplierLookupItem {
  id: string;
  name: {
    'zh-CN': string;
    en?: string;
    es?: string;
  };
}

interface SuppliersLookupParams {
  search?: string;
  limit?: number;
  page?: number;
}

// 产品查询接口类型
interface ProductLookupItem {
  id: string;
  name: {
    'zh-CN': string;
    en?: string;
    es?: string;
  };
  supplierId: string;
}

interface ProductsLookupParams {
  search?: string;
  supplierId?: number;
  limit?: number;
  page?: number;
}

// API路径前缀
const API_PREFIX = '/api/v1';

class LookupService {
  // 供应商快速查询
  async getSuppliers(params: SuppliersLookupParams = {}): Promise<ApiResponse<SupplierLookupItem[]>> {
    const searchParams = new URLSearchParams();
    
    if (params.search) {
      searchParams.append('search', params.search);
    }
    if (params.limit) {
      searchParams.append('limit', params.limit.toString());
    } else {
      searchParams.append('limit', '20'); // 默认限制
    }
    if (params.page) {
      searchParams.append('page', params.page.toString());
    }

    const url = `${API_PREFIX}/companies/suppliers/lookup?${searchParams.toString()}`;
    
    return httpClient.get<ApiResponse<SupplierLookupItem[]>>(url, {
      module: 'lookup',
      action: 'read',
      resourceType: 'suppliers',
    });
  }

  // 产品快速查询
  async getProducts(params: ProductsLookupParams = {}): Promise<ApiResponse<ProductLookupItem[]>> {
    const searchParams = new URLSearchParams();
    
    if (params.search) {
      searchParams.append('search', params.search);
    }
    if (params.supplierId) {
      searchParams.append('supplierId', params.supplierId.toString());
    }
    if (params.limit) {
      searchParams.append('limit', params.limit.toString());
    } else {
      searchParams.append('limit', '20'); // 默认限制
    }
    if (params.page) {
      searchParams.append('page', params.page.toString());
    }

    const url = `${API_PREFIX}/products/lookup?${searchParams.toString()}`;
    
    return httpClient.get<ApiResponse<ProductLookupItem[]>>(url, {
      module: 'lookup',
      action: 'read',
      resourceType: 'products',
    });
  }
}

export const lookupService = new LookupService();
export type { SupplierLookupItem, ProductLookupItem, SuppliersLookupParams, ProductsLookupParams };