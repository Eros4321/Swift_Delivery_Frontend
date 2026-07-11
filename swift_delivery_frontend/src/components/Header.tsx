import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../styles/Header.scss';
import logo from '../assets/logo2.svg';
import locationMarker from '../assets/LocationMarker.svg';
import arrowDown from '../assets/keyboard_arrow_down.svg';
import heartIcon from '../assets/heart.svg';
import cartIcon from '../assets/cart.svg';
import menuIcon from '../assets/MenuAlt4.svg';
import profileAvatar from '../assets/avatar of thoughtful man holding hand near face.svg';
import viewFavoritesIcon from '../assets/view_favorites.svg';
import orderHistoryIcon from '../assets/order_history.svg';
import reachSupportIcon from '../assets/reach_support.svg';
import logoutIcon from '../assets/Logout.svg';
import appleIcon from '../assets/apple.svg';
import playstoreIcon from '../assets/playstore.svg';
import accountCopyIcon from '../assets/account-copy-outline.svg';
import SearchField from './SearchField';

interface HeaderProps {
  searchQuery?: string;
  onSearch?: (query: string) => void;
}

const Header: React.FC<HeaderProps> = ({ searchQuery = '', onSearch }) => {
  const [internalQuery, setInternalQuery] = useState(searchQuery);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [profileIsOpen, setProfileIsOpen] = useState(false);
  const [mobileHeaderProgress, setMobileHeaderProgress] = useState(0);
  const profileRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

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

  useEffect(() => {
    if (!profileIsOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!profileRef.current?.contains(event.target as Node)) {
        setProfileIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setProfileIsOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [profileIsOpen]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 680px)');
    const collapseDistance = 96;
    const expandDistance = 176;
    const progressRef = { current: 0 };
    const lastScrollRef = { current: window.scrollY };
    let frame = 0;

    const setProgress = (nextProgress: number) => {
      const boundedProgress = Math.max(0, Math.min(1, nextProgress));
      progressRef.current = boundedProgress;
      setMobileHeaderProgress((currentProgress) => {
        if (Math.abs(currentProgress - boundedProgress) < 0.01) return currentProgress;
        return boundedProgress;
      });
    };

    const handleScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;

        if (!mediaQuery.matches) {
          lastScrollRef.current = window.scrollY;
          setProgress(0);
          return;
        }

        const currentScroll = window.scrollY;
        const scrollDelta = currentScroll - lastScrollRef.current;
        lastScrollRef.current = currentScroll;

        if (currentScroll <= 8) {
          setProgress(0);
          return;
        }

        const progressDistance =
          scrollDelta > 0 ? collapseDistance : expandDistance;

        setProgress(progressRef.current + scrollDelta / progressDistance);
      });
    };

    const handleMediaChange = () => {
      lastScrollRef.current = window.scrollY;
      setProgress(mediaQuery.matches ? progressRef.current : 0);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    mediaQuery.addEventListener('change', handleMediaChange);
    handleScroll();

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', handleScroll);
      mediaQuery.removeEventListener('change', handleMediaChange);
    };
  }, []);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setInternalQuery(query);
    onSearch?.(query);
  };

  const mobileHeaderStyle = {
    '--mobile-header-collapse-progress': mobileHeaderProgress,
    '--mobile-header-top-row-height': `${40 * (1 - mobileHeaderProgress)}px`,
    '--mobile-header-row-gap': `${9.6 * (1 - mobileHeaderProgress)}px`,
    '--mobile-header-padding-top': `${12.8 - 4.8 * mobileHeaderProgress}px`,
    '--mobile-header-padding-bottom': `${14.4 - 4 * mobileHeaderProgress}px`,
    '--mobile-header-top-row-offset': `${-28 * mobileHeaderProgress}px`,
  } as React.CSSProperties;

  const headerClassName = [
    'cafeteria-topbar',
    mobileHeaderProgress > 0.95 ? 'cafeteria-topbar--search-only' : '',
    profileIsOpen ? 'cafeteria-topbar--profile-open' : '',
  ].filter(Boolean).join(' ');

  return (
    <header
      className={headerClassName}
      style={mobileHeaderStyle}
    >
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

      <Link
        to="/orders"
        state={{ backgroundLocation: location }}
        className={`cafeteria-topbar__cart-btn${cartItemCount > 0 ? ' cafeteria-topbar__cart-btn--active' : ''}`}
        aria-label="View cart"
      >
        <img src={cartIcon} alt="" className="cafeteria-topbar__icon" aria-hidden="true" />
        <span>{cartItemCount}</span>
      </Link>

      <div className="cafeteria-topbar__profile-shell" ref={profileRef}>
        <button
          type="button"
          className="cafeteria-topbar__profile-btn"
          aria-label="Profile menu"
          aria-expanded={profileIsOpen}
          aria-controls="profile-panel"
          onClick={() => setProfileIsOpen((isOpen) => !isOpen)}
        >
          <svg
            className="cafeteria-topbar__profile-icon"
            width="17"
            height="17"
            viewBox="0 0 17 17"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M2.7675 13.3367C4.51618 12.3483 6.49132 11.8303 8.5 11.8333C10.5833 11.8333 12.5392 12.3792 14.2325 13.3367M11 6.83333C11 7.49637 10.7366 8.13226 10.2678 8.6011C9.79893 9.06994 9.16304 9.33333 8.5 9.33333C7.83696 9.33333 7.20107 9.06994 6.73223 8.6011C6.26339 8.13226 6 7.49637 6 6.83333C6 6.17029 6.26339 5.53441 6.73223 5.06557C7.20107 4.59672 7.83696 4.33333 8.5 4.33333C9.16304 4.33333 9.79893 4.59672 10.2678 5.06557C10.7366 5.53441 11 6.17029 11 6.83333ZM16 8.5C16 9.48491 15.806 10.4602 15.4291 11.3701C15.0522 12.2801 14.4997 13.1069 13.8033 13.8033C13.1069 14.4997 12.2801 15.0522 11.3701 15.4291C10.4602 15.806 9.48491 16 8.5 16C7.51509 16 6.53982 15.806 5.62987 15.4291C4.71993 15.0522 3.89314 14.4997 3.1967 13.8033C2.50026 13.1069 1.94781 12.2801 1.5709 11.3701C1.19399 10.4602 1 9.48491 1 8.5C1 6.51088 1.79018 4.60322 3.1967 3.1967C4.60322 1.79018 6.51088 1 8.5 1C10.4891 1 12.3968 1.79018 13.8033 3.1967C15.2098 4.60322 16 6.51088 16 8.5Z"
              fill="currentColor"
            />
            <path
              d="M2.7675 13.3367C4.51618 12.3483 6.49132 11.8303 8.5 11.8333C10.5833 11.8333 12.5392 12.3792 14.2325 13.3367M11 6.83333C11 7.49637 10.7366 8.13226 10.2678 8.6011C9.79893 9.06994 9.16304 9.33333 8.5 9.33333C7.83696 9.33333 7.20107 9.06994 6.73223 8.6011C6.26339 8.13226 6 7.49637 6 6.83333C6 6.17029 6.26339 5.53441 6.73223 5.06557C7.20107 4.59673 7.83696 4.33333 8.5 4.33333C9.16304 4.33333 9.79893 4.59673 10.2678 5.06557C10.7366 5.53441 11 6.17029 11 6.83333ZM16 8.5C16 9.48491 15.806 10.4602 15.4291 11.3701C15.0522 12.2801 14.4997 13.1069 13.8033 13.8033C13.1069 14.4997 12.2801 15.0522 11.3701 15.4291C10.4602 15.806 9.48491 16 8.5 16C7.51509 16 6.53982 15.806 5.62987 15.4291C4.71993 15.0522 3.89314 14.4997 3.1967 13.8033C2.50026 13.1069 1.94781 12.2801 1.5709 11.3701C1.19399 10.4602 1 9.48491 1 8.5C1 6.51088 1.79018 4.60322 3.1967 3.1967C4.60322 1.79018 6.51088 1 8.5 1C10.4891 1 12.3968 1.79018 13.8033 3.1967C15.2098 4.60322 16 6.51088 16 8.5Z"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Profile</span>
          <img src={menuIcon} alt="" className="cafeteria-topbar__icon" aria-hidden="true" />
        </button>

        {profileIsOpen && (
          <aside id="profile-panel" className="profile-panel" aria-label="Profile details">
            <button
              type="button"
              className="profile-panel__close-btn"
              aria-label="Close profile menu"
              onClick={() => setProfileIsOpen(false)}
            >
              &times;
            </button>

            <div className="profile-panel__identity">
              <span className="profile-panel__avatar" aria-hidden="true">
                <img src={profileAvatar} alt="" />
              </span>
              <h2>Benjamin Odion-Owase</h2>
              <p>
                <span className="profile-panel__country-code">NG</span>
                {' +234 09030346457'}
              </p>
            </div>

            <section className="profile-panel__section" aria-labelledby="profile-personal">
              <h3 id="profile-personal"><span>Personal</span></h3>
              <div className="profile-panel__wallet-row">
                <span>Wallet Balance</span>
                <strong>₦0.00</strong>
              </div>
              <button type="button" className="profile-panel__wallet-card">
                <span>Paystack-Titan</span>
                <span className="profile-panel__wallet-divider" aria-hidden="true"></span>
                <span className="profile-panel__wallet-account">
                  <strong>1234567890</strong>
                  <img src={accountCopyIcon} alt="" className="profile-panel__wallet-copy-icon" aria-hidden="true" />
                </span>
              </button>
              <p className="profile-panel__hint">Top up your wallet with Paystack-Titan</p>
            </section>

            <section className="profile-panel__section profile-panel__section--more" aria-labelledby="profile-more">
              <h3 id="profile-more"><span>More</span></h3>
              <button type="button" className="profile-panel__menu-item">
                <img src={viewFavoritesIcon} alt="" className="profile-panel__menu-icon" aria-hidden="true" />
                <span>View Favorites</span>
                <i className="bi bi-arrow-right" aria-hidden="true"></i>
              </button>
              <button type="button" className="profile-panel__menu-item">
                <img src={orderHistoryIcon} alt="" className="profile-panel__menu-icon" aria-hidden="true" />
                <span>Order History</span>
                <i className="bi bi-arrow-right" aria-hidden="true"></i>
              </button>
              <button type="button" className="profile-panel__menu-item">
                <img src={reachSupportIcon} alt="" className="profile-panel__menu-icon" aria-hidden="true" />
                <span>Reach Support</span>
                <i className="bi bi-arrow-up-right" aria-hidden="true"></i>
              </button>
              <button type="button" className="profile-panel__menu-item">
                <img src={logoutIcon} alt="" className="profile-panel__menu-icon" aria-hidden="true" />
                <span>Logout</span>
              </button>
            </section>

            <footer className="profile-panel__footer">
              <span>Privacy Policy • Terms of Use</span>
              <div className="profile-panel__store-icons" aria-hidden="true">
                <img src={appleIcon} alt="" />
                <img src={playstoreIcon} alt="" />
              </div>
            </footer>
          </aside>
        )}
      </div>
    </header>
  );
};

export default Header;
