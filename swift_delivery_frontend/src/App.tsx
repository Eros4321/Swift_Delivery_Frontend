import React from 'react';
import { BrowserRouter as Router, Location, Route, Routes, useLocation } from 'react-router-dom';
import { CartProvider, useCart } from './context/CartContext';
import { AppPreloader } from './components/LoadingState';
import { hasStoredAuthToken } from './services/api';
import CafeteriaList from './screens/CafeteriaList.tsx';
import Orders from './screens/Orders.tsx';
import Menu from './screens/Menu.tsx';
import Checkout from './screens/Checkout.tsx';
import Login from './screens/Login.tsx';
import Signup from './screens/Signup.tsx';
import Favorites from './screens/Favorites.tsx';
import OrderHistory from './screens/OrderHistory.tsx';

interface ModalLocationState {
  backgroundLocation?: Location;
}

const AppRoutes: React.FC = () => {
  const location = useLocation();
  const { isLoading: cartIsLoading } = useCart();
  const [initialSessionHasResolved, setInitialSessionHasResolved] = React.useState(
    () => !hasStoredAuthToken(),
  );
  const state = location.state as ModalLocationState | null;
  const backgroundLocation = state?.backgroundLocation;

  React.useEffect(() => {
    if (!cartIsLoading) setInitialSessionHasResolved(true);
  }, [cartIsLoading]);

  const initialSessionIsLoading = cartIsLoading && !initialSessionHasResolved;

  return (
    <>
      {initialSessionIsLoading && (
        <AppPreloader label="Getting Swift Delivery ready..." />
      )}

      <Routes location={backgroundLocation || location}>
        <Route path="/" element={<CafeteriaList />} />

        <Route path="/cafeteria/:cafeteriaId" element={<Menu />} />

        <Route path="/orders" element={<Orders />} />

        <Route path="/checkout" element={<Checkout />} />

        <Route path="/login" element={<Login />} />

        <Route path="/signup" element={<Signup />} />

        <Route path="/favorites" element={<Favorites />} />

        <Route path="/order-history" element={<OrderHistory />} />
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
