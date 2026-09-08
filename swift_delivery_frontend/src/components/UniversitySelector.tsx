import React, { useCallback, useEffect, useRef, useState } from 'react';
import locationMarker from '../assets/LocationMarker.svg';
import arrowDown from '../assets/keyboard_arrow_down.svg';
import AppIcon from './AppIcon';
import { MobileLoadingSpinner } from './LoadingState';
import {
  clearSelectedUniversity,
  detectUniversity,
  fetchUniversities,
  getApiErrorMessage,
  getStoredSelectedUniversity,
  hasStoredAuthToken,
  saveSelectedUniversity,
  saveStoredCustomer,
  updateCurrentCustomerUniversity,
  type Customer,
  type University,
  type UniversitySummary,
} from '../services/api';
import '../styles/UniversitySelector.scss';

interface UniversitySelectorProps {
  customer: Customer | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const requestCurrentPosition = () => new Promise<GeolocationPosition>((resolve, reject) => {
  if (!navigator.geolocation) {
    reject(new Error('Location detection is not supported by this browser.'));
    return;
  }

  navigator.geolocation.getCurrentPosition(
    resolve,
    (error) => {
      if (error.code === error.PERMISSION_DENIED) {
        reject(new Error('Location permission was denied. Choose a university from the list instead.'));
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        reject(new Error('Your current location is unavailable. Choose a university from the list instead.'));
      } else {
        reject(new Error('Location detection timed out. Please try again or choose from the list.'));
      }
    },
    {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 300000,
    },
  );
});

const UniversitySelector: React.FC<UniversitySelectorProps> = ({
  customer,
  isOpen,
  onOpenChange,
}) => {
  const [universities, setUniversities] = useState<University[]>([]);
  const [selectedUniversity, setSelectedUniversity] = useState<UniversitySummary | null>(
    () => customer?.preferred_university ?? getStoredSelectedUniversity(),
  );
  const [suggestedUniversity, setSuggestedUniversity] = useState<University | null>(null);
  const [suggestionDistance, setSuggestionDistance] = useState<number | null>(null);
  const [hasLoadedUniversities, setHasLoadedUniversities] = useState(false);
  const [isLoadingUniversities, setIsLoadingUniversities] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [savingUniversityId, setSavingUniversityId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const selectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (customer?.preferred_university) {
      setSelectedUniversity(customer.preferred_university);
      saveSelectedUniversity(customer.preferred_university);
    }
  }, [customer?.preferred_university]);

  const loadUniversities = useCallback(async () => {
    if (hasLoadedUniversities) return universities;

    setIsLoadingUniversities(true);
    setErrorMessage('');

    try {
      const availableUniversities = await fetchUniversities();
      setUniversities(availableUniversities);
      setHasLoadedUniversities(true);

      if (
        selectedUniversity
        && !availableUniversities.some((university) => university.id === selectedUniversity.id)
      ) {
        setSelectedUniversity(null);
        clearSelectedUniversity();
      }

      return availableUniversities;
    } catch (error: unknown) {
      setErrorMessage(getApiErrorMessage(error, 'Unable to load universities.'));
      return [];
    } finally {
      setIsLoadingUniversities(false);
    }
  }, [hasLoadedUniversities, selectedUniversity, universities]);

  useEffect(() => {
    if (isOpen) void loadUniversities();
  }, [isOpen, loadUniversities]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!selectorRef.current?.contains(event.target as Node)) {
        onOpenChange(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onOpenChange]);

  const handleDetectUniversity = async () => {
    setIsDetecting(true);
    setErrorMessage('');

    try {
      const availableUniversities = await loadUniversities();
      if (availableUniversities.length === 0) return;

      const position = await requestCurrentPosition();
      const detection = await detectUniversity(
        position.coords.latitude,
        position.coords.longitude,
      );
      const supportedSuggestion = availableUniversities.find(
        (university) => university.id === detection.university.id,
      );

      if (!supportedSuggestion) {
        throw new Error('The detected university is no longer available. Choose from the list instead.');
      }

      setSuggestedUniversity(supportedSuggestion);
      setSuggestionDistance(detection.distance_meters);
    } catch (error: unknown) {
      setSuggestedUniversity(null);
      setSuggestionDistance(null);
      setErrorMessage(getApiErrorMessage(error, 'Unable to detect your university.'));
    } finally {
      setIsDetecting(false);
    }
  };

