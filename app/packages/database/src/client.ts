import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schemas/index';
import { keys } from './keys';

const connectionString = keys().DATABASE_URL;
const requiresSsl = connectionString.includes('sslmode=require');

const client = postgres(connectionString, {
  prepare: false,
  ...(requiresSsl && { ssl: { rejectUnauthorized: true } })
});

export const db = drizzle(client, { schema });
export type DatabaseType = typeof db;
export type TransactionType = Parameters<Parameters<DatabaseType['transaction']>[0]>[0];