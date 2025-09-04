

import React, { useMemo, useState, useEffect } from 'react';
import type { Diagnosis, DiagnosisDetail, AnamnesisData, ChecklistItem, RetroFeedbackData, ManagementPlan, AcademicSearchResult } from '../types';
import { fetchDiagnosisDetails, fetchAcademicPublications } from '../services/geminiService';
import BookOpenIcon from './icons/BookOpenIcon';

interface DiagnosisDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  diagnoses: Diagnosis[];
  anamnesisData: AnamnesisData;
  onReevaluate: (data: RetroFeedbackData) => void;
  onFinalize: (data: RetroFeedbackData) => void;
}

const LoadingSkeleton = () => (
  <div className="space-y-6 animate-pulse p-4">
    <div className="h-6 bg-slate-300 dark:bg-slate-600 rounded w-3/4"></div>
    <div className="space-y-3">
      <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-full"></div>
      <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-5/6"></div>
    </div>
    <div className="h-6 bg-slate-300 dark:bg-slate-600 rounded w-1/2 mt-6"></div>
    <div className="space-y-3">
      <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-full"></div>
      <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-5/6"></div>
      <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-3/4"></div>
    </div>
  </div>
);

const DetailSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">{title}</h3>
        {children}
    </div>
);

const isItemPresent = (item: ChecklistItem, anamnesisString: string): boolean => {
    const stopWords = ['a', 'o', 'e', 'ou', 'de', 'do', 'da', 'em', 'um', 'uma', 'com', 'por', 'para', 'sem', 'tem', 'houve', 'qual', 'quando', 'como', 'onde', 'se', 'esta', 'este', 'seu', 'sua', 'há', 'sobre', 'paciente', 'refere'];
    const normalizeText = (text: string) => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[?.,;]/g, '');

    const normalizedItem = normalizeText(item.item);
    const normalizedAnamnesis = normalizeText(anamnesisString);
    const keywords = normalizedItem.split(' ').filter(word => word.length > 2 && !stopWords.includes(word));
    if (keywords.length === 0) return false;

    const synonymMap: Record<string, string[]> = { 'toracica': ['toracica', 'peito', 'precordial', 'precordio'], 'cefaleia': ['cefaleia', 'cabeca'], 'dispneia': ['dispneia', 'ar', 'respirar', 'respiracao', 'folego'], 'membros': ['membros', 'pernas', 'bracos'], 'inferiores': ['inferiores', 'pernas', 'mmssii', 'mmii'], 'superiores': ['superiores', 'bracos', 'mmss', 'mmss'], 'febre': ['febre', 'febril', 'temperatura'], 'sudorese': ['sudorese', 'suor', 'diaforese'], };
    let foundKeywords = 0;
    for (const keyword of keywords) {
        const synonyms = synonymMap[keyword] || [keyword];
        if (synonyms.some(synonym => normalizedAnamnesis.includes(synonym))) {
            foundKeywords++;
        }
    }
    const requiredMatches = keywords.length <= 2 ? keywords.length : Math.ceil(keywords.length * 0.75);
    return foundKeywords >= requiredMatches;
};


