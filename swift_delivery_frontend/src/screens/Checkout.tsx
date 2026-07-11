import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/checkout.scss';
import { createOrder, getApiErrorMessage } from '../services/api.ts';
import backIcon from '../assets/back.svg';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  const totalAmount = cart.reduce((total, item) => total + item.price * item.quantity, 0);

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
      order_items: cart.map(item => ({
        menu_item: item.id, 
        quantity: item.quantity
    }))
  };

  try {
    setIsSubmitting(true);
    await createOrder(orderData);

    alert("Order placed successfully!");
    localStorage.removeItem("cart"); // Clear cart after successful order
    setCart([]);
    setName("");
    setPhone("");
    setAddress("");
  } catch (error: unknown) {
    console.error("Error placing order:", error);
    alert(getApiErrorMessage(error));
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
        <button type="submit" className="place-order-btn" disabled={isSubmitting || cart.length === 0}>
          {isSubmitting ? 'Placing Order...' : 'Place Order'}
        </button>
      </form>

      {cart.length > 0 && (
        <div className="order-summary">
          <h2>Order Summary</h2>
          <ul>
            {cart.map((item) => (
              <li key={item.id}>
                {item.name} x {item.quantity} = ₦{item.price * item.quantity}
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
