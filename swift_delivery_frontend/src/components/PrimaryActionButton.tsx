import React from 'react';
import '../styles/PrimaryActionButton.scss';

type PrimaryActionButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

const PrimaryActionButton: React.FC<PrimaryActionButtonProps> = ({
  className = '',
  children,
  type = 'button',
  ...buttonProps
}) => {
  const buttonClassName = ['primary-action-button', className].filter(Boolean).join(' ');

  return (
    <button type={type} className={buttonClassName} {...buttonProps}>
      {children}
    </button>
  );
};

export default PrimaryActionButton;
