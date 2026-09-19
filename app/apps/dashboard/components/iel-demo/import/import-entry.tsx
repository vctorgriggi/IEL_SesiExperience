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
 * Entrada da importação na tela "De onde vem".
 *
 * A planilha é sempre de uma vaga, então a vaga é escolhida aqui: sem ela, a
 * tela de importação não teria com o que comparar cada linha.
 */
export function ImportEntry() {
  const { state } = useIelDemo();
  const vagas = getVisibleJobs(state);
  const [vagaId, setVagaId] = useState(vagas[0]?.id ?? '');

  if (vagas.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Importar planilha do Empregare</CardTitle>
        <CardDescription>
          O arquivo é lido no seu navegador. Quando a Empregare liberar a API,
          os mesmos dados chegam sozinhos.
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
        <Button asChild>
          <Link href={routes.dashboard.iel.jobs.byId(vagaId).import}>
            Importar planilha
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
