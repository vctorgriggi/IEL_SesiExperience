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
import {
  getCompany,
  getImportHistory,
  getJob
} from '@/features/iel-demo/state/selectors';
import { nowIso } from '@/features/iel-demo/state/storage';
import { CircleCheckIcon } from 'lucide-react';

import { routes } from '@workspace/routes';
import { cn } from '@workspace/ui/lib/utils';
import { Badge } from '@workspace/ui/shadcn/badge';
import { Button } from '@workspace/ui/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@workspace/ui/shadcn/card';

import { usePageHeader } from '../layout/page-header-context';
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

/**
 * A trilha dos três passos, no topo e em uma linha.
 *
 * Não é navegação: é orientação. Por isso os passos não são clicáveis — quem
 * volta, volta pelo botão do passo em que está, e o caminho continua sendo o
 * mesmo em qualquer direção.
 */
function Trilha({ atual }: { atual: Passo }) {
  const indiceAtual = PASSOS.findIndex((passo) => passo.id === atual);

  return (
    <ol className="flex flex-wrap items-center gap-2">
      {PASSOS.map((passo, indice) => (
        <li
          key={passo.id}
          aria-current={indice === indiceAtual ? 'step' : undefined}
          className="flex items-center gap-2"
        >
          <Badge
            variant={indice === indiceAtual ? 'default' : 'outline'}
            className={cn(
              'gap-1.5',
              indice !== indiceAtual && 'text-muted-foreground'
            )}
          >
            <span className="tabular-nums">{indice + 1}</span>
            {passo.rotulo}
          </Badge>
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
 *
 * O título e o caminho vivem no cabeçalho de 48px da casca, como em todas as
 * telas do analista; aqui dentro fica só a trilha e o passo atual.
 */
export function ImportScreen({ jobId }: { jobId: string }) {
  const { state, dispatch } = useIelDemo();
  const vaga = getJob(jobId);
  const empresa = vaga ? getCompany(vaga.companyId) : null;
  const iel = routes.dashboard.iel;

  const [passo, setPasso] = useState<Passo>('enviar');
  const [arquivo, setArquivo] = useState<string | null>(null);
  const [plano, setPlano] = useState<ImportPlan | null>(null);
  const [aplicado, setAplicado] = useState<Aplicado | null>(null);

  usePageHeader({
    breadcrumb: [
      { label: 'Vagas', href: iel.jobs.index },
      ...(empresa
        ? [{ label: empresa.name, href: iel.companies.byId(empresa.id) }]
        : []),
      ...(vaga
        ? [{ label: vaga.title, href: iel.jobs.byId(vaga.id).index }]
        : []),
      { label: 'Importar planilha' }
    ]
  });

  if (!vaga) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vaga não encontrada</CardTitle>
          <CardDescription>
            Esta vaga não existe na base da demonstração.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            asChild
          >
            <Link href={iel.jobs.index}>Ver as vagas</Link>
          </Button>
        </CardContent>
      </Card>
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
    <div className="flex flex-col gap-6">
      <Trilha atual={passo} />

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
        <>
          <Card>
            <CardHeader>
              <CircleCheckIcon
                aria-hidden="true"
                className="size-6 text-success"
              />
              <CardTitle className="text-xl">Pronto</CardTitle>
              <CardDescription>
                {aplicado.semMudancas
                  ? `Sem mudanças: esta planilha já tinha sido importada em ${vaga.title}.`
                  : `${plural(aplicado.novos, 'pessoa nova entrou', 'pessoas novas entraram')} na vaga ${vaga.title}.`}
              </CardDescription>
            </CardHeader>
            <CardFooter className="gap-2">
              <Button asChild>
                <Link href={iel.jobs.byId(jobId).index}>Ver a vaga</Link>
              </Button>
              <Button
                variant="outline"
                onClick={recomecar}
              >
                Importar outra
              </Button>
            </CardFooter>
          </Card>

          <ImportHistory
            state={state}
            jobId={jobId}
          />
        </>
      ) : null}
    </div>
  );
}
