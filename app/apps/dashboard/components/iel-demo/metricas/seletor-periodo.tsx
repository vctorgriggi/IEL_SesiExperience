'use client';

import {
  PERIODO_LABEL,
  type Periodo
} from '@/features/iel-demo/analysis/analytics';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@workspace/ui/shadcn/select';

const PERIODOS: Periodo[] = ['mes', 'trimestre', 'ano'];

/**
 * Padrão das telas: 90 dias. Em 30 dias a base é pequena e o número balança;
 * em 12 meses a variação dos indicadores do histórico some (não há janela
 * anterior).
 */
export const PERIODO_PADRAO: Periodo = 'trimestre';

/**
 * "Últimos 30 dias / 90 dias / 12 meses", ligado a `Periodo`.
 *
 * Controlado: a tela guarda o período (`useState<Periodo>(PERIODO_PADRAO)`)
 * e passa para os seletores de `analytics.ts`.
 *
 * ```tsx
 * const [periodo, setPeriodo] = useState<Periodo>(PERIODO_PADRAO);
 * <SeletorPeriodo value={periodo} onChange={setPeriodo} />
 * ```
 */
export function SeletorPeriodo({
  value,
  onChange,
  className
}: {
  value: Periodo;
  onChange: (periodo: Periodo) => void;
  className?: string;
}) {
  return (
    <Select
      value={value}
      onValueChange={(valor) => {
        const escolhido = PERIODOS.find((periodo) => periodo === valor);
        if (escolhido) onChange(escolhido);
      }}
    >
      <SelectTrigger
        size="sm"
        className={className ?? 'w-[170px]'}
        aria-label="Período"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {PERIODOS.map((periodo) => (
          <SelectItem
            key={periodo}
            value={periodo}
          >
            {PERIODO_LABEL[periodo]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
