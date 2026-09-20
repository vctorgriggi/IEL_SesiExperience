/**
 * Quanto custa reabrir a mesma vaga — o argumento de adesão (S5).
 *
 * O IEL não cobra da indústria: o serviço é subsidiado. Então a empresa não
 * compra a etapa nova (dez colaboradores respondendo 16 frases), ela é
 * convencida. O cliente disse de onde vem o convencimento: "mostrar quanto
 * custa cada recontratação… a solução precisa entregar esse número de forma
 * simples" (`docs/cliente/02:77`).
 *
 * Duas decisões sustentam este módulo:
 *
 * 1. **Nenhum número cai do céu.** Não há estatística de mercado aqui, nem
 *    "segundo estudos". O custo de reabrir uma vaga é montado por parcelas
 *    que a analista entende, vê na tela e ajusta durante a ligação. O que
 *    sai é sempre "com estas parcelas, dá X" — e cada parcela nasce marcada
 *    como estimativa do IEL, não como fato.
 * 2. **O custo é da vaga, nunca da pessoa.** A unidade de conta é a *vaga
 *    reaberta*: a mesma posição que voltou ao Empregare. Em lugar nenhum
 *    deste módulo alguém que saiu vira uma linha de despesa.
 *
 * O histórico (`fixtures/outcomes.ts`) diz quantas vezes **aquela** empresa
 * reabriu vaga nos últimos 12 meses, para o número ser o dela e não uma
 * média genérica. Empresa sem histórico não recebe média de consolo: a tela
 * diz que a base não tem (ausência é estado, nunca zero).
 */

import { DEMO_REFERENCE_DATE } from '../fixtures';
import { getOutcomesBase } from '../fixtures/outcomes';
import { MIN_RECORTE } from './analytics';

/* ------------------------------------------------------------------ *
 * Dinheiro
 * ------------------------------------------------------------------ */

const REAIS = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0
});

/**
 * Dinheiro do jeito que se fala ao telefone: "R$ 66.850".
 *
 * Sem centavos de propósito — as parcelas são estimativas redondas, e
 * "R$ 66.850,00" sugere uma precisão que o número não tem.
 */
export function formatarReais(valor: number): string {
  return REAIS.format(Math.round(valor));
}

/* ------------------------------------------------------------------ *
 * As parcelas
 * ------------------------------------------------------------------ */

export type ParcelaId = 'rescisao' | 'processo' | 'treinamento' | 'ateProduzir';

/**
 * O que a analista digita.
 *
 * Três parcelas são um valor em reais por vaga reaberta. A quarta é um
 * produto — dias até a pessoa nova render como a anterior, vezes o custo de
 * um dia de trabalho — porque no telefone "são 45 dias até render igual"
 * convence mais do que um total fechado que ninguém sabe de onde veio.
 */
export type Parcelas = {
  rescisao: number;
  processo: number;
  treinamento: number;
  diasAteProduzir: number;
  custoDoDia: number;
};

/**
 * Valores iniciais. **São estimativas do IEL, não medição.**
 *
 * Nasceram redondos e conservadores para uma vaga operacional de indústria,
 * e existem para dar um ponto de partida à conversa: a analista muda cada um
 * com o número que a empresa disser na hora. Nenhum deles é apresentado na
 * tela sem a palavra "estimativa" ao lado.
 */
export const PARCELAS_INICIAIS: Parcelas = {
  rescisao: 2800,
  processo: 1200,
  treinamento: 1500,
  diasAteProduzir: 45,
  custoDoDia: 90
};

/** Ganho de permanência que a analista supõe, em pontos percentuais. */
export const GANHO_INICIAL_PP = 10;

/** As hipóteses oferecidas no seletor, do mais tímido ao mais otimista. */
export const GANHOS_PP = [5, 10, 15, 20, 25] as const;

export type ParcelaCalculada = {
  id: ParcelaId;
  rotulo: string;
  valor: number;
  /** Como aquele valor se formou, em uma linha. */
  detalhe: string;
};

