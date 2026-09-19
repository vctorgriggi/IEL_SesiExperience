/**
 * Formatação de texto compartilhada pelo protótipo IEL.
 *
 * Fica em `features/` (e não junto dos componentes) porque o estado e os
 * seletores também montam frases exibidas na interface.
 */

/**
 * Concorda número e substantivo: `plural(1, 'solicitação', 'solicitações')`
 * devolve "1 solicitação". Evita o "1 solicitação(ões)" que denuncia texto
 * gerado por template.
 */
export function plural(
  count: number,
  singular: string,
  many: string,
  options?: { includeCount?: boolean }
): string {
  const word = count === 1 ? singular : many;
  return options?.includeCount === false ? word : `${count} ${word}`;
}
