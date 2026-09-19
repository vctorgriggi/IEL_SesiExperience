import type { FitAxisId } from '../analysis/fit-axes';
import { blocoDoConvite, itensDoTema } from '../analysis/instrumento';
import type { CultureAnswer } from '../types';
import { DEMO_CULTURE_INVITES } from './culture-invites';
import {
  agregarRespostas,
  createRandom,
  responderFrase,
  type AlvoCultural,
  type RespostaIndividual
} from './respostas-sinteticas';

/**
 * Respostas registradas sobre a cultura das empresas curadas.
 *
 * Saem dos convites de `DEMO_CULTURE_INVITES`: cada convite respondido
 * responde o próprio bloco de frases, com o alvo do seu papel, e o resultado
 * é agregado por frase, papel e valor — nenhum registro diz quem respondeu.
 *
 * A distribuição é desenhada para mostrar o que uma fonte única esconderia.
 * Na Cerrado Distribuição, a gestão diz que quem entra tem acompanhamento
 * ("Autonomia" baixa); a equipe, consultada de forma agregada e anônima,
 * responde que cada um se organiza sozinho. Não é contradição a ser resolvida
 * escolhendo um lado: é a informação mais útil da tela, porque é disso que a
 * pessoa que entrar vai depender no primeiro mês.
 *
 * A Oficina Pantanal aparece com consulta insuficiente de propósito: duas
 * respostas de equipe não são "a equipe", e nenhuma frase fecha.
 */

/** Semente própria das respostas curadas. */
const SEED_CULTURA_CURADA = 20260919;

/** Cerrado Distribuição, pela equipe: alterna demandas, cada um por si. */
const CERRADO_EQUIPE: AlvoCultural = {
  temas: {
    'orientacao-resultados': 4.5,
    inovacao: 4,
    'aprendizado-desenvolvimento': 2.5,
    'foco-cliente': 4,
    'etica-seguranca': 4,
    'execucao-ritmo': 1.5,
    'regras-decisao': 2,
    'interacao-convivencia': 4.5,
    'lideranca-autonomia': 5,
    'adaptacao-carreira': 2.5
  }
};

/** A gestão da Cerrado: igual à equipe, menos na autonomia. */
const CERRADO_GESTAO: AlvoCultural = {
  temas: { ...CERRADO_EQUIPE.temas, 'lideranca-autonomia': 2 }
};

/**
 * Temas que a gestão da Cerrado já confirmou pela tela da empresa. Os demais
 * ficam com a proposta da análise pendente (`cultureSuggestions`).
 */
const CERRADO_TEMAS_DA_GESTAO: FitAxisId[] = [
  'lideranca-autonomia',
  'interacao-convivencia'
];

/** Horizonte Alimentos: linha de produção, procedimento e acompanhamento. */
const HORIZONTE: AlvoCultural = {
  temas: {
    'orientacao-resultados': 4.5,
    inovacao: 4,
    'aprendizado-desenvolvimento': 2.5,
    'foco-cliente': 3.5,
    'etica-seguranca': 3.5,
    'execucao-ritmo': 4,
    'regras-decisao': 4.5,
    'interacao-convivencia': 3,
    'lideranca-autonomia': 2,
    'adaptacao-carreira': 3.5
  }
};

/** Oficina Pantanal: cada um cuida do próprio serviço. */
const PANTANAL: AlvoCultural = {
  temas: {
    'orientacao-resultados': 4,
    inovacao: 3,
    'aprendizado-desenvolvimento': 4,
    'foco-cliente': 3,
    'etica-seguranca': 3.5,
    'execucao-ritmo': 3,
    'regras-decisao': 3,
    'interacao-convivencia': 3.5,
    'lideranca-autonomia': 4,
    'adaptacao-carreira': 3
  }
};

/** Os alvos de cada empresa curada, para os convites e para os candidatos. */
const ALVO_CULTURAL_CURADO: Record<string, AlvoCultural> = {
  'EMP-01': CERRADO_EQUIPE,
  'EMP-02': HORIZONTE,
  'EMP-03': PANTANAL
};

function alvoDoConvite(companyId: string, role: string): AlvoCultural {
  if (companyId === 'EMP-01' && role !== 'equipe') return CERRADO_GESTAO;
  return ALVO_CULTURAL_CURADO[companyId] ?? CERRADO_EQUIPE;
}

function construir(): CultureAnswer[] {
  const random = createRandom(SEED_CULTURA_CURADA);
  const porEmpresa = new Map<string, RespostaIndividual[]>();
  const datas = new Map<string, string>();

  for (const convite of DEMO_CULTURE_INVITES) {
    if (!convite.answeredAt) continue;
    const alvo = alvoDoConvite(convite.companyId, convite.role);
    const lista = porEmpresa.get(convite.companyId) ?? [];
    for (const item of blocoDoConvite(convite)) {
      lista.push({
        itemId: item.id,
        value: responderFrase(item, alvo, random),
        respondent: convite.role
      });
    }
    porEmpresa.set(convite.companyId, lista);
    datas.set(`${convite.companyId}:${convite.role}`, convite.answeredAt);
  }

  // A gestão da Cerrado respondeu pela tela da empresa, tema a tema, sem
  // convite — como a proposta assistida registra ao ser confirmada.
  const cerrado = porEmpresa.get('EMP-01') ?? [];
  for (const tema of CERRADO_TEMAS_DA_GESTAO) {
    for (const item of itensDoTema(tema)) {
      cerrado.push({
        itemId: item.id,
        value: responderFrase(item, CERRADO_GESTAO, random, 0),
        respondent: 'gestao'
      });
    }
  }
  porEmpresa.set('EMP-01', cerrado);
  datas.set('EMP-01:gestao', '2026-09-05');

  return [...porEmpresa.entries()].flatMap(([companyId, respostas]) =>
    agregarRespostas(companyId, `CUL-${companyId}`, respostas, (role) =>
      (datas.get(`${companyId}:${role}`) ?? '2026-09-05').slice(0, 10)
    )
  );
}

export const DEMO_CULTURE_ANSWERS: CultureAnswer[] = construir();
