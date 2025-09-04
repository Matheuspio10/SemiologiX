
import React, { useState } from 'react';
import type { Diagnosis, TimelineEvent } from '../types';
import DiagnosisCard from './DiagnosisCard';
import TimelineIcon from './icons/TimelineIcon';
import TimelineModal from './TimelineModal';

interface DiagnosisDisplayProps {
  diagnoses: Diagnosis[];
  differentialDiagnoses: Diagnosis[];
  timelineEvents: TimelineEvent[];
  isLoading: boolean;
  isTimelineLoading: boolean;
  error: string | null;
  analysisRequested: boolean;
  selectedDiagnoses: Diagnosis[];
  onToggleDiagnosis: (diagnosis: Diagnosis) => void;
  onInvestigate: () => void;
  onSelectCustomDiagnosis: (diagnosisText: string) => void;
  hda: string;
}

const LoadingSkeleton: React.FC = () => (
  <div className="space-y-4 animate-pulse">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="bg-slate-200 dark:bg-slate-700 p-5 rounded-lg h-32">
        <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-3/4 mb-4"></div>
        <div className="h-2.5 bg-slate-300 dark:bg-slate-600 rounded-full w-full mb-4"></div>
        <div className="h-3 bg-slate-300 dark:bg-slate-600 rounded w-5/6"></div>
      </div>
    ))}
  </div>
);

const InitialState: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 dark:text-slate-400">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104l-2.28 2.28-1.32 1.32C4.98 7.896 4.5 9.414 4.5 10.934V18a2.25 2.25 0 002.25 2.25h10.5A2.25 2.25 0 0019.5 18v-7.066c0-1.52-.48-3.038-1.32-4.23l-1.32-1.32-2.28-2.28a3 3 0 00-2.122-.878H11.87a3 3 0 00-2.122.878zM12 14.25a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" />
    </svg>
    <h3 className="text-xl font-semibold">Aguardando Análise</h3>
    <p className="mt-2 max-w-sm">
      Preencha o formulário à esquerda e clique em 'Analisar Hipóteses' para ver as sugestões da IA.
    </p>
  </div>
);

const DiagnosisDisplay: React.FC<DiagnosisDisplayProps> = ({ diagnoses, differentialDiagnoses, timelineEvents, isLoading, isTimelineLoading, error, analysisRequested, selectedDiagnoses, onToggleDiagnosis, onInvestigate, onSelectCustomDiagnosis, hda }) => {
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customDiagnosisText, setCustomDiagnosisText] = useState('');
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customDiagnosisText.trim()) {
      onSelectCustomDiagnosis(customDiagnosisText.trim());
      setCustomDiagnosisText('');
      setIsAddingCustom(false);
    }
  };

  const hasResults = diagnoses.length > 0 || differentialDiagnoses.length > 0;
  const shouldShowTimelineButton = analysisRequested && (hda && hda.trim().length > 20) && (isTimelineLoading || timelineEvents.length > 0);

  return (
    <div className="bg-slate-100 dark:bg-slate-800/50 rounded-lg shadow-inner h-full flex flex-col relative">
      <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 p-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
        Hipóteses Diagnósticas (IA)
      </h2>
      <div className="overflow-y-auto p-6 flex-grow">
        {isLoading ? (
          <LoadingSkeleton />
        ) : error ? (
          <p className="text-red-500 text-center">{error}</p>
        ) : !analysisRequested ? (
          <InitialState />
        ) : (
          <>
            {!hasResults ? (
              <div className="text-center text-slate-500 dark:text-slate-400 mb-6">
                <h3 className="font-semibold text-lg">Nenhum diagnóstico retornado</h3>
                <p>Com base nas informações fornecidas, nenhum diagnóstico foi retornado. Tente detalhar mais a anamnese ou adicione uma hipótese abaixo.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {diagnoses.length > 0 && (
                  <div className="space-y-4">
                    {diagnoses.map((diag, index) => (
                      <DiagnosisCard
                        key={`probable-${index}`}
                        diagnosis={diag}
                        isSelected={selectedDiagnoses.some(d => d.diagnostico === diag.diagnostico)}
                        onToggleSelect={onToggleDiagnosis}
                      />
                    ))}
                  </div>
                )}

                {differentialDiagnoses.length > 0 && (
                  <div>
                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-slate-300 dark:border-slate-700"></div>
                      </div>
                      <div className="relative flex justify-center">
                        <span className="bg-slate-100 dark:bg-slate-800/50 px-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                          Diagnósticos Diferenciais a Considerar (Zebras)
                        </span>
                      </div>
                    </div>
                    <div className="space-y-4 mt-4">
                      {differentialDiagnoses.map((diag, index) => (
                         <DiagnosisCard
                            key={`diff-${index}`}
                            diagnosis={diag}
                            isSelected={selectedDiagnoses.some(d => d.diagnostico === diag.diagnostico)}
                            onToggleSelect={onToggleDiagnosis}
                        />
                      ))}
                    </div>
                  </div>
                )}
                 {hasResults && (
                    <div className="mt-8 pt-6 border-t border-slate-300 dark:border-slate-700">
                        <button
                            type="button"
                            onClick={onInvestigate}
                            disabled={selectedDiagnoses.length === 0}
                            className="w-full flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
                        >
                            Investigar {selectedDiagnoses.length > 0 ? `(${selectedDiagnoses.length})` : ''} Hipótese(s)
                        </button>
                    </div>
                 )}
              </div>
            )}
            
            {/* Custom Diagnosis Section */}
            <div className={`mt-8 ${hasResults ? 'pt-6 border-t border-slate-300 dark:border-slate-700' : ''}`}>
              {!isAddingCustom ? (
                <button
                  type="button"
                  onClick={() => setIsAddingCustom(true)}
                  className="w-full text-center px-4 py-2 border border-dashed border-slate-400 dark:border-slate-600 rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/50 transition-colors"
                >
                  + Adicionar hipótese para investigação manual
                </button>
              ) : (
                <form onSubmit={handleCustomSubmit} className="space-y-3">
                  <label htmlFor="custom-diagnosis" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Insira um diagnóstico para investigação:
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="custom-diagnosis"
                      type="text"
                      value={customDiagnosisText}
                      onChange={(e) => setCustomDiagnosisText(e.target.value)}
                      className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900/50 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      placeholder="Ex: Embolia Pulmonar"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                      disabled={!customDiagnosisText.trim()}
                    >
                      Investigar
                    </button>
                  </div>
                </form>
              )}
            </div>
          </>
        )}
      </div>

      {shouldShowTimelineButton && (
        <button
          onClick={() => setIsTimelineModalOpen(true)}
          className="absolute bottom-6 right-6 z-10 flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-full shadow-lg hover:bg-blue-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-100 dark:focus:ring-offset-slate-800/50 focus:ring-blue-500"
          aria-label="Ver linha do tempo da doença"
        >
          {isTimelineLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Carregando...
            </span>
          ) : (
            <span className="flex items-center">
              <TimelineIcon className="h-5 w-5 mr-2" />
              Mostrar Timeline
            </span>
          )}
        </button>
      )}

      <TimelineModal
        isOpen={isTimelineModalOpen}
        onClose={() => setIsTimelineModalOpen(false)}
        events={timelineEvents}
        isLoading={isTimelineLoading}
      />
    </div>
  );
};

export default DiagnosisDisplay;
