import React from 'react';
import { BrowserRouter as Router, Location, Route, Routes, useLocation } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import CafeteriaList from './screens/CafeteriaList.tsx';
import Orders from './screens/Orders.tsx';
import Menu from './screens/Menu.tsx';
import Checkout from './screens/Checkout.tsx';
import Login from './screens/Login.tsx';
import Signup from './screens/Signup.tsx';
import Favorites from './screens/Favorites.tsx';
import OrderHistory from './screens/OrderHistory.tsx';
import ReachSupport from './screens/ReachSupport.tsx';
import 'bootstrap/dist/css/bootstrap.min.css';

interface ModalLocationState {
  backgroundLocation?: Location;
}

const AppRoutes: React.FC = () => {
  const location = useLocation();
  const state = location.state as ModalLocationState | null;
  const backgroundLocation = state?.backgroundLocation;

  return (
    <>
      <Routes location={backgroundLocation || location}>
        <Route path="/" element={<CafeteriaList />} />

        <Route path="/cafeteria/:cafeteriaId" element={<Menu />} />

        <Route path="/orders" element={<Orders />} />

        <Route path="/checkout" element={<Checkout />} />

        <Route path="/login" element={<Login />} />

        <Route path="/signup" element={<Signup />} />

        <Route path="/favorites" element={<Favorites />} />

        <Route path="/order-history" element={<OrderHistory />} />

        <Route path="/support" element={<ReachSupport />} />
      </Routes>

      {backgroundLocation && (
        <Routes>
          <Route path="/orders" element={<Orders isModal />} />
        </Routes>
      )}
    </>
  );
};

const App: React.FC = () => {
  return (
    <CartProvider>
      <Router>
        <AppRoutes />
      </Router>
    </CartProvider>
  );
};


export default App;
