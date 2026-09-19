'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CANAL_LABEL,
  getCandidatosKpis,
  getFunilDaComunicacao,
  getOndeOCandidatoPara,
  type CanalComunicacao,
  type FiltrosCandidatos,
  type Periodo,
  type PontoDeAbandono
} from '@/features/iel-demo/analysis/analytics';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import { getVisibleJobs } from '@/features/iel-demo/state/selectors';
import {
  ArrowRight,
  ClipboardCheck,
  EyeOff,
  FileLock2,
  MailOpen,
  ShieldCheck,
  Timer,
  UserCheck
} from 'lucide-react';

import { routes } from '@workspace/routes';
import { cn } from '@workspace/ui/lib/utils';
import { Button } from '@workspace/ui/shadcn/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@workspace/ui/shadcn/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@workspace/ui/shadcn/select';
import { Tabs, TabsList, TabsTrigger } from '@workspace/ui/shadcn/tabs';

import { usePageHeader } from '../layout/page-header-context';
import { LADO, PREENCHIMENTO_CLARO, PREENCHIMENTO_DE_ESTADO } from './cores';
import { formatarNumero } from './formato';
import { Funil } from './funil';
import { KpiCard } from './kpi-card';
import { PERIODO_PADRAO, SeletorPeriodo } from './seletor-periodo';
import { ValorOculto } from './valor-oculto';

const PREENCHIMENTO_ATENCAO_CLARO = PREENCHIMENTO_CLARO.atencao;

const TODAS = 'todas';
const TODOS = 'todos';

type AbaDoFunil = 'total' | CanalComunicacao;

/**
 * Candidatos: comunicação, questionário e consentimento.
 *
 * Não é a lista de pessoas (essa é Pessoas). A tela responde uma pergunta:
 * "o convite chega, é aberto e o questionário é concluído?". Por isso só há
 * agregados — nenhum nome, nenhum contato — e todo recorte com menos de 5
 * pessoas sai como "—".
 */
