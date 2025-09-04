
import React, { useState, useEffect } from 'react';
import type { Diagnosis } from '../types';
import StethoscopeIcon from './icons/StethoscopeIcon';
import HeartPulseIcon from './icons/HeartPulseIcon';
import LungsIcon from './icons/LungsIcon';
import KidneyIcon from './icons/KidneyIcon';
import BrainIcon from './icons/BrainIcon';

const getDiagnosisIcon = (diagnosisTitle: string): React.ReactNode => {
    const lowerTitle = diagnosisTitle.toLowerCase();
    const iconProps = { className: "h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0" };

    if (lowerTitle.includes('cardí') || lowerTitle.includes('infarto') || lowerTitle.includes('miocárdio') || lowerTitle.includes('angina') || lowerTitle.includes('pericardite')) {
        return <HeartPulseIcon {...iconProps} />;
    }
    if (lowerTitle.includes('pulmonar') || lowerTitle.includes('pneumonia') || lowerTitle.includes('embolia') || lowerTitle.includes('asma') || lowerTitle.includes('dpoc') || lowerTitle.includes('bronquite')) {
        return <LungsIcon {...iconProps} />;
    }
    if (lowerTitle.includes('renal') || lowerTitle.includes('rim') || lowerTitle.includes('nefr') || lowerTitle.includes('pielonefrite')) {
        return <KidneyIcon {...iconProps} />;
    }
    if (lowerTitle.includes('avc') || lowerTitle.includes('meningite') || lowerTitle.includes('cefaleia') || lowerTitle.includes('neurológic')) {
        return <BrainIcon {...iconProps} />;
    }

    return <StethoscopeIcon {...iconProps} />;
};

interface DiagnosisCardProps {
  diagnosis: Diagnosis;
  isSelected: boolean;
  onToggleSelect: (diagnosis: Diagnosis) => void;
}

const DiagnosisCard: React.FC<DiagnosisCardProps> = ({ diagnosis, isSelected, onToggleSelect }) => {
  const [barWidth, setBarWidth] = useState(0);

  useEffect(() => {
      // Delay to allow for initial render before animation
      const timer = setTimeout(() => {
          setBarWidth(diagnosis.probabilidade);
      }, 150);
      return () => clearTimeout(timer);
  }, [diagnosis.probabilidade]);

  const getProbabilityColor = (prob: number) => {
    if (prob > 70) return 'bg-red-500';
    if (prob > 40) return 'bg-yellow-500';
    return 'bg-green-500';
  };
  
  const icon = getDiagnosisIcon(diagnosis.diagnostico);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onToggleSelect(diagnosis)}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onToggleSelect(diagnosis)}
      className={`bg-white dark:bg-slate-800 p-5 rounded-lg border transition-all duration-200 hover:shadow-lg focus:outline-none w-full text-left flex flex-col cursor-pointer ${
          isSelected 
          ? 'ring-2 ring-blue-500 shadow-lg border-transparent' 
          : 'border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500'
      }`}
      aria-label={`Selecionar ${diagnosis.diagnostico}`}
      aria-pressed={isSelected}
    >
      <div className="flex justify-between items-start gap-4">
          <div className="flex items-center gap-4">
              {icon}
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{diagnosis.diagnostico}</h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-blue-600 dark:text-blue-400 flex-shrink-0">{diagnosis.probabilidade}%</span>
            <div className={`w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-md border-2 transition-colors ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-400 dark:border-slate-500 bg-slate-100 dark:bg-slate-700'}`}>
                {isSelected && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
            </div>
          </div>
      </div>

      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 my-3">
        <div
          className={`${getProbabilityColor(diagnosis.probabilidade)} h-2.5 rounded-full transition-all duration-1000 ease-out`}
          style={{ width: `${barWidth}%` }}
        ></div>
      </div>

      <div>
        <h4 className="font-semibold text-slate-600 dark:text-slate-300 mb-1">Justificativa</h4>
        <p className="text-sm text-slate-500 dark:text-slate-400">{diagnosis.justificativa}</p>
      </div>
    </div>
  );
};

export default DiagnosisCard;
