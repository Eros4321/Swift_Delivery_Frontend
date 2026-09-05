import React from 'react';
import '../styles/CheckboxOption.scss';

interface CheckboxOptionProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: React.ReactNode;
  containerClassName?: string;
}

const CheckboxOption: React.FC<CheckboxOptionProps> = ({
  label,
  containerClassName = '',
  ...inputProps
}) => {
  const className = ['checkbox-option', containerClassName].filter(Boolean).join(' ');

  return (
    <label className={className}>
      <input type="checkbox" {...inputProps} />
      <span>{label}</span>
    </label>
  );
};

export default CheckboxOption;
