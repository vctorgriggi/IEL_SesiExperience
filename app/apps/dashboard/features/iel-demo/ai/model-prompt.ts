import { CRITERION_STATE_META } from '../analysis/criterion-states';
import { getJob } from '../state/selectors';
import { criarPseudonimo, type Pseudonimo } from './pseudonimizar';
import {
  modelAssistantOutputSchema,
  modelLeituraOutputSchema,
  type AssistantCandidatoDoContexto,
  type AssistantKind,
  type AssistantRequest,
  type AssistantResponse
} from './types';

/**
 * O que todo provedor externo (DeepSeek, Anthropic) manda ao modelo e como
 * lê a volta. Um lugar só, para a regra de privacidade valer igual para
 * todos: o pedido passa por `pseudonimizar.ts` antes de virar texto, e a
 * resposta volta pelo mesmo mapa antes de chegar à tela.
 *
 * O modelo nunca decide nada: aderência, ranking e corte já vêm calculados
 * pela regra fixa (R7). Ele só conta, em palavras, o que os registros dizem.
 */

/** A partir de quanto um tema conta como "combina" na conversa. */
export const TEMA_COMBINA = 75;
/** Até quanto um tema conta como "vale uma conversa". */
export const TEMA_DIFERE = 50;

export const AVISO_DE_QUEDA =
  'Não consegui falar com o modelo agora; respondi pela regra fixa.';

export const SYSTEM_PROMPT = `Você é o Mind, assistente da analista do IEL. Responda só com os registros enviados. Não invente. Não recomende contratar nem produza nota. Cite os registros que usou. Seja curto e claro, para uma pessoa leiga.

Regras que não podem ser quebradas:
- Use apenas o que está no JSON enviado. Sem conhecimento externo sobre pessoas, empresas ou vagas.
- As pessoas aparecem como "Pessoa A", "Pessoa B"… e a empresa como "a empresa". Use esses rótulos; não tente adivinhar nomes.
- Os percentuais já foram calculados pela regra fixa do IEL. Você pode repeti-los, nunca criar outro número, nota, ordem de preferência ou recomendação de contratação. A decisão é da analista.
- "Sem resposta" ou "sem dado" é um estado válido: diga que falta, não deduza.
- Se a pergunta pedir contato, dado pessoal ou algo fora dos registros, diga que não pode responder isso aqui.
- Escreva em português do Brasil, em até 5 frases curtas.
- Responda estritamente em json, sem texto fora do json e sem bloco de código, neste formato:
{"text": "Pessoa A combina 82% com a empresa…", "citations": [{"evidenceId": "R1", "label": "Currículo — experiência anterior"}]}
"evidenceId" é o id de um registro enviado (R1, R2…). "label" descreve a origem em poucas palavras. Sem registro, "citations" é [].`;

const SYSTEM_PROMPT_LEITURA = `${SYSTEM_PROMPT}

Neste pedido, acrescente o campo "leitura" ao json:
{"text": "…", "citations": [], "leitura": {"ondeCombina": ["…"], "ondeConversar": ["…"], "perguntas": ["…", "…"]}}
"ondeCombina": até 3 temas em que a pessoa e a empresa estão perto. "ondeConversar": até 3 temas em que estão longe, ditos sem julgamento. "perguntas": exatamente 2 perguntas abertas para a entrevista, sobre os temas de "ondeConversar", sem tocar em vida pessoal, saúde, religião, política, família ou origem.`;

const KIND_INSTRUCTION: Record<AssistantKind, string> = {
  'resumir-selecao':
    'Resuma a seleção atual, pessoa por pessoa: o que há de registro para cada critério e o que ainda falta.',
  'comparar-selecionados':
    'Compare as pessoas selecionadas critério a critério, apontando onde os registros convergem ou divergem — nunca uma nota ou uma ordem de preferência.',
  'mostrar-lacunas':
    'Liste o que falta esclarecer em cada pessoa selecionada: critérios sem informação, a esclarecer ou em divergência.',
  'leitura-da-pessoa':
    'Faça a leitura desta pessoa: onde combina com a empresa, onde vale uma conversa e duas perguntas para a entrevista.'
};

function pct(valor: number | null): string {
  return valor === null ? 'sem resposta' : `${Math.round(valor)}%`;
}

/** Temas em que combina (maior primeiro) e em que difere (menor primeiro). */
export function temasDoCandidato(candidato: AssistantCandidatoDoContexto): {
  combina: string[];
  difere: string[];
} {
  const comDado = candidato.temas.filter(
    (tema): tema is { tema: string; combina: number } => tema.combina !== null
  );
  return {
    combina: comDado
      .filter((tema) => tema.combina >= TEMA_COMBINA)
      .sort((a, b) => b.combina - a.combina)
      .map((tema) => tema.tema),
    difere: comDado
      .filter((tema) => tema.combina <= TEMA_DIFERE)
      .sort((a, b) => a.combina - b.combina)
      .map((tema) => tema.tema)
  };
}

