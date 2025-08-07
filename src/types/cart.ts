import { Product } from './product';

export interface CartItem {
  id: string;
  cartId: number;
  productId: string;
  supplierId: string;
  quantity: number;
  unit: string;
  productSnapshot: {
    name: {
      'zh-CN': string;
      en: string;
      es: string;
    };
    pesticideName: {
      'zh-CN': string;
      en: string;
      es: string;
    };
    formulation: string;
    totalContent: string;
    details: {
      productCategory: string;
      description: string;
    };
  };
  supplierSnapshot: {
    name: {
      'zh-CN': string;
      en: string;
      es: string;
    };
    rating: string;
    isTop100: boolean;
  };
  selected?: boolean;
  addedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Cart {
  id: number;
  userId: number;
  status: 'active' | 'inactive';
  items: CartItem[];
  selectedItems: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SupplierGroup {
  supplier: {
    id: string;
    name: {
      'zh-CN': string;
      en: string;
      es: string;
    };
    rating: string;
    isTop100: boolean;
  };
  items: CartItem[];
}

export interface CartContextType {
  cart: Cart | null;
  supplierGroups: SupplierGroup[];
  totalItems: number;
  isLoading: boolean;
  addToCart: (product: Product, quantity: number, unit: string) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateCartItem: (itemId: string, quantity: number, unit: string) => Promise<void>;
  toggleSelectItem: (itemId: string) => void;
  toggleSelectAll: () => void;
  toggleSelectSupplier: (supplierId: string) => void;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  getCartCount: () => number;
  getSelectedCount: () => number;
  getSelectedItems: () => CartItem[];
  isInCart: (productId: string) => boolean;
  isSupplierSelected: (supplierId: string) => boolean;
  isSupplierPartiallySelected: (supplierId: string) => boolean;
  getSupplierSelectedItems: (supplierId: string) => CartItem[];
}

export interface AddToCartRequest {
  productId: string;
  quantity: number;
  unit: string;
}

export interface UpdateCartItemRequest {
  quantity: number;
  unit: string;
}

export interface BatchRemoveRequest {
  cartItemIds: string[];
}

export interface InquiryRequest {
  supplierId: string;
  items: {
    cartItemId: string;
    packagingReq?: string;
  }[];
  deliveryLocation?: string;
  tradeTerms?: string;
  paymentMethod?: string;
  buyerRemarks?: string;
}

export interface SampleRequest {
  supplierId: string;
  items: {
    cartItemId: string;
    quantity: number;
    unit: string;
  }[];
  purpose?: string;
  shippingAddress?: string;
  shippingMethod?: string;
}

export interface RegistrationRequest {
  supplierId: string;
  items: {
    cartItemId: string;
  }[];
  targetCountry?: string;
  isExclusive?: boolean;
  docReqs?: string[];
  timeline?: string;
  budgetAmount?: number;
  budgetCurrency?: string;
  additionalRequirements?: string;
}

export interface CartResponse {
  success: boolean;
  message: string;
  data: {
    cart: Cart;
    supplierGroups: SupplierGroup[];
    totalItems: number;
  };
}

export interface CartItemResponse {
  success: boolean;
  message: string;
  data: CartItem;
}

export interface CartCountResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
  };
}

export interface BatchOperationResponse {
  success: boolean;
  message: string;
  data?: any;
}