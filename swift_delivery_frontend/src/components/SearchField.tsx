import React from 'react';
import '../styles/SearchField.scss';
import searchIcon from '../assets/Search.svg';

interface SearchFieldProps {
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  placeholder?: string;
  ariaLabel: string;
  className?: string;
  disabled?: boolean;
  name?: string;
  autoComplete?: string;
}

const SearchField: React.FC<SearchFieldProps> = ({
  value,
  onChange,
  placeholder,
  ariaLabel,
  className,
  disabled = false,
  name,
  autoComplete,
}) => {
  const wrapperClassName = className ? `search-field ${className}` : 'search-field';

  return (
    <label className={wrapperClassName}>
      <img src={searchIcon} alt="" className="search-field__icon" aria-hidden="true" />
      <input
        className="search-field__input"
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-label={ariaLabel}
        disabled={disabled}
        name={name}
        autoComplete={autoComplete}
      />
    </label>
  );
};

export default SearchField;
