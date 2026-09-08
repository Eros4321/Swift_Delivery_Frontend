import React, { useEffect, useRef, useState } from 'react';
import { importLibrary, setOptions } from '@googlemaps/js-api-loader';
import selectedAddressIcon from '../assets/basil_location-check-outline.svg';
import {
  normalizeGooglePlaceId,
  type UniversityDeliveryArea,
} from '../services/api';

interface MapCoordinates {
  latitude: number;
  longitude: number;
}

export interface MapPlaceSelection extends MapCoordinates {
  placeId: string;
  name: string | null;
  formattedAddress: string;
}

interface GoogleAddressPickerMapProps {
  apiKey: string;
  initialCenter: MapCoordinates;
  deliveryArea?: UniversityDeliveryArea | null;
  universityPlaceId?: string | null;
  disabled?: boolean;
  onPlaceSelect: (selection: MapPlaceSelection) => void;
  onSelectionClear?: () => void;
}

interface GoogleMapsWindow extends Window {
  gm_authFailure?: () => void;
}

let configuredApiKey = '';
let mapsLibraryPromise: Promise<google.maps.MapsLibrary> | null = null;
let placesLibraryPromise: Promise<google.maps.PlacesLibrary> | null = null;
let geometryLibraryPromise: Promise<google.maps.GeometryLibrary> | null = null;

const loadMapsLibrary = (apiKey: string) => {
  if (!mapsLibraryPromise) {
    configuredApiKey = apiKey;
    setOptions({ key: apiKey, v: 'weekly' });
    mapsLibraryPromise = importLibrary('maps') as Promise<google.maps.MapsLibrary>;
  } else if (configuredApiKey !== apiKey) {
    return Promise.reject(new Error('The Google Maps API key changed after the map was loaded.'));
  }

  return mapsLibraryPromise;
};

const loadPlacesLibrary = () => {
  if (!placesLibraryPromise) {
    placesLibraryPromise = importLibrary('places') as Promise<google.maps.PlacesLibrary>;
  }

  return placesLibraryPromise;
};

const loadGeometryLibrary = () => {
  if (!geometryLibraryPromise) {
    geometryLibraryPromise = importLibrary('geometry') as Promise<google.maps.GeometryLibrary>;
  }

  return geometryLibraryPromise;
};

const createSelectedPlaceOverlay = (
  map: google.maps.Map,
  position: google.maps.LatLng,
) => {
  const overlay = new google.maps.OverlayView();
  let markerElement: HTMLSpanElement | null = null;

  overlay.onAdd = () => {
    markerElement = document.createElement('span');
    markerElement.className = 'google-address-picker__selected-marker';
    markerElement.style.webkitMaskImage = `url("${selectedAddressIcon}")`;
    markerElement.style.maskImage = `url("${selectedAddressIcon}")`;
    markerElement.setAttribute('aria-hidden', 'true');
    overlay.getPanes()?.overlayMouseTarget.appendChild(markerElement);
  };

  overlay.draw = () => {
    const point = overlay.getProjection().fromLatLngToDivPixel(position);
    if (!markerElement || !point) return;

    markerElement.style.left = `${point.x}px`;
    markerElement.style.top = `${point.y}px`;
  };

  overlay.onRemove = () => {
    markerElement?.remove();
    markerElement = null;
  };

  overlay.setMap(map);
  return overlay;
};

