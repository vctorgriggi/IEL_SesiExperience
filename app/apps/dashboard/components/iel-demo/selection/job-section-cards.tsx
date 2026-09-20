'use client';

import { ADHERENCE_THRESHOLD } from '@/features/iel-demo/analysis/adherence';
import { plural } from '@/features/iel-demo/format';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  CANDIDATE_FIT_DEADLINE_DAYS,
  getJobRanking,
  getReferralListSelection,
  getRescueCandidates,
  REFERRAL_LIMIT,
  RESCUE_TECHNICAL_CEILING
} from '@/features/iel-demo/state/selectors';
import type { Job } from '@/features/iel-demo/types';
import {
  IconClock,
  IconLifebuoy,
  IconSend,
  IconUserCheck
} from '@tabler/icons-react';

import { cn } from '@workspace/ui/lib/utils';
import { Badge } from '@workspace/ui/shadcn/badge';

import {
  BADGE_DE_ESTADO,
  LADO,
  PREENCHIMENTO_DE_ESTADO,
  SELO,
  TRILHO
} from '../metricas/cores';
import { CartaoDeIndicador } from '../metricas/kpi-card';
import { formatarDataCurta } from '../shared/datas';

/** Data de referência mais N dias, no formato curto da tela. */
function prazoEm(base: string, dias: number): string {
  const data = new Date(`${base.slice(0, 10)}T12:00:00.000Z`);
  if (Number.isNaN(data.getTime())) return base;
  data.setUTCDate(data.getUTCDate() + dias);
  return formatarDataCurta(data.toISOString().slice(0, 10));
}

/**
 * Os quatro números que abrem a vaga — todos **desta vaga**.
 *
 * O rótulo é curto de propósito: com o selo ocupando o canto direito do
 * cartão, uma descrição longa quebrava em duas linhas e desalinhava os quatro
 * números. Quem lê já tem o contexto da vaga no cabeçalho — "Compatíveis"
 * basta, e o rodapé do cartão diz o resto.
 *
 * Nenhum deles é um indicador de desempenho: os quatro são pendências. Quantos
 * já dá para enviar, quantos ainda não responderam, quantos estão marcados
 * (o limite de 5 é por vaga, R6) e quantos o filtro técnico descartaria mas
 * combinam com a empresa. Quem abre a tela precisa saber o que falta para
 * fechar a remessa, e não como a vaga vai.
 *
 * O andamento da consulta à equipe já esteve aqui como quarto cartão, e saiu:
 * "7 de 10 colaboradores responderam" é dado da empresa, igual em todas as
 * vagas dela, e "cobrar" é ação da tela da empresa. Na vaga ele virou uma
 * linha de contexto abaixo do subtítulo, com link para a empresa.
 */
