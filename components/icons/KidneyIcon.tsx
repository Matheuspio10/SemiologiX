import React from 'react';

const KidneyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M9.17 14.59a4.42 4.42 0 0 1 0-5.18 4.42 4.42 0 0 1 5.66 0 4.42 4.42 0 0 1 0 5.18" />
    <path d="M14.83 9.41a4.42 4.42 0 0 1 0 5.18 4.42 4.42 0 0 1-5.66 0 4.42 4.42 0 0 1 0-5.18" />
    <path d="M12 12h.01" />
    <path d="M5.5 10.5C9 10.5 9 3 13.5 3S18.5 10.5 18.5 10.5" />
    <path d="M18.5 13.5C15 13.5 15 21 10.5 21S5.5 13.5 5.5 13.5" />
  </svg>
);

export default KidneyIcon;
