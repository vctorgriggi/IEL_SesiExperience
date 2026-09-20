'use client';

/**
 * "Manda essa pessoa" — o verbo que faltava no mapa de cultura.
 *
 * O mapa e a análise de par respondem quem combina com a empresa, e é a
 * frase que a analista diz em voz alta na hora: "essa aí eu mando". Até
 * agora, dizer isso custava sair do painel, achar a vaga, achar a pessoa na
 * tabela e só então marcar. O botão faz o mesmo que a mesa de seleção faz —
 * a mesma ação `add-to-referral-list`, o mesmo teto de cinco por vaga —, sem
 * a volta pelo caminho.
 *
 * O que ele **não** faz: enviar. Marcar é entrar na lista; a remessa continua
 * nascendo no preparo do envio, revisada, como sempre foi (R6).
 */
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { COPY } from '@/features/iel-demo/copy';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  getApplicationsByTalent,
  getJob,
  getReferralListSelection,
  getTalent,
  REFERRAL_LIMIT
} from '@/features/iel-demo/state/selectors';
import { nowIso } from '@/features/iel-demo/state/storage';
import type { Job } from '@/features/iel-demo/types';
import { IconSend } from '@tabler/icons-react';

import { routes } from '@workspace/routes';
import { toast } from '@workspace/ui';
import { Button } from '@workspace/ui/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@workspace/ui/shadcn/dropdown-menu';

/** Uma vaga da empresa em que a pessoa já é candidata. */
type Candidatura = {
  applicationId: string;
  job: Job;
  naLista: boolean;
};

/**
 * As vagas abertas desta empresa em que esta pessoa já se candidatou.
 *
 * Só candidatura: o encaminhamento é sempre para uma vaga, e o Mind RH não
 * inventa candidatura que a pessoa não fez — quem chega ao mapa sem se
 * candidatar entra pelo convite, não por aqui.
 */
export function candidaturasNaEmpresa(
  state: ReturnType<typeof useIelDemo>['state'],
  talentId: string,
  companyId: string
): Candidatura[] {
  return getApplicationsByTalent(state, talentId)
    .map((application) => {
      const job = getJob(application.jobId);
      if (!job || job.companyId !== companyId || job.stage === 'encerrada') {
        return null;
      }
      return {
        applicationId: application.id,
        job,
        naLista: getReferralListSelection(state, job.id).includes(
          application.id
        )
      };
    })
    .filter((item): item is Candidatura => item !== null);
}

/**
 * Marca várias pessoas de uma vez para as vagas desta empresa.
 *
 * A analista lê o mapa e decide em bloco — "essas quatro eu mando" —, e
 * marcar uma a uma é o tipo de trabalho que o produto existe para tirar. O
 * teto de cinco por vaga continua valendo, e é por isso que o resultado
 * volta contado: quem entrou, quem não coube e quem não tinha candidatura.
 */
export function EncaminharSelecionados({
  talentIds,
  companyId,
  aoConcluir
}: {
  talentIds: string[];
  companyId: string;
  /** Limpa a seleção quando a marcação termina. */
  aoConcluir?: () => void;
}) {
  const { state, dispatch } = useIelDemo();

  const marcarTodas = () => {
    const at = nowIso();
    /*
     * A contagem por vaga é local: o `state` do provider só muda no próximo
     * render, e marcar cinco numa vaga que já tinha quatro precisa saber que
     * a primeira já ocupou a vaga da segunda.
     */
    const ocupadas = new Map<string, number>();
    const quantasNaVaga = (jobId: string) =>
      ocupadas.get(jobId) ?? getReferralListSelection(state, jobId).length;

    let marcados = 0;
    let semVaga = 0;
    const vagasCheias = new Set<string>();
    let semEspaco = 0;

    for (const talentId of talentIds) {
      const candidaturas = candidaturasNaEmpresa(state, talentId, companyId);
      if (candidaturas.length === 0) {
        semVaga++;
        continue;
      }
      // Já na lista de alguma vaga desta empresa: nada a fazer, e nada a
      // avisar — o resultado que a analista queria já está lá.
      if (candidaturas.some((candidatura) => candidatura.naLista)) continue;

      /*
       * Quando a pessoa é candidata a mais de uma vaga da empresa, vale a
       * que ainda tem espaço: recusar por causa da primeira, com a segunda
       * vazia ao lado, seria o produto perdendo por desatenção.
       */
      const escolhida = candidaturas.find(
        (candidatura) => quantasNaVaga(candidatura.job.id) < REFERRAL_LIMIT
      );
      if (!escolhida) {
        for (const candidatura of candidaturas) {
          vagasCheias.add(candidatura.job.title);
        }
        semEspaco++;
        continue;
      }

      dispatch({
        type: 'add-to-referral-list',
        jobId: escolhida.job.id,
        applicationId: escolhida.applicationId,
        at
      });
      ocupadas.set(escolhida.job.id, quantasNaVaga(escolhida.job.id) + 1);
      marcados++;
    }

    if (marcados > 0) {
      toast.success(
        `${marcados} ${marcados === 1 ? 'currículo entrou' : 'currículos entraram'} na lista de envio.`
      );
    }
    /*
     * O aviso de limite diz de qual vaga se trata e quantos ficaram de fora.
     * "No máximo 5 currículos" sozinho, depois de marcar três, parecia que
     * nada tinha entrado — e o que aconteceu foi outra coisa: a vaga já
     * tinha currículos de antes.
     */
    if (semEspaco > 0) {
      toast.error(
        `${[...vagasCheias].join(', ')} já está com ${REFERRAL_LIMIT} currículos: ${semEspaco} ${semEspaco === 1 ? 'ficou' : 'ficaram'} de fora. Retire alguém da lista da vaga para trocar.`
      );
    }
    if (semVaga > 0 && marcados === 0 && semEspaco === 0) {
      toast.error(
        'Ninguém da seleção tem candidatura em vaga aberta desta empresa.'
      );
    }
    aoConcluir?.();
  };

  return (
    <Button
      size="sm"
      className="w-full"
      onClick={marcarTodas}
    >
      <IconSend aria-hidden="true" />
      Marcar {talentIds.length}{' '}
      {talentIds.length === 1 ? 'currículo' : 'currículos'} para envio
    </Button>
  );
}

