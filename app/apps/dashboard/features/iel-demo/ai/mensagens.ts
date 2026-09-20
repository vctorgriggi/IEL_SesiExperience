import 'server-only';

import { z } from 'zod';

import {
  ETAPAS_DA_MENSAGEM,
  gerarMensagem,
  type EntradaDaMensagem,
  type EtapaDaMensagem,
  type MensagemAoCandidato
} from '../analysis/mensagens';
import { ALL_COMPANIES } from '../fixtures';
import { chamarModeloJson, polimentoDisponivel } from './chamar-modelo';
import { extrairJson } from './model-prompt';
import { motivoDaFalha } from './openai-compat-provider';
import { criarPseudonimo } from './pseudonimizar';

/**
 * Polimento, pelo Mind, da mensagem de WhatsApp ao candidato.
 *
 * A mensagem é da regra fixa (`analysis/mensagens.ts`): existe sempre,
 * custa zero e é o que a analista vê primeiro. O modelo entra depois, só
 * com `IEL_AI_PROVIDER` e chave, para **reescrever** a mesma mensagem com
 * o contexto da vaga (atividade, turno, prazo, marco) — não para prometer,
 * pressionar ou avaliar. O que sair disso é descartado e a regra fica.
 *
 * O que sai para o provedor (PRODUTO.md §5.8): a etapa, o texto da regra
 * fixa com **marcadores** no lugar do nome, da cidade, do link e de quem
 * assina (`[nome]`, `[cidade]`, `[link]`, `[analista]`), a atividade e o
 * turno genéricos, o prazo em "dd/mm" e o marco (30/60/90) — tudo passado
 * por `pseudonimizar.ts`, que troca qualquer nome de empresa ou de pessoa
 * que alguém tenha escrito na atividade.
 *
 * O que não sai: o nome da pessoa, a cidade, o link (que carrega o id da
 * candidatura), o nome de quem assina, e o nome da empresa (R5) — que a
 * entrada nem tem. Os marcadores voltam ao lugar aqui, no servidor, depois
 * da validação.
 */

/** O modelo tem 12 s: a analista já está olhando a regra fixa. */
export const MENSAGEM_TIMEOUT_MS = 12_000;

/** Tamanho máximo da mensagem reescrita, contando os marcadores. */
export const MAX_PALAVRAS_DA_MENSAGEM = 90;

/**
 * O que faz a mensagem virar promessa, pressão ou julgamento. Uma só e o
 * texto do modelo cai fora inteiro: é mais barato mostrar a regra fixa do
 * que arriscar "aprovado" no WhatsApp de alguém.
 */
const PALAVRAS_VEDADAS = [
  'garantido',
  'garantida',
  'garantimos',
  'aprovado',
  'aprovada',
  'reprovado',
  'reprovada',
  'eliminado',
  'eliminada',
  'selecionado automaticamente',
  'selecionada automaticamente',
  'você vai ser contratado',
  'você vai ser contratada',
  'processo seletivo',
  'prezado',
  'prezada',
  'candidato',
  'candidata',
  'urgente',
  '%'
];

/** Os marcadores que o modelo precisa devolver intactos. */
const MARCADORES = ['[nome]', '[cidade]', '[link]', '[analista]'] as const;