function criteriosDaCandidatura(
  request: AssistantRequest,
  pseudonimo: Pseudonimo,
  applicationId: string
) {
  const job = getJob(request.jobId);
  const analise = request.analysis[applicationId] ?? {};
  return (job?.criteria ?? []).flatMap((criterion) => {
    const entrada = analise[criterion.id];
    if (!entrada) return [];
    return [
      {
        criterio: criterion.label,
        obrigatorio: criterion.required,
        estado: CRITERION_STATE_META[entrada.state].label,
        nota: entrada.note,
        registros: entrada.evidenceIds.map((id) =>
          pseudonimo.rotuloDoRegistro(id)
        )
      }
    ];
  });
}

/**
 * Monta a mensagem do modelo já pseudonimizada, e devolve o mapa de volta.
 * Nenhum id, nome, contato ou cidade da base sai daqui.
 */
export function montarChamada(request: AssistantRequest): {
  system: string;
  user: string;
  pseudonimo: Pseudonimo;
} {
  const pseudonimo = criarPseudonimo(request);
  const job = getJob(request.jobId);
  const doContexto = new Map(
    (request.contexto?.candidatos ?? []).map((c) => [c.applicationId, c])
  );

  const selecionadas = request.applicationIds.map((applicationId) => {
    const candidato = doContexto.get(applicationId);
    const temas = candidato ? temasDoCandidato(candidato) : null;
    return {
      pessoa: pseudonimo.rotuloDaCandidatura(applicationId),
      ...(candidato
        ? {
            combinaComAEmpresa: pct(candidato.combina),
            requisitosDaVaga: pct(candidato.requisitos),
            temasEmQueCombina: temas?.combina ?? [],
            temasEmQueDifere: temas?.difere ?? []
          }
        : {}),
      criterios: criteriosDaCandidatura(request, pseudonimo, applicationId)
    };
  });

  const outras = (request.contexto?.candidatos ?? [])
    .filter((c) => !request.applicationIds.includes(c.applicationId))
    .map((candidato) => {
      const temas = temasDoCandidato(candidato);
      return {
        pessoa: pseudonimo.rotuloDaCandidatura(candidato.applicationId),
        combinaComAEmpresa: pct(candidato.combina),
        requisitosDaVaga: pct(candidato.requisitos),
        temasEmQueCombina: temas.combina,
        temasEmQueDifere: temas.difere
      };
    });

  // Só os registros citados pela análise saem, e com id trocado.
  const citados = new Set(
    request.applicationIds.flatMap((applicationId) =>
      Object.values(request.analysis[applicationId] ?? {}).flatMap(
        (entrada) => entrada.evidenceIds
      )
    )
  );
  const registros = request.evidences
    .filter((evidence) => citados.has(evidence.id))
    .map((evidence) => ({
      id: pseudonimo.rotuloDoRegistro(evidence.id),
      informacao: evidence.information,
      origem: evidence.originLabel,
      natureza: evidence.nature
    }));

  const pacote = pseudonimo.limparTudo({
    operacao: request.pergunta
      ? 'Responda à pergunta da analista com os dados abaixo.'
      : KIND_INSTRUCTION[request.kind],
    ...(request.pergunta ? { pergunta: request.pergunta } : {}),
    vaga: {
      titulo: request.contexto?.vaga?.titulo ?? job?.title ?? 'vaga',
      requisitos:
        request.contexto?.vaga?.requisitos ?? job?.essentialRequirements ?? []
    },
    empresa: 'a empresa',
    pessoasSelecionadas: selecionadas,
    outrasPessoasDaVaga: outras,
    pendencias: request.contexto?.pendencias ?? [],
    registros
  });

  return {
    system:
      request.kind === 'leitura-da-pessoa'
        ? SYSTEM_PROMPT_LEITURA
        : SYSTEM_PROMPT,
    user: `Dados (json):\n${JSON.stringify(pacote, null, 2)}\n\nResponda no formato json descrito nas instruções.`,
    pseudonimo
  };
}

/** Tira cerca de código, se o modelo mandar, e interpreta o JSON. */
export function extrairJson(texto: string): unknown {
  const limpo = texto
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  return JSON.parse(limpo);
}

/**
 * Valida a saída do modelo e desfaz a pseudonimização. Lança se o formato
 * não bate: quem chama cai para a regra fixa. Citação de registro que não
 * foi enviado é descartada (o modelo não pode citar o que não viu).
 */
export function lerSaida(
  request: AssistantRequest,
  bruto: unknown,
  pseudonimo: Pseudonimo
): Pick<AssistantResponse, 'text' | 'citations' | 'leitura'> {
  const base = modelAssistantOutputSchema.parse(bruto);
  const leitura =
    request.kind === 'leitura-da-pessoa'
      ? modelLeituraOutputSchema.parse(bruto).leitura
      : undefined;

  const citations = base.citations.flatMap((citacao) => {
    const original = pseudonimo.registroOriginal(citacao.evidenceId);
    return original
      ? [
          {
            evidenceId: original,
            label: pseudonimo.reverter(citacao.label)
          }
        ]
      : [];
  });

  return {
    text: pseudonimo.reverter(base.text),
    citations,
    ...(leitura
      ? {
          leitura: {
            ondeCombina: leitura.ondeCombina.map(pseudonimo.reverter),
            ondeConversar: leitura.ondeConversar.map(pseudonimo.reverter),
            perguntas: leitura.perguntas.map(pseudonimo.reverter)
          }
        }
      : {})
  };
}
