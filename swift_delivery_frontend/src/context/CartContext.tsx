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
  CartNoteType,
  customerSessionUpdatedEvent,
  CustomerCart,
  CustomerCartItem,
  deleteCustomerCartItem,
  fetchCafeteriaDetails,
  fetchCustomerCart,
  getApiErrorMessage,
  hasStoredAuthToken,
  updateCustomerCartInstruction,
  updateCustomerCartItem,
  VendorListItem,
} from '../services/api';

export interface CartSyncItem {
  menuItemId: number;
  quantity: number;
}

export type CartVendor = Pick<VendorListItem, 'id' | 'name' | 'image' | 'logo'>;

const getStoredCartVendor = (): CartVendor | null => {
  const storedVendor = localStorage.getItem('cartVendor');
  if (!storedVendor) return null;

  try {
    const parsedVendor = JSON.parse(storedVendor) as Partial<CartVendor>;
    if (
      !Number.isInteger(parsedVendor.id)
      || Number(parsedVendor.id) <= 0
      || typeof parsedVendor.name !== 'string'
      || !parsedVendor.name.trim()
    ) {
      return null;
    }

    return {
      id: Number(parsedVendor.id),
      name: parsedVendor.name,
      image: typeof parsedVendor.image === 'string' ? parsedVendor.image : null,
      logo: typeof parsedVendor.logo === 'string' ? parsedVendor.logo : null,
    };
  } catch {
    return null;
  }
};

const cartItemsBelongToVendor = (items: CustomerCartItem[], vendorId: number) => (
  items.every(({ menu_item_detail: menuItem }) => (
    Array.isArray(menuItem.vendors) && menuItem.vendors.includes(vendorId)
  ))
);

const getCartVendorId = (items: CustomerCartItem[]): number | null | undefined => {
  const vendorIdLists = items.map(({ menu_item_detail: menuItem }) => menuItem.vendors);
  if (vendorIdLists.some((vendorIds) => !Array.isArray(vendorIds) || vendorIds.length === 0)) {
    return undefined;
  }

  return vendorIdLists[0].find((vendorId) => (
    vendorIdLists.slice(1).every((vendorIds) => vendorIds.includes(vendorId))
  )) ?? null;
};

interface CartContextType {
  cart: CustomerCart | null;
  cartVendor: CartVendor | null;
  cartItems: CustomerCartItem[];
  itemCount: number;
  totalAmount: number;
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  refreshCart: () => Promise<void>;
  synchronizeCart: (items: CartSyncItem[]) => Promise<void>;
  updateInstruction: (noteType: CartNoteType, instruction: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CustomerCart | null>(null);
  const [cartVendor, setCartVendor] = useState<CartVendor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const syncQueueRef = useRef<Promise<void>>(Promise.resolve());
  const cartVendorRequestIdRef = useRef(0);

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

  useEffect(() => {
    const requestId = ++cartVendorRequestIdRef.current;
    if (isLoading) return;

    const items = cart?.items ?? [];
    if (items.length === 0) {
      setCartVendor(null);
      localStorage.removeItem('cartVendor');
      return;
    }

    const storedVendor = getStoredCartVendor();
    if (storedVendor && cartItemsBelongToVendor(items, storedVendor.id)) {
      setCartVendor(storedVendor);
      return;
    }

    const vendorId = getCartVendorId(items);
    if (vendorId === undefined || vendorId === null) {
      setCartVendor(null);
      localStorage.removeItem('cartVendor');
      return;
    }

    void fetchCafeteriaDetails(vendorId)
      .then((vendor) => {
        if (cartVendorRequestIdRef.current !== requestId) return;

        const nextCartVendor: CartVendor = {
          id: vendor.id,
          name: vendor.name,
          image: vendor.image,
          logo: vendor.logo,
        };
        setCartVendor(nextCartVendor);
        localStorage.setItem('cartVendor', JSON.stringify(nextCartVendor));
      })
      .catch(() => {
        if (cartVendorRequestIdRef.current !== requestId) return;
        setCartVendor(null);
        localStorage.removeItem('cartVendor');
      });
  }, [cart, isLoading]);

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
          const cartHasInstructions = Boolean(
            currentCart.vendor_notes
              || currentCart.delivery_notes
              || currentCart.notes,
          );
          const emptyCart = currentCart.items.length > 0 || cartHasInstructions
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

  const updateInstruction = useCallback(async (
    noteType: CartNoteType,
    instruction: string,
  ) => {
    if (!hasStoredAuthToken()) {
      throw new Error('Log in to add an instruction to your cart.');
    }

    setIsSyncing(true);

    try {
      const updatedCart = await updateCustomerCartInstruction(noteType, instruction);
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
    cartVendor,
    cartItems: cart?.items ?? [],
    itemCount: cart?.item_count ?? 0,
    totalAmount: Number(cart?.subtotal_amount ?? cart?.total_amount ?? 0),
    isLoading,
    isSyncing,
    error,
    refreshCart,
    synchronizeCart,
    updateInstruction,
    clearCart,
  }), [cart, cartVendor, clearCart, error, isLoading, isSyncing, refreshCart, synchronizeCart, updateInstruction]);

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
