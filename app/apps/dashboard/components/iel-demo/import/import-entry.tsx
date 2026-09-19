'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import { getVisibleJobs } from '@/features/iel-demo/state/selectors';

import { routes } from '@workspace/routes';
import { Button, FilterNativeSelect } from '@workspace/ui';

import { Panel, PanelHeader } from '../shared/ui';

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
    <Panel className="space-y-4">
      <PanelHeader
        eyebrow="Entrada de hoje"
        title="Importar planilha do Empregare"
        hint="O arquivo é lido no seu navegador. Quando a Empregare liberar a API, os mesmos dados chegam sozinhos."
        meta="Escolha a vaga da planilha exportada."
      />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label
          className="sr-only"
          htmlFor="importar-vaga"
        >
          Vaga da planilha
        </label>
        <FilterNativeSelect
          id="importar-vaga"
          className="sm:w-72"
          value={vagaId}
          onValueChange={setVagaId}
        >
          {vagas.map((vaga) => (
            <option
              key={vaga.id}
              value={vaga.id}
            >
              {vaga.title}
            </option>
          ))}
        </FilterNativeSelect>
        <Link href={routes.dashboard.iel.jobs.byId(vagaId).import}>
          <Button className="w-full sm:w-auto">
            Importar planilha do Empregare
          </Button>
        </Link>
      </div>
    </Panel>
  );
}
