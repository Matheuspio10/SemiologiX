import React from 'react';

const BrainIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 0 0 8 21a3 3 0 0 0 5.196-2.023c.2-.5.304-1.023.304-1.55a4 4 0 0 0-2.5-3.815a4 4 0 0 0-1.896-7.06C9.99 5.38 10.991 5 12 5Z" />
    <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 0 1 16 21a3 3 0 0 1-5.196-2.023c-.2-.5-.304-1.023-.304-1.55a4 4 0 0 1 2.5-3.815a4 4 0 0 1 1.896-7.06C14.01 5.38 13.009 5 12 5Z" />
    <path d="M12 21v-3" />
    <path d="M12 14v-1" />
    <path d="m15.5 12.5-1-1" />
    <path d="m8.5 12.5 1-1" />
    <path d="m14 17.5-1-1" />
    <path d="m10 17.5 1-1" />
  </svg>
);

export default BrainIcon;
