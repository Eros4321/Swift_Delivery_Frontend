import React from 'react';
import '../styles/ModalHeaderButton.scss';

type ModalHeaderButtonVariant = 'back' | 'close';

interface ModalHeaderButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant: ModalHeaderButtonVariant;
  iconSrc: string;
}

const ModalHeaderButton: React.FC<ModalHeaderButtonProps> = ({
  variant,
  iconSrc,
  className = '',
  type = 'button',
  ...buttonProps
}) => {
  const buttonClassName = [
    'modal-header-button',
    `modal-header-button--${variant}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <button type={type} className={buttonClassName} {...buttonProps}>
      <span
        className="modal-header-button__icon"
        style={{
          WebkitMaskImage: `url("${iconSrc}")`,
          maskImage: `url("${iconSrc}")`,
        }}
        aria-hidden="true"
      />
    </button>
  );
};

export default ModalHeaderButton;
