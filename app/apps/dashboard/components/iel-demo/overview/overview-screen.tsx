'use client';

import Link from 'next/link';
import { plural } from '@/features/iel-demo/format';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';

import { routes } from '@workspace/routes';
import { Button } from '@workspace/ui/shadcn/button';
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle
} from '@workspace/ui/shadcn/card';

import { ManagerOverview } from '../manager/manager-overview';
import { montarPendencias, PENDENCIAS_VISIVEIS } from './pendencias';

/**
 * A tela de abertura responde uma pergunta: o que precisa de mim hoje?
 *
 * Ela já foi um painel administrativo — cinco números no herói, distribuição
 * por etapa, cobertura por dimensão, atividade recente e a procedência dos
 * registros. Nada daquilo dizia por onde começar, e era isso que a analista
 * precisava. Ficou uma fila de no máximo cinco cartões, cada um com o verbo
 * que o resolve.
 */
export function OverviewScreen() {
  const { state, persona } = useIelDemo();

  if (persona.kind === 'gestor') {
    return <ManagerOverview />;
  }

  const pendencias = montarPendencias(state);
  const visiveis = pendencias.slice(0, PENDENCIAS_VISIVEIS);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">
          O que precisa de mim hoje?
        </h1>
        <p className="text-sm text-muted-foreground">
          A fila do dia, na ordem em que compensa resolver.
        </p>
      </div>

      {visiveis.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Para resolver agora</CardTitle>
            <CardDescription>
              Nada em aberto. Quando chegar uma resposta ou uma vaga ficar
              parada, a linha aparece aqui.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {visiveis.map((pendencia) => (
            <Card key={pendencia.id}>
              <CardHeader>
                <CardTitle>{pendencia.titulo}</CardTitle>
                <CardDescription>{pendencia.resumo}</CardDescription>
                <CardAction>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <Link href={pendencia.href}>{pendencia.verbo}</Link>
                  </Button>
                </CardAction>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {pendencias.length > visiveis.length ? (
        <Link
          href={routes.dashboard.iel.jobs.index}
          className="text-sm font-medium underline underline-offset-4"
        >
          Ver as outras{' '}
          {plural(pendencias.length - visiveis.length, 'vaga', 'vagas')}
        </Link>
      ) : null}
    </div>
  );
}
