
import React from 'react';
import type { SavedCase } from '../types';
import HistoryIcon from './icons/HistoryIcon';
import TrashIcon from './icons/TrashIcon';

interface CaseHistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  cases: SavedCase[];
  onLoad: (caseId: string) => void;
  onDelete: (caseId: string) => void;
}

const CaseHistorySidebar: React.FC<CaseHistorySidebarProps> = ({ isOpen, onClose, cases, onLoad, onDelete }) => {
    // Sort cases by date, newest first
    const sortedCases = [...cases].sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());

    return (
        <div
            role="dialog"
            aria-modal="true"
            className={`fixed inset-0 z-50 transition-opacity duration-300 ease-in-out ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60" onClick={onClose}></div>

            {/* Panel */}
            <div className={`relative z-10 flex h-full transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} bg-slate-50 dark:bg-slate-900 shadow-2xl w-full max-w-md ml-auto`}>
                <div className="flex flex-col w-full">
                    {/* Header */}
                    <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
                        <div className="flex items-center gap-3">
                            <HistoryIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Histórico de Casos</h2>
                        </div>
                        <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Fechar histórico">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </header>

                    {/* Case List */}
                    <div className="overflow-y-auto flex-grow p-4">
                        {sortedCases.length > 0 ? (
                            <ul className="space-y-3">
                                {sortedCases.map(c => (
                                    <li key={c.id} className="group bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 transition-shadow hover:shadow-md">
                                        <button onClick={() => onLoad(c.id)} className="text-left flex-grow cursor-pointer">
                                            <p className="font-semibold text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{c.name}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Salvo em {new Date(c.savedAt).toLocaleDateString('pt-BR')}</p>
                                        </button>
                                        <button 
                                            onClick={() => onDelete(c.id)} 
                                            className="p-2 rounded-md text-slate-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/50 dark:hover:text-red-400 transition-colors"
                                            aria-label={`Apagar caso ${c.name}`}
                                        >
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-center text-slate-500 dark:text-slate-400 h-full flex flex-col justify-center items-center">
                                <HistoryIcon className="h-12 w-12 mb-4 text-slate-400" />
                                <h3 className="font-semibold">Nenhum caso salvo</h3>
                                <p className="text-sm mt-1">Os casos que você salvar aparecerão aqui.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CaseHistorySidebar;
