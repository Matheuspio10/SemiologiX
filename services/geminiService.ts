


import { GoogleGenAI, Type } from "@google/genai";
import type { AnamnesisData, Diagnosis, DiagnosisDetail, GeminiResponse, RetroFeedbackData, TimelineEvent, EvaluationResult, InvestigationLogEntry, Specialty, StudentPlan, AcademicSearchResult, GroundingChunk } from '../types';

// Read the API key from the environment variables
const apiKey = process.env.API_KEY;

if (!apiKey) {
  throw new Error("API_KEY environment variable not set. Please configure it before running the application.");
}

const ai = new GoogleGenAI({ apiKey });

/**
 * A wrapper to retry API calls on rate limit errors (429).
 * Uses exponential backoff with jitter.
 */
const callWithRetry = async <T>(apiCall: () => Promise<T>, maxRetries = 4, initialDelay = 1500): Promise<T> => {
    let retries = 0;
    while (true) {
        try {
            return await apiCall();
        } catch (error: any) {
            const message = (error.toString() || '').toLowerCase();
            const isRateLimitError = message.includes('429') || message.includes('resource_exhausted') || message.includes('rate limit');
            
            if (isRateLimitError && retries < maxRetries) {
                retries++;
                // Exponential backoff with jitter
                const delay = initialDelay * Math.pow(2, retries - 1) + Math.random() * 1000;
                console.warn(`Rate limit error. Retrying in ${Math.round(delay)}ms... (Attempt ${retries}/${maxRetries})`);
                await new Promise(res => setTimeout(res, delay));
            } else {
                if (isRateLimitError) {
                    console.error(`API call failed after ${retries} retries due to persistent rate limiting.`);
                } else {
                    console.error(`API call failed due to a non-retriable error: ${error}`);
                }
                throw error;
            }
        }
    }
};


const diagnosisSchema = {
  type: Type.OBJECT,
  properties: {
    diagnosticosProvaveis: {
      type: Type.ARRAY,
      description: "Uma lista dos diagnósticos mais prováveis com base nos dados fornecidos.",
      items: {
        type: Type.OBJECT,
        properties: {
          diagnostico: { type: Type.STRING, description: "O nome da condição médica." },
          probabilidade: { type: Type.INTEGER, description: "A probabilidade estimada, de 0 a 100." },
          justificativa: { type: Type.STRING, description: "A justificativa para este diagnóstico provável." }
        },
        required: ["diagnostico", "probabilidade", "justificativa"]
      }
    },
    diagnosticosDiferenciais: {
      type: Type.ARRAY,
      description: "Uma lista de diagnósticos diferenciais importantes ('zebras'), que são menos comuns mas não devem ser descartados devido à gravidade ou perfil do paciente.",
      items: {
        type: Type.OBJECT,
        properties: {
          diagnostico: { type: Type.STRING, description: "O nome da condição médica diferencial." },
          probabilidade: { type: Type.INTEGER, description: "A probabilidade (geralmente mais baixa) deste diagnóstico." },
          justificativa: { type: Type.STRING, description: "O motivo pelo qual este diagnóstico diferencial deve ser considerado." }
        },
        required: ["diagnostico", "probabilidade", "justificativa"]
      }
    }
  },
  required: ["diagnosticosProvaveis", "diagnosticosDiferenciais"]
};

const diagnosisDetailSchema = {
    type: Type.OBJECT,
    properties: {
        checklistAnamnese: {
            type: Type.ARRAY,
            description: "Um checklist de perguntas e exames físicos importantes para confirmar ou descartar o diagnóstico, com justificativas.",
            items: {
                type: Type.OBJECT,
                properties: {
                    item: { type: Type.STRING, description: "A pergunta ou item do exame físico a ser verificado." },
                    justificativa: { type: Type.STRING, description: "O motivo pelo qual este item é importante." }
                },
                required: ["item", "justificativa"]
            }
        },
        planoConduta: {
            type: Type.OBJECT,
            description: "Sugestões de conduta e próximos passos.",
            properties: {
                examesConfirmacao: { type: Type.ARRAY, description: "Exames laboratoriais ou de imagem para confirmar o diagnóstico.", items: { type: Type.STRING }},
                medicacoesSugeridas: { type: Type.ARRAY, description: "Sugestões de tratamento medicamentoso inicial.", items: { type: Type.STRING }},
                encaminhamentos: { type: Type.ARRAY, description: "Sugestões de encaminhamento para especialistas.", items: { type: Type.STRING }}
            },
            required: ["examesConfirmacao", "medicacoesSugeridas", "encaminhamentos"]
        }
    },
    required: ["checklistAnamnese", "planoConduta"]
};

