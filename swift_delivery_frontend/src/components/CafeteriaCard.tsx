import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { VendorListItem } from '../services/api';
import { resolveApiMediaUrl } from '../services/api';
import FavoriteButton from './FavoriteButton';
import starIcon from '../assets/Star.svg';
import clockIcon from '../assets/ClockOutline.svg';
import '../styles/CafeteriaList.scss';

interface CafeteriaCardProps {
  vendor: VendorListItem;
  isFavorite: boolean;
  onFavoriteToggle: () => void;
  favoriteIsPending?: boolean;
  favoriteIsDisabled?: boolean;
}

const CafeteriaCard: React.FC<CafeteriaCardProps> = ({
  vendor,
  isFavorite,
  onFavoriteToggle,
  favoriteIsPending = false,
  favoriteIsDisabled = false,
}) => {
  const imageUrl = resolveApiMediaUrl(vendor.image);
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const imageIsAvailable = imageUrl && failedImageUrl !== imageUrl;

  return (
    <div className="cafeteria-card-shell">
      <Link to={`/cafeteria/${vendor.id}`} className="cafeteria-card">
        <div className="cafeteria-card__image-shell">
          {imageIsAvailable ? (
            <img
              src={imageUrl}
              alt={vendor.name}
              className="cafeteria-card__image"
              onError={() => setFailedImageUrl(imageUrl)}
            />
          ) : (
            <div className="cafeteria-card__image-placeholder">
              <i className="bi bi-shop-window" aria-hidden="true" />
            </div>
          )}
        </div>

        <div className="cafeteria-card__body">
          <div className="cafeteria-card__heading">
            <h2>{vendor.name}</h2>

            <div className="cafeteria-card__rating">
              <span>{Number(vendor.average_rating || 0).toFixed(1)}</span>
              <img src={starIcon} alt="" className="cafeteria-card__icon" aria-hidden="true" />
            </div>
          </div>

          <div className="cafeteria-card__meta">
            <img src={clockIcon} alt="" className="cafeteria-card__icon" aria-hidden="true" />
            <span>30-45 mins</span>
          </div>
        </div>
      </Link>

      <FavoriteButton
        className="cafeteria-card__favorite-btn"
        isFavorite={isFavorite}
        onClick={onFavoriteToggle}
        inactiveLabel={`Add ${vendor.name} to favourites`}
        activeLabel={`Remove ${vendor.name} from favourites`}
        isPending={favoriteIsPending}
        disabled={favoriteIsDisabled}
      />
    </div>
  );
};

export default CafeteriaCard;
