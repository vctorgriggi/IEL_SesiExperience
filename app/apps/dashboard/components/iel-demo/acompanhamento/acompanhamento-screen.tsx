'use client';

import { useMemo, useState } from 'react';
import { lerDevolutiva } from '@/features/iel-demo/analysis/devolutiva';
import { plural } from '@/features/iel-demo/format';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  getAcompanhamento,
  getApplication,
  getCompany,
  getJob,
  getRegisteredReferrals,
  getTalent
} from '@/features/iel-demo/state/selectors';
import type { Talent } from '@/features/iel-demo/types';
import {
  IconHeartHandshake,
  IconLock,
  IconPhone,
  IconUserCheck,
  IconUserX
} from '@tabler/icons-react';

import { cn } from '@workspace/ui/lib/utils';
import { Badge } from '@workspace/ui/shadcn/badge';
import { Button } from '@workspace/ui/shadcn/button';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@workspace/ui/shadcn/table';

import { usePageHeader } from '../layout/page-header-context';
import {
  BADGE_DE_ESTADO,
  PREENCHIMENTO_DE_ESTADO,
  type EstadoDeCor
} from '../metricas/cores';
import { CartaoDeIndicador } from '../metricas/kpi-card';
import { DetalheDaPessoa } from './detalhe-da-pessoa';
import {
  capitalizar,
  diaDosNoventa,
  ESTADO_DA_LINHA_LABEL,
  estadoDaLinha,
  fraseDaLinha,
  indicadores,
  linhaDoTempo,
  motivoDaLigacao,
  pedeLigacaoHoje,
  percentualDosNoventa,
  TOM_DO_ESTADO,
  type EstadoDaLinha,
  type EstadoDoMarco
} from './leitura';

/**
 * Uma linha da fila, com tudo o que a lista e a gaveta precisam já
 * resolvido: a situação vem do seletor; nome, empresa, vaga e a data em que
 * a empresa informou a permanência são resolvidos uma vez aqui, e não a cada
 * célula.
 */
type LinhaDaFila = {
  situacao: ReturnType<typeof getAcompanhamento>[number];
  estado: EstadoDaLinha;
  talent: Talent;
  empresa: string;
  vaga: string;
  empresaInformouEm: string | null;
};

/**
 * Como a gaveta abre: pelo botão Ligar (já no roteiro) ou pelo nome. Também
 * diz para onde o foco volta ao fechar.
 */
type Abertura = { applicationId: string; origem: 'ligar' | 'nome' };

/**
 * A chave de retorno de foco de um botão. A lista existe duas vezes no DOM
 * (cartões no celular, tabela no desktop), então não pode ser um `id`: a
 * gaveta procura pela chave e foca o que estiver visível.
 */
const chaveDeFoco = (abertura: Abertura) =>
  `${abertura.applicationId}:${abertura.origem}`;

/**
 * Acompanhamento de quem foi contratado: a segunda metade do ciclo.
 *
 * A devolutiva de um clique pergunta à empresa "contratou?" — e o RH não
 * volta para dizer se a pessoa ficou (00:05:33). Esta tela é o que o IEL
 * sabe sem depender do RH: a própria pessoa conta, aos 30, 60 e 90 dias, se
 * continua e como está sendo.
 *
 * A analista abre a tela com uma pergunta dupla — "para quem eu ligo hoje, e
 * como estão os que a gente colocou?" — e a tela responde nessa ordem, em
 * dois blocos. Antes havia quatro cartões, abas que misturavam urgência com
 * desfecho e duas colunas para comparar; a analista não compara colunas,
 * ela lê uma frase por pessoa. A ordem continua a do seletor: quem ligar
 * primeiro.
 *
 * Nenhum número sobre a pessoa: "como está sendo" é o que ela disse, com o
 * rótulo escrito. E nada daqui vai para a empresa.
 */
