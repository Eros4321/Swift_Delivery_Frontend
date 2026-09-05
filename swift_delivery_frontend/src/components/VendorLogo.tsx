import React, { useState } from 'react';
import { resolveApiMediaUrl } from '../services/api';
import '../styles/VendorLogo.scss';

export type VendorLogoVariant = 'menu' | 'cart' | 'checkout' | 'history';

interface VendorLogoProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
  name: string;
  source?: string | null;
  variant: VendorLogoVariant;
  imageAlt?: string;
}

const VendorLogo: React.FC<VendorLogoProps> = ({
  name,
  source,
  variant,
  imageAlt = '',
  className = '',
  ...spanProps
}) => {
  const resolvedSource = resolveApiMediaUrl(source);
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const imageIsAvailable = Boolean(resolvedSource && resolvedSource !== failedSource);
  const initial = name.trim().charAt(0).toUpperCase() || 'V';
  const logoClassName = [
    'vendor-logo',
    `vendor-logo--${variant}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <span
      className={logoClassName}
      aria-hidden={imageAlt ? undefined : true}
      {...spanProps}
    >
      {imageIsAvailable && resolvedSource ? (
        <img
          src={resolvedSource}
          alt={imageAlt}
          onError={() => setFailedSource(resolvedSource)}
        />
      ) : (
        <span aria-hidden="true">{initial}</span>
      )}
    </span>
  );
};

export default VendorLogo;