const SYSTEM_PROMPT = `Você é o Mind, do IEL (Centro de Empregos da Indústria). Vai reescrever uma mensagem de WhatsApp que uma analista do IEL manda a uma pessoa que se candidatou a uma vaga. A mensagem abaixo já diz tudo o que precisa ser dito; a sua tarefa é deixá-la mais natural e mais próxima daquela atividade e daquele turno, do jeito que se fala com alguém que trabalha no chão de fábrica e lê no celular. Português do Brasil, palavra comum, frases curtas.

Regras que não podem ser quebradas:
- Não invente nada: nem data, nem lugar, nem o que a empresa disse. Mesma etapa, mesma informação, mesma direção.
- Os marcadores [nome], [cidade], [link] e [analista] são preenchidos depois. Copie cada um exatamente como está, na mesma quantidade, e não crie marcador novo.
- Nunca diga o nome da empresa nem sugira qual é: a pessoa só fica sabendo na entrevista.
- Nada de promessa ("você vai ser contratado", "garantido"), nada de pressão ("urgente", "última chance"), nada de nota, "aprovado", "reprovado", "eliminado", "processo seletivo", "prezado", "candidato".
- Comece dizendo quem é, como a mensagem original. Termine com um fecho humano, sem exagero. No máximo um emoji, e só se couber.
- Até ${MAX_PALAVRAS_DA_MENSAGEM} palavras. Quebre em parágrafos curtos com uma linha em branco entre eles.
- Responda estritamente em json, sem texto fora do json e sem bloco de código, neste formato:
{"etapa":"<a mesma etapa recebida>","texto":"<a mensagem reescrita>"}`;

/**
 * O que o modelo devolve. `etapa` volta ecoada de propósito: se ele trocar
 * a etapa, a validação percebe e descarta.
 */
const saidaDoModeloSchema = z.object({
  etapa: z.enum(ETAPAS_DA_MENSAGEM as [EtapaDaMensagem, ...EtapaDaMensagem[]]),
  texto: z.string().trim().min(1)
});

/** Palavra inteira, sem caixa: "candidato" não casa "candidatura"; "%" casa solto. */
function temPalavraVedada(texto: string): boolean {
  return PALAVRAS_VEDADAS.some((palavra) =>
    palavra === '%'
      ? texto.includes('%')
      : new RegExp(`(?<![\\p{L}])${palavra}(?![\\p{L}])`, 'iu').test(texto)
  );
}

/**
 * Nome de empresa da base no texto do modelo. A entrada já não leva o
 * nome, mas a validação confere a saída mesmo assim: R5 é regra de saída,
 * não de entrada.
 */
function temNomeDeEmpresa(texto: string): boolean {
  const baixo = texto.toLowerCase();
  return ALL_COMPANIES.some((company) => {
    const nome = company.name.trim().toLowerCase();
    return nome.length > 2 && baixo.includes(nome);
  });
}

function palavras(texto: string): number {
  return texto.trim().split(/\s+/).filter(Boolean).length;
}

function contar(texto: string, trecho: string): number {
  return texto.split(trecho).length - 1;
}

