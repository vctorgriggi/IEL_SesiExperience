import 'server-only';

import { buildInitialDemoState, DEMO_SCHEMA_VERSION } from '../fixtures';
import { demoReducer, type DemoAction } from './reducer';
import { fromPersisted, toPersisted, type PersistedState } from './storage';

/**
 * A sala da demonstração no banco (modo compartilhado).
 *
 * É o mesmo ciclo do navegador, só que no servidor: o delta gravado
 * (`PersistedState`) vira estado inteiro com `fromPersisted`, a ação passa
 * pelo `demoReducer` e o resultado volta a delta com `toPersisted`. O
 * reducer é a única regra de negócio; aqui não há lógica de domínio.
 *
 * Concorrência: as ações são semânticas ("respondeu o questionário", "marcou
 * contratado"), não diffs de estado. Aplicá-las na ordem de chegada sobre o
 * estado mais novo é o resultado certo, e o `SELECT ... FOR UPDATE` dentro
 * da transação é o que impõe essa ordem quando duas pessoas agem ao mesmo
 * tempo. Não há CRDT nem merge — não precisa.
 */

export type SalaLida = {
  revisao: number;
  schemaVersion: number;
  persisted: PersistedState;
};

export type SalaGravada = {
  revisao: number;
  persisted: PersistedState;
};

/**
 * O banco entra por import dinâmico: `@workspace/database` valida
 * `DATABASE_URL` ao ser carregado, e este módulo é importado pelas rotas
 * mesmo quando o modo compartilhado está desligado. Carregar só na primeira
 * chamada mantém o "sem banco, nada muda".
 */
async function banco() {
  return import('@workspace/database');
}

/** O delta de uma sala recém-criada: nada além da base fictícia. */
function deltaVazio(): PersistedState {
  return toPersisted(buildInitialDemoState());
}

/**
 * Um delta gravado com outra `schemaVersion` foi feito sobre outra base e
 * não rehidrata com segurança — a mesma regra do localStorage. Descarta e
 * avisa no log, porque a demo "voltar ao começo" sem explicação confunde.
 */
function deltaValido(
  salaId: string,
  schemaVersion: number,
  estado: unknown
): PersistedState {
  if (schemaVersion !== DEMO_SCHEMA_VERSION) {
    console.warn(
      `[iel-demo] sala "${salaId}" gravada com schema ${schemaVersion}; ` +
        `a base atual é ${DEMO_SCHEMA_VERSION}. Delta descartado.`
    );
    return deltaVazio();
  }
  return estado as PersistedState;
}

/**
 * Garante a linha da sala. `ON CONFLICT DO NOTHING` deixa duas primeiras
 * leituras simultâneas convergirem sem erro.
 */
async function garantirSala(salaId: string): Promise<void> {
  const { db, ielDemoSalaTable } = await banco();
  await db
    .insert(ielDemoSalaTable)
    .values({
      id: salaId,
      schemaVersion: DEMO_SCHEMA_VERSION,
      estado: deltaVazio(),
      revisao: 0
    })
    .onConflictDoNothing();
}

/** Lê a sala; cria com delta vazio se for a primeira vez. */
export async function lerSala(salaId: string): Promise<SalaLida> {
  const { db, eq, ielDemoSalaTable } = await banco();
  await garantirSala(salaId);

  const [sala] = await db
    .select({
      revisao: ielDemoSalaTable.revisao,
      schemaVersion: ielDemoSalaTable.schemaVersion,
      estado: ielDemoSalaTable.estado
    })
    .from(ielDemoSalaTable)
    .where(eq(ielDemoSalaTable.id, salaId))
    .limit(1);

  if (!sala) {
    throw new Error(`[iel-demo] sala "${salaId}" não existe após criação.`);
  }

  return {
    revisao: sala.revisao,
    schemaVersion: DEMO_SCHEMA_VERSION,
    persisted: deltaValido(salaId, sala.schemaVersion, sala.estado)
  };
}

/**
 * Aplica uma ação do reducer sobre o estado mais novo da sala e grava.
 *
 * Tudo numa transação com a linha travada: carregar → reconstruir → reduzir
 * → gravar delta e `revisao + 1` → registrar o evento. Devolve o delta
 * autoritativo, que o cliente usa para se realinhar.
 */
export async function aplicarAcao(
  salaId: string,
  action: DemoAction
): Promise<SalaGravada> {
  const { db, eq, sql, ielDemoSalaTable, ielDemoEventoTable } = await banco();
  await garantirSala(salaId);

  return db.transaction(async (tx) => {
    const [sala] = await tx
      .select({
        revisao: ielDemoSalaTable.revisao,
        schemaVersion: ielDemoSalaTable.schemaVersion,
        estado: ielDemoSalaTable.estado
      })
      .from(ielDemoSalaTable)
      .where(eq(ielDemoSalaTable.id, salaId))
      .limit(1)
      .for('update');

    if (!sala) {
      throw new Error(`[iel-demo] sala "${salaId}" sumiu durante a ação.`);
    }

    const atual = fromPersisted(
      deltaValido(salaId, sala.schemaVersion, sala.estado)
    );
    const proximo = demoReducer(atual, action);
    const persisted = toPersisted(proximo);
    const revisao = sala.revisao + 1;

    await tx
      .update(ielDemoSalaTable)
      .set({
        estado: persisted,
        schemaVersion: DEMO_SCHEMA_VERSION,
        revisao,
        // `now()` do banco: o relógio da demo (`nowIso`) é para o domínio;
        // este carimbo é operacional e vem do próprio Postgres.
        atualizadoEm: sql`now()`
      })
      .where(eq(ielDemoSalaTable.id, salaId));

    await tx.insert(ielDemoEventoTable).values({
      salaId,
      acao: action as unknown as Record<string, unknown>,
      revisao
    });

    return { revisao, persisted };
  });
}

/**
 * Volta a sala à base fictícia. A revisão continua subindo — é assim que os
 * outros aparelhos percebem que precisam rehidratar — e o log ganha um
 * evento `reset` para o reinício aparecer na trilha.
 */
export async function reiniciarSala(salaId: string): Promise<SalaGravada> {
  return aplicarAcao(salaId, { type: 'reset' });
}
