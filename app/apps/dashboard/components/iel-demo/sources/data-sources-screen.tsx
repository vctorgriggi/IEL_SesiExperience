'use client';

import { Fragment, useState, type ReactNode } from 'react';
import {
  getEntregaDeEmail,
  getLogDeSincronizacao,
  getStatusIntegracoes,
  type IntegracaoEstado,
  type IntegracaoId
} from '@/features/iel-demo/analysis/analytics';
import {
  IconAlertCircle,
  IconArrowDown,
  IconArrowRight,
  IconCheck,
  IconChevronRight,
  IconCircleCheck,
  IconCircleDashed,
  IconClock,
  IconLock,
  IconX
} from '@tabler/icons-react';
import type { TablerIcon } from '@tabler/icons-react';

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@workspace/ui/shadcn/table';

import { ImportEntry } from '../import/import-entry';
import { usePageHeader } from '../layout/page-header-context';
import {
  BADGE_DE_ESTADO,
  TEXTO_DE_ESTADO,
  type EstadoDeCor
} from '../metricas/cores';
import { formatarNumero } from '../metricas/formato';
import { MarcadorHistorico } from '../metricas/marcador-historico';

/**
 * Integrações: o que entra, o que sai e o que fica de fora do Mind RH.
 *
 * A tela responde "de onde vem o dado e por onde ele sai?". Em cima, o
 * caminho inteiro em uma linha; embaixo, cada conexão com o seu estado e,
 * ao lado, o detalhe da que estiver aberta. Nenhum sistema externo é
 * consultado na demonstração: os estados e o log vêm do histórico simulado.
 */
export function DataSourcesScreen() {
  const [aberta, setAberta] = useState<IntegracaoId>('empregare');
  const integracoes = getStatusIntegracoes();

  usePageHeader({ breadcrumb: [{ label: 'Integrações' }] });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Integrações</h1>
        <p className="text-sm text-muted-foreground">
          O que entra, o que sai e o que fica de fora do Mind RH
        </p>
      </div>

      <Card
        data-tour="integracoes-fluxo"
        className="shadow-xs"
      >
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Como os dados circulam
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="flex flex-col items-stretch gap-2 lg:flex-row lg:items-center">
            {CIRCUITO.map((etapa, indice) => (
              <Fragment key={etapa.titulo}>
                {indice > 0 ? (
                  <li
                    aria-hidden
                    className="flex justify-center text-muted-foreground"
                  >
                    <IconArrowRight className="hidden size-4 lg:block" />
                    <IconArrowDown className="size-4 lg:hidden" />
                  </li>
                ) : null}
                <li
                  className={cn(
                    'flex flex-1 flex-col gap-0.5 rounded-lg border px-3 py-2',
                    etapa.nosso && 'bg-muted'
                  )}
                >
                  <span className="font-medium">{etapa.titulo}</span>
                  <span className="text-xs text-muted-foreground">
                    {etapa.texto}
                  </span>
                </li>
              </Fragment>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/*
       * As conexões numa linha de três cartões iguais, e o detalhe da que
       * estiver aberta em largura cheia logo abaixo. Com a lista numa coluna
       * estreita ao lado do detalhe, a coluna da lista acabava na metade e
       * deixava um vão do tamanho do log de sincronizações.
       */}
      <section
        aria-labelledby="conexoes-titulo"
        className="flex flex-col gap-3"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2
            id="conexoes-titulo"
            className="text-base font-semibold"
          >
            Conexões{' '}
            <span className="text-sm font-normal text-muted-foreground">
              · Clique para ver o detalhe
            </span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Toda conexão nasce no modo mais restrito. Campo novo só entra se
            alguém do IEL ligar.
          </p>
        </div>
        <div className="grid items-stretch gap-4 md:grid-cols-3">
          {integracoes.map((integracao) => {
            const meta = CONEXAO[integracao.id];
            const ativa = integracao.id === aberta;
            return (
              <button
                key={integracao.id}
                type="button"
                aria-pressed={ativa}
                onClick={() => setAberta(integracao.id)}
                className={cn(
                  'flex h-full w-full items-center gap-3 rounded-xl border bg-card px-4 py-3 text-left shadow-xs outline-none transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50',
                  ativa && 'border-foreground/20 bg-muted'
                )}
              >
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium">{meta.nome}</span>
                    <EstadoBadge estado={integracao.estado} />
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {integracao.detalhe}
                  </span>
                </span>
                <IconChevronRight
                  aria-hidden
                  className="size-4 shrink-0 text-muted-foreground"
                />
              </button>
            );
          })}
        </div>
      </section>

      <div className="flex min-w-0 flex-col gap-4">
        {aberta === 'empregare' ? <DetalheEmpregare /> : null}
        {aberta === 'email' ? <DetalheEmail /> : null}
        {aberta === 'whatsapp' ? <DetalheWhatsapp /> : null}
      </div>
    </div>
  );
}

const CIRCUITO = [
  {
    titulo: 'Empregare',
    texto: 'Vagas, currículos e requisitos',
    nosso: false
  },
  {
    titulo: 'Mind RH',
    texto: 'Combina com a empresa, leitura e painel',
    nosso: true
  },
  {
    titulo: 'E-mail e WhatsApp',
    texto: 'Questionários, lembretes e retorno',
    nosso: false
  },
  {
    titulo: 'Empresas e candidatos',
    texto: 'Respondem por link, sem login',
    nosso: false
  }
] as const;

const CONEXAO: Record<IntegracaoId, { nome: string }> = {
  empregare: { nome: 'Empregare' },
  email: { nome: 'Provedor de e-mail' },
  whatsapp: { nome: 'WhatsApp Business' }
};

const ESTADO: Record<
  IntegracaoEstado,
  { rotulo: string; icone: TablerIcon; tom: EstadoDeCor }
> = {
  ok: { rotulo: 'Conectado', icone: IconCircleCheck, tom: 'combina' },
  atencao: { rotulo: 'Atenção', icone: IconAlertCircle, tom: 'atencao' },
  configurando: { rotulo: 'Em configuração', icone: IconClock, tom: 'neutro' }
};

function EstadoBadge({ estado }: { estado: IntegracaoEstado }) {
  const { rotulo, icone: Icone, tom } = ESTADO[estado];
  return (
    <Badge
      variant="outline"
      className={cn('shrink-0 px-1.5', BADGE_DE_ESTADO[tom])}
    >
      <Icone aria-hidden="true" />
      {rotulo}
    </Badge>
  );
}

/** Rótulo em caixa alta espaçada, a "assinatura" do manual, para subtítulos. */
function Rotulo({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
      {children}
    </h3>
  );
}

/** Pares "rótulo: valor" em duas colunas. */
function Pares({ itens }: { itens: [string, string][] }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
      {itens.map(([rotulo, valor]) => (
        <Fragment key={rotulo}>
          <dt className="text-muted-foreground">{rotulo}</dt>
          <dd>{valor}</dd>
        </Fragment>
      ))}
    </dl>
  );
}