const anamnesisSchema = {
    type: Type.OBJECT,
    properties: {
        idade: { type: Type.STRING },
        sexo: { type: Type.STRING },
        comorbidades: { type: Type.STRING },
        medicamentosEmUso: { type: Type.STRING },
        alergias: { type: Type.STRING },
        historiaPregressa: { type: Type.STRING },
        queixaPrincipal: { type: Type.STRING },
        hda: { type: Type.STRING },
        pa: { type: Type.STRING },
        fc: { type: Type.STRING },
        fr: { type: Type.STRING },
        temp: { type: Type.STRING },
        spo2: { type: Type.STRING },
        pesoAltura: { type: Type.STRING },
        exameFisicoSumario: { type: Type.STRING },
        resultadosExames: { type: Type.STRING, description: "Resultados de exames laboratoriais ou de imagem relevantes." },
        hipotesesDiagnosticas: { type: Type.STRING },
        condutaInicial: { type: Type.STRING },
    },
    required: [
        'idade', 'sexo', 'comorbidades', 'medicamentosEmUso', 'alergias', 'historiaPregressa',
        'queixaPrincipal', 'hda', 'pa', 'fc', 'fr', 'temp', 'spo2', 'pesoAltura',
        'exameFisicoSumario', 'resultadosExames', 'hipotesesDiagnosticas', 'condutaInicial'
    ]
};

const trainingCaseSchema = {
    type: Type.OBJECT,
    properties: {
        ...anamnesisSchema.properties,
        diagnosticoCorreto: { type: Type.STRING, description: "O diagnóstico correto e conciso para este caso clínico. Ex: 'Infarto Agudo do Miocárdio'."},
        resumoDiagnostico: { type: Type.STRING, description: "Um resumo do raciocínio clínico que leva ao diagnóstico correto, explicando os achados chave."},
        hiddenPhysicalExam: { type: Type.STRING, description: "Descrição detalhada e COMPLETA do exame físico oculto, incluindo achados normais e anormais. Seja bem descritivo para permitir uma boa simulação." },
        hiddenLabResults: { type: Type.STRING, description: "Resultados de exames laboratoriais e de imagem ocultos relevantes para o caso. Inclua valores normais e alterados. Seja bem descritivo." }
    },
    required: [
        ...anamnesisSchema.required,
        'diagnosticoCorreto', 'resumoDiagnostico', 'hiddenPhysicalExam', 'hiddenLabResults'
    ]
};

const evaluationSchema = {
    type: Type.OBJECT,
    properties: {
        score: { type: Type.INTEGER, description: "A pontuação final do estudante, de 0 a 100, calculada com base na rubrica fornecida." },
        scoreJustificativa: { type: Type.STRING, description: "Uma explicação concisa de como a pontuação foi calculada, mencionando os principais acertos e erros que influenciaram o valor final." },
        pontosPositivos: { type: Type.STRING, description: "Feedback positivo sobre os acertos do estudante na formulação do diagnóstico. Elogie o que foi correto. Seja encorajador e específico." },
        pontosMelhorar: { type: Type.STRING, description: "Feedback construtivo sobre o que o estudante poderia ter considerado ou feito diferente no diagnóstico. Seja específico e didático." },
        analiseDaConduta: { type: Type.STRING, description: "Análise sobre o processo de investigação do estudante (o log de investigação). Ele pediu os exames corretos? Esqueceu algo crucial? A linha de raciocínio foi eficiente? Dê feedback sobre a conduta, incluindo exames desnecessários." },
        raciocinioCorreto: { type: Type.STRING, description: "Explicação didática do raciocínio clínico para chegar ao diagnóstico correto, conectando os dados do paciente, os achados da investigação, e a conclusão final." }
    },
    required: ["score", "scoreJustificativa", "pontosPositivos", "pontosMelhorar", "analiseDaConduta", "raciocinioCorreto"]
};


const timelineSchema = {
  type: Type.OBJECT,
  properties: {
    timeline: {
      type: Type.ARRAY,
      description: "Uma lista de eventos cronológicos extraídos da HDA, ordenados do mais antigo para o mais recente.",
      items: {
        type: Type.OBJECT,
        properties: {
          time: { type: Type.STRING, description: "O marcador de tempo do evento (ex: 'Há 5 dias', 'Ontem')." },
          event: { type: Type.STRING, description: "A descrição do que aconteceu naquele momento." },
        },
        required: ["time", "event"]
      }
    }
  },
  required: ["timeline"]
};

const getAnamnesisText = (data: AnamnesisData) => `
  - Idade: ${data.idade || 'Não informado'}
  - Sexo: ${data.sexo || 'Não informado'}
  - Comorbidades: ${data.comorbidades || 'Não informado'}
  - Medicamentos em Uso: ${data.medicamentosEmUso || 'Não informado'}
  - Alergias: ${data.alergias || 'Não informado'}
  - História Pregressa Relevante: ${data.historiaPregressa || 'Não informado'}
  - Queixa Principal (QP): ${data.queixaPrincipal || 'Não informado'}
  - História da Doença Atual (HDA): ${data.hda || 'Não informado'}
  - Sinais Vitais: PA: ${data.pa || 'NI'}, FC: ${data.fc || 'NI'}, FR: ${data.fr || 'NI'}, Temp: ${data.temp || 'NI'}, SpO2: ${data.spo2 || 'NI'}
  - Peso/Altura: ${data.pesoAltura || 'Não informado'}
  - Exame Físico Sumário: ${data.exameFisicoSumario || 'Não informado'}
  - Resultados de Exames: ${data.resultadosExames || 'Não informado'}
`.trim().replace(/  +/g, '');


