// 企业认证服务
import { companyHttpClient } from './httpClient';
import { BusinessErrorContext } from '@/types/error';
import { CompanyAuthRequest, CompanyAuthResponse } from '@/types/company';

// API路径前缀
const API_PREFIX = '/api/v1';

// 企业认证服务类
export class CompanyAuthService {
  /**
   * 提交企业认证申请
   */
  static async submitCompanyAuth(data: CompanyAuthRequest): Promise<CompanyAuthResponse> {
    const businessContext: BusinessErrorContext = {
      module: 'company',
      action: 'create',
      resourceType: 'authentication'
    };

    return companyHttpClient.post<CompanyAuthResponse>(
      `${API_PREFIX}/companies/profile/company`,
      data,
      businessContext
    );
  }

  /**
   * 获取企业信息
   */
  static async getCompanyProfile(): Promise<any> {
    const businessContext: BusinessErrorContext = {
      module: 'company',
      action: 'read',
      resourceType: 'profile'
    };

    return companyHttpClient.get<any>(
      `${API_PREFIX}/companies/profile/company`,
      businessContext
    );
  }
}

export default CompanyAuthService;