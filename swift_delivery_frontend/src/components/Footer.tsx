import React from "react";
import '../styles/Footer.scss';
import logo from '../assets/logo.png';

const Footer: React.FC = () => {
    return (
        <footer className="footer">
          <div className="footer-section">
            <div id="logo-container">
              <img src={logo} alt="Brand Logo" id="logo" />
            </div>
            <ul className="footer-links">
              <li><a href="#home">Home</a></li>
              <li><a href="#about">About</a></li>
              <li><a href="#contact">Contact</a></li>
            </ul>
            <p>&copy; 2024 All Rights Reserved</p>
          </div>
        </footer>
      );
};

export default Footer;