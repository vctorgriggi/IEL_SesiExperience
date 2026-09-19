'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ADHERENCE_THRESHOLD } from '@/features/iel-demo/analysis/adherence';
import { getFitInsights } from '@/features/iel-demo/analysis/fit-insights';
import { COPY } from '@/features/iel-demo/copy';
import { plural } from '@/features/iel-demo/format';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  getAdherence,
  getApplicationsByTalent,
  getAxisWeights,
  getCompany,
  getFitReading,
  getJob,
  getReferralListSelection,
  getTalent
} from '@/features/iel-demo/state/selectors';
import { nowIso } from '@/features/iel-demo/state/storage';

import { routes } from '@workspace/routes';
import { Alert, Button, toast } from '@workspace/ui';

import { Hero, HowItWorks, Verdict } from '../shared/ui';
import { CollapsibleSection } from './collapsible-section';
import { FitAxesList } from './fit-axes-list';
import { FitInsights } from './fit-insights';
import { JobRequirements } from './job-requirements';
import { TalentAbout } from './talent-about';

/**
 * Esta pessoa combina com esta empresa?
 *
 * A tela tinha cabeçalho com chips e e-mail, um herói de método com três
 * números, um anel com quatro linhas de texto embaixo, um radar com legenda
 * em parágrafo e cinco trilhos de três blocos cada. Quem abria precisava ler
 * tudo para responder uma pergunta de sim ou não.
 *
 * Agora há um número — quanto a pessoa combina com a empresa —, a frase que o
 * interpreta e o botão que resolve. Os cinco pontos viraram cinco linhas que
 * abrem; requisitos da vaga, histórico e contato ficam recolhidos, porque
 * nenhum deles decide o envio.
 */
