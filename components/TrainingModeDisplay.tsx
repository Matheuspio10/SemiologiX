
import React, { useState, useEffect, useRef } from 'react';
import type { EvaluationResult, Diagnosis, InvestigationLogEntry, StudentPlan } from '../types';

interface TrainingModeDisplayProps {
  isLoading: boolean;
  isInvestigationLoading: boolean;
  evaluationResult: EvaluationResult | null;
  correctDiagnosis: string;
  correctRationale: string;
  aiDiagnoses: Diagnosis[];
  onSubmit: (submission: { principal: string; diferenciais: string[] }, plan: StudentPlan) => void;
  onInvestigationRequest: (request: string) => void;
  investigationLog: InvestigationLogEntry[];
  hasCase: boolean;
  error: string | null;
}

const InitialState: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 dark:text-slate-400">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
    </svg>
    <h3 className="text-xl font-semibold">Modo de Treinamento</h3>
    <p className="mt-2 max-w-sm">
      Clique em "Novo Caso Clínico" para iniciar uma simulação interativa.
    </p>
  </div>
);

const LoadingSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse p-4">
    <div className="bg-slate-200 dark:bg-slate-700 p-5 rounded-lg h-40"></div>
    <div className="bg-slate-200 dark:bg-slate-700 p-5 rounded-lg h-56"></div>
  </div>
);

const FeedbackCard: React.FC<{ title: string; children: React.ReactNode; icon: React.ReactNode, color: 'green' | 'amber' | 'blue' | 'indigo'}> = ({ title, children, icon, color }) => {
    const colors = {
        green: 'bg-green-50 dark:bg-green-900/40 border-green-200 dark:border-green-800',
        amber: 'bg-amber-50 dark:bg-amber-900/40 border-amber-200 dark:border-amber-800',
        blue: 'bg-blue-50 dark:bg-blue-900/40 border-blue-200 dark:border-blue-800',
        indigo: 'bg-indigo-50 dark:bg-indigo-900/40 border-indigo-200 dark:border-indigo-800',
    }
    return (
        <div className={`p-4 rounded-lg border ${colors[color]}`}>
            <div className="flex items-center mb-2">
                {icon}
                <h4 className="font-bold text-md text-slate-800 dark:text-slate-200 ml-2">{title}</h4>
            </div>
            <div className="text-sm text-slate-700 dark:text-slate-300 space-y-1 prose prose-sm dark:prose-invert max-w-none">{children}</div>
        </div>
    );
};

const ScoreDisplay: React.FC<{ score: number; justification: string }> = ({ score, justification }) => {
    const [animatedScore, setAnimatedScore] = useState(0);
    const circumference = 2 * Math.PI * 45; // 2 * pi * radius
    
    useEffect(() => {
        const targetScore = score || 0;
        const animationDuration = 1500;
        let startTimestamp: number | null = null;
        
        const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / animationDuration, 1);
            setAnimatedScore(Math.floor(progress * targetScore));
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };

        window.requestAnimationFrame(step);
        
        return () => { setAnimatedScore(targetScore) }; // On unmount, jump to final score
    }, [score]);
    
    const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

    const getScoreColorClasses = (s: number): { stroke: string, text: string } => {
        if (s < 40) return { stroke: 'stroke-red-500', text: 'text-red-500' };
        if (s < 75) return { stroke: 'stroke-yellow-500', text: 'text-yellow-500' };
        return { stroke: 'stroke-green-500', text: 'text-green-500' };
    };

    const colorClasses = getScoreColorClasses(score);

    return (
        <div className="flex flex-col items-center bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg text-center">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Pontuação Final</h3>
            <div className="relative w-40 h-40">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" strokeWidth="10" className="stroke-slate-200 dark:stroke-slate-700" fill="none" />
                    <circle
                        cx="50" cy="50" r="45"
                        strokeWidth="10"
                        className={`${colorClasses.stroke} transition-stroke duration-500`}
                        fill="none"
                        strokeLinecap="round"
                        transform="rotate(-90 50 50)"
                        style={{
                            strokeDasharray: circumference,
                            strokeDashoffset: strokeDashoffset,
                            transition: 'stroke-dashoffset 1.5s ease-out'
                        }}
                    />
                </svg>
                <div className={`absolute inset-0 flex items-center justify-center text-4xl font-bold ${colorClasses.text} transition-colors duration-500`}>
                    {animatedScore}
                </div>
            </div>
            <p className="text-center mt-4 text-sm font-semibold text-slate-700 dark:text-slate-300 max-w-xs">
                {justification}
            </p>
        </div>
    );
};


