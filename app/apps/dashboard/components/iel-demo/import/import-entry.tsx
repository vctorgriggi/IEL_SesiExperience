'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import { getVisibleJobs } from '@/features/iel-demo/state/selectors';

import { routes } from '@workspace/routes';
import { Button } from '@workspace/ui/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@workspace/ui/shadcn/card';
import { Label } from '@workspace/ui/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@workspace/ui/shadcn/select';

/**
 * Entrada da importação manual, no detalhe do Empregare em Integrações.
 *
 * É o plano B: o Empregare sincroniza sozinho todo dia às 06:00, e a planilha
 * serve quando a sincronização falha ou para uma vaga que ainda não está lá.
 * A planilha é sempre de uma vaga, então a vaga é escolhida aqui: sem ela, a
 * tela de importação não teria com o que comparar cada linha.
 */
export function ImportEntry() {
  const { state } = useIelDemo();
  const vagas = getVisibleJobs(state);
  const [vagaId, setVagaId] = useState(vagas[0]?.id ?? '');

  if (vagas.length === 0) return null;

  return (
    <Card className="shadow-xs">
      <CardHeader>
        <CardTitle>Importar planilha manualmente</CardTitle>
        <CardDescription>
          Use se a sincronização falhar ou para uma vaga que ainda não está no
          Empregare. O arquivo é lido no seu navegador.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="space-y-1.5">
          <Label htmlFor="importar-vaga">Vaga da planilha</Label>
          <Select
            value={vagaId}
            onValueChange={setVagaId}
          >
            <SelectTrigger
              id="importar-vaga"
              className="sm:w-72"
            >
              <SelectValue placeholder="Escolha a vaga" />
            </SelectTrigger>
            <SelectContent>
              {vagas.map((vaga) => (
                <SelectItem
                  key={vaga.id}
                  value={vaga.id}
                >
                  {vaga.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          asChild
          variant="outline"
        >
          <Link href={routes.dashboard.iel.jobs.byId(vagaId).import}>
            Importar planilha
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
