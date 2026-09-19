import { defineConfig } from 'drizzle-kit';

import { keys } from './src/keys';

export default defineConfig({
  dialect: 'postgresql',
  out: './drizzle',
  schema: './src/schemas/index.ts',
  dbCredentials: {
    url: keys().DATABASE_URL
  },
  schemaFilter: 'public',
  tablesFilter: '*',
  introspect: {
    casing: 'camel'
  },
  migrations: {
    prefix: 'timestamp',
    table: '__drizzle_migrations__',
    schema: 'public'
  },
  breakpoints: true,
  strict: true,
  verbose: true
});
