
import React from 'react';

const LungsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M10 16c-2 2-6 2-8 0a4.5 4.5 0 0 1 0-6 4.5 4.5 0 0 1 6-6"/>
    <path d="M14 16c2 2 6 2 8 0a4.5 4.5 0 0 0 0-6 4.5 4.5 0 0 0-6-6"/>
    <path d="M12 2v20"/>
    <path d="M4 10h4"/>
    <path d="M16 10h4"/>
    <path d="M8 16h1.93"/>
    <path d="M14.07 16H16"/>
    <path d="m6 10 2 2"/>
    <path d="m18 10-2 2"/>
  </svg>
);

export default LungsIcon;
