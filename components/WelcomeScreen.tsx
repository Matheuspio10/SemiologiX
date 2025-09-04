import React, { useState } from 'react';
import HeartPulseIcon from './icons/HeartPulseIcon';

interface WelcomeScreenProps {
  onStartNewCase: () => void;
  onStartTraining: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStartNewCase, onStartTraining }) => {
  const [isAcknowledged, setIsAcknowledged] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center h-full text-center bg-white dark:bg-slate-800 p-8 rounded-lg shadow-md dark:border dark:border-slate-700">
      <HeartPulseIcon className="h-20 w-20 text-blue-500 mb-4" />
      <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100">
        Bem-vindo ao SemiologiX
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
        Seu assistente de diagnóstico inteligente. Preencha a anamnese, grave um áudio, ou importe um arquivo para receber hipóteses diagnósticas baseadas em IA.
      </p>

      {/* Beta Warning Section */}
      <div className="mt-8 max-w-2xl w-full p-4 border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/30 rounded-lg text-left">
        <h3 className="font-bold text-amber-800 dark:text-amber-200">Aviso de Beta Fechado</h3>
        <p className="text-sm text-amber-700 dark:text-amber-300 mt-2">
          Você está participando de um beta fechado. O SemiologiX é um protótipo em desenvolvimento e pode apresentar instabilidades ou gerar informações imprecisas. Não deve ser utilizado para decisões clínicas reais.
        </p>
        <div className="mt-4 flex items-start">
          <input
            id="beta-acknowledge"
            name="beta-acknowledge"
            type="checkbox"
            checked={isAcknowledged}
            onChange={(e) => setIsAcknowledged(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5"
            aria-describedby="beta-warning-text"
          />
          <label htmlFor="beta-acknowledge" className="ml-3 block text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
            Eu entendo que este é um protótipo para fins de teste e não deve ser usado para diagnóstico ou tratamento de pacientes reais.
          </label>
        </div>
      </div>

      <div className="mt-10 flex flex-col sm:flex-row gap-4">
        <button
          onClick={onStartNewCase}
          disabled={!isAcknowledged}
          className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
        >
          Iniciar Novo Caso
        </button>
        <button
          onClick={onStartTraining}
          disabled={!isAcknowledged}
          className="px-8 py-4 bg-slate-100 text-slate-700 font-semibold rounded-lg shadow-md hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
        >
          Modo Treinamento
        </button>
      </div>
    </div>
  );
};

export default WelcomeScreen;