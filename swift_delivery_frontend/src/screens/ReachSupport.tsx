import React, { useState } from 'react';
import { AccountPage } from '../components/AccountPage';
import '../styles/reachSupport.scss';

type SupportTopicId = 'orders' | 'payments' | 'account' | 'technical';

interface SupportTopic {
  id: SupportTopicId;
  title: string;
  description: string;
  icon: string;
  guidance: string[];
}

const supportTopics: SupportTopic[] = [
  {
    id: 'orders',
    title: 'Orders and delivery',
    description: 'Get help with an active, cancelled, or previous order.',
    icon: 'bi-bag-check',
    guidance: [
      'Keep the order number available so support can identify it quickly.',
      'Include the vendor name and the approximate time the order was placed.',
      'Describe what happened and what resolution you are expecting.',
    ],
  },
  {
    id: 'payments',
    title: 'Payments and refunds',
    description: 'Report a payment issue, duplicate charge, or missing refund.',
    icon: 'bi-credit-card',
    guidance: [
      'Do not include your full card number, PIN, or one-time password.',
      'Share the transaction date, amount, and payment reference when available.',
      'Mention the related order number if the payment was for an order.',
    ],
  },
  {
    id: 'account',
    title: 'Account and login',
    description: 'Get assistance with your profile, phone number, or sign-in.',
    icon: 'bi-person',
    guidance: [
      'Confirm the phone number connected to your Swift Delivery account.',
      'Describe the last step you completed before the problem appeared.',
      'Never share a verification code or password with support.',
    ],
  },
  {
    id: 'technical',
    title: 'App issue',
    description: 'Tell us about a screen, button, or feature that is not working.',
    icon: 'bi-phone',
    guidance: [
      'Include the page where the issue occurred and the action you attempted.',
      'Mention your device, browser, and whether the problem happens repeatedly.',
      'A screenshot is helpful, but remove any private information first.',
    ],
  },
];

const ReachSupport: React.FC = () => {
  const [selectedTopicId, setSelectedTopicId] = useState<SupportTopicId>('orders');
  const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL?.trim();
  const selectedTopic =
    supportTopics.find((topic) => topic.id === selectedTopicId) ?? supportTopics[0];
  const emailHref = supportEmail
    ? `mailto:${supportEmail}?subject=${encodeURIComponent(`Swift Delivery support: ${selectedTopic.title}`)}`
    : undefined;

  return (
    <AccountPage title="Reach Support">
      <div className="support-content">
        <section className="support-intro" aria-labelledby="support-intro-title">
          <span className="support-intro__icon" aria-hidden="true">
            <i className="bi bi-headset" />
          </span>
          <div>
            <h2 id="support-intro-title">How can we help?</h2>
            <p>Choose the topic that best describes what you need assistance with.</p>
          </div>
        </section>

        <section className="support-section" aria-labelledby="support-topics-title">
          <div className="support-section__heading">
            <h2 id="support-topics-title">Select a topic</h2>
            <p>We will show you what information to include in your request.</p>
          </div>

          <div className="support-topic-grid">
            {supportTopics.map((topic) => {
              const isSelected = selectedTopicId === topic.id;

              return (
                <button
                  key={topic.id}
                  type="button"
                  className={`support-topic${isSelected ? ' support-topic--selected' : ''}`}
                  onClick={() => setSelectedTopicId(topic.id)}
                  aria-pressed={isSelected}
                >
                  <span className="support-topic__icon" aria-hidden="true">
                    <i className={`bi ${topic.icon}`} />
                  </span>
                  <span>
                    <strong>{topic.title}</strong>
                    <small>{topic.description}</small>
                  </span>
                  <i className="bi bi-chevron-right support-topic__arrow" aria-hidden="true" />
                </button>
              );
            })}
          </div>

          <aside className="support-guidance" aria-live="polite">
            <div className="support-guidance__heading">
              <i className={`bi ${selectedTopic.icon}`} aria-hidden="true" />
              <h3>Before contacting us about {selectedTopic.title.toLowerCase()}</h3>
            </div>
            <ul>
              {selectedTopic.guidance.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </aside>
        </section>

        <section className="support-section support-faq" aria-labelledby="support-faq-title">
          <div className="support-section__heading">
            <h2 id="support-faq-title">Quick answers</h2>
            <p>These common actions may resolve the issue immediately.</p>
          </div>

          <div className="support-faq__list">
            <details>
              <summary>
                Where can I find my previous orders?
                <i className="bi bi-plus-lg" aria-hidden="true" />
              </summary>
              <p>Open the Profile menu in the header and select Order History.</p>
            </details>
            <details>
              <summary>
                How do I change my university?
                <i className="bi bi-plus-lg" aria-hidden="true" />
              </summary>
              <p>Use the university selector beside the Swift logo in the header.</p>
            </details>
            <details>
              <summary>
                How do I manage my favourite vendors?
                <i className="bi bi-plus-lg" aria-hidden="true" />
              </summary>
              <p>Select a vendor&apos;s heart button, or open View Favorites from the Profile menu.</p>
            </details>
          </div>
        </section>

        <section className="support-contact" aria-labelledby="support-contact-title">
          <div>
            <h2 id="support-contact-title">Still need help?</h2>
            <p>Send the support team a detailed message and include the information above.</p>
          </div>

          {emailHref ? (
            <a className="support-contact__action" href={emailHref}>
              <i className="bi bi-envelope" aria-hidden="true" />
              <span>Email support</span>
            </a>
          ) : (
            <div className="support-contact__configuration">
              <button type="button" className="support-contact__action" disabled>
                <i className="bi bi-envelope" aria-hidden="true" />
                <span>Email support</span>
              </button>
              <small>Set VITE_SUPPORT_EMAIL to enable this contact option.</small>
            </div>
          )}
        </section>
      </div>
    </AccountPage>
  );
};

export default ReachSupport;
