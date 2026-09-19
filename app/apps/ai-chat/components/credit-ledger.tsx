'use client';

import { useCallback, useEffect, useState } from 'react';

import type { AiCreditReason } from '@workspace/database';
import { api } from '@workspace/routes';
import { Button, cn, Skeleton } from '@workspace/ui';

import { apiGet } from '~/lib/api-client';

type LedgerEntry = {
  id: string;
  delta: number;
  reason: AiCreditReason;
  refId: string | null;
  createdAt: string;
};

type LedgerPage = {
  items: LedgerEntry[];
  nextCursor: string | null;
};

const REASON_LABELS: Record<AiCreditReason, string> = {
  use: 'Mensagem enviada',
  purchase: 'Compra de créditos',
  grant: 'Mensagens gratuitas',
  refund: 'Estorno'
};

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit'
});

function formatDelta(delta: number): string {
  return delta > 0 ? `+${delta}` : String(delta);
}

export function CreditLedger({ open }: { open: boolean }) {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async (cursor?: string | null) => {
    setIsLoading(true);
    try {
      const page = await apiGet<LedgerPage>(
        api.aiChat.creditsHistory(cursor ? { cursor } : undefined)
      );
      setEntries((prev) =>
        cursor ? [...prev, ...(page?.items ?? [])] : (page?.items ?? [])
      );
      setNextCursor(page?.nextCursor ?? null);
    } catch {
      setNextCursor(null);
    } finally {
      setIsLoading(false);
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (open && !loaded) load();
  }, [open, loaded, load]);

  if (!loaded && isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton
            key={index}
            className="h-9 w-full"
          />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <p className="py-2 text-sm text-muted-foreground">
        Nenhum movimento por enquanto.
      </p>
    );
  }

  return (
    <div className="space-y-1">
      <ul className="divide-y divide-border">
        {entries.map((entry) => (
          <li
            key={entry.id}
            className="flex items-center justify-between gap-3 py-2 text-sm"
          >
            <span className="min-w-0 truncate text-foreground">
              {REASON_LABELS[entry.reason]}
            </span>
            <span className="flex shrink-0 items-center gap-3">
              <time
                dateTime={entry.createdAt}
                className="text-xs text-muted-foreground"
              >
                {dateFormatter.format(new Date(entry.createdAt))}
              </time>
              <span
                className={cn(
                  'w-10 text-right font-medium tabular-nums',
                  entry.delta > 0 ? 'text-success' : 'text-muted-foreground'
                )}
              >
                {formatDelta(entry.delta)}
              </span>
            </span>
          </li>
        ))}
      </ul>

      {nextCursor && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full justify-center text-xs text-muted-foreground"
          disabled={isLoading}
          onClick={() => load(nextCursor)}
        >
          {isLoading ? 'Carregando...' : 'Ver mais'}
        </Button>
      )}
    </div>
  );
}
