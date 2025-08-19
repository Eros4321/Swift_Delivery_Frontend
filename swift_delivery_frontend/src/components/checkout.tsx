import React, { useState, useEffect } from 'react';
import '../styles/checkout.scss';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

const Checkout: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  const totalAmount = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const orderData = {
      customer_name: name,
      phone_number: phone,
      delivery_address: address,
      order_items: cart.map(item => ({
        menu_item: item.id, 
        quantity: item.quantity
    }))
  };

  try {
    const response = await fetch("http://127.0.0.1:8000/api/orders/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      throw new Error("Failed to place order");
    }

    alert("Order placed successfully!");
    localStorage.removeItem("cart"); // Clear cart after successful order
    setCart([]);
    setName("");
    setPhone("");
    setAddress("");
  } catch (error) {
    console.error("Error placing order:", error);
    alert("Something went wrong. Please try again.");
  }
  };

  return (
    <div className="checkout-container">
      <h1>Checkout</h1>
      <form onSubmit={handleSubmit} className="checkout-form">
        <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input type="tel" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        <textarea placeholder="Delivery Address" value={address} onChange={(e) => setAddress(e.target.value)} required />
        <button type="submit" className="place-order-btn">Place Order</button>
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