export const fetchDiagnoses = async (data: AnamnesisData): Promise<GeminiResponse> => {
  try {
    const apiCall = () => {
        const anamnesisText = getAnamnesisText(data);
        const prompt = `
          Aja como um assistente médico especialista em diagnósticos diferenciais.
          Com base na seguinte anamnese estruturada, forneça duas listas separadas de diagnósticos:
          1. 'diagnosticosProvaveis': Os diagnósticos mais comuns e prováveis, com base nos dados.
          2. 'diagnosticosDiferenciais': Diagnósticos menos comuns, mas clinicamente importantes, que não devem ser descartados (as chamadas "zebras" médicas). Considere condições graves mesmo que raras.

          Para cada diagnóstico em ambas as listas, inclua o nome da condição, uma probabilidade estimada (0-100), e uma breve justificativa.

          A anamnese é:
          ${anamnesisText}
          Responda apenas com o JSON estruturado conforme o schema, preenchendo as duas listas.
        `;

        return ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: diagnosisSchema,
            temperature: 0.2,
          },
        }).then(response => JSON.parse(response.text.trim()));
    };

    return await callWithRetry(apiCall);

  } catch (error) {
    console.error("Error fetching diagnoses from Gemini API:", error);
    return { diagnosticosProvaveis: [], diagnosticosDiferenciais: [] };
  }
};

export const fetchDiagnosisDetails = async (anamnesis: AnamnesisData, diagnosis: Diagnosis): Promise<DiagnosisDetail> => {
  try {
    const apiCall = () => {
        const anamnesisText = getAnamnesisText(anamnesis);
        const prompt = `
          Aja como um assistente médico especialista. O usuário selecionou um diagnóstico específico e precisa de mais detalhes para aprofundar a investigação.
          O diagnóstico selecionado é: "${diagnosis.diagnostico}".
          A anamnese atual do paciente é:
          ${anamnesisText}

          Com base nessas informações, forneça o seguinte:
          1. 'checklistAnamnese': Crie um checklist COMPLETO de perguntas-chave e itens de exame físico que são cruciais para confirmar ou descartar "${diagnosis.diagnostico}". Para cada item, forneça uma breve justificativa de sua importância.
          2. 'planoConduta': Sugira um plano de ação inicial para o diagnóstico de "${diagnosis.diagnostico}", incluindo exames para confirmação (laboratoriais, imagem), sugestões de tratamento medicamentoso inicial e possíveis encaminhamentos para especialistas.

          Responda apenas com o JSON estruturado conforme o schema.
        `;
        
        return ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: diagnosisDetailSchema,
            temperature: 0.3,
          },
        }).then(response => JSON.parse(response.text.trim()));
    };

    return await callWithRetry(apiCall);

  } catch (error) {
    console.error(`Error fetching details for ${diagnosis.diagnostico}:`, error);
    throw new Error(`Não foi possível obter os detalhes para ${diagnosis.diagnostico}.`);
  }
};

export const integrateFeedback = async (currentAnamnesis: AnamnesisData, feedback: RetroFeedbackData): Promise<AnamnesisData> => {
  try {
     const apiCall = () => {
        const feedbackText = `
          Novas informações do checklist: ${JSON.stringify(feedback.checklistUpdates)}
          Plano de conduta realizado: ${JSON.stringify(feedback.conductedPlan)}
        `;

        const prompt = `
          Aja como um escriba médico assistente de IA. Sua tarefa é integrar de forma inteligente novas informações em um registro de anamnese existente.
          NÃO adicione cabeçalhos como "**Atualização**". Integre as informações nos campos mais apropriados de forma fluida.
          Por exemplo, um novo achado de exame físico vai para 'exameFisicoSumario', uma nova medicação para 'medicamentosEmUso' ou 'condutaInicial', um novo sintoma para 'hda', e um resultado de exame laboratorial para 'resultadosExames'.

          Anamnese Atual:
          ${JSON.stringify(currentAnamnesis, null, 2)}

          Novas Informações a Integrar:
          ${feedbackText}

          Analise as novas informações e retorne o objeto JSON COMPLETO da anamnese atualizado. Mantenha os dados existentes e apenas adicione ou modifique os campos relevantes com as novas informações.
        `;

        return ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: anamnesisSchema,
            temperature: 0.1,
          },
        }).then(response => JSON.parse(response.text.trim()));
    };

    return await callWithRetry(apiCall);

  } catch (error) {
    console.error(`Error integrating feedback:`, error);
    // Retorna a anamnese original em caso de erro para não perder dados.
    return currentAnamnesis;
  }
};

