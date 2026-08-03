import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  addFavoriteVendor,
  customerSessionUpdatedEvent,
  fetchFavoriteVendors,
  fetchVendors,
  getApiErrorMessage,
  getStoredCustomer,
  getStoredSelectedUniversity,
  hasStoredAuthToken,
  removeFavoriteVendor,
  universitySelectionUpdatedEvent,
  type UniversitySummary,
  type VendorListItem,
  type VendorType,
} from '../services/api.ts';
import '../styles/CafeteriaList.scss';
import Header from '../components/Header';
import CafeteriaCard from '../components/CafeteriaCard';

import filterIcon from '../assets/filter.svg';
import openNowIcon from '../assets/filter_clock.svg';
import ratingIcon from '../assets/filter_star.svg';

// Category icons
import iconBrowseAll from '../assets/noto_shopping-bags.svg';
import iconCafeterias from '../assets/fa6-solid_house.svg';
import iconGrillz from '../assets/streamline-ultimate-color_barbecue-grill.svg';
import iconPastries from '../assets/noto_cupcake.svg';
import iconDrinks from '../assets/noto-v1_wine-glass.svg';

interface CategoryCard {
  label: string;
  icon: string;
  key: 'browse-all' | 'cafeterias' | 'grillz' | 'pastries' | 'drinks';
  vendorType?: VendorType;
}

type CategoryKey = CategoryCard['key'];

const categoryCards: CategoryCard[] = [
  { label: 'Browse All', icon: iconBrowseAll, key: 'browse-all' },
  { label: 'Cafeterias', icon: iconCafeterias, key: 'cafeterias', vendorType: 'cafeteria' },
  { label: 'Grillz', icon: iconGrillz, key: 'grillz', vendorType: 'grills' },
  { label: 'Pastries', icon: iconPastries, key: 'pastries', vendorType: 'pastries' },
  { label: 'Drinks', icon: iconDrinks, key: 'drinks', vendorType: 'drinks' },
];

const getSelectedUniversity = () =>
  getStoredCustomer()?.preferred_university ?? getStoredSelectedUniversity();

const isVendorOpenNow = (closingTime: string | null) => {
  if (!closingTime) return false;

  const [hourText, minuteText] = closingTime.split(':');
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return false;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const closingMinutes = hour * 60 + minute;

  // Closing times shortly after midnight belong to the current service day.
  if (closingMinutes <= 4 * 60 && currentMinutes > 4 * 60) return true;

  return currentMinutes < closingMinutes;
};

