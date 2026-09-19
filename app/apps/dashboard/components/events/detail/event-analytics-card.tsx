import type { EventWithRegistrationsDto } from '@/features/events/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { LineChart } from '@workspace/charts/line-chart';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@workspace/ui';

type EventAnalyticsCardProps = {
  event: EventWithRegistrationsDto;
};

function groupRegistrationsByDay(
  registrations: EventWithRegistrationsDto['registrations']
): Array<{ month: string; value: number }> {
  if (!registrations?.length) return [];
  const byDay = new Map<string, number>();
  for (const r of registrations) {
    if (!r.createdAt) continue;
    const day = new Date(r.createdAt).toISOString().slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + 1);
  }
  return Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, count]) => ({
      month: format(new Date(day), 'dd MMM', { locale: ptBR }),
      value: count
    }));
}

export function EventAnalyticsCard({ event }: EventAnalyticsCardProps) {
  const registrations = event.registrations ?? [];
  const confirmedCount = registrations.filter(
    (r) => r.status === 'confirmed'
  ).length;
  const pendingCount = registrations.filter(
    (r) => r.status === 'pending'
  ).length;
  const cancelledCount = registrations.filter(
    (r) => r.status === 'cancelled'
  ).length;
  const chartData = groupRegistrationsByDay(registrations);

  const cardClassName =
    'rounded-xl border border-border/80 bg-card shadow-none';

  return (
    <Card className={cardClassName}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">
          Resumo do evento
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Inscrições por status e ao longo do tempo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-0">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-border/60 bg-muted/20 px-3 py-4">
            <div className="text-2xl font-semibold text-foreground">
              {registrations.length}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Total</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-muted/20 px-3 py-4">
            <div className="text-2xl font-semibold text-[#1D8A4E]">
              {confirmedCount}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Confirmados</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-muted/20 px-3 py-4">
            <div className="text-2xl font-semibold text-amber-600">
              {pendingCount}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Pendentes</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-muted/20 px-3 py-4">
            <div className="text-2xl font-semibold text-destructive">
              {cancelledCount}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Cancelados</p>
          </div>
        </div>

        {chartData.length > 0 && (
          <div>
            <h4 className="mb-3 text-sm font-medium text-foreground">
              Inscrições ao longo do tempo
            </h4>
            <div className="h-48">
              <LineChart
                data={chartData}
                showGrid={true}
                showAxis={true}
                size="lg"
              />
            </div>
          </div>
        )}

        {chartData.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Ainda não há inscrições para exibir no gráfico.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