function escapar(texto: string): string {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * A mesma entrada com marcadores no lugar do que não sai do servidor. A
 * regra fixa gera o texto por cima disso, e é esse texto que o modelo lê.
 */
function entradaComMarcadores(entrada: EntradaDaMensagem): EntradaDaMensagem {
  return {
    ...entrada,
    primeiroNome: '[nome]',
    ...(entrada.localidade?.trim() ? { localidade: '[cidade]' } : {}),
    ...(entrada.link?.trim() ? { link: '[link]' } : {}),
    ...(entrada.analista?.trim() ? { analista: '[analista]' } : {})
  };
}

/** O valor real de cada marcador, para a volta. */
function valoresDosMarcadores(
  entrada: EntradaDaMensagem
): Record<(typeof MARCADORES)[number], string> {
  return {
    '[nome]': entrada.primeiroNome.trim(),
    '[cidade]': entrada.localidade?.trim() ?? '',
    '[link]': entrada.link?.trim() ?? '',
    '[analista]': entrada.analista?.trim() ?? ''
  };
}

/**
 * Confere a volta do modelo contra a regra fixa. Devolve a mensagem
 * polida, já com nome, cidade e link no lugar, ou `null` — e `null`
 * significa "fica a regra", sem aviso para a analista.
 */
export function validarPolimento(
  entrada: EntradaDaMensagem,
  bruto: unknown
): MensagemAoCandidato | null {
  const lido = saidaDoModeloSchema.safeParse(bruto);
  if (!lido.success) return null;
  const saida = lido.data;
  const regra = gerarMensagem(entrada);

  if (saida.etapa !== regra.etapa) return null;
  if (palavras(saida.texto) > MAX_PALAVRAS_DA_MENSAGEM) return null;
  if (temPalavraVedada(saida.texto)) return null;
  if (temNomeDeEmpresa(saida.texto)) return null;
  // Um endereço escrito à mão no lugar do marcador é link inventado.
  if (/https?:\/\//i.test(saida.texto)) return null;

  // Cada marcador volta na mesma quantidade em que foi: o link não pode
  // sumir nem dobrar, e o nome precisa continuar onde a regra o pôs.
  const comMarcadores = gerarMensagem(entradaComMarcadores(entrada)).texto;
  for (const marcador of MARCADORES) {
    if (contar(saida.texto, marcador) !== contar(comMarcadores, marcador)) {
      return null;
    }
  }
  // Marcador que a regra não conhece ("[empresa]") é invenção.
  const desconhecido = saida.texto
    .match(/\[[^\]]+\]/g)
    ?.find((achado) => !(MARCADORES as readonly string[]).includes(achado));
  if (desconhecido) return null;

  const valores = valoresDosMarcadores(entrada);
  const texto = MARCADORES.reduce(
    (atual, marcador) =>
      atual.replace(new RegExp(escapar(marcador), 'g'), valores[marcador]),
    saida.texto
  );

  return { ...regra, texto, origem: 'mind' };
}

/**
 * O pacote que sai. Só o que está listado no cabeçalho deste arquivo, e
 * ainda assim passado pela mesma limpeza do Mind: se alguém escreveu o nome
 * da empresa na atividade da vaga, vira "a empresa" antes de sair.
 */
export function montarPedidoDePolimento(entrada: EntradaDaMensagem): {
  system: string;
  user: string;
} {
  const pseudonimo = criarPseudonimo({
    kind: 'resumir-selecao',
    jobId: '',
    applicationIds: [],
    applications: [],
    analysis: {},
    evidences: []
  });

  const pacote = pseudonimo.limparTudo({
    etapa: entrada.etapa,
    atividade: entrada.atividade,
    ...(entrada.turno ? { turno: entrada.turno } : {}),
    ...(entrada.prazo ? { prazo: entrada.prazo } : {}),
    ...(entrada.marco ? { marco: entrada.marco } : {}),
    texto: gerarMensagem(entradaComMarcadores(entrada)).texto
  });

  return {
    system: SYSTEM_PROMPT,
    user: `Mensagem (json):\n${JSON.stringify(pacote, null, 2)}\n\nReescreva no formato json descrito nas instruções.`
  };
}

/**
 * Gera a mensagem pela regra e, se der, pede ao Mind para reescrever.
 *
 * Nunca lança: qualquer falha — sem chave, rede, timeout, JSON fora do
 * formato, validação que reprovou — devolve a regra fixa com
 * `origem: 'regra'`. A mensagem é do produto; a IA é polimento. E, com ou
 * sem Mind, quem manda é a analista, depois de ler.
 */
export async function mensagemComMind(
  entrada: EntradaDaMensagem
): Promise<MensagemAoCandidato> {
  const regra = gerarMensagem(entrada);
  if (!polimentoDisponivel()) return regra;

  const { system, user } = montarPedidoDePolimento(entrada);

  try {
    const texto = await chamarModeloJson({
      system,
      user,
      maxTokens: 400,
      timeoutMs: MENSAGEM_TIMEOUT_MS
    });
    return validarPolimento(entrada, extrairJson(texto)) ?? regra;
  } catch (erro) {
    // Só a mensagem técnica: nada do pedido vai para o log.
    console.warn(
      '[iel/mensagens] Mind indisponível, ficou a regra fixa:',
      motivoDaFalha(erro, MENSAGEM_TIMEOUT_MS)
    );
    return regra;
  }
}
