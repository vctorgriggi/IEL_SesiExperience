'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ADHERENCE_THRESHOLD } from '@/features/iel-demo/analysis/adherence';
import { COPY, verdictSentence } from '@/features/iel-demo/copy';
import { plural } from '@/features/iel-demo/format';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  getCompany,
  getJob,
  getJobRanking,
  getVisibleJobs,
  type JobRankingEntry
} from '@/features/iel-demo/state/selectors';
import { ArrowRight } from 'lucide-react';

import { routes } from '@workspace/routes';
import { Alert } from '@workspace/ui';
import { cn } from '@workspace/ui/lib/utils';
import { Badge } from '@workspace/ui/shadcn/badge';
import { Button } from '@workspace/ui/shadcn/button';
import { Card, CardContent, CardHeader } from '@workspace/ui/shadcn/card';

import { usePageHeader } from '../layout/page-header-context';
import { textoDaAderencia } from '../metricas/cores';
import { BarrasDeAderencia } from './barras-de-aderencia';
import { PontosDoDia } from './pontos-do-dia';
import { RadarDeAderencia } from './radar-de-aderencia';
import { SeletorDePessoa } from './seletor-de-pessoa';
import { SeletorDeVaga } from './seletor-de-vaga';

function mediaDasMedidas(entradas: JobRankingEntry[]): number | null {
  const medidas = entradas
    .map((entrada) => entrada.adherence.total)
    .filter((total): total is number => total !== null);
  if (medidas.length === 0) return null;
  return medidas.reduce((soma, total) => soma + total, 0) / medidas.length;
}

/**
 * Análise de aderência:
 * - Seletor de vaga com campo de busca integrado.
 * - Indicadores-chave da vaga (candidatos, compatíveis, média, pendências).
 * - Leitura detalhada da pessoa selecionada (percentual, radar e os 5 pontos).
 * - Ranking completo das pessoas com campo de busca por nome e filtros rápidos.
 */
export function TelaDeAderencia() {
  const { state, persona } = useIelDemo();
  const searchParams = useSearchParams();
  const [applicationSelecionada, setApplicationSelecionada] = useState<
    string | null
  >(null);
  const [vagaEscolhida, setVagaEscolhida] = useState<string | null>(null);

  const iel = routes.dashboard.iel;
  const vagas = getVisibleJobs(state);
  const jobId = vagaEscolhida ?? searchParams.get('vaga') ?? vagas[0]?.id ?? '';
  const job = getJob(jobId);
  const company = job ? getCompany(job.companyId) : null;

  usePageHeader({ breadcrumb: [{ label: 'Análise de aderência' }] });

  const trocarDeVaga = (id: string) => {
    setVagaEscolhida(id);
    setApplicationSelecionada(null);
  };

  if (vagas.length === 0) {
    return (
      <Alert variant="default">
        Nenhuma vaga nesta base de demonstração.{' '}
        <Link
          className="underline"
          href={iel.jobs.index}
        >
          Ver as vagas
        </Link>
        .
      </Alert>
    );
  }

  if (!job) {
    return (
      <Alert variant="destructive">
        Vaga não encontrada nesta base de demonstração.{' '}
        <Link
          className="underline"
          href={iel.jobs.index}
        >
          Voltar para a lista de vagas
        </Link>
        .
      </Alert>
    );
  }

  if (
    persona.kind === 'gestor' &&
    persona.companyId &&
    persona.companyId !== job.companyId
  ) {
    return (
      <Alert variant="warning">
        Esta vaga pertence a outra empresa. Nesta demonstração, o perfil de
        gestor só acessa os processos da própria empresa.{' '}
        <Link
          className="underline"
          href={iel.jobs.index}
        >
          Ver as vagas da minha empresa
        </Link>
        .
      </Alert>
    );
  }

  const entradas = getJobRanking(state, job.id);
  const selecionada =
    entradas.find(
      (entrada) => entrada.application.id === applicationSelecionada
    ) ??
    entradas[0] ??
    null;

  const medidas = entradas.filter(
    (entrada) => entrada.adherence.total !== null
  );
  const compativeis = entradas.filter(
    (entrada) => entrada.adherence.compatible === true
  );
  const semResposta = entradas.length - medidas.length;
  const media = mediaDasMedidas(entradas);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight">
            Análise de aderência
          </h1>
          <p className="text-sm text-muted-foreground">
            {job.title}
            {company ? ` · ${company.name}` : ''}
          </p>
        </div>

        <SeletorDeVaga
          vagas={vagas}
          jobAtual={job}
          empresaAtual={company}
          aoTrocar={trocarDeVaga}
        />
      </div>

      {entradas.length === 0 ? (
        <Alert variant="default">
          Nenhuma pessoa nesta vaga ainda.{' '}
          <Link
            className="underline"
            href={iel.jobs.byId(job.id).index}
          >
            Voltar para a vaga
          </Link>
          .
        </Alert>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {plural(entradas.length, 'pessoa', 'pessoas')} ·{' '}
            {compativeis.length} acima do mínimo de {ADHERENCE_THRESHOLD}% ·
            média{' '}
            {media === null ? (
              <span aria-hidden="true">—</span>
            ) : (
              `${Math.round(media)}%`
            )}
            {semResposta > 0 ? ` · ${semResposta} sem resposta` : ''}
          </p>

          {selecionada === null ? null : (
            <SeletorDePessoa
              entradas={entradas}
              selecionada={selecionada}
              aoEscolher={setApplicationSelecionada}
            />
          )}

          {selecionada === null ? null : (
            <LeituraDaPessoa
              entrada={selecionada}
              tituloDaVaga={job.title}
              nomeEmpresa={company?.name ?? 'Empresa'}
              totalDePessoas={entradas.length}
              jobId={job.id}
            />
          )}

          <Card className="p-4 sm:p-5 shadow-xs">
            <div className="flex flex-col gap-1 mb-4">
              <h2 className="text-base font-semibold tracking-tight">
                Pessoas desta vaga
              </h2>
              <p className="text-xs text-muted-foreground">
                {plural(entradas.length, 'pessoa', 'pessoas')} ·{' '}
                {compativeis.length} acima do mínimo de {ADHERENCE_THRESHOLD}% ·
                O traço vertical no trilho representa o mínimo de{' '}
                {ADHERENCE_THRESHOLD}%. {COPY.fit.hint}
              </p>
            </div>

            <BarrasDeAderencia
              entradas={entradas}
              aoEscolher={setApplicationSelecionada}
              applicationSelecionada={selecionada?.application.id ?? null}
            />
          </Card>
        </>
      )}
    </div>
  );
}

