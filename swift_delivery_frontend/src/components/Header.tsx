import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Header.scss';
import logo from '../assets/logo.png';
import { Search, Bell, ShoppingCart } from 'lucide-react';

interface HeaderProps { 
  onSearch?: (query: string) => void;
}

const Header: React.FC<HeaderProps> = ({onSearch}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.search-input') && !target.closest('.search-icon')) {
        setIsSearchVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const updateCartCount = () => {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        const cartItems = JSON.parse(savedCart);
        const totalItems = cartItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
        setCartItemCount(totalItems);
      } else {
        setCartItemCount(0);
      }
    };

    updateCartCount();
    window.addEventListener('storage', updateCartCount);
    return () => window.removeEventListener('storage', updateCartCount);
  }, []);

  const handleSearchToggle = () => {
    setIsSearchVisible(!isSearchVisible);
    setTimeout(() => {
      if (isSearchVisible) {
        (document.querySelector('.search-input') as HTMLInputElement)?.focus();
      }
    }, 0);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);
    onSearch?.(query); 
  };

  return (
    <div className="header">
      <div className="logo-container">
        <img src={logo} alt="Brand Logo" id="logo" />
      </div>
      <div className="icons">
        <Search
          className={`search-icon ${isSearchVisible ? 'hidden' : ''}`}
          onClick={handleSearchToggle}
          aria-label="Search"
          size={20}
        />
        <Bell aria-label="Notifications" size={20} />
        <Link to="/orders" className="cart-container">
            <ShoppingCart aria-label="Cart" size={20} />
            {cartItemCount > 0 && <span className="cart-badge">{cartItemCount}</span>}
        </Link>
      </div>
      {isSearchVisible && (
        <input
          type="text"
          className="search-input"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search..."
        />
      )}
    </div>
  );
};

export default Header;
