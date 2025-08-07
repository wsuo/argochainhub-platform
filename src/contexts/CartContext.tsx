import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { CartContextType, Cart, CartItem, SupplierGroup } from '@/types/cart';
import { Product } from '@/types/product';
import { cartService } from '@/services/cartService';
import { toast } from '@/hooks/use-toast';

const CartContext = createContext<CartContextType | undefined>(undefined);

type CartAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CART'; payload: { cart: Cart | null; supplierGroups: SupplierGroup[]; totalItems: number } }
  | { type: 'TOGGLE_SELECT_ITEM'; payload: string }
  | { type: 'TOGGLE_SELECT_ALL' }
  | { type: 'TOGGLE_SELECT_SUPPLIER'; payload: string }
  | { type: 'CLEAR_SELECTIONS' }
  | { type: 'SET_ERROR'; payload: string | null };

interface CartState {
  cart: Cart | null;
  supplierGroups: SupplierGroup[];
  totalItems: number;
  isLoading: boolean;
  error: string | null;
  selectedItems: string[];
}

const initialState: CartState = {
  cart: null,
  supplierGroups: [],
  totalItems: 0,
  isLoading: false,
  error: null,
  selectedItems: [],
};

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_CART':
      return {
        ...state,
        cart: action.payload.cart,
        supplierGroups: action.payload.supplierGroups,
        totalItems: action.payload.totalItems,
        error: null,
      };

    case 'TOGGLE_SELECT_ITEM': {
      const itemExists = state.selectedItems.includes(action.payload);
      return {
        ...state,
        selectedItems: itemExists
          ? state.selectedItems.filter(id => id !== action.payload)
          : [...state.selectedItems, action.payload]
      };
    }

    case 'TOGGLE_SELECT_ALL': {
      const allItems = state.supplierGroups.flatMap(group => group.items);
      const allSelected = state.selectedItems.length === allItems.length;
      return {
        ...state,
        selectedItems: allSelected ? [] : allItems.map(item => item.id)
      };
    }

    case 'TOGGLE_SELECT_SUPPLIER': {
      const supplierGroup = state.supplierGroups.find(group => group.supplier.id === action.payload);
      if (!supplierGroup) return state;

      const supplierItemIds = supplierGroup.items.map(item => item.id);
      const allSelected = supplierItemIds.every(id => state.selectedItems.includes(id));

      if (allSelected) {
        return {
          ...state,
          selectedItems: state.selectedItems.filter(id => !supplierItemIds.includes(id))
        };
      } else {
        const newSelectedItems = [...state.selectedItems];
        supplierItemIds.forEach(id => {
          if (!newSelectedItems.includes(id)) {
            newSelectedItems.push(id);
          }
        });
        return {
          ...state,
          selectedItems: newSelectedItems
        };
      }
    }

    case 'CLEAR_SELECTIONS':
      return { ...state, selectedItems: [] };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    default:
      return state;
  }
};

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const refreshCart = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await cartService.getCart();
      
      if (response.success) {
        dispatch({
          type: 'SET_CART',
          payload: {
            cart: response.data.cart,
            supplierGroups: response.data.supplierGroups,
            totalItems: response.data.totalItems
          }
        });
      }
    } catch (error) {
      console.error('Failed to refresh cart:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to load cart' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const addToCart = async (product: Product, quantity: number, unit: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await cartService.addToCart({
        productId: product.id,
        quantity,
        unit
      });

      if (response.success) {
        toast({
          title: "添加成功",
          description: "产品已添加到购物车",
          variant: "default"
        });
        await refreshCart();
      }
    } catch (error) {
      console.error('Failed to add to cart:', error);
      toast({
        title: "添加失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive"
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await cartService.removeCartItem(itemId);
      
      if (response.success) {
        toast({
          title: "移除成功",
          description: "产品已从购物车中移除",
          variant: "default"
        });
        await refreshCart();
      }
    } catch (error) {
      console.error('Failed to remove from cart:', error);
      toast({
        title: "移除失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive"
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateCartItem = async (itemId: string, quantity: number, unit: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await cartService.updateCartItem(itemId, { quantity, unit });
      
      if (response.success) {
        toast({
          title: "更新成功",
          description: "购物车项目已更新",
          variant: "default"
        });
        await refreshCart();
      }
    } catch (error) {
      console.error('Failed to update cart item:', error);
      toast({
        title: "更新失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive"
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const clearCart = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await cartService.clearCart();
      
      if (response.success) {
        toast({
          title: "购物车已清空",
          description: "所有产品已从购物车中移除",
          variant: "default"
        });
        await refreshCart();
        dispatch({ type: 'CLEAR_SELECTIONS' });
      }
    } catch (error) {
      console.error('Failed to clear cart:', error);
      toast({
        title: "清空失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive"
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const toggleSelectItem = (itemId: string) => {
    dispatch({ type: 'TOGGLE_SELECT_ITEM', payload: itemId });
  };

  const toggleSelectAll = () => {
    dispatch({ type: 'TOGGLE_SELECT_ALL' });
  };

  const toggleSelectSupplier = (supplierId: string) => {
    dispatch({ type: 'TOGGLE_SELECT_SUPPLIER', payload: supplierId });
  };

  const getCartCount = (): number => {
    return state.totalItems;
  };

  const getSelectedCount = (): number => {
    return state.selectedItems.length;
  };

  const getSelectedItems = (): CartItem[] => {
    return state.supplierGroups
      .flatMap(group => group.items)
      .filter(item => state.selectedItems.includes(item.id));
  };

  const isInCart = (productId: string): boolean => {
    return state.supplierGroups
      .flatMap(group => group.items)
      .some(item => item.productId === productId);
  };

  const isSupplierSelected = (supplierId: string): boolean => {
    const supplierGroup = state.supplierGroups.find(group => group.supplier.id === supplierId);
    if (!supplierGroup) return false;
    
    const supplierItemIds = supplierGroup.items.map(item => item.id);
    return supplierItemIds.length > 0 && supplierItemIds.every(id => state.selectedItems.includes(id));
  };

  const isSupplierPartiallySelected = (supplierId: string): boolean => {
    const supplierGroup = state.supplierGroups.find(group => group.supplier.id === supplierId);
    if (!supplierGroup) return false;
    
    const supplierItemIds = supplierGroup.items.map(item => item.id);
    const selectedCount = supplierItemIds.filter(id => state.selectedItems.includes(id)).length;
    return selectedCount > 0 && selectedCount < supplierItemIds.length;
  };

  const getSupplierSelectedItems = (supplierId: string): CartItem[] => {
    const supplierGroup = state.supplierGroups.find(group => group.supplier.id === supplierId);
    if (!supplierGroup) return [];
    
    return supplierGroup.items.filter(item => state.selectedItems.includes(item.id));
  };

  useEffect(() => {
    refreshCart();
  }, []);

  const value: CartContextType = {
    cart: state.cart,
    supplierGroups: state.supplierGroups,
    totalItems: state.totalItems,
    isLoading: state.isLoading,
    addToCart,
    removeFromCart,
    updateCartItem,
    toggleSelectItem,
    toggleSelectAll,
    toggleSelectSupplier,
    clearCart,
    refreshCart,
    getCartCount,
    getSelectedCount,
    getSelectedItems,
    isInCart,
    isSupplierSelected,
    isSupplierPartiallySelected,
    getSupplierSelectedItems,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};