


import React, { useState, useEffect } from 'react';
import type { AnamnesisData } from '../types';
import { generateProntuarySummary } from '../services/geminiService';
import jsPDF from 'jspdf';
import DownloadIcon from './icons/DownloadIcon';
import FileTextIcon from './icons/FileTextIcon';


interface FinalAnamnesisModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: AnamnesisData | null;
  onSave: (finalText: string) => void;
  isSaving: boolean;
}

const formatAnamnesisForEditing = (data: AnamnesisData | null): string => {
    if (!data) return '';
    return `
# Idade:
${data.idade || ''}

# Sexo:
${data.sexo || ''}

# Comorbidades: (HAS, DM, DPOC, etc.)
${data.comorbidades || ''}

# Medicamentos em Uso:
${data.medicamentosEmUso || ''}

# Alergias:
${data.alergias || ''}

# História Pregressa Relevante: (Cirurgias, internações, hábitos importantes como tabagismo e etilismo)
${data.historiaPregressa || ''}

# Queixa Principal (QP): (Motivo principal da consulta, com tempo de evolução)
${data.queixaPrincipal || ''}

# História da Doença Atual (HDA): (Início, evolução, sintomas associados, tratamentos prévios)
${data.hda || ''}

# Sinais Vitais:
PA: ${data.pa || 'NI'}
FC: ${data.fc || 'NI'}
FR: ${data.fr || 'NI'}
Temp: ${data.temp || 'NI'}
SpO₂: ${data.spo2 || 'NI'}

# Peso/Altura (opcional):
${data.pesoAltura || ''}

# Exame Físico Sumário: (Inspeção geral, achados mais relevantes no segmento afetado)
${data.exameFisicoSumario || ''}

# Resultados de Exames Relevantes:
${data.resultadosExames || ''}

# Hipóteses Diagnósticas (Médico):
${data.hipotesesDiagnosticas || ''}

# Conduta Inicial (Médico):
${data.condutaInicial || ''}
`.trim();
};


const FinalAnamnesisModal: React.FC<FinalAnamnesisModalProps> = ({ isOpen, onClose, initialData, onSave, isSaving }) => {
  const [editedText, setEditedText] = useState('');
  const [summary, setSummary] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [copySummaryButtonText, setCopySummaryButtonText] = useState('Copiar Resumo');

  useEffect(() => {
    if (initialData) {
      setEditedText(formatAnamnesisForEditing(initialData));
    }
    // Reset states when modal opens with new data
    setSummary('');
    setIsGeneratingSummary(false);
    setCopySummaryButtonText('Copiar Resumo');
  }, [initialData]);
  
  const handleGenerateSummary = async () => {
    if (!initialData) return;
    setIsGeneratingSummary(true);
    setSummary('');
    try {
        const generatedSummary = await generateProntuarySummary(editedText);
        setSummary(generatedSummary);
    } catch (error) {
        console.error("Failed to generate summary:", error);
        setSummary("Falha ao gerar o resumo. Por favor, tente novamente.");
    } finally {
        setIsGeneratingSummary(false);
    }
  };
  
  const handleCopySummary = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary).then(() => {
      setCopySummaryButtonText('Copiado!');
      setTimeout(() => setCopySummaryButtonText('Copiar Resumo'), 2000);
    }).catch(err => {
      console.error('Failed to copy summary: ', err);
    });
  };

  const handleExportPdf = () => {
    if (!initialData) return;
    
    const doc = new jsPDF('p', 'mm', 'a4');
    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const usableWidth = pageWidth - 2 * margin;

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(11);

    const lines = doc.splitTextToSize(editedText, usableWidth);
    let cursorY = margin;

    lines.forEach((line: string) => {
        if (cursorY > pageHeight - margin) {
            doc.addPage();
            cursorY = margin;
        }
        
        if (line.startsWith('#')) {
            doc.setFont("Helvetica", "bold");
            doc.setFontSize(14);
            cursorY += 4; // Add space before titles
            doc.text(line.replace('#', '').trim(), margin, cursorY);
            cursorY += 8;
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
        } else {
            doc.text(line, margin, cursorY);
            cursorY += 6; // Line height
        }
    });
    
    const fileName = `anamnese_${initialData.queixaPrincipal?.substring(0, 20).replace(/\s+/g, '_') || 'paciente'}.pdf`;
    doc.save(fileName);
  };

  const handleSave = () => {
    onSave(editedText);
  };

  if (!isOpen || !initialData) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 transition-opacity duration-300" onClick={isSaving ? undefined : onClose}>
      <div className="bg-slate-100 dark:bg-slate-900 rounded-lg shadow-2xl w-full max-w-4xl h-[95vh] flex flex-col transform transition-all duration-300" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Revisão Final da Anamnese
          </h2>
          <button
            onClick={isSaving ? undefined : onClose}
            disabled={isSaving}
            className="p-1 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            aria-label="Fechar"
          >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="overflow-y-auto p-6 space-y-6">
          <textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            className="w-full h-full p-4 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 font-mono text-sm resize-none min-h-[300px]"
            placeholder="Edite a anamnese aqui..."
            disabled={isSaving}
          />
           <div className="space-y-3">
              <button
                type="button"
                onClick={handleGenerateSummary}
                disabled={isGeneratingSummary || isSaving}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                  <FileTextIcon className="-ml-1 mr-2 h-5 w-5" />
                  {isGeneratingSummary ? 'Gerando...' : 'Gerar Resumo para Prontuário'}
              </button>
              {(isGeneratingSummary || summary) && (
                  <div className="p-4 bg-slate-200 dark:bg-slate-800 rounded-md transition-all">
                      <h4 className="font-semibold text-md text-slate-800 dark:text-slate-200 mb-2">Resumo para Prontuário</h4>
                      {isGeneratingSummary ? (
                         <div className="space-y-2 animate-pulse">
                            <div className="h-3 bg-slate-300 dark:bg-slate-700 rounded-full w-full"></div>
                            <div className="h-3 bg-slate-300 dark:bg-slate-700 rounded-full w-5/6"></div>
                         </div>
                      ) : (
                        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{summary}</p>
                      )}
                      
                      {!isGeneratingSummary && summary && (
                        <button
                          type="button"
                          onClick={handleCopySummary}
                          className="mt-3 px-3 py-1.5 text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900/80"
                        >
                            {copySummaryButtonText}
                        </button>
                      )}
                  </div>
              )}
          </div>
        </div>

        <footer className="p-4 bg-slate-200 dark:bg-slate-800 border-t border-slate-300 dark:border-slate-700 shrink-0 flex justify-between items-center">
            <button
                type="button"
                onClick={handleExportPdf}
                disabled={isSaving}
                className="inline-flex items-center px-4 py-2 border border-slate-400 dark:border-slate-500 text-sm font-medium rounded-md text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
            >
                <DownloadIcon className="h-4 w-4 mr-2" />
                Exportar para PDF
            </button>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={isSaving ? undefined : onClose}
                disabled={isSaving}
                className="px-6 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-md text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                  Cancelar
              </button>
              <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center min-w-[160px]"
              >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Salvando...
                    </>
                  ) : "Salvar e Reavaliar"}
              </button>
            </div>
        </footer>
      </div>
    </div>
  );
};

export default FinalAnamnesisModal;