/* ------------------------------------------------------------------ *
 * Empregare
 * ------------------------------------------------------------------ */

const CAMPOS_EMPREGARE: { campo: string; nota?: string; entra: boolean }[] = [
  { campo: 'Vagas e empresa', entra: true },
  { campo: 'Currículo e experiência', entra: true },
  { campo: 'Requisitos da vaga', nota: 'para o match técnico', entra: true },
  {
    campo: 'E-mail e telefone',
    nota: 'só para enviar o questionário, mascarados no painel',
    entra: true
  },
  { campo: 'CPF, RG e documentos', nota: 'desligado por padrão', entra: false },
  {
    campo: 'Foto, idade e endereço completo',
    nota: 'não entram no cálculo',
    entra: false
  }
];

/** Quantas execuções do log aparecem antes de "ver todas". */
const LOG_VISIVEL = 5;

function DetalheEmpregare() {
  const [logCompleto, setLogCompleto] = useState(false);
  const log = getLogDeSincronizacao();
  const visiveis = logCompleto ? log : log.slice(0, LOG_VISIVEL);

  return (
    <>
      <Card
        data-tour="integracoes-campos"
        className="shadow-xs"
      >
        <CardHeader>
          <CardTitle className="text-base font-semibold">Empregare</CardTitle>
          <CardDescription>
            Continua sendo a base de vagas e candidaturas. O Mind RH só lê o que
            precisa para dizer quem combina com a empresa.
          </CardDescription>
        </CardHeader>
        {/* Em largura cheia, a lista do que entra vira duas colunas: numa só,
            ela ficava o dobro da altura do "Como sincroniza" ao lado. */}
        <CardContent className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <div className="flex flex-col gap-3 xl:col-span-2">
            <Rotulo>O que entra</Rotulo>
            <ul className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
              {CAMPOS_EMPREGARE.map((item) => (
                <li
                  key={item.campo}
                  className="flex items-start gap-2 text-sm"
                >
                  {item.entra ? (
                    <IconCheck
                      className={cn(
                        'mt-0.5 size-4 shrink-0',
                        TEXTO_DE_ESTADO.combina
                      )}
                      aria-label="Entra"
                    />
                  ) : (
                    <IconX
                      className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                      aria-label="Fica de fora"
                    />
                  )}
                  <span className="flex flex-col">
                    <span
                      className={cn(!item.entra && 'text-muted-foreground')}
                    >
                      {item.campo}
                    </span>
                    {item.nota ? (
                      <span className="text-xs text-muted-foreground">
                        {item.nota}
                      </span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-3">
            <Rotulo>Como sincroniza</Rotulo>
            <Pares
              itens={[
                ['Frequência', 'Diária, às 06:00'],
                ['Escopo', 'Só vagas ativas'],
                ['Currículo novo', 'Recebe o questionário na hora']
              ]}
            />
            <p className="text-xs text-muted-foreground">
              A sincronização roda sozinha. Se ela falhar, a planilha manual
              logo abaixo resolve o dia.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-xs">
        <CardHeader>
          <CardTitle className="flex items-center gap-1 text-base font-semibold">
            Últimas sincronizações
            <MarcadorHistorico />
          </CardTitle>
          <CardDescription>Uma por dia, às 06:00 (Cuiabá)</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead scope="col">Dia</TableHead>
                  <TableHead
                    scope="col"
                    className="text-right"
                  >
                    Currículos novos
                  </TableHead>
                  <TableHead
                    scope="col"
                    className="text-right"
                  >
                    Vagas novas
                  </TableHead>
                  <TableHead scope="col">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visiveis.map((execucao) => (
                  <TableRow key={execucao.executadaEm}>
                    <TableCell className="tabular-nums">
                      {diaMes(execucao.data)} · {execucao.hora}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatarNumero(execucao.curriculosNovos)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatarNumero(execucao.vagasNovas)}
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      <div className="flex flex-col items-start gap-1">
                        <EstadoBadge
                          estado={
                            execucao.status === 'atencao' ? 'atencao' : 'ok'
                          }
                        />
                        {execucao.observacao ? (
                          <span className="text-xs text-muted-foreground">
                            {execucao.observacao}
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {log.length > LOG_VISIVEL ? (
            <Button
              size="sm"
              variant="ghost"
              className="self-start"
              onClick={() => setLogCompleto((valor) => !valor)}
            >
              {logCompleto ? 'Ver menos' : `Ver as ${log.length}`}
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <ImportEntry />
    </>
  );
}

/** "2026-09-14" → "14/09". */
function diaMes(data: string): string {
  const [, mes, dia] = data.split('-');
  return `${dia}/${mes}`;
}

/* ------------------------------------------------------------------ *
 * E-mail
 * ------------------------------------------------------------------ */

const MENSAGENS_EMAIL = [
  {
    titulo: 'Questionário do candidato',
    quando: 'Quando o currículo chega'
  },
  {
    titulo: 'Consulta à equipe da empresa',
    quando: 'Quando a empresa abre a vaga'
  },
  {
    titulo: 'Lembrete de 24 horas',
    quando: 'Para quem abriu e não concluiu'
  },
  {
    titulo: 'Retorno de um toque',
    quando: 'Para a empresa, depois do envio dos currículos e aos 30 e 90 dias'
  }
] as const;

function DetalheEmail() {
  const entrega = getEntregaDeEmail();
  const numeros = [
    {
      rotulo: 'Entregues',
      pct: entrega.entregaPct,
      apoio: `${formatarNumero(entrega.entregues)} de ${formatarNumero(entrega.enviados)} enviados`
    },
    {
      rotulo: 'Abertos',
      pct: entrega.aberturaPct,
      apoio: `${formatarNumero(entrega.abertos)} dos entregues`
    },
    {
      rotulo: 'Devolvidos',
      pct: entrega.devolvidosPct,
      apoio: `${formatarNumero(entrega.devolvidos)} endereços com erro`
    }
  ];

  return (
    <>
      <Card className="shadow-xs">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Provedor de e-mail
          </CardTitle>
          <CardDescription>
            Todo e-mail sai em nome do IEL · Centro de Empregos, dizendo quem
            envia e para quê. O link é único por pessoa e abre sem login.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-3">
            <Rotulo>Mensagens automáticas</Rotulo>
            <ul className="flex flex-col gap-2">
              {MENSAGENS_EMAIL.map((mensagem) => (
                <li
                  key={mensagem.titulo}
                  className="flex flex-col text-sm"
                >
                  <span>{mensagem.titulo}</span>
                  <span className="text-xs text-muted-foreground">
                    {mensagem.quando}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-3">
            <Rotulo>Configuração</Rotulo>
            <Pares
              itens={[
                ['Remetente', 'IEL · Centro de Empregos'],
                ['Link', 'Único por pessoa, sem login'],
                ['Validade', '2 dias (candidato), 3 dias (equipe)']
              ]}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-xs">
        <CardHeader>
          <CardTitle className="flex items-center gap-1 text-base font-semibold">
            Entrega nos últimos 30 dias
            <MarcadorHistorico />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-3">
            {numeros.map((numero) => (
              <div
                key={numero.rotulo}
                className="flex flex-col gap-0.5"
              >
                <dt className="text-sm text-muted-foreground">
                  {numero.rotulo}
                </dt>
                <dd className="text-2xl font-semibold tabular-nums">
                  {numero.pct === null ? '—' : `${numero.pct}%`}
                </dd>
                <dd className="text-xs text-muted-foreground tabular-nums">
                  {numero.apoio}
                </dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </>
  );
}

/* ------------------------------------------------------------------ *
 * WhatsApp
 * ------------------------------------------------------------------ */

type EstadoPasso = 'feito' | 'andamento' | 'pendente';

const PASSOS_WHATSAPP: {
  titulo: string;
  texto: string;
  estado: EstadoPasso;
}[] = [
  {
    titulo: 'Número verificado',
    texto: 'Conta ligada ao número institucional do Centro de Empregos.',
    estado: 'feito'
  },
  {
    titulo: 'Modelos aprovados: 2 de 4',
    texto:
      'Aprovados o questionário do candidato e o lembrete. Faltam a consulta à equipe e o retorno.',
    estado: 'andamento'
  },
  {
    titulo: 'Autorização do candidato',
    texto:
      'Só recebe quem marcou na candidatura que aceita contato por WhatsApp.',
    estado: 'pendente'
  },
  {
    titulo: 'Envio de teste',
    texto: 'Uma mensagem para um número da equipe antes de liberar para todos.',
    estado: 'pendente'
  }
];

const ICONE_DO_PASSO: Record<EstadoPasso, { icone: TablerIcon; cor: string }> =
  {
    feito: { icone: IconCircleCheck, cor: TEXTO_DE_ESTADO.combina },
    andamento: { icone: IconClock, cor: TEXTO_DE_ESTADO.atencao },
    pendente: { icone: IconCircleDashed, cor: TEXTO_DE_ESTADO.neutro }
  };

const REGRAS_WHATSAPP: {
  regra: string;
  estado: string;
  icone: TablerIcon;
  tom: EstadoDeCor;
}[] = [
  {
    regra: 'Enviar só para quem autorizou',
    estado: 'Sempre ligado',
    icone: IconLock,
    tom: 'combina'
  },
  {
    regra: 'Se não entregar, tentar por e-mail',
    estado: 'Ligado',
    icone: IconCheck,
    tom: 'combina'
  },
  {
    regra: 'Aceitar resposta em áudio',
    estado: 'Próxima fase',
    icone: IconClock,
    tom: 'neutro'
  }
];

function DetalheWhatsapp() {
  return (
    <Card className="shadow-xs">
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          WhatsApp Business
        </CardTitle>
        <CardDescription>
          Pensado para o candidato operacional, que abre WhatsApp e quase nunca
          abre e-mail. As mensagens são as mesmas do e-mail, em versão curta.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <Rotulo>Passo a passo</Rotulo>
          <ol className="flex flex-col gap-3">
            {PASSOS_WHATSAPP.map((passo) => {
              const { icone: Icone, cor } = ICONE_DO_PASSO[passo.estado];
              return (
                <li
                  key={passo.titulo}
                  className="flex items-start gap-2 text-sm"
                >
                  <Icone
                    className={cn('mt-0.5 size-4 shrink-0', cor)}
                    aria-hidden
                  />
                  <span className="flex flex-col">
                    <span>{passo.titulo}</span>
                    <span className="text-xs text-muted-foreground">
                      {passo.texto}
                    </span>
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
        <div className="flex flex-col gap-3">
          <Rotulo>Regras do canal</Rotulo>
          <ul className="flex flex-col gap-2">
            {REGRAS_WHATSAPP.map((item) => (
              <li
                key={item.regra}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span>{item.regra}</span>
                <Badge
                  variant="outline"
                  className={cn('shrink-0 px-1.5', BADGE_DE_ESTADO[item.tom])}
                >
                  <item.icone aria-hidden="true" />
                  {item.estado}
                </Badge>
              </li>
            ))}
          </ul>
          <Pares itens={[['Horário de envio', 'Dias úteis, das 8h às 18h']]} />
        </div>
      </CardContent>
    </Card>
  );
}
