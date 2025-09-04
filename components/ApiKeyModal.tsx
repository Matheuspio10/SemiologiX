import React, { useState, useEffect } from 'react';
import KeyIcon from './icons/KeyIcon';

interface ApiKeyModalProps {
  isOpen: boolean;
  onSave: (apiKey: string) => void;
  currentKey: string | null;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onSave, currentKey }) => {
  const [apiKeyInput, setApiKeyInput] = useState('');

  useEffect(() => {
    if (currentKey) {
        setApiKeyInput(currentKey);
    }
  }, [currentKey]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKeyInput.trim()) {
      onSave(apiKeyInput.trim());
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div 
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
        aria-labelledby="api-key-modal-title"
        role="dialog"
        aria-modal="true"
    >
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-md m-4 transform transition-all">
        <form onSubmit={handleSubmit}>
          <div className="p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
                <KeyIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            </div>
            <h3 className="mt-4 text-lg font-semibold leading-6 text-slate-900 dark:text-slate-100" id="api-key-modal-title">
              Configure sua Chave de API
            </h3>
            <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              <p>
                Para utilizar o SemiologiX, você precisa de uma chave de API do Google Gemini.
              </p>
               <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                Obtenha sua chave aqui.
              </a>
            </div>
            <div className="mt-4">
              <label htmlFor="api-key-input" className="sr-only">Chave de API do Google Gemini</label>
              <input
                type="password"
                id="api-key-input"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900/50 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                placeholder="Cole sua chave de API aqui"
                required
              />
            </div>
             <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Sua chave é salva apenas no seu navegador e nunca é enviada para nossos servidores.
            </p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 rounded-b-lg">
            <button
              type="submit"
              disabled={!apiKeyInput.trim()}
              className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
            >
              Salvar e Continuar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApiKeyModal;