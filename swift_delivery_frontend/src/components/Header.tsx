import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Header.scss';
import logo from '../assets/logo2.svg';
import locationMarker from '../assets/LocationMarker.svg';
import arrowDown from '../assets/keyboard_arrow_down.svg';
import heartIcon from '../assets/heart.svg';
import cartIcon from '../assets/cart.svg';
import userIcon from '../assets/user.svg';
import menuIcon from '../assets/MenuAlt4.svg';
import SearchField from './SearchField';

interface HeaderProps {
  searchQuery?: string;
  onSearch?: (query: string) => void;
}

const Header: React.FC<HeaderProps> = ({ searchQuery = '', onSearch }) => {
  const [internalQuery, setInternalQuery] = useState(searchQuery);
  const [cartItemCount, setCartItemCount] = useState(0);

  useEffect(() => {
    setInternalQuery(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const syncCartCount = () => {
      const savedCart = localStorage.getItem('cart');
      if (!savedCart) { setCartItemCount(0); return; }
      try {
        const cartItems = JSON.parse(savedCart) as Array<{ quantity?: number }>;
        const total = Array.isArray(cartItems)
          ? cartItems.reduce((sum, item) => sum + (item.quantity ?? 0), 0)
          : 0;
        setCartItemCount(total);
      } catch {
        setCartItemCount(0);
      }
    };

    syncCartCount();
    window.addEventListener('focus', syncCartCount);
    window.addEventListener('storage', syncCartCount);
    window.addEventListener('cart-updated', syncCartCount as EventListener);
    return () => {
      window.removeEventListener('focus', syncCartCount);
      window.removeEventListener('storage', syncCartCount);
      window.removeEventListener('cart-updated', syncCartCount as EventListener);
    };
  }, []);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setInternalQuery(query);
    onSearch?.(query);
  };

  return (
    <header className="cafeteria-topbar">
      <Link to="/" className="cafeteria-topbar__brand" aria-label="Swift Delivery home">
        <img src={logo} alt="Swift Delivery" className="cafeteria-topbar__logo" />
      </Link>

      <button type="button" className="cafeteria-topbar__location">
        <img src={locationMarker} alt="" className="cafeteria-topbar__icon" aria-hidden="true" />
        <span>Redeemer&apos;s University</span>
        <img src={arrowDown} alt="" className="cafeteria-topbar__icon" aria-hidden="true" />
      </button>

      <SearchField
        className="cafeteria-topbar__search"
        value={internalQuery}
        onChange={handleSearchChange}
        placeholder="Search Swift Delivery..."
        ariaLabel="Search Swift Delivery"
      />

      <button type="button" className="cafeteria-topbar__icon-btn" aria-label="Favorites">
        <img src={heartIcon} alt="" className="cafeteria-topbar__icon" aria-hidden="true" />
      </button>

      <Link to="/orders" className="cafeteria-topbar__cart-btn" aria-label="View cart">
        <img src={cartIcon} alt="" className="cafeteria-topbar__icon" aria-hidden="true" />
        <span>{cartItemCount}</span>
      </Link>

      <button type="button" className="cafeteria-topbar__profile-btn" aria-label="Profile menu">
        <img src={userIcon} alt="" className="cafeteria-topbar__icon" aria-hidden="true" />
        <span>Profile</span>
        <img src={menuIcon} alt="" className="cafeteria-topbar__icon" aria-hidden="true" />
      </button>
    </header>
  );
};

export default Header;
