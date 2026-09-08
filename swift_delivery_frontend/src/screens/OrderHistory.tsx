import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AccountEmptyState,
  AccountPage,
  AccountPageFeedback,
} from '../components/AccountPage';
import LoadingSkeleton, { MobileLoadingSpinner } from '../components/LoadingState';
import VendorLogo from '../components/VendorLogo';
import { useCart } from '../context/CartContext';
import orderHistoryEmptyState from '../assets/order-history-empty-state.png';
import copyIcon from '../assets/basil_copy-outline.svg';
import orderIdCopiedIcon from '../assets/lucide_circle-check-big.svg';
import repeatOrderIcon from '../assets/ix_cycle-alt.svg';
import orderDetailsArrowIcon from '../assets/arrow_forward_ios.svg';
import {
  fetchCustomerOrderHistory,
  fetchVendors,
  getApiErrorMessage,
  hasStoredAuthToken,
  type CustomerOrder,
  type VendorDetails,
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

const copyTextToClipboard = async (text: string) => {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall back for browsers that expose the API but deny clipboard access.
    }
  }

  const activeElement = document.activeElement instanceof HTMLElement
    ? document.activeElement
    : null;
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.readOnly = true;
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.select();
  textArea.setSelectionRange(0, text.length);

  const copied = document.execCommand('copy');
  textArea.remove();
  activeElement?.focus();

  if (!copied) throw new Error('Unable to copy order ID.');
};

const findOrderVendor = (order: CustomerOrder, vendors: VendorDetails[]) => {
  const orderMenuItemIds = new Set(order.items.map(({ menu_item }) => menu_item));

  return vendors.find((vendor) => (
    vendor.university === order.university
    && vendor.menu_items.some(({ id }) => orderMenuItemIds.has(id))
  ));
};

