import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CheckoutAddressModal from '../components/CheckoutAddressModal';
import CheckoutSectionHeading from '../components/CheckoutSectionHeading';
import Header from '../components/Header';
import InstructionModal from '../components/InstructionModal';
import ModalHeaderButton from '../components/ModalHeaderButton';
import PrimaryActionButton from '../components/PrimaryActionButton';
import LoadingSkeleton, { MobileLoadingSpinner } from '../components/LoadingState';
import VendorLogo from '../components/VendorLogo';
import type { InstructionSubmission } from '../components/InstructionModal';
import { useCart } from '../context/CartContext';
import {
  createSavedCartNote,
  createOrder,
  deleteSavedCartNote,
  fetchDeliveryQuote,
  fetchCurrentCustomer,
  fetchCustomerAddresses,
  fetchSavedCartNotes,
  getApiErrorMessage,
  getCustomerAddressDisplayText,
  getDeliveryLocationDisplayText,
  getDeliveryLocationName,
  getStoredCustomer,
  getStoredSelectedUniversity,
  hasStoredAuthToken,
  resolveApiMediaUrl,
  saveStoredCustomer,
  universitySelectionUpdatedEvent,
  type CreateOrderPayload,
  type Customer,
  type CustomerAddress,
  type DeliveryLocation,
  type DeliveryQuote,
  type DeliveryQuotePayload,
  type SavedCartNote,
} from '../services/api';
import arrowRightIcon from '../assets/ArrowRight.svg';
import backIcon from '../assets/back.svg';
import deliveryAddressIcon from '../assets/boxicons_location-pin.svg';
import informationCircleIcon from '../assets/InformationCircleOutline.svg';
import agentNoteIcon from '../assets/streamline-ultimate_delivery-package-person.svg';
import giftOrderIcon from '../assets/noto_wrapped-gift.svg';
import walletIcon from '../assets/mingcute_wallet-line.svg';
import payOnlineIcon from '../assets/GlobeAltOutline.svg';
import detailRowArrowIcon from '../assets/arrow_forward_ios.svg';
import '../styles/checkout.scss';

interface CheckoutMediaProps {
  source?: string | null;
  label: string;
}

const formatPrice = (amount: number | string) =>
  `\u20A6${Number(amount).toLocaleString('en-NG')}`;

const getCustomerName = (customer: Customer | null) => customer
  ? [customer.first_name.trim(), customer.last_name.trim()].filter(Boolean).join(' ')
  : '';