export function TalentProfileScreen({ talentId }: { talentId: string }) {
  const { state, dispatch, persona } = useIelDemo();
  const searchParams = useSearchParams();
  const jobId = searchParams.get('vaga');

  const iel = routes.dashboard.iel;
  const talent = getTalent(talentId);

  if (!talent) {
    return (
      <Alert variant="destructive">
        Pessoa não encontrada nesta base de demonstração.{' '}
        <Link
          className="underline"
          href={iel.talents.index}
        >
          Ver pessoas
        </Link>
        .
      </Alert>
    );
  }

  if (persona.kind === 'gestor') {
    return (
      <Alert variant="warning">
        No perfil de gestor, os dados de uma pessoa só aparecem dentro de uma
        lista enviada pelo IEL.{' '}
        <Link
          className="underline"
          href={iel.referrals.index}
        >
          Ver currículos enviados
        </Link>
        .
      </Alert>
    );
  }

  const job = jobId ? getJob(jobId) : null;
  const company = job ? getCompany(job.companyId) : null;
  const application = job
    ? (getApplicationsByTalent(state, talent.id).find(
        (entry) => entry.jobId === job.id
      ) ?? null)
    : null;

  // Sem vaga não há pergunta a responder: combinar é sempre com alguém. O
  // perfil abre pelo que descreve a pessoa, e a tela diz o que falta.
  if (!job || !application) {
    return (
      <div className="space-y-6">
        <Hero
          eyebrow="Perfil da pessoa"
          title={talent.name}
          description={talent.headline}
        />
        <Alert variant="default">
          Para ver se ela combina com uma empresa, abra este perfil a partir de
          uma vaga: o percentual depende da oportunidade.
        </Alert>
        <CollapsibleSection
          title="Sobre a pessoa"
          meta="Contato, experiências e histórico em outras vagas"
          defaultOpen
        >
          <TalentAbout
            talent={talent}
            jobId={null}
          />
        </CollapsibleSection>
      </div>
    );
  }

  const adherence = getAdherence(state, application.id);
  const reading = getFitReading(state, job, talent.id);
  const insights = getFitInsights(reading, getAxisWeights(state, job));
  const referralList = getReferralListSelection(state, job.id);
  const naLista = referralList.includes(application.id);

  const medidos = adherence?.coverage.answeredAxes ?? 0;
  const totalPontos = adherence?.coverage.totalAxes ?? 5;
  const semResposta =
    adherence?.byAxis.filter((axis) => axis.candidateValue === null).length ??
    totalPontos;

  const adicionar = () => {
    dispatch({
      type: 'add-to-referral-list',
      jobId: job.id,
      applicationId: application.id,
      at: nowIso()
    });
    toast.success('Pessoa adicionada à lista de envio.');
  };

  const botaoAdicionar = (
    <Button
      size={semResposta > 0 ? 'medium' : 'large'}
      variant={semResposta > 0 ? 'outline' : 'default'}
      disabled={naLista}
      onClick={adicionar}
    >
      {naLista ? 'Já está na lista' : 'Adicionar à lista'}
    </Button>
  );

  return (
    <div className="space-y-6">
      <Hero
        eyebrow={`Candidatura a ${job.title} · ${company?.name ?? 'empresa'}`}
        title={talent.name}
        description={talent.headline}
        verdict={
          <Verdict
            total={adherence?.total ?? null}
            threshold={ADHERENCE_THRESHOLD}
            size="lg"
            caption={`sobre ${medidos} de ${totalPontos} pontos do dia a dia`}
          />
        }
        figures={[
          {
            label: COPY.technical.label,
            value:
              application.technicalMatch === null ||
              application.technicalMatch === undefined
                ? '—'
                : `${application.technicalMatch}%`,
            hint: 'Vem do sistema de vagas, não é recalculado aqui.'
          },
          {
            label: 'Pontos medidos',
            value: `${medidos}/${totalPontos}`
          },
          {
            label: 'Sem resposta da pessoa',
            value: semResposta,
            tone: semResposta > 0 ? 'atencao' : 'default',
            hint:
              semResposta > 0
                ? `A pessoa ainda não respondeu ${plural(semResposta, 'ponto', 'pontos')}.`
                : 'Ela respondeu os cinco pontos.'
          }
        ]}
        actions={
          <>
            {semResposta > 0 ? (
              <Link href={iel.applications.byId(application.id).fit}>
                <Button size="large">{COPY.questions.ask}</Button>
              </Link>
            ) : null}
            {botaoAdicionar}
            <Link
              href={iel.jobs.byId(job.id).index}
              className="self-center text-sm font-medium text-primary underline-offset-2 hover:underline"
            >
              Voltar para a vaga
            </Link>
          </>
        }
      />

      <FitAxesList
        job={job}
        talentId={talent.id}
        application={application}
      />

      <FitInsights insights={insights} />

      <CollapsibleSection
        title={COPY.technical.label}
        meta={`${plural(job.criteria.length, 'requisito', 'requisitos')} desta vaga, com a origem de cada conclusão`}
      >
        <JobRequirements
          job={job}
          application={application}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="Sobre a pessoa"
        meta="Contato, experiências, avaliações e histórico em outras vagas"
      >
        <TalentAbout
          talent={talent}
          jobId={job.id}
        />
      </CollapsibleSection>

      <HowItWorks title="Como o % é calculado">
        <p>
          Em cada um dos 5 pontos do dia a dia, a resposta média de quem
          trabalha na empresa é comparada com a resposta da pessoa. Quanto mais
          perto uma da outra, maior o percentual do ponto; o total é a média
          desses pontos, com peso maior nos que a empresa disse que decidem a
          vaga.
        </p>
        <p>
          Ponto sem resposta de um dos lados não conta — nem a favor, nem
          contra. Por isso o número vem sempre com “sobre {medidos} de{' '}
          {totalPontos} pontos”.
        </p>
        <p>
          A partir de {ADHERENCE_THRESHOLD}% a pessoa entra como compatível.
          Abaixo disso ela continua na lista da vaga, marcada: quem decide o
          envio é a analista. Não é teste de personalidade e não produz nota.
        </p>
      </HowItWorks>
    </div>
  );
}
