/**
 * Texto de busca comparável: minúsculo e sem acento.
 *
 * Quem digita "sinop alimentos" rápido não põe acento, e "Várzea" precisa
 * aparecer para "varzea". Todas as buscas das listas grandes e do ⌘K passam
 * por aqui para responderem igual.
 */
export function normalizarBusca(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}
