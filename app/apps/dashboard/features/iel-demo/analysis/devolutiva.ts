/**
 * Devolutiva de um clique da empresa (C3).
 *
 * O ciclo do produto parava na intenção de entrevistar. O que o IEL nunca
 * teve é o passo seguinte: *contratou?* e, semanas depois, *ficou?* — "o RH
 * não dá retorno pra gente, de contratado; o retorno é o número de vagas do
 * outro mês que fica aberto" (00:05:33). Sem esse dado, a permanência aos 90
 * dias só existe como histórico simulado e o corte de 35% não tem como ser
 * calibrado com número nenhum.
 *
 * ## Dois momentos, não um formulário
 *
 * "Contratei" e "saiu antes de 90 dias" não acontecem no mesmo dia. São dois
 * registros separados, cada um com o seu carimbo, e o segundo nunca é
 * condição do primeiro: quem clica "contratei" terminou o que tinha a fazer.
 * O produto volta a perguntar sozinho quando os 90 dias se completam
 * (`estadoDaPermanencia`), e antes disso deixa só a porta aberta para quem
 * quiser avisar antes. Exigir o segundo clique na hora do primeiro seria a
 * "etapa a mais para a empresa" que o cliente disse que ninguém faz
 * (00:23:28).
 *
 * ## O motivo é opcional, e é operacional
 *
 * Registrar desfecho sobre uma pessoa é tratamento novo (LGPD, art. 6º, I e
 * III). Por isso o motivo nunca é obrigatório, a lista é curta e fica em
 * causa operacional — salário, horário, transporte, contrato, desistência.
 * **Nada de saúde, família ou desempenho pessoal**: o edital veda dado de
 * saúde na seleção, e "não contratou" é decisão da empresa sobre o processo,
 * não avaliação da pessoa (`docs/telas/14`).
 *
 * Os ids de "não contratou" são os mesmos de `fixtures/outcomes.ts` de
 * propósito: o que a empresa clica hoje precisa cair na mesma gaveta do
 * histórico simulado, senão o gráfico de motivos do BI viraria duas listas
 * paralelas para a mesma pergunta.
 */

import type { MotivoNaoContratacao } from '../fixtures/outcomes';

export type { MotivoNaoContratacao };

/* ------------------------------------------------------------------ *
 * Estados
 * ------------------------------------------------------------------ */

/** Primeiro momento: o que a empresa respondeu sobre a contratação. */
export type DesfechoContratacao = 'pendente' | 'contratou' | 'nao-contratou';

/** Segundo momento: o que a empresa respondeu sobre a permanência. */
export type DesfechoPermanencia =
  | 'pendente'
  | 'continua'
  | 'saiu-antes-de-90-dias';

/**
 * Por que a pessoa saiu antes dos 90 dias.
 *
 * Lista própria, e não a de "não contratou", porque as causas são outras:
 * quem já estava dentro sai por rotina, turno, transporte ou proposta melhor.
 * Continua operacional e continua opcional.
 */
export type MotivoSaida =
  | 'horario-ou-transporte'
  | 'rotina-diferente-do-combinado'
  | 'outra-proposta'
  | 'fim-do-contrato-de-experiencia'
  | 'outro';

/** O desfecho de uma pessoa encaminhada, como fica gravado. */
export type ReferralOutcome = {
  hiring: DesfechoContratacao;
  /** Quando a empresa respondeu o primeiro momento. */
  hiringAt: string | null;
  /** Motivo do "não contratei". Opcional, sempre. */
  hiringReason: MotivoNaoContratacao | null;
  /** Complemento em texto livre, quando a empresa quis escrever. */
  hiringNote: string | null;
  retention: DesfechoPermanencia;
  /** Quando a empresa respondeu o segundo momento. */
  retentionAt: string | null;
  /** Motivo da saída. Opcional, sempre. */
  retentionReason: MotivoSaida | null;
  retentionNote: string | null;
};

/* ------------------------------------------------------------------ *
 * Vocabulário de tela
 * ------------------------------------------------------------------ */

/**
 * As palavras dos botões, na voz de quem clica.
 *
 * Primeira pessoa porque quem responde é o RH falando do próprio processo:
 * "Contratei" é o que ele faria ao telefone, "Registrar contratação" é o que
 * um sistema diria.
 */
export const DESFECHO_BOTAO: Record<'contratou' | 'nao-contratou', string> = {
  contratou: 'Contratei',
  'nao-contratou': 'Não contratei'
};

export const DESFECHO_LABEL: Record<DesfechoContratacao, string> = {
  pendente: 'Aguardando a empresa',
  contratou: 'Contratou',
  'nao-contratou': 'Não contratou'
};

export const PERMANENCIA_LABEL: Record<DesfechoPermanencia, string> = {
  pendente: 'Sem resposta',
  continua: 'Continua na equipe',
  'saiu-antes-de-90-dias': 'Saiu antes de 90 dias'
};

/** Rótulos do motivo, em palavra comum e sem juízo sobre a pessoa. */
export const MOTIVO_NAO_CONTRATOU_LABEL: Record<MotivoNaoContratacao, string> =
  {
    'expectativa-salarial': 'Não combinamos o salário',
    'perfil-equipe': 'Não encaixou no jeito da equipe',
    'desistencia-candidato': 'A pessoa desistiu',
    'vaga-cancelada': 'A vaga foi cancelada',
    outro: 'Outro motivo'
  };