export function EncaminharPessoa({
  talentId,
  companyId,
  aoSair
}: {
  talentId: string;
  companyId: string;
  /** Fecha o painel quando a ação leva para outra tela. */
  aoSair?: () => void;
}) {
  const { state, dispatch } = useIelDemo();
  const [aberto, setAberto] = useState(false);

  const candidaturas = useMemo(
    () => candidaturasNaEmpresa(state, talentId, companyId),
    [state, talentId, companyId]
  );

  const nome = getTalent(talentId, state)?.name ?? 'A pessoa';
  const primeiroNome = nome.split(' ')[0] ?? nome;

  const marcar = (candidatura: Candidatura) => {
    setAberto(false);
    const lista = getReferralListSelection(state, candidatura.job.id);
    if (lista.length >= REFERRAL_LIMIT) {
      toast.error(COPY.referral.limit);
      return;
    }
    dispatch({
      type: 'add-to-referral-list',
      jobId: candidatura.job.id,
      applicationId: candidatura.applicationId,
      at: nowIso()
    });
    toast.success(
      `${primeiroNome} entrou na lista de ${candidatura.job.title}.`
    );
  };

  /*
   * Sem candidatura não há o que marcar, e o botão desligado sem explicação
   * seria pior que botão nenhum: a frase diz por que, e continua sendo a
   * resposta honesta — o mapa mostra quem combina, inclusive quem ainda não
   * se candidatou a nada nesta empresa.
   */
  if (candidaturas.length === 0) {
    return (
      <p className="text-center text-xs text-muted-foreground">
        {primeiroNome} não tem candidatura em vaga aberta desta empresa.
      </p>
    );
  }

  const unica = candidaturas.length === 1 ? candidaturas[0] : null;

  if (unica) {
    // Já na lista, o verbo muda: o que falta agora é preparar o envio, e é
    // para lá que o botão leva.
    if (unica.naLista) {
      return (
        <Button
          asChild
          size="sm"
          variant="outline"
          className="w-full"
        >
          <Link
            href={routes.dashboard.iel.jobs.byId(unica.job.id).referral}
            onClick={aoSair}
          >
            <IconSend aria-hidden="true" />
            Já está na lista · preparar o envio
          </Link>
        </Button>
      );
    }

    return (
      <Button
        size="sm"
        className="w-full"
        onClick={() => marcar(unica)}
      >
        <IconSend aria-hidden="true" />
        Marcar para envio · {unica.job.title}
      </Button>
    );
  }

  return (
    <DropdownMenu
      open={aberto}
      onOpenChange={setAberto}
    >
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          className="w-full"
        >
          <IconSend aria-hidden="true" />
          Marcar para envio
        </Button>
      </DropdownMenuTrigger>
      {/* Mais de uma vaga na mesma empresa: a escolha é da analista, e o
          nome da vaga é o que a distingue. */}
      <DropdownMenuContent
        align="center"
        className="w-[min(20rem,calc(100vw-2rem))]"
      >
        {candidaturas.map((candidatura) =>
          candidatura.naLista ? (
            <DropdownMenuItem
              key={candidatura.applicationId}
              asChild
            >
              <Link
                href={
                  routes.dashboard.iel.jobs.byId(candidatura.job.id).referral
                }
                onClick={aoSair}
              >
                {candidatura.job.title} · já está na lista
              </Link>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              key={candidatura.applicationId}
              onSelect={() => marcar(candidatura)}
            >
              {candidatura.job.title}
            </DropdownMenuItem>
          )
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