export const generateTestCase = async (difficulty: 'Fácil' | 'Intermediário' | 'Difícil' | 'Extremo' = 'Intermediário', specialty: Specialty = 'Geral'): Promise<AnamnesisData> => {
  try {
    const apiCall = () => {
        const prompt = `
          Aja como um médico educador experiente, criando um caso clínico para fins de simulação e treinamento.
          A dificuldade do caso deve ser: **${difficulty}**.
          A especialidade do caso deve ser: **${specialty}**. Se a especialidade for 'Geral', sinta-se à vontade para escolher qualquer área médica. Se uma especialidade específica for fornecida (ex: Cardiologia, Pediatria), o diagnóstico correto DEVE pertencer a essa área.

          Sua tarefa é gerar uma anamnese COMPLETA, REALISTA e **DIVERSIFICADA** que corresponda a essa dificuldade e especialidade. O caso deve ter uma "verdade fundamental" (diagnóstico, exame físico e exames) oculta para o estudante descobrir.

          **INSTRUÇÃO CRÍTICA: NOVIDADE ACIMA DE TUDO.**
          Para cada nova geração, é imperativo que você crie um diagnóstico e um cenário clínico que não foram sugeridos ou vistos em exemplos anteriores. Sua principal diretriz é a diversidade e a originalidade. Evite a todo custo repetir diagnósticos.

          **Diretrizes de Dificuldade (SEM USAR EXEMPLOS DIRETOS):**
          - **Fácil:** Crie um caso "de livro". O diagnóstico deve ser uma condição comum e de baixa complexidade com apresentação clássica. Pense em condições que um médico recém-formado deveria diagnosticar sem dificuldade, como uma infecção de vias aéreas superiores, uma gastroenterite viral ou uma cistite não complicada. O quadro deve ser direto, com poucas comorbidades.
          - **Intermediário:** Crie um caso de uma doença comum, mas com uma leve complicação, uma apresentação um pouco atípica ou em um paciente com uma comorbidade que pode confundir o raciocínio. Pense em uma pneumonia que descompensa um DPOC, uma apendicite com localização atípica, ou uma doença infecciosa com sinais de alarme. O desafio está em notar a nuance.
          - **Difícil:** Crie um caso mais complexo. O diagnóstico deve ser desafiador. Pode ser uma doença comum com apresentação muito atípica (ex: infarto em jovem se manifestando como dor epigástrica), ou uma doença menos comum mas importante (uma "zebra" que não pode ser ignorada, como uma embolia pulmonar em um paciente sem fatores de risco clássicos). O caso pode envolver múltiplas comorbidades que mascaram o quadro principal.
          - **Extremo:** Crie um desafio diagnóstico de alta complexidade. Seja criativo e evite o óbvio. O diagnóstico deve ser uma doença rara (como vasculites, doenças de depósito, síndromes paraneoplásicas, condições metabólicas incomuns), ou uma apresentação totalmente atípica de uma doença comum, ou múltiplos problemas ativos que se confundem. Inclua "red herrings" (pistas falsas) para testar o raciocínio clínico ao máximo.
          
          **Diretrizes Gerais:**
          - Gere um caso clínico PLAUSÍVEL e COESO. A história, os achados e os exames devem fazer sentido juntos.
          - Preencha TODOS os campos do schema JSON.
          - 'resultadosExames', 'hipotesesDiagnosticas', 'condutaInicial': Devem ser retornados como strings vazias ("").
          - 'hiddenPhysicalExam' e 'hiddenLabResults': Devem ser COMPLETOS e DETALHADOS para permitir uma investigação aprofundada pelo estudante.

          **Estrutura dos Campos Ocultos:**
          - 'exameFisicoSumario': Versão RESUMIDA e um pouco vaga que será visível ao estudante. Ex: "BEG, corado. Abdome doloroso à palpação profunda em QID."
          - 'hiddenPhysicalExam': Descrição COMPLETA e DETALHADA. Ex: "Ausculta cardíaca: RCR, 2T, sem sopros. Ausculta pulmonar: MV presente bilateralmente sem ruídos adventícios. Abdome: RHA+, flácido, doloroso à palpação profunda em QID, com descompressão brusca positiva (Blumberg+)."
          - 'hiddenLabResults': Resultados DETALHADOS com valores. Ex: "Hemograma: Leucócitos 17.500/mm³ (segmentados 85%), Hb 14.5 g/dL, Plaquetas 250.000. PCR: 150 mg/L. TC de abdome: apêndice cecal espessado, com diâmetro de 1.2 cm e densificação da gordura adjacente."

          Responda apenas com o objeto JSON estruturado conforme o schema. Não adicione nenhum texto ou explicação fora do JSON.
        `;

        return ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: trainingCaseSchema,
            temperature: 0.95, // Higher temperature for more creative/varied cases
            topP: 0.95,
            topK: 64,
            seed: Math.floor(Math.random() * 1000000), // Add random seed for diversity
          },
        }).then(response => {
            const jsonText = response.text.trim();
            const parsedJson = JSON.parse(jsonText);
            // Ensure these fields are empty as per requirement
            parsedJson.resultadosExames = "";
            parsedJson.hipotesesDiagnosticas = "";
            parsedJson.condutaInicial = "";
            return parsedJson;
        });
    };

    return await callWithRetry(apiCall);

  } catch (error) {
    console.error(`Error generating test case:`, error);
    throw new Error('Não foi possível gerar um caso de teste.');
  }
};


export const fetchInvestigationResult = async (
    request: string,
    hiddenPhysicalExam: string,
    hiddenLabResults: string
): Promise<string> => {
    try {
        const apiCall = () => {
            const prompt = `
                Aja como um simulador médico realista. O estudante está investigando um caso e fez uma solicitação.
                Sua tarefa é responder à solicitação com base nos dados ocultos do caso (a "verdade fundamental").

                **REGRAS DE RESPOSTA:**
                1.  **Pedidos Específicos:** Se a solicitação for por um achado específico (ex: "ausculta pulmonar") ou exame específico (ex: "hemograma completo") e a informação estiver nos dados ocultos, retorne APENAS o resultado correspondente de forma concisa e direta.
                2.  **Pedidos Genéricos:** Se a solicitação for genérica ou ambígua (ex: "solicito exames", "peço exames laboratoriais", "quais os resultados dos exames?"), você **NÃO DEVE** fornecer uma lista de resultados. Em vez disso, você **DEVE** pedir para o estudante especificar o que ele quer. Responda com uma pergunta como: "Quais exames laboratoriais você gostaria de solicitar especificamente?".
                3.  **Informação Não Disponível:** Se a informação solicitada não estiver contida nos dados ocultos, responda que o exame não foi considerado relevante para a investigação inicial deste caso específico. Use uma resposta como: "Este exame não foi considerado relevante no atendimento inicial." ou "O exame solicitado não acrescentaria informações cruciais para o diagnóstico neste momento."

                DADOS OCULTOS DO EXAME FÍSICO:
                ---
                ${hiddenPhysicalExam}
                ---

                DADOS OCULTOS DOS EXAMES (LABORATÓRIO/IMAGEM):
                ---
                ${hiddenLabResults}
                ---

                **SOLICITAÇÃO DO ESTUDANTE:** "${request}"

                **SUA RESPOSTA (direta e concisa):**
            `;

            return ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    temperature: 0.1,
                },
            }).then(response => response.text.trim());
        };
        return await callWithRetry(apiCall);
    } catch (error) {
        console.error("Error fetching investigation result:", error);
        throw new Error('Falha na comunicação com o simulador de IA.');
    }
};


