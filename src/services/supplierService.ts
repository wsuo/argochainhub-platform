import { httpClient } from './httpClient';
import {
  Supplier,
  SupplierSearchParams,
  SupplierFavorite,
  FavoriteRequest,
  FavoriteUpdateRequest,
  FavoriteStatusResponse,
  GetFavoritesParams,
  SuppliersLookupParams,
  GetProductsParams,
  SupplierProduct,
  ApiResponse
} from '@/types/supplier';

const API_PREFIX = '/api/v1';

export class SupplierService {
  /**
   * 搜索供应商
   */
  static async searchSuppliers(params: SupplierSearchParams = {}): Promise<ApiResponse<Supplier[]>> {
    const searchParams = new URLSearchParams();
    
    // 构建查询参数
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });

    const url = `${API_PREFIX}/companies/suppliers${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    
    return httpClient.get<ApiResponse<Supplier[]>>(url, {
      module: 'supplier',
      action: 'read',
      resourceType: 'list',
    });
  }

  /**
   * 获取供应商详情
   */
  static async getSupplierDetails(supplierId: number): Promise<ApiResponse<Supplier>> {
    const url = `${API_PREFIX}/companies/suppliers/${supplierId}`;
    
    return httpClient.get<ApiResponse<Supplier>>(url, {
      module: 'supplier',
      action: 'read',
      resourceType: 'detail',
    });
  }

  /**
   * 添加供应商到收藏
   */
  static async addToFavorites(request: FavoriteRequest): Promise<ApiResponse<SupplierFavorite>> {
    const url = `${API_PREFIX}/companies/suppliers/favorites`;
    
    return httpClient.post<ApiResponse<SupplierFavorite>>(url, request, {
      module: 'supplier',
      action: 'create',
      resourceType: 'favorite',
    });
  }

  /**
   * 获取收藏的供应商列表
   */
  static async getFavorites(params: GetFavoritesParams = {}): Promise<ApiResponse<SupplierFavorite[]>> {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });

    const url = `${API_PREFIX}/companies/suppliers/favorites/list${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    
    return httpClient.get<ApiResponse<SupplierFavorite[]>>(url, {
      module: 'supplier',
      action: 'read',
      resourceType: 'favorites',
    });
  }

  /**
   * 检查供应商收藏状态
   */
  static async checkFavoriteStatus(supplierId: number): Promise<ApiResponse<FavoriteStatusResponse>> {
    const url = `${API_PREFIX}/companies/suppliers/favorites/${supplierId}/status`;
    
    return httpClient.get<ApiResponse<FavoriteStatusResponse>>(url, {
      module: 'supplier',
      action: 'read',
      resourceType: 'favorite-status',
    });
  }

  /**
   * 更新收藏备注
   */
  static async updateFavoriteNote(supplierId: number, request: FavoriteUpdateRequest): Promise<ApiResponse<SupplierFavorite>> {
    const url = `${API_PREFIX}/companies/suppliers/favorites/${supplierId}`;
    
    return httpClient.put<ApiResponse<SupplierFavorite>>(url, request, {
      module: 'supplier',
      action: 'update',
      resourceType: 'favorite',
    });
  }

  /**
   * 取消收藏供应商
   */
  static async removeFavorite(supplierId: number): Promise<ApiResponse<void>> {
    const url = `${API_PREFIX}/companies/suppliers/favorites/${supplierId}`;
    
    return httpClient.delete<ApiResponse<void>>(url, {
      module: 'supplier',
      action: 'delete',
      resourceType: 'favorite',
    });
  }

  /**
   * 获取供应商产品列表
   */
  static async getSupplierProducts(params: GetProductsParams): Promise<ApiResponse<SupplierProduct[]>> {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });

    const url = `${API_PREFIX}/products?${searchParams.toString()}`;
    
    return httpClient.get<ApiResponse<SupplierProduct[]>>(url, {
      module: 'supplier',
      action: 'read',
      resourceType: 'products',
    });
  }

  /**
   * 轻量级供应商查找
   */
  static async lookupSuppliers(params: SuppliersLookupParams = {}): Promise<ApiResponse<Pick<Supplier, 'id' | 'name'>[]>> {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });

    const url = `${API_PREFIX}/companies/suppliers/lookup${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    
    return httpClient.get<ApiResponse<Pick<Supplier, 'id' | 'name'>[]>>(url, {
      module: 'supplier',
      action: 'read',
      resourceType: 'lookup',
    });
  }

  /**
   * 批量检查收藏状态（优化版本）
   */
  static async batchCheckFavoriteStatus(supplierIds: number[]): Promise<Record<number, boolean>> {
    const promises = supplierIds.map(async (id) => {
      try {
        const response = await this.checkFavoriteStatus(id);
        return { id, isFavorited: response.data.isFavorited };
      } catch (error) {
        console.warn(`Failed to check favorite status for supplier ${id}:`, error);
        return { id, isFavorited: false };
      }
    });

    const results = await Promise.all(promises);
    return results.reduce((acc, { id, isFavorited }) => {
      acc[id] = isFavorited;
      return acc;
    }, {} as Record<number, boolean>);
  }
}

export default SupplierService;