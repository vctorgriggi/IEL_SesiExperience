import 'server-only';

import { env } from '@/env';

export { SALA_PADRAO } from './sincronia';

/**
 * O estado da demo mora no servidor?
 *
 * Só quando as duas coisas estão presentes: a chave que liga o modo e um
 * banco para guardar a sala. Uma sem a outra é o modo de sempre — estado no
 * localStorage de cada navegador — para que rodar local sem configurar nada
 * continue funcionando e para que ligar a chave sem banco não derrube a
 * rota com um 500 na frente do cliente.
 *
 * `DATABASE_URL` é lida direto do ambiente, e não de `@workspace/database`,
 * porque o cliente do banco valida a variável ao ser importado e lançaria
 * quando ela falta — justamente o caso que esta função existe para detectar.
 */
export function estadoCompartilhadoLigado(): boolean {
  return (
    env.IEL_ESTADO_COMPARTILHADO === '1' &&
    Boolean(process.env.DATABASE_URL?.trim())
  );
}
