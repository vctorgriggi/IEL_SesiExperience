/**
 * Hash hexadecimal determinístico.
 *
 * Existe porque duas coisas do protótipo precisam de identificador estável e
 * nenhuma pode usar `Math.random`: o token de convite do colaborador (que não
 * pode carregar dado pessoal na URL, PRODUTO.md §5) e os ids dos registros
 * criados por importação de planilha (que precisam ser os mesmos na segunda
 * importação, senão reimportar duplicaria a base).
 *
 * **Não é criptográfico e não pretende ser.** É FNV-1a com mistura final,
 * escolhido por caber em vinte linhas e não trazer dependência. Num produto
 * real o token de convite sai de um gerador aleatório seguro e fica guardado
 * como hash; aqui ele só precisa ser opaco para quem lê a URL e idêntico a
 * cada carga da demonstração.
 */

const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

function fnv1a(input: string, seed: number): number {
  let hash = (FNV_OFFSET_BASIS ^ seed) >>> 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash ^ input.charCodeAt(index)) >>> 0;
    hash = Math.imul(hash, FNV_PRIME) >>> 0;
  }
  return hash >>> 0;
}

/**
 * Devolve `length` caracteres hexadecimais derivados de `input`.
 *
 * Cada bloco de 8 caracteres usa uma semente diferente, para que 16 caracteres
 * não sejam a repetição dos mesmos 32 bits.
 */
export function hashHex(input: string, length: number): string {
  let out = '';
  let round = 0;
  while (out.length < length) {
    out += fnv1a(input, round).toString(16).padStart(8, '0');
    round += 1;
  }
  return out.slice(0, length);
}
