import 'server-only';

import { env } from '@/env';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

import { FIT_AXES, type FitAxisId } from '../analysis/fit-axes';
import type { ValorDaEscala } from '../analysis/instrumento';
import {
  gerarLeituraPessoal,
  mediasPorTema,
  type ContextoDaLeitura,
  type LeituraPessoal,
  type MediaDoTema,
  type PapelDaLeitura
} from '../analysis/leitura-pessoal';
import { DEEPSEEK_BASE_URL, DEEPSEEK_MODELO_PADRAO } from './deepseek-provider';
import { extrairJson } from './model-prompt';
import { criarPseudonimo } from './pseudonimizar';

/**
 * Polimento da devolutiva pessoal pelo Mind.
 *
 * A devolutiva é da regra fixa (`analysis/leitura-pessoal.ts`): sempre
 * existe, custa zero e é o que a pessoa vê primeiro. O modelo entra depois,
 * só quando há `IEL_AI_PROVIDER` e chave, para **reescrever** as mesmas
 * frases num tom mais humano e mais perto da atividade — não para inventar,
 * não para avaliar. Qualquer coisa fora disso é descartada e a regra fica.
 *
 * O que sai para o provedor (PRODUTO.md §5.8):
 * - `papel` (candidato/colaborador);
 * - a média por tema, em número, com o lado (alto/baixo) e o rótulo do tema;
 * - as frases da regra fixa, que são texto nosso, sem nada da pessoa;
 * - `atividade`/`setor` genéricos, passados por `pseudonimizar.ts`.
 *
 * O que não sai: nome (o componente nem manda), nome de empresa (R5), ids,
 * e as respostas frase a frase — só a média por tema.
 */

/** Limite para o modelo não ficar mais tempo do que o navegador espera (6 s). */
export const LEITURA_TIMEOUT_MS = 5_000;

/** Tamanho máximo de cada frase reescrita, em palavras. */
export const MAX_PALAVRAS_DO_TRACO = 28;
export const MAX_PALAVRAS_DO_AMBIENTE = 24;
export const MAX_PALAVRAS_DA_NUANCE = 30;

const SYSTEM_PROMPT = `Você é o Mind, do IEL. Vai reescrever a devolutiva pessoal de alguém que acabou de responder um questionário sobre o jeito de trabalhar. As frases abaixo já dizem o que a pessoa disse; a sua tarefa é só deixá-las mais humanas e, se houver "contexto", mais próximas daquela atividade. Português do Brasil, palavra comum, para uma pessoa que lê no celular.

Regras que não podem ser quebradas:
- Não invente nada. Cada frase reescrita diz a mesma coisa da frase original, na mesma direção ("lado"). Não troque o tema nem a ordem.
- Isto não é nota nem teste. Nunca use "perfil", "personalidade", "tipo", "pontos", "nota", "teste", "ranking", "melhor", "pior", "fraco", "forte", "defeito", "você é do tipo", nem porcentagem.
- Nada de conselho, elogio ou crítica. Nenhum lado é melhor que o outro.
- Candidato: frases dos traços na primeira pessoa ("Gosto de…", "Prefiro…"). Colaborador: frases sobre o ambiente ("Aqui, …"), nunca sobre a pessoa.
- "ambiente": para candidato, o tipo de lugar que combina ("Um lugar onde…"); para colaborador, o que as respostas dizem do lugar.
- Cada frase de traço com até ${MAX_PALAVRAS_DO_TRACO} palavras; cada linha de ambiente até ${MAX_PALAVRAS_DO_AMBIENTE}; a nuance até ${MAX_PALAVRAS_DA_NUANCE}.
- Mesma quantidade de traços, mesmos temas, mesma ordem, mesmo "lado". Mesma quantidade de linhas de ambiente. Nuance só se veio uma.
- Responda estritamente em json, sem texto fora do json e sem bloco de código, neste formato:
{"tracos":[{"tema":"execucao-ritmo","lado":"alto","frase":"…"}],"ambiente":["…"],"nuance":"…"}`;

/**
 * O que o modelo devolve. `lado` volta ecoado de propósito: se ele trocar a
 * direção de um traço, a validação percebe e descarta tudo.
 */
