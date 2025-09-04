
import React from 'react';
import HeartPulseIcon from './icons/HeartPulseIcon';

interface WelcomeScreenProps {
  onStartNewCase: () => void;
  onStartTraining: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStartNewCase, onStartTraining }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center bg-white dark:bg-slate-800 p-8 rounded-lg shadow-md dark:border dark:border-slate-700">
      <HeartPulseIcon className="h-20 w-20 text-blue-500 mb-4" />
      <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100">
        Bem-vindo ao SemiologiX
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
        Seu assistente de diagnóstico inteligente. Preencha a anamnese, grave um áudio, ou importe um arquivo para receber hipóteses diagnósticas baseadas em IA.
      </p>
      <div className="mt-10 flex flex-col sm:flex-row gap-4">
        <button
          onClick={onStartNewCase}
          className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 transition-transform transform hover:scale-105"
        >
          Iniciar Novo Caso
        </button>
        <button
          onClick={onStartTraining}
          className="px-8 py-4 bg-slate-100 text-slate-700 font-semibold rounded-lg shadow-md hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 transition-transform transform hover:scale-105"
        >
          Modo Treinamento
        </button>
      </div>
    </div>
  );
};

export default WelcomeScreen;
