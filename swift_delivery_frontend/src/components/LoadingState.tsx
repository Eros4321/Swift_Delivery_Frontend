import React from 'react';
import '../styles/LoadingState.scss';

export type LoadingSkeletonVariant =
  | 'vendor-grid'
  | 'menu-grid'
  | 'order-list'
  | 'checkout-items';

interface LoadingSkeletonProps {
  label: string;
  variant: LoadingSkeletonVariant;
  count?: number;
  className?: string;
  showMobileSpinner?: boolean;
}

interface LoadingLabelProps {
  label: string;
}

const getDefaultCount = (variant: LoadingSkeletonVariant) => {
  switch (variant) {
    case 'vendor-grid':
      return 6;
    case 'menu-grid':
      return 4;
    case 'order-list':
    case 'checkout-items':
      return 3;
    default:
      return 3;
  }
};

const SkeletonBlock: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span
    className={`loading-skeleton__block${className ? ` ${className}` : ''}`}
    aria-hidden="true"
  />
);

export const MobileLoadingSpinner: React.FC<LoadingLabelProps> = ({ label }) => (
  <div className="mobile-loading-spinner" role="status" aria-label={label}>
    <span className="mobile-loading-spinner__ring" aria-hidden="true" />
  </div>
);

export const AppPreloader: React.FC<LoadingLabelProps> = ({ label }) => (
  <div className="app-preloader" role="status" aria-live="polite">
    <div className="app-preloader__content">
      <span className="app-preloader__spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  </div>
);

const VendorGridSkeleton: React.FC<{ count: number }> = ({ count }) => (
  <div className="loading-skeleton__vendor-grid" aria-hidden="true">
    {Array.from({ length: count }, (_, index) => (
      <div className="loading-skeleton__vendor-card" key={index}>
        <SkeletonBlock className="loading-skeleton__vendor-image" />
        <div className="loading-skeleton__vendor-body">
          <div className="loading-skeleton__row">
            <SkeletonBlock className="loading-skeleton__line loading-skeleton__line--title" />
            <SkeletonBlock className="loading-skeleton__line loading-skeleton__line--rating" />
          </div>
          <SkeletonBlock className="loading-skeleton__line loading-skeleton__line--meta" />
        </div>
      </div>
    ))}
  </div>
);

const MenuGridSkeleton: React.FC<{ count: number }> = ({ count }) => (
  <div className="loading-skeleton__menu" aria-hidden="true">
    <SkeletonBlock className="loading-skeleton__menu-search" />
    <div className="loading-skeleton__menu-tabs">
      {Array.from({ length: 3 }, (_, index) => (
        <SkeletonBlock className="loading-skeleton__menu-tab" key={index} />
      ))}
    </div>
    <SkeletonBlock className="loading-skeleton__line loading-skeleton__line--section" />
    <div className="loading-skeleton__menu-grid">
      {Array.from({ length: count }, (_, index) => (
        <div className="loading-skeleton__menu-card" key={index}>
          <div className="loading-skeleton__menu-copy">
            <SkeletonBlock className="loading-skeleton__line loading-skeleton__line--menu-title" />
            <SkeletonBlock className="loading-skeleton__line loading-skeleton__line--price" />
          </div>
          <SkeletonBlock className="loading-skeleton__menu-image" />
        </div>
      ))}
    </div>
  </div>
);

const OrderListSkeleton: React.FC<{ count: number }> = ({ count }) => (
  <div className="loading-skeleton__order-list" aria-hidden="true">
    {Array.from({ length: count }, (_, index) => (
      <div className="loading-skeleton__order-card" key={index}>
        <div className="loading-skeleton__row">
          <div className="loading-skeleton__order-heading">
            <SkeletonBlock className="loading-skeleton__line loading-skeleton__line--order-title" />
            <SkeletonBlock className="loading-skeleton__line loading-skeleton__line--date" />
          </div>
          <SkeletonBlock className="loading-skeleton__line loading-skeleton__line--amount" />
        </div>
        <SkeletonBlock className="loading-skeleton__line loading-skeleton__line--wide" />
        <SkeletonBlock className="loading-skeleton__line loading-skeleton__line--count" />
      </div>
    ))}
  </div>
);

const CheckoutItemsSkeleton: React.FC<{ count: number }> = ({ count }) => (
  <div className="loading-skeleton__checkout-list" aria-hidden="true">
    {Array.from({ length: count }, (_, index) => (
      <div className="loading-skeleton__checkout-item" key={index}>
        <SkeletonBlock className="loading-skeleton__checkout-image" />
        <div className="loading-skeleton__checkout-copy">
          <SkeletonBlock className="loading-skeleton__line loading-skeleton__line--checkout-title" />
          <SkeletonBlock className="loading-skeleton__line loading-skeleton__line--price" />
        </div>
        <SkeletonBlock className="loading-skeleton__checkout-quantity" />
      </div>
    ))}
  </div>
);

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  label,
  variant,
  count = getDefaultCount(variant),
  className = '',
  showMobileSpinner = true,
}) => {
  const skeletonClassName = [
    'loading-skeleton',
    `loading-skeleton--${variant}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <>
      {showMobileSpinner && <MobileLoadingSpinner label={label} />}
      <div
        className={skeletonClassName}
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <span className="loading-skeleton__label">{label}</span>
        {variant === 'vendor-grid' && <VendorGridSkeleton count={count} />}
        {variant === 'menu-grid' && <MenuGridSkeleton count={count} />}
        {variant === 'order-list' && <OrderListSkeleton count={count} />}
        {variant === 'checkout-items' && <CheckoutItemsSkeleton count={count} />}
      </div>
    </>
  );
};

export default LoadingSkeleton;
