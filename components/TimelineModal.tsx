import React from 'react';
import TimelineDisplay from './TimelineDisplay';
import type { TimelineEvent } from '../types';
import TimelineIcon from './icons/TimelineIcon';

interface TimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: TimelineEvent[];
  isLoading: boolean;
}

const TimelineModal: React.FC<TimelineModalProps> = ({ isOpen, onClose, events, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 transition-opacity"
      aria-modal="true"
      role="dialog"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col transform transition-all"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <div className="flex items-center">
            <TimelineIcon className="h-6 w-6 mr-3 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              Linha do Tempo da Doença
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Fechar modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        <div className="overflow-auto p-6 flex-grow flex items-center justify-center">
          <TimelineDisplay events={events} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
};

export default TimelineModal;
