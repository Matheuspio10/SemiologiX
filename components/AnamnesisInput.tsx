
import React, { useState, useRef } from 'react';
import type { AnamnesisData, Specialty } from '../types';
import FileUploadIcon from './icons/FileUploadIcon';
import MicrophoneIcon from './icons/MicrophoneIcon';
import StopIcon from './icons/StopIcon';
import PaperclipIcon from './icons/PaperclipIcon';
import SaveIcon from './icons/SaveIcon';

type Difficulty = 'Fácil' | 'Intermediário' | 'Difícil' | 'Extremo';
const specialties: Specialty[] = ['Geral', 'Cardiologia', 'Pneumologia', 'Neurologia', 'Gastroenterologia', 'Nefrologia', 'Pediatria', 'Emergência', 'Gineco/Obstetricia', 'Ortopedia'];

interface AnamnesisInputProps {
  data: AnamnesisData;
  onChange: (field: keyof AnamnesisData, value: string) => void;
  isAnalyzing: boolean;
  isGeneratingCase: boolean;
  isParsingFile: boolean;
  isParsingExamFile: boolean;
  isRecording: boolean;
  isProcessingAudio: boolean;
  onClear: () => void;
  onAnalyze: () => void;
  onSaveCase: () => void;
  onGenerateTestCase: (difficulty: Difficulty, specialty: Specialty) => void;
  onImport: () => void;
  onImportExam: () => void;
  onToggleRecording: () => void;
  onImportAudio: () => void;
  isTrainingMode: boolean;
}