const saidaDoModeloSchema = z.object({
  tracos: z.array(
    z.object({
      tema: z.string().min(1),
      lado: z.enum(['alto', 'baixo']),
      frase: z.string().trim().min(1)
    })
  ),
  ambiente: z.array(z.string().trim().min(1)),
  nuance: z.string().trim().min(1).optional()
});

/**
 * Palavras que fazem a devolutiva virar julgamento ou classificação. Uma
 * só e o texto do modelo cai fora inteiro — é mais barato mostrar a regra
 * fixa do que arriscar "perfil" na tela da pessoa (PRODUTO.md §11).
 */
const PALAVRAS_VEDADAS = [
  'perfil',
  'personalidade',
  'tipo de pessoa',
  'você é do tipo',
  'pontos',
  'nota',
  'teste',
  'ranking',
  'melhor',
  'pior',
  'fraco',
  'fraqueza',
  'forte',
  'defeito',
  'deveria',
  'precisa melhorar',
  '%'
];

/** Palavra inteira, sem caixa: "nota" não casa "anotando"; "%" casa solto. */
function temPalavraVedada(texto: string): boolean {
  return PALAVRAS_VEDADAS.some((palavra) =>
    palavra === '%'
      ? texto.includes('%')
      : new RegExp(`(?<![\\p{L}])${palavra}(?![\\p{L}])`, 'iu').test(texto)
  );
}

