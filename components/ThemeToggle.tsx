
import React from 'react';
import SunIcon from './icons/SunIcon';
import MoonIcon from './icons/MoonIcon';

interface ThemeToggleProps {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, setTheme }) => {
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className="fixed top-5 right-5 z-50 p-2 rounded-full bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shadow-md"
      aria-label="Alternar modo claro/escuro"
    >
      {theme === 'light' ? (
          <SunIcon className="h-5 w-5" />
      ) : (
          <MoonIcon className="h-5 w-5" />
      )}
    </button>
  );
};

export default ThemeToggle;