const FormField: React.FC<{ label: string; id: keyof AnamnesisData; children: React.ReactNode; description?: string; }> = ({ label, id, children, description }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
    {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-1.5">{description}</p>}
    {children}
  </div>
);

const SectionTitle: React.FC<{ title: string }> = ({ title }) => (
    <h3 className="text-md font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 pb-2 mb-4">{title}</h3>
);

const inputClasses = "w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900/50 placeholder:text-slate-400 dark:placeholder:text-slate-500 disabled:bg-slate-100 dark:disabled:bg-slate-800/50 disabled:cursor-not-allowed";
const textareaClasses = `${inputClasses} resize-y min-h-[60px]`;

const TrainingCaseGenerator: React.FC<{ onGenerate: (difficulty: Difficulty) => void, isLoading: boolean }> = ({ onGenerate, isLoading }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const difficulties: Difficulty[] = ['Fácil', 'Intermediário', 'Difícil', 'Extremo'];

    const handleSelect = (difficulty: Difficulty) => {
        onGenerate(difficulty);
        setIsOpen(false);
    };
    
    // Close dropdown if clicked outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            <div>
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    disabled={isLoading}
                    className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-100 dark:bg-blue-900/50 text-sm font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-blue-500 disabled:opacity-50"
                    id="options-menu"
                    aria-haspopup="true"
                    aria-expanded={isOpen}
                >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Gerando...
                      </>
                    ) : 'Novo Caso (Dificuldade)'}
                    <svg className="-mr-1 ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
            {isOpen && (
                <div
                    className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-slate-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="options-menu"
                >
                    <div className="py-1" role="none">
                        {difficulties.map(d => (
                             <button
                                key={d}
                                onClick={() => handleSelect(d)}
                                className="text-left w-full block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                role="menuitem"
                            >
                                {d}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};


const AnamnesisInput: React.FC<AnamnesisInputProps> = ({ data, onChange, isAnalyzing, isGeneratingCase, isParsingFile, isParsingExamFile, isRecording, isProcessingAudio, onClear, onAnalyze, onSaveCase, onGenerateTestCase, onImport, onImportExam, onToggleRecording, onImportAudio, isTrainingMode }) => {
  const anyLoading = isAnalyzing || isGeneratingCase || isParsingFile || isParsingExamFile || isProcessingAudio;
  const formDisabled = anyLoading || isTrainingMode || isRecording;
  const [selectedSpecialty, setSelectedSpecialty] = useState<Specialty>('Geral');
  
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md dark:border dark:border-slate-700 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <h2 className="block text-lg font-semibold text-slate-700 dark:text-slate-200 shrink-0">
          {isTrainingMode ? 'Caso Clínico (Treinamento)' : 'Registro de Anamnese'}
        </h2>
        
        {isTrainingMode ? (
          <div className="flex items-center gap-2 flex-wrap">
              <div className="relative inline-block text-left">
                  <label htmlFor="specialty-selector" className="sr-only">Especialidade</label>
                  <select
                      id="specialty-selector"
                      value={selectedSpecialty}
                      onChange={(e) => setSelectedSpecialty(e.target.value as Specialty)}
                      disabled={anyLoading}
                      className="inline-flex justify-center w-full rounded-md border border-slate-300 dark:border-slate-600 shadow-sm px-4 py-2.5 bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-blue-500 disabled:opacity-50"
                  >
                      {specialties.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
              </div>
              <TrainingCaseGenerator
                onGenerate={(difficulty) => onGenerateTestCase(difficulty, selectedSpecialty)}
                isLoading={isGeneratingCase}
              />
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={onToggleRecording}
                type="button"
                disabled={anyLoading && !isRecording}
                className={`relative px-3 py-2 text-sm font-medium border rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center
                ${isRecording 
                    ? 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800 dark:hover:bg-red-900/80'
                    : 'bg-blue-100 text-blue-700 border-transparent hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900/80'
                }`}
                aria-label={isRecording ? 'Parar gravação' : 'Gravar anamnese por áudio'}
              >
                  {isRecording ? (
                    <>
                      <StopIcon className="-ml-1 mr-2 h-4 w-4" />
                      Parar
                    </>
                  ) : (
                    <MicrophoneIcon className="-ml-1 mr-2 h-4 w-4" />
                  )}
                  {isRecording ? (
                    'Gravando...'
                  ) : (
                    'Gravar Áudio'
                  )}
                  {isRecording && <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>}
              </button>
              <button
                  onClick={onImportAudio}
                  type="button"
                  disabled={anyLoading || isRecording}
                  className="px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/50 border border-transparent rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  aria-label="Importar anamnese de um arquivo de áudio"
                >
                  <PaperclipIcon className="-ml-1 mr-2 h-4 w-4" />
                  Anexar Áudio
              </button>
              <button
              onClick={onImport}
              type="button"
              disabled={anyLoading || isRecording}
              className="px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/50 border border-transparent rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              aria-label="Importar anamnese de arquivo PDF ou TXT"
            >
              {isParsingFile ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Processando...
                </>
              ) : (
                <>
                  <FileUploadIcon className="-ml-1 mr-2 h-4 w-4" />
                  Importar (TXT/PDF)
                </>
              )}
             </button>
            <button
                onClick={onSaveCase}
                type="button"
                disabled={anyLoading || isRecording || !data.queixaPrincipal}
                className="px-3 py-2 text-sm font-medium text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/50 border border-transparent rounded-md hover:bg-green-200 dark:hover:bg-green-900/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                aria-label="Salvar caso no histórico"
            >
                <SaveIcon className="-ml-1 mr-2 h-4 w-4" />
                Salvar Caso
            </button>
            <button
              onClick={onClear}
              type="button"
              disabled={anyLoading || isRecording}
              className="px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-200 dark:border-slate-600 dark:text-slate-300 dark:bg-slate-700 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Limpar formulário"
            >
              Limpar
            </button>
          </div>
        )}
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        {isTrainingMode ? 'Escolha a especialidade e dificuldade. Depois, submeta suas hipóteses no painel central.' : 'Preencha os campos, grave um áudio ou importe um arquivo. Depois, clique em \'Analisar Hipóteses\'.'}
      </p>
      <div className="flex-grow overflow-y-auto pr-2 space-y-6">

        {/* --- DADOS DO PACIENTE --- */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <FormField label="Idade" id="idade">
                <input type="number" id="idade" value={data.idade} onChange={(e) => onChange('idade', e.target.value)} className={inputClasses} placeholder="Ex: 45" disabled={formDisabled} />
             </FormField>
             <FormField label="Sexo" id="sexo">
                 <select id="sexo" value={data.sexo} onChange={(e) => onChange('sexo', e.target.value as AnamnesisData['sexo'])} className={inputClasses} disabled={formDisabled}>
                      <option value="">Selecione...</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Feminino">Feminino</option>
                      <option value="Outro">Outro</option>
                 </select>
             </FormField>
          </div>
          <FormField label="Comorbidades" id="comorbidades" description="(HAS, DM, DPOC, etc.)">
              <textarea id="comorbidades" value={data.comorbidades} onChange={(e) => onChange('comorbidades', e.target.value)} className={textareaClasses} placeholder="Ex: Hipertensão, Diabetes tipo 2" rows={2} disabled={formDisabled}/>
          </FormField>
          <FormField label="Medicamentos em Uso" id="medicamentosEmUso">
              <textarea id="medicamentosEmUso" value={data.medicamentosEmUso} onChange={(e) => onChange('medicamentosEmUso', e.target.value)} className={textareaClasses} placeholder="Ex: Losartana 50mg/dia" rows={2} disabled={formDisabled}/>
          </FormField>
          <FormField label="Alergias" id="alergias">
              <textarea id="alergias" value={data.alergias} onChange={(e) => onChange('alergias', e.target.value)} className={textareaClasses} placeholder="Ex: Alergia a dipirona" rows={2} disabled={formDisabled}/>
          </FormField>
          <FormField label="História Pregressa Relevante" id="historiaPregressa" description="(Cirurgias, internações, hábitos importantes como tabagismo e etilismo)">
              <textarea id="historiaPregressa" value={data.historiaPregressa} onChange={(e) => onChange('historiaPregressa', e.target.value)} className={textareaClasses} placeholder="Ex: Apendicectomia em 2010. Nega tabagismo." rows={2} disabled={formDisabled}/>
          </FormField>
        </div>

        {/* --- CONSULTA ATUAL --- */}
        <div className="space-y-4">
          <FormField label="Queixa Principal (QP)" id="queixaPrincipal" description="(Motivo principal da consulta, com tempo de evolução)">
            <textarea id="queixaPrincipal" value={data.queixaPrincipal} onChange={(e) => onChange('queixaPrincipal', e.target.value)} className={textareaClasses} placeholder="Ex: Febre alta e dor de garganta há 3 dias." rows={2} disabled={formDisabled}/>
          </FormField>
          <FormField label="História da Doença Atual (HDA)" id="hda" description="(Início, evolução, sintomas associados, tratamentos prévios)">
            <textarea id="hda" value={data.hda} onChange={(e) => onChange('hda', e.target.value)} className={textareaClasses} placeholder={isRecording ? "Gravando... A transcrição será processada e preenchida aqui ao finalizar." : "Detalhe a evolução dos sintomas, fatores de melhora/piora, etc."} rows={4} disabled={formDisabled} />
          </FormField>
        </div>

        {/* --- EXAME FÍSICO --- */}
        <div className="space-y-4">
          <SectionTitle title="Exame Físico e Resultados" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <FormField label="PA" id="pa"><input type="text" id="pa" value={data.pa} onChange={(e) => onChange('pa', e.target.value)} className={inputClasses} placeholder="120/80" disabled={formDisabled}/></FormField>
              <FormField label="FC" id="fc"><input type="text" id="fc" value={data.fc} onChange={(e) => onChange('fc', e.target.value)} className={inputClasses} placeholder="80 bpm" disabled={formDisabled}/></FormField>
              <FormField label="FR" id="fr"><input type="text" id="fr" value={data.fr} onChange={(e) => onChange('fr', e.target.value)} className={inputClasses} placeholder="16 ipm" disabled={formDisabled}/></FormField>
              <FormField label="Temp" id="temp"><input type="text" id="temp" value={data.temp} onChange={(e) => onChange('temp', e.target.value)} className={inputClasses} placeholder="37.8°C" disabled={formDisabled}/></FormField>
              <FormField label="SpO₂" id="spo2"><input type="text" id="spo2" value={data.spo2} onChange={(e) => onChange('spo2', e.target.value)} className={inputClasses} placeholder="98%" disabled={formDisabled}/></FormField>
          </div>
           <FormField label="Peso/Altura (opcional)" id="pesoAltura">
                <input type="text" id="pesoAltura" value={data.pesoAltura} onChange={(e) => onChange('pesoAltura', e.target.value)} className={inputClasses} placeholder="75kg / 1.80m" disabled={formDisabled}/>
           </FormField>
           <FormField label="Exame Físico Sumário" id="exameFisicoSumario" description="(Inspeção geral, achados mais relevantes no segmento afetado)">
              <textarea id="exameFisicoSumario" value={data.exameFisicoSumario} onChange={(e) => onChange('exameFisicoSumario', e.target.value)} className={textareaClasses} placeholder="Ex: BEG, corado, hidratado. Oroscopia com hiperemia e placas purulentas em amígdalas..." rows={3} disabled={formDisabled}/>
           </FormField>
           <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="resultadosExames" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Resultados de Exames Relevantes</label>
                <button
                    onClick={onImportExam}
                    type="button"
                    disabled={formDisabled}
                    className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/50 border border-transparent rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    aria-label="Importar resultados de exames de um arquivo"
                >
                {isParsingExamFile ? (
                    <>
                    <svg className="animate-spin -ml-0.5 mr-1.5 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Processando...
                    </>
                ) : (
                    <>
                    <FileUploadIcon className="-ml-0.5 mr-1 h-3 w-3" />
                    Importar
                    </>
                )}
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-1.5">(Laboratoriais, imagem, etc. ou importe de um PDF/TXT)</p>
              <textarea id="resultadosExames" value={data.resultadosExames} onChange={(e) => onChange('resultadosExames', e.target.value)} className={textareaClasses} placeholder="Ex: Hemograma: Leucócitos 15.000, Hb 10.2. Troponina: 0.8 ng/mL. RX Tórax: sem alterações." rows={3} disabled={formDisabled}/>
           </div>
        </div>
        
        {/* --- PLANO MÉDICO --- */}
        <div className="space-y-4">
           <SectionTitle title="Plano Clínico" />
           <FormField label="Hipóteses Diagnósticas" id="hipotesesDiagnosticas">
              <textarea id="hipotesesDiagnosticas" value={data.hipotesesDiagnosticas} onChange={(e) => onChange('hipotesesDiagnosticas', e.target.value)} className={textareaClasses} placeholder="Registre suas hipóteses diagnósticas aqui..." rows={3} disabled={formDisabled}/>
           </FormField>
           <FormField label="Conduta Inicial" id="condutaInicial">
              <textarea id="condutaInicial" value={data.condutaInicial} onChange={(e) => onChange('condutaInicial', e.target.value)} className={textareaClasses} placeholder="Registre a conduta inicial, exames solicitados, etc..." rows={3} disabled={formDisabled}/>
           </FormField>
        </div>
      </div>
      <div className="mt-auto pt-6">
        {!isTrainingMode && (
          <button
            type="button"
            onClick={onAnalyze}
            disabled={anyLoading || isRecording}
            className="w-full flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
          >
            {isAnalyzing || isProcessingAudio ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isProcessingAudio ? 'Processando Áudio...' : 'Analisando...'}
              </>
            ) : 'Analisar Hipóteses'}
          </button>
        )}
      </div>
    </div>
  );
};

export default AnamnesisInput;
