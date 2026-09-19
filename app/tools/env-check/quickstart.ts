/// <reference types="bun-types" />
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { createConnection } from 'node:net';
import { dirname, resolve } from 'node:path';

const POSTGRES_PORT = 5432;
const PORT_CHECK_TIMEOUT_MS = 2000;
const DEFAULT_DATABASE_URL = 'postgresql://arki_user:arki_password@localhost:5432/arki_events';

const ENV_FILES = [
  { examplePath: 'apps/dashboard/.env.example', envPath: 'apps/dashboard/.env' },
  { examplePath: 'packages/database/.env.example', envPath: 'packages/database/.env' }
] as const;

const DATABASE_URL_ENV_PATHS = [
  'apps/dashboard/.env',
  'packages/database/.env'
] as const;

const AUTH_SECRET_ENV_PATHS = ['apps/dashboard/.env'] as const;

const APPS = [
  { name: 'Dashboard', cmd: 'bun --filter @workspace/dashboard dev', url: 'http://localhost:3000' }
] as const;

function resolvePath(relativePath: string): string {
  return resolve(process.cwd(), relativePath);
}

function isPortOpen(host: string, port: number): Promise<boolean> {
  return new Promise((resolvePromise) => {
    const socket = createConnection(port, host, () => {
      socket.destroy();
      resolvePromise(true);
    });
    socket.on('error', () => resolvePromise(false));
    socket.setTimeout(PORT_CHECK_TIMEOUT_MS, () => {
      socket.destroy();
      resolvePromise(false);
    });
  });
}

function runCommand(cmd: string[], label: string): void {
  const proc = Bun.spawnSync({
    cmd,
    stdout: 'inherit',
    stderr: 'inherit',
    stdin: 'inherit'
  });

  if (proc.exitCode !== 0) {
    throw new Error(`${label} falhou.`);
  }
}

function logStep(message: string): void {
  console.log(`\n==> ${message}`);
}

function setKeyInEnvFile(envPath: string, key: string, value: string): void {
  const fullPath = resolvePath(envPath);
  const raw = existsSync(fullPath) ? readFileSync(fullPath, 'utf8') : '';
  const keyRegex = new RegExp(`^${key}=.*`, 'm');
  const newLine = `${key}=${value}`;

  let updated: string;
  if (keyRegex.test(raw)) {
    updated = raw.replace(keyRegex, newLine);
  } else {
    const prefix = raw.trimEnd();
    updated = prefix ? `${prefix}\n${newLine}\n` : `${newLine}\n`;
  }

  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, updated);
}

function getDatabaseUrl(): string {
  const dbEnvPath = resolvePath('packages/database/.env');
  if (!existsSync(dbEnvPath)) return DEFAULT_DATABASE_URL;

  const raw = readFileSync(dbEnvPath, 'utf8');
  const match = raw.match(/^\s*DATABASE_URL=(.+)/m);
  if (!match) return DEFAULT_DATABASE_URL;
  return match[1].trim().replace(/^["']|["']$/g, '');
}

function copyEnvFiles(): void {
  for (const { examplePath, envPath } of ENV_FILES) {
    const source = resolvePath(examplePath);
    const target = resolvePath(envPath);

    if (!existsSync(source)) {
      console.warn(`Arquivo de exemplo não encontrado, ignorando: ${examplePath}`);
      continue;
    }

    if (existsSync(target)) {
      console.log(`Configuração já existe, mantendo: ${envPath}`);
      continue;
    }

    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(source, target);
    console.log(`Configuração criada: ${envPath}`);
  }
}

function syncDatabaseUrl(): void {
  const databaseUrl = getDatabaseUrl();
  for (const envPath of DATABASE_URL_ENV_PATHS) {
    if (!existsSync(resolvePath(envPath))) continue;
    setKeyInEnvFile(envPath, 'DATABASE_URL', databaseUrl);
    console.log(`DATABASE_URL sincronizada em ${envPath}`);
  }
}

function injectAuthSecret(): void {
  const secret = randomBytes(24).toString('base64');
  for (const envPath of AUTH_SECRET_ENV_PATHS) {
    if (!existsSync(resolvePath(envPath))) continue;
    setKeyInEnvFile(envPath, 'AUTH_SECRET', secret);
    console.log(`AUTH_SECRET atualizada em ${envPath}`);
  }
}

async function checkPorts(): Promise<{ postgresUp: boolean }> {
  const postgresUp = await isPortOpen('127.0.0.1', POSTGRES_PORT);
  return { postgresUp };
}

function printPortStatus(postgresUp: boolean): void {
  console.log(`  Banco de dados (porta ${POSTGRES_PORT}): ${postgresUp ? 'em execução' : 'parado'}`);
  if (!postgresUp) {
    console.log('  Para iniciar o Postgres local: docker compose up');
  }
}

function printNextSteps(postgresUp: boolean): void {
  console.log('\nConfiguração inicial concluída. Próximos passos:');

  let step = 1;
  if (!postgresUp) {
    console.log(`  ${step}. Se precisar de Postgres local, rode: docker compose up`);
    step++;
  }

  console.log(`  ${step}. Aplicar migrações: bun --filter @workspace/database migrate`);
  step++;
  console.log(`  ${step}. Iniciar os aplicativos que quiser usar:`);

  for (const app of APPS) {
    console.log(`     ${app.cmd.padEnd(34)} # ${app.name} → ${app.url}`);
  }

  console.log('');
}

async function main(): Promise<void> {
  logStep('Copiando arquivos de configuração de cada projeto');
  copyEnvFiles();

  logStep('Sincronizando DATABASE_URL entre apps e database');
  syncDatabaseUrl();

  logStep('Gerando AUTH_SECRET compartilhada para dashboard e AI chat');
  injectAuthSecret();

  logStep('Rodando verificação do ambiente');
  runCommand(['bun', 'run', 'tools/env-check/env-doctor.ts'], 'env-doctor');

  logStep('Verificando se o Postgres está em execução');
  const { postgresUp } = await checkPorts();
  printPortStatus(postgresUp);
  printNextSteps(postgresUp);
}

main().catch((error) => {
  console.error('\nConfiguração inicial falhou.');
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