export function AcompanhamentoScreen() {
  const { state } = useIelDemo();
  /*
   * A pessoa aberta e o "aberto" são estados separados: fechar a gaveta
   * mantém a pessoa até a animação terminar e o foco voltar ao botão dela.
   * Desmontar no fechamento pulava as duas coisas.
   */
  const [abertura, setAbertura] = useState<Abertura | null>(null);
  const [gavetaAberta, setGavetaAberta] = useState(false);

  usePageHeader({ breadcrumb: [{ label: 'Acompanhamento' }] });

  const fila = useMemo(() => getAcompanhamento(state), [state]);

  /*
   * A data em que a empresa informou a permanência mora no item da remessa,
   * não na situação. Um índice por candidatura, montado uma vez: sem ele,
   * cada linha varreria todas as remessas registradas.
   */
  const linhas = useMemo<LinhaDaFila[]>(() => {
    const informadoEm = new Map<string, string | null>();
    for (const referral of getRegisteredReferrals(state)) {
      for (const item of referral.items) {
        informadoEm.set(
          item.applicationId,
          lerDevolutiva(item.outcome).retentionAt ?? null
        );
      }
    }
    const resultado: LinhaDaFila[] = [];
    for (const situacao of fila) {
      const application = getApplication(state, situacao.applicationId);
      const talent = application
        ? getTalent(application.talentId, state)
        : null;
      if (!talent) continue;
      resultado.push({
        situacao,
        estado: estadoDaLinha(situacao),
        talent,
        empresa: getCompany(situacao.companyId)?.name ?? situacao.companyId,
        vaga: getJob(situacao.jobId)?.title ?? situacao.jobId,
        empresaInformouEm: informadoEm.get(situacao.applicationId) ?? null
      });
    }
    return resultado;
  }, [state, fila]);

  const totais = useMemo(() => indicadores(fila), [fila]);

  // A fila já vem na ordem de quem ligar primeiro; o bloco só recorta.
  const paraLigar = useMemo(
    () => linhas.filter((linha) => pedeLigacaoHoje(linha.situacao)),
    [linhas]
  );

  const linhaAberta = abertura
    ? linhas.find(
        (linha) => linha.situacao.applicationId === abertura.applicationId
      )
    : undefined;

  const abrir = (applicationId: string, origem: Abertura['origem']) => {
    setAbertura({ applicationId, origem });
    setGavetaAberta(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Acompanhamento</h1>
        <p className="text-sm text-muted-foreground">
          Para quem ligar hoje e como estão as pessoas que foram contratadas.
        </p>
      </div>

      {/*
       * Três cartões, com nome que se entende sem legenda. "Ficaram" só
       * conta quem já teve tempo de ficar (passou dos 90 dias); "Saíram" diz
       * quantas saídas a empresa nunca avisou — o que a segunda fonte trouxe.
       */}
      <div
        data-tour="acompanhamento-indicadores"
        className="grid items-stretch gap-4 sm:grid-cols-3"
      >
        <CartaoDeIndicador
          rotulo="Contratados"
          valor={totais.contratados}
          icone={IconHeartHandshake}
          tom="pessoa"
          rodape="que o IEL acompanha até os 90 dias"
          apoio="Pessoas que a empresa disse ter contratado. O IEL pergunta a cada uma, aos 30, 60 e 90 dias, se continua e como está sendo."
        />
        <CartaoDeIndicador
          rotulo="Ficaram"
          valor={
            totais.passaramDos90 === 0
              ? '—'
              : `${totais.ficaram} de ${totais.passaramDos90}`
          }
          icone={IconUserCheck}
          tom="combina"
          rodape={
            totais.passaramDos90 === 0
              ? 'ninguém passou dos 90 dias ainda'
              : `${plural(totais.passaramDos90, 'já passou', 'já passaram')} dos 90 dias`
          }
          apoio="Só quem já completou 90 dias entra na conta. Vale o que se sabe hoje, pela pessoa ou pela empresa."
        />
        <CartaoDeIndicador
          rotulo="Saíram antes dos 90"
          valor={totais.sairam}
          icone={IconUserX}
          tom={totais.sairam > 0 ? 'difere' : 'neutro'}
          rodape={
            totais.sairam === 0
              ? 'ninguém, pelo que se sabe'
              : totais.sairamSoPelaPessoa === 0
                ? 'a empresa avisou todas'
                : `${totais.sairamSoPelaPessoa} que só a pessoa contou`
          }
          apoio="Saídas antes dos 90 dias, pelo que a pessoa ou a empresa disse. Quando a pessoa conta que saiu e a empresa não avisa, conta como saída."
        />
      </div>

      {/* Primeira pergunta: para quem eu ligo hoje? A lista é o número. */}
      <section
        aria-labelledby="ligar-hoje"
        className="flex flex-col gap-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2
            id="ligar-hoje"
            className="text-base font-medium"
          >
            Ligar hoje
          </h2>
          <span
            data-tour="acompanhamento-privacidade"
            className="flex items-center gap-1 text-xs text-muted-foreground"
          >
            <IconLock
              aria-hidden="true"
              className="size-3"
            />
            O que a pessoa responde nunca vai para a empresa.
          </span>
        </div>
        {paraLigar.length === 0 ? (
          <div className="rounded-lg border p-6">
            <p className="text-sm text-muted-foreground">
              Ninguém para ligar hoje.
            </p>
          </div>
        ) : (
          <ul className="divide-y rounded-lg border">
            {paraLigar.map((linha) => {
              const { situacao, talent } = linha;
              const motivo = motivoDaLigacao(situacao);
              return (
                <li
                  key={situacao.applicationId}
                  className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-sm">
                    <span>
                      <span className="font-medium">{talent.name}</span>
                      <span className="text-muted-foreground">
                        {' '}
                        · {linha.empresa}
                      </span>
                    </span>
                    {motivo ? (
                      <span className="text-muted-foreground">
                        {capitalizar(motivo)}
                      </span>
                    ) : null}
                  </div>
                  <Button
                    size="sm"
                    data-retorno-de-foco={chaveDeFoco({
                      applicationId: situacao.applicationId,
                      origem: 'ligar'
                    })}
                    onClick={() => abrir(situacao.applicationId, 'ligar')}
                  >
                    <IconPhone aria-hidden="true" />
                    Ligar
                    <span className="sr-only"> para {talent.name}</span>
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Segunda pergunta: como estão os que a gente colocou? */}
      <section
        data-tour="acompanhamento-fila"
        aria-labelledby="como-estao"
        className="flex flex-col gap-3"
      >
        <h2
          id="como-estao"
          className="text-base font-medium"
        >
          Como estão os contratados
        </h2>

        {linhas.length === 0 ? (
          <div className="rounded-lg border p-6">
            <p className="text-sm text-muted-foreground">
              Ninguém contratado ainda. A lista começa quando uma empresa
              responder “contratei” a um envio.
            </p>
          </div>
        ) : (
          <>
            {/*
             * No celular a tabela não cabe sem rolagem horizontal: a mesma
             * lista vira cartões empilhados. Só um dos dois é renderizado
             * para o leitor de tela, pelo `hidden`.
             */}
            <ul className="flex flex-col gap-3 md:hidden">
              {linhas.map((linha) => (
                <li
                  key={linha.situacao.applicationId}
                  className="flex flex-col gap-2 rounded-lg border p-4 text-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-col">
                      <BotaoDaPessoa
                        linha={linha}
                        aberta={abertura?.applicationId}
                        onClick={() =>
                          abrir(linha.situacao.applicationId, 'nome')
                        }
                      />
                      <span className="text-xs text-muted-foreground">
                        {linha.empresa} · {linha.vaga}
                      </span>
                    </div>
                    <BadgeDaLinha estado={linha.estado} />
                  </div>
                  <BarraDosNoventa situacao={linha.situacao} />
                  <p className="text-muted-foreground">
                    {fraseDaLinha(linha.situacao)}
                  </p>
                </li>
              ))}
            </ul>

            <div className="hidden rounded-lg border md:block">
              <Table>
                <TableCaption className="sr-only">
                  Pessoas contratadas, na ordem de quem ligar primeiro
                </TableCaption>
                <TableHeader className="bg-muted">
                  <TableRow>
                    <TableHead scope="col">Pessoa</TableHead>
                    <TableHead
                      scope="col"
                      className="w-[12rem]"
                    >
                      Os 90 dias
                    </TableHead>
                    <TableHead scope="col">O que se sabe</TableHead>
                    <TableHead scope="col">Situação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {linhas.map((linha) => (
                    <TableRow key={linha.situacao.applicationId}>
                      <TableCell className="max-w-[28ch] align-top whitespace-normal">
                        <BotaoDaPessoa
                          linha={linha}
                          aberta={abertura?.applicationId}
                          onClick={() =>
                            abrir(linha.situacao.applicationId, 'nome')
                          }
                        />
                        <p className="text-xs text-muted-foreground">
                          {linha.empresa} · {linha.vaga}
                        </p>
                      </TableCell>
                      <TableCell className="align-top">
                        <BarraDosNoventa situacao={linha.situacao} />
                      </TableCell>
                      <TableCell className="max-w-[52ch] align-top whitespace-normal">
                        {fraseDaLinha(linha.situacao)}
                      </TableCell>
                      <TableCell className="align-top">
                        <BadgeDaLinha estado={linha.estado} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </section>

      {linhaAberta && abertura ? (
        <DetalheDaPessoa
          situacao={linhaAberta.situacao}
          talent={linhaAberta.talent}
          empresa={linhaAberta.empresa}
          vaga={linhaAberta.vaga}
          empresaInformouEm={linhaAberta.empresaInformouEm}
          open={gavetaAberta}
          onOpenChange={setGavetaAberta}
          comecarPeloRoteiro={abertura.origem === 'ligar'}
          retornarFocoPara={chaveDeFoco(abertura)}
        />
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Pedaços da lista
 * ------------------------------------------------------------------ */

/** O nome da pessoa, que abre a gaveta no detalhe. */
function BotaoDaPessoa({
  linha,
  aberta,
  onClick
}: {
  linha: LinhaDaFila;
  aberta: string | undefined;
  onClick: () => void;
}) {
  const { situacao, talent } = linha;
  return (
    <Button
      data-retorno-de-foco={chaveDeFoco({
        applicationId: situacao.applicationId,
        origem: 'nome'
      })}
      variant="link"
      // `self-start`: no cartão do celular o botão herda a largura da coluna
      // e centralizaria o nome.
      className="h-auto self-start p-0 text-left font-medium whitespace-normal"
      aria-current={aberta === situacao.applicationId ? 'true' : undefined}
      onClick={onClick}
    >
      {talent.name}
    </Button>
  );
}

/** A palavra do estado, no tom do estado. Nunca só a cor. */
function BadgeDaLinha({ estado }: { estado: EstadoDaLinha }) {
  return (
    <Badge
      variant="outline"
      className={cn('shrink-0', BADGE_DE_ESTADO[TOM_DO_ESTADO[estado]])}
    >
      {ESTADO_DA_LINHA_LABEL[estado]}
    </Badge>
  );
}

/**
 * O ponto de cada marco na barra: respondido em verde, aberto em laranja,
 * perdido em cinza; o que ainda não chegou (ou não se pergunta mais) fica
 * na cor da trilha, vazado.
 */
const TOM_DO_PONTO: Record<EstadoDoMarco, EstadoDeCor | null> = {
  respondido: 'combina',
  aberto: 'atencao',
  perdido: 'neutro',
  futuro: null,
  encerrado: null
};

/**
 * "dia 45 de 90" e uma barra fina com os três pontos (30, 60, 90). A barra é
 * decorativa: a frase acima e a coluna "O que se sabe" já dizem tudo; quem
 * não vê a cor lê a mesma coisa.
 */
function BarraDosNoventa({ situacao }: { situacao: LinhaDaFila['situacao'] }) {
  const marcos = linhaDoTempo(situacao);
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm tabular-nums">{diaDosNoventa(situacao)}</span>
      <div
        aria-hidden="true"
        className="relative h-1 w-full max-w-[10rem] rounded-full bg-muted"
      >
        <div
          className={cn(
            'h-full rounded-full',
            situacao.permanencia.estado === 'saiu'
              ? PREENCHIMENTO_DE_ESTADO.difere
              : 'bg-muted-foreground/40'
          )}
          style={{ width: `${percentualDosNoventa(situacao)}%` }}
        />
        {marcos.map((marco) => {
          const tom = TOM_DO_PONTO[marco.estado];
          return (
            <span
              key={marco.marco}
              className={cn(
                'absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full',
                tom ? PREENCHIMENTO_DE_ESTADO[tom] : 'border bg-background'
              )}
              style={{ left: `${(marco.marco / 90) * 100}%` }}
            />
          );
        })}
      </div>
    </div>
  );
}
