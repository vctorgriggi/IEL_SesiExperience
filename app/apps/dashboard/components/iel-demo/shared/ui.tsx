import type { ReactNode } from 'react';
import type { CoverageSummary } from '@/features/iel-demo/analysis/criterion-states';
import { InformationCircleIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { cn } from '@workspace/ui';

/**
 * Definição de um termo, disponível sem ocupar uma linha de texto.
 *
 * O domínio tem distinções que precisam estar ao alcance (cobertura não é
 * afinidade, etapa de origem não é etapa do IEL), mas escrever cada uma
 * delas como parágrafo abaixo do título transforma a tela num manual.
 */
export function InfoHint({
  label,
  className
}: {
  label: string;
  className?: string;
}) {
  return (
    <span
      role="note"
      tabIndex={0}
      title={label}
      aria-label={label}
      className={cn(
        'inline-flex cursor-help align-middle text-muted-foreground/70 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:text-foreground',
        className
      )}
    >
      <HugeiconsIcon
        icon={InformationCircleIcon}
        size={14}
        aria-hidden="true"
      />
    </span>
  );
}

/** Título de bloco: uma linha, com a definição atrás de um ícone. */
export function SectionTitle({
  children,
  hint,
  className
}: {
  children: ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <h2
      className={cn(
        'flex items-center gap-1.5 text-sm font-semibold text-foreground',
        className
      )}
    >
      {children}
      {hint ? <InfoHint label={hint} /> : null}
    </h2>
  );
}

/**
 * Cobertura informacional. Mede quantos critérios têm dados suficientes — não
 * é probabilidade de sucesso nem qualidade da pessoa.
 */
export function CoverageMeter({
  coverage,
  label = 'Cobertura das informações',
  className
}: {
  coverage: CoverageSummary;
  label?: string;
  className?: string;
}) {
  const percent =
    coverage.total === 0
      ? 0
      : Math.round((coverage.withInformation / coverage.total) * 100);

  return (
    <div className={cn('space-y-1', className)}>
      <p className="text-xs font-medium text-foreground">
        {coverage.withInformation} de {coverage.total} critérios com dados
        suficientes
      </p>
      <div
        role="meter"
        aria-label={label}
        aria-valuenow={coverage.withInformation}
        aria-valuemin={0}
        aria-valuemax={coverage.total}
        aria-valuetext={`${coverage.withInformation} de ${coverage.total} critérios com dados suficientes`}
        className="h-1.5 w-full overflow-hidden rounded-[var(--radius-pill)] bg-muted"
      >
        <div
          className="h-full rounded-[var(--radius-pill)] bg-info"
          style={{ width: `${percent}%` }}
        />
      </div>
      {coverage.missing.length > 0 ? (
        <p className="text-[11px] text-muted-foreground">
          Sem informação: {coverage.missing.join(', ')}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Cabeçalho de tela com contexto persistente de empresa e vaga.
 *
 * Fica um degrau abaixo do `Hero` na escala tipográfica: nas telas que têm
 * herói, ele é contexto, e o instrumento é que abre a página.
 */
export function IelPageHeader({
  eyebrow,
  title,
  description,
  actions,
  children
}: {
  eyebrow?: ReactNode;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="space-y-3 border-b border-border pb-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-1">
          {eyebrow ? <p className="iel-eyebrow">{eyebrow}</p> : null}
          <h1 className="iel-display text-[1.5rem] leading-tight text-foreground">
            {title}
          </h1>
          {description ? (
            <p className="max-w-3xl text-sm text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        ) : null}
      </div>
      {children}
    </header>
  );
}

/** Rótulo discreto e persistente do ambiente de demonstração. */
export function DemoDataBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-dashed border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground',
        className
      )}
    >
      <span
        aria-hidden="true"
        className="size-1.5 rounded-full bg-warning"
      />
      Dados fictícios — demonstração
    </span>
  );
}

/** Origem de um dado: fonte, data e natureza. */
export function SourceTag({
  source,
  updatedAt,
  nature,
  className
}: {
  source: string;
  updatedAt?: string;
  nature?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex flex-wrap items-center gap-x-1.5 text-[11px] text-muted-foreground',
        className
      )}
    >
      <span className="font-medium text-foreground/80">{source}</span>
      {nature ? <span>· {nature}</span> : null}
      {updatedAt ? <span>· atualizado em {formatDate(updatedAt)}</span> : null}
    </span>
  );
}

export function formatDate(value: string): string {
  const date = new Date(value.length === 10 ? `${value}T12:00:00.000Z` : value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC'
  });
}

