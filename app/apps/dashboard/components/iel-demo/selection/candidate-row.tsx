'use client';

import Link from 'next/link';
import { COPY, type EstadoDeLeitura } from '@/features/iel-demo/copy';
import type { JobRankingEntry } from '@/features/iel-demo/state/selectors';

import { Button, Checkbox, cn } from '@workspace/ui';

/**
 * Cor só para estado, e nunca sozinha: a palavra vem escrita ao lado do
 * número. Quem não distingue verde de vermelho lê a mesma informação.
 */
const COR_DO_ESTADO: Record<EstadoDeLeitura, string> = {
  combina: 'text-success',
  difere: 'text-destructive',
  faltando: 'text-warning',
  'sem-resposta': 'text-muted-foreground'
};

export type CandidateRowProps = {
  entry: JobRankingEntry;
  /**
   * Prefixo do `id` do checkbox. A mesma pessoa pode aparecer na lista de
   * sugeridos, no resgate e na lista completa; sem prefixo por lista, dois
   * `<label for>` apontariam para o mesmo campo.
   */
  idPrefix: string;
  selected: boolean;
  /** Verdadeiro quando a remessa já está cheia e esta pessoa não está nela. */
  blocked: boolean;
  onToggle: () => void;
  profileHref: string;
};

/**
 * Uma pessoa na lista de envio.
 *
 * A linha diz só o que decide o envio: quem é, quanto combina com a empresa,
 * quanto atende aos requisitos da vaga e o que isso quer dizer em palavra. O
 * percentual grande é um só — o de combinar com a empresa, que é o assunto
 * desta tela; o dos requisitos vem menor porque é contexto, não o critério de
 * ordenação. O mínimo de 35% fica no cabeçalho da lista, uma vez.
 */
export function CandidateRow({
  entry,
  idPrefix,
  selected,
  blocked,
  onToggle,
  profileHref
}: CandidateRowProps) {
  const inputId = `${idPrefix}-${entry.application.id}`;
  const nome = entry.talent?.name ?? entry.application.id;
  const total = entry.adherence.total;
  const estado = COPY.verdictState(total, entry.adherence.threshold);
  const cor = COR_DO_ESTADO[estado];

  return (
    <li className="flex flex-col gap-3 border-b border-border px-4 py-3.5 last:border-0 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <Checkbox
          inputId={inputId}
          checked={selected}
          disabled={blocked && !selected}
          onCheckedChange={onToggle}
          aria-label={`Marcar ${nome} para envio`}
          className="mt-0.5 size-5"
        />
        <div className="min-w-0">
          <label
            htmlFor={inputId}
            className="block cursor-pointer text-[0.9375rem] font-semibold leading-tight text-foreground"
          >
            {nome}
          </label>
          {entry.talent?.headline ? (
            <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
              {entry.talent.headline}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-5 sm:w-[17rem]">
        <div className="min-w-0 flex-1">
          <p className={cn('iel-figure text-[1.75rem] leading-none', cor)}>
            {total === null ? '—' : `${Math.round(total)}%`}
          </p>
          <p className={cn('mt-1 text-xs font-medium leading-snug', cor)}>
            {COPY.verdictSentence(total, entry.adherence.threshold)}
          </p>
        </div>
        <div className="w-[5.5rem] shrink-0">
          <p className="iel-figure text-sm leading-none text-foreground/80">
            {entry.technicalMatch === null ? '—' : `${entry.technicalMatch}%`}
          </p>
          <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
            {COPY.technical.label.toLowerCase()}
          </p>
        </div>
      </div>

      <Link
        href={profileHref}
        className="shrink-0"
      >
        <Button
          size="sm"
          variant="outline"
        >
          Ver pessoa
        </Button>
      </Link>
    </li>
  );
}
