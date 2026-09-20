'use client';

import Image from 'next/image';
import { AVISO_DEVOLUTIVA } from '@/features/iel-demo/analysis/devolutiva';
import {
  REPORT_AXIS_MATCH_LABEL,
  REPORT_VALIDITY_DAYS,
  type ReportAxisMatch
} from '@/features/iel-demo/analysis/referral-report';
import { AXIS_LABEL } from '@/features/iel-demo/copy';
import { plural } from '@/features/iel-demo/format';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  getReferralReport,
  type ReferralReportPerson
} from '@/features/iel-demo/state/selectors';
import { nowIso } from '@/features/iel-demo/state/storage';
import { IconDownload } from '@tabler/icons-react';

import { cn } from '@workspace/ui/lib/utils';
import { Avatar, AvatarFallback } from '@workspace/ui/shadcn/avatar';
import { Button } from '@workspace/ui/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@workspace/ui/shadcn/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@workspace/ui/shadcn/dialog';

import { DevolutivaDaEmpresa } from './devolutiva-da-empresa';

/**
 * O relatório que a empresa abre pelo link, sem login (S3).
 *
 * É o produto da empresa — não uma tela do IEL mostrada a ela. Responde uma
 * pergunta: quem eu chamo para entrevistar, e por quê. Por isso não tem menu,
 * não tem filtro, não tem ranking geral da vaga: são as até cinco pessoas
 * enviadas, na ordem de quanto combinam, com o que a empresa precisa para
 * decidir a ordem das conversas.
 *
 * O que não aparece aqui está em `getReferralReport`: outros candidatos,
 * resposta individual de colaborador, resposta do candidato ao questionário e
 * anotação interna do IEL não atravessam esta página (PRODUTO.md §5.1).
 */

/** Cor de cada faixa. É o único lugar da demo em que a cor carrega o dado… */
const MATCH_BAR: Record<ReportAxisMatch, string> = {
  combina: 'bg-success',
  parecido: 'bg-warning',
  difere: 'bg-destructive',
  'sem-resposta': 'bg-muted-foreground/30'
};

/** …e por isso a legenda escreve as quatro faixas com todas as letras. */
const LEGEND_ORDER: ReportAxisMatch[] = [
  'combina',
  'parecido',
  'difere',
  'sem-resposta'
];

/** Rótulo curto da barrinha: cabe em cinco colunas num celular. */
const SHORT_AXIS_LABEL: Record<string, string> = {
  'apoio-inicial': 'Apoio',
  autonomia: 'Organiza',
  'comunicacao-prioridades': 'Tarefas',
  'ritmo-turno': 'Horário',
  aprendizado: 'Aprende'
};

/** "14/09": a data como o cabeçalho a diz. */
function shortDate(iso: string | null): string | null {
  if (!iso) return null;
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
}

/** Um cartão pequeno do topo: um número e o que ele conta. */
function FigureCard({
  label,
  value,
  hint,
  phrase
}: {
  label: string;
  value: string;
  hint?: string;
  /** Verdadeiro quando o valor é uma frase: frase não se lê em 22px tabular. */
  phrase?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="gap-1">
        <CardDescription>{label}</CardDescription>
        <CardTitle
          className={cn(
            'font-semibold leading-tight',
            phrase ? 'text-[15px] font-medium' : 'text-[22px] tabular-nums'
          )}
        >
          {value}
          {hint ? (
            <span className="ml-1 text-[13px] font-normal text-muted-foreground">
              {hint}
            </span>
          ) : null}
        </CardTitle>
      </CardHeader>
    </Card>
  );
}

/** As cinco barrinhas de uma pessoa, com o rótulo curto embaixo. */
function AxisBars({ person }: { person: ReferralReportPerson }) {
  return (
    <div className="flex gap-1.5">
      {person.byAxis.map((axis) => (
        <div
          key={axis.axisId}
          className="flex min-w-0 flex-1 flex-col gap-1"
          title={`${AXIS_LABEL[axis.axisId]} — ${REPORT_AXIS_MATCH_LABEL[axis.match]}`}
        >
          <span
            className={cn('h-1.5 rounded-full', MATCH_BAR[axis.match])}
            aria-hidden="true"
          />
          <span className="truncate text-[10px] text-muted-foreground">
            {SHORT_AXIS_LABEL[axis.axisId] ?? AXIS_LABEL[axis.axisId]}
          </span>
          <span className="sr-only">
            {AXIS_LABEL[axis.axisId]}: {REPORT_AXIS_MATCH_LABEL[axis.match]}
          </span>
        </div>
      ))}
    </div>
  );
}

/** O currículo resumido, como foi congelado no envio. */
function ResumeDialog({ person }: { person: ReferralReportPerson }) {
  return (
    <Dialog>
      <DialogTrigger className="text-[13px] font-medium underline underline-offset-[3px]">
        Ver currículo
      </DialogTrigger>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{person.name}</DialogTitle>
          <DialogDescription>
            {[person.headline, person.experienceSpan, person.city]
              .filter(Boolean)
              .join(' · ')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 text-sm leading-relaxed">
          <p>{person.summary}</p>

          {person.technicalMatch !== null ? (
            <p className="text-muted-foreground">
              Requisitos da vaga: {Math.round(person.technicalMatch)}% —
              percentual calculado pelo sistema de vagas, não recalculado aqui.
            </p>
          ) : null}

          {person.attentionPoints.length > 0 ? (
            <div className="flex flex-col gap-1">
              <p className="font-medium">Pontos de atenção</p>
              <ul className="list-inside list-disc text-muted-foreground">
                {person.attentionPoints.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {person.suggestedQuestions.length > 0 ? (
            <div className="flex flex-col gap-1">
              <p className="font-medium">Perguntas para a entrevista</p>
              <ul className="list-inside list-disc text-muted-foreground">
                {person.suggestedQuestions.map((question) => (
                  <li key={question}>{question}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Regras de impressão.
 *
 * "Baixar PDF" é `window.print()`: o navegador já sabe gerar PDF e uma
 * biblioteca de PDF seria dependência nova para resolver o que o Ctrl+P
 * resolve. O que muda no papel é o que não faz sentido nele — os botões — e o
 * que o papel perde — a cor de fundo das barrinhas.
 */
/**
 * Para onde a empresa escreve quando quer falar com a analista.
 *
 * O botão "Falar com a analista" abria um e-mail para `company.contactEmail`
 * — o contato da própria empresa. Quem lia o relatório escrevia para si mesmo.
 * O endereço é o do Centro de Empregos do IEL; na demonstração, fictício.
 */
const IEL_CONTACT_EMAIL = 'centro.empregos@iel.example.org';

const PRINT_CSS = `@media print {
  [data-report-actions] { display: none !important; }
  [data-report-page] { background: #fff !important; }
  [data-report-card] { break-inside: avoid; box-shadow: none !important; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}`;

export function ReferralReportScreen({ token }: { token: string }) {
  const { state } = useIelDemo();
  // O "hoje" da demonstração vem do relógio único: é ele que decide se o
  // prazo de 90 dias já fechou e a página volta a perguntar.
  const report = getReferralReport(state, token, nowIso());

  if (!report) {
    return (
      <div className="mx-auto flex max-w-lg flex-col gap-2 px-6 py-16 text-center">
        <h1 className="text-[22px] font-semibold tracking-tight">
          Relatório não encontrado
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Este endereço não corresponde a nenhum envio. Links de relatório valem
          por {REPORT_VALIDITY_DAYS} dias; peça um novo a quem enviou os
          currículos.
        </p>
      </div>
    );
  }

  const {
    referralId,
    company,
    job,
    people,
    sampleProgress,
    evaluatedCount,
    mostDivergentAxis,
    sentAt,
    sentBy
  } = report;

  const enviado = shortDate(sentAt);
  const assunto = encodeURIComponent(
    `Currículos enviados — ${job.title} (${company.name})`
  );

  return (
    // A largura é da casca (`IelShell` dá 56rem à rota do relatório), então
    // aqui só resta o documento.
    <div data-report-page>
      <style>{PRINT_CSS}</style>

      <header className="flex min-h-14 flex-wrap items-center gap-x-3 gap-y-2 border-b px-6">
        <Image
          src="/marca/mindrh-wordmark.png"
          alt="Mind RH"
          width={2624}
          height={613}
          className="h-5 w-auto"
        />
        <span className="text-[13px] text-muted-foreground">
          IEL · Currículos enviados
        </span>
        <div
          data-report-actions
          className="ml-auto flex gap-2"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
          >
            <IconDownload />
            Baixar PDF
          </Button>
          <Button
            size="sm"
            asChild
          >
            <a href={`mailto:${IEL_CONTACT_EMAIL}?subject=${assunto}`}>
              Falar com a analista
            </a>
          </Button>
        </div>
      </header>

      <div className="flex flex-col gap-6 px-6 py-8">
        <div className="flex flex-col gap-1">
          <p className="text-[13px] text-muted-foreground">
            {company.name} · enviado por {sentBy}
            {enviado ? ` em ${enviado}` : null}
          </p>
          <h1 className="text-[22px] font-semibold leading-tight tracking-tight">
            {job.title} — {plural(people.length, 'pessoa', 'pessoas')} para
            entrevistar
          </h1>
          <p className="max-w-[640px] text-sm leading-relaxed text-muted-foreground">
            Todas atendem aos requisitos da vaga e combinam com o jeito de
            trabalhar que a sua equipe descreveu. A ordem é por quanto combinam;
            a escolha é sua. Quando o processo terminar, diga aqui mesmo o que
            aconteceu com cada uma — é um clique.
          </p>
          {/* Finalidade do clique, uma vez na página (PRODUTO.md §5.6): a
              empresa precisa saber para que serve antes de responder, e
              repetir a frase em cada pessoa afogaria a própria tela. */}
          <p className="max-w-[640px] text-xs leading-relaxed text-muted-foreground">
            {AVISO_DEVOLUTIVA}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <FigureCard
            label="Sua equipe respondeu"
            value={`${sampleProgress.answered}`}
            hint={`de ${sampleProgress.total} colaboradores`}
          />
          <FigureCard
            label="Candidatos avaliados"
            value={`${evaluatedCount}`}
            hint="responderam o questionário"
          />
          <FigureCard
            label="Ponto onde mais divergem"
            phrase
            value={
              mostDivergentAxis === null
                ? 'Nenhum — as cinco leituras combinam'
                : `${AXIS_LABEL[mostDivergentAxis]} — vale conversar na entrevista`
            }
          />
        </div>

        <div className="flex flex-col gap-4">
          {people.map((person) => (
            <Card
              key={person.name}
              data-report-card
            >
              <CardContent className="grid grid-cols-[1.5rem_minmax(0,1fr)] items-center gap-x-4 gap-y-4 lg:grid-cols-[1.5rem_minmax(0,1fr)_5.5rem_15rem_6.5rem]">
                <span className="text-[13px] font-semibold text-muted-foreground">
                  {person.position}
                </span>

                <div className="flex min-w-0 items-center gap-3">
                  <Avatar size="lg">
                    <AvatarFallback className="text-xs font-semibold">
                      {person.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 leading-tight">
                    <p className="text-[15px] font-medium">{person.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[person.headline, person.experienceSpan, person.city]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                </div>

                <div className="col-start-2 flex flex-col gap-0.5 lg:col-start-3">
                  <span className="text-xs text-muted-foreground">Combina</span>
                  <span className="text-xl font-semibold tabular-nums">
                    {person.adherenceTotal === null
                      ? '—'
                      : `${Math.round(person.adherenceTotal)}%`}
                  </span>
                </div>

                <div className="col-start-2 lg:col-start-4">
                  <AxisBars person={person} />
                </div>

                <div className="col-start-2 lg:col-start-5 lg:text-right">
                  <ResumeDialog person={person} />
                </div>

                <DevolutivaDaEmpresa
                  referralId={referralId}
                  person={person}
                />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
          {LEGEND_ORDER.map((match) => (
            <span
              key={match}
              className="inline-flex items-center gap-1.5"
            >
              <span
                aria-hidden="true"
                className={cn('h-1.5 w-4 rounded-full', MATCH_BAR[match])}
              />
              {REPORT_AXIS_MATCH_LABEL[match]}
            </span>
          ))}
          <span className="sm:ml-auto">
            Página válida por {REPORT_VALIDITY_DAYS} dias · dados sob
            responsabilidade do IEL
          </span>
        </div>
      </div>
    </div>
  );
}