export function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/** Pequena etiqueta neutra para estados operacionais. */
export function Chip({
  children,
  tone = 'neutro',
  className
}: {
  children: ReactNode;
  tone?: 'neutro' | 'info' | 'positivo' | 'atencao' | 'conflito';
  className?: string;
}) {
  const toneClass = {
    neutro: 'border-border bg-muted text-muted-foreground',
    info: 'border-info/40 bg-info/10 text-info',
    positivo: 'border-success/40 bg-success/10 text-success',
    atencao: 'border-warning/40 bg-warning/10 text-warning',
    conflito: 'border-destructive/40 bg-destructive/10 text-destructive'
  }[tone];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-[var(--radius-pill)] border px-2 py-0.5 text-[11px] font-medium',
        toneClass,
        className
      )}
    >
      {children}
    </span>
  );
}

/** Lista de barras horizontais para perguntas agregadas simples. */
export function BarList({
  items,
  emptyMessage = 'Sem registros para o filtro atual.'
}: {
  items: { id: string; label: string; count: number; onSelect?: () => void }[];
  emptyMessage?: string;
}) {
  const max = Math.max(...items.map((item) => item.count), 1);
  const total = items.reduce((sum, item) => sum + item.count, 0);

  if (total === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            onClick={item.onSelect}
            disabled={!item.onSelect || item.count === 0}
            className="group flex w-full items-center gap-3 rounded-[var(--control-radius)] px-1 py-1 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-default disabled:hover:bg-transparent"
          >
            <span className="w-36 shrink-0 truncate text-xs text-foreground">
              {item.label}
            </span>
            <span className="h-2 flex-1 overflow-hidden rounded-[var(--radius-pill)] bg-muted">
              <span
                className="block h-full rounded-[var(--radius-pill)] bg-chart-1"
                style={{ width: `${(item.count / max) * 100}%` }}
              />
            </span>
            <span className="w-16 shrink-0 text-right text-xs font-medium text-foreground">
              {item.count}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

const SOURCE_DOT_CLASS: Record<string, string> = {
  'FONTE-EMPREGARE': 'bg-chart-1',
  'FONTE-IEL': 'bg-chart-3',
  'FONTE-EMPRESA': 'bg-chart-2',
  'FONTE-AVALIACAO': 'bg-chart-5'
};

/**
 * Procedência de um conjunto de registros.
 *
 * É a afirmação central do produto: esta leitura reúne informações que hoje
 * vivem em sistemas separados. Sem isso na tela, a integração fica só no
 * modelo de dados e o analista vê um painel qualquer.
 */
export function SourceBreakdownBar({
  breakdown,
  total,
  className
}: {
  breakdown: { sourceId: string; shortName: string; count: number }[];
  total: number;
  className?: string;
}) {
  if (breakdown.length === 0) return null;

  return (
    <div
      className={cn('flex flex-wrap items-center gap-x-4 gap-y-1', className)}
    >
      <p className="text-xs text-muted-foreground">
        Esta análise reúne{' '}
        <span className="font-semibold text-foreground">
          {total} {total === 1 ? 'registro' : 'registros'}
        </span>{' '}
        de{' '}
        <span className="font-semibold text-foreground">
          {breakdown.length} {breakdown.length === 1 ? 'fonte' : 'fontes'}
        </span>
        <InfoHint
          className="ml-1"
          label="Em produção, cada fonte é um sistema ou etapa diferente: consultá-las separadamente e juntar o resultado é o trabalho manual que a central substitui."
        />
      </p>
      <ul className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {breakdown.map((entry) => (
          <li
            key={entry.sourceId}
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <span
              aria-hidden="true"
              className={cn(
                'size-2 shrink-0 rounded-full',
                SOURCE_DOT_CLASS[entry.sourceId] ?? 'bg-muted-foreground'
              )}
            />
            {entry.shortName}
            <span className="font-medium tabular-nums text-foreground">
              {entry.count}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Ponto colorido da fonte, para uso inline junto de um registro. */
export function SourceDot({
  sourceId,
  className
}: {
  sourceId: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-block size-2 shrink-0 rounded-full',
        SOURCE_DOT_CLASS[sourceId] ?? 'bg-muted-foreground',
        className
      )}
    />
  );
}

/**
 * Superfície da Central.
 *
 * `elevation` é a única coisa que decide o quanto o bloco está acima da
 * página, e é escolha de intenção, não de gosto: 1 para o que pertence ao
 * bloco em volta (lista densa, tabela), 2 para um cartão com assunto
 * próprio, 3 para o instrumento principal da tela. Quando tudo na tela usa o
 * mesmo nível, a hierarquia desaparece e sobra a grade genérica.
 *
 * `tone="hero"` acrescenta a faixa de marca no topo e sobe para o nível 3.
 */
export function Panel({
  children,
  className,
  padding = 'md',
  elevation = 2,
  tone = 'default'
}: {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  elevation?: 1 | 2 | 3;
  tone?: 'default' | 'hero';
}) {
  const level = tone === 'hero' ? 3 : elevation;

  return (
    <section
      className={cn(
        'iel-panel',
        level === 1 && 'iel-elev-1',
        level === 2 && 'iel-elev-2',
        level === 3 && 'iel-elev-3',
        tone === 'hero' && 'iel-hero',
        padding === 'sm' && 'p-4',
        padding === 'md' && 'p-5',
        padding === 'lg' && 'p-6',
        padding === 'xl' && 'p-6 lg:p-8',
        className
      )}
    >
      {children}
    </section>
  );
}

/**
 * Cabeçalho de bloco: rótulo em versalete, título em serifa e a explicação
 * atrás do ícone. Três níveis de voz onde antes havia um negrito só.
 */
export function PanelHeader({
  eyebrow,
  title,
  hint,
  meta,
  actions,
  className
}: {
  eyebrow?: string;
  title: ReactNode;
  hint?: string;
  /** Linha curta de contagem ou contexto, abaixo do título. */
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        'flex flex-wrap items-start justify-between gap-x-4 gap-y-2',
        className
      )}
    >
      <div className="min-w-0">
        {eyebrow ? <p className="iel-eyebrow">{eyebrow}</p> : null}
        <h2 className="iel-display mt-1 flex items-center gap-1.5 text-[0.9375rem] leading-snug text-foreground">
          {title}
          {hint ? <InfoHint label={hint} /> : null}
        </h2>
        {meta ? (
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {meta}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}
    </header>
  );
}

/** Número de destaque, em serifa com algarismos tabulares. */
export function Figure({
  value,
  className
}: {
  value: ReactNode;
  className?: string;
}) {
  return <span className={cn('iel-figure', className)}>{value}</span>;
}

export type HeroFigure = {
  label: string;
  value: ReactNode;
  /** Uma linha curta abaixo do número: o que ele quer dizer, ou onde agir. */
  hint?: ReactNode;
  /** Estado, quando o número pede um: âmbar para o que espera ação. */
  tone?: 'default' | 'atencao';
};

/**
 * Área-herói de uma tela.
 *
 * Não é mais um cartão na grade: é o que se vê primeiro, e cada tela tem o
 * seu. Os números vivem aqui, grandes e tabulares, no lugar da fileira de
 * cartões de indicador iguais — que era a abertura padrão de qualquer painel
 * administrativo e não dizia qual dos quatro importava. `aside` recebe o
 * instrumento da tela (um anel, um radar, uma triagem), porque o herói tem
 * de conter a operação, não só anunciá-la.
 */
export function Hero({
  as: Title = 'h1',
  eyebrow,
  title,
  description,
  figures,
  aside,
  actions,
  children,
  className
}: {
  /** O nível do título. `h2` quando o herói vive dentro de uma tela que já tem `h1`. */
  as?: 'h1' | 'h2';
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  figures?: HeroFigure[];
  /** Slot do instrumento principal, à direita em telas largas. */
  aside?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <Panel
      tone="hero"
      padding="xl"
      className={cn('space-y-6', className)}
    >
      <div className="flex flex-col gap-x-10 gap-y-6 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1 space-y-4">
          <div className="space-y-2">
            {eyebrow ? <p className="iel-eyebrow">{eyebrow}</p> : null}
            <Title className="iel-hero-title text-balance text-foreground">
              {title}
            </Title>
            {description ? (
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>

          {actions ? (
            <div className="flex flex-wrap items-center gap-2">{actions}</div>
          ) : null}

          {figures && figures.length > 0 ? (
            /*
              O primeiro número é o assunto da tela e é lido primeiro; os
              outros são contexto e ficam num degrau abaixo. Cinco números do
              mesmo tamanho seriam a fileira de cartões de indicador de
              novo — maior, e igualmente muda.
            */
            <dl className="flex flex-wrap items-start gap-x-6 gap-y-5 pt-1">
              {figures.map((figure, index) => (
                <div
                  key={figure.label}
                  className={cn(
                    'min-w-0',
                    // A régua entre o número principal e os demais só faz
                    // sentido quando eles estão na mesma linha.
                    index === 0 && figures.length > 1
                      ? 'sm:mr-1 sm:border-r sm:border-border sm:pr-6'
                      : ''
                  )}
                >
                  <dt className="iel-eyebrow">{figure.label}</dt>
                  <dd
                    className={cn(
                      'iel-figure mt-1.5 leading-[0.95]',
                      index === 0
                        ? 'text-[2.75rem]'
                        : 'text-[1.75rem] text-foreground/90',
                      figure.tone === 'atencao'
                        ? 'text-warning'
                        : 'text-foreground'
                    )}
                  >
                    {figure.value}
                  </dd>
                  {figure.hint ? (
                    <p className="mt-1.5 max-w-[12rem] text-xs leading-relaxed text-muted-foreground">
                      {figure.hint}
                    </p>
                  ) : null}
                </div>
              ))}
            </dl>
          ) : null}
        </div>

        {aside ? (
          <div className="w-full shrink-0 lg:w-[22rem] xl:w-[26rem]">
            {aside}
          </div>
        ) : null}
      </div>

      {children}
    </Panel>
  );
}
