import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/orders.scss';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

const QuantitySelector: React.FC<{
  quantity: number;
  onChange: (newQuantity: number) => void;
}> = ({ quantity, onChange }) => {
  const handleIncrease = () => onChange(quantity + 1);
  const handleDecrease = () => onChange(Math.max(1, quantity - 1)); // Prevent going below 1

  return (
    <div className="quantity-selector">
      <button className="minus" onClick={handleDecrease}>-</button>
      <span className="quantity">{quantity}</span>
      <button className="plus" onClick={handleIncrease}>+</button>
    </div>
  );
};

const Orders: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    // Retrieve cart from localStorage
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  const updateQuantity = (id: number, newQuantity: number) => {
    setCart((prevCart) => {
      const updatedCart = prevCart.map((item) =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      );

      localStorage.setItem('cart', JSON.stringify(updatedCart));
      return updatedCart;
    });
  };

  const handleClearCart = () => {
    localStorage.removeItem('cart');
    setCart([]);
  };
  
  const navigate = useNavigate();

  const handleCheckout = () => {
    navigate('/checkout'); // Navigate to checkout page
  };

  const totalAmount = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  return (
    <div className="orders-container">
      <h1>My Cart</h1>

      {cart.length > 0 ? (
        <ul className="order-list">
          {cart.map((item) => (
            <li key={item.id} className="order-item">
              {item.image && <img src={item.image} alt={item.name} className="cart-item-image" />} {/* Display image */}
              <strong>{item.name}</strong> - ₦{item.price} x 
              <QuantitySelector
                quantity={item.quantity}
                onChange={(newQuantity) => updateQuantity(item.id, newQuantity)}
              />
              = ₦{item.price * item.quantity}
            </li>
          ))}
        </ul>
      ) : (
        <p>No items in your cart.</p>
      )}

      {cart.length > 0 && (
        <>
            <h2>Total: ₦{totalAmount}</h2>
            <button onClick={handleClearCart} className="clear-cart-btn">
              Clear Cart
            </button>
            <button onClick={handleCheckout} className="checkout-btn">
              Checkout
            </button>
        </>
      )}
    </div>
  );
};

export default Orders;