/** As quatro parcelas somadas, na ordem em que a ligação as percorre. */
export function calcularParcelas(parcelas: Parcelas): ParcelaCalculada[] {
  const ateProduzir = parcelas.diasAteProduzir * parcelas.custoDoDia;
  return [
    {
      id: 'rescisao',
      rotulo: 'Rescisão',
      valor: parcelas.rescisao,
      detalhe: 'Aviso, multa do FGTS e verbas do desligamento.'
    },
    {
      id: 'processo',
      rotulo: 'Novo processo e admissão',
      valor: parcelas.processo,
      detalhe: 'Horas do RH, exames, documentação e uniforme.'
    },
    {
      id: 'treinamento',
      rotulo: 'Treinamento e integração',
      valor: parcelas.treinamento,
      detalhe: 'Quem ensina para de produzir para ensinar.'
    },
    {
      id: 'ateProduzir',
      rotulo: 'Até produzir como antes',
      valor: ateProduzir,
      detalhe: `${parcelas.diasAteProduzir} dias × ${formatarReais(parcelas.custoDoDia)} por dia de trabalho.`
    }
  ];
}

/* ------------------------------------------------------------------ *
 * O que aquela empresa faz (histórico)
 * ------------------------------------------------------------------ */

export type HistoricoDeReabertura = {
  /** A empresa aparece no histórico de vagas encerradas. */
  naBase: boolean;
  /** Vagas que reabriram em até 90 dias de uma contratação, 12 meses. */
  reaberturas12m: number;
  /** Vagas encerradas da empresa nos mesmos 12 meses: o denominador. */
  vagas12m: number;
  /**
   * Reaberturas a cada 100 vagas. `null` com menos de `MIN_RECORTE` vagas:
   * três vagas não viram taxa.
   */
  taxaPor100: number | null;
  /** Cargo que mais reabriu, quando há um; dá concretude à ligação. */
  cargoMaisReaberto: string | null;
  /** Contratados da empresa com os 90 dias já vencidos. */
  apurados90: number;
  /**
   * % dos apurados que passou dos 90 dias. `null` com menos de
   * `MIN_RECORTE` apurados — é medida sobre pessoas, e recorte pequeno não
   * vira estatística.
   */
  permanencia90Pct: number | null;
};

const VAZIO: HistoricoDeReabertura = {
  naBase: false,
  reaberturas12m: 0,
  vagas12m: 0,
  taxaPor100: null,
  cargoMaisReaberto: null,
  apurados90: 0,
  permanencia90Pct: null
};

const DIA_MS = 24 * 60 * 60 * 1000;

/** Início da janela de 12 meses, na régua da data de referência da demo. */
const INICIO_12_MESES = new Date(
  Date.parse(`${DEMO_REFERENCE_DATE}T12:00:00.000Z`) - 365 * DIA_MS
)
  .toISOString()
  .slice(0, 10);

/**
 * Um índice por empresa, montado uma vez.
 *
 * São ~2.500 empresas na base e o histórico é imutável durante a
 * demonstração: varrer remessas e reaberturas a cada abertura de tela seria
 * desperdício. Aqui a varredura acontece na primeira pergunta e todas as
 * seguintes são busca em `Map`.
 */
let indice: Map<string, HistoricoDeReabertura> | null = null;

function construirIndice(): Map<string, HistoricoDeReabertura> {
  const base = getOutcomesBase();

  const cargoDaRemessa = new Map(base.remessas.map((r) => [r.id, r.cargo]));
  const acumulado = new Map<
    string,
    {
      reaberturas: number;
      vagas: number;
      cargos: Map<string, number>;
      apurados: number;
      ficaram: number;
    }
  >();

  const doComp = (companyId: string) => {
    const atual = acumulado.get(companyId) ?? {
      reaberturas: 0,
      vagas: 0,
      cargos: new Map<string, number>(),
      apurados: 0,
      ficaram: 0
    };
    acumulado.set(companyId, atual);
    return atual;
  };

  for (const remessa of base.remessas) {
    if (remessa.enviadaEm <= INICIO_12_MESES) continue;
    const item = doComp(remessa.companyId);
    item.vagas += 1;
    for (const contratado of remessa.contratados) {
      if (contratado.ficou90 === null) continue;
      item.apurados += 1;
      if (contratado.ficou90) item.ficaram += 1;
    }
  }

  for (const reabertura of base.reaberturas) {
    if (reabertura.reabertaEm <= INICIO_12_MESES) continue;
    const item = doComp(reabertura.companyId);
    item.reaberturas += 1;
    const cargo = cargoDaRemessa.get(reabertura.remessaId);
    if (cargo) item.cargos.set(cargo, (item.cargos.get(cargo) ?? 0) + 1);
  }

  const mapa = new Map<string, HistoricoDeReabertura>();
  for (const [companyId, item] of acumulado) {
    const maisReaberto = [...item.cargos.entries()].sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pt-BR')
    )[0];
    mapa.set(companyId, {
      naBase: true,
      reaberturas12m: item.reaberturas,
      vagas12m: item.vagas,
      taxaPor100:
        item.vagas >= MIN_RECORTE
          ? Math.round((100 * item.reaberturas) / item.vagas)
          : null,
      cargoMaisReaberto: maisReaberto?.[0] ?? null,
      apurados90: item.apurados,
      permanencia90Pct:
        item.apurados >= MIN_RECORTE
          ? Math.round((100 * item.ficaram) / item.apurados)
          : null
    });
  }
  return mapa;
}