const CheckoutMedia: React.FC<CheckoutMediaProps> = ({
  source,
  label,
}) => {
  const resolvedSource = resolveApiMediaUrl(source);
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const imageIsAvailable = Boolean(resolvedSource && resolvedSource !== failedSource);

  return (
    <span className="checkout-media checkout-media--item" aria-hidden="true">
      {imageIsAvailable && resolvedSource ? (
        <img
          src={resolvedSource}
          alt=""
          onError={() => setFailedSource(resolvedSource)}
        />
      ) : (
        <span>{label.trim().charAt(0).toUpperCase() || 'S'}</span>
      )}
    </span>
  );
};

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(getStoredCustomer);
  const [customerName, setCustomerName] = useState(() => getCustomerName(getStoredCustomer()));
  const [customerProfileIsLoading, setCustomerProfileIsLoading] = useState(hasStoredAuthToken);
  const [customerProfileError, setCustomerProfileError] = useState('');
  const {
    cart: serverCart,
    cartVendor: vendor,
    cartItems,
    itemCount,
    totalAmount: cartSubtotal,
    isLoading: cartIsLoading,
    error: cartError,
    clearCart,
    updateInstruction,
  } = useCart();
  const [selectedUniversity, setSelectedUniversity] = useState(
    () => getStoredSelectedUniversity() ?? customer?.preferred_university ?? null,
  );
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [selectedDeliveryLocation, setSelectedDeliveryLocation] = useState<DeliveryLocation | null>(null);
  const [addressesAreLoading, setAddressesAreLoading] = useState(true);
  const [addressError, setAddressError] = useState('');
  const [addressModalIsOpen, setAddressModalIsOpen] = useState(false);
  const [deliveryQuote, setDeliveryQuote] = useState<DeliveryQuote | null>(null);
  const [deliveryQuoteKey, setDeliveryQuoteKey] = useState('');
  const [deliveryQuoteIsLoading, setDeliveryQuoteIsLoading] = useState(false);
  const [deliveryQuoteError, setDeliveryQuoteError] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [agentInstructionModalIsOpen, setAgentInstructionModalIsOpen] = useState(false);
  const [agentInstructionIsSaving, setAgentInstructionIsSaving] = useState(false);
  const [agentInstructionError, setAgentInstructionError] = useState<string | null>(null);
  const [savedDeliveryNotes, setSavedDeliveryNotes] = useState<SavedCartNote[]>([]);
  const [savedDeliveryNotesAreLoading, setSavedDeliveryNotesAreLoading] = useState(false);
  const [savedDeliveryNotesError, setSavedDeliveryNotesError] = useState<string | null>(null);
  const [deletingSavedDeliveryNoteId, setDeletingSavedDeliveryNoteId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const vendorName = vendor?.name ?? 'Your vendor';
  const selectedAddress = selectedDeliveryLocation
    ? null
    : addresses.find(({ id }) => id === selectedAddressId) ?? null;
  const deliveryAddress = selectedDeliveryLocation
    ? getDeliveryLocationName(selectedDeliveryLocation)
    : selectedAddress?.address.trim() || '';
  const deliveryAddressDisplay = selectedDeliveryLocation
    ? getDeliveryLocationDisplayText(selectedDeliveryLocation)
    : selectedAddress
      ? getCustomerAddressDisplayText(selectedAddress)
      : deliveryAddress;
  const currentDeliveryQuoteKey = selectedAddress
    ? `address:${selectedAddress.id}|items:${itemCount}|subtotal:${cartSubtotal}`
    : selectedDeliveryLocation && selectedUniversity
      ? [
        `place:${selectedDeliveryLocation.place_id}`,
        `latitude:${selectedDeliveryLocation.latitude}`,
        `longitude:${selectedDeliveryLocation.longitude}`,
        `university:${selectedUniversity.id}`,
        `items:${itemCount}`,
        `subtotal:${cartSubtotal}`,
      ].join('|')
      : '';
  const activeDeliveryQuote = deliveryQuoteKey === currentDeliveryQuoteKey
    ? deliveryQuote
    : null;
  const displayedSubtotal = activeDeliveryQuote?.subtotal_amount ?? cartSubtotal;
  const deliveryFee = activeDeliveryQuote?.delivery_fee ?? null;
  const orderTotal = activeDeliveryQuote?.total_amount ?? cartSubtotal;

  useEffect(() => {
    if (!hasStoredAuthToken()) {
      setCustomerProfileIsLoading(false);
      return;
    }

    const controller = new AbortController();
    setCustomerProfileIsLoading(true);
    setCustomerProfileError('');

    void fetchCurrentCustomer(controller.signal)
      .then((currentCustomer) => {
        const currentCustomerName = getCustomerName(currentCustomer);
        setCustomer(currentCustomer);
        setCustomerName((existingName) => currentCustomerName || existingName);
        setSelectedUniversity((currentUniversity) => (
          currentUniversity ?? currentCustomer.preferred_university
        ));
        saveStoredCustomer(currentCustomer);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setCustomerProfileError(getApiErrorMessage(
            error,
            'Unable to load the logged-in customer profile.',
          ));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setCustomerProfileIsLoading(false);
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!hasStoredAuthToken()) {
      navigate('/login', { replace: true });
      return;
    }

    const controller = new AbortController();
    setAddressesAreLoading(true);

    void fetchCustomerAddresses(controller.signal)
      .then((savedAddresses) => {
        const initialAddress = savedAddresses.find(({ is_default }) => is_default)
          ?? savedAddresses[0]
          ?? null;

        setAddresses(savedAddresses);
        setSelectedAddressId(initialAddress?.id ?? null);
        setDeliveryNotes((currentNotes) => (
          currentNotes || initialAddress?.delivery_instructions || ''
        ));
        setAddressError('');
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setAddressError(getApiErrorMessage(
            error,
            'Unable to load saved addresses. Open the delivery address selector to try again.',
          ));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setAddressesAreLoading(false);
      });

    return () => controller.abort();
  }, [navigate]);

  useEffect(() => {
    const syncSelectedUniversity = () => {
      setSelectedUniversity(
        getStoredSelectedUniversity() ?? getStoredCustomer()?.preferred_university ?? null,
      );
    };

    window.addEventListener(universitySelectionUpdatedEvent, syncSelectedUniversity);
    return () => window.removeEventListener(universitySelectionUpdatedEvent, syncSelectedUniversity);
  }, []);

  useEffect(() => {
    if (!serverCart?.delivery_notes) return;
    setDeliveryNotes(serverCart.delivery_notes);
  }, [serverCart?.delivery_notes]);

  useEffect(() => {
    if (!currentDeliveryQuoteKey || cartItems.length === 0) {
      setDeliveryQuote(null);
      setDeliveryQuoteKey('');
      setDeliveryQuoteIsLoading(false);
      setDeliveryQuoteError('');
      return undefined;
    }

    const payload: DeliveryQuotePayload = selectedAddress
      ? { customer_address: selectedAddress.id }
      : {
        university: selectedUniversity?.id,
        delivery_latitude: selectedDeliveryLocation?.latitude.toFixed(6),
        delivery_longitude: selectedDeliveryLocation?.longitude.toFixed(6),
        delivery_place_id: selectedDeliveryLocation?.place_id,
      };
    const controller = new AbortController();

    setDeliveryQuote(null);
    setDeliveryQuoteKey('');
    setDeliveryQuoteIsLoading(true);
    setDeliveryQuoteError('');

    void fetchDeliveryQuote(payload, controller.signal)
      .then((quote) => {
        setDeliveryQuote(quote);
        setDeliveryQuoteKey(currentDeliveryQuoteKey);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setDeliveryQuoteError(getApiErrorMessage(
            error,
            'Unable to calculate the delivery fee for this address.',
          ));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setDeliveryQuoteIsLoading(false);
      });

    return () => controller.abort();
  }, [
    cartItems.length,
    currentDeliveryQuoteKey,
    selectedAddress,
    selectedDeliveryLocation,
    selectedUniversity?.id,
  ]);

  useEffect(() => {
    if (!agentInstructionModalIsOpen || !hasStoredAuthToken()) {
      setSavedDeliveryNotesAreLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    setSavedDeliveryNotesAreLoading(true);

    void fetchSavedCartNotes('delivery', controller.signal)
      .then(setSavedDeliveryNotes)
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setSavedDeliveryNotesError(
          getApiErrorMessage(error, 'Unable to load your saved delivery notes.'),
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setSavedDeliveryNotesAreLoading(false);
      });

    return () => controller.abort();
  }, [agentInstructionModalIsOpen]);

  const handleBackToVendor = () => {
    if (vendor?.id) {
      navigate(`/cafeteria/${vendor.id}`);
      return;
    }

    navigate(-1);
  };

  const handleAddressSaved = (savedAddress: CustomerAddress) => {
    setAddresses((currentAddresses) => {
      const otherAddresses = currentAddresses
        .filter(({ id }) => id !== savedAddress.id)
        .map((address) => (
          savedAddress.is_default ? { ...address, is_default: false } : address
        ));

      return [savedAddress, ...otherAddresses];
    });
    setSelectedDeliveryLocation(null);
    setSelectedAddressId(savedAddress.id);
    setAddressError('');
    setDeliveryNotes((currentNotes) => currentNotes || savedAddress.delivery_instructions || '');
    setAddressModalIsOpen(false);
  };

  const handleAddressSelected = (address: CustomerAddress) => {
    setSelectedDeliveryLocation(null);
    setSelectedAddressId(address.id);
    setDeliveryNotes(address.delivery_instructions || '');
    setAddressError('');
    setAddressModalIsOpen(false);
  };

  const handleDeliveryLocationSelected = (location: DeliveryLocation) => {
    setSelectedDeliveryLocation(location);
    setSelectedAddressId(null);
    setAddressError('');
    setAddressModalIsOpen(false);
  };

  const handleAddressDeleted = (deletedAddressId: number) => {
    setAddresses((currentAddresses) => {
      const deletedAddress = currentAddresses.find(({ id }) => id === deletedAddressId);
      let remainingAddresses = currentAddresses.filter(({ id }) => id !== deletedAddressId);

      if (deletedAddress?.is_default && remainingAddresses.length > 0) {
        remainingAddresses = remainingAddresses.map((address, index) => ({
          ...address,
          is_default: index === 0,
        }));
      }

      if (selectedAddressId === deletedAddressId) {
        const replacementAddress = remainingAddresses.find(({ is_default }) => is_default)
          ?? remainingAddresses[0]
          ?? null;
        setSelectedAddressId(replacementAddress?.id ?? null);
        setDeliveryNotes(replacementAddress?.delivery_instructions || '');
      }

      return remainingAddresses;
    });
  };

  const handleOpenAgentInstruction = () => {
    setAgentInstructionError(null);
    setSavedDeliveryNotesError(null);
    setSavedDeliveryNotes([]);
    setAgentInstructionModalIsOpen(true);
  };

  const handleDismissAgentInstruction = () => {
    if (agentInstructionIsSaving) return;
    setAgentInstructionError(null);
    setAgentInstructionModalIsOpen(false);
  };

  const handleSaveAgentInstruction = async ({
    instruction,
    saveForLater,
  }: InstructionSubmission) => {
    setAgentInstructionIsSaving(true);
    setAgentInstructionError(null);

    try {
      await updateInstruction('delivery', instruction);
      setDeliveryNotes(instruction);

      if (saveForLater) {
        try {
          await createSavedCartNote(instruction, 'delivery');
        } catch (error: unknown) {
          setAgentInstructionError(
            getApiErrorMessage(
              error,
              'The instruction was added to your cart, but could not be saved for later.',
            ),
          );
          return;
        }
      }

      setAgentInstructionModalIsOpen(false);
    } catch (error: unknown) {
      setAgentInstructionError(
        getApiErrorMessage(error, 'Unable to add the agent instruction.'),
      );
    } finally {
      setAgentInstructionIsSaving(false);
    }
  };

  const handleDeleteSavedDeliveryNote = async (savedNoteId: number) => {
    setDeletingSavedDeliveryNoteId(savedNoteId);
    setSavedDeliveryNotesError(null);

    try {
      await deleteSavedCartNote(savedNoteId);
      setSavedDeliveryNotes((currentNotes) => (
        currentNotes.filter((savedNote) => savedNote.id !== savedNoteId)
      ));
    } catch (error: unknown) {
      setSavedDeliveryNotesError(
        getApiErrorMessage(error, 'Unable to delete the saved delivery note.'),
      );
    } finally {
      setDeletingSavedDeliveryNoteId(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!customer) {
      navigate('/login');
      return;
    }

    if (cartItems.length === 0) {
      setSubmitError('Your cart is empty. Add items before placing an order.');
      return;
    }

    if (!deliveryAddress) {
      setSubmitError('Add a delivery address before placing your order.');
      return;
    }

    if (!activeDeliveryQuote) {
      setSubmitError(
        deliveryQuoteError
        || (deliveryQuoteIsLoading
          ? 'Wait while your delivery fee is calculated.'
          : 'A valid delivery quote is required before placing your order.'),
      );
      return;
    }

    if (!customerName.trim()) {
      setSubmitError('Enter a customer name before placing your order.');
      return;
    }

    const orderData: CreateOrderPayload = {
      customer_name: customerName.trim(),
      phone_number: customer.phone_number,
      delivery_address: deliveryAddress,
      ...(selectedAddress ? { customer_address: selectedAddress.id } : {}),
      ...(selectedDeliveryLocation ? {
        delivery_place_id: selectedDeliveryLocation.place_id,
        delivery_latitude: selectedDeliveryLocation.latitude.toFixed(6),
        delivery_longitude: selectedDeliveryLocation.longitude.toFixed(6),
        ...(selectedUniversity ? { university: selectedUniversity.id } : {}),
      } : {}),
      delivery_notes: deliveryNotes.trim(),
      order_items: cartItems.map(({ menu_item: menuItem, quantity }) => ({
        menu_item: menuItem,
        quantity,
      })),
    };

    setSubmitError('');
    setIsSubmitting(true);

    try {
      await createOrder(orderData);

      try {
        await clearCart();
        localStorage.removeItem('cartVendor');
      } catch (cartClearError) {
        console.error('Order was placed, but the cart could not be cleared:', cartClearError);
      }

      navigate('/order-history', { replace: true });
    } catch (error: unknown) {
      setSubmitError(getApiErrorMessage(
        error,
        'Unable to place your order right now. Please try again.',
      ));
    } finally {
      setIsSubmitting(false);
    }
  };

  const placeOrderIsDisabled = isSubmitting
    || cartIsLoading
    || customerProfileIsLoading
    || addressesAreLoading
    || cartItems.length === 0
    || !deliveryAddress
    || !customerName
    || deliveryQuoteIsLoading
    || !activeDeliveryQuote;
  const checkoutIsLoading = cartIsLoading
    || customerProfileIsLoading
    || addressesAreLoading
    || deliveryQuoteIsLoading
    || isSubmitting
    || savedDeliveryNotesAreLoading
    || agentInstructionIsSaving;
  const placeOrderBlocker = cartIsLoading
    ? 'Loading your cart...'
    : cartItems.length === 0
      ? 'Add at least one item to your cart before placing an order.'
      : customerProfileIsLoading
        ? 'Loading your customer profile...'
        : addressesAreLoading
          ? 'Loading your saved delivery addresses...'
          : !deliveryAddress
            ? ''
            : deliveryQuoteIsLoading
              ? 'Calculating your delivery fee...'
              : deliveryQuoteError
                ? deliveryQuoteError
                : !activeDeliveryQuote
                  ? 'A valid delivery quote is required before placing your order.'
            : !customerName.trim()
              ? customerProfileError
                || 'The logged-in customer profile does not contain a first or last name.'
              : '';

  return (
    <main className="checkout-page">
      {checkoutIsLoading && <MobileLoadingSpinner label="Loading checkout details" />}

      <div className="checkout-page__header">
        <Header />
      </div>

      <form className="checkout-page__form" onSubmit={handleSubmit}>
        <header className="checkout-page__intro">
          <ModalHeaderButton
            variant="back"
            iconSrc={backIcon}
            className="checkout-page__mobile-back"
            onClick={handleBackToVendor}
            aria-label="Back to vendor"
          />
          <button type="button" className="checkout-page__back" onClick={handleBackToVendor}>
            <img src={arrowRightIcon} alt="" aria-hidden="true" />
            <span>Back to vendor</span>
          </button>
          <h1>Checkout</h1>
        </header>

        <div className="checkout-layout">
          <section className="checkout-card checkout-delivery" aria-labelledby="checkout-delivery-title">
            <CheckoutSectionHeading title="Delivery" titleId="checkout-delivery-title" />

            <div className="checkout-delivery__body">
              <p className="checkout-pin-notice">
                <img src={informationCircleIcon} alt="" aria-hidden="true" />
                <span>PIN required for delivery</span>
              </p>

              <button
                type="button"
                className="checkout-detail-row checkout-detail-row--button checkout-address-row"
                aria-haspopup="dialog"
                onClick={() => setAddressModalIsOpen(true)}
              >
                <img
                  className="checkout-detail-row__asset-icon"
                  src={deliveryAddressIcon}
                  alt=""
                  aria-hidden="true"
                />
                <span className="checkout-detail-row__copy">
                  {addressesAreLoading ? (
                    <strong>Loading delivery address...</strong>
                  ) : deliveryAddress ? (
                    <strong>{deliveryAddressDisplay}</strong>
                  ) : (
                    <strong>Choose delivery address</strong>
                  )}
                  <small>
                    {addressError
                      || (deliveryAddress
                        ? 'Delivery address'
                        : 'Search for an address or choose a saved one')}
                  </small>
                </span>
                <img
                  src={detailRowArrowIcon}
                  alt=""
                  className="checkout-detail-row__chevron"
                  aria-hidden="true"
                />
              </button>

              <button
                type="button"
                className="checkout-detail-row checkout-detail-row--button checkout-agent-note-row"
                aria-haspopup="dialog"
                onClick={handleOpenAgentInstruction}
              >
                <img
                  src={agentNoteIcon}
                  alt=""
                  className="checkout-detail-row__asset-icon"
                  aria-hidden="true"
                />
                <span className="checkout-detail-row__copy">
                  <strong>Leave a note for your agent</strong>
                  <small>{deliveryNotes || 'Any instructions for a smooth delivery etc.'}</small>
                </span>
                <img
                  src={detailRowArrowIcon}
                  alt=""
                  className="checkout-detail-row__chevron"
                  aria-hidden="true"
                />
              </button>

              <button
                type="button"
                className="checkout-detail-row checkout-detail-row--button checkout-detail-row--unavailable checkout-gift-row"
                aria-label="Gift this order (coming soon)"
                disabled
              >
                <img
                  src={giftOrderIcon}
                  alt=""
                  className="checkout-detail-row__asset-icon"
                  aria-hidden="true"
                />
                <span className="checkout-detail-row__copy">
                  <strong>Gift this order</strong>
                </span>
                <img
                  src={detailRowArrowIcon}
                  alt=""
                  className="checkout-detail-row__chevron"
                  aria-hidden="true"
                />
              </button>
            </div>

            <section className="checkout-payment" aria-labelledby="checkout-payment-title">
              <CheckoutSectionHeading
                title="Payment Method"
                titleId="checkout-payment-title"
                trailing={<span aria-label="Adding payment methods is coming soon">+ Add new</span>}
              />

              <div className="checkout-payment__options">
                <button type="button" disabled aria-label="Wallet balance, zero naira">
                  <img src={walletIcon} alt="" aria-hidden="true" />
                  <span>Wallet ({formatPrice(0)}.00)</span>
                </button>
                <button type="button" className="checkout-payment__option--selected" aria-pressed="true">
                  <img src={payOnlineIcon} alt="" aria-hidden="true" />
                  <span>Pay online</span>
                </button>
              </div>
            </section>
          </section>

          <aside className="checkout-card checkout-summary" aria-labelledby="checkout-summary-title">
            <CheckoutSectionHeading title="Order Summary" titleId="checkout-summary-title" />

            <div className="checkout-summary__body">
              <div className="checkout-vendor">
                <VendorLogo name={vendorName} source={vendor?.logo} variant="checkout" />
                <div className="checkout-vendor__copy">
                  <strong>{vendorName}</strong>
                  <small>{itemCount} {itemCount === 1 ? 'item' : 'items'}</small>
                </div>
                <button type="button" onClick={handleBackToVendor}>Edit</button>
              </div>

              {cartIsLoading ? (
                <LoadingSkeleton
                  variant="checkout-items"
                  label="Loading your order summary"
                  showMobileSpinner={false}
                />
              ) : cartError ? (
                <p className="checkout-summary__feedback checkout-summary__feedback--error" role="alert">
                  {cartError}
                </p>
              ) : cartItems.length === 0 ? (
                <p className="checkout-summary__feedback">Your cart is empty.</p>
              ) : (
                <ul className="checkout-items">
                  {cartItems.map(({ id, menu_item_detail: item, quantity }) => (
                    <li key={id} className="checkout-item">
                      <CheckoutMedia source={item.image} label={item.name} />
                      <div className="checkout-item__copy">
                        <strong>{item.name}</strong>
                        <span>{formatPrice(item.price)}</span>
                      </div>
                      <span className="checkout-item__quantity">X{quantity}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <footer className="checkout-total" aria-labelledby="checkout-total-title">
              <CheckoutSectionHeading title="Order Total" titleId="checkout-total-title" />
              <dl>
                <div>
                  <dt>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</dt>
                  <dd>{formatPrice(displayedSubtotal)}</dd>
                </div>
                <div>
                  <dt>Delivery fee</dt>
                  <dd>
                    {deliveryQuoteIsLoading
                      ? 'Calculating...'
                      : deliveryFee === null
                        ? 'Select address'
                        : formatPrice(deliveryFee)}
                  </dd>
                </div>
                <div className="checkout-total__grand-total">
                  <dt>Total</dt>
                  <dd>{formatPrice(orderTotal)}</dd>
                </div>
              </dl>

              <PrimaryActionButton type="submit" disabled={placeOrderIsDisabled}>
                {isSubmitting ? 'Placing order...' : 'Place order'}
              </PrimaryActionButton>

              {placeOrderBlocker && !submitError && (
                <p className="checkout-submit-guidance" role="status">{placeOrderBlocker}</p>
              )}
              {submitError && <p className="checkout-submit-error" role="alert">{submitError}</p>}
            </footer>
          </aside>
        </div>
        <div className="checkout-page__mobile-total-spacer" aria-hidden="true" />
      </form>

      {addressModalIsOpen && (
        <CheckoutAddressModal
          universityId={selectedUniversity?.id ?? null}
          universityName={selectedUniversity?.name}
          addresses={addresses}
          onDismiss={() => setAddressModalIsOpen(false)}
          onSelect={handleAddressSelected}
          onSelectLocation={handleDeliveryLocationSelected}
          onSaved={handleAddressSaved}
          onDeleted={handleAddressDeleted}
        />
      )}

      {agentInstructionModalIsOpen && (
        <InstructionModal
          audience="agent"
          currentInstruction={deliveryNotes}
          errorMessage={agentInstructionError}
          isSaving={agentInstructionIsSaving}
          savedNotes={savedDeliveryNotes}
          savedNotesError={savedDeliveryNotesError}
          savedNotesAreLoading={savedDeliveryNotesAreLoading}
          deletingSavedNoteId={deletingSavedDeliveryNoteId}
          onDismiss={handleDismissAgentInstruction}
          onDeleteSavedNote={handleDeleteSavedDeliveryNote}
          onSubmit={handleSaveAgentInstruction}
        />
      )}
    </main>
  );
};

export default Checkout;
