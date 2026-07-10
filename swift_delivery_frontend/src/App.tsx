import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import CafeteriaList from './components/CafeteriaList.tsx';
import Orders from './components/orders.tsx';
import Menu from './components/menu.tsx';
import Checkout from './components/checkout.tsx';
import Header from './components/Header.tsx';
import Footer from './components/Footer.tsx';

const App: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <CartProvider>
      <Router>
        <Header onSearch={setSearchQuery} />
        <Routes>
          <Route path="/" element={<CafeteriaList searchQuery={searchQuery} />} />
          <Route path="/cafeteria/:cafeteriaId" element={<Menu />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/checkout" element={<Checkout />} />
        </Routes>
        <Footer />
      </Router>
    </CartProvider>
  );
};

export default App;
