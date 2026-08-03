import React from 'react';
import { sanitizeNigerianPhoneNumberInput } from '../utils/phoneNumber';
import '../styles/PhoneNumberField.scss';

interface PhoneNumberFieldProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  hasError?: boolean;
  describedBy?: string;
  inputId?: string;
}

const PhoneNumberField: React.FC<PhoneNumberFieldProps> = ({
  value,
  onChange,
  className = '',
  hasError = false,
  describedBy,
  inputId = 'phone-number',
}) => {
  const fieldClassName = ['phone-number-field', className].filter(Boolean).join(' ');

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(sanitizeNigerianPhoneNumberInput(event.target.value));
  };

  return (
    <div className={fieldClassName}>
      <div className="phone-number-field__section">
        <span className="phone-number-field__label">Country</span>
        <div className="phone-number-field__country" aria-label="Country code Nigeria">NG</div>
      </div>

      <div className="phone-number-field__section">
        <label className="phone-number-field__label" htmlFor={inputId}>Phone number</label>
        <span className={`phone-number-field__input-shell${hasError ? ' has-error' : ''}`}>
          <span className="phone-number-field__prefix">+234</span>
          <input
            id={inputId}
            className="phone-number-field__input"
            type="tel"
            name="phone-number"
            value={value}
            onChange={handleChange}
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="08000000000"
            aria-invalid={hasError}
            aria-describedby={describedBy}
          />
        </span>
      </div>
    </div>
  );
};

export default PhoneNumberField;
