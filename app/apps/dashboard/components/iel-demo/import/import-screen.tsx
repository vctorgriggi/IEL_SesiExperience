'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  buildImportPlan,
  parseSpreadsheet,
  type ImportPlan
} from '@/features/iel-demo/analysis/spreadsheet-import';
import { plural } from '@/features/iel-demo/format';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import { getImportHistory, getJob } from '@/features/iel-demo/state/selectors';
import { nowIso } from '@/features/iel-demo/state/storage';

import { routes } from '@workspace/routes';
import { Button, cn } from '@workspace/ui';

import { Hero, Panel, PanelHeader } from '../shared/ui';
import { ImportHistory } from './import-history';
import { ReviewStep } from './review-step';
import { UploadStep } from './upload-step';

const PASSOS = [
  { id: 'enviar', rotulo: 'Enviar' },
  { id: 'conferir', rotulo: 'Conferir' },
  { id: 'pronto', rotulo: 'Pronto' }
] as const;

type Passo = (typeof PASSOS)[number]['id'];

type Aplicado = {
  novos: number;
  semMudancas: boolean;
};

function Trilha({ atual }: { atual: Passo }) {
  const indiceAtual = PASSOS.findIndex((passo) => passo.id === atual);

  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
      {PASSOS.map((passo, indice) => (
        <li
          key={passo.id}
          aria-current={indice === indiceAtual ? 'step' : undefined}
          className="flex items-center gap-2"
        >
          <span
            className={cn(
              'flex items-center gap-1.5 text-xs font-medium',
              indice === indiceAtual
                ? 'text-foreground'
                : 'text-muted-foreground'
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                'flex size-5 items-center justify-center rounded-full border text-[11px]',
                indice === indiceAtual
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-muted text-muted-foreground'
              )}
            >
              {indice + 1}
            </span>
            {passo.rotulo}
          </span>
          {indice < PASSOS.length - 1 ? (
            <span
              aria-hidden="true"
              className="text-xs text-muted-foreground"
            >
              ›
            </span>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

function contarNovos(plano: ImportPlan): number {
  return plano.counts['novo-talento'] + plano.counts['nova-candidatura'];
}

/**
 * Importação da planilha da Empregare, em três passos (M6).
 *
 * A pergunta da tela é "entrou tudo certo?", e por isso o plano é montado
 * antes de qualquer gravação: o analista vê pessoa por pessoa o que vai
 * acontecer e só então confirma. Um passo por tela porque quem importa
 * planilha hoje faz isso à mão, no Excel, e precisa de um lugar só para
 * olhar de cada vez.
 */
export function ImportScreen({ jobId }: { jobId: string }) {
  const { state, dispatch } = useIelDemo();
  const vaga = getJob(jobId);

  const [passo, setPasso] = useState<Passo>('enviar');
  const [arquivo, setArquivo] = useState<string | null>(null);
  const [plano, setPlano] = useState<ImportPlan | null>(null);
  const [aplicado, setAplicado] = useState<Aplicado | null>(null);

  if (!vaga) {
    return (
      <Panel className="space-y-3">
        <PanelHeader title="Vaga não encontrada" />
        <p className="iel-prose text-sm text-muted-foreground">
          Esta vaga não existe na base da demonstração.
        </p>
        <Link href={routes.dashboard.iel.jobs.index}>
          <Button variant="outline">Ver as vagas</Button>
        </Link>
      </Panel>
    );
  }

  const receberConteudo = (conteudo: string, nomeDoArquivo: string): void => {
    setArquivo(nomeDoArquivo);
    setPlano(
      buildImportPlan(state, parseSpreadsheet(conteudo), jobId, nowIso())
    );
    setPasso('conferir');
  };

  const confirmar = (): void => {
    if (!plano) return;
    const jaImportada = getImportHistory(state, jobId).some(
      (registro) => registro.fingerprint === plano.fingerprint
    );
    dispatch({ type: 'import-spreadsheet', jobId, plan: plano, at: nowIso() });
    setAplicado({ novos: contarNovos(plano), semMudancas: jaImportada });
    setPasso('pronto');
  };

  const recomecar = (): void => {
    setPlano(null);
    setAplicado(null);
    setPasso('enviar');
  };

  const jaImportada = plano
    ? getImportHistory(state, jobId).some(
        (registro) => registro.fingerprint === plano.fingerprint
      )
    : false;

  return (
    <div className="space-y-6">
      <Trilha atual={passo} />

      {passo === 'enviar' ? (
        <Hero
          eyebrow={`Importar planilha · ${vaga.title}`}
          title="Entrou tudo certo?"
          description="Suba a planilha da Empregare. Você confere antes de confirmar."
        />
      ) : null}

      {passo === 'conferir' && plano ? (
        <Hero
          eyebrow={`Importar planilha · ${vaga.title}`}
          title="Entrou tudo certo?"
          description="Confira o que vai entrar. Nada é gravado até você confirmar."
          figures={[
            {
              label: 'Registros novos',
              value: contarNovos(plano),
              hint: 'pessoas e candidaturas que a planilha traz'
            },
            {
              label: 'Atualizados',
              value: plano.counts['match-atualizado'],
              hint: 'já estavam aqui com outro percentual'
            },
            {
              label: 'Ficam de fora',
              value: plano.counts.ignorada + plano.errors.length,
              tone:
                plano.errors.length > 0
                  ? ('atencao' as const)
                  : ('default' as const),
              hint: 'sem mudança ou com erro'
            }
          ]}
        />
      ) : null}

      {passo === 'pronto' && aplicado ? (
        <Hero
          eyebrow={`Importar planilha · ${vaga.title}`}
          title="Pronto"
          description="A planilha foi aplicada à base desta demonstração."
          figures={[
            {
              label: 'Registros novos',
              value: aplicado.semMudancas ? 0 : aplicado.novos
            }
          ]}
        />
      ) : null}

      {passo === 'enviar' ? (
        <UploadStep
          onConteudo={receberConteudo}
          arquivoLido={arquivo}
        />
      ) : null}

      {passo === 'conferir' && plano ? (
        <ReviewStep
          plano={plano}
          state={state}
          jaImportada={jaImportada}
          onConfirmar={confirmar}
          onTrocarArquivo={recomecar}
        />
      ) : null}

      {passo === 'pronto' && aplicado ? (
        <Panel
          elevation={1}
          className="space-y-4"
        >
          <PanelHeader
            eyebrow="Passo 3"
            title="Importação concluída"
          />
          <p className="iel-prose text-sm text-foreground">
            {aplicado.semMudancas
              ? `Sem mudanças: esta planilha já tinha sido importada na vaga ${vaga.title}.`
              : `${plural(aplicado.novos, 'pessoa nova entrou', 'pessoas novas entraram')} na vaga ${vaga.title}.`}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Link href={routes.dashboard.iel.jobs.byId(jobId).index}>
              <Button
                size="large"
                className="w-full sm:w-auto"
              >
                Ver a vaga
              </Button>
            </Link>
            <Button
              variant="outline"
              size="large"
              onClick={recomecar}
            >
              Importar outra
            </Button>
          </div>
        </Panel>
      ) : null}

      {passo === 'pronto' ? (
        <ImportHistory
          state={state}
          jobId={jobId}
        />
      ) : null}
    </div>
  );
}
