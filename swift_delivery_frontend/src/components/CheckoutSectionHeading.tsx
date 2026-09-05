import type { ReactNode } from 'react';
import '../styles/CheckoutSectionHeading.scss';

interface CheckoutSectionHeadingProps {
  title: ReactNode;
  titleId?: string;
  trailing?: ReactNode;
}

const CheckoutSectionHeading = ({
  title,
  titleId,
  trailing,
}: CheckoutSectionHeadingProps) => (
  <header className="checkout-section-heading">
    <h2 id={titleId}>{title}</h2>
    {trailing !== undefined && (
      <div className="checkout-section-heading__trailing">{trailing}</div>
    )}
  </header>
);

export default CheckoutSectionHeading;
