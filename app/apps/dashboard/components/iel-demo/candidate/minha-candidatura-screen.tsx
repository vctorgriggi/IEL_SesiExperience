'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  getSituacaoDaCandidatura,
  type SituacaoId
} from '@/features/iel-demo/analysis/situacao-da-candidatura';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  getApplication,
  getCandidateJobView,
  getTalent,
  respostasResolvidas,
  validadeDasRespostas
} from '@/features/iel-demo/state/selectors';
import {
  IconBriefcase,
  IconCircleCheck,
  IconClock,
  IconPencil,
  IconPhone,
  IconSend,
  IconUsers
} from '@tabler/icons-react';
import type { TablerIcon } from '@tabler/icons-react';

import { routes } from '@workspace/routes';
import { cn } from '@workspace/ui/lib/utils';
import { Badge } from '@workspace/ui/shadcn/badge';
import { Button } from '@workspace/ui/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@workspace/ui/shadcn/card';

import { TalentTransparency } from '../clarifications/talent-transparency';
import { ICONE_TINGIDO } from '../metricas/cores';
import { AtalhoDaEquipe } from '../shared/fluxo-por-link';
import { SuasRespostas } from '../shared/suas-respostas';

/**
 * Minha candidatura: a única tela do produto que responde à pessoa.
 *
 * Responde uma pergunta só — **em que pé está e o que acontece agora** — e
 * nenhum estado termina em silêncio. Enxuta por pedido do dono do produto
 * (20/09/2026): o título do estado, uma linha, no máximo dois passos e, quando
 * a vez é da pessoa, um botão. O resto — o que ela respondeu, o que está
 * registrado sobre ela, os direitos — fica em "Seus dados", a um toque.
 *
 * ## O que ela nunca mostra
 *
 * O nome da empresa (R5), inclusive quando a empresa quer entrevistar: quem
 * revela o nome é a pessoa do IEL, na ligação. Posição, ranking, percentual
 * ou qualquer comparação — o produto não classifica pessoas, e esta é a tela
 * de quem mais sofreria com uma classificação. E nenhum "responder de novo":
 * a resposta é uma só e vale 12 meses; corrigir é pelo IEL.
 *
 * ## Forma
 *
 * Celular primeiro, uma coluna de 390px, alvos de 48px e corpo de 15px. Sem
 * login e sem cadastro — o link abre direto (00:08:01).
 */

/** "05/09/2027": a validade fica longe e precisa do ano. */
function dataPorExtenso(iso: string): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
}

/** Um ícone por situação. Nunca sozinho: o título ao lado diz o mesmo. */
const ICONE_DA_SITUACAO: Record<SituacaoId, TablerIcon> = {
  'sem-resposta': IconPencil,
  'prazo-vencido': IconClock,
  'em-analise': IconCircleCheck,
  enviado: IconSend,
  'quer-conversar': IconPhone,
  'nao-seguiu': IconUsers,
  contratado: IconBriefcase
};

/** O atalho da equipe: o perfil da pessoa (onde a resposta chega) ou, sem talento, a vaga. */
function atalhoDoCandidato(
  application: { talentId: string | null; jobId: string } | null
): { href: string } | undefined {
  if (!application) return undefined;
  return {
    href: application.talentId
      ? routes.dashboard.iel.talents.byId(application.talentId).index
      : routes.dashboard.iel.jobs.byId(application.jobId).index
  };
}

