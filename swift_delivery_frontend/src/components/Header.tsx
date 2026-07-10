import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/swift_logo_cropped 1.svg';
import { Search, Bell, ShoppingCart } from 'lucide-react';
import '../styles/Header.scss';

interface HeaderProps {
  onSearch?: (query: string) => void;
}

const Header: React.FC<HeaderProps> = ({ onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [cartItemCount, setCartItemCount] = useState(0);

  useEffect(() => {
    const updateCartCount = () => {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        const cartItems = JSON.parse(savedCart);
        const total = cartItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
        setCartItemCount(total);
      } else {
        setCartItemCount(0);
      }
    };

    updateCartCount();
    window.addEventListener('storage', updateCartCount);
    return () => window.removeEventListener('storage', updateCartCount);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearch?.(value);
  };

  return (
    <header className="header">
      <div className="logo-container">
        <img src={logo} alt="Swift Delivery" id="logo" />
      </div>

      <div className="header-search">
        <Search className="search-icon-inline" size={16} />
        <input
          type="text"
          className="search-input"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search cafeterias…"
          aria-label="Search cafeterias"
        />
      </div>

      <div className="icons">
        <button className="icon-btn" aria-label="Notifications">
          <Bell size={20} />
        </button>
        <Link to="/orders" className="cart-container" aria-label="Cart">
          <ShoppingCart size={20} />
          {cartItemCount > 0 && (
            <span className="cart-badge">{cartItemCount}</span>
          )}
        </Link>
      </div>
    </header>
  );
};

export default Header;
