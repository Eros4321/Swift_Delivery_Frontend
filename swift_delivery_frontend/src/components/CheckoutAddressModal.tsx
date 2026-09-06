import React, { useEffect, useId, useMemo, useState } from 'react';
import {
  createCustomerAddress,
  deleteCustomerAddress,
  fetchUniversities,
  getApiErrorMessage,
  getDeliveryLocationDisplayText,
  getDeliveryLocationName,
  reverseGeocodeDeliveryLocation,
  searchDeliveryLocations,
  type CreateCustomerAddressPayload,
  type CustomerAddress,
  type DeliveryLocation,
  type UniversityDeliveryArea,
} from '../services/api';
import backIcon from '../assets/back.svg';
import deliveryAddressIcon from '../assets/boxicons_location-pin.svg';
import closeIcon from '../assets/close.svg';
import locationMarker from '../assets/LocationMarker.svg';
import searchIcon from '../assets/reicon_search (1).svg';
import selectAddressIcon from '../assets/basil_location-check-outline.svg';
import trashIcon from '../assets/TrashOutline.svg';
import CheckboxOption from './CheckboxOption';
import ModalHeaderButton from './ModalHeaderButton';
import PrimaryActionButton from './PrimaryActionButton';
import type { MapPlaceSelection } from './GoogleAddressPickerMap';
import '../styles/CheckoutAddressModal.scss';

interface CheckoutAddressModalProps {
  universityId: number | null;
  universityName?: string;
  addresses: CustomerAddress[];
  onDismiss: () => void;
  onSelect: (address: CustomerAddress) => void;
  onSelectLocation: (location: DeliveryLocation) => void;
  onSaved: (address: CustomerAddress) => void;
  onDeleted: (addressId: number) => void;
}

type AddressModalView = 'list' | 'map';

interface MapCoordinates {
  latitude: number;
  longitude: number;
}

const GoogleAddressPickerMap = React.lazy(() => import('./GoogleAddressPickerMap'));
const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim() || '';

const formatCoordinate = (coordinate: number) => Number(coordinate).toFixed(6);

const requestCurrentPosition = () => new Promise<GeolocationPosition>((resolve, reject) => {
  navigator.geolocation.getCurrentPosition(resolve, reject, {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 60000,
  });
});

const getLocationPermissionError = (error: GeolocationPositionError) => {
  if (error.code === 1) return 'Allow location access in your browser to use your current position.';
  if (error.code === 2) return 'Your current location could not be determined.';
  return 'Getting your current location took too long. Please try again.';
};

