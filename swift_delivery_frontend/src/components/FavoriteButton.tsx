import React from 'react';
import { MobileLoadingSpinner } from './LoadingState';
import '../styles/FavoriteButton.scss';

interface FavoriteButtonProps {
  isFavorite: boolean;
  onClick: () => void;
  inactiveLabel: string;
  activeLabel: string;
  className?: string;
  disabled?: boolean;
  isPending?: boolean;
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  isFavorite,
  onClick,
  inactiveLabel,
  activeLabel,
  className = '',
  disabled = false,
  isPending = false,
}) => {
  const actionLabel = isFavorite ? activeLabel : inactiveLabel;

  return (
    <>
      {isPending && <MobileLoadingSpinner label={actionLabel} />}
      <button
        type="button"
        className={`favorite-button${isFavorite ? ' favorite-button--active' : ''}${className ? ` ${className}` : ''}`}
        onClick={onClick}
        aria-label={actionLabel}
        aria-pressed={isFavorite}
        aria-busy={isPending}
        disabled={disabled || isPending}
      >
        <svg viewBox="0 0 14 12" className="favorite-button__icon" aria-hidden="true">
          <path d="M1.83643 1.83643C1.57125 2.1016 1.36089 2.41641 1.21738 2.76288C1.07387 3.10936 1 3.4807 1 3.85572C1 4.23074 1.07387 4.60208 1.21738 4.94855C1.36089 5.29502 1.57125 5.60984 1.83643 5.87501L6.71141 10.75L11.5864 5.87501C12.1219 5.33946 12.4228 4.6131 12.4228 3.85572C12.4228 3.09834 12.1219 2.37198 11.5864 1.83643C11.0508 1.30088 10.3245 1.00001 9.56711 1.00001C8.80973 1.00001 8.08336 1.30088 7.54781 1.83643L6.71141 2.67283L5.87501 1.83643C5.60984 1.57125 5.29502 1.36089 4.94855 1.21738C4.60208 1.07387 4.23074 1 3.85572 1C3.4807 1 3.10935 1.07387 2.76288 1.21738C2.41641 1.36089 2.1016 1.57125 1.83643 1.83643Z" />
        </svg>
      </button>
    </>
  );
};

export default FavoriteButton;
