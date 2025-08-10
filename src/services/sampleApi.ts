import { httpClient } from './httpClient';
import type { 
  CreateSampleRequestForm,
  CreateSampleRequestResponse,
  SampleRequestDetail,
  SampleRequestListResponse,
  SampleRequestQueryParams,
  CancelSampleRequestData,
  ConfirmDeliveryData,
  SampleEvaluationData,
  ApproveRequestData,
  RejectRequestData,
  ShipRequestData,
  SampleFiltersResponse,
  SampleStats
} from '@/types/sample';

class SampleApi {
  private baseUrl = '/api/v1/samples';

  // 采购商端接口

  /**
   * 创建样品申请
   */
  async createSampleRequest(data: CreateSampleRequestForm): Promise<CreateSampleRequestResponse> {
    const response = await httpClient.post<CreateSampleRequestResponse>(
      this.baseUrl,
      data
    );
    return response;
  }

  /**
   * 获取我的样品申请列表
   */
  async getSampleRequests(params?: SampleRequestQueryParams): Promise<SampleRequestListResponse> {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    const response = await httpClient.get<SampleRequestListResponse>(
      `${this.baseUrl}${queryString}`
    );
    return response;
  }

  /**
   * 获取样品申请详情
   */
  async getSampleRequest(id: number): Promise<{ success: boolean; message: string; data: SampleRequestDetail }> {
    const response = await httpClient.get<{ success: boolean; message: string; data: SampleRequestDetail }>(
      `${this.baseUrl}/${id}`
    );
    return response;
  }

  /**
   * 取消样品申请
   */
  async cancelSampleRequest(id: number, data: CancelSampleRequestData): Promise<{ success: boolean; message: string; data: SampleRequestDetail }> {
    const response = await httpClient.put<{ success: boolean; message: string; data: SampleRequestDetail }>(
      `${this.baseUrl}/${id}/cancel`,
      data
    );
    return response;
  }

  /**
   * 确认收货
   */
  async confirmDelivery(id: number, data: ConfirmDeliveryData): Promise<{ success: boolean; message: string; data: SampleRequestDetail }> {
    const response = await httpClient.put<{ success: boolean; message: string; data: SampleRequestDetail }>(
      `${this.baseUrl}/${id}/confirm-delivery`,
      data
    );
    return response;
  }

  /**
   * 评价样品
   */
  async evaluateSample(id: number, data: SampleEvaluationData): Promise<{ success: boolean; message: string }> {
    const response = await httpClient.post<{ success: boolean; message: string }>(
      `${this.baseUrl}/${id}/evaluate`,
      data
    );
    return response;
  }

  /**
   * 获取统计数据
   */
  async getSampleStats(): Promise<{ success: boolean; message: string; data: SampleStats }> {
    const response = await httpClient.get<{ success: boolean; message: string; data: SampleStats }>(
      `${this.baseUrl}/stats`
    );
    return response;
  }

  // 供应商端接口

  /**
   * 获取收到的样品申请
   */
  async getSupplierSampleRequests(params?: SampleRequestQueryParams): Promise<SampleRequestListResponse> {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    const response = await httpClient.get<SampleRequestListResponse>(
      `${this.baseUrl}/supplier${queryString}`
    );
    return response;
  }

  /**
   * 批准样品申请
   */
  async approveSampleRequest(id: number, data: ApproveRequestData): Promise<{ success: boolean; message: string; data: SampleRequestDetail }> {
    const response = await httpClient.put<{ success: boolean; message: string; data: SampleRequestDetail }>(
      `${this.baseUrl}/${id}/approve`,
      data
    );
    return response;
  }

  /**
   * 拒绝样品申请
   */
  async rejectSampleRequest(id: number, data: RejectRequestData): Promise<{ success: boolean; message: string; data: SampleRequestDetail }> {
    const response = await httpClient.put<{ success: boolean; message: string; data: SampleRequestDetail }>(
      `${this.baseUrl}/${id}/reject`,
      data
    );
    return response;
  }

  /**
   * 发货
   */
  async shipSample(id: number, data: ShipRequestData): Promise<{ success: boolean; message: string; data: SampleRequestDetail }> {
    const response = await httpClient.put<{ success: boolean; message: string; data: SampleRequestDetail }>(
      `${this.baseUrl}/${id}/ship`,
      data
    );
    return response;
  }

  // 公共接口

  /**
   * 获取筛选选项
   */
  async getSampleFilters(): Promise<SampleFiltersResponse> {
    const response = await httpClient.get<SampleFiltersResponse>(
      `${this.baseUrl}/filters`
    );
    return response;
  }
}

export const sampleApi = new SampleApi();