const CheckoutAddressModal: React.FC<CheckoutAddressModalProps> = ({
  universityId,
  universityName,
  addresses,
  onDismiss,
  onSelect,
  onSelectLocation,
  onSaved,
  onDeleted,
}) => {
  const titleId = useId();
  const searchId = useId();
  const [view, setView] = useState<AddressModalView>('list');
  const [query, setQuery] = useState('');
  const [locations, setLocations] = useState<DeliveryLocation[]>([]);
  const [saveForLater, setSaveForLater] = useState(false);
  const [searchIsPending, setSearchIsPending] = useState(false);
  const [currentLocationIsPending, setCurrentLocationIsPending] = useState(false);
  const [mapIsPreparing, setMapIsPreparing] = useState(false);
  const [mapSelection, setMapSelection] = useState<MapPlaceSelection | null>(null);
  const [mapCenter, setMapCenter] = useState<MapCoordinates | null>(null);
  const [mapDeliveryArea, setMapDeliveryArea] = useState<UniversityDeliveryArea | null>(null);
  const [universityPlaceId, setUniversityPlaceId] = useState<string | null>(null);
  const [mapLocation, setMapLocation] = useState<DeliveryLocation | null>(null);
  const [reverseGeocodeIsPending, setReverseGeocodeIsPending] = useState(false);
  const [saveIsPending, setSaveIsPending] = useState(false);
  const [deleteIsPendingId, setDeleteIsPendingId] = useState<number | null>(null);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<number | null>(null);
  const [searchError, setSearchError] = useState('');
  const [listError, setListError] = useState('');
  const [mapError, setMapError] = useState('');

  const modalIsBusy = saveIsPending
    || currentLocationIsPending
    || mapIsPreparing
    || deleteIsPendingId !== null;
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredSavedAddresses = useMemo(() => {
    if (!normalizedQuery) return addresses;

    return addresses.filter((savedAddress) => (
      savedAddress.address.toLocaleLowerCase().includes(normalizedQuery)
      || savedAddress.label.toLocaleLowerCase().includes(normalizedQuery)
    ));
  }, [addresses, normalizedQuery]);
  const shouldSearchLocations = view === 'list'
    && Boolean(universityId)
    && normalizedQuery.length >= 3;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !modalIsBusy) onDismiss();
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [modalIsBusy, onDismiss]);

  useEffect(() => {
    const searchQuery = query.trim();

    if (!shouldSearchLocations || !universityId) {
      setLocations([]);
      setSearchIsPending(false);
      setSearchError('');
      return;
    }

    const controller = new AbortController();
    const searchTimer = window.setTimeout(() => {
      setSearchIsPending(true);
      setSearchError('');

      void searchDeliveryLocations(searchQuery, universityId, controller.signal)
        .then((results) => {
          setLocations(results);
          if (results.length === 0) {
            setSearchError('No supported delivery locations matched that search.');
          }
        })
        .catch((error: unknown) => {
          if (!controller.signal.aborted) {
            setSearchError(getApiErrorMessage(
              error,
              'Unable to search delivery locations right now.',
            ));
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setSearchIsPending(false);
        });
    }, 350);

    return () => {
      window.clearTimeout(searchTimer);
      controller.abort();
    };
  }, [query, shouldSearchLocations, universityId]);

  useEffect(() => {
    if (view !== 'map' || !mapSelection || !universityId) {
      setReverseGeocodeIsPending(false);
      return undefined;
    }

    const controller = new AbortController();
    const reverseGeocodeTimer = window.setTimeout(() => {
      setReverseGeocodeIsPending(true);
      setMapError('');

      void reverseGeocodeDeliveryLocation(
        mapSelection.latitude,
        mapSelection.longitude,
        universityId,
        mapSelection.placeId,
        controller.signal,
      )
        .then(setMapLocation)
        .catch((error: unknown) => {
          if (!controller.signal.aborted) {
            setMapError(getApiErrorMessage(
              error,
              'That marked place could not be used as a delivery address. Select another one.',
            ));
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setReverseGeocodeIsPending(false);
        });
    }, 450);

    return () => {
      window.clearTimeout(reverseGeocodeTimer);
      controller.abort();
    };
  }, [mapSelection, universityId, view]);

  const resetForm = () => {
    setMapSelection(null);
    setMapCenter(null);
    setMapDeliveryArea(null);
    setUniversityPlaceId(null);
    setMapLocation(null);
    setMapError('');
  };

  const returnToAddressList = () => {
    resetForm();
    setQuery('');
    setLocations([]);
    setSearchError('');
    setView('list');
  };

  const buildNewAddressPayload = (location: DeliveryLocation): CreateCustomerAddressPayload | null => {
    if (!universityId) return null;

    const formattedAddress = location.formatted_address.trim() || getDeliveryLocationName(location);
    if (!formattedAddress) return null;

    return {
      university: universityId,
      label: getDeliveryLocationName(location) || 'Saved address',
      address: formattedAddress,
      provider_place_id: location.place_id,
      latitude: formatCoordinate(location.latitude),
      longitude: formatCoordinate(location.longitude),
      delivery_instructions: '',
      is_default: addresses.length === 0,
    };
  };

  const handleLocationSelect = async (
    location: DeliveryLocation,
    setError: React.Dispatch<React.SetStateAction<string>> = setListError,
  ) => {
    setQuery(getDeliveryLocationName(location));
    setLocations([location]);
    setSearchError('');
    setError('');

    if (!saveForLater) {
      onSelectLocation(location);
      return;
    }

    const existingAddress = addresses.find(
      ({ provider_place_id: providerPlaceId }) => providerPlaceId === location.place_id,
    );
    if (existingAddress) {
      onSelect(existingAddress);
      return;
    }

    const payload = buildNewAddressPayload(location);
    if (!payload) {
      setError('Select a valid delivery location before saving it.');
      return;
    }

    setSaveIsPending(true);

    try {
      const savedAddress = await createCustomerAddress(payload);
      onSaved(savedAddress);
    } catch (error: unknown) {
      setError(getApiErrorMessage(error, 'Unable to save this address. Please try again.'));
    } finally {
      setSaveIsPending(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    if (!universityId) {
      setListError('Select a university in the header before using your current location.');
      return;
    }

    if (!navigator.geolocation) {
      setListError('Location detection is not supported by this browser.');
      return;
    }

    setCurrentLocationIsPending(true);
    setListError('');

    try {
      const position = await requestCurrentPosition();
      const { latitude, longitude } = position.coords;
      const currentLocation = await reverseGeocodeDeliveryLocation(
        latitude,
        longitude,
        universityId,
      );

      await handleLocationSelect(currentLocation);
    } catch (error: unknown) {
      const errorCode = typeof error === 'object' && error !== null && 'code' in error
        ? (error as { code: unknown }).code
        : null;

      if (typeof errorCode === 'number') {
        setListError(getLocationPermissionError(error as GeolocationPositionError));
      } else {
        setListError(getApiErrorMessage(
          error,
          'Your current location is outside the selected university delivery area.',
        ));
      }
    } finally {
      setCurrentLocationIsPending(false);
    }
  };

  const handleOpenMapPicker = async () => {
    if (!universityId) {
      setListError('Select a university in the header before choosing a point on the map.');
      return;
    }

    setMapIsPreparing(true);
    setListError('');

    try {
      const universities = await fetchUniversities();
      const selectedUniversity = universities.find(({ id }) => id === universityId);
      const latitude = Number(selectedUniversity?.latitude);
      const longitude = Number(selectedUniversity?.longitude);

      if (!selectedUniversity || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        setListError('The selected university does not have a valid map location yet.');
        return;
      }

      setMapCenter({ latitude, longitude });
      setMapDeliveryArea(selectedUniversity.delivery_area || null);
      setUniversityPlaceId(selectedUniversity.google_place_id || null);
      setMapSelection(null);
      setMapLocation(null);
      setMapError('');
      setView('map');
    } catch (error: unknown) {
      setListError(getApiErrorMessage(error, 'Unable to prepare the address map right now.'));
    } finally {
      setMapIsPreparing(false);
    }
  };

  const handleMapPlaceSelect = (selection: MapPlaceSelection) => {
    setMapLocation(null);
    setMapError('');
    setReverseGeocodeIsPending(true);
    setMapSelection(selection);
  };

  const handleMapSelectionClear = () => {
    setMapSelection(null);
    setMapLocation(null);
    setReverseGeocodeIsPending(false);
    setMapError('');
  };

  const handleMapLocationSelect = async () => {
    if (!mapLocation) return;
    await handleLocationSelect(mapLocation, setMapError);
  };

  const handleDeleteAddress = async (addressIdToDelete: number) => {
    setDeleteIsPendingId(addressIdToDelete);
    setListError('');

    try {
      await deleteCustomerAddress(addressIdToDelete);
      onDeleted(addressIdToDelete);
      setDeleteConfirmationId(null);
    } catch (error: unknown) {
      setListError(getApiErrorMessage(error, 'Unable to delete this address. Please try again.'));
    } finally {
      setDeleteIsPendingId(null);
    }
  };

  const modalTitle = view === 'list' ? 'Delivery Address' : 'Select delivery address';

  return (
    <div
      className="checkout-address-modal__backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !modalIsBusy) onDismiss();
      }}
    >
      <section
        className={`checkout-address-modal checkout-address-modal--${view}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="checkout-address-modal__header">
          {view !== 'list' && (
            <ModalHeaderButton
              variant="back"
              iconSrc={backIcon}
              onClick={returnToAddressList}
              disabled={modalIsBusy}
              aria-label="Back to saved addresses"
            />
          )}
          <h2 id={titleId}>{modalTitle}</h2>
          <ModalHeaderButton
            variant="close"
            iconSrc={closeIcon}
            onClick={onDismiss}
            disabled={modalIsBusy}
            aria-label="Close delivery address modal"
          />
        </header>

        {view === 'list' ? (
          <div className="checkout-address-modal__content">
            <div className="checkout-address-modal__search">
              <img src={searchIcon} alt="" aria-hidden="true" />
              <input
                id={searchId}
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setLocations([]);
                  setListError('');
                }}
                placeholder="Enter a new address"
                aria-label="Search for a new delivery address"
                autoComplete="off"
                autoFocus
                disabled={!universityId || modalIsBusy}
              />
            </div>

            <CheckboxOption
              containerClassName="checkout-address-modal__save-option"
              label="Save address for later"
              checked={saveForLater}
              onChange={(event) => setSaveForLater(event.target.checked)}
              disabled={modalIsBusy}
            />

            <div className="checkout-address-modal__new-address-actions">
              <button
                type="button"
                onClick={() => void handleUseCurrentLocation()}
                disabled={modalIsBusy}
              >
                <span
                  className="checkout-address-modal__current-location-icon"
                  style={{
                    WebkitMaskImage: `url("${deliveryAddressIcon}")`,
                    maskImage: `url("${deliveryAddressIcon}")`,
                  }}
                  aria-hidden="true"
                />
                <span className="checkout-address-modal__action-copy">
                  <strong>
                    {currentLocationIsPending ? 'Finding your location...' : 'Use your current location'}
                  </strong>
                  <small>{universityName || 'Select a university in the header first'}</small>
                </span>
              </button>
              <button
                type="button"
                onClick={() => void handleOpenMapPicker()}
                disabled={modalIsBusy || !universityId}
              >
                <span
                  className="checkout-address-modal__current-location-icon"
                  style={{
                    WebkitMaskImage: `url("${selectAddressIcon}")`,
                    maskImage: `url("${selectAddressIcon}")`,
                  }}
                  aria-hidden="true"
                />
                <span className="checkout-address-modal__action-copy">
                  <strong>{mapIsPreparing ? 'Opening map...' : 'Select address'}</strong>
                  <small>Choose the exact delivery point on a map</small>
                </span>
              </button>
            </div>

            {listError && <p className="checkout-address-modal__error" role="alert">{listError}</p>}
            {!universityId && (
              <p className="checkout-address-modal__error" role="alert">
                Select a university in the header before searching for a new address.
              </p>
            )}

            <section
              className="checkout-address-modal__saved"
              aria-label="Saved and searched delivery addresses"
            >
              {filteredSavedAddresses.length > 0 ? (
                <ul className="checkout-address-modal__saved-list">
                  {filteredSavedAddresses.map((savedAddress) => {
                    const isConfirmingDelete = savedAddress.id === deleteConfirmationId;
                    const isDeleting = savedAddress.id === deleteIsPendingId;

                    return (
                      <li key={savedAddress.id}>
                        <div className="checkout-address-modal__saved-row">
                          <button
                            type="button"
                            className="checkout-address-modal__select-address"
                            onClick={() => onSelect(savedAddress)}
                            disabled={modalIsBusy}
                          >
                            <img
                              src={locationMarker}
                              alt=""
                              className="checkout-address-modal__saved-location-icon"
                              aria-hidden="true"
                            />
                            <span>
                              <strong>{savedAddress.label.trim() || savedAddress.address.trim()}</strong>
                            </span>
                          </button>
                          <div className="checkout-address-modal__saved-actions">
                            <button
                              type="button"
                              className="checkout-address-modal__delete"
                              onClick={() => setDeleteConfirmationId(savedAddress.id)}
                              disabled={modalIsBusy}
                              aria-label={`Delete ${savedAddress.address}`}
                            >
                              <img src={trashIcon} alt="" aria-hidden="true" />
                            </button>
                          </div>
                        </div>

                        {isConfirmingDelete && (
                          <div className="checkout-address-modal__delete-confirmation" role="alert">
                            <span>Delete this saved address?</span>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmationId(null)}
                              disabled={isDeleting}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDeleteAddress(savedAddress.id)}
                              disabled={isDeleting}
                            >
                              {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : !normalizedQuery ? (
                <p className="checkout-address-modal__empty">
                  You have no saved delivery addresses yet.
                </p>
              ) : normalizedQuery.length < 3 ? (
                <p className="checkout-address-modal__empty">
                  No saved address matches. Type at least 3 characters to search nearby places.
                </p>
              ) : null}

              {normalizedQuery.length >= 3 && (
                <>
                  {searchIsPending && (
                    <p className="checkout-address-modal__status">Searching locations...</p>
                  )}
                  {searchError && filteredSavedAddresses.length === 0 && (
                    <p className="checkout-address-modal__error" role="alert">{searchError}</p>
                  )}
                  {locations.length > 0 && (
                    <ul className="checkout-address-modal__place-results">
                      {locations.map((location) => (
                        <li key={location.place_id}>
                          <button
                            type="button"
                            onClick={() => void handleLocationSelect(location)}
                            disabled={modalIsBusy}
                          >
                            <img
                              src={locationMarker}
                              alt=""
                              className="checkout-address-modal__place-result-icon"
                              aria-hidden="true"
                            />
                            <span>
                              <strong>{getDeliveryLocationDisplayText(location)}</strong>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </section>
          </div>
        ) : (
          <div className="checkout-address-modal__map-content">
            <div className="checkout-address-modal__interactive-map">
              {!googleMapsApiKey ? (
                <p className="google-address-picker__error" role="alert">
                  Add VITE_GOOGLE_MAPS_API_KEY to your local environment to use the map.
                </p>
              ) : mapCenter ? (
                <React.Suspense
                  fallback={<p className="google-address-picker__loading">Loading Google Maps...</p>}
                >
                  <GoogleAddressPickerMap
                    apiKey={googleMapsApiKey}
                    initialCenter={mapCenter}
                    deliveryArea={mapDeliveryArea}
                    universityPlaceId={universityPlaceId}
                    disabled={saveIsPending}
                    onPlaceSelect={handleMapPlaceSelect}
                    onSelectionClear={handleMapSelectionClear}
                  />
                </React.Suspense>
              ) : (
                <p className="google-address-picker__loading">Preparing the map...</p>
              )}
            </div>

            <div className="checkout-address-modal__map-actions">
              <div className="checkout-address-modal__map-selection" aria-live="polite">
                {reverseGeocodeIsPending ? (
                  <p>Finding the address at this point...</p>
                ) : mapLocation ? (
                  <>
                    <span
                      className="checkout-address-modal__map-selection-icon"
                      style={{
                        WebkitMaskImage: `url("${deliveryAddressIcon}")`,
                        maskImage: `url("${deliveryAddressIcon}")`,
                      }}
                      aria-hidden="true"
                    />
                    <span>
                      <strong>{getDeliveryLocationName(mapLocation)}</strong>
                      {mapLocation.name?.trim()
                        && mapLocation.name.trim() !== mapLocation.formatted_address.trim() && (
                        <small>{mapLocation.formatted_address}</small>
                      )}
                    </span>
                  </>
                ) : (
                  <p>Tap a marked place on the map to choose your delivery location.</p>
                )}
              </div>

              <CheckboxOption
                containerClassName="checkout-address-modal__map-save-option"
                label="Save address for later"
                checked={saveForLater}
                onChange={(event) => setSaveForLater(event.target.checked)}
                disabled={saveIsPending}
              />

              {mapError && (
                <p className="checkout-address-modal__error" role="alert">{mapError}</p>
              )}

              <PrimaryActionButton
                type="button"
                onClick={() => void handleMapLocationSelect()}
                disabled={!mapLocation || reverseGeocodeIsPending || saveIsPending}
              >
                {saveIsPending
                  ? 'Saving address...'
                  : saveForLater
                    ? 'Save and use address'
                    : 'Use this address'}
              </PrimaryActionButton>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default CheckoutAddressModal;