export function JobSectionCards({
  job,
  onOpenRescue
}: {
  job: Job;
  /** Leva a tabela de candidatos para a aba Resgate. */
  onOpenRescue: () => void;
}) {
  const { state } = useIelDemo();

  const ranking = getJobRanking(state, job.id);
  const responderam = ranking.filter(
    (entry) => entry.adherence.total !== null
  ).length;
  const combinam = ranking.filter(
    (entry) => entry.adherence.compatible === true
  ).length;
  const semResposta = ranking.length - responderam;

  const marcados = getReferralListSelection(state, job.id).length;
  const faltamParaFechar = Math.max(0, REFERRAL_LIMIT - marcados);

  const resgate = getRescueCandidates(state, job.id).length;

  const selo = cn(SELO, BADGE_DE_ESTADO.neutro);

  return (
    <div
      data-tour="mesa-indicadores"
      className="grid grid-cols-1 gap-4 @xl/vaga:grid-cols-2 @4xl/vaga:grid-cols-4"
    >
      {/* Cada cartão é número, selo e rodapé soltos; lido em sequência vira
          "Compatíveis 49 com 35%… Acima do…". O leitor ouve uma frase só
          (`leitura`), e o desenho fica para os olhos. */}
      <CartaoDeIndicador
        leitura={`Compatíveis: ${plural(combinam, 'pessoa', 'pessoas')} com ${ADHERENCE_THRESHOLD}% ou mais de combinação com a empresa, acima do mínimo do IEL, de ${responderam} que responderam.`}
        icone={IconUserCheck}
        tom="combina"
        rotulo="Compatíveis"
        valor={combinam}
        selo={
          <Badge
            variant="outline"
            className={selo}
          >
            ≥ {ADHERENCE_THRESHOLD}%
          </Badge>
        }
        indicador={
          <div
            className={cn(
              'h-1.5 w-full overflow-hidden rounded-full',
              TRILHO.trilha
            )}
          >
            <div
              className={cn(
                'h-full rounded-full',
                PREENCHIMENTO_DE_ESTADO.combina
              )}
              style={{
                width: `${responderam === 0 ? 0 : (combinam / responderam) * 100}%`
              }}
            />
          </div>
        }
        rodape="Acima do mínimo do IEL"
        apoio={`de ${responderam} que responderam`}
      />

      <CartaoDeIndicador
        leitura={`Sem resposta: ${plural(semResposta, 'pessoa', 'pessoas')}. O prazo de resposta, de ${plural(CANDIDATE_FIT_DEADLINE_DAYS, 'dia', 'dias')}, termina em ${prazoEm(job.updatedAt, CANDIDATE_FIT_DEADLINE_DAYS)}; quem não responde sai do processo.`}
        icone={IconClock}
        tom="atencao"
        rotulo="Sem resposta"
        valor={semResposta}
        selo={
          <Badge
            variant="outline"
            className={selo}
          >
            {plural(CANDIDATE_FIT_DEADLINE_DAYS, 'dia', 'dias')}
          </Badge>
        }
        rodape={`Prazo de resposta termina ${prazoEm(job.updatedAt, CANDIDATE_FIT_DEADLINE_DAYS)}`}
        apoio="quem não responde sai do processo"
      />

      <CartaoDeIndicador
        leitura={`Marcados para envio: ${marcados} de ${REFERRAL_LIMIT}. ${
          faltamParaFechar === 0
            ? 'Remessa fechada.'
            : `Faltam ${faltamParaFechar} para fechar a remessa.`
        }`}
        icone={IconSend}
        tom="empresa"
        rotulo="Marcados"
        valor={
          <>
            {marcados}{' '}
            <span className="text-sm font-normal text-muted-foreground">
              de {REFERRAL_LIMIT}
            </span>
          </>
        }
        indicador={
          <div className="flex items-center gap-1.5">
            {Array.from({ length: REFERRAL_LIMIT }, (_, indice) => (
              <span
                key={indice}
                className={cn(
                  'size-2.5 rounded-full',
                  indice < marcados ? LADO.empresa.preenchimento : TRILHO.trilha
                )}
              />
            ))}
          </div>
        }
        rodape={
          faltamParaFechar === 0
            ? 'Remessa fechada'
            : `Faltam ${faltamParaFechar} para fechar a remessa`
        }
        apoio={`máximo de ${REFERRAL_LIMIT} currículos por vaga`}
      />

      <CartaoDeIndicador
        className="cursor-pointer transition-colors hover:border-foreground/20 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
        role="button"
        tabIndex={0}
        aria-label={`Resgate: ${plural(resgate, 'pessoa combina', 'pessoas combinam')} com a empresa e ${
          resgate === 1 ? 'fica' : 'ficam'
        } abaixo de ${RESCUE_TECHNICAL_CEILING}% nos requisitos. Ver na aba Resgate`}
        onClick={onOpenRescue}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onOpenRescue();
          }
        }}
        icone={IconLifebuoy}
        tom="pessoa"
        rotulo="Resgate"
        valor={
          <>
            {resgate}{' '}
            <span className="text-sm font-normal text-muted-foreground">
              {resgate === 1 ? 'pessoa' : 'pessoas'}
            </span>
          </>
        }
        selo={
          <Badge
            variant="outline"
            className={selo}
          >
            combinam
          </Badge>
        }
        rodape={`Abaixo de ${RESCUE_TECHNICAL_CEILING}% nos requisitos`}
        // O ⓘ explica o que é o resgate, porque o nome sozinho não diz: é a
        // dor que o cliente descreveu (o filtro técnico do sistema de vagas,
        // apertado demais, descarta quem daria certo).
        apoio={`Quem ficou abaixo de ${RESCUE_TECHNICAL_CEILING}% nos requisitos do sistema de vagas, mas combina com o jeito de trabalhar da empresa (${ADHERENCE_THRESHOLD}% ou mais). O filtro técnico apertado demais descarta gente que daria certo; aqui a analista revê antes de decidir.`}
      />
    </div>
  );
}
