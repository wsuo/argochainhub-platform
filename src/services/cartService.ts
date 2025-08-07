import { 
  CartResponse, 
  CartItemResponse, 
  CartCountResponse, 
  BatchOperationResponse,
  AddToCartRequest, 
  UpdateCartItemRequest, 
  BatchRemoveRequest,
  InquiryRequest,
  SampleRequest,
  RegistrationRequest
} from '@/types/cart';

const API_BASE_URL = 'http://localhost:3050/api/v1/cart';

class CartService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('agro_access_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  async getCart(): Promise<CartResponse> {
    const response = await fetch(API_BASE_URL, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<CartResponse>(response);
  }

  async addToCart(request: AddToCartRequest): Promise<CartItemResponse> {
    const response = await fetch(`${API_BASE_URL}/items`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(request),
    });
    return this.handleResponse<CartItemResponse>(response);
  }

  async updateCartItem(itemId: string, request: UpdateCartItemRequest): Promise<CartItemResponse> {
    const response = await fetch(`${API_BASE_URL}/items/${itemId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(request),
    });
    return this.handleResponse<CartItemResponse>(response);
  }

  async removeCartItem(itemId: string): Promise<BatchOperationResponse> {
    const response = await fetch(`${API_BASE_URL}/items/${itemId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<BatchOperationResponse>(response);
  }

  async batchRemoveItems(request: BatchRemoveRequest): Promise<BatchOperationResponse> {
    const response = await fetch(`${API_BASE_URL}/items/batch`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(request),
    });
    return this.handleResponse<BatchOperationResponse>(response);
  }

  async clearCart(): Promise<BatchOperationResponse> {
    const response = await fetch(`${API_BASE_URL}/clear`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<BatchOperationResponse>(response);
  }

  async getCartCount(): Promise<CartCountResponse> {
    const response = await fetch(`${API_BASE_URL}/count`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<CartCountResponse>(response);
  }

  async getSupplierItems(supplierId: string): Promise<{
    success: boolean;
    message: string;
    data: any[];
  }> {
    const response = await fetch(`${API_BASE_URL}/supplier/${supplierId}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async batchCreateInquiry(request: InquiryRequest): Promise<BatchOperationResponse> {
    const response = await fetch(`${API_BASE_URL}/batch/inquiry`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(request),
    });
    return this.handleResponse<BatchOperationResponse>(response);
  }

  async batchRequestSample(request: SampleRequest): Promise<BatchOperationResponse> {
    const response = await fetch(`${API_BASE_URL}/batch/sample-request`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(request),
    });
    return this.handleResponse<BatchOperationResponse>(response);
  }

  async batchRequestRegistration(request: RegistrationRequest): Promise<BatchOperationResponse> {
    const response = await fetch(`${API_BASE_URL}/batch/registration-request`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(request),
    });
    return this.handleResponse<BatchOperationResponse>(response);
  }

  isInCart(productId: string, cartItems: any[]): boolean {
    return cartItems.some(item => item.productSnapshot?.id === productId || item.productId === productId);
  }

  getCartItemCount(cartItems: any[]): number {
    return cartItems?.length || 0;
  }

  groupItemsBySupplier(cartItems: any[]): Record<string, any> {
    return cartItems.reduce((groups, item) => {
      const supplierId = item.supplierId || item.supplierSnapshot?.id;
      if (!groups[supplierId]) {
        groups[supplierId] = {
          supplier: item.supplierSnapshot || {
            id: supplierId,
            name: { 'zh-CN': '未知供应商', en: 'Unknown Supplier', es: 'Proveedor Desconocido' },
            rating: '0',
            isTop100: false
          },
          items: []
        };
      }
      groups[supplierId].items.push(item);
      return groups;
    }, {} as Record<string, any>);
  }
}

export const cartService = new CartService();