import React from 'react';

interface HeaderCornerAccentProps {
  className?: string;
}

const HeaderCornerAccent: React.FC<HeaderCornerAccentProps> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 360 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
  >
    <path
      className="header-corner-accent__base"
      d="M0 0H360L334 79C330 92 316 100 302 97L0 41V0Z"
    />
    <path
      className="header-corner-accent__layer"
      d="M0 0H242L218 42C212 53 199 58 187 55L0 25V0Z"
    />
    <path
      className="header-corner-accent__route"
      d="M36 25C84 31 105 60 152 63C204 67 225 43 282 72"
      strokeWidth="2"
      strokeLinecap="round"
      strokeDasharray="2 8"
    />
    <circle className="header-corner-accent__start" cx="36" cy="25" r="5" />
    <circle className="header-corner-accent__stop" cx="153" cy="63" r="4" />
    <path
      className="header-corner-accent__arrow"
      d="M278 66L286 72L277 76"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default HeaderCornerAccent;
