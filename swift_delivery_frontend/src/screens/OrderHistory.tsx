import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AccountEmptyState,
  AccountPage,
  AccountPageFeedback,
} from '../components/AccountPage';
import orderHistoryEmptyState from '../assets/order-history-empty-state.png';
import {
  fetchCustomerOrderHistory,
  getApiErrorMessage,
  hasStoredAuthToken,
  type CustomerOrder,
} from '../services/api';
import '../styles/orderHistory.scss';

const orderDateFormatter = new Intl.DateTimeFormat('en-NG', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const formatPrice = (amount: number | string) =>
  `\u20A6${Number(amount).toLocaleString('en-NG', { maximumFractionDigits: 2 })}`;

const formatOrderDate = (orderTime: string) => {
  const date = new Date(orderTime);
  return Number.isNaN(date.getTime()) ? orderTime : orderDateFormatter.format(date);
};

const OrderHistory: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadOrderHistory = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const orderHistory = await fetchCustomerOrderHistory(signal);
      setOrders(orderHistory);
    } catch (error: unknown) {
      if (!signal?.aborted) {
        setErrorMessage(getApiErrorMessage(error, 'Unable to load your order history.'));
      }
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!hasStoredAuthToken()) {
      navigate('/login', { replace: true });
      return;
    }

    const controller = new AbortController();
    void loadOrderHistory(controller.signal);
    return () => controller.abort();
  }, [loadOrderHistory, navigate]);

  return (
    <AccountPage title="Order History">
      {isLoading ? (
        <AccountPageFeedback message="Loading your orders..." isLoading />
      ) : orders.length > 0 ? (
        <div className="order-history-results">
          <ul className="order-history-list">
            {orders.map((order) => {
              const itemCount = order.items.reduce((total, item) => total + item.quantity, 0);

              return (
                <li key={order.id} className="order-history-card">
                  <div className="order-history-card__heading">
                    <div>
                      <h2>Order #{order.id}</h2>
                      <time dateTime={order.order_time}>{formatOrderDate(order.order_time)}</time>
                    </div>
                    <strong>{formatPrice(order.total_amount)}</strong>
                  </div>

                  <p className="order-history-card__items">
                    {order.items.map((item) => item.menu_item_name).join(', ')}
                  </p>
                  <p className="order-history-card__count">
                    {itemCount} {itemCount === 1 ? 'item' : 'items'}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      ) : errorMessage ? (
        <AccountPageFeedback
          title="Unable to load orders"
          message={errorMessage}
          onRetry={() => void loadOrderHistory()}
        />
      ) : (
        <AccountEmptyState
          illustration={orderHistoryEmptyState}
          title="No orders yet. Order today and it will show here."
          actionLabel="Place an order"
          actionTo="/"
        />
      )}
    </AccountPage>
  );
};

export default OrderHistory;
