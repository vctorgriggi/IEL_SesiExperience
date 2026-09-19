import { afterAll, describe, expect, it } from 'vitest';

import { aiDemoQuotaTable, db, eq } from '@workspace/database';

import {
  consumeDemoQuota,
  demoQuotaLimit,
  getDemoQuota,
  releaseDemoQuota
} from './demo-quota';

const enabled = process.env.RUN_AI_INTEGRATION_TESTS === '1';

describe.skipIf(!enabled)('cota da demonstração (integração)', () => {
  const ips: string[] = [];

  function nextIp(suffix: string): string {
    const ip = `203.0.113.${suffix}`;
    ips.push(ip);
    return ip;
  }

  afterAll(async () => {
    for (const ip of ips) {
      await db.delete(aiDemoQuotaTable).where(eq(aiDemoQuotaTable.ip, ip));
    }
  });

  it('libera até o teto e recusa a partir dali', async () => {
    const ip = nextIp('10');
    const limit = demoQuotaLimit('messages');

    for (let i = 1; i <= limit; i += 1) {
      const result = await consumeDemoQuota(ip, 'messages');
      expect(result.ok).toBe(true);
      expect(result.used).toBe(i);
      expect(result.remaining).toBe(limit - i);
    }

    const blocked = await consumeDemoQuota(ip, 'messages');
    expect(blocked.ok).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it('mensagens e uploads têm cotas separadas', async () => {
    const ip = nextIp('11');

    for (let i = 0; i < demoQuotaLimit('messages'); i += 1) {
      await consumeDemoQuota(ip, 'messages');
    }
    expect((await consumeDemoQuota(ip, 'messages')).ok).toBe(false);
    expect((await consumeDemoQuota(ip, 'uploads')).ok).toBe(true);
  });

  it('IPs diferentes não compartilham cota', async () => {
    const first = nextIp('12');
    const second = nextIp('13');

    for (let i = 0; i < demoQuotaLimit('messages'); i += 1) {
      await consumeDemoQuota(first, 'messages');
    }

    expect((await consumeDemoQuota(first, 'messages')).ok).toBe(false);
    expect((await consumeDemoQuota(second, 'messages')).ok).toBe(true);
  });

  it('requisições simultâneas do mesmo IP não furam o teto', async () => {
    const ip = nextIp('14');
    const limit = demoQuotaLimit('messages');

    const results = await Promise.all(
      Array.from({ length: limit + 5 }, () => consumeDemoQuota(ip, 'messages'))
    );

    expect(results.filter((r) => r.ok)).toHaveLength(limit);

    const quota = await getDemoQuota(ip);
    expect(quota.messages.used).toBe(limit);
    expect(quota.messages.ok).toBe(false);
  });

  it('devolve a cota quando a operação cobrada falha', async () => {
    const ip = nextIp('15');

    await consumeDemoQuota(ip, 'uploads');
    await releaseDemoQuota(ip, 'uploads');

    const quota = await getDemoQuota(ip);
    expect(quota.uploads.used).toBe(0);
  });

  it('devolução não deixa o contador negativo', async () => {
    const ip = nextIp('16');

    await releaseDemoQuota(ip, 'messages');
    await consumeDemoQuota(ip, 'messages');
    await releaseDemoQuota(ip, 'messages');
    await releaseDemoQuota(ip, 'messages');

    const quota = await getDemoQuota(ip);
    expect(quota.messages.used).toBe(0);
  });
});