export const evaluateStudentPerformance = async (
    anamnesis: AnamnesisData,
    studentHypotheses: { principal: string, diferenciais: string[] },
    investigationLog: InvestigationLogEntry[],
    studentPlan: StudentPlan
): Promise<EvaluationResult> => {
    try {
        const apiCall = () => {
            const anamnesisText = getAnamnesisText(anamnesis);
            const studentSubmissionText = `Hipótese Principal: ${studentHypotheses.principal}. Hipóteses Diferenciais: ${studentHypotheses.diferenciais.join(', ') || 'Nenhuma'}.`;
            const investigationLogText = investigationLog.map(entry => `${entry.type === 'request' ? 'Estudante solicitou' : 'Simulador respondeu'}: ${entry.content}`).join('\n');
            const studentPlanText = `
              - Exames Solicitados: ${studentPlan.solicitacaoExames || 'Nenhum'}
              - Prescrição: ${studentPlan.prescricao || 'Nenhuma'}
              - Encaminhamentos: ${studentPlan.encaminhamentos || 'Nenhum'}
            `.trim();

            const prompt = `
                Aja como um preceptor de medicina experiente, didático e justo.
                Sua tarefa é avaliar a performance de um estudante de medicina em uma simulação de caso clínico, fornecendo um feedback detalhado e uma pontuação de 0 a 100.

                **Contexto do Caso Clínico (O que o estudante viu inicialmente):**
                - Anamnese Inicial: ${anamnesisText}

                **Gabarito do Caso (A verdade oculta):**
                - Diagnóstico Correto: ${anamnesis.diagnosticoCorreto}
                - Raciocínio Correto: ${anamnesis.resumoDiagnostico}
                - Dados Ocultos Investigáveis:
                  - Exame Físico Completo: ${anamnesis.hiddenPhysicalExam || 'Não fornecido'}
                  - Exames Laboratoriais/Imagem: ${anamnesis.hiddenLabResults || 'Não fornecido'}

                **Performance do Estudante:**
                - Hipóteses Finais Submetidas: ${studentSubmissionText}
                - Log de Investigação (Ações realizadas durante a apuração):
                  ${investigationLogText}
                - Plano de Conduta Final Submetido:
                  ${studentPlanText}

                **--- SUA TAREFA DE AVALIAÇÃO ---**

                **PARTE 1: CÁLCULO DA PONTUAÇÃO (0-100)**
                Calcule uma pontuação final seguindo estritamente esta rubrica. Seja rigoroso.

                **A. Diagnóstico (Peso: 40 pontos)**
                - Hipótese Principal CORRETA: **+30 pontos**.
                - Hipótese Principal INCORRETA, mas plausível/no caminho certo: **+10 a +15 pontos**.
                - Cada Diagnóstico Diferencial RELEVANTE E CORRETO mencionado: **+5 pontos** (máximo de 10 pontos para diferenciais).
                - Hipótese Principal muito distante da realidade: **0 pontos**.

                **B. Investigação (Peso: 30 pontos)**
                - Todos os estudantes começam com **20 pontos** de base nesta categoria.
                - Compare o 'Log de Investigação' com o 'Gabarito do Caso'.
                - Para cada exame ou manobra de exame físico **ESSENCIAL** que foi **ESQUECIDO** durante a investigação: **-10 pontos**.
                - Para cada exame **DESNECESSÁRIO** durante a investigação: **-5 pontos**.
                - Se a ordem da investigação foi lógica e eficiente: **Bônus de +5 a +10 pontos**.
                - O total da investigação não pode ultrapassar 30 pontos.

                **C. Conduta (Peso: 30 pontos)**
                - Analise o 'Plano de Conduta Final Submetido' em relação à **hipótese principal do próprio estudante**, mesmo que ela esteja errada.
                - Todos os estudantes começam com **15 pontos** de base nesta categoria.
                - Exames complementares solicitados são pertinentes para a hipótese do estudante: **+5 pontos**.
                - Prescrição é segura e apropriada para a hipótese do estudante: **+10 pontos**. (Penalize severamente prescrições perigosas).
                - Orientações e encaminhamentos são adequados: **+5 pontos**.
                - Penalize por exames, prescrições ou encaminhamentos claramente incorretos ou danosos.
                - O total da conduta não pode ultrapassar 30 pontos.

                Some as pontuações de Diagnóstico, Investigação e Conduta para obter o total. O score não pode ser menor que 0 ou maior que 100.

                **PARTE 2: FEEDBACK QUALITATIVO**
                Com base na sua análise, preencha o JSON.

                1.  **score**: A pontuação final calculada (inteiro de 0 a 100).
                2.  **scoreJustificativa**: Explique BREVEMENTE como a pontuação foi calculada. Ex: "Diagnóstico correto (+30), mas esqueceu a Troponina na investigação (-10). Conduta adequada para IAM (+25). Total: 45."
                3.  **pontosPositivos**: Elogie o que o estudante acertou no diagnóstico e/ou conduta.
                4.  **pontosMelhorar**: Aponte o que faltou ou foi incorreto no diagnóstico e/ou conduta.
                5.  **analiseDaConduta**: Comente sobre o processo de investigação (log) E sobre o plano de conduta final. Seja específico sobre exames, prescrições e encaminhamentos, apontando acertos e erros.
                6.  **raciocinioCorreto**: Explique de forma clara como chegar ao diagnóstico correto e qual seria a conduta ideal.

                Seja encorajador, o objetivo é ensinar. Responda apenas com o JSON estruturado conforme o schema.
            `;

            return ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: evaluationSchema,
                    temperature: 0.4,
                },
            }).then(response => JSON.parse(response.text.trim()));
        };
        return await callWithRetry(apiCall);
    } catch (error) {
        console.error("Error evaluating student performance:", error);
        throw new Error('Não foi possível obter a avaliação do preceptor de IA.');
    }
};

export const parseAnamnesisText = async (anamnesisText: string): Promise<AnamnesisData> => {
  try {
    const apiCall = () => {
        const prompt = `
          Aja como um assistente de IA para processamento de dados médicos.
          Sua tarefa é analisar o seguinte texto de anamnese e convertê-lo em um objeto JSON estruturado, seguindo o schema fornecido.
          Extraia as informações de cada campo (Idade, Sexo, HDA, etc.) do texto e popule o JSON.
          Se uma informação para um campo não estiver presente no texto, retorne uma string vazia ("") para aquele campo.

          Texto da Anamnese para analisar:
          ---
          ${anamnesisText}
          ---

          Responda apenas com o objeto JSON estruturado. Não adicione nenhuma explicação ou texto fora do JSON.
        `;

        return ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: anamnesisSchema,
            temperature: 0.0, // We want deterministic parsing
          },
        }).then(response => JSON.parse(response.text.trim()));
    };

    return await callWithRetry(apiCall);

  } catch (error) {
    console.error(`Error parsing anamnesis text:`, error);
    throw new Error('Não foi possível processar o texto da anamnese.');
  }
};