/**
 * Leitura da Pessoa em Destaque:
 * - O número total em destaque com a frase interpretativa.
 * - O polígono comparativo no radar (empresa × candidato).
 * - Os 5 pontos do dia a dia detalhados individualmente com seus pesos.
 */
function LeituraDaPessoa({
  entrada,
  tituloDaVaga,
  nomeEmpresa,
  totalDePessoas,
  jobId
}: {
  entrada: JobRankingEntry;
  tituloDaVaga: string;
  nomeEmpresa: string;
  totalDePessoas: number;
  jobId: string;
}) {
  const iel = routes.dashboard.iel;
  const nome = entrada.talent?.name ?? 'Pessoa fora da base';
  const primeiroNome = nome.split(' ')[0] ?? nome;
  const total = entrada.adherence.total;

  return (
    <Card className="overflow-hidden border-border/80 shadow-xs">
      <CardHeader className="border-b border-border/60 bg-muted/20 px-4 py-3.5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className="px-2 py-0.5 text-xs font-semibold"
            >
              {entrada.rank}º lugar
            </Badge>
            <div className="flex flex-col">
              <h2 className="text-base font-semibold tracking-tight text-foreground">
                {nome}
              </h2>
              <p className="text-xs text-muted-foreground">
                Candidatura para {tituloDaVaga} · {nomeEmpresa}
              </p>
            </div>
          </div>

          {entrada.talent ? (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="gap-1.5 text-xs"
            >
              <Link href={iel.talents.byId(entrada.talent.id).inJob(jobId)}>
                Ver leitura completa
                <ArrowRight
                  className="size-3.5"
                  aria-hidden="true"
                />
              </Link>
            </Button>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          <div className="flex flex-col gap-4 lg:col-span-5">
            <div className="rounded-lg border border-border/70 bg-muted/20 p-4 flex flex-col gap-2.5">
              <div className="flex items-baseline gap-2.5">
                <span
                  className={cn(
                    'text-4xl font-bold tracking-tight tabular-nums',
                    textoDaAderencia(total)
                  )}
                >
                  {total === null ? (
                    <>
                      <span aria-hidden="true">—</span>
                      <span className="sr-only">Ainda sem medida</span>
                    </>
                  ) : (
                    `${Math.round(total)}%`
                  )}
                </span>
                <span className="text-sm font-medium text-foreground">
                  {verdictSentence(total, ADHERENCE_THRESHOLD)}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <Badge
                  variant="outline"
                  className="text-xs bg-background/60 font-normal"
                >
                  {entrada.adherence.coverage.answeredAxes} de{' '}
                  {entrada.adherence.coverage.totalAxes} pontos medidos
                </Badge>
                {entrada.technicalMatch !== null ? (
                  <Badge
                    variant="outline"
                    className="text-xs bg-background/60 font-normal"
                  >
                    {COPY.technical.label} {entrada.technicalMatch}%
                  </Badge>
                ) : null}
                <Badge
                  variant="outline"
                  className="text-xs bg-background/60 font-normal"
                >
                  {entrada.rank}º de {totalDePessoas} nesta vaga
                </Badge>
              </div>
            </div>

            <div className="rounded-lg border border-border/70 bg-card p-3 shadow-2xs">
              <RadarDeAderencia
                pontos={entrada.adherence.byAxis}
                primeiroNome={primeiroNome}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:col-span-7">
            <div className="flex flex-col gap-0.5">
              <h3 className="text-sm font-semibold tracking-tight text-foreground">
                Os 5 pontos do dia a dia
              </h3>
              <p className="text-xs text-muted-foreground">
                Alinhamento entre as preferências declaradas pela pessoa e o
                ambiente da empresa.
              </p>
            </div>

            <PontosDoDia
              pontos={entrada.adherence.byAxis}
              primeiroNome={primeiroNome}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
