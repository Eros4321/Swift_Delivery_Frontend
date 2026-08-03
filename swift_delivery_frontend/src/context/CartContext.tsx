import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  addOrReplaceCustomerCartItem,
  clearCustomerCart,
  customerSessionUpdatedEvent,
  CustomerCart,
  CustomerCartItem,
  deleteCustomerCartItem,
  fetchCustomerCart,
  getApiErrorMessage,
  hasStoredAuthToken,
  updateCustomerCartNotes,
  updateCustomerCartItem,
} from '../services/api';

export interface CartSyncItem {
  menuItemId: number;
  quantity: number;
}

interface CartContextType {
  cart: CustomerCart | null;
  cartItems: CustomerCartItem[];
  itemCount: number;
  totalAmount: number;
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  refreshCart: () => Promise<void>;
  synchronizeCart: (items: CartSyncItem[]) => Promise<void>;
  updateNotes: (notes: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CustomerCart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const syncQueueRef = useRef<Promise<void>>(Promise.resolve());

  const refreshCart = useCallback(async () => {
    if (!hasStoredAuthToken()) {
      setCart(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const nextCart = await fetchCustomerCart();
      setCart(nextCart);
      setError(null);
    } catch (requestError: unknown) {
      setError(getApiErrorMessage(requestError, 'Unable to load your cart.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshCart();

    const syncSessionCart = () => void refreshCart();
    window.addEventListener(customerSessionUpdatedEvent, syncSessionCart);
    window.addEventListener('storage', syncSessionCart);

    return () => {
      window.removeEventListener(customerSessionUpdatedEvent, syncSessionCart);
      window.removeEventListener('storage', syncSessionCart);
    };
  }, [refreshCart]);

  useEffect(() => {
    if (!cart) {
      localStorage.removeItem('cart');
      window.dispatchEvent(new Event('cart-updated'));
      return;
    }

    const storedCart = cart.items.map(({ menu_item_detail: menuItem, quantity }) => ({
      ...menuItem,
      quantity,
    }));
    localStorage.setItem('cart', JSON.stringify(storedCart));
    window.dispatchEvent(new Event('cart-updated'));
  }, [cart]);

  const synchronizeCart = useCallback((items: CartSyncItem[]) => {
    const desiredQuantities = new Map<number, number>();
    items.forEach(({ menuItemId, quantity }) => {
      if (quantity > 0) {
        desiredQuantities.set(
          menuItemId,
          (desiredQuantities.get(menuItemId) ?? 0) + quantity,
        );
      }
    });

    const synchronize = async () => {
      if (!hasStoredAuthToken()) {
        throw new Error('Log in to add items to your cart.');
      }

      setIsSyncing(true);

      try {
        const currentCart = await fetchCustomerCart();

        if (desiredQuantities.size === 0) {
          const emptyCart = currentCart.items.length > 0 || Boolean(currentCart.notes)
            ? await clearCustomerCart()
            : currentCart;
          setCart(emptyCart);
          setError(null);
          return;
        }

        const currentItemsByMenuId = new Map(
          currentCart.items.map((item) => [item.menu_item, item]),
        );

        for (const currentItem of currentCart.items) {
          const desiredQuantity = desiredQuantities.get(currentItem.menu_item);

          if (desiredQuantity === undefined) {
            await deleteCustomerCartItem(currentItem.id);
          } else if (desiredQuantity !== currentItem.quantity) {
            await updateCustomerCartItem(currentItem.id, desiredQuantity);
          }
        }

        for (const [menuItemId, quantity] of desiredQuantities) {
          if (!currentItemsByMenuId.has(menuItemId)) {
            await addOrReplaceCustomerCartItem(menuItemId, quantity);
          }
        }

        const synchronizedCart = await fetchCustomerCart();
        setCart(synchronizedCart);
        setError(null);
      } catch (requestError: unknown) {
        const message = getApiErrorMessage(requestError, 'Unable to update your cart.');
        setError(message);
        throw requestError;
      } finally {
        setIsSyncing(false);
      }
    };

    const operation = syncQueueRef.current.catch(() => undefined).then(synchronize);
    syncQueueRef.current = operation.catch(() => undefined);
    return operation;
  }, []);

  const updateNotes = useCallback(async (notes: string) => {
    if (!hasStoredAuthToken()) {
      throw new Error('Log in to add an instruction to your cart.');
    }

    setIsSyncing(true);

    try {
      const updatedCart = await updateCustomerCartNotes(notes);
      setCart(updatedCart);
      setError(null);
    } catch (requestError: unknown) {
      const message = getApiErrorMessage(requestError, 'Unable to update your cart instruction.');
      setError(message);
      throw requestError;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const clearCart = useCallback(
    () => synchronizeCart([]),
    [synchronizeCart],
  );

  const value = useMemo<CartContextType>(() => ({
    cart,
    cartItems: cart?.items ?? [],
    itemCount: cart?.item_count ?? 0,
    totalAmount: Number(cart?.total_amount ?? 0),
    isLoading,
    isSyncing,
    error,
    refreshCart,
    synchronizeCart,
    updateNotes,
    clearCart,
  }), [cart, clearCart, error, isLoading, isSyncing, refreshCart, synchronizeCart, updateNotes]);

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
