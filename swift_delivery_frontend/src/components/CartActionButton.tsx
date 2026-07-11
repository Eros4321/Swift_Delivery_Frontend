import React from 'react';
import '../styles/CartActionButton.scss';

type CartActionButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

const CartActionButton: React.FC<CartActionButtonProps> = ({
  className = '',
  children,
  ...buttonProps
}) => {
  const buttonClassName = ['cart-action-button', className].filter(Boolean).join(' ');

  return (
    <button type="button" className={buttonClassName} {...buttonProps}>
      {children}
    </button>
  );
};

export default CartActionButton;
