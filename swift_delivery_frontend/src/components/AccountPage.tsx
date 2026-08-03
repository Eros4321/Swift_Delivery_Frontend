import React, { useId, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from './Header';
import arrowRightIcon from '../assets/ArrowRight.svg';
import '../styles/AccountPage.scss';

interface AccountPageProps {
  title: string;
  children: ReactNode;
}

interface AccountPageFeedbackProps {
  message: string;
  title?: string;
  isLoading?: boolean;
  onRetry?: () => void;
}

interface AccountEmptyStateProps {
  illustration: string;
  title: string;
  actionLabel: string;
  actionTo: string;
  description?: string;
}

export const AccountPage: React.FC<AccountPageProps> = ({ title, children }) => {
  const navigate = useNavigate();
  const titleId = useId();

  return (
    <main className="account-page">
      <Header />

      <section className="account-page__content" aria-labelledby={titleId}>
        <header className="account-page__header">
          <button
            type="button"
            className="account-page__back"
            onClick={() => navigate(-1)}
          >
            <img src={arrowRightIcon} alt="" aria-hidden="true" />
            <span>Back</span>
          </button>

          <div className="account-page__title-row">
            <h1 id={titleId}>{title}</h1>
          </div>
        </header>

        {children}
      </section>
    </main>
  );
};

export const AccountPageFeedback: React.FC<AccountPageFeedbackProps> = ({
  message,
  title,
  isLoading = false,
  onRetry,
}) => (
  <div className="account-page-feedback" role={isLoading ? 'status' : 'alert'}>
    {isLoading && <span className="account-page-feedback__spinner" aria-hidden="true" />}
    {title && <h2>{title}</h2>}
    <p>{message}</p>
    {onRetry && (
      <button type="button" onClick={onRetry}>
        Try again
      </button>
    )}
  </div>
);

export const AccountEmptyState: React.FC<AccountEmptyStateProps> = ({
  illustration,
  title,
  description,
  actionLabel,
  actionTo,
}) => (
  <div className="account-empty-state">
    <img
      src={illustration}
      alt=""
      className="account-empty-state__illustration"
      aria-hidden="true"
    />

    <h2>{title}</h2>
    {description && <p>{description}</p>}

    <Link to={actionTo} className="account-empty-state__action">
      <img src={arrowRightIcon} alt="" aria-hidden="true" />
      <span>{actionLabel}</span>
    </Link>
  </div>
);