function palavras(texto: string): number {
  return texto.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Confere a volta do modelo contra a regra fixa. Devolve a leitura polida
 * ou `null` — e `null` significa "fica a regra", sem aviso para a pessoa.
 */
export function validarPolimento(
  regra: LeituraPessoal,
  medias: MediaDoTema[],
  bruto: unknown
): LeituraPessoal | null {
  const lido = saidaDoModeloSchema.safeParse(bruto);
  if (!lido.success) return null;
  const saida = lido.data;

  if (saida.tracos.length !== regra.tracos.length) return null;
  if (saida.ambiente.length !== regra.ambiente.length) return null;
  if (Boolean(saida.nuance) !== Boolean(regra.nuance)) return null;

  const ladoDoTema = new Map(medias.map((m) => [m.tema, m.lado]));
  for (let i = 0; i < regra.tracos.length; i += 1) {
    const original = regra.tracos[i]!;
    const novo = saida.tracos[i]!;
    // Mesmo tema, na mesma posição, e na direção que a pessoa respondeu.
    if (novo.tema !== original.tema) return null;
    if (novo.lado !== ladoDoTema.get(original.tema)) return null;
    if (palavras(novo.frase) > MAX_PALAVRAS_DO_TRACO) return null;
    if (temPalavraVedada(novo.frase)) return null;
  }
  for (const linha of saida.ambiente) {
    if (palavras(linha) > MAX_PALAVRAS_DO_AMBIENTE) return null;
    if (temPalavraVedada(linha)) return null;
  }
  if (saida.nuance) {
    if (palavras(saida.nuance) > MAX_PALAVRAS_DA_NUANCE) return null;
    if (temPalavraVedada(saida.nuance)) return null;
  }

  return {
    ...regra,
    tracos: regra.tracos.map((traco, i) => ({
      tema: traco.tema,
      frase: saida.tracos[i]!.frase
    })),
    ambiente: saida.ambiente,
    ...(saida.nuance ? { nuance: saida.nuance } : {}),
    origem: 'mind'
  };
}

function rotuloDoTema(tema: FitAxisId): string {
  return FIT_AXES.find((axis) => axis.id === tema)?.label ?? tema;
}

/**
 * O pacote que sai. Só o que está listado no cabeçalho deste arquivo.
 * `atividade`/`setor` passam pela mesma limpeza do Mind: se alguém escrever
 * o nome da empresa ou de uma pessoa num desses campos, vira "a empresa" /
 * "outra pessoa" antes de sair.
 */
export function montarPedidoDePolimento(
  regra: LeituraPessoal,
  medias: MediaDoTema[],
  contexto?: ContextoDaLeitura
): { system: string; user: string } {
  const pseudonimo = criarPseudonimo({
    kind: 'resumir-selecao',
    jobId: '',
    applicationIds: [],
    applications: [],
    analysis: {},
    evidences: []
  });
  const ladoDoTema = new Map(medias.map((m) => [m.tema, m]));

  const pacote = pseudonimo.limparTudo({
    papel: regra.papel,
    ...(contexto?.atividade || contexto?.setor
      ? {
          contexto: {
            ...(contexto.atividade ? { atividade: contexto.atividade } : {}),
            ...(contexto.setor ? { setor: contexto.setor } : {})
          }
        }
      : {}),
    temasRespondidos: medias.map((m) => ({
      tema: m.tema,
      nome: rotuloDoTema(m.tema),
      media: Number(m.media.toFixed(2)),
      lado: m.lado
    })),
    tracos: regra.tracos.map((traco) => ({
      tema: traco.tema,
      nome: rotuloDoTema(traco.tema),
      lado: ladoDoTema.get(traco.tema)?.lado ?? 'alto',
      frase: traco.frase
    })),
    ambiente: regra.ambiente,
    ...(regra.nuance ? { nuance: regra.nuance } : {})
  });

  return {
    system: SYSTEM_PROMPT,
    user: `Devolutiva (json):\n${JSON.stringify(pacote, null, 2)}\n\nReescreva no formato json descrito nas instruções.`
  };
}

async function chamarDeepseek(
  system: string,
  user: string,
  signal: AbortSignal
): Promise<string> {
  const resposta = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${env.DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({
      model: env.DEEPSEEK_MODEL ?? DEEPSEEK_MODELO_PADRAO,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      response_format: { type: 'json_object' },
      thinking: { type: 'disabled' },
      temperature: 0.4,
      max_tokens: 600,
      stream: false
    }),
    signal
  });
  if (!resposta.ok)
    throw new Error(`DeepSeek respondeu HTTP ${resposta.status}.`);
  const corpo = (await resposta.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const conteudo = corpo.choices?.[0]?.message?.content;
  if (!conteudo?.trim()) throw new Error('DeepSeek devolveu conteúdo vazio.');
  return conteudo;
}

async function chamarAnthropic(
  system: string,
  user: string,
  signal: AbortSignal
): Promise<string> {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const message = await client.messages.create(
    {
      model: 'claude-sonnet-5',
      max_tokens: 600,
      system,
      messages: [{ role: 'user', content: user }]
    },
    { signal }
  );
  const bloco = message.content.find((block) => block.type === 'text');
  if (!bloco || bloco.type !== 'text') {
    throw new Error('Resposta do modelo sem bloco de texto.');
  }
  return bloco.text;
}

/** Há provedor e chave? Sem os dois, nem tenta: a regra fixa é a resposta. */
export function polimentoDisponivel(): boolean {
  return (
    (env.IEL_AI_PROVIDER === 'deepseek' && Boolean(env.DEEPSEEK_API_KEY)) ||
    (env.IEL_AI_PROVIDER === 'anthropic' && Boolean(env.ANTHROPIC_API_KEY))
  );
}

/**
 * Gera a devolutiva pela regra e, se der, pede ao Mind para reescrever.
 *
 * Nunca lança: qualquer falha — sem chave, rede, timeout, JSON fora do
 * formato, validação que reprovou — devolve a regra fixa com
 * `origem: 'regra'`. A devolutiva é do produto; a IA é enfeite.
 */
export async function leituraPessoalComMind(
  respostas: Record<string, ValorDaEscala>,
  papel: PapelDaLeitura,
  contexto?: ContextoDaLeitura
): Promise<LeituraPessoal> {
  const regra = gerarLeituraPessoal(respostas, papel, contexto);
  // Sem traço e sem nuance não há o que reescrever.
  if (!polimentoDisponivel()) return regra;
  if (regra.tracos.length === 0 && !regra.nuance) return regra;

  const medias = mediasPorTema(respostas);
  const { system, user } = montarPedidoDePolimento(regra, medias, contexto);

  const controle = new AbortController();
  const relogio = setTimeout(() => controle.abort(), LEITURA_TIMEOUT_MS);
  try {
    const texto =
      env.IEL_AI_PROVIDER === 'deepseek'
        ? await chamarDeepseek(system, user, controle.signal)
        : await chamarAnthropic(system, user, controle.signal);
    return validarPolimento(regra, medias, extrairJson(texto)) ?? regra;
  } catch (erro) {
    // Só a mensagem técnica: nada do pedido vai para o log.
    console.warn(
      '[iel/leitura-pessoal] Mind indisponível, ficou a regra fixa:',
      erro instanceof Error ? erro.message : 'erro desconhecido.'
    );
    return regra;
  } finally {
    clearTimeout(relogio);
  }
}