export function CandidatosScreen() {
  const { state } = useIelDemo();
  const [periodo, setPeriodo] = useState<Periodo>(PERIODO_PADRAO);
  const [vaga, setVaga] = useState<string>(TODAS);
  const [canal, setCanal] = useState<string>(TODOS);
  const [aba, setAba] = useState<AbaDoFunil>('total');

  usePageHeader({ breadcrumb: [{ label: 'Candidatos' }] });

  const vagas = useMemo(
    () => getVisibleJobs(state).filter((job) => job.stage !== 'encerrada'),
    [state]
  );

  const filtros = useMemo<FiltrosCandidatos>(
    () => ({
      jobId: vaga === TODAS ? undefined : vaga,
      canal: canal === 'email' || canal === 'whatsapp' ? canal : undefined
    }),
    [vaga, canal]
  );

  const kpis = useMemo(
    () => getCandidatosKpis(state, periodo, filtros),
    [state, periodo, filtros]
  );
  const funil = useMemo(
    () => getFunilDaComunicacao(state, periodo, filtros),
    [state, periodo, filtros]
  );
  const abandono = useMemo(
    () => getOndeOCandidatoPara(state, periodo, filtros),
    [state, periodo, filtros]
  );

  // Com filtro de canal, a aba do outro canal não tem o que mostrar.
  const abaValida: AbaDoFunil =
    aba !== 'total' && filtros.canal && aba !== filtros.canal ? 'total' : aba;
  const etapas =
    abaValida === 'total'
      ? funil.total
      : (funil.porCanal.find((c) => c.canal === abaValida)?.etapas ??
        funil.total);

  const celular = kpis.viaCelular.valor;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight">Candidatos</h1>
          <p className="text-sm text-muted-foreground">
            Comunicação, questionário e consentimento
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SeletorPeriodo
            value={periodo}
            onChange={setPeriodo}
          />
          <Select
            value={vaga}
            onValueChange={setVaga}
          >
            <SelectTrigger
              size="sm"
              className="w-[200px]"
              aria-label="Vaga"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value={TODAS}>Todas as vagas</SelectItem>
              {vagas.map((job) => (
                <SelectItem
                  key={job.id}
                  value={job.id}
                >
                  {job.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={canal}
            onValueChange={setCanal}
          >
            <SelectTrigger
              size="sm"
              className="w-[150px]"
              aria-label="Canal"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value={TODOS}>Todos os canais</SelectItem>
              <SelectItem value="email">{CANAL_LABEL.email}</SelectItem>
              <SelectItem value="whatsapp">{CANAL_LABEL.whatsapp}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          kpi={kpis.taxaAbertura}
          icone={MailOpen}
          tom="pessoa"
        />
        <KpiCard
          kpi={kpis.conclusao}
          icone={ClipboardCheck}
          tom="pessoa"
        />
        <KpiCard
          kpi={{ ...kpis.tempoMedioResposta, rotulo: 'Tempo médio' }}
          quedaEBoa
          icone={Timer}
          tom="neutro"
          rodape={
            celular === null
              ? 'Sem aberturas no recorte'
              : `${celular}% pelo celular`
          }
        />
        <KpiCard
          kpi={kpis.consentimentos}
          icone={ShieldCheck}
          tom="combina"
          apoio="Aceite com versão e horário, antes da primeira pergunta."
        />
      </div>

      {/* Os dois cartões com a mesma altura: o funil e a lista de abandono
          ocupam a altura toda, com as linhas distribuídas, e o rodapé de cada
          um fica colado embaixo. */}
      <div className="grid items-stretch gap-4 lg:grid-cols-2">
        <Card className="h-full shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Funil da comunicação
            </CardTitle>
            <CardDescription>
              Do convite enviado ao questionário concluído
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4">
            <Tabs
              value={abaValida}
              onValueChange={(valor) => {
                if (
                  valor === 'total' ||
                  valor === 'email' ||
                  valor === 'whatsapp'
                )
                  setAba(valor);
              }}
            >
              <TabsList>
                <TabsTrigger value="total">Total</TabsTrigger>
                <TabsTrigger
                  value="email"
                  disabled={filtros.canal === 'whatsapp'}
                >
                  {CANAL_LABEL.email}
                </TabsTrigger>
                <TabsTrigger
                  value="whatsapp"
                  disabled={filtros.canal === 'email'}
                >
                  {CANAL_LABEL.whatsapp}
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Funil
              etapas={etapas}
              titulo={`Funil da comunicação, ${
                abaValida === 'total' ? 'total' : CANAL_LABEL[abaValida]
              }`}
            />
          </CardContent>
          <CardFooter className="mt-auto text-sm text-muted-foreground">
            Quem abre e não conclui recebe um lembrete em 24 horas.
          </CardFooter>
        </Card>

        <OndeOCandidatoPara
          oculto={abandono.oculto}
          abertos={abandono.abertos}
          pontos={abandono.pontos}
        />
      </div>

      <Card className="shadow-xs">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Privacidade por padrão
          </CardTitle>
          <CardDescription>
            O que a analista vê de cada candidato
          </CardDescription>
          <CardAction>
            <Button
              asChild
              size="sm"
              variant="outline"
            >
              <Link href={routes.dashboard.iel.talents.index}>
                Ver pessoas
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-4 md:grid-cols-3">
            {PRIVACIDADE.map((item) => (
              <li
                key={item.titulo}
                className="flex gap-3"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-md',
                    LADO.pessoa.fundo,
                    LADO.pessoa.texto
                  )}
                >
                  <item.icone className="size-4" />
                </span>
                <div className="flex flex-col gap-1">
                  <p className="font-medium">{item.titulo}</p>
                  <p className="text-sm text-muted-foreground">{item.texto}</p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

const PRIVACIDADE = [
  {
    icone: EyeOff,
    titulo: 'Mascarado até precisar',
    texto:
      'Nome abreviado e contato oculto. Revelar é uma ação sua e fica registrada.'
  },
  {
    icone: FileLock2,
    titulo: 'Você vê a leitura, não as respostas uma a uma',
    texto:
      'O quanto combina com a empresa e os 5 pontos ficam visíveis. Cada resposta, não.'
  },
  {
    icone: UserCheck,
    titulo: 'Do candidato, sempre',
    texto:
      'Aceite na primeira tela. Ele pode ver o que está registrado, pedir revisão e exclusão.'
  }
] as const;

/** A frase de leitura do ponto com mais abandono. */
function fraseDoAbandono(ponto: PontoDeAbandono): string {
  return ponto.ponto === 'aceite'
    ? 'O aceite concentra o abandono: o texto é candidato a revisão de linguagem.'
    : `A pergunta ${ponto.ponto} concentra o abandono: candidata a revisão de linguagem.`;
}

/**
 * Abandono no aceite e em cada pergunta, sobre quem abriu o convite. A barra
 * é relativa ao maior abandono (os valores são pequenos e, em escala de
 * 0–100, sumiriam); o % escrito ao lado é o real. Tudo é atenção, então
 * tudo é laranja: o ponto com mais abandono no laranja cheio, os outros no
 * laranja claro.
 */
function OndeOCandidatoPara({
  oculto,
  abertos,
  pontos
}: {
  oculto: boolean;
  abertos: number;
  pontos: PontoDeAbandono[];
}) {
  const maior = oculto
    ? null
    : pontos.reduce<PontoDeAbandono | null>(
        (topo, p) => (p.n > 0 && (!topo || p.n > topo.n) ? p : topo),
        null
      );
  const escala = Math.max(1, ...pontos.map((p) => p.pct ?? 0));

  return (
    <Card className="h-full shadow-xs">
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          Onde o candidato para
        </CardTitle>
        <CardDescription>
          {oculto
            ? 'Menos de 5 aberturas neste recorte'
            : `Abandono sobre quem abriu o convite (${formatarNumero(abertos)})`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        {/* A barra é só desenho; o % escrito ao lado é o equivalente. */}
        <ol
          aria-label="Abandono no aceite e em cada pergunta"
          className="flex flex-1 flex-col justify-between gap-3"
        >
          {pontos.map((ponto) => {
            const [titulo, rotulo] = ponto.rotulo.split(' · ');
            const destaque = maior?.ponto === ponto.ponto;
            const largura = ponto.pct === null ? 0 : (100 * ponto.pct) / escala;
            return (
              <li
                key={String(ponto.ponto)}
                className="grid grid-cols-[minmax(0,14rem)_1fr_3rem] items-center gap-3 text-sm"
              >
                <span className="flex min-w-0 flex-col leading-tight">
                  <span className="truncate">{titulo}</span>
                  {rotulo ? (
                    <span className="truncate text-xs text-muted-foreground">
                      {rotulo}
                    </span>
                  ) : null}
                </span>
                <div
                  className="h-3 overflow-hidden rounded-full bg-muted/70"
                  aria-hidden
                >
                  <div
                    className={cn(
                      'h-full rounded-full',
                      destaque
                        ? PREENCHIMENTO_DE_ESTADO.atencao
                        : PREENCHIMENTO_ATENCAO_CLARO
                    )}
                    style={{ width: `${largura}%` }}
                  />
                </div>
                <span
                  className={cn(
                    'text-right tabular-nums',
                    destaque ? 'text-base font-semibold' : 'font-medium'
                  )}
                >
                  {ponto.pct === null ? (
                    <ValorOculto />
                  ) : (
                    <>
                      {ponto.pct}%
                      <span className="sr-only">
                        {' '}
                        de abandono
                        {destaque ? ', o maior do recorte' : ''}
                      </span>
                    </>
                  )}
                </span>
              </li>
            );
          })}
        </ol>
      </CardContent>
      <CardFooter className="mt-auto text-sm text-muted-foreground">
        {maior
          ? fraseDoAbandono(maior)
          : oculto
            ? 'Amplie o período ou tire o filtro de vaga para ver onde o candidato para.'
            : 'Ninguém abandonou o questionário neste recorte.'}
      </CardFooter>
    </Card>
  );
}