/** O histórico de reabertura de uma empresa. Sem histórico, vem `naBase: false`. */
export function getHistoricoDeReabertura(
  companyId: string
): HistoricoDeReabertura {
  indice ??= construirIndice();
  return indice.get(companyId) ?? VAZIO;
}

/* ------------------------------------------------------------------ *
 * A conta
 * ------------------------------------------------------------------ */

export type CustoDaRotatividade = {
  /** Soma das quatro parcelas: o custo de uma vaga que reabre. */
  porVaga: number;
  parcelas: ParcelaCalculada[];
  /**
   * `porVaga` × reaberturas dos últimos 12 meses. `null` quando a base não
   * tem reabertura registrada para a empresa — não é zero, é sem dado.
   */
  noAno: number | null;
  /** Hipótese de ganho de permanência, em pontos percentuais. */
  ganhoPp: number;
  /** Projeção: `noAno` × `ganhoPp` / 100. `null` quando `noAno` é `null`. */
  economiaNoAno: number | null;
};

/**
 * "Com estas parcelas, dá X."
 *
 * `economiaNoAno` é **projeção**, não promessa: sai de uma hipótese que a
 * analista escolhe (`ganhoPp`) e que a tela mostra como hipótese. O Mind RH
 * não garante redução de rotatividade, e nada aqui deve ser lido assim.
 */
export function calcularCustoDaRotatividade(
  historico: HistoricoDeReabertura,
  parcelas: Parcelas,
  ganhoPp: number
): CustoDaRotatividade {
  const calculadas = calcularParcelas(parcelas);
  const porVaga = calculadas.reduce((total, item) => total + item.valor, 0);
  const noAno =
    historico.reaberturas12m > 0 ? porVaga * historico.reaberturas12m : null;
  return {
    porVaga,
    parcelas: calculadas,
    noAno,
    ganhoPp,
    economiaNoAno: noAno === null ? null : (noAno * ganhoPp) / 100
  };
}

/* ------------------------------------------------------------------ *
 * A frase que a analista lê ao telefone
 * ------------------------------------------------------------------ */

/**
 * O roteiro de ligação (`analytics.ts`) trouxe a ideia: o que vai ao
 * telefone é frase pronta, com as palavras de quem fala, não tabela. Esta é
 * a frase do custo — e ela termina admitindo que os valores são estimativa,
 * porque é assim que a analista abre espaço para a empresa corrigir com os
 * números dela.
 */
export function fraseParaLigacao(
  empresa: string,
  historico: HistoricoDeReabertura,
  custo: CustoDaRotatividade
): string {
  const parcelas =
    'rescisão, novo processo, treinamento e o tempo até a pessoa render como antes';
  const ressalva =
    'São estimativas nossas, e dá para ajustar com os números de vocês.';

  if (custo.noAno === null || historico.reaberturas12m === 0) {
    return [
      `A gente não tem reabertura registrada da ${empresa} nos últimos 12 meses.`,
      `Pelas parcelas que a gente usa — ${parcelas} —, cada vaga que reabre custa por volta de ${formatarReais(custo.porVaga)}.`,
      ressalva
    ].join(' ');
  }

  const vezes =
    historico.reaberturas12m === 1
      ? 'reabriu 1 vaga'
      : `reabriu ${historico.reaberturas12m} vagas`;
  const cargo = historico.cargoMaisReaberto
    ? `, e a que mais voltou foi ${historico.cargoMaisReaberto.toLowerCase()}`
    : '';

  return [
    `Nos últimos 12 meses a ${empresa} ${vezes}${cargo}.`,
    `Pelas parcelas que a gente usa — ${parcelas} —, cada uma custa por volta de ${formatarReais(custo.porVaga)}, o que dá perto de ${formatarReais(custo.noAno)} no ano.`,
    custo.economiaNoAno === null
      ? ''
      : `Se ${custo.ganhoPp} em cada 100 contratados a mais passarem dos 90 dias, são uns ${formatarReais(custo.economiaNoAno)} que deixam de sair — é uma conta de hipótese, não uma promessa.`,
    ressalva
  ]
    .filter((parte) => parte.length > 0)
    .join(' ');
}
