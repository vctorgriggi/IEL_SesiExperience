import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

type Level = 'critical' | 'recommended' | 'optional';
type Status = 'OK' | 'MISSING' | 'INVALID';

const LEVEL_LABEL: Record<Level, string> = {
  critical: 'OBRIGATÓRIO',
  recommended: 'RECOMENDADO',
  optional: 'OPCIONAL'
};

const STATUS_LABEL: Record<Status, string> = {
  OK: 'OK',
  MISSING: 'FALTANDO',
  INVALID: 'INVÁLIDO'
};

type Rule = {
  key: string;
  level: Level;
  check?: 'url' | 'secret';
  /** Satisfeita quando qualquer uma destas chaves estiver preenchida. */
  oneOf?: string[];
};

type AppConfig = {
  app: string;
  envPath: string;
  rules: Rule[];
};

const RESET = '\x1b[0m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const BLUE = '\x1b[34m';

const APPS: AppConfig[] = [
  {
    app: 'dashboard',
    envPath: 'apps/dashboard/.env',
    rules: [
      { key: 'DATABASE_URL', level: 'critical', check: 'url' },
      { key: 'AUTH_SECRET', level: 'critical', check: 'secret' },
      { key: 'NEXT_PUBLIC_DASHBOARD_URL', level: 'recommended', check: 'url' },
      { key: 'NEXT_PUBLIC_THEME_MODE', level: 'optional' },
      { key: 'EMAIL_PROVIDER', level: 'optional' },
      { key: 'EMAIL_FEEDBACK_INBOX', level: 'optional' },
      { key: 'EMAIL_POSTMARK_SERVER_TOKEN', level: 'optional' },
      { key: 'EMAIL_SENDGRID_API_KEY', level: 'optional' },
      { key: 'MONITORING_PROVIDER', level: 'optional' },
      { key: 'MONITORING_ALERT_WEBHOOK_URL', level: 'optional' }
    ]
  },
  {
    app: 'database',
    envPath: 'packages/database/.env',
    rules: [{ key: 'DATABASE_URL', level: 'critical', check: 'url' }]
  }
];

const MIN_SECRET_LENGTH = 24;

function getEnvSource(envPath: string, preferExamples: boolean): { path: string | null; label: string } {
  const cwd = process.cwd();
  const fullEnv = resolve(cwd, envPath);
  const examplePath = `${envPath}.example`;
  const fullExample = resolve(cwd, examplePath);
  const hasEnv = existsSync(fullEnv);
  const hasExample = existsSync(fullExample);

  if (preferExamples) {
    if (hasExample) return { path: fullExample, label: examplePath };
    if (hasEnv) return { path: fullEnv, label: envPath };
    return { path: null, label: envPath };
  }

  if (hasEnv) return { path: fullEnv, label: envPath };
  if (hasExample) return { path: fullExample, label: examplePath };
  return { path: null, label: envPath };
}

function parseEnvFile(filePath: string): Record<string, string> {
  const env: Record<string, string> = {};
  const raw = readFileSync(filePath, 'utf8');

  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

function isValidUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' || parsed.protocol.startsWith('postgres');
  } catch {
    return value.startsWith('postgres://') || value.startsWith('postgresql://');
  }
}

function isLikelySecret(value: string): boolean {
  return value.length >= MIN_SECRET_LENGTH;
}

function evaluateRule(env: Record<string, string>, rule: Rule): Status {
  if (rule.oneOf) {
    const filled = rule.oneOf.filter((key) => env[key]);
    if (filled.length === 0) return 'MISSING';
    const invalid = filled.some(
      (key) => rule.check === 'secret' && !isLikelySecret(env[key]!)
    );
    return invalid ? 'INVALID' : 'OK';
  }

  const value = env[rule.key];
  if (!value) return 'MISSING';
  if (rule.check === 'url' && !isValidUrl(value)) return 'INVALID';
  if (rule.check === 'secret' && !isLikelySecret(value)) return 'INVALID';
  return 'OK';
}

function printStatus(level: Level, status: Status) {
  const levelStr = LEVEL_LABEL[level].padEnd(11);
  const statusStr = STATUS_LABEL[status].padEnd(10);
  const text = `${levelStr} ${statusStr}`;
  return status === 'OK' ? `${GREEN}${text}${RESET}` : `${RED}${text}${RESET}`;
}

function checkConsistency(allEnvs: Map<string, Record<string, string>>, key: string, apps: string[]): boolean {
  const values = apps.map((app) => allEnvs.get(app)?.[key]).filter(Boolean);
  if (values.length <= 1) return true;
  return values.every((value) => value === values[0]);
}

function main() {
  const allEnvs = new Map<string, Record<string, string>>();
  let hasCriticalError = false;
  const preferExamples = process.argv.includes('--examples');

  console.log(`${BLUE}Arki — Verificação das configurações${RESET}\n`);

  for (const appConfig of APPS) {
    const { path: sourcePath, label: sourceLabel } = getEnvSource(appConfig.envPath, preferExamples);

    console.log(`${BLUE}[${appConfig.app}]${RESET} ${sourceLabel}`);

    if (!sourcePath) {
      console.log(`${RED}OBRIGATÓRIO FALTANDO   arquivo de configuração não encontrado${RESET}\n`);
      hasCriticalError = true;
      continue;
    }

    const env = parseEnvFile(sourcePath);
    allEnvs.set(appConfig.app, env);

    for (const rule of appConfig.rules) {
      const status = evaluateRule(env, rule);
      console.log(`${printStatus(rule.level, status)} ${rule.key}`);
      if (rule.level === 'critical' && status !== 'OK') {
        hasCriticalError = true;
      }
    }

    console.log('');
  }

  const consistencyChecks = [
    { key: 'DATABASE_URL', apps: ['dashboard', 'database'] }
  ];

  console.log(`${BLUE}[consistência]${RESET}`);
  for (const check of consistencyChecks) {
    const ok = checkConsistency(allEnvs, check.key, check.apps);
    if (ok) {
      console.log(`${GREEN}OK${RESET}          ${check.key} (${check.apps.join(', ')})`);
      continue;
    }

    console.log(`${RED}DIFERENTE${RESET}   ${check.key} com valores diferentes entre ${check.apps.join(', ')}`);
    hasCriticalError = true;
  }

  if (hasCriticalError) {
    console.error(`\n${RED}Verificação falhou: itens obrigatórios faltando, inválidos ou inconsistentes.${RESET}`);
    process.exit(1);
  }

  console.log(`\n${GREEN}Verificação concluída com sucesso.${RESET}`);
}

main();
