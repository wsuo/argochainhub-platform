import { 
  Product, 
  ProductListResponse, 
  ProductDetailResponse, 
  ProductSearchParams 
} from '@/types/product';
import { 
  mockProducts, 
  createMockProductListResponse, 
  createMockProductDetailResponse 
} from './mockProductData';

const API_BASE_URL = 'http://localhost:3050/api/v1';

class ProductService {
  private getAuthToken(): string {
    // 从localStorage获取token，使用与AuthService一致的键名
    const token = localStorage.getItem('agro_access_token');
    if (!token) {
      throw new Error('未找到认证token，请先登录');
    }
    return token;
  }

  private async makeRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
    const token = this.getAuthToken();
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  /**
   * 获取产品列表
   */
  async getProducts(params: ProductSearchParams = {}): Promise<ProductListResponse> {
    try {
      const searchParams = new URLSearchParams();
      
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());
      if (params.search) searchParams.append('search', encodeURIComponent(params.search));
      if (params.category) searchParams.append('category', encodeURIComponent(params.category));
      if (params.language) searchParams.append('language', params.language);

      const url = `${API_BASE_URL}/products?${searchParams.toString()}`;
      return await this.makeRequest<ProductListResponse>(url);
    } catch (error) {
      console.warn('API request failed, using mock data:', error);
      
      // 使用mock数据作为回退
      let filteredProducts = [...mockProducts];
      
      // 简单的搜索过滤
      if (params.search) {
        const searchTerm = params.search.toLowerCase();
        filteredProducts = filteredProducts.filter(product => 
          product.name['zh-CN'].toLowerCase().includes(searchTerm) ||
          product.name.en.toLowerCase().includes(searchTerm) ||
          product.pesticideName['zh-CN'].toLowerCase().includes(searchTerm) ||
          product.pesticideName.en.toLowerCase().includes(searchTerm) ||
          product.details.productCategory.toLowerCase().includes(searchTerm)
        );
      }
      
      // 分类过滤
      if (params.category) {
        filteredProducts = filteredProducts.filter(product => 
          product.details.productCategory === params.category
        );
      }
      
      return createMockProductListResponse(
        filteredProducts, 
        params.page || 1, 
        params.limit || 10
      );
    }
  }

  /**
   * 获取产品详情
   */
  async getProductDetail(id: string): Promise<ProductDetailResponse> {
    try {
      const url = `${API_BASE_URL}/products/${id}`;
      return await this.makeRequest<ProductDetailResponse>(url);
    } catch (error) {
      console.warn('API request failed, using mock data:', error);
      
      // 使用mock数据作为回退
      const product = mockProducts.find(p => p.id === id);
      if (!product) {
        throw new Error('产品未找到');
      }
      
      return createMockProductDetailResponse(product);
    }
  }

  /**
   * 搜索产品建议
   */
  async getSearchSuggestions(query: string): Promise<string[]> {
    // 简化实现，实际可能需要专门的搜索建议接口
    if (!query.trim()) return [];
    
    const response = await this.getProducts({
      search: query,
      limit: 5
    });
    
    return response.data.map(product => {
      // 根据当前语言返回产品名称
      const currentLang = localStorage.getItem('i18nextLng') || 'zh-CN';
      const langKey = currentLang as keyof typeof product.name;
      return product.name[langKey] || product.name['zh-CN'];
    });
  }

  /**
   * 获取产品分类标签列表（用于向后兼容）
   */
  async getProductCategoryLabels(): Promise<string[]> {
    try {
      // 调用字典接口获取产品分类
      const url = `${API_BASE_URL}/dictionaries/product_category`;
      const response = await this.makeRequest<{
        success: boolean;
        data: Array<{
          key: string;
          value: string;
          label: string;
        }>;
      }>(url);
      
      return response.data.map(item => item.label || item.value);
    } catch (error) {
      console.warn('Failed to fetch product categories from dictionary API, using fallback:', error);
      
      // 使用mock数据作为回退
      const categories = new Set(mockProducts.map(product => product.details.productCategory));
      return Array.from(categories);
    }
  }

  /**
   * 获取相关产品推荐
   */
  async getRelatedProducts(productId: string, limit: number = 6): Promise<Product[]> {
    // 简化实现：获取同供应商或同分类的产品
    const product = await this.getProductDetail(productId);
    const response = await this.getProducts({
      category: product.data.details.productCategory,
      limit: limit + 1 // +1 是为了排除当前产品
    });
    
    return response.data
      .filter(p => p.id !== productId)
      .slice(0, limit);
  }
}

export const productService = new ProductService();