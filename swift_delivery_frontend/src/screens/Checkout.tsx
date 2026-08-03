import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/checkout.scss';
import { createOrder, getApiErrorMessage } from '../services/api.ts';
import { useCart } from '../context/CartContext';
import backIcon from '../assets/back.svg';

interface CartItem {
  id: number;
  name: string;
  price: number | string;
  quantity: number;
}

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const {
    cart: serverCart,
    cartItems,
    isLoading: cartIsLoading,
    clearCart: clearServerCart,
  } = useCart();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cart: CartItem[] = cartItems.map(({ menu_item_detail: item, quantity }) => ({
    id: item.id,
    name: item.name,
    price: item.price,
    quantity,
  }));
  const totalAmount = cart.reduce(
    (total, item) => total + Number(item.price) * item.quantity,
    0,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cart.length === 0) {
      alert('Your cart is empty. Add items before placing an order.');
      return;
    }

    const orderData = {
      customer_name: name.trim(),
      phone_number: phone.trim(),
      delivery_address: address.trim(),
      ...(serverCart?.notes ? { delivery_notes: serverCart.notes } : {}),
      order_items: cart.map(item => ({
        menu_item: item.id, 
        quantity: item.quantity
    }))
  };

  try {
    setIsSubmitting(true);
    await createOrder(orderData);

    try {
      await clearServerCart();
      localStorage.removeItem('cartVendor');
    } catch (cartError) {
      console.error('Order was placed, but the cart could not be cleared:', cartError);
    }

    alert('Order placed successfully!');
    setName('');
    setPhone('');
    setAddress('');
  } catch (error: unknown) {
    console.error("Error placing order:", error);
    alert(getApiErrorMessage(error, 'Unable to place your order right now. Please try again.'));
  } finally {
    setIsSubmitting(false);
  }
  };

  return (
    <div className="checkout-container">
      <header className="checkout-header">
        <button type="button" className="checkout-back-btn" onClick={() => navigate(-1)} aria-label="Go back">
          <img src={backIcon} alt="" aria-hidden="true" />
        </button>
        <h1>Checkout</h1>
      </header>
      <form onSubmit={handleSubmit} className="checkout-form">
        <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input type="tel" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        <textarea placeholder="Delivery Address" value={address} onChange={(e) => setAddress(e.target.value)} required />
        <button type="submit" className="place-order-btn" disabled={isSubmitting || cartIsLoading || cart.length === 0}>
          {isSubmitting ? 'Placing Order...' : 'Place Order'}
        </button>
      </form>

      {cart.length > 0 && (
        <div className="order-summary">
          <h2>Order Summary</h2>
          <ul>
            {cart.map((item) => (
              <li key={item.id}>
                {item.name} x {item.quantity} = ₦{Number(item.price) * item.quantity}
              </li>
            ))}
          </ul>
          <h3>Total: ₦{totalAmount}</h3>
        </div>
      )}
    </div>
  );
};

export default Checkout;