export const transcribeAndParseAnamnesisFromAudio = async (base64Audio: string, mimeType: string): Promise<AnamnesisData> => {
  try {
    const apiCall = () => {
        const audioPart = {
            inlineData: {
                mimeType: mimeType,
                data: base64Audio,
            },
        };

        const textPart = {
            text: `
              Aja como um escriba médico de IA altamente competente. Sua tarefa é multifacetada:
              1.  **Transcrever** o arquivo de áudio fornecido, que contém uma entrevista de anamnese médica.
              2.  **Limpar e Refinar:** Durante a transcrição, ignore palavras de preenchimento ('uh', 'hmm'), repetições e gaguejos. Corrija erros gramaticais e de ortografia para produzir um texto clinicamente preciso e profissional. Reestruture sentenças para clareza, se necessário, sem alterar o significado clínico.
              3.  **Extrair e Estruturar:** Analise a transcrição refinada e extraia sistematicamente as informações para preencher um objeto JSON estruturado. Siga o schema de anamnese fornecido.
              4.  **Campos Vazios:** Se uma informação específica para um campo JSON não for mencionada no áudio, retorne uma string vazia ("") para esse campo.

              **Exemplo de refinamento:**
              - Áudio diz: "uhm... o paciente, ele... ele disse que a dor no peito, tipo... começou... acho que... ontem de noite e... e... irradia pro... pro braço esquerdo."
              - Texto refinado para HDA: "Paciente refere início de dor precordial na noite anterior, com irradiação para o membro superior esquerdo."

              Responda APENAS com o objeto JSON estruturado. Não inclua texto ou explicações adicionais.
            `
        };

        return ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: { parts: [audioPart, textPart] },
          config: {
            responseMimeType: "application/json",
            responseSchema: anamnesisSchema,
            temperature: 0.1,
          },
        }).then(response => JSON.parse(response.text.trim()));
    };

    return await callWithRetry(apiCall);

  } catch (error) {
    console.error(`Error processing audio anamnesis:`, error);
    throw new Error('Não foi possível processar a anamnese por áudio.');
  }
};


export const summarizeExamResults = async (examText: string): Promise<string> => {
    try {
        const apiCall = () => {
            const prompt = `
              Aja como um assistente de IA especialista em processar laudos de exames médicos. Sua tarefa é extrair e sumarizar APENAS os resultados clinicamente relevantes do texto bruto a seguir.

              IGNORE:
              - Nomes de pacientes, médicos, convênios ou informações de identificação.
              - Endereços, telefones ou informações do laboratório.
              - Cabeçalhos e rodapés repetitivos.
              - Valores de referência, fontes, ou notas de rodapé.
              - Datas de coleta/emissão.

              EXTRAIA E FORMATE:
              - O nome do exame e seu resultado com a unidade.
              - Agrupe resultados relacionados (ex: Hemograma completo).
              - Apresente os dados de forma clara e concisa em uma única string de texto. Seja direto.

              Exemplo de Saída Desejada:
              Hemograma: Hemácias 5,2 M/μL, Hemoglobina 15,9 g/dL, Leucócitos 7.120/mm3, Plaquetas 366.000/mm3. Hemoglobina Glicada (HbA1c): 4,7%. Colesterol Total: 213,0 mg/dL. Colesterol HDL: 41,0 mg/dL. Triglicerídeos: 96 mg/dL. Glicose: 81 mg/dL. TGO: 16 U/L. TGP: 27 U/L. Creatinina: 0,84 mg/dL. Potássio: 4,5 mEq/L. Ácido Úrico: 6,1 mg/dL. Parcial de Urina: Leucócitos 1 p/c, Hemácias 1 p/c, Flora Bacteriana Discreta. Vitamina B12: 406 pg/mL. Vitamina D: 52,8 ng/mL. TSH: 2,3575 μUI/mL. Microalbuminúria: 3,6 mg/g creatinina.

              Texto bruto do laudo para processar:
              ---
              ${examText}
              ---

              Responda APENAS com o texto sumarizado e limpo.
            `;

            return ai.models.generateContent({
              model: "gemini-2.5-flash",
              contents: prompt,
              config: {
                temperature: 0.0,
              },
            }).then(response => response.text.trim());
        };

        return await callWithRetry(apiCall);

    } catch (error) {
        console.error(`Error summarizing exam results:`, error);
        throw new Error('Não foi possível resumir os resultados do exame.');
    }
};