const DiagnosisDetailModal: React.FC<DiagnosisDetailModalProps> = ({ isOpen, onClose, diagnoses, anamnesisData, onReevaluate, onFinalize }) => {
  const [detailsMap, setDetailsMap] = useState<Record<string, DiagnosisDetail | null>>({});
  const [isLoadingMap, setIsLoadingMap] = useState<Record<string, boolean>>({});
  const [errorMap, setErrorMap] = useState<Record<string, string | null>>({});
  
  const [view, setView] = useState<'checklist' | 'conduct' | 'publications'>('checklist');
  const [checklistResponses, setChecklistResponses] = useState<Record<string, string>>({});
  const [conductedPlan, setConductedPlan] = useState<Partial<ManagementPlan>>({ examesConfirmacao: [], medicacoesSugeridas: [], encaminhamentos: [] });
  
  const [academicResults, setAcademicResults] = useState<Record<string, AcademicSearchResult | null>>({});
  const [isFetchingPublications, setIsFetchingPublications] = useState<Record<string, boolean>>({});
  const [publicationsError, setPublicationsError] = useState<Record<string, string | null>>({});
  
  useEffect(() => {
    if (!isOpen) {
        setDetailsMap({});
        setIsLoadingMap({});
        setErrorMap({});
        setChecklistResponses({});
        setConductedPlan({ examesConfirmacao: [], medicacoesSugeridas: [], encaminhamentos: [] });
        setView('checklist');
        setAcademicResults({});
        setIsFetchingPublications({});
        setPublicationsError({});
        return;
    }

    if (diagnoses.length > 0) {
        diagnoses.forEach(diag => {
            const diagName = diag.diagnostico;
            if (!detailsMap[diagName] && !isLoadingMap[diagName] && !errorMap[diagName]) {
                 setIsLoadingMap(prev => ({ ...prev, [diagName]: true }));
                 setErrorMap(prev => ({ ...prev, [diagName]: null }));

                 fetchDiagnosisDetails(anamnesisData, diag)
                    .then(details => setDetailsMap(prev => ({ ...prev, [diagName]: details })))
                    .catch(err => setErrorMap(prev => ({ ...prev, [diagName]: err.message || 'Erro desconhecido' })))
                    .finally(() => setIsLoadingMap(prev => ({ ...prev, [diagName]: false })));
            }
        });
    }
  }, [isOpen, diagnoses, anamnesisData]);

  const { mergedChecklist, mergedPlan } = useMemo(() => {
    const allDetails = Object.values(detailsMap).filter((d): d is DiagnosisDetail => d !== null);
    if (allDetails.length === 0) {
        return { mergedChecklist: [], mergedPlan: { examesConfirmacao: [], medicacoesSugeridas: [], encaminhamentos: [] } };
    }

    const checklistMap = new Map<string, { item: ChecklistItem; sources: string[] }>();
    diagnoses.forEach(diagnosis => {
        const detail = detailsMap[diagnosis.diagnostico];
        if (detail) {
            detail.checklistAnamnese.forEach(checklistItem => {
                const existing = checklistMap.get(checklistItem.item);
                if (existing) {
                    existing.sources.push(diagnosis.diagnostico);
                } else {
                    checklistMap.set(checklistItem.item, {
                        item: checklistItem,
                        sources: [diagnosis.diagnostico],
                    });
                }
            });
        }
    });

    const exames = new Set<string>();
    const medicacoes = new Set<string>();
    const encaminhamentos = new Set<string>();
    allDetails.forEach(detail => {
        detail.planoConduta.examesConfirmacao?.forEach(e => exames.add(e));
        detail.planoConduta.medicacoesSugeridas?.forEach(m => medicacoes.add(m));
        detail.planoConduta.encaminhamentos?.forEach(e => encaminhamentos.add(e));
    });
    
    return {
        mergedChecklist: Array.from(checklistMap.values()),
        mergedPlan: {
            examesConfirmacao: Array.from(exames),
            medicacoesSugeridas: Array.from(medicacoes),
            encaminhamentos: Array.from(encaminhamentos),
        },
    };
  }, [detailsMap, diagnoses]);

  const anamnesisString = useMemo(() => Object.values(anamnesisData).join(' '), [anamnesisData]);
  
  const isAnythingLoading = useMemo(() => Object.values(isLoadingMap).some(Boolean), [isLoadingMap]);
  const combinedError = useMemo(() => Object.values(errorMap).filter(Boolean).join('; '), [errorMap]);

  const handleFinalizeWithAllFeedback = () => onFinalize({ checklistUpdates: checklistResponses, conductedPlan });
  const handleReevaluateWithChecklistFeedback = () => onReevaluate({ checklistUpdates: checklistResponses, conductedPlan: { examesConfirmacao: [], medicacoesSugeridas: [], encaminhamentos: [] } });

  const handleCheckboxChange = (category: keyof ManagementPlan, item: string) => {
    setConductedPlan(prev => {
      const currentItems = prev[category] || [];
      const newItems = currentItems.includes(item) ? currentItems.filter(i => i !== item) : [...currentItems, item];
      return { ...prev, [category]: newItems };
    });
  };

  const handleFetchPublications = async (diagnosisName: string) => {
    setIsFetchingPublications(prev => ({ ...prev, [diagnosisName]: true }));
    setPublicationsError(prev => ({ ...prev, [diagnosisName]: null }));
    setAcademicResults(prev => ({...prev, [diagnosisName]: null}));

    try {
        const results = await fetchAcademicPublications(diagnosisName);
        setAcademicResults(prev => ({ ...prev, [diagnosisName]: results }));
    } catch (err: any) {
        setPublicationsError(prev => ({ ...prev, [diagnosisName]: err.message || 'Erro desconhecido' }));
    } finally {
        setIsFetchingPublications(prev => ({ ...prev, [diagnosisName]: false }));
    }
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose} role="dialog" aria-modal="true">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Investigar Hipóteses</h2>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Fechar modal">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>

        <div className="overflow-y-auto p-6 space-y-8">
          {isAnythingLoading && view !== 'publications' && <LoadingSkeleton />}
          {combinedError && <p className="text-red-600 text-center">{combinedError}</p>}
          {!isAnythingLoading && !combinedError && (
            <>
              {view === 'checklist' && (
                <DetailSection title="Checklist Unificado da Anamnese">
                  <ul className="space-y-3">
                    {mergedChecklist.map(({ item, sources }, index) => {
                      const present = isItemPresent(item, anamnesisString);
                      return (
                        <li key={index} className={`p-3 rounded-md transition-colors ${present ? 'bg-green-50 dark:bg-green-900/50' : 'bg-amber-50 dark:bg-amber-900/50'}`}>
                          <div className="flex items-start">
                            <div className="flex-shrink-0 mr-3 mt-1">
                              {present ? (
                                <svg className="h-5 w-5 text-green-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                              ) : (
                                <svg className="h-5 w-5 text-amber-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                              )}
                            </div>
                            <div className="flex-grow">
                              <p className={`font-medium ${present ? 'text-slate-500 dark:text-slate-400 line-through' : 'text-slate-800 dark:text-slate-200'}`}>{item.item}</p>
                              <p className={`text-sm ${present ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'}`}>{item.justificativa}</p>
                              {sources.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {sources.map(source => (
                                    <span key={source} className="text-xs px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                      {source}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          {!present && (
                            <div className="mt-2 pl-8">
                              <label htmlFor={`response-${index}`} className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Adicionar informação:</label>
                              <textarea id={`response-${index}`} rows={1} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-1 focus:ring-blue-500 text-sm bg-white dark:bg-slate-900/50" placeholder="Resposta do paciente ou achado do exame..." value={checklistResponses[item.item] || ''} onChange={(e) => setChecklistResponses(prev => ({...prev, [item.item]: e.target.value}))} />
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </DetailSection>
              )}
              {view === 'conduct' && (
                <DetailSection title="Plano de Conduta Unificado">
                  {(Object.keys(mergedPlan) as Array<keyof ManagementPlan>).map(category => (
                    mergedPlan[category] && mergedPlan[category].length > 0 && (
                      <div key={category} className="mb-4">
                        <h4 className="font-semibold text-slate-700 dark:text-slate-300">
                          {category === 'examesConfirmacao' ? 'Exames para Confirmação' : category === 'medicacoesSugeridas' ? 'Medicações Sugeridas' : 'Encaminhamentos'}
                        </h4>
                        <ul className="mt-2 space-y-2">
                          {mergedPlan[category].map((item, i) => (
                            <li key={i} className="flex items-center">
                              <input type="checkbox" id={`${category}-${i}`} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:bg-slate-700" onChange={() => handleCheckboxChange(category, item)} checked={conductedPlan[category]?.includes(item) || false} />
                              <label htmlFor={`${category}-${i}`} className="ml-3 text-sm text-slate-600 dark:text-slate-300">{item}</label>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                  ))}
                </DetailSection>
              )}
            </>
          )}

          {view === 'publications' && (
            <DetailSection title="Busca em Publicações Científicas">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Busque por artigos, diretrizes e metanálises recentes em bases de dados acadêmicas (Google Scholar, PubMed) para embasar sua decisão clínica.</p>
                <div className="space-y-6">
                    {diagnoses.map(diag => (
                        <div key={diag.diagnostico} className="p-4 rounded-md bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
                            <div className="flex justify-between items-center gap-4 flex-wrap">
                                <h4 className="font-semibold text-slate-800 dark:text-slate-200">{diag.diagnostico}</h4>
                                <button
                                    onClick={() => handleFetchPublications(diag.diagnostico)}
                                    disabled={isFetchingPublications[diag.diagnostico]}
                                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                >
                                    {isFetchingPublications[diag.diagnostico] ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            Buscando...
                                        </>
                                    ) : (
                                      <>
                                        <BookOpenIcon className="h-4 w-4 mr-2 -ml-1" />
                                        Buscar Publicações
                                      </>
                                    )}
                                </button>
                            </div>
                            {publicationsError[diag.diagnostico] && <p className="text-red-500 mt-2 text-sm">{publicationsError[diag.diagnostico]}</p>}
                            {isFetchingPublications[diag.diagnostico] && (
                                <div className="mt-4 space-y-4 animate-pulse">
                                    <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-full"></div>
                                    <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-5/6"></div>
                                    <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-full"></div>
                                </div>
                            )}
                            {academicResults[diag.diagnostico] && (
                                <div className="mt-4 space-y-6">
                                    <div>
                                        <h5 className="font-semibold text-md mb-2 text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-1">Resumo da Doença</h5>
                                        <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 whitespace-pre-wrap pt-2">
                                          {academicResults[diag.diagnostico]?.resumoDoenca}
                                        </div>
                                    </div>
                                    <div>
                                        <h5 className="font-semibold text-md mb-2 text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-1">Diretrizes de Tratamento Atuais</h5>
                                        <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 whitespace-pre-wrap pt-2">
                                          {academicResults[diag.diagnostico]?.diretrizesTratamento}
                                        </div>
                                    </div>
                                    <div>
                                        <h5 className="font-semibold text-md mb-2 text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-1">Descobertas Recentes (Últimos 5 Anos)</h5>
                                        <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 whitespace-pre-wrap pt-2">
                                          {academicResults[diag.diagnostico]?.descobertasRecentes}
                                        </div>
                                    </div>

                                    {academicResults[diag.diagnostico]?.sources && academicResults[diag.diagnostico]!.sources.length > 0 && (
                                      <div>
                                          <h5 className="font-semibold text-md mb-2 text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-1">Fontes Consultadas</h5>
                                          <ul className="space-y-2 list-none p-0 pt-2">
                                              {academicResults[diag.diagnostico]?.sources.map((source, index) => (
                                                  <li key={index} className="text-sm">
                                                      <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline break-words flex items-start gap-2">
                                                        <span className="flex-shrink-0 mt-1">
                                                          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M14.752.935A1.5 1.5 0 0 0 13.5 0H4.5A1.5 1.5 0 0 0 3 1.5v12A1.5 1.5 0 0 0 4.5 15h9a1.5 1.5 0 0 0 1.5-1.5V2.25a1.5 1.5 0 0 0-1.248-1.315Z" /></svg>
                                                        </span>
                                                        <span className="flex-grow">{source.web.title || source.web.uri}</span>
                                                      </a>
                                                  </li>
                                              ))}
                                          </ul>
                                      </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </DetailSection>
          )}
        </div>

        <footer className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 shrink-0 flex justify-between items-center">
            <div className="flex space-x-1 bg-slate-200 dark:bg-slate-700 p-1 rounded-lg">
                <button onClick={() => setView('checklist')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${view === 'checklist' ? 'bg-white dark:bg-slate-800 shadow text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-600/50'}`}>Checklist</button>
                <button onClick={() => setView('conduct')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${view === 'conduct' ? 'bg-white dark:bg-slate-800 shadow text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-600/50'}`}>Conduta</button>
                <button onClick={() => setView('publications')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${view === 'publications' ? 'bg-white dark:bg-slate-800 shadow text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-600/50'}`}>Publicações</button>
            </div>
            <div className="flex items-center space-x-3">
                {view === 'checklist' && (
                    <button type="button" onClick={handleReevaluateWithChecklistFeedback} disabled={isAnythingLoading || Object.keys(checklistResponses).every(k => !checklistResponses[k])} className="px-6 py-2 border border-blue-600 text-sm font-medium rounded-md text-blue-600 hover:bg-blue-50 dark:bg-slate-800 dark:text-blue-400 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed">
                        Reavaliar
                    </button>
                )}
                 <button type="button" onClick={handleFinalizeWithAllFeedback} disabled={isAnythingLoading || Object.values(isFetchingPublications).some(Boolean)} className="px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                    Finalizar Anamnese
                </button>
            </div>
        </footer>
      </div>
    </div>
  );
};

export default DiagnosisDetailModal;