const CafeteriaList: React.FC = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<VendorListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('browse-all');
  const [selectedUniversity, setSelectedUniversity] = useState<UniversitySummary | null>(
    getSelectedUniversity,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [favoriteVendorIds, setFavoriteVendorIds] = useState<Set<number>>(new Set());
  const [favoriteStatusIsLoading, setFavoriteStatusIsLoading] = useState(false);
  const [favoriteMutationVendorId, setFavoriteMutationVendorId] = useState<number | null>(null);
  const [favoriteErrorMessage, setFavoriteErrorMessage] = useState('');
  const [favoriteSessionVersion, setFavoriteSessionVersion] = useState(0);
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [sortByRating, setSortByRating] = useState(false);
  const [filterOptionsAreVisible, setFilterOptionsAreVisible] = useState(true);
  const activeFilterCount = Number(openNowOnly) + Number(sortByRating);
  const selectedCategoryCard = categoryCards.find((category) => category.key === selectedCategory);
  const selectedVendorType = selectedCategoryCard?.vendorType;
  const selectedUniversityId = selectedUniversity?.id;
  const vendorResultsLabel = selectedVendorType
    ? selectedCategoryCard?.label.toLowerCase() ?? 'vendors'
    : 'vendors';

  useEffect(() => {
    const syncSelectedUniversity = () => setSelectedUniversity(getSelectedUniversity());

    window.addEventListener(customerSessionUpdatedEvent, syncSelectedUniversity);
    window.addEventListener(universitySelectionUpdatedEvent, syncSelectedUniversity);
    window.addEventListener('storage', syncSelectedUniversity);
    return () => {
      window.removeEventListener(customerSessionUpdatedEvent, syncSelectedUniversity);
      window.removeEventListener(universitySelectionUpdatedEvent, syncSelectedUniversity);
      window.removeEventListener('storage', syncSelectedUniversity);
    };
  }, []);

  useEffect(() => {
    const syncFavoriteSession = () => {
      setFavoriteSessionVersion((version) => version + 1);
    };

    window.addEventListener(customerSessionUpdatedEvent, syncFavoriteSession);
    window.addEventListener('storage', syncFavoriteSession);
    return () => {
      window.removeEventListener(customerSessionUpdatedEvent, syncFavoriteSession);
      window.removeEventListener('storage', syncFavoriteSession);
    };
  }, []);

  useEffect(() => {
    if (!hasStoredAuthToken()) {
      setFavoriteVendorIds(new Set());
      setFavoriteStatusIsLoading(false);
      setFavoriteErrorMessage('');
      return;
    }

    const controller = new AbortController();
    setFavoriteStatusIsLoading(true);
    setFavoriteErrorMessage('');

    void fetchFavoriteVendors(controller.signal)
      .then((favorites) => {
        setFavoriteVendorIds(new Set(favorites.map((favorite) => favorite.vendor)));
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setFavoriteErrorMessage(
            getApiErrorMessage(error, 'Unable to load your favourite vendors.'),
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setFavoriteStatusIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [favoriteSessionVersion]);

  useEffect(() => {
    if (!selectedUniversityId) {
      setVendors([]);
      setErrorMessage('');
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();

    const getVendors = async () => {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const data = await fetchVendors(
          {
            universityId: selectedUniversityId,
            vendorType: selectedVendorType,
          },
          controller.signal,
        );
        setVendors(data);
      } catch (error: unknown) {
        if (controller.signal.aborted) return;
        setVendors([]);
        setErrorMessage(getApiErrorMessage(error, 'Unable to load vendors.'));
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    void getVendors();
    return () => controller.abort();
  }, [selectedUniversityId, selectedVendorType]);

  const handleCategoryClick = (key: CategoryKey) => {
    setSelectedCategory(key);
  };

  const handleFavoriteToggle = async (vendor: VendorListItem) => {
    if (favoriteMutationVendorId !== null || favoriteStatusIsLoading) return;

    if (!hasStoredAuthToken()) {
      navigate('/login');
      return;
    }

    const isCurrentlyFavorite = favoriteVendorIds.has(vendor.id);
    setFavoriteMutationVendorId(vendor.id);
    setFavoriteErrorMessage('');

    try {
      if (isCurrentlyFavorite) {
        await removeFavoriteVendor(vendor.id);
      } else {
        await addFavoriteVendor(vendor.id);
      }

      setFavoriteVendorIds((currentIds) => {
        const nextIds = new Set(currentIds);

        if (isCurrentlyFavorite) {
          nextIds.delete(vendor.id);
        } else {
          nextIds.add(vendor.id);
        }

        return nextIds;
      });
    } catch (error: unknown) {
      setFavoriteErrorMessage(
        getApiErrorMessage(
          error,
          isCurrentlyFavorite
            ? `Unable to remove ${vendor.name} from favourites.`
            : `Unable to add ${vendor.name} to favourites.`,
        ),
      );
    } finally {
      setFavoriteMutationVendorId(null);
    }
  };

  const filteredVendors = useMemo(() => {
    const lowerCaseQuery = searchQuery.trim().toLowerCase();
    const matchingVendors = vendors.filter((vendor) => (
      vendor.name.toLowerCase().includes(lowerCaseQuery)
      && (!openNowOnly || isVendorOpenNow(vendor.closing_time))
    ));

    if (!sortByRating) return matchingVendors;

    return [...matchingVendors].sort(
      (firstVendor, secondVendor) =>
        Number(secondVendor.average_rating ?? 0) - Number(firstVendor.average_rating ?? 0),
    );
  }, [openNowOnly, searchQuery, sortByRating, vendors]);

  return (
    <main className="cafeteria-screen">
      <div className="cafeteria-sticky">
        <Header
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
          accentTheme={selectedCategory}
        />
      </div>

      <section className="cafeteria-content">
        <div className="cafeteria-content__intro">
          <h1>Explore Categories</h1>
        </div>

        <div className="cafeteria-categories" aria-label="Explore categories">
          {categoryCards.map((category) => (
            <button
              type="button"
              key={category.label}
              className={`cafeteria-category cafeteria-category--${category.key}${selectedCategory === category.key ? ' is-active' : ''}`}
              onClick={() => handleCategoryClick(category.key)}
              aria-pressed={selectedCategory === category.key}
            >
              <img src={category.icon} alt="" aria-hidden="true" className="cafeteria-category__icon" />
              <span>{category.label}</span>
            </button>
          ))}
        </div>

        <div className="cafeteria-filters" role="group" aria-label="Vendor filters">
          <button
            type="button"
            className="cafeteria-filter cafeteria-filter--all"
            onClick={() => setFilterOptionsAreVisible((areVisible) => !areVisible)}
            aria-expanded={filterOptionsAreVisible}
            aria-controls="cafeteria-filter-options"
            aria-label={`All Filters${activeFilterCount > 0 ? `, ${activeFilterCount} active` : ''}`}
          >
            <img
              src={filterIcon}
              alt=""
              className="cafeteria-filter__icon cafeteria-filter__icon--all"
              aria-hidden="true"
            />
            <span>All Filters</span>
            {!filterOptionsAreVisible && activeFilterCount > 0 && (
              <span className="cafeteria-filter__badge" aria-hidden="true">
                {activeFilterCount}
              </span>
            )}
          </button>

          <div
            id="cafeteria-filter-options"
            className={`cafeteria-filter-options${filterOptionsAreVisible ? ' is-visible' : ' is-hidden'}`}
            aria-hidden={!filterOptionsAreVisible}
          >
            <button
              type="button"
              className={`cafeteria-filter cafeteria-filter--option${openNowOnly ? ' is-active' : ''}`}
              onClick={() => setOpenNowOnly((isSelected) => !isSelected)}
              aria-pressed={openNowOnly}
              tabIndex={filterOptionsAreVisible ? 0 : -1}
            >
              <img src={openNowIcon} alt="" className="cafeteria-filter__icon" aria-hidden="true" />
              <span>Open now</span>
            </button>

            <button
              type="button"
              className={`cafeteria-filter cafeteria-filter--option${sortByRating ? ' is-active' : ''}`}
              onClick={() => setSortByRating((isSelected) => !isSelected)}
              aria-pressed={sortByRating}
              tabIndex={filterOptionsAreVisible ? 0 : -1}
            >
              <img src={ratingIcon} alt="" className="cafeteria-filter__icon" aria-hidden="true" />
              <span>Ratings</span>
            </button>
          </div>
        </div>

        {favoriteErrorMessage && (
          <p className="cafeteria-favorite-error" role="alert">
            {favoriteErrorMessage}
          </p>
        )}

        {!selectedUniversity ? (
          <div className="cafeteria-empty-state">
            <h2>Select a university to see available vendors.</h2>
            <p>Use the location selector in the header to choose from supported universities.</p>
          </div>
        ) : isLoading ? (
          <div className="cafeteria-empty-state" role="status">
            <h2>Loading vendors...</h2>
            <p>Finding {vendorResultsLabel} at {selectedUniversity.name}.</p>
          </div>
        ) : errorMessage ? (
          <div className="cafeteria-empty-state" role="alert">
            <h2>Unable to load vendors.</h2>
            <p>{errorMessage}</p>
          </div>
        ) : filteredVendors.length > 0 ? (
          <ul className="cafeteria-grid">
            {filteredVendors.map((vendor) => (
              <li key={vendor.id} className="cafeteria-grid__item">
                <CafeteriaCard
                  vendor={vendor}
                  isFavorite={favoriteVendorIds.has(vendor.id)}
                  onFavoriteToggle={() => void handleFavoriteToggle(vendor)}
                  favoriteIsPending={favoriteMutationVendorId === vendor.id}
                  favoriteIsDisabled={favoriteStatusIsLoading}
                />
              </li>
            ))}
          </ul>
        ) : (
          <div className="cafeteria-empty-state">
            <h2>
              {searchQuery.trim()
                ? 'No vendors match your search.'
                : openNowOnly
                  ? 'No vendors are open right now.'
                : `No ${vendorResultsLabel} are available.`}
            </h2>
            <p>
              {searchQuery.trim()
                ? 'Try a different name or clear the search.'
                : openNowOnly
                  ? 'Clear the Open now filter to see all available vendors.'
                : `There are currently no matching vendors at ${selectedUniversity.name}.`}
            </p>
          </div>
        )}
      </section>
    </main>
  );
};

export default CafeteriaList;
