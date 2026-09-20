/**
 * A última peneira antes de um texto livre chegar ao candidato.
 *
 * R5 (00:22:21, 00:38:43) diz que o nome da empresa não aparece para o
 * candidato antes da entrevista, e o produto cumpre isso onde o dado é
 * estruturado: a vaga só chega por `getCandidateJobView`, um tipo fechado de
 * quatro campos, e nada na superfície do candidato lê `Company`.
 *
 * Texto livre é outra história. Um registro do currículo ou da ligação é
 * escrito por gente, e gente escreve "Candidatura EMPG-DEMO-CAND-8801
 * (Cerrado Distribuição)" ou "a inscrição na Horizonte Alimentos é de
 * 02/07/2026". O campo não tem culpa — ele guarda procedência, que é
 * exatamente o que a transparência precisa mostrar (LGPD, art. 9º). O que não
 * pode é o nome viajar junto.
 *
 * Então aqui o nome sai e a frase fica: "Candidatura EMPG-DEMO-CAND-8801" e
 * "a inscrição na empresa é de 02/07/2026". A pessoa continua vendo de onde
 * veio cada registro e quando; o que ela não vê é qual empresa — e é isso que
 * a regra pede.
 *
 * É rede de segurança, não a defesa principal: a defesa principal continua
 * sendo não colocar o nome no caminho do candidato. Quando um campo novo de
 * texto livre chegar à superfície dele, é por aqui que ele passa.
 */

import { DEMO_COMPANIES } from '../fixtures';
import { getVisibleCompanies } from '../state/selectors';
import type { DemoState } from '../types';

/** O que entra no lugar do nome. Sem artigo colado, para não duplicar. */
const SUBSTITUTO = 'a empresa';

/**
 * Os nomes a esconder.
 *
 * A união de duas listas de propósito: `getVisibleCompanies` devolve o que a
 * persona corrente enxerga (e a persona pode estar restrita a uma empresa),
 * enquanto o catálogo curado tem as três empresas que os registros escritos à
 * mão citam. Esconder de menos é o único erro que importa aqui.
 */
export function nomesDeEmpresa(state: DemoState): string[] {
  const nomes = new Set<string>();
  for (const company of getVisibleCompanies(state)) nomes.add(company.name);
  for (const company of DEMO_COMPANIES) nomes.add(company.name);
  return [...nomes].filter((nome) => nome.trim().length > 2);
}

function escapar(valor: string): string {
  return valor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * O texto sem nenhum dos nomes, com a frase ainda de pé.
 *
 * Os nomes maiores saem primeiro, para "Cerrado Distribuição" não virar
 * "Cerrado a empresa" quando existir uma "Distribuição" na lista. Depois,
 * duas limpezas de português: o parêntese que existia só para carregar o nome
 * some, e a preposição que já traz o artigo ("na a empresa") volta ao normal.
 */
export function semNomeDeEmpresa(
  texto: string,
  nomes: readonly string[]
): string {
  let saida = texto;

  for (const nome of [...nomes].sort((a, b) => b.length - a.length)) {
    saida = saida.replace(new RegExp(escapar(nome), 'gi'), SUBSTITUTO);
  }

  return saida
    .replace(/\s*\(a empresa\)/gi, '')
    .replace(/\b(n|d|pel)a a empresa\b/gi, '$1a empresa')
    .replace(/\bà a empresa\b/gi, 'à empresa')
    .replace(/\ba a empresa\b/gi, 'a empresa');
}
