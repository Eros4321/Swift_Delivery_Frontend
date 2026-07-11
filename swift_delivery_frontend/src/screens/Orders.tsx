import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/orders.scss';
import emptyCartIllustration from '../assets/Girl looking at empty plate.svg';
import vendorLogo from '../assets/ChatGPT Image May 6, 2026, 01_23_24 PM.png';
import closeIcon from '../assets/close.svg';
import trashIcon from '../assets/TrashOutline.svg';
import checkoutArrowIcon from '../assets/ArrowRight.svg';

interface CartItem {
  id: number;
  name: string;
  price: number | string;
  quantity: number;
  image?: string;
}

const formatPrice = (amount: number) => `\u20A6${amount.toLocaleString()}`;

interface OrdersProps {
  isModal?: boolean;
}

interface OrdersLocationState {
  vendorName?: string;
  mobileCartSummary?: boolean;
}

interface StoredCartVendor {
  name?: string;
}

const getStoredVendorName = () => {
  const savedVendor = localStorage.getItem('cartVendor');
  if (!savedVendor) return undefined;

  try {
    const parsedVendor = JSON.parse(savedVendor) as StoredCartVendor;
    return typeof parsedVendor.name === 'string' && parsedVendor.name.trim()
      ? parsedVendor.name
      : undefined;
  } catch {
    return undefined;
  }
};

const Orders: React.FC<OrdersProps> = ({ isModal = false }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = location.state as OrdersLocationState | null;
  const vendorName = routeState?.vendorName ?? getStoredVendorName() ?? 'Vendor';
  const isMobileCartSummary = routeState?.mobileCartSummary === true;

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (!savedCart) return;

    try {
      const parsedCart = JSON.parse(savedCart) as unknown;
      setCart(Array.isArray(parsedCart) ? parsedCart as CartItem[] : []);
    } catch {
      setCart([]);
    }
  }, []);

  const totalAmount = cart.reduce((total, item) => total + Number(item.price) * item.quantity, 0);
  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
  const closeCart = () => {
    if (isModal) {
      navigate(-1);
      return;
    }

    navigate('/');
  };

  const clearCart = () => {
    localStorage.removeItem('cart');
    localStorage.removeItem('cartVendor');
    setCart([]);
    window.dispatchEvent(new Event('cart-updated'));
  };

  if (cart.length === 0) {
    const emptyCartDialog = (
      <div className="cart-modal-scrim" onClick={closeCart}>
        <section
          className="cart-dialog cart-dialog--empty"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cart-empty-title"
          onClick={(event) => event.stopPropagation()}
        >
            <header className="cart-dialog__header">
              <h1 id="cart-empty-title">Cart</h1>
            </header>

            <div className="cart-dialog__empty-body">
              <img src={emptyCartIllustration} alt="" aria-hidden="true" />
              <h2>Your cart is empty</h2>
              <p>Select an item to get started</p>
            </div>
          </section>
      </div>
    );

    if (isModal) {
      return emptyCartDialog;
    }

    return (
      <div className="cart-empty-screen">
        {emptyCartDialog}
      </div>
    );
  }

  const cartDialog = (
    <div
      className={`cart-modal-scrim${isMobileCartSummary ? ' cart-modal-scrim--mobile-summary' : ''}`}
      onClick={closeCart}
    >
      <section
        className={`cart-dialog cart-dialog--summary${isMobileCartSummary ? ' cart-dialog--mobile-summary' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="cart-dialog__header">
          <h1 id="cart-title">Cart</h1>
          {isMobileCartSummary && (
            <div className="cart-dialog__header-actions">
              <button type="button" className="cart-dialog__clear-btn" onClick={clearCart}>
                <img src={trashIcon} alt="" aria-hidden="true" />
                Clear carts
              </button>
              <button type="button" className="cart-dialog__close-btn" onClick={closeCart} aria-label="Close cart">
                <img src={closeIcon} alt="" aria-hidden="true" />
              </button>
            </div>
          )}
        </header>

        <div className="cart-vendor-group">
        <button
          type="button"
          className="cart-vendor-summary"
          onClick={isMobileCartSummary ? closeCart : () => navigate('/checkout')}
        >
          <span className="cart-vendor-summary__logo" aria-hidden="true">
            <img src={vendorLogo} alt="" />
          </span>
          <span className="cart-vendor-summary__copy">
            <strong>{vendorName}</strong>
            <span>
              {itemCount} items · {formatPrice(totalAmount)}
            </span>
            <small>Delivery to Prophet Moses Hall, Room....</small>
          </span>
          <span className="cart-vendor-summary__chevron" aria-hidden="true">
            ›
          </span>
        </button>
        {isMobileCartSummary && (
            <div className="cart-vendor-summary__actions">
              <button type="button" onClick={() => navigate('/checkout')}>
                <img src={checkoutArrowIcon} alt="" aria-hidden="true" />
                Checkout
              </button>
            <button type="button" onClick={clearCart}>
              <img src={trashIcon} alt="" aria-hidden="true" />
              Clear
            </button>
          </div>
        )}
        </div>
      </section>
    </div>
  );

  if (isModal) {
    return cartDialog;
  }

  return (
    <div className="cart-empty-screen">
      {cartDialog}
    </div>
  );
};

export default Orders;
