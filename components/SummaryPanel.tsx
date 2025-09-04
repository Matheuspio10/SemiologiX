
import React from 'react';
import type { AnamnesisData, Diagnosis } from '../types';
import HeartPulseIcon from './icons/HeartPulseIcon';
import LungsIcon from './icons/LungsIcon';
import ThermometerIcon from './icons/ThermometerIcon';
import StethoscopeIcon from './icons/StethoscopeIcon';
import OxygenIcon from './icons/OxygenIcon';

// Função para determinar a cor do sinal vital com base em seu valor
const getVitalSignColor = (label: string, value: string): string => {
  const normalColor = 'text-green-500 dark:text-green-400';
  const attentionColor = 'text-yellow-500 dark:text-yellow-400';
  const alteredColor = 'text-red-500 dark:text-red-400';
  const defaultColor = 'text-slate-800 dark:text-slate-200';

  if (!value || typeof value !== 'string' || value.trim() === '') {
    return defaultColor;
  }

  const parseNumeric = (val: string): number => parseFloat(val.replace(',', '.').replace(/[^0-9.]/g, ''));

  switch (label) {
    case 'PA': {
      const parts = value.split('/');
      if (parts.length !== 2) return defaultColor;
      const systolic = parseNumeric(parts[0]);
      const diastolic = parseNumeric(parts[1]);
      if (isNaN(systolic) || isNaN(diastolic)) return defaultColor;

      if (systolic >= 140 || diastolic >= 90 || systolic < 90 || diastolic < 60) return alteredColor;
      if ((systolic >= 130 && systolic <= 139) || (diastolic >= 80 && diastolic <= 89)) return attentionColor;
      return normalColor;
    }
    case 'FC': {
      const numValue = parseNumeric(value);
      if (isNaN(numValue)) return defaultColor;
      if (numValue < 50 || numValue > 120) return alteredColor;
      if ((numValue >= 50 && numValue < 60) || (numValue > 100 && numValue <= 120)) return attentionColor;
      return normalColor; // 60-100
    }
    case 'FR': {
      const numValue = parseNumeric(value);
      if (isNaN(numValue)) return defaultColor;
      if (numValue < 12 || numValue > 25) return alteredColor;
      if (numValue >= 21 && numValue <= 25) return attentionColor;
      return normalColor; // 12-20
    }
    case 'Temp': {
      const numValue = parseNumeric(value);
      if (isNaN(numValue)) return defaultColor;
      if (numValue < 35.5 || numValue > 38.0) return alteredColor;
      if (numValue >= 37.5 && numValue <= 38.0) return attentionColor;
      return normalColor; // 35.5 - 37.4
    }
    case 'SpO₂': {
      const numValue = parseNumeric(value);
      if (isNaN(numValue)) return defaultColor;
      if (numValue < 90) return alteredColor;
      if (numValue >= 90 && numValue <= 94) return attentionColor;
      return normalColor; // >= 95
    }
    default:
      return defaultColor;
  }
};


const VitalSign: React.FC<{ icon: React.ReactNode; label: string; value: string | number; unit: string; colorClass: string }> = ({ icon, label, value, unit, colorClass }) => {
  const displayValue = value || 'N/A';
  const displayUnit = value ? unit : '';
  
  return (
    <div className="flex items-center space-x-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
        <p className={`text-md font-semibold ${colorClass}`}>
          {displayValue} <span className="text-sm font-normal">{displayUnit}</span>
        </p>
      </div>
    </div>
  );
};

const SummaryPanel: React.FC<{ anamnesisData: AnamnesisData; diagnoses: Diagnosis[]; isLoading: boolean; }> = ({ anamnesisData, diagnoses, isLoading }) => {
  const { idade, sexo, pa, fc, fr, temp, spo2 } = anamnesisData;
  const topDiagnoses = diagnoses.slice(0, 3);

  const getProbabilityColor = (prob: number) => {
    if (prob > 70) return 'text-red-500 dark:text-red-400';
    if (prob > 40) return 'text-yellow-500 dark:text-yellow-400';
    return 'text-green-500 dark:text-green-400';
  };

  return (
    <aside className="bg-white dark:bg-slate-800 p-5 rounded-lg shadow-md dark:border dark:border-slate-700 h-full flex flex-col space-y-6 sticky top-24">
      <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-3">
        Resumo do Paciente
      </h2>
      
      {/* Patient Data */}
      <div className="space-y-3">
        <div className="flex justify-between items-baseline">
          <span className="text-sm text-slate-500 dark:text-slate-400">Idade</span>
          <span className="text-md font-bold text-slate-800 dark:text-slate-200">{idade ? `${idade} anos` : 'N/A'}</span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-sm text-slate-500 dark:text-slate-400">Sexo</span>
          <span className="text-md font-bold text-slate-800 dark:text-slate-200">{sexo || 'N/A'}</span>
        </div>
      </div>
      
      {/* Vital Signs */}
      <div>
        <h3 className="text-md font-semibold text-slate-600 dark:text-slate-300 mb-4">Sinais Vitais</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-2">
            <VitalSign icon={<StethoscopeIcon className="h-5 w-5 text-slate-600 dark:text-slate-300"/>} label="PA" value={pa} unit="mmHg" colorClass={getVitalSignColor('PA', pa)} />
            <VitalSign icon={<HeartPulseIcon className="h-5 w-5 text-red-500"/>} label="FC" value={fc} unit="bpm" colorClass={getVitalSignColor('FC', fc)} />
            <VitalSign icon={<LungsIcon className="h-5 w-5 text-blue-500"/>} label="FR" value={fr} unit="ipm" colorClass={getVitalSignColor('FR', fr)} />
            <VitalSign icon={<ThermometerIcon className="h-5 w-5 text-orange-500"/>} label="Temp" value={temp} unit="°C" colorClass={getVitalSignColor('Temp', temp)} />
            <VitalSign icon={<OxygenIcon className="h-5 w-5 text-cyan-500"/>} label="SpO₂" value={spo2} unit="%" colorClass={getVitalSignColor('SpO₂', spo2)} />
        </div>
      </div>

      {/* Top Hypotheses */}
      <div>
        <h3 className="text-md font-semibold text-slate-600 dark:text-slate-300 mb-3">Principais Hipóteses</h3>
        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
          </div>
        ) : topDiagnoses.length > 0 ? (
          <ul className="space-y-2">
            {topDiagnoses.map(diag => (
              <li key={diag.diagnostico} className="flex justify-between items-center text-sm gap-2">
                <span className="text-slate-700 dark:text-slate-300 truncate pr-2">{diag.diagnostico}</span>
                <span className={`font-bold flex-shrink-0 ${getProbabilityColor(diag.probabilidade)}`}>
                  {diag.probabilidade}%
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">Nenhuma hipótese gerada ainda.</p>
        )}
      </div>
      
      <div className="flex-grow"></div>
       <p className="text-xs text-center text-slate-400 dark:text-slate-500 mt-auto">
        Dados-chave para referência rápida.
      </p>

    </aside>
  );
};
export default SummaryPanel;