export const fetchTimelineFromHDA = async (hda: string): Promise<TimelineEvent[]> => {
    if (!hda || hda.trim().length < 10) {
        return []; // Do not call API for short HDA
    }
    try {
        const apiCall = () => {
            const prompt = `
              Aja como um assistente médico especialista em análise de texto clínico.
              Analise a 'História da Doença Atual' (HDA) a seguir e extraia os eventos chave em ordem cronológica.
              Para cada evento, forneça o marcador de tempo e uma descrição concisa do que ocorreu.
              Ordene os eventos do mais antigo para o mais recente.

              Exemplo: se a HDA for "Paciente iniciou com febre e dor de garganta há 3 dias. Ontem, notou piora da tosse e hoje surgiu dor no peito.", a saída deve ser:
              [
                {"time": "Há 3 dias", "event": "Início de febre e dor de garganta."},
                {"time": "Ontem", "event": "Piora da tosse."},
                {"time": "Hoje", "event": "Surgimento de dor no peito."}
              ]

              HDA para análise:
              "${hda}"

              Responda APENAS com o objeto JSON estruturado conforme o schema. Se nenhum evento cronológico claro for encontrado, retorne um array 'timeline' vazio.
            `;
            return ai.models.generateContent({
              model: "gemini-2.5-flash",
              contents: prompt,
              config: {
                responseMimeType: "application/json",
                responseSchema: timelineSchema,
                temperature: 0.1,
              },
            }).then(response => {
                const parsed = JSON.parse(response.text.trim());
                return parsed.timeline || []; // Return the timeline array, or empty if not present
            });
        };
        return await callWithRetry(apiCall);
    } catch (error) {
        console.error("Error fetching timeline from HDA:", error);
        return []; // Return empty on error
    }
};

export const fetchAcademicPublications = async (diagnosisName: string): Promise<AcademicSearchResult> => {
  try {
    const apiCall = async () => {
      const prompt = `
        Aja como um assistente de pesquisa médica de alto nível.
        Sua tarefa é pesquisar em fontes acadêmicas (Google Scholar, PubMed, Scopus) sobre o diagnóstico: "${diagnosisName}" e retornar um objeto JSON.

        A SUA RESPOSTA DEVE SER APENAS O CÓDIGO JSON, NADA MAIS.
        Não inclua \`\`\`json no início ou \`\`\` no final. A resposta deve ser um JSON válido e "parseable".

        O JSON deve ter a seguinte estrutura:
        {
          "resumoDoenca": "Um resumo breve e conciso sobre a doença, cobrindo sua definição e fisiopatologia principal.",
          "diretrizesTratamento": "Um resumo das diretrizes de tratamento atuais (guidelines). Cite as fontes, como nomes de sociedades médicas e anos de publicação. Foque em metanálises e revisões sistemáticas.",
          "descobertasRecentes": "Um resumo das descobertas e avanços importantes dos últimos 5 anos (novos medicamentos, técnicas, resultados de RCTs). Cite as fontes."
        }

        O texto em cada campo do JSON deve ser limpo, em parágrafos, e em português. NÃO use markdown (sem '##', '**', etc.).
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          temperature: 0.2,
        },
      });
      
      const rawSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources: GroundingChunk[] = rawSources
        .filter(chunk => chunk.web && chunk.web.uri)
        .map(chunk => ({
          web: {
            uri: chunk.web!.uri!,
            title: chunk.web!.title || chunk.web!.uri!,
          }
        }));

      let structuredData: Omit<AcademicSearchResult, 'sources'>;
      try {
          // Attempt to parse the text as JSON, cleaning potential markdown fences
          const cleanedText = response.text.trim().replace(/^```json\s*/, '').replace(/```\s*$/, '');
          structuredData = JSON.parse(cleanedText);
      } catch (e) {
          // Fallback: If JSON parsing fails, use the raw text as a summary and leave other fields empty.
          console.warn("Failed to parse academic search result as JSON. Using raw text as fallback.", e);
          structuredData = {
              resumoDoenca: `A IA não retornou um formato JSON válido. O conteúdo recebido foi:\n\n${response.text.trim()}`,
              diretrizesTratamento: 'Não foi possível extrair as diretrizes de tratamento de forma estruturada.',
              descobertasRecentes: 'Não foi possível extrair as descobertas recentes de forma estruturada.',
          };
      }

      return { ...structuredData, sources };
    };

    return await callWithRetry(apiCall);
  } catch (error) {
    console.error(`Error fetching academic publications for ${diagnosisName}:`, error);
    throw new Error(`Não foi possível buscar publicações para ${diagnosisName}.`);
  }
};

export const generateProntuarySummary = async (anamnesisText: string): Promise<string> => {
    try {
        const apiCall = () => {
            const prompt = `
              Aja como um médico experiente e conciso. Sua tarefa é ler a anamnese completa fornecida e escrever um resumo em um único parágrafo, otimizado para ser colado em uma nota de evolução de prontuário eletrônico.
              O resumo deve ser objetivo, direto e conter as informações mais cruciais (identificação breve, queixa principal, achados chave, hipótese principal e conduta inicial).
              
              Anamnese completa para resumir:
              ---
              ${anamnesisText}
              ---

              Responda APENAS com o texto do resumo. Não adicione cabeçalhos, introduções ou qualquer texto extra.
            `;

            return ai.models.generateContent({
              model: "gemini-2.5-flash",
              contents: prompt,
              config: {
                temperature: 0.3,
              },
            }).then(response => response.text.trim());
        };

        return await callWithRetry(apiCall);

    } catch (error) {
        console.error(`Error generating prontuary summary:`, error);
        throw new Error('Não foi possível gerar o resumo da anamnese.');
    }
};