  const handleSelectUniversity = async (university: University) => {
    setSavingUniversityId(university.id);
    setErrorMessage('');

    try {
      let confirmedUniversity: UniversitySummary = {
        id: university.id,
        name: university.name,
      };

      if (hasStoredAuthToken()) {
        const updatedCustomer = await updateCurrentCustomerUniversity(university.id);
        saveStoredCustomer(updatedCustomer);
        confirmedUniversity = updatedCustomer.preferred_university ?? confirmedUniversity;
      }

      saveSelectedUniversity(confirmedUniversity);
      setSelectedUniversity(confirmedUniversity);
      onOpenChange(false);
    } catch (error: unknown) {
      setErrorMessage(getApiErrorMessage(error, 'Unable to save your university.'));
    } finally {
      setSavingUniversityId(null);
    }
  };

  const otherUniversities = universities.filter(
    (university) => university.id !== suggestedUniversity?.id,
  );

  return (
    <div className="cafeteria-topbar__location-shell" ref={selectorRef}>
      {(isLoadingUniversities || isDetecting || savingUniversityId !== null) && (
        <MobileLoadingSpinner label="Updating your university" />
      )}

      <button
        type="button"
        className="cafeteria-topbar__location"
        aria-expanded={isOpen}
        aria-controls="university-selector-panel"
        onClick={() => onOpenChange(!isOpen)}
      >
        <img src={locationMarker} alt="" className="cafeteria-topbar__icon" aria-hidden="true" />
        <span>{selectedUniversity?.name ?? 'Select university'}</span>
        <img
          src={arrowDown}
          alt=""
          className={`cafeteria-topbar__icon university-selector__arrow${isOpen ? ' is-open' : ''}`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <section
          id="university-selector-panel"
          className="university-selector"
          aria-labelledby="university-selector-title"
        >
          <header className="university-selector__header">
            <h2 id="university-selector-title">Choose a university</h2>
            <p>Select where you want to order from.</p>
          </header>

          <button
            type="button"
            className="university-selector__detect-btn"
            onClick={handleDetectUniversity}
            disabled={isDetecting || isLoadingUniversities}
          >
            <AppIcon name="crosshair" />
            {isDetecting ? 'Detecting your location...' : 'Use my current location'}
          </button>

          {errorMessage && (
            <p className="university-selector__message university-selector__message--error" role="alert">
              {errorMessage}
            </p>
          )}

          {suggestedUniversity && (
            <div className="university-selector__suggestion">
              <span className="university-selector__section-label">Suggested for you</span>
              <button
                type="button"
                className="university-selector__option university-selector__option--suggested"
                onClick={() => handleSelectUniversity(suggestedUniversity)}
                disabled={savingUniversityId !== null}
              >
                <span>
                  <strong>{suggestedUniversity.name}</strong>
                  {suggestionDistance !== null && <small>{suggestionDistance.toLocaleString()} m away</small>}
                </span>
                {savingUniversityId === suggestedUniversity.id
                  ? <AppIcon name="repeat" />
                  : <AppIcon name="arrow-right" />}
              </button>
            </div>
          )}

          <div className="university-selector__choices">
            <span className="university-selector__section-label">
              {suggestedUniversity ? 'Other universities' : 'Available universities'}
            </span>

            {isLoadingUniversities ? (
              <p className="university-selector__message" role="status">Loading universities...</p>
            ) : otherUniversities.length > 0 ? (
              otherUniversities.map((university) => {
                const isSelected = selectedUniversity?.id === university.id;
                return (
                  <button
                    type="button"
                    key={university.id}
                    className={`university-selector__option${isSelected ? ' is-selected' : ''}`}
                    onClick={() => handleSelectUniversity(university)}
                    disabled={savingUniversityId !== null}
                    aria-pressed={isSelected}
                  >
                    <strong>{university.name}</strong>
                    {savingUniversityId === university.id
                      ? <AppIcon name="repeat" />
                      : isSelected
                        ? <AppIcon name="check" />
                        : <AppIcon name="chevron-right" />}
                  </button>
                );
              })
            ) : (
              <p className="university-selector__message">
                {suggestedUniversity
                  ? 'No other active universities are available.'
                  : 'No active universities are available.'}
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default UniversitySelector;
