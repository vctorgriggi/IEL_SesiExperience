import {
  FAIXA_DE_ENCAIXE_LABEL,
  type FaixaDeEncaixe
} from '@/features/iel-demo/analysis/mapa-cultural';

import { cn } from '@workspace/ui';
import { Badge } from '@workspace/ui/shadcn/badge';

/**
 * A faixa de aderência como etiqueta.
 *
 * Existe pelo mesmo motivo de `candidate-state-badge`: o `Badge` do shadcn traz
 * variantes de forma, não de significado, e pintar o estado na chamada
 * espalharia a mesma decisão por quatro telas.
 *
 * A cor nunca é o único canal — o rótulo textual vem junto, sempre.
 */
const CLASSE_POR_FAIXA: Record<FaixaDeEncaixe, string> = {
  'muito-proximo': 'border-success/40 bg-success/10 text-success',
  proximo: 'border-border bg-muted text-foreground',
  'alguma-distancia':
    'border-[hsl(var(--brand-accent))]/40 bg-[hsl(var(--brand-accent))]/10 text-[hsl(var(--brand-accent))]',
  distante: 'border-destructive/40 bg-destructive/10 text-destructive'
};

export function FaixaBadge({
  faixa,
  className
}: {
  faixa: FaixaDeEncaixe;
  className?: string;
}) {
  return (
    <Badge
      className={cn(CLASSE_POR_FAIXA[faixa], className)}
      variant="outline"
    >
      {FAIXA_DE_ENCAIXE_LABEL[faixa]}
    </Badge>
  );
}
