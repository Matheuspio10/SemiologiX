
import React from 'react';
import HeartPulseIcon from './icons/HeartPulseIcon';
import HistoryIcon from './icons/HistoryIcon';

interface HeaderProps {
  isTrainingMode: boolean;
  onToggleTrainingMode: () => void;
  onToggleHistory: () => void;
  isLoading: boolean;
}

const Header: React.FC<HeaderProps> = ({ isTrainingMode, onToggleTrainingMode, onToggleHistory, isLoading }) => {
  return (
    <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-sm dark:border-b dark:border-slate-700 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <HeartPulseIcon className="h-8 w-8 text-blue-600 flex-shrink-0" />
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              SemiologiX
            </h1>
            <span className="inline-block px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/50 rounded-full">
              Beta
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
                onClick={onToggleHistory}
                disabled={isLoading || isTrainingMode}
                className="px-3 py-2 text-sm font-semibold rounded-md transition-colors duration-300 flex items-center bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Abrir histórico de casos"
            >
                <HistoryIcon className="h-5 w-5 mr-2" />
                Histórico
            </button>
            <button
                onClick={onToggleTrainingMode}
                disabled={isLoading}
                className={`px-3 py-2 text-sm font-semibold rounded-md transition-colors duration-300 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isTrainingMode
                        ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:hover:bg-amber-900'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600'
                }`}
            >
                {isTrainingMode ? 'Sair do Modo Treinamento' : 'Modo Treinamento'}
            </button>
          </div>
        </div>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          {isTrainingMode ? 'Ambiente de simulação para estudantes e residentes.' : 'Seu assistente de diagnóstico inteligente'}
        </p>
      </div>
    </header>
  );
};

export default Header;
