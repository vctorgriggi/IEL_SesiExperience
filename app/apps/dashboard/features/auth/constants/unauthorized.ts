/**
 * Mensagem retornada quando a sessão é inválida ou expirada.
 * O cliente pode comparar result.serverError === UNAUTHORIZED_SESSION_MESSAGE
 * para chamar signOut() e redirecionar (ex.: em runSafeAction com onUnauthorized).
 */
export const UNAUTHORIZED_SESSION_MESSAGE =
  'Sessão inválida ou expirada. Faça login novamente.';
