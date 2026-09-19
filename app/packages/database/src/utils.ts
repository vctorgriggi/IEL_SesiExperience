import { sql, and, is, type SQL, type AnyColumn, type SelectedFields } from 'drizzle-orm';
import type { Column, Table } from 'drizzle-orm';
import type { GetColumnData } from 'drizzle-orm';
import { PgTimestampString } from 'drizzle-orm/pg-core';
import { SelectResultFields } from 'drizzle-orm/query-builders/select.types';


function jsonBuildObject<T extends SelectedFields<Column, Table>>(shape: T) {
  if (shape == null || typeof shape !== 'object') {
    throw new Error(
      'jsonBuildObject: shape must be a non-null object (got ' + String(shape) + ')'
    );
  }
  const chunks: SQL[] = [];

  Object.entries(shape)
    .filter(([_, value]) => value)
    .forEach(([key, value]) => {
      if (chunks.length > 0) {
        chunks.push(sql.raw(`,`));
      }

      chunks.push(sql.raw(`'${key}',`));

      if (is(value, PgTimestampString)) {
        chunks.push(sql`timezone('UTC', ${value})`);
      } else {
        chunks.push(sql`${value}`);
      }
    });

  return sql<SelectResultFields<T>>`json_build_object(${sql.join(chunks)})`;
}

export function jsonAggBuildObject<
  T extends SelectedFields<Column, Table>,
  Column extends AnyColumn
>(shape: T) {
  if (shape == null || typeof shape !== 'object') {
    throw new Error(
      'jsonAggBuildObject: shape must be a non-null object (got ' + String(shape) + ')'
    );
  }
  return sql<SelectResultFields<T>[]>`coalesce(
    json_agg(${jsonBuildObject(shape)})
    FILTER (WHERE ${and(
      sql.join(
        Object.values(shape)
        .filter((value) => value)
        .map((value) => sql`${sql`${value}`} IS NOT NULL`),
        sql` AND `
      )
    )})
    ,'${sql`[]`}')`;
}


export function coalesce<T>(value: SQL.Aliased<T> | SQL<T>, defaultValue: SQL) {
  return sql<T>`coalesce(${value}, ${defaultValue})`;
}


export function arrayAgg<Column extends AnyColumn>(column: Column) {
  return coalesce<GetColumnData<Column, 'raw'>[]>(
    sql`json_agg(distinct ${sql`${column}`}) filter (where ${column} is not null)`,
    sql`'[]'`
  );
}
