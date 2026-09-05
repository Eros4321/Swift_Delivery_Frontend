import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CafeteriaCard from '../components/CafeteriaCard';
import LoadingSkeleton from '../components/LoadingState';
import {
  AccountEmptyState,
  AccountPage,
  AccountPageFeedback,
} from '../components/AccountPage';
import favoritesEmptyStateIllustration from '../assets/favorites-empty-state_illustration.svg';
import {
  fetchFavoriteVendors,
  getApiErrorMessage,
  hasStoredAuthToken,
  removeFavoriteVendor,
  type FavoriteVendor,
} from '../services/api';
import '../styles/favorites.scss';

const Favorites: React.FC = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<FavoriteVendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [removingVendorId, setRemovingVendorId] = useState<number | null>(null);

  const loadFavorites = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const savedVendors = await fetchFavoriteVendors(signal);
      setFavorites(savedVendors);
    } catch (error: unknown) {
      if (!signal?.aborted) {
        setErrorMessage(getApiErrorMessage(error, 'Unable to load your favourites.'));
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
    void loadFavorites(controller.signal);
    return () => controller.abort();
  }, [loadFavorites, navigate]);

  const handleRemoveFavorite = async (vendorId: number) => {
    if (removingVendorId !== null) return;

    setRemovingVendorId(vendorId);
    setErrorMessage('');

    try {
      await removeFavoriteVendor(vendorId);
      setFavorites((currentFavorites) =>
        currentFavorites.filter((favorite) => favorite.vendor !== vendorId),
      );
    } catch (error: unknown) {
      setErrorMessage(getApiErrorMessage(error, 'Unable to remove this vendor from favourites.'));
    } finally {
      setRemovingVendorId(null);
    }
  };

  return (
    <AccountPage title="Favourites">
      {isLoading ? (
        <div className="favorites-results">
          <LoadingSkeleton variant="vendor-grid" label="Loading your favourites" />
        </div>
      ) : favorites.length > 0 ? (
        <div className="favorites-results">
          {errorMessage && <p className="favorites-results__error" role="alert">{errorMessage}</p>}

          <ul className="cafeteria-grid">
            {favorites.map((favorite) => {
              const vendor = favorite.vendor_detail;

              return (
                <li key={favorite.vendor} className="cafeteria-grid__item">
                  <CafeteriaCard
                    vendor={vendor}
                    isFavorite
                    onFavoriteToggle={() => handleRemoveFavorite(vendor.id)}
                    favoriteIsPending={removingVendorId === vendor.id}
                  />
                </li>
              );
            })}
          </ul>
        </div>
      ) : errorMessage ? (
        <AccountPageFeedback
          title="Unable to load favourites"
          message={errorMessage}
          onRetry={() => void loadFavorites()}
        />
      ) : (
        <AccountEmptyState
          illustration={favoritesEmptyStateIllustration}
          title="No favourites selected yet"
          actionLabel="Explore vendors"
          actionTo="/"
        />
      )}
    </AccountPage>
  );
};

export default Favorites;
