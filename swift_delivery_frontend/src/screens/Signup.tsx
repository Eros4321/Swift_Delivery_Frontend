import React, { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import PhoneNumberField from '../components/PhoneNumberField';
import PrimaryActionButton from '../components/PrimaryActionButton';
import { MobileLoadingSpinner } from '../components/LoadingState';
import {
  getApiErrorMessage,
  saveCustomerSession,
  signupCustomer,
} from '../services/api';
import {
  isValidNigerianPhoneNumber,
  normalizeNigerianPhoneNumber,
} from '../utils/phoneNumber';
import '../styles/signup.scss';

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState('');
  const [phoneHasError, setPhoneHasError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearError = () => {
    if (formError) setFormError('');
    if (phoneHasError) setPhoneHasError(false);
  };

  const handlePhoneChange = (value: string) => {
    setPhoneNumber(value);
    clearError();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isValidNigerianPhoneNumber(phoneNumber)) {
      setPhoneHasError(true);
      setFormError('Enter a valid Nigerian phone number.');
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      setFormError('Enter your first and last name.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFormError('Enter a valid email address.');
      return;
    }

    setFormError('');
    setPhoneHasError(false);
    setIsSubmitting(true);

    try {
      const session = await signupCustomer({
        phone_number: normalizeNigerianPhoneNumber(phoneNumber),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim().toLowerCase(),
      });
      saveCustomerSession(session);
      navigate('/', { replace: true });
    } catch (error: unknown) {
      setFormError(getApiErrorMessage(error, 'Unable to create your account right now. Please try again.'));
      setIsSubmitting(false);
    }
  };

  const formIsComplete = Boolean(
    phoneNumber && firstName.trim() && lastName.trim() && email.trim(),
  );

  return (
    <main className="signup-screen">
      {isSubmitting && <MobileLoadingSpinner label="Creating your account" />}

      <div className="signup-screen__header">
        <Header />
      </div>

      <section className="signup-content" aria-labelledby="signup-title">
        <header className="signup-content__intro">
          <h1 id="signup-title">Welcome to Swift Delivery!</h1>
          <p>Enter your details to start ordering from your favorite vendors</p>
        </header>

        <form className="signup-form" onSubmit={handleSubmit} noValidate>
          <PhoneNumberField
            className="signup-form__phone"
            value={phoneNumber}
            onChange={handlePhoneChange}
            hasError={phoneHasError}
            describedBy={formError ? 'signup-form-error' : undefined}
            inputId="signup-phone-number"
          />

          <div className="signup-form__name-row">
            <label className="signup-field">
              <span className="signup-field__label">First name</span>
              <input
                type="text"
                name="first-name"
                value={firstName}
                onChange={(event) => {
                  setFirstName(event.target.value);
                  clearError();
                }}
                autoComplete="given-name"
                placeholder="e.g. John"
                required
              />
            </label>

            <label className="signup-field">
              <span className="signup-field__label">Last name</span>
              <input
                type="text"
                name="last-name"
                value={lastName}
                onChange={(event) => {
                  setLastName(event.target.value);
                  clearError();
                }}
                autoComplete="family-name"
                placeholder="e.g. Doe"
                required
              />
            </label>
          </div>

          <label className="signup-field signup-field--email">
            <span className="signup-field__label">Email address</span>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                clearError();
              }}
              autoComplete="email"
              placeholder="sample@gmail.com"
              required
            />
          </label>

          {formError && (
            <p id="signup-form-error" className="signup-form__error" role="alert">
              {formError}
            </p>
          )}

          <PrimaryActionButton
            type="submit"
            className="signup-form__submit"
            disabled={!formIsComplete || isSubmitting}
          >
            {isSubmitting ? 'Creating account...' : 'Continue'}
          </PrimaryActionButton>

          <p className="signup-form__login">
            <span>Have an account?</span>
            <Link to="/login">Login</Link>
          </p>
        </form>
      </section>
    </main>
  );
};

export default Signup;
