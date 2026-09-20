import { relations } from 'drizzle-orm';
import {
  bigserial,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp
} from 'drizzle-orm/pg-core';

/**
 * Sala da demonstração do Mind RH (protótipo IEL).
 *
 * O estado da demo vive no navegador por padrão. Quando há banco e
 * `IEL_ESTADO_COMPARTILHADO=1`, ele passa a morar aqui, uma linha por sala,
 * para que o que o candidato responde no celular apareça no notebook da
 * analista. A sala padrão chama-se `principal`.
 *
 * `estado` guarda só o **delta** em relação à base fictícia (o mesmo
 * `PersistedState` de `features/iel-demo/state/storage.ts`), não o estado
 * inteiro: a base tem milhares de registros gerados de uma semente fixa e é
 * reconstruída a cada leitura, como já acontece com o localStorage. Por isso
 * o `schemaVersion` anda junto — mudou a base, o delta gravado deixa de
 * valer e é descartado, a mesma regra do navegador.
 *
 * `revisao` sobe a cada gravação. É o que o cliente compara no polling para
 * saber se precisa rehidratar. Base fictícia: nenhuma linha aqui é de pessoa
 * real.
 */
export const ielDemoSalaTable = pgTable('iel_demo_salas', {
  id: text('id').primaryKey().notNull(),
  schemaVersion: integer('schema_version').notNull(),
  estado: jsonb('estado').$type<Record<string, unknown>>().notNull(),
  revisao: integer('revisao').default(0).notNull(),
  atualizadoEm: timestamp('atualizado_em', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull()
});

/**
 * Log de ações aplicadas na sala: só escrita.
 *
 * Serve para auditoria e para contar "o que aconteceu na demo". A leitura
 * nunca depende dele — o estado vem da sala. É um log de demonstração:
 * cresce a cada ação e não é podado; para produção, seria uma trilha por
 * pessoa com retenção definida.
 */
export const ielDemoEventoTable = pgTable(
  'iel_demo_eventos',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey().notNull(),
    salaId: text('sala_id')
      .notNull()
      .references(() => ielDemoSalaTable.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade'
      }),
    /** A ação do reducer como o cliente mandou, com o `at` da demo. */
    acao: jsonb('acao').$type<Record<string, unknown>>().notNull(),
    /** A revisão da sala depois desta ação. */
    revisao: integer('revisao').notNull(),
    registradoEm: timestamp('registrado_em', {
      withTimezone: true,
      mode: 'date'
    })
      .defaultNow()
      .notNull()
  },
  (table) => [
    index('IX_iel_demo_eventos_sala_id_revisao').using(
      'btree',
      table.salaId.asc().nullsLast(),
      table.revisao.asc().nullsLast()
    )
  ]
);

export const ielDemoSalaRelations = relations(ielDemoSalaTable, ({ many }) => ({
  eventos: many(ielDemoEventoTable)
}));

export const ielDemoEventoRelations = relations(
  ielDemoEventoTable,
  ({ one }) => ({
    sala: one(ielDemoSalaTable, {
      fields: [ielDemoEventoTable.salaId],
      references: [ielDemoSalaTable.id]
    })
  })
);
