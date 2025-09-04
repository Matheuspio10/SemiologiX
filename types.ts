

export interface AnamnesisData {
  idade: string;
  sexo: 'Masculino' | 'Feminino' | 'Outro' | '';
  comorbidades: string;
  medicamentosEmUso: string;
  alergias: string;
  historiaPregressa: string;
  queixaPrincipal: string;
  hda: string;
  pa: string;
  fc: string;
  fr: string;
  temp: string;
  spo2: string;
  pesoAltura: string;
  exameFisicoSumario: string;
  resultadosExames: string;
  hipotesesDiagnosticas: string;
  condutaInicial: string;
  // --- Training Mode Fields ---
  diagnosticoCorreto?: string;
  resumoDiagnostico?: string;
  hiddenPhysicalExam?: string;
  hiddenLabResults?: string;
}

export interface Diagnosis {
  diagnostico: string;
  probabilidade: number;
  justificativa: string;
}

export interface GeminiResponse {
  diagnosticosProvaveis: Diagnosis[];
  diagnosticosDiferenciais: Diagnosis[];
}

// Tipos para os detalhes do diagnóstico
export interface ChecklistItem {
  item: string;
  justificativa: string;
}

export interface ManagementPlan {
  examesConfirmacao: string[];
  medicacoesSugeridas: string[];
  encaminhamentos: string[];
}

export interface DiagnosisDetail {
  checklistAnamnese: ChecklistItem[];
  planoConduta: ManagementPlan;
}

export interface RetroFeedbackData {
  checklistUpdates: Record<string, string>; // key: checklist item, value: user input
  conductedPlan: Partial<ManagementPlan>;
}

export interface TimelineEvent {
  time: string;
  event: string;
}

export interface InvestigationLogEntry {
  type: 'request' | 'response' | 'system';
  content: string;
  timestamp: string;
}

export interface StudentPlan {
  solicitacaoExames: string;
  prescricao: string;
  encaminhamentos: string;
}

export interface EvaluationResult {
  score: number;
  scoreJustificativa: string;
  pontosPositivos: string;
  pontosMelhorar: string;
  raciocinioCorreto: string;
  analiseDaConduta: string;
}

export type Specialty = 'Geral' | 'Cardiologia' | 'Pneumologia' | 'Neurologia' | 'Gastroenterologia' | 'Nefrologia' | 'Pediatria' | 'Emergência' | 'Gineco/Obstetricia' | 'Ortopedia';

export interface SavedCase {
  id: string;
  name: string;
  savedAt: string; // ISO string for sorting
  anamnesisData: AnamnesisData;
  diagnoses: Diagnosis[];
  differentialDiagnoses: Diagnosis[];
  timelineEvents: TimelineEvent[];
}

// Tipos para a busca acadêmica
export interface GroundingChunk {
  web: {
    uri: string;
    title: string;
  };
}

export interface AcademicSearchResult {
  resumoDoenca: string;
  diretrizesTratamento: string;
  descobertasRecentes: string;
  sources: GroundingChunk[];
}