import React, { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import PhoneNumberField from '../components/PhoneNumberField';
import PrimaryActionButton from '../components/PrimaryActionButton';
import { MobileLoadingSpinner } from '../components/LoadingState';
import loginDeliveryIllustration from '../assets/login-delivery-illustration-subtle.png';
import {
  getApiErrorMessage,
  loginCustomer,
  saveCustomerSession,
} from '../services/api';
import {
  isValidNigerianPhoneNumber,
  normalizeNigerianPhoneNumber,
} from '../utils/phoneNumber';
import '../styles/login.scss';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePhoneChange = (value: string) => {
    setPhoneNumber(value);
    if (phoneError) setPhoneError('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isValidNigerianPhoneNumber(phoneNumber)) {
      setPhoneError('Enter a valid Nigerian phone number.');
      return;
    }

    setPhoneError('');
    setIsSubmitting(true);

    const normalizedPhoneNumber = normalizeNigerianPhoneNumber(phoneNumber);

    try {
      const session = await loginCustomer(normalizedPhoneNumber);
      saveCustomerSession(session);
      navigate('/', { replace: true });
    } catch (error: unknown) {
      setPhoneError(getApiErrorMessage(error, 'Unable to log in right now. Please try again.'));
      setIsSubmitting(false);
    }
  };

  return (
    <main className="login-screen">
      {isSubmitting && <MobileLoadingSpinner label="Logging in" />}

      <div className="login-screen__header">
        <Header />
      </div>

      <section className="login-content" aria-labelledby="login-title">
        <header className="login-content__intro">
          <h1 id="login-title">Welcome back!</h1>
          <p>Enter your phone number to log in to your customer account</p>
        </header>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <PhoneNumberField
            className="login-phone-field"
            value={phoneNumber}
            onChange={handlePhoneChange}
            hasError={Boolean(phoneError)}
            describedBy={phoneError ? 'login-phone-error' : undefined}
            inputId="login-phone-number"
          />

          {phoneError && (
            <p id="login-phone-error" className="login-form__error" role="alert">
              {phoneError}
            </p>
          )}

          <PrimaryActionButton
            type="submit"
            className="login-form__submit"
            disabled={phoneNumber.length === 0 || isSubmitting}
          >
            {isSubmitting ? 'Logging in...' : 'Continue'}
          </PrimaryActionButton>

          <p className="login-form__register">
            <span>Don&apos;t have an account?</span>
            <Link to="/signup">Create customer account</Link>
          </p>
        </form>
      </section>

      <img
        src={loginDeliveryIllustration}
        alt=""
        className="login-screen__illustration"
        aria-hidden="true"
      />
    </main>
  );
};

export default Login;
