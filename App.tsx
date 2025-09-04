import React, { useState, useCallback, useEffect, useRef } from 'react';
import Header from './components/Header';
import AnamnesisInput from './components/AnamnesisInput';
import DiagnosisDisplay from './components/DiagnosisDisplay';
import SummaryPanel from './components/SummaryPanel';
import DiagnosisDetailModal from './components/DiagnosisDetailModal';
import FinalAnamnesisModal from './components/FinalAnamnesisModal';
import TrainingModeDisplay from './components/TrainingModeDisplay';
import CaseHistorySidebar from './components/CaseHistorySidebar';
import WelcomeScreen from './components/WelcomeScreen';
import ApiKeyModal from './components/ApiKeyModal';
import { initializeAi, fetchDiagnoses, fetchDiagnosisDetails, integrateFeedback, generateTestCase, parseAnamnesisText, summarizeExamResults, fetchTimelineFromHDA, evaluateStudentPerformance, fetchInvestigationResult, transcribeAndParseAnamnesisFromAudio } from './services/geminiService';
import type { Diagnosis, AnamnesisData, DiagnosisDetail, RetroFeedbackData, TimelineEvent, EvaluationResult, InvestigationLogEntry, Specialty, StudentPlan, SavedCase } from './types';
import * as pdfjsLib from 'pdfjs-dist';

// Configura o worker do PDF.js para rodar em segundo plano, essencial para performance.
// O caminho aponta para o worker hospedado na CDN, conforme definido no importmap.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.4.168/build/pdf.worker.mjs`;

const initialAnamnesisState: AnamnesisData = {
  idade: '',
  sexo: '',
  comorbidades: '',
  medicamentosEmUso: '',
  alergias: '',
  historiaPregressa: '',
  queixaPrincipal: '',
  hda: '',
  pa: '',
  fc: '',
  fr: '',
  temp: '',
  spo2: '',
  pesoAltura: '',
  exameFisicoSumario: '',
  resultadosExames: '',
  hipotesesDiagnosticas: '',
  condutaInicial: '',
  diagnosticoCorreto: '',
  resumoDiagnostico: '',
  hiddenPhysicalExam: '',
  hiddenLabResults: '',
};

type Difficulty = 'Fácil' | 'Intermediário' | 'Difícil' | 'Extremo';

// Helper to ensure data from external sources is clean, especially for numeric fields.
const cleanAnamnesisData = (data: AnamnesisData): AnamnesisData => {
    const cleanedData = { ...data };
    // Extracts the first sequence of digits from the age string to ensure compatibility with the number input.
    if (cleanedData.idade && typeof cleanedData.idade === 'string') {
        const match = cleanedData.idade.match(/\d+/);
        cleanedData.idade = match ? match[0] : '';
    }
    return cleanedData;
};

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [anamnesisData, setAnamnesisData] = useState<AnamnesisData>(initialAnamnesisState);
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [differentialDiagnoses, setDifferentialDiagnoses] = useState<Diagnosis[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGeneratingCase, setIsGeneratingCase] = useState<boolean>(false);
  const [isParsingFile, setIsParsingFile] = useState<boolean>(false);
  const [isParsingExamFile, setIsParsingExamFile] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisRequested, setAnalysisRequested] = useState<boolean>(false);
  const [isInvestigationLoading, setIsInvestigationLoading] = useState<boolean>(false);
  const [isWelcomeScreenVisible, setIsWelcomeScreenVisible] = useState(true);

  // State for the details modal (multi-select)
  const [selectedDiagnoses, setSelectedDiagnoses] = useState<Diagnosis[]>([]);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  // State for the final review modal
  const [finalAnamnesisData, setFinalAnamnesisData] = useState<AnamnesisData | null>(null);
  const [isSavingFinal, setIsSavingFinal] = useState<boolean>(false);

  // State for Training Mode
  const [isTrainingMode, setIsTrainingMode] = useState<boolean>(false);
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);
  const [investigationLog, setInvestigationLog] = useState<InvestigationLogEntry[]>([]);

  // State for Audio Input
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState<boolean>(false);
  
  // State for Case History
  const [savedCases, setSavedCases] = useState<SavedCase[]>([]);
  const [isHistorySidebarOpen, setIsHistorySidebarOpen] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const examFileInputRef = useRef<HTMLInputElement>(null);
  const audioFileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const storedApiKey = localStorage.getItem('gemini_api_key');
    if (storedApiKey) {
      handleApiKeySave(storedApiKey);
    } else {
      setIsApiKeyModalOpen(true);
    }
  }, []);

  // Load saved cases from localStorage on initial mount
  useEffect(() => {
    try {
      const storedCases = localStorage.getItem('semiologix_cases');
      if (storedCases) {
        setSavedCases(JSON.parse(storedCases));
      }
    } catch (error) {
      console.error("Failed to load cases from localStorage", error);
      setSavedCases([]);
    }
  }, []);
  
  const handleApiKeySave = (newApiKey: string) => {
    if (newApiKey) {
        setApiKey(newApiKey);
        initializeAi(newApiKey);
        localStorage.setItem('gemini_api_key', newApiKey);
        setIsApiKeyModalOpen(false);
    }
  };
  
  const resetState = (showWelcomeScreen = true) => {
    setAnamnesisData(initialAnamnesisState);
    setDiagnoses([]);
    setDifferentialDiagnoses([]);
    setTimelineEvents([]);
    setError(null);
    setAnalysisRequested(false);
    setEvaluationResult(null);
    setInvestigationLog([]);
    setSelectedDiagnoses([]);
    setIsWelcomeScreenVisible(showWelcomeScreen);
  };

  const updateStoredCases = (cases: SavedCase[]) => {
    try {
        localStorage.setItem('semiologix_cases', JSON.stringify(cases));
    } catch (error) {
        console.error("Failed to save cases to localStorage", error);
        // Optionally, inform the user that saving failed.
        alert('Não foi possível salvar os casos no armazenamento local. O espaço pode estar cheio.');
    }
  };

  const handleAnamnesisChange = useCallback((field: keyof AnamnesisData, value: string) => {
    setAnamnesisData(prev => ({ ...prev, [field]: value as any }));
  }, []);

  const handleClearForm = useCallback(() => {
    resetState(true);
    if(isTrainingMode) {
      setIsTrainingMode(false);
    }
  }, [isTrainingMode]);
  
  const handleSaveCase = () => {
    if (isTrainingMode || !anamnesisData.queixaPrincipal) {
        alert("É necessário preencher ao menos a queixa principal para salvar um caso.");
        return;
    }

    const newCase: SavedCase = {
        id: Date.now().toString(),
        name: `Paciente - ${new Date().toLocaleString('pt-BR')}`,
        savedAt: new Date().toISOString(),
        anamnesisData,
        diagnoses,
        differentialDiagnoses,
        timelineEvents
    };

    const updatedCases = [newCase, ...savedCases];
    setSavedCases(updatedCases);
    updateStoredCases(updatedCases);
    alert("Caso salvo com sucesso!");
  };

  const handleLoadCase = (caseId: string) => {
    const caseToLoad = savedCases.find(c => c.id === caseId);
    if (caseToLoad) {
        resetState(false);
        setAnamnesisData(cleanAnamnesisData(caseToLoad.anamnesisData));
        setDiagnoses(caseToLoad.diagnoses);
        setDifferentialDiagnoses(caseToLoad.differentialDiagnoses);
        setTimelineEvents(caseToLoad.timelineEvents);
        setAnalysisRequested(true);
        if (isTrainingMode) setIsTrainingMode(false);
        setIsHistorySidebarOpen(false);
    }
  };

  const handleDeleteCase = (caseId: string) => {
    if (window.confirm("Tem certeza que deseja apagar este caso? Esta ação não pode ser desfeita.")) {
        const updatedCases = savedCases.filter(c => c.id !== caseId);
        setSavedCases(updatedCases);
        updateStoredCases(updatedCases);
    }
  };

  const handleToggleHistory = () => {
    setIsHistorySidebarOpen(prev => !prev);
  };

  const handleToggleTrainingMode = () => {
    setIsTrainingMode(prev => !prev);
    resetState(true);
  };

  const handleGenerateTestCase = useCallback(async (difficulty: Difficulty, specialty: Specialty = 'Geral') => {
    setIsGeneratingCase(true);
    resetState(false);
    setInvestigationLog([{
        type: 'system',
        content: `Novo caso clínico (Especialidade: ${specialty}, Dificuldade: ${difficulty}) gerado. Inicie sua investigação.`,
        timestamp: new Date().toISOString()
    }]);
    try {
      const testCaseData = await generateTestCase(difficulty, specialty);
      setAnamnesisData(cleanAnamnesisData(testCaseData));
    } catch (err) {
      setError("Falha ao gerar o caso de teste. Tente novamente.");
      setInvestigationLog([]);
    } finally {
      setIsGeneratingCase(false);
    }
  }, []);

  const runAnalysis = useCallback(async (dataToAnalyze: AnamnesisData) => {
    setIsLoading(true);
    setError(null);
    setAnalysisRequested(true);
    setDiagnoses([]);
    setDifferentialDiagnoses([]);
    setSelectedDiagnoses([]);
    // Only fetch timeline if not in training mode or if it's empty
    if (!isTrainingMode || timelineEvents.length === 0) {
      setTimelineEvents([]);
    }

    try {
      // In training mode, we don't need to re-fetch timeline if already present
      const timelinePromise = (isTrainingMode && timelineEvents.length > 0)
        ? Promise.resolve(timelineEvents)
        : fetchTimelineFromHDA(dataToAnalyze.hda);

      const [diagnosesResult, timelineResult] = await Promise.all([
        fetchDiagnoses(dataToAnalyze),
        timelinePromise
      ]);
      
      const allDiagnoses = [...(diagnosesResult.diagnosticosProvaveis || []), ...(diagnosesResult.diagnosticosDiferenciais || [])];
      
      const uniqueDiagnosesMap = new Map<string, Diagnosis>();
      allDiagnoses.forEach(diag => {
        const existing = uniqueDiagnosesMap.get(diag.diagnostico.toLowerCase());
        if (!existing || diag.probabilidade > existing.probabilidade) {
            uniqueDiagnosesMap.set(diag.diagnostico.toLowerCase(), diag);
        }
      });
      const uniqueDiagnoses = Array.from(uniqueDiagnosesMap.values());

      const probables = uniqueDiagnoses.filter(d => d.probabilidade > 10).sort((a, b) => b.probabilidade - a.probabilidade);
      const zebras = uniqueDiagnoses.filter(d => d.probabilidade <= 10).sort((a, b) => b.probabilidade - a.probabilidade);
        
      setDiagnoses(probables);
      setDifferentialDiagnoses(zebras);
      if (!isTrainingMode || timelineEvents.length === 0) {
        setTimelineEvents(timelineResult);
      }

    } catch (err) {
      setError('Falha ao obter diagnósticos. Verifique sua conexão ou a chave de API.');
      setDiagnoses([]);
      setDifferentialDiagnoses([]);
      setTimelineEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, [isTrainingMode, timelineEvents]);

  const handleInvestigationRequest = async (request: string) => {
    if (!request.trim()) return;
    setIsInvestigationLoading(true);

    const newRequestLog: InvestigationLogEntry = {
        type: 'request',
        content: request,
        timestamp: new Date().toISOString()
    };
    setInvestigationLog(prev => [...prev, newRequestLog]);

    try {
        const result = await fetchInvestigationResult(request, anamnesisData.hiddenPhysicalExam || '', anamnesisData.hiddenLabResults || '');
        const newResponseLog: InvestigationLogEntry = {
            type: 'response',
            content: result,
            timestamp: new Date().toISOString()
        };
        setInvestigationLog(prev => [...prev, newResponseLog]);
    } catch (err: any) {
        const errorLog: InvestigationLogEntry = {
            type: 'system',
            content: err.message || 'Erro ao buscar resultado da investigação.',
            timestamp: new Date().toISOString()
        };
        setInvestigationLog(prev => [...prev, errorLog]);
    } finally {
        setIsInvestigationLoading(false);
    }
  };
  
  const handleSubmitStudentAnalysis = async (submission: { principal: string, diferenciais: string[] }, plan: StudentPlan) => {
    setIsLoading(true);
    setError(null);
    setEvaluationResult(null);
    
    // First, get the AI evaluation of the student's performance
    const evaluationPromise = evaluateStudentPerformance(anamnesisData, submission, investigationLog, plan);
    
    // Simultaneously, run the standard diagnosis to get the AI's own hypotheses for comparison
    const analysisPromise = runAnalysis(anamnesisData);

    try {
        const [evalResult] = await Promise.all([evaluationPromise, analysisPromise]);
        setEvaluationResult(evalResult);
    } catch (err: any) {
        setError(err.message || "Falha ao avaliar a análise do estudante.");
        setIsLoading(false); // Stop loading on error
    }
    // setIsLoading is handled by runAnalysis
  };


  const handleAnalysis = useCallback(async () => {
    const combinedText = `${anamnesisData.queixaPrincipal} ${anamnesisData.hda}`.trim();
    if (combinedText.length < 20) {
      setError('Por favor, preencha a Queixa Principal e a HDA com mais detalhes antes de analisar.');
      setDiagnoses([]);
      setDifferentialDiagnoses([]);
      setAnalysisRequested(true);
      return;
    }
    runAnalysis(anamnesisData);
  }, [anamnesisData, runAnalysis]);

  const handleToggleDiagnosisSelection = useCallback((diagnosis: Diagnosis) => {
    setSelectedDiagnoses(prev => {
      const isSelected = prev.some(d => d.diagnostico === diagnosis.diagnostico);
      if (isSelected) {
        return prev.filter(d => d.diagnostico !== diagnosis.diagnostico);
      } else {
        return [...prev, diagnosis];
      }
    });
  }, []);

  const handleInvestigateSelected = () => {
    if (selectedDiagnoses.length > 0) {
      setIsDetailModalOpen(true);
    }
  };

  const handleSelectCustomDiagnosis = useCallback((diagnosisText: string) => {
    const customDiagnosis: Diagnosis = {
      diagnostico: diagnosisText,
      probabilidade: 0, // Indeterminate
      justificativa: 'Diagnóstico inserido manualmente para investigação.',
    };
    setSelectedDiagnoses([customDiagnosis]);
    setIsDetailModalOpen(true);
  }, []);
  
  const handleFileImport = useCallback(async (file: File) => {
    if (!file) return;

    setIsParsingFile(true);
    resetState(false);

    try {
      let textContent = '';
      if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const numPages = pdf.numPages;
        
        let fullText = '';
        for (let i = 1; i <= numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            fullText += content.items.map(item => (item as any).str).join(' ');
        }
        textContent = fullText;
      } else if (file.type === 'text/plain') {
        textContent = await file.text();
      } else {
        throw new Error('Formato de arquivo não suportado. Use .pdf ou .txt');
      }

      if (!textContent.trim()) {
        throw new Error('O arquivo está vazio ou não foi possível extrair texto.');
      }
      
      const parsedData = await parseAnamnesisText(textContent);
      setAnamnesisData(cleanAnamnesisData(parsedData));

    } catch (err: any) {
        setError(err.message || 'Falha ao processar o arquivo. Tente novamente.');
    } finally {
        setIsParsingFile(false);
        // Reseta o valor do input para permitir o re-upload do mesmo arquivo
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }
  }, []);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const onFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileImport(file);
    }
  };

  const handleImportExamClick = () => {
    examFileInputRef.current?.click();
  };

  const handleExamFileImport = useCallback(async (file: File) => {
    if (!file) return;

    setIsParsingExamFile(true);
    setError(null); // Clear previous errors

    try {
      let textContent = '';
      if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const numPages = pdf.numPages;
        
        let fullText = '';
        for (let i = 1; i <= numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            fullText += content.items.map(item => (item as any).str).join(' ');
        }
        textContent = fullText;
      } else if (file.type === 'text/plain') {
        textContent = await file.text();
      } else {
        throw new Error('Formato de arquivo não suportado. Use .pdf ou .txt');
      }

      if (!textContent.trim()) {
        throw new Error('O arquivo de exames está vazio ou não foi possível extrair texto.');
      }
      
      // Send the raw text to be summarized by the AI
      const summarizedText = await summarizeExamResults(textContent);

      setAnamnesisData(prev => ({
        ...prev,
        resultadosExames: summarizedText
      }));

    } catch (err: any) {
        setError(err.message || 'Falha ao processar o arquivo de exames.');
    } finally {
        setIsParsingExamFile(false);
        if (examFileInputRef.current) {
            examFileInputRef.current.value = '';
        }
    }
  }, []);

  const onExamFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleExamFileImport(file);
    }
  };

  const processRecordedAudio = useCallback(async (audioBlob: Blob) => {
    setIsProcessingAudio(true);
    resetState(false);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          if (base64Audio) {
              const parsedData = await transcribeAndParseAnamnesisFromAudio(base64Audio, audioBlob.type);
              setAnamnesisData(cleanAnamnesisData(parsedData));
          } else {
              throw new Error("Falha ao converter áudio para base64.");
          }
          setIsProcessingAudio(false);
      };
      reader.onerror = () => {
        setIsProcessingAudio(false);
        throw new Error('Falha ao ler o arquivo de áudio.');
      }
    } catch (err: any) {
      setError(err.message || 'Falha ao processar o áudio gravado.');
      setIsProcessingAudio(false);
    }
  }, []);

  const handleToggleRecording = useCallback(() => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      // The onstop event handler will do the rest.
      return;
    }

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          setIsRecording(true);
          
          const options = { mimeType: 'audio/webm' };
          let mediaRecorder;
          try {
              mediaRecorder = new MediaRecorder(stream, options);
          } catch (e) {
              console.warn(`MIME type 'audio/webm' is not supported. Trying default.`);
              mediaRecorder = new MediaRecorder(stream);
          }
          
          mediaRecorderRef.current = mediaRecorder;
          audioChunksRef.current = [];

          mediaRecorder.addEventListener("dataavailable", event => {
            if (event.data.size > 0) {
              audioChunksRef.current.push(event.data);
            }
          });

          mediaRecorder.addEventListener("stop", () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
            processRecordedAudio(audioBlob);
            stream.getTracks().forEach(track => track.stop());
            setIsRecording(false);
          });
          
          mediaRecorder.start();
        })
        .catch(err => {
          console.error(`The following getUserMedia error occurred: ${err}`);
          setError("Não foi possível acessar o microfone. Verifique as permissões do seu navegador.");
        });
    } else {
        setError("API de gravação não é suportada neste navegador.");
    }
  }, [isRecording, processRecordedAudio, setIsRecording, setError]);


  const handleImportAudioClick = () => {
    audioFileInputRef.current?.click();
  };

  const onAudioFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
          alert('A importação de arquivos de áudio ainda não é suportada. Por favor, use a gravação por microfone.');
      }
      if(audioFileInputRef.current) {
          audioFileInputRef.current.value = '';
      }
  };

  const handleCloseModal = () => {
    setIsDetailModalOpen(false);
    setSelectedDiagnoses([]);
  };
  
  const handleReevaluate = useCallback(async (feedback: RetroFeedbackData) => {
    handleCloseModal();
    setIsLoading(true);
    setError(null);
    try {
      const updatedAnamnesis = await integrateFeedback(anamnesisData, feedback);
      setAnamnesisData(cleanAnamnesisData(updatedAnamnesis));
      await runAnalysis(updatedAnamnesis);
    } catch (err) {
      setError('Falha ao incorporar feedback e reavaliar.');
      setIsLoading(false);
    }
  }, [anamnesisData, runAnalysis]);

  const handleFinalize = useCallback(async (feedback: RetroFeedbackData) => {
    handleCloseModal();
    setIsLoading(true);
    setError(null);
    try {
      const updatedAnamnesis = await integrateFeedback(anamnesisData, feedback);
      setFinalAnamnesisData(updatedAnamnesis);
    } catch (err) {
      setError('Falha ao preparar a anamnese final.');
    } finally {
      setIsLoading(false);
    }
  }, [anamnesisData]);

  const handleCloseFinalAnamnesis = () => {
    if (isSavingFinal) return;
    setFinalAnamnesisData(null);
  };

  const handleSaveFinalAnamnesis = async (finalText: string) => {
    setIsSavingFinal(true);
    setError(null);
    try {
      const parsedData = await parseAnamnesisText(finalText);
      setAnamnesisData(cleanAnamnesisData(parsedData));
      setFinalAnamnesisData(null); // Close modal on success
      runAnalysis(parsedData);
    } catch (err: any) {
      alert(`Falha ao salvar a anamnese: ${err.message}. Verifique o formato do texto e tente novamente.`);
    } finally {
      setIsSavingFinal(false);
    }
  };
  
  const allDiagnoses = [...diagnoses, ...differentialDiagnoses].sort((a,b) => b.probabilidade - a.probabilidade);

  const handleStartNewCase = () => {
    if (isTrainingMode) setIsTrainingMode(false);
    resetState(false);
  };
  
  const handleStartTraining = () => {
    if (!isTrainingMode) setIsTrainingMode(true);
    resetState(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <Header 
        isTrainingMode={isTrainingMode} 
        onToggleTrainingMode={handleToggleTrainingMode} 
        onToggleHistory={handleToggleHistory} 
        onShowApiKeyModal={() => setIsApiKeyModalOpen(true)}
        isLoading={isLoading || isGeneratingCase} 
      />
      <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-grow flex">
        <input
            type="file"
            ref={fileInputRef}
            onChange={onFileSelected}
            accept=".pdf,.txt"
            style={{ display: 'none' }}
            aria-hidden="true"
        />
        <input
            type="file"
            ref={examFileInputRef}
            onChange={onExamFileSelected}
            accept=".pdf,.txt"
            style={{ display: 'none' }}
            aria-hidden="true"
        />
         <input
            type="file"
            ref={audioFileInputRef}
            onChange={onAudioFileSelected}
            accept="audio/*"
            style={{ display: 'none' }}
            aria-hidden="true"
        />
        
        {isWelcomeScreenVisible && !isApiKeyModalOpen ? (
            <div className="w-full">
                <WelcomeScreen 
                    onStartNewCase={handleStartNewCase}
                    onStartTraining={handleStartTraining}
                />
            </div>
        ) : !isApiKeyModalOpen ? (
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1.8fr)_minmax(320px,0.8fr)] gap-6 h-full w-full">
                <div className="h-full">
                    <AnamnesisInput
                    data={anamnesisData}
                    onChange={handleAnamnesisChange}
                    isAnalyzing={isLoading}
                    isGeneratingCase={isGeneratingCase}
                    isParsingFile={isParsingFile}
                    isParsingExamFile={isParsingExamFile}
                    isRecording={isRecording}
                    isProcessingAudio={isProcessingAudio}
                    onClear={handleClearForm}
                    onAnalyze={handleAnalysis}
                    onSaveCase={handleSaveCase}
                    onGenerateTestCase={handleGenerateTestCase}
                    onImport={handleImportClick}
                    onImportExam={handleImportExamClick}
                    onToggleRecording={handleToggleRecording}
                    onImportAudio={handleImportAudioClick}
                    isTrainingMode={isTrainingMode}
                    />
                </div>
                <div className="h-full">
                    {isTrainingMode ? (
                    <TrainingModeDisplay
                        isLoading={isLoading || isGeneratingCase}
                        isInvestigationLoading={isInvestigationLoading}
                        evaluationResult={evaluationResult}
                        correctDiagnosis={anamnesisData.diagnosticoCorreto || ''}
                        correctRationale={anamnesisData.resumoDiagnostico || ''}
                        aiDiagnoses={allDiagnoses}
                        onSubmit={handleSubmitStudentAnalysis}
                        onInvestigationRequest={handleInvestigationRequest}
                        investigationLog={investigationLog}
                        hasCase={!!anamnesisData.queixaPrincipal}
                        error={error}
                    />
                    ) : (
                    <DiagnosisDisplay
                        diagnoses={diagnoses}
                        differentialDiagnoses={differentialDiagnoses}
                        isLoading={isLoading}
                        isTimelineLoading={isLoading}
                        timelineEvents={timelineEvents}
                        error={error}
                        analysisRequested={analysisRequested}
                        selectedDiagnoses={selectedDiagnoses}
                        onToggleDiagnosis={handleToggleDiagnosisSelection}
                        onInvestigate={handleInvestigateSelected}
                        onSelectCustomDiagnosis={handleSelectCustomDiagnosis}
                        hda={anamnesisData.hda}
                    />
                    )}
                </div>
                <div className="h-full hidden lg:block">
                    <SummaryPanel
                    anamnesisData={anamnesisData}
                    diagnoses={allDiagnoses}
                    isLoading={isLoading || isGeneratingCase}
                    />
                </div>
            </div>
        ) : null}
      </main>
      <footer className="w-full text-center text-sm text-slate-500 dark:text-slate-400 py-4 shrink-0">
        <p className="max-w-4xl mx-auto px-4">⚕ SemiologiX é um sistema de auxilio para uso por parte de profissionais médicos. Ao utilizar este site, você entende e aceita que não deve ser usado como substituição ao raciocínio e tomada de decisão médica. Não deve, em caso algum, ser utilizado para obter, substituir ou invalidar um diagnóstico clínico de um profissional de saúde. O diagnóstico final deve ser feito sempre por um profissional médico.</p>
      </footer>

      <ApiKeyModal 
        isOpen={isApiKeyModalOpen}
        onSave={handleApiKeySave}
        currentKey={apiKey}
      />

      <DiagnosisDetailModal
        isOpen={isDetailModalOpen}
        onClose={handleCloseModal}
        diagnoses={selectedDiagnoses}
        anamnesisData={anamnesisData}
        onReevaluate={handleReevaluate}
        onFinalize={handleFinalize}
      />
      
      <FinalAnamnesisModal
        isOpen={!!finalAnamnesisData}
        onClose={handleCloseFinalAnamnesis}
        initialData={finalAnamnesisData}
        onSave={handleSaveFinalAnamnesis}
        isSaving={isSavingFinal}
      />

      <CaseHistorySidebar 
        isOpen={isHistorySidebarOpen}
        onClose={() => setIsHistorySidebarOpen(false)}
        cases={savedCases}
        onLoad={handleLoadCase}
        onDelete={handleDeleteCase}
      />
    </div>
  );
};

export default App;