import { httpClient } from './httpClient';
import { PaginatedResponse, ApiResponse } from '@/types/common';
import { 
  RegistrationRequest, 
  CreateRegistrationRequestPayload,
  UpdateProgressPayload,
  RejectRequestPayload,
  RegistrationStats
} from '@/types/registration';
import { BusinessErrorContext } from '@/types/error';

export class RegistrationService {
  private static readonly BASE_URL = '/api/v1/registration-requests';

  // 采购商接口
  static async createRegistrationRequest(payload: CreateRegistrationRequestPayload): Promise<ApiResponse<RegistrationRequest>> {
    const businessContext: BusinessErrorContext = {
      module: 'registration',
      action: 'create',
      resourceType: 'registration_request'
    };

    return httpClient.post<ApiResponse<RegistrationRequest>>(
      this.BASE_URL, 
      payload,
      businessContext
    );
  }

  static async getMyRegistrationRequests(params?: {
    page?: number;
    limit?: number;
    status?: string;
    supplierId?: number;
    productId?: number;
    targetCountry?: string;
    createdStartDate?: string;
    createdEndDate?: string;
    keyword?: string;
  }): Promise<PaginatedResponse<RegistrationRequest>> {
    const searchParams = new URLSearchParams();
    
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.status) searchParams.append('status', params.status);
    if (params?.supplierId) searchParams.append('supplierId', params.supplierId.toString());
    if (params?.productId) searchParams.append('productId', params.productId.toString());
    if (params?.targetCountry) searchParams.append('targetCountry', params.targetCountry);
    if (params?.createdStartDate) searchParams.append('createdStartDate', params.createdStartDate);
    if (params?.createdEndDate) searchParams.append('createdEndDate', params.createdEndDate);
    if (params?.keyword) searchParams.append('keyword', params.keyword);

    const queryString = searchParams.toString();
    const url = queryString ? `${this.BASE_URL}?${queryString}` : this.BASE_URL;

    const businessContext: BusinessErrorContext = {
      module: 'registration',
      action: 'read',
      resourceType: 'registration_request'
    };

    return httpClient.get<PaginatedResponse<RegistrationRequest>>(url, businessContext);
  }

  static async getRegistrationRequestDetail(id: string): Promise<ApiResponse<RegistrationRequest>> {
    const businessContext: BusinessErrorContext = {
      module: 'registration',
      action: 'read',
      resourceType: 'registration_request'
    };

    return httpClient.get<ApiResponse<RegistrationRequest>>(
      `${this.BASE_URL}/${id}`,
      businessContext
    );
  }

  static async cancelRegistrationRequest(id: string): Promise<ApiResponse<RegistrationRequest>> {
    const businessContext: BusinessErrorContext = {
      module: 'registration',
      action: 'update',
      resourceType: 'registration_request'
    };

    return httpClient.patch<ApiResponse<RegistrationRequest>>(
      `${this.BASE_URL}/${id}/cancel`,
      undefined,
      businessContext
    );
  }

  static async getStats(): Promise<ApiResponse<RegistrationStats>> {
    const businessContext: BusinessErrorContext = {
      module: 'registration',
      action: 'read',
      resourceType: 'stats'
    };

    return httpClient.get<ApiResponse<RegistrationStats>>(
      `${this.BASE_URL}/stats`,
      businessContext
    );
  }

  // 供应商接口
  static async getReceivedRegistrationRequests(params?: {
    page?: number;
    limit?: number;
    status?: string;
    buyerId?: number;
    productId?: number;
    targetCountry?: string;
    createdStartDate?: string;
    createdEndDate?: string;
    keyword?: string;
  }): Promise<PaginatedResponse<RegistrationRequest>> {
    const searchParams = new URLSearchParams();
    
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.status) searchParams.append('status', params.status);
    if (params?.buyerId) searchParams.append('buyerId', params.buyerId.toString());
    if (params?.productId) searchParams.append('productId', params.productId.toString());
    if (params?.targetCountry) searchParams.append('targetCountry', params.targetCountry);
    if (params?.createdStartDate) searchParams.append('createdStartDate', params.createdStartDate);
    if (params?.createdEndDate) searchParams.append('createdEndDate', params.createdEndDate);
    if (params?.keyword) searchParams.append('keyword', params.keyword);

    const queryString = searchParams.toString();
    const url = queryString ? `${this.BASE_URL}/received?${queryString}` : `${this.BASE_URL}/received`;

    const businessContext: BusinessErrorContext = {
      module: 'registration',
      action: 'read',
      resourceType: 'registration_request'
    };

    return httpClient.get<PaginatedResponse<RegistrationRequest>>(url, businessContext);
  }

  static async getReceivedRegistrationRequestDetail(id: string): Promise<ApiResponse<RegistrationRequest>> {
    const businessContext: BusinessErrorContext = {
      module: 'registration',
      action: 'read',
      resourceType: 'registration_request'
    };

    return httpClient.get<ApiResponse<RegistrationRequest>>(
      `${this.BASE_URL}/received/${id}`,
      businessContext
    );
  }

  static async acceptRegistrationRequest(id: string): Promise<ApiResponse<RegistrationRequest>> {
    const businessContext: BusinessErrorContext = {
      module: 'registration',
      action: 'update',
      resourceType: 'registration_request'
    };

    return httpClient.patch<ApiResponse<RegistrationRequest>>(
      `${this.BASE_URL}/${id}/accept`,
      undefined,
      businessContext
    );
  }

  static async rejectRegistrationRequest(id: string, payload: RejectRequestPayload): Promise<ApiResponse<RegistrationRequest>> {
    const businessContext: BusinessErrorContext = {
      module: 'registration',
      action: 'update',
      resourceType: 'registration_request'
    };

    return httpClient.patch<ApiResponse<RegistrationRequest>>(
      `${this.BASE_URL}/${id}/reject`,
      payload,
      businessContext
    );
  }

  static async updateProgress(id: string, payload: UpdateProgressPayload): Promise<ApiResponse<RegistrationRequest>> {
    const businessContext: BusinessErrorContext = {
      module: 'registration',
      action: 'update',
      resourceType: 'registration_request'
    };

    return httpClient.patch<ApiResponse<RegistrationRequest>>(
      `${this.BASE_URL}/${id}/progress`,
      payload,
      businessContext
    );
  }

  static async completeRegistrationRequest(id: string): Promise<ApiResponse<RegistrationRequest>> {
    const businessContext: BusinessErrorContext = {
      module: 'registration',
      action: 'update',
      resourceType: 'registration_request'
    };

    return httpClient.patch<ApiResponse<RegistrationRequest>>(
      `${this.BASE_URL}/${id}/complete`,
      undefined,
      businessContext
    );
  }

  static async getReceivedStats(): Promise<ApiResponse<RegistrationStats>> {
    const businessContext: BusinessErrorContext = {
      module: 'registration',
      action: 'read',
      resourceType: 'stats'
    };

    return httpClient.get<ApiResponse<RegistrationStats>>(
      `${this.BASE_URL}/received/stats`,
      businessContext
    );
  }
}