'use client';

import { CULTURE_QUESTIONS } from '@/features/iel-demo/analysis/culture';
import {
  classificarCultura,
  FAIXA_DE_ENCAIXE_LABEL,
  FAIXA_DE_ENCAIXE_NOTA,
  TIPO_DE_CULTURA_LABEL,
  type FaixaDeEncaixe
} from '@/features/iel-demo/analysis/mapa-cultural';
import { plural } from '@/features/iel-demo/format';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  getCompany,
  getCultureFit,
  type CultureMapPoint
} from '@/features/iel-demo/state/selectors';
import type { Job } from '@/features/iel-demo/types';
import {
  Building01Icon,
  CheckmarkCircle02Icon,
  HelpCircleIcon,
  UserGroupIcon
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { Chip, InfoHint, Panel, PanelHeader } from '../shared/ui';
import {
  COR_DA_EMPRESA,
  COR_DO_TALENTO,
  PlanoCultural
} from './plano-cultural';

const TOM_POR_FAIXA: Record<
  FaixaDeEncaixe,
  'positivo' | 'info' | 'atencao' | 'conflito'
> = {
  'muito-proximo': 'positivo',
  proximo: 'info',
  'alguma-distancia': 'atencao',
  distante: 'conflito'
};

export function EncaixeCultural({
  job,
  talentId,
  talentName
}: {
  job: Job;
  talentId: string;
  talentName: string;
}) {
  const { state } = useIelDemo();
  const leitura = getCultureFit(state, talentId, job.companyId);
  const company = getCompany(job.companyId);

  if (!leitura) {
    return (
      <Panel padding="lg">
        <PanelHeader
          eyebrow="Mapa de Cultura"
          title="Sem base para posicionar os dois lados"
          hint="O mapa só desenha quem respondeu. Um lado sem resposta não vai para o centro do plano: ele fica de fora, e a tela diz que falta responder."
        />
        <p className="mt-3 text-sm text-muted-foreground">
          Falta o questionário de ambiente de trabalho de um dos dois lados.
          Enquanto ele não for respondido, a leitura por eixo acima continua
          valendo e o mapa fica sem posição.
        </p>
      </Panel>
    );
  }

  const pontos: CultureMapPoint[] = [
    {
      id: talentId,
      name: talentName,
      detail: 'Talento',
      kind: 'talento',
      position: leitura.talentPosition,
      culture: classificarCultura(leitura.talentPosition),
      teamPosition: null,
      divergentAxes: 0
    },
    {
      id: job.companyId,
      name: company?.name ?? 'Empresa',
      detail: company?.sector ?? '',
      kind: 'empresa',
      position: leitura.companyPosition,
      culture: classificarCultura(leitura.companyPosition),
      teamPosition: leitura.teamPosition,
      divergentAxes: leitura.divergentAxes
    }
  ];

  const convergentes = leitura.axes.filter((eixo) => eixo.convergente);
  const aAlinhar = leitura.axes.filter((eixo) => !eixo.convergente);

  return (
    <Panel padding="lg">
      <PanelHeader
        eyebrow="Mapa de Cultura"
        title="Ambiente de trabalho, lado a lado"
        hint="Posiciona os dois lados a partir das respostas já dadas nos cinco eixos. Descreve ambiente de trabalho, não personalidade, e não produz nota: a proximidade vira faixa e leitura em texto."
        meta={
          <>
            {plural(leitura.axes.length, 'eixo comparado', 'eixos comparados')}{' '}
            de {CULTURE_QUESTIONS.length}.
          </>
        }
        actions={
          <Chip tone={TOM_POR_FAIXA[leitura.fit.faixa]}>
            {FAIXA_DE_ENCAIXE_LABEL[leitura.fit.faixa]}
          </Chip>
        }
      />

      <div className="mt-5 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-3">
          <div className="overflow-hidden rounded-xl border border-border/80 bg-card p-3 shadow-xs">
            <PlanoCultural points={pontos} />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span
                aria-hidden
                className="size-2.5 rounded-full"
                style={{ backgroundColor: COR_DO_TALENTO }}
              />
              <strong className="text-foreground">{talentName}</strong> (
              {
                TIPO_DE_CULTURA_LABEL[
                  classificarCultura(leitura.talentPosition)
                ]
              }
              )
            </span>
            <span className="flex items-center gap-1.5">
              <span
                aria-hidden
                className="size-2.5 rounded-[2px]"
                style={{ backgroundColor: COR_DA_EMPRESA }}
              />
              <strong className="text-foreground">
                {company?.name ?? 'Empresa'}
              </strong>{' '}
              (
              {
                TIPO_DE_CULTURA_LABEL[
                  classificarCultura(leitura.companyPosition)
                ]
              }
              )
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-border/80 bg-muted/30 p-3.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Diagnóstico de Proximidade
            </p>
            <p className="mt-1 text-sm font-medium text-foreground leading-relaxed">
              {FAIXA_DE_ENCAIXE_NOTA[leitura.fit.faixa]}
            </p>
          </div>

          <div className="space-y-3">
            {/*
              Superfície neutra, identidade no ícone. O texto não veste a cor
              da série: quem diz de quem é a linha é o marcador ao lado, do
              mesmo tom que o ponto correspondente no plano.
            */}
            <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-muted/30 p-2.5 text-xs">
              <HugeiconsIcon
                icon={UserGroupIcon}
                size={16}
                style={{ color: COR_DO_TALENTO }}
              />
              <span className="font-semibold text-foreground">
                {talentName}:
              </span>
              <span className="text-muted-foreground">
                Cultura{' '}
                {
                  TIPO_DE_CULTURA_LABEL[
                    classificarCultura(leitura.talentPosition)
                  ]
                }
              </span>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-muted/30 p-2.5 text-xs">
              <HugeiconsIcon
                icon={Building01Icon}
                size={16}
                style={{ color: COR_DA_EMPRESA }}
              />
              <span className="font-semibold text-foreground">
                {company?.name ?? 'Empresa'}:
              </span>
              <span className="text-muted-foreground">
                Cultura{' '}
                {
                  TIPO_DE_CULTURA_LABEL[
                    classificarCultura(leitura.companyPosition)
                  ]
                }
              </span>
            </div>
          </div>

          {convergentes.length > 0 ? (
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <HugeiconsIcon
                  icon={CheckmarkCircle02Icon}
                  size={15}
                />
                <span>Onde convergem ({convergentes.length})</span>
              </div>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                {convergentes.map((eixo) => (
                  <li key={eixo.axisId}>
                    <span className="font-medium text-foreground">
                      {eixo.axisLabel}
                    </span>{' '}
                    — {eixo.opcaoDaEmpresa.toLowerCase()}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {aAlinhar.length > 0 ? (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                <HugeiconsIcon
                  icon={HelpCircleIcon}
                  size={15}
                />
                <span>Pontos a alinhar ({aAlinhar.length})</span>
              </div>
              <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                {aAlinhar.map((eixo) => (
                  <li
                    key={eixo.axisId}
                    className="leading-snug"
                  >
                    <span className="font-medium text-foreground">
                      {eixo.axisLabel}
                    </span>
                    : empresa oferece &ldquo;
                    {eixo.opcaoDaEmpresa.toLowerCase()}
                    &rdquo; vs talento espera &ldquo;
                    {eixo.opcaoDoTalento.toLowerCase()}&rdquo;.
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {leitura.teamPosition && leitura.teamFit ? (
            <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs text-warning-foreground leading-relaxed">
              <span className="font-semibold">Voz da equipe: </span>A equipe
              descreve um ambiente diferente em{' '}
              {plural(leitura.divergentAxes, 'eixo', 'eixos')}. O encaixe com a
              equipe real fica em{' '}
              <strong>
                {FAIXA_DE_ENCAIXE_LABEL[leitura.teamFit.faixa].toLowerCase()}
              </strong>
              .
            </div>
          ) : null}

          <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground pt-1">
            O mapa apoia a decisão humana e não descarta ninguém.
            <InfoHint label="A posição sai das respostas dos dois lados por regra fixa e pública. Nenhum candidato é eliminado pelo mapa, e a leitura por eixo continua sendo a base da conversa." />
          </p>
        </div>
      </div>
    </Panel>
  );
}
