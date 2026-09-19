type Child = {
  readonly name: string;
  readonly proc: ReturnType<typeof Bun.spawn>;
};

function log(message: string) {
  // eslint-disable-next-line no-console
  console.log(`[e2e:web] ${message}`);
}

function runSync(cmd: string[], label: string, opts?: { cwd?: string }) {
  const result = Bun.spawnSync({
    cmd,
    stdout: 'inherit',
    stderr: 'inherit',
    stdin: 'inherit',
    cwd: opts?.cwd
  });
  if (result.exitCode !== 0) {
    throw new Error(`${label} failed with exit code ${result.exitCode}`);
  }
}

async function waitForUrl(url: string, name: string, timeoutMs = 120_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { method: 'GET' });
      if (res.ok) {
        log(`${name} is ready (${url})`);
        return;
      }
    } catch {
      // ignore
    }
    await Bun.sleep(750);
  }
  throw new Error(`${name} did not become ready in ${timeoutMs}ms: ${url}`);
}

function spawnChild(cmd: string[], name: string): Child {
  log(`Starting ${name}: ${cmd.join(' ')}`);
  const proc = Bun.spawn({
    cmd,
    stdout: 'inherit',
    stderr: 'inherit',
    stdin: 'inherit'
  });
  return { name, proc };
}

async function main() {
  const isCi = process.env.CI === 'true' || process.env.CI === '1';

  if (!isCi) {
    log('Starting postgres via Docker Compose (dev)');
    runSync(['docker', 'compose', 'up', '-d', 'postgres'], 'docker compose up postgres');
  } else {
    log('CI detected: skipping docker compose (Postgres provided by CI service).');
  }

  log('Applying database schema (db:push)');
  runSync(['bun', 'run', 'db:push'], 'db:push');

  log('Seeding test user for E2E auth (dev@example.com)');
  runSync(['bun', 'run', 'db:seed'], 'db:seed', { cwd: 'apps/api' });

  const children: Child[] = [];

  const shutdown = () => {
    log('Shutting down...');
    for (const child of children) {
      try {
        child.proc.kill('SIGTERM');
      } catch {
        // ignore
      }
    }
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  children.push(spawnChild(['bun', 'run', 'dev:api'], 'api'));
  await waitForUrl('http://localhost:3002/health', 'api');

  children.push(spawnChild(['bun', 'run', 'dev:dashboard'], 'dashboard'));
  await waitForUrl('http://localhost:3000', 'dashboard');

  log('All services are ready. Waiting for Playwright to finish...');

  // eslint-disable-next-line no-constant-condition
  while (true) {
    await Bun.sleep(10_000);
  }
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