export function MinhaCandidaturaScreen({
  applicationId,
  equipeLogada = false
}: {
  applicationId: string;
  /** Sessão da analista confirmada pela página: mostra o atalho de volta. */
  equipeLogada?: boolean;
}) {
  const { state } = useIelDemo();

  const application = getApplication(state, applicationId);
  const atalho = equipeLogada ? atalhoDoCandidato(application) : undefined;
  const jobView = getCandidateJobView(state, applicationId);
  const situacao = getSituacaoDaCandidatura(state, applicationId);

  if (!application || !jobView || !situacao) {
    return (
      <Moldura
        atalho={atalho}
        badge={null}
      >
        <Card>
          <CardHeader>
            <CardTitle>
              <h1>Link inválido</h1>
            </CardTitle>
            <CardDescription>
              Este link não corresponde a nenhuma candidatura. Confira a
              mensagem que você recebeu.
            </CardDescription>
          </CardHeader>
        </Card>
      </Moldura>
    );
  }

  const talent = getTalent(application.talentId, state);
  // O que a pessoa respondeu para esta vaga — daqui ou reaproveitado —, para
  // devolver frase a frase. Só depois de confirmado: rascunho não é resposta.
  const respostas =
    situacao.id !== 'sem-resposta' && situacao.id !== 'prazo-vencido'
      ? (respostasResolvidas(state, applicationId)?.valores ?? null)
      : null;
  // A resposta é da pessoa e vale 12 meses: é dela a pergunta "até quando
  // isso que eu respondi continua valendo?", e é aqui que ela volta.
  const validade = validadeDasRespostas(state, application.talentId);
  const Icone = ICONE_DA_SITUACAO[situacao.id];
  const rotas = routes.dashboard.iel.applications.byId(applicationId);
  // Dois destinos possíveis: o questionário da vaga ou, para quem foi
  // contratado, a pergunta "como está sendo?" dos 30, 60 e 90 dias.
  const destinoDaAcao =
    situacao.acao?.destino === 'como-esta-sendo' ? rotas.checkIn : rotas.fit;
  const temRespostas = respostas !== null && Object.keys(respostas).length > 0;
  const temContou = Boolean(situacao.contou && situacao.contou.length > 0);

  return (
    <Moldura
      atalho={atalho}
      badge={
        <Badge
          variant="outline"
          className="font-medium text-muted-foreground"
        >
          Vaga de {jobView.activity}
        </Badge>
      }
    >
      <div className="flex flex-col gap-3">
        <span
          aria-hidden="true"
          className={cn(
            'flex size-9 items-center justify-center rounded-lg',
            ICONE_TINGIDO[situacao.tom]
          )}
        >
          <Icone className="size-5" />
        </span>
        <h1 className="text-[22px] font-semibold leading-tight tracking-tight">
          {situacao.titulo}
        </h1>
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          {situacao.resumo}
        </p>
      </div>

      {/*
       * O bloco que não pode faltar em nenhum estado: de quem é a vez, o que
       * essa pessoa faz e em quanto tempo. É a diferença entre esperar e ser
       * deixado esperando.
       */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            <h2>O que acontece agora</h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="flex flex-col gap-4">
            {situacao.agora.map((passo, indice) => (
              <li
                key={passo.quem}
                className="flex gap-3"
              >
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold tabular-nums text-muted-foreground"
                >
                  {indice + 1}
                </span>
                <div className="flex flex-col gap-0.5">
                  <p className="text-[15px] leading-snug text-foreground">
                    {passo.quem}
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {passo.quando}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {situacao.acao ? (
        <Button
          size="lg"
          // Contar a própria versão depois que a empresa informou saída é
          // uma porta aberta, não uma pendência: fica em contorno.
          variant={situacao.acao.peso === 'discreta' ? 'outline' : 'default'}
          className="h-12 w-full text-[15px]"
          asChild
        >
          <Link href={destinoDaAcao}>{situacao.acao.rotulo}</Link>
        </Button>
      ) : null}

      {/*
       * Seus dados, a um toque: o que a pessoa respondeu (frase a frase, no
       * vocabulário da escala — nunca comparação), até quando vale, o que
       * ela contou depois de contratada, a vaga sem o nome da empresa, os
       * registros e os direitos.
       */}
      {talent ? (
        <TalentTransparency talentId={talent.id}>
          <div className="flex flex-col gap-5">
            {temRespostas && respostas ? (
              <SuasRespostas
                papel="candidato"
                respostas={respostas}
                moldura="secao"
              />
            ) : null}
            {temRespostas && validade?.validaAte ? (
              <p className="text-sm leading-relaxed text-muted-foreground">
                Suas respostas valem até {dataPorExtenso(validade.validaAte)}.
                Noutra vaga pelo IEL, a gente pergunta só o que faltar.
              </p>
            ) : null}
            {temContou ? (
              <section className="flex flex-col gap-2">
                <h3 className="text-sm font-medium">O que você já contou</h3>
                <ul className="flex flex-col gap-2">
                  {situacao.contou?.map((linha) => (
                    <li
                      key={linha}
                      className="flex gap-2.5"
                    >
                      <IconCircleCheck
                        aria-hidden="true"
                        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                      />
                      <p className="text-[15px] leading-relaxed text-foreground">
                        {linha}
                      </p>
                    </li>
                  ))}
                </ul>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  A empresa não vê nada disto. Quem lê é só a equipe do IEL.
                </p>
              </section>
            ) : null}
            <section className="flex flex-col gap-2">
              <h3 className="text-sm font-medium">A vaga</h3>
              {/* Os quatro campos de `getCandidateJobView`, e só eles (R5). */}
              <p className="text-[15px] leading-relaxed text-foreground">
                {jobView.activity} · {jobView.location} · {jobView.sector} ·{' '}
                {jobView.shift}
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                O nome da empresa você conhece na entrevista.
              </p>
            </section>
          </div>
        </TalentTransparency>
      ) : null}
    </Moldura>
  );
}

/**
 * A mesma moldura do questionário: o quadrado da marca já vem da casca por
 * link, então aqui fica só a etiqueta da vaga — o único jeito de a pessoa
 * saber a que candidatura o link se refere sem descobrir a empresa (R5).
 */
function Moldura({
  badge,
  atalho,
  children
}: {
  badge: ReactNode;
  /** Só com sessão da analista: a volta ao Mind RH, no rodapé. */
  atalho?: { href: string };
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 px-1 pt-2">
      <div className="flex items-center justify-end gap-2">{badge}</div>
      {children}
      {atalho ? <AtalhoDaEquipe href={atalho.href} /> : null}
    </div>
  );
}