export const MOTIVO_SAIDA_LABEL: Record<MotivoSaida, string> = {
  'horario-ou-transporte': 'Horário ou transporte',
  'rotina-diferente-do-combinado': 'A rotina era diferente do combinado',
  'outra-proposta': 'Recebeu outra proposta',
  'fim-do-contrato-de-experiencia': 'Fim do contrato de experiência',
  outro: 'Outro motivo'
};

export const MOTIVOS_NAO_CONTRATOU = Object.keys(
  MOTIVO_NAO_CONTRATOU_LABEL
) as MotivoNaoContratacao[];

export const MOTIVOS_SAIDA = Object.keys(MOTIVO_SAIDA_LABEL) as MotivoSaida[];

/**
 * A linha que a empresa lê antes de clicar (PRODUTO.md §5.6).
 *
 * Uma linha, não um parágrafo: quem abre o link tem cinco minutos. Diz para
 * que serve o clique, quem vê e o que ele não é.
 */
export const AVISO_DEVOLUTIVA =
  'O IEL usa esta resposta só para medir quantas contratações duram, por empresa. Não vira avaliação da pessoa e não vai para o currículo dela.';

/* ------------------------------------------------------------------ *
 * Regras
 * ------------------------------------------------------------------ */

/** A janela de permanência que o IEL mede. */
export const PERMANENCIA_DIAS = 90;

const DAY_MS = 86_400_000;

/** Dias inteiros entre duas datas ISO. Negativo se `ate` for anterior. */
export function diasEntre(de: string, ate: string): number {
  const inicio = Date.parse(`${de.slice(0, 10)}T00:00:00.000Z`);
  const fim = Date.parse(`${ate.slice(0, 10)}T00:00:00.000Z`);
  if (Number.isNaN(inicio) || Number.isNaN(fim)) return 0;
  return Math.round((fim - inicio) / DAY_MS);
}

/** Desfecho em branco: ninguém respondeu nada ainda. */
export const DEVOLUTIVA_PENDENTE: ReferralOutcome = {
  hiring: 'pendente',
  hiringAt: null,
  hiringReason: null,
  hiringNote: null,
  retention: 'pendente',
  retentionAt: null,
  retentionReason: null,
  retentionNote: null
};

/**
 * Lê o desfecho de um item de encaminhamento.
 *
 * `outcome` é opcional no `ReferralItem` porque encaminhamentos registrados
 * antes desta funcionalidade — inclusive os que estão no `localStorage` de
 * quem já abriu a demonstração — não têm o campo. Ausente significa
 * "pendente", nunca "não contratou": silêncio da empresa é o problema que
 * este recurso ataca, não um desfecho.
 */
export function lerDevolutiva(
  outcome: ReferralOutcome | undefined
): ReferralOutcome {
  return outcome ?? DEVOLUTIVA_PENDENTE;
}

/**
 * Onde está o segundo momento, hoje.
 *
 * - `nao-se-aplica` — não houve contratação; não há permanência a perguntar.
 * - `no-prazo` — contratou há menos de 90 dias e ninguém avisou nada. A tela
 *   deixa a porta aberta ("se ela sair antes, avise aqui") e não insiste.
 * - `a-perguntar` — os 90 dias se completaram e a empresa não respondeu. É
 *   aqui que o produto pergunta de novo, sozinho.
 * - `continua` / `saiu-antes-de-90-dias` — a empresa respondeu.
 *
 * Derivado, nunca gravado: o que muda com o tempo não pode ficar congelado
 * num campo, senão "a perguntar" dependeria de alguém rodar uma rotina.
 */
export type EstadoDaPermanencia =
  | 'nao-se-aplica'
  | 'no-prazo'
  | 'a-perguntar'
  | 'continua'
  | 'saiu-antes-de-90-dias';

export function estadoDaPermanencia(
  outcome: ReferralOutcome,
  hoje: string
): EstadoDaPermanencia {
  if (outcome.hiring !== 'contratou') return 'nao-se-aplica';
  if (outcome.retention !== 'pendente') return outcome.retention;
  if (!outcome.hiringAt) return 'no-prazo';
  return diasEntre(outcome.hiringAt, hoje) >= PERMANENCIA_DIAS
    ? 'a-perguntar'
    : 'no-prazo';
}

/**
 * Há quantos dias esta pessoa espera resposta da empresa.
 *
 * É o número que a analista usa para cobrar — "a gente tem que ficar em cima"
 * (00:44:09). Conta do envio até hoje enquanto o primeiro momento estiver
 * pendente; depois disso, conta da contratação, porque o que passa a estar em
 * aberto é a permanência. `null` quando não há nada a esperar.
 */
export function diasEsperando(
  outcome: ReferralOutcome,
  enviadoEm: string | null,
  hoje: string
): number | null {
  if (outcome.hiring === 'pendente') {
    return enviadoEm ? Math.max(0, diasEntre(enviadoEm, hoje)) : null;
  }
  if (
    estadoDaPermanencia(outcome, hoje) === 'a-perguntar' &&
    outcome.hiringAt
  ) {
    return Math.max(0, diasEntre(outcome.hiringAt, hoje) - PERMANENCIA_DIAS);
  }
  return null;
}

/** Verdadeiro quando a empresa já respondeu o primeiro momento. */
export function temDevolutiva(outcome: ReferralOutcome): boolean {
  return outcome.hiring !== 'pendente';
}
