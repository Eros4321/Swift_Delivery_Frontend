import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import '../styles/Footer.scss';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <div className="footer-logo-wrap">
            <img src={logo} alt="Swift Delivery" />
          </div>
          <p className="footer-tagline">Fast, fresh food delivered on campus.</p>
        </div>

        <ul className="footer-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/orders">Orders</Link></li>
          <li><a href="mailto:support@swiftdelivery.com">Contact</a></li>
        </ul>

        <p className="footer-copy">&copy; {new Date().getFullYear()} Swift Delivery</p>
      </div>
    </footer>
  );
};

export default Footer;