const TrainingModeDisplay: React.FC<TrainingModeDisplayProps> = ({ isLoading, isInvestigationLoading, evaluationResult, correctDiagnosis, correctRationale, aiDiagnoses, onSubmit, onInvestigationRequest, investigationLog, hasCase, error }) => {
  const [stage, setStage] = useState<'INVESTIGATION' | 'SUBMIT_DIAGNOSIS' | 'PLANNING'>('INVESTIGATION');
  
  // State for student inputs
  const [investigationInput, setInvestigationInput] = useState('');
  const [principal, setPrincipal] = useState('');
  const [diferencial1, setDiferencial1] = useState('');
  const [diferencial2, setDiferencial2] = useState('');
  
  // State for student plan
  const [solicitacaoExames, setSolicitacaoExames] = useState('');
  const [prescricao, setPrescricao] = useState('');
  const [encaminhamentos, setEncaminhamentos] = useState('');

  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
        logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [investigationLog]);
  
  useEffect(() => {
    // Reset view when a new case starts
    if (hasCase && !evaluationResult) {
        setStage('INVESTIGATION');
        setPrincipal('');
        setDiferencial1('');
        setDiferencial2('');
        setSolicitacaoExames('');
        setPrescricao('');
        setEncaminhamentos('');
    }
  }, [hasCase, evaluationResult]);

  const handleInvestigationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onInvestigationRequest(investigationInput);
    setInvestigationInput('');
  };

  const handleDiagnosisSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (principal.trim() === '') return;
    setStage('PLANNING');
  };
  
  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submission = { principal, diferenciais: [diferencial1, diferencial2].filter(Boolean) };
    const plan = { solicitacaoExames, prescricao, encaminhamentos };
    onSubmit(submission, plan);
  };
  
  const studentHypotheses = [principal, diferencial1, diferencial2].filter(Boolean);

  if (!hasCase) {
    return (
      <div className="bg-slate-100 dark:bg-slate-800/50 rounded-lg shadow-inner h-full flex flex-col">
          <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 p-4 border-b border-slate-200 dark:border-slate-700">
              Modo Treinamento
          </h2>
          <div className="overflow-y-auto p-6 flex-grow">
              <InitialState />
          </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-100 dark:bg-slate-800/50 rounded-lg shadow-inner h-full flex flex-col">
      <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 p-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
        {evaluationResult ? 'Análise de Performance' : 'Painel de Investigação'}
      </h2>
      <div className="overflow-y-auto p-6 flex-grow">
        {isLoading && <LoadingSkeleton />}
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        
        {!evaluationResult && !isLoading && (
            <div className="flex flex-col h-full">
                {/* --- Investigation Log --- */}
                <div ref={logContainerRef} className="flex-grow bg-white dark:bg-slate-900/50 rounded-t-lg p-4 border border-b-0 border-slate-200 dark:border-slate-700 overflow-y-auto min-h-[200px] max-h-[40vh] space-y-4">
                    {investigationLog.map((entry, index) => (
                        <div key={index} className={`flex ${entry.type === 'request' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-2 rounded-lg text-sm ${
                                entry.type === 'request' ? 'bg-blue-100 dark:bg-blue-900/70 text-slate-800 dark:text-slate-200' :
                                entry.type === 'response' ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300' :
                                'bg-yellow-100 dark:bg-yellow-900/50 text-slate-600 dark:text-slate-400 italic text-xs w-full text-center'
                            }`}>
                                {entry.content}
                            </div>
                        </div>
                    ))}
                    {isInvestigationLoading && (
                         <div className="flex justify-start">
                             <div className="bg-slate-200 dark:bg-slate-700 p-2 rounded-lg">
                                <span className="italic text-sm text-slate-500">Aguardando resultado...</span>
                            </div>
                         </div>
                    )}
                </div>

                {stage === 'INVESTIGATION' && (
                    <>
                        <form onSubmit={handleInvestigationSubmit} className="flex gap-2 p-4 border-x border-b border-slate-200 dark:border-slate-700 rounded-b-lg">
                             <input
                                type="text"
                                value={investigationInput}
                                onChange={(e) => setInvestigationInput(e.target.value)}
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800"
                                placeholder="Solicitar exame físico ou laboratorial..."
                                disabled={isInvestigationLoading}
                                autoFocus
                            />
                            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-slate-400" disabled={isInvestigationLoading || !investigationInput.trim()}>
                                Enviar
                            </button>
                        </form>
                        <button onClick={() => setStage('SUBMIT_DIAGNOSIS')} className="mt-6 w-full py-3 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors">
                            Formular Diagnóstico
                        </button>
                    </>
                )}
                
                {stage === 'SUBMIT_DIAGNOSIS' && (
                    <div className="mt-6 p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                        <form onSubmit={handleDiagnosisSubmit} className="space-y-4">
                            <h3 className="font-semibold text-lg text-slate-700 dark:text-slate-200">Formular Hipóteses Diagnósticas</h3>
                            <div>
                                <label htmlFor="hipotese-principal" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Hipótese Principal:</label>
                                <input id="hipotese-principal" type="text" value={principal} onChange={(e) => setPrincipal(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Diagnósticos Diferenciais (opcional):</label>
                                <input type="text" value={diferencial1} onChange={(e) => setDiferencial1(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 mb-2" placeholder="Diferencial 1" />
                                <input type="text" value={diferencial2} onChange={(e) => setDiferencial2(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800" placeholder="Diferencial 2" />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button type="button" onClick={() => setStage('INVESTIGATION')} className="w-full py-2 border border-slate-300 dark:border-slate-600 rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700">
                                    Voltar à Investigação
                                </button>
                                <button type="submit" disabled={!principal.trim()} className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-slate-400">
                                    Avançar para Conduta
                                </button>
                            </div>
                        </form>
                    </div>
                )}
                
                {stage === 'PLANNING' && (
                    <div className="mt-6 p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                        <form onSubmit={handleFinalSubmit} className="space-y-4">
                            <h3 className="font-semibold text-lg text-slate-700 dark:text-slate-200">Plano de Conduta</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Com base na sua hipótese principal: <strong className="text-slate-600 dark:text-slate-300">{principal}</strong></p>
                            <div>
                                <label htmlFor="solicitacao-exames" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Solicitação de Exames:</label>
                                <textarea id="solicitacao-exames" value={solicitacaoExames} onChange={(e) => setSolicitacaoExames(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800" rows={3} placeholder="Ex: Hemograma completo, PCR, Raio-X de tórax..." />
                            </div>
                            <div>
                                <label htmlFor="prescricao" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Prescrição:</label>
                                <textarea id="prescricao" value={prescricao} onChange={(e) => setPrescricao(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800" rows={3} placeholder="Ex: Dipirona 500mg se dor ou febre, Amoxicilina 875mg 12/12h por 7 dias..." />
                            </div>
                             <div>
                                <label htmlFor="encaminhamentos" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Orientações e Encaminhamentos:</label>
                                <textarea id="encaminhamentos" value={encaminhamentos} onChange={(e) => setEncaminhamentos(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800" rows={3} placeholder="Ex: Repouso, hidratação, retornar se piora. Encaminhar para cardiologista." />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button type="button" onClick={() => setStage('SUBMIT_DIAGNOSIS')} className="w-full py-2 border border-slate-300 dark:border-slate-600 rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700">
                                    Voltar para Diagnóstico
                                </button>
                                <button type="submit" className="w-full py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-slate-400">
                                    Submeter Análise Final
                                </button>
                            </div>
                        </form>
                    </div>
                )}

            </div>
        )}

        {evaluationResult && (
            <div className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-6">
                    <ScoreDisplay score={evaluationResult.score} justification={evaluationResult.scoreJustificativa} />
                    
                    <div className="space-y-4">
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-lg">
                            <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Suas Hipóteses</h4>
                            <ul className="space-y-2 text-sm">
                                {studentHypotheses.length > 0 ? studentHypotheses.map((h, i) => {
                                    const normalizedH = h.toLowerCase().trim();
                                    const isCorrect = correctDiagnosis && normalizedH === correctDiagnosis.toLowerCase().trim();
                                    
                                    return (
                                        <li key={i} className="flex items-center justify-between text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 p-2 rounded-md">
                                            <span>{h}</span>
                                            {isCorrect && (
                                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                                    ✓ Correto
                                                </span>
                                            )}
                                        </li>
                                    )
                                }) : <li className="text-slate-500 dark:text-slate-400">Nenhuma hipótese submetida.</li>}
                            </ul>
                        </div>
                         <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-lg">
                            <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Hipóteses da IA</h4>
                            <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-400">
                               {aiDiagnoses.length > 0 ? aiDiagnoses.slice(0, 3).map((d, i) => <li key={i}>{d.diagnostico} ({d.probabilidade}%)</li>) : <li>Nenhuma hipótese gerada.</li>}
                            </ul>
                         </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-3 mt-4">Feedback do Preceptor de IA</h3>
                     <div className="space-y-4">
                        <FeedbackCard title="Raciocínio Diagnóstico (Gabarito)" color="blue" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-500" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>}>
                            <p className="font-bold text-slate-900 dark:text-slate-100 mb-1">{correctDiagnosis}</p>
                            <p>{evaluationResult.raciocinioCorreto}</p>
                        </FeedbackCard>
                        <FeedbackCard title="Análise da Conduta de Investigação" color="indigo" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600 dark:text-indigo-500" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" /></svg>}>
                            <p>{evaluationResult.analiseDaConduta}</p>
                        </FeedbackCard>
                        <FeedbackCard title="Pontos Positivos (Diagnóstico)" color="green" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 dark:text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>}>
                            <p>{evaluationResult.pontosPositivos}</p>
                        </FeedbackCard>
                        <FeedbackCard title="Pontos a Melhorar (Diagnóstico)" color="amber" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600 dark:text-amber-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.636-1.22 2.87-1.22 3.506 0l4.25 8.196c.636 1.22-.464 2.705-1.753 2.705H5.76c-1.29 0-2.389-1.485-1.753-2.705l4.25-8.196zM10 14a1 1 0 110-2 1 1 0 010 2zm-1-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" /></svg>}>
                            <p>{evaluationResult.pontosMelhorar}</p>
                        </FeedbackCard>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default TrainingModeDisplay;