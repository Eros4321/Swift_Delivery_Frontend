import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import CafeteriaList from './components/CafeteriaList.tsx';
import Orders from './components/orders.tsx';
import Menu from './components/menu.tsx';
import Checkout from './components/checkout.tsx';
import 'bootstrap/dist/css/bootstrap.min.css';


const App: React.FC = () => {
  return (
    <CartProvider>
        <Router>
          <Routes>
            <Route path="/" element={<CafeteriaList />} />

            <Route path="/cafeteria/:cafeteriaId" element={<Menu />} />

            <Route path="/orders" element={<Orders />} />

            <Route path="/checkout" element={<Checkout />} /> 
          </Routes>
        </Router>
    </CartProvider>
  );
};


export default App;