const OrderHistory: React.FC = () => {
  const navigate = useNavigate();
  const { isSyncing, synchronizeCart } = useCart();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [orderVendors, setOrderVendors] = useState<Record<number, VendorDetails>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [repeatingOrderId, setRepeatingOrderId] = useState<number | null>(null);
  const [repeatErrorMessage, setRepeatErrorMessage] = useState('');
  const [copiedOrderId, setCopiedOrderId] = useState<number | null>(null);
  const copyFeedbackTimeoutRef = useRef<number | null>(null);

  const loadOrderHistory = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setErrorMessage('');
    setOrderVendors({});

    try {
      const orderHistory = await fetchCustomerOrderHistory(signal);
      setOrders(orderHistory);

      const universityIds = Array.from(new Set(
        orderHistory
          .map(({ university }) => university)
          .filter((universityId): universityId is number => universityId !== null),
      ));

      if (universityIds.length > 0) {
        void Promise.all(
          universityIds.map((universityId) => fetchVendors({ universityId }, signal)),
        )
          .then((vendorGroups) => {
            if (signal?.aborted) return;

            const vendors = vendorGroups.flat();
            const nextOrderVendors: Record<number, VendorDetails> = {};

            orderHistory.forEach((order) => {
              const matchingVendor = findOrderVendor(order, vendors);

              if (matchingVendor) nextOrderVendors[order.id] = matchingVendor;
            });

            setOrderVendors(nextOrderVendors);
          })
          .catch(() => {
            // Vendor presentation data is optional; the order itself remains usable.
          });
      }
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

  useEffect(() => () => {
    if (copyFeedbackTimeoutRef.current !== null) {
      window.clearTimeout(copyFeedbackTimeoutRef.current);
    }
  }, []);

  const handleCopyOrderId = async (order: CustomerOrder) => {
    try {
      await copyTextToClipboard(`#${order.order_id}`);
      setCopiedOrderId(order.id);

      if (copyFeedbackTimeoutRef.current !== null) {
        window.clearTimeout(copyFeedbackTimeoutRef.current);
      }

      copyFeedbackTimeoutRef.current = window.setTimeout(() => {
        setCopiedOrderId(null);
        copyFeedbackTimeoutRef.current = null;
      }, 1600);
    } catch {
      setCopiedOrderId(null);
    }
  };

  const handleRepeatOrder = async (order: CustomerOrder) => {
    if (repeatingOrderId !== null || isSyncing) return;

    if (order.items.length === 0) {
      setRepeatErrorMessage('This order has no items to add to your cart.');
      return;
    }

    setRepeatingOrderId(order.id);
    setRepeatErrorMessage('');

    try {
      const existingVendor = orderVendors[order.id];
      const vendor = existingVendor || order.university === null
        ? existingVendor
        : fetchVendors({ universityId: order.university })
          .then((vendors) => findOrderVendor(order, vendors))
          .catch(() => undefined);

      const resolvedVendor = await vendor;

      if (!resolvedVendor) {
        throw new Error('The vendor for this order is no longer available.');
      }

      await synchronizeCart(order.items.map(({ menu_item, quantity }) => ({
        menuItemId: menu_item,
        quantity,
      })));

      if (!existingVendor) {
        setOrderVendors((currentVendors) => ({
          ...currentVendors,
          [order.id]: resolvedVendor,
        }));
      }

      localStorage.setItem('cartVendor', JSON.stringify({
        id: resolvedVendor.id,
        name: resolvedVendor.name,
        image: resolvedVendor.image,
        logo: resolvedVendor.logo,
      }));

      navigate(`/cafeteria/${resolvedVendor.id}`);
    } catch (error: unknown) {
      setRepeatErrorMessage(getApiErrorMessage(
        error,
        'Unable to repeat this order. One or more items may no longer be available.',
      ));
    } finally {
      setRepeatingOrderId(null);
    }
  };

  return (
    <AccountPage title="Order History">
      {repeatingOrderId !== null && <MobileLoadingSpinner label="Repeating your order" />}
      {copiedOrderId !== null && (
        <div className="order-history-copy-toast" role="status" aria-live="polite">
          <img src={orderIdCopiedIcon} alt="" aria-hidden="true" />
          <span>Order ID copied</span>
        </div>
      )}

      {isLoading ? (
        <div className="order-history-results">
          <LoadingSkeleton variant="order-list" label="Loading your order history" />
        </div>
      ) : orders.length > 0 ? (
        <div className="order-history-results">
          {repeatErrorMessage && (
            <p className="order-history-results__error" role="alert">
              {repeatErrorMessage}
            </p>
          )}

          <ul className="order-history-list">
            {orders.map((order) => {
              const vendor = orderVendors[order.id];
              const fallbackTitle = order.items.length > 0
                ? order.items.slice(0, 2).map(({ menu_item_name }) => menu_item_name).join(', ')
                : `Order #${order.order_id}`;
              const vendorName = vendor?.name ?? fallbackTitle;
              const repeatIsPending = repeatingOrderId === order.id;

              return (
                <li key={order.id} className="order-history-card">
                  <VendorLogo name={vendorName} source={vendor?.logo} variant="history" />

                  <div className="order-history-card__copy">
                    <h2>{vendorName}</h2>
                    <div className="order-history-card__metadata">
                      <span className="order-history-card__order-id">
                        <span>Order ID: #{order.order_id}</span>
                        <button
                          type="button"
                          className="order-history-card__copy-id"
                          onClick={() => void handleCopyOrderId(order)}
                          aria-label={`Copy order ID ${order.order_id}`}
                        >
                          <img src={copyIcon} alt="" aria-hidden="true" />
                        </button>
                      </span>
                      <span aria-hidden="true" />
                      <span className="order-history-card__amount">
                        for {formatPrice(order.total_amount)}
                      </span>
                      <span aria-hidden="true" />
                      <time
                        className="order-history-card__date"
                        dateTime={order.order_time}
                      >
                        {formatOrderDate(order.order_time)}
                      </time>
                    </div>
                  </div>

                  <div className="order-history-card__actions">
                    <button type="button" className="order-history-card__view" disabled>
                      View order
                    </button>
                    <button
                      type="button"
                      className="order-history-card__repeat"
                      onClick={() => void handleRepeatOrder(order)}
                      disabled={isSyncing || repeatingOrderId !== null}
                      aria-busy={repeatIsPending}
                    >
                      <img src={repeatOrderIcon} alt="" aria-hidden="true" />
                      <span>{repeatIsPending ? 'Repeating...' : 'Repeat order'}</span>
                    </button>
                    <button
                      type="button"
                      className="order-history-card__details-arrow"
                      aria-label={`View details for order ${order.order_id}`}
                      disabled
                    >
                      <img src={orderDetailsArrowIcon} alt="" aria-hidden="true" />
                    </button>
                  </div>
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
