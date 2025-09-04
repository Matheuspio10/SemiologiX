import React from 'react';

const OxygenIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
    <path d="m15 15 5 5" />
  </svg>
);

export default OxygenIcon;