const GoogleAddressPickerMap: React.FC<GoogleAddressPickerMapProps> = ({
  apiKey,
  initialCenter,
  deliveryArea = null,
  universityPlaceId = null,
  disabled = false,
  onPlaceSelect,
  onSelectionClear,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const onPlaceSelectRef = useRef(onPlaceSelect);
  const onSelectionClearRef = useRef(onSelectionClear);
  const disabledRef = useRef(disabled);
  const [loadError, setLoadError] = useState('');
  const [selectionIsPending, setSelectionIsPending] = useState(false);
  const [selectionError, setSelectionError] = useState('');

  useEffect(() => {
    onPlaceSelectRef.current = onPlaceSelect;
  }, [onPlaceSelect]);

  useEffect(() => {
    onSelectionClearRef.current = onSelectionClear;
  }, [onSelectionClear]);

  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  useEffect(() => {
    if (!canvasRef.current || !apiKey) return undefined;

    let isMounted = true;
    let listeners: google.maps.MapsEventListener[] = [];
    let selectedPlaceOverlay: google.maps.OverlayView | null = null;
    let selectionRequestId = 0;
    const mapsWindow = window as GoogleMapsWindow;
    const previousAuthFailure = mapsWindow.gm_authFailure;
    const handleAuthFailure = () => {
      if (isMounted) {
        setLoadError(
          'Google Maps rejected this browser key. Check its website restrictions, enabled APIs, and billing.',
        );
      }
    };
    mapsWindow.gm_authFailure = handleAuthFailure;

    void loadMapsLibrary(apiKey)
      .then(async ({ Map, Polygon }) => {
        if (!isMounted || !canvasRef.current) return;

        const geometryLibrary = deliveryArea ? await loadGeometryLibrary() : null;
        if (!isMounted || !canvasRef.current) return;

        const map = new Map(canvasRef.current, {
          center: { lat: initialCenter.latitude, lng: initialCenter.longitude },
          zoom: 17,
          clickableIcons: true,
          fullscreenControl: false,
          mapTypeControl: false,
          streetViewControl: false,
          gestureHandling: 'greedy',
        });

        const deliveryAreaPolygons = deliveryArea?.coordinates
          .map((polygonCoordinates) => {
            const paths = polygonCoordinates
              .map((ring) => ring
                .filter(([longitude, latitude]) => (
                  Number.isFinite(latitude) && Number.isFinite(longitude)
                ))
                .map(([longitude, latitude]) => ({ lat: latitude, lng: longitude })))
              .filter((ring) => ring.length >= 3);

            return paths.length > 0 ? new Polygon({ paths }) : null;
          })
          .filter((polygon): polygon is google.maps.Polygon => polygon !== null) || [];

        const isInsideDeliveryArea = (position: google.maps.LatLng) => (
          deliveryAreaPolygons.length === 0
          || deliveryAreaPolygons.some((polygon) => (
            geometryLibrary?.poly.containsLocation(position, polygon)
            || geometryLibrary?.poly.isLocationOnEdge(position, polygon)
          ))
        );

        const rejectSelection = (message: string) => {
          selectionRequestId += 1;
          selectedPlaceOverlay?.setMap(null);
          selectedPlaceOverlay = null;
          setSelectionIsPending(false);
          setSelectionError(message);
          onSelectionClearRef.current?.();
        };

        listeners = [
          map.addListener('click', (event: google.maps.MapMouseEvent) => {
            const { placeId } = event as google.maps.IconMouseEvent;
            if (disabledRef.current || !event.latLng || !placeId) return;

            event.stop();
            const clickedPosition = event.latLng;
            if (!isInsideDeliveryArea(clickedPosition)) {
              rejectSelection('That place is outside this university\'s delivery area.');
              return;
            }

            if (
              normalizeGooglePlaceId(placeId)
              === normalizeGooglePlaceId(universityPlaceId)
              && normalizeGooglePlaceId(universityPlaceId)
            ) {
              rejectSelection('Select a specific campus building or delivery point.');
              return;
            }

            const requestId = ++selectionRequestId;
            selectedPlaceOverlay?.setMap(null);
            selectedPlaceOverlay = createSelectedPlaceOverlay(map, clickedPosition);
            map.panTo(clickedPosition);
            setSelectionError('');
            setSelectionIsPending(true);

            void loadPlacesLibrary()
              .then(async ({ Place }) => {
                const place = new Place({ id: placeId });
                await place.fetchFields({
                  fields: ['displayName', 'formattedAddress', 'location'],
                });

                if (!isMounted || requestId !== selectionRequestId) return;

                const resolvedPosition = place.location || clickedPosition;
                if (!isInsideDeliveryArea(resolvedPosition)) {
                  rejectSelection('That place is outside this university\'s delivery area.');
                  return;
                }

                selectedPlaceOverlay?.setMap(null);
                selectedPlaceOverlay = createSelectedPlaceOverlay(map, resolvedPosition);
                map.panTo(resolvedPosition);

                onPlaceSelectRef.current({
                  placeId,
                  name: place.displayName?.trim() || null,
                  formattedAddress: place.formattedAddress?.trim() || '',
                  latitude: resolvedPosition.lat(),
                  longitude: resolvedPosition.lng(),
                });
              })
              .catch((error: unknown) => {
                if (!isMounted || requestId !== selectionRequestId) return;
                console.error('Google Place Details request failed:', error);
                setSelectionError(
                  'Place details are unavailable. Check that Places API (New) is enabled for this browser key.',
                );
              })
              .finally(() => {
                if (isMounted && requestId === selectionRequestId) {
                  setSelectionIsPending(false);
                }
              });
          }),
        ];
      })
      .catch(() => {
        if (isMounted) setLoadError('Google Maps could not be loaded. Check the browser API key and try again.');
      });

    return () => {
      isMounted = false;
      selectionRequestId += 1;
      selectedPlaceOverlay?.setMap(null);
      listeners.forEach((listener) => listener.remove());
      listeners = [];
      if (mapsWindow.gm_authFailure === handleAuthFailure) {
        mapsWindow.gm_authFailure = previousAuthFailure;
      }
    };
  }, [
    apiKey,
    deliveryArea,
    initialCenter.latitude,
    initialCenter.longitude,
    universityPlaceId,
  ]);

  if (loadError) {
    return <p className="google-address-picker__error" role="alert">{loadError}</p>;
  }

  return (
    <div
      className={`google-address-picker${disabled ? ' google-address-picker--disabled' : ''}`}
      aria-label="Interactive map for choosing a marked delivery location"
    >
      <div ref={canvasRef} className="google-address-picker__canvas" />
      <p
        className={`google-address-picker__hint${selectionError ? ' google-address-picker__hint--error' : ''}`}
        role={selectionError ? 'alert' : undefined}
      >
        {selectionIsPending
          ? 'Loading selected place...'
          : selectionError || 'Tap a marked place to select it'}
      </p>
    </div>
  );
};

export default GoogleAddressPickerMap;
