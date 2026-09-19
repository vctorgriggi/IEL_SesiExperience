'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { ADHERENCE_THRESHOLD } from '@/features/iel-demo/analysis/adherence';
import {
  getAderenciaPorSetorEPonto,
  getAderenciaVsPermanencia,
  getEmpresasComMaisReabertura,
  getReaberturasPorMes,
  getTempoPorEtapa,
  PERIODO_LABEL,
  rotuloDoMes,
  simularCorte,
  type AderenciaPorSetorEPonto,
  type EmpresaReabertura,
  type FaixaPermanencia,
  type Kpi,
  type Periodo,
  type ReaberturasPorMes,
  type SimulacaoDeCorte,
  type TempoPorEtapa
} from '@/features/iel-demo/analysis/analytics';
import { Download } from 'lucide-react';

import { cn } from '@workspace/ui/lib/utils';
import { Button } from '@workspace/ui/shadcn/button';
import {
  Card,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@workspace/ui/shadcn/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@workspace/ui/shadcn/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@workspace/ui/shadcn/tooltip';

import { usePageHeader } from '../layout/page-header-context';
import { formatarNumero } from './formato';
import { KpiCard } from './kpi-card';
import { MarcadorHistorico } from './marcador-historico';
import { SeletorPeriodo } from './seletor-periodo';
import { ValorOculto } from './valor-oculto';

const TODOS = 'todos';

/** Limites do simulador de corte. */
const CORTE_MIN = 25;
const CORTE_MAX = 60;

/**
 * O BI olha para trás: permanência, reabertura e tempo de ciclo só existem
 * em vaga encerrada. Em 30 ou 90 dias quase toda faixa fica abaixo de 5
 * pessoas e some; por isso a tela abre em 12 meses, e não no padrão das
 * outras telas.
 */
const PERIODO_DO_BI: Periodo = 'ano';

/**
 * BI: análises com dado agregado.
 *
 * Três perguntas, uma por aba: o "combina com a empresa" prevê quem fica?
 * a reabertura de vagas caiu? onde o tempo da vaga vai embora? Tudo vem do
 * histórico simulado, sem nome nem contato de ninguém, e todo recorte com
 * menos de 5 pessoas sai como "—".
 */
export function BiScreen() {
  const [periodo, setPeriodo] = useState<Periodo>(PERIODO_DO_BI);
  const [setor, setSetor] = useState<string>(TODOS);
  const [corte, setCorte] = useState<number>(ADHERENCE_THRESHOLD);

  const filtros = setor === TODOS ? undefined : { setor };

  const mapa = useMemo(() => getAderenciaPorSetorEPonto(), []);
  const setores = useMemo(
    () => mapa.linhas.map((l) => l.setor).sort((a, b) => a.localeCompare(b)),
    [mapa]
  );

  const faixas = getAderenciaVsPermanencia(periodo, filtros);
  const simulacao = simularCorte(corte);
  const reaberturas = getReaberturasPorMes(filtros);
  const tempo = useMemo(() => getTempoPorEtapa(), []);
  const empresas = getEmpresasComMaisReabertura(Number.MAX_SAFE_INTEGER)
    .filter((e) => !filtros || e.setor === filtros.setor)
    .slice(0, 5);

  const exportar = () =>
    baixarCsv(
      montarCsv({
        periodo,
        setor: filtros?.setor ?? 'Todos',
        faixas,
        simulacao,
        mapa,
        reaberturas,
        empresas,
        tempo
      })
    );

  usePageHeader({
    breadcrumb: [{ label: 'BI' }],
    actions: (
      <Button
        size="sm"
        variant="outline"
        onClick={exportar}
      >
        <Download />
        Exportar sem dados pessoais
      </Button>
    )
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight">BI</h1>
          <p className="text-sm text-muted-foreground">
            Análises com dado agregado
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SeletorPeriodo
            value={periodo}
            onChange={setPeriodo}
          />
          <Select
            value={setor}
            onValueChange={setSetor}
          >
            <SelectTrigger
              size="sm"
              className="w-[200px]"
              aria-label="Setor"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value={TODOS}>Todos os setores</SelectItem>
              {setores.map((nome) => (
                <SelectItem
                  key={nome}
                  value={nome}
                >
                  {nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="match">
        <TabsList>
          <TabsTrigger value="match">Qualidade do match</TabsTrigger>
          <TabsTrigger value="reabertura">Reabertura</TabsTrigger>
          <TabsTrigger value="operacao">Operação</TabsTrigger>
        </TabsList>

        <TabsContent
          value="match"
          className="flex flex-col gap-4 pt-2"
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <AderenciaVsPermanencia
              faixas={faixas}
              periodo={periodo}
            />
            <CalibracaoDoCorte
              corte={corte}
              onCorte={setCorte}
              simulacao={simulacao}
              filtrado={Boolean(filtros)}
            />
          </div>
          <MapaSetorPonto
            mapa={mapa}
            setor={filtros?.setor ?? null}
          />
        </TabsContent>

        <TabsContent
          value="reabertura"
          className="flex flex-col gap-4 pt-2"
        >
          <Reabertura
            dados={reaberturas}
            empresas={empresas}
            setor={filtros?.setor ?? null}
          />
        </TabsContent>

        <TabsContent
          value="operacao"
          className="flex flex-col gap-4 pt-2"
        >
          <TempoDaVaga
            tempo={tempo}
            filtrado={Boolean(filtros)}
          />
        </TabsContent>
      </Tabs>

      <p className="text-xs text-muted-foreground">
        O BI trabalha só com dado agregado. Recortes com menos de 5 pessoas
        ficam ocultos, e a exportação sai sem nome nem contato.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Peças de gráfico
 * ------------------------------------------------------------------ */

/** Título de card com o marcador de histórico simulado. */
function TituloHistorico({ children }: { children: string }) {
  return (
    <CardTitle className="flex items-center gap-1">
      {children}
      <MarcadorHistorico />
    </CardTitle>
  );
}

/** Dica de uma barra: rótulo e números tabulares. */
function Dica({ children, linhas }: { children: ReactNode; linhas: string[] }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent className="flex flex-col gap-0.5 tabular-nums">
        {linhas.map((linha) => (
          <span key={linha}>{linha}</span>
        ))}
      </TooltipContent>
    </Tooltip>
  );
}

/* ------------------------------------------------------------------ *
 * Qualidade do match
 * ------------------------------------------------------------------ */

function leituraDasFaixas(faixas: FaixaPermanencia[]): string {
  const visiveis = faixas.filter((f) => f.permanencia90Pct !== null);
  if (visiveis.length < 2) {
    return 'Poucas contratações apuradas neste recorte para ler a tendência. Tente os últimos 12 meses ou todos os setores.';
  }
  const ultima = faixas[faixas.length - 1];
  const penultima = faixas[faixas.length - 2];
  if (!ultima || !penultima)
    return 'Quanto mais combina na entrada, mais fica.';
  if (ultima.oculto) {
    return `Quanto mais combina na entrada, mais fica, nas faixas com amostra. Acima de 80 há menos de 5 contratados.`;
  }
  if (
    penultima.permanencia90Pct !== null &&
    ultima.permanencia90Pct !== null &&
    ultima.permanencia90Pct <= penultima.permanencia90Pct
  ) {
    return `Quanto mais combina na entrada, mais fica: tendência até 79%; acima disso a amostra é pequena (n=${ultima.n}).`;
  }
  return 'Quanto mais combina na entrada, mais fica.';
}

function AderenciaVsPermanencia({
  faixas,
  periodo
}: {
  faixas: FaixaPermanencia[];
  periodo: Periodo;
}) {
  return (
    <Card className="shadow-xs">
      <CardHeader>
        <TituloHistorico>
          Combina na entrada × quem ficou 90 dias
        </TituloHistorico>
        <CardDescription>
          Permanência em 90 dias por faixa de quanto combinava com a empresa ·{' '}
          {PERIODO_LABEL[periodo].toLowerCase()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className="grid h-56 grid-cols-4 items-end gap-4 border-b"
          role="img"
          aria-label={faixas
            .map(
              (f) =>
                `${f.rotulo}: ${f.permanencia90Pct === null ? 'oculto' : `${f.permanencia90Pct}%`}`
            )
            .join('; ')}
        >
          {faixas.map((faixa) => (
            <div
              key={faixa.faixa}
              className="flex h-full flex-col items-center justify-end gap-1"
            >
              <span className="text-sm font-medium tabular-nums">
                {faixa.permanencia90Pct === null ? (
                  <ValorOculto />
                ) : (
                  `${faixa.permanencia90Pct}%`
                )}
              </span>
              {faixa.permanencia90Pct === null ? null : (
                <Dica
                  linhas={[
                    `Combina ${faixa.rotulo}`,
                    `${faixa.permanencia90Pct}% ficaram 90 dias`,
                    `${formatarNumero(faixa.ficaram ?? 0)} de ${formatarNumero(faixa.apurados)} contratados`
                  ]}
                >
                  <div
                    tabIndex={0}
                    className="w-full max-w-16 rounded-t bg-primary outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    style={{ height: `${faixa.permanencia90Pct * 0.8}%` }}
                  />
                </Dica>
              )}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-4 pt-2 text-center">
          {faixas.map((faixa) => (
            <div
              key={faixa.faixa}
              className="flex flex-col leading-tight"
            >
              <span className="text-sm">{faixa.rotulo}</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                n={faixa.n}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        {leituraDasFaixas(faixas)}
      </CardFooter>
    </Card>
  );
}

function leituraDoCorte(s: SimulacaoDeCorte): string {
  const fora = s.excluidosPct === null ? '—' : `${s.excluidosPct}%`;
  const foraHoje =
    s.excluidosPctNoCorteAtual === null
      ? '—'
      : `${s.excluidosPctNoCorteAtual}%`;
  if (s.corte === ADHERENCE_THRESHOLD) {
    return `Com o corte em ${ADHERENCE_THRESHOLD}, ${fora} ficam de fora. É o corte de hoje: ${s.permanenciaNoCorteAtualPct ?? '—'}% de quem passa dele fica 90 dias.`;
  }
  const base = `Com o corte em ${s.corte}, ${fora} ficam de fora. Em ${ADHERENCE_THRESHOLD}, são ${foraHoje}.`;
  if (s.oculto || s.ganhoPermanenciaPp === null) {
    return `${base} Acima de ${s.corte} sobram menos de 5 contratados: não dá para estimar a permanência.`;
  }
  const ganho = s.ganhoPermanenciaPp;
  if (s.corte < ADHERENCE_THRESHOLD) {
    return ganho >= 0
      ? `${base} Baixar o corte devolve currículo sem piorar a permanência (${ganho > 0 ? '+' : ''}${formatarNumero(ganho)} p.p.).`
      : `${base} Baixar o corte devolve currículo, mas a permanência cai ${formatarNumero(Math.abs(ganho))} p.p.`;
  }
  if (ganho <= 0) {
    return `${base} Subir o corte tira currículo e não melhora a permanência: o ${ADHERENCE_THRESHOLD} se sustenta.`;
  }
  return `${base} Ganho estimado na permanência: ${formatarNumero(ganho)} p.p.`;
}

function CalibracaoDoCorte({
  corte,
  onCorte,
  simulacao,
  filtrado
}: {
  corte: number;
  onCorte: (corte: number) => void;
  simulacao: SimulacaoDeCorte;
  filtrado: boolean;
}) {
  const posicaoAtual =
    (100 * (ADHERENCE_THRESHOLD - CORTE_MIN)) / (CORTE_MAX - CORTE_MIN);

  const barras = [
    {
      rotulo: 'Ficam de fora',
      hoje: simulacao.excluidosPctNoCorteAtual,
      simulado: simulacao.excluidosPct
    },
    {
      rotulo: 'Ficam 90 dias',
      hoje: simulacao.permanenciaNoCorteAtualPct,
      simulado: simulacao.permanenciaNoCorteSimuladoPct
    }
  ];

  return (
    <Card className="shadow-xs">
      <CardHeader>
        <TituloHistorico>Calibração do corte</TituloHistorico>
        <CardDescription>
          Estimativa sobre os envios dos últimos 12 meses
          {filtrado ? ', todos os setores' : ''}. O corte continua sendo decisão
          sua.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <label
              htmlFor="simular-corte"
              className="text-sm text-muted-foreground"
            >
              Simular corte
            </label>
            <span className="text-2xl font-semibold tabular-nums">
              {corte}%
            </span>
          </div>
          <input
            id="simular-corte"
            type="range"
            min={CORTE_MIN}
            max={CORTE_MAX}
            step={1}
            value={corte}
            onChange={(evento) => onCorte(Number(evento.target.value))}
            aria-valuetext={`${corte}%`}
            className="h-2 w-full cursor-pointer accent-[hsl(var(--primary))]"
          />
          <div className="relative h-4 text-xs text-muted-foreground tabular-nums">
            <span className="absolute left-0">{CORTE_MIN}</span>
            <span
              className="absolute -translate-x-1/2 font-medium text-[hsl(var(--brand-accent))]"
              style={{
                left: `calc(${posicaoAtual}% + ${8 - (16 * posicaoAtual) / 100}px)`
              }}
            >
              ▲ {ADHERENCE_THRESHOLD} hoje
            </span>
            <span className="absolute right-0">{CORTE_MAX}</span>
          </div>
        </div>

        <dl className="flex flex-col gap-3">
          {barras.map((barra) => (
            <div
              key={barra.rotulo}
              className="grid grid-cols-[6.5rem_1fr_3rem] items-center gap-x-3 gap-y-1 text-sm"
            >
              <dt className="row-span-2 text-muted-foreground">
                {barra.rotulo}
              </dt>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-muted-foreground"
                  style={{ width: `${barra.hoje ?? 0}%` }}
                />
              </div>
              <dd className="text-right text-xs text-muted-foreground tabular-nums">
                {barra.hoje === null ? '—' : `${barra.hoje}%`}
              </dd>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${barra.simulado ?? 0}%` }}
                />
              </div>
              <dd className="text-right font-medium tabular-nums">
                {barra.simulado === null ? (
                  <ValorOculto />
                ) : (
                  `${barra.simulado}%`
                )}
              </dd>
            </div>
          ))}
        </dl>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-muted-foreground" />
            Em {ADHERENCE_THRESHOLD} (hoje)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-primary" />
            Em {corte} (simulado)
          </span>
        </div>
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        <p aria-live="polite">{leituraDoCorte(simulacao)}</p>
      </CardFooter>
    </Card>
  );
}

/**
 * Cinco degraus do marfim ao azul-noite, misturados em OKLab a partir dos
 * próprios tokens. Os pontos (0, 20, 40, 62, 100%) foram escolhidos para o
 * número da célula passar de 4,5:1 em todos: escuro sobre os três claros
 * (15,6 · 9,8 · 5,7) e marfim sobre os dois escuros (5,4 · 15,6).
 */
const DEGRAUS = [0, 20, 40, 62, 100] as const;

function fundoDoDegrau(degrau: number): string {
  const mistura = DEGRAUS[degrau] ?? 0;
  return `color-mix(in oklab, hsl(var(--primary)) ${mistura}%, hsl(var(--muted)))`;
}

/** Quantos setores o mapa mostra antes de "ver todos". */
const SETORES_VISIVEIS = 8;

function MapaSetorPonto({
  mapa,
  setor
}: {
  mapa: AderenciaPorSetorEPonto;
  setor: string | null;
}) {
  const [todos, setTodos] = useState(false);

  const valores = mapa.linhas.flatMap((l) =>
    l.valores.map((v) => v.media).filter((m): m is number => m !== null)
  );
  const minimo = valores.length ? Math.min(...valores) : 0;
  const maximo = valores.length ? Math.max(...valores) : 100;
  const passo = Math.max(1, (maximo - minimo) / DEGRAUS.length);
  const degrauDe = (valor: number) =>
    Math.min(DEGRAUS.length - 1, Math.floor((valor - minimo) / passo));

  const filtradas = setor
    ? mapa.linhas.filter((l) => l.setor === setor)
    : mapa.linhas;
  const linhas =
    todos || setor ? filtradas : filtradas.slice(0, SETORES_VISIVEIS);

  // Leitura: o setor e o ponto com a menor média, entre os visíveis.
  const mediaDe = (lista: (number | null)[]) => {
    const ok = lista.filter((v): v is number => v !== null);
    return ok.length ? ok.reduce((a, b) => a + b, 0) / ok.length : null;
  };
  const setorMaisBaixo = mapa.linhas
    .filter((l) => !l.oculto)
    .map((l) => ({
      nome: l.setor,
      media: mediaDe(l.valores.map((v) => v.media))
    }))
    .filter((l): l is { nome: string; media: number } => l.media !== null)
    .sort((a, b) => a.media - b.media)[0];
  const pontoMaisBaixo = mapa.pontos
    .map((ponto, indice) => ({
      nome: ponto.rotulo,
      media: mediaDe(
        mapa.linhas
          .filter((l) => !l.oculto)
          .map((l) => l.valores[indice]?.media ?? null)
      )
    }))
    .filter((p): p is { nome: string; media: number } => p.media !== null)
    .sort((a, b) => a.media - b.media)[0];

  const faixasDaLegenda = DEGRAUS.map((_, indice) => {
    const de = Math.round(minimo + indice * passo);
    const ate =
      indice === DEGRAUS.length - 1
        ? maximo
        : Math.round(minimo + (indice + 1) * passo) - 1;
    return `${de}–${ate}`;
  });

  return (
    <Card className="shadow-xs">
      <CardHeader>
        <TituloHistorico>
          Combina por setor e ponto do dia a dia
        </TituloHistorico>
        <CardDescription>
          Média de quanto os currículos enviados combinavam, em cada um dos 5
          pontos do dia a dia · últimos 12 meses
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="overflow-x-auto rounded-lg border">
          <Table className="table-fixed">
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead
                  scope="col"
                  className="w-44"
                >
                  Setor
                </TableHead>
                {mapa.pontos.map((ponto) => (
                  <TableHead
                    key={ponto.id}
                    scope="col"
                    className="h-auto w-28 py-2 text-center text-xs leading-tight whitespace-normal"
                  >
                    {ponto.rotulo}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {linhas.map((linha) => (
                <TableRow
                  key={linha.setor}
                  className="hover:bg-transparent"
                >
                  <TableCell className="truncate">
                    {linha.setor}
                    <span className="ml-1 text-xs text-muted-foreground tabular-nums">
                      n={linha.n}
                    </span>
                  </TableCell>
                  {linha.valores.map((valor) => {
                    if (valor.media === null) {
                      return (
                        <TableCell
                          key={valor.axisId}
                          className="text-center"
                        >
                          <ValorOculto />
                        </TableCell>
                      );
                    }
                    const degrau = degrauDe(valor.media);
                    return (
                      <TableCell
                        key={valor.axisId}
                        className={cn(
                          'border-2 border-card text-center font-medium tabular-nums',
                          degrau >= 3
                            ? 'text-primary-foreground'
                            : 'text-foreground'
                        )}
                        style={{ backgroundColor: fundoDoDegrau(degrau) }}
                      >
                        {valor.media}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div
            className="flex items-center gap-1 text-xs text-muted-foreground tabular-nums"
            aria-label="Legenda do mapa"
          >
            {faixasDaLegenda.map((faixa, indice) => (
              <span
                key={faixa}
                className="flex items-center gap-1 pr-2"
              >
                <span
                  className="size-3 rounded-sm border"
                  style={{ backgroundColor: fundoDoDegrau(indice) }}
                />
                {faixa}
              </span>
            ))}
          </div>
          {!setor && filtradas.length > SETORES_VISIVEIS ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setTodos((valor) => !valor)}
            >
              {todos ? 'Ver menos' : `Ver os ${filtradas.length} setores`}
            </Button>
          ) : null}
        </div>
      </CardContent>
      {setorMaisBaixo && pontoMaisBaixo ? (
        <CardFooter className="text-sm text-muted-foreground">
          {setorMaisBaixo.nome} é o setor que menos combina (média{' '}
          {formatarNumero(Math.round(setorMaisBaixo.media))}), e “
          {pontoMaisBaixo.nome}” é o ponto mais baixo (média{' '}
          {formatarNumero(Math.round(pontoMaisBaixo.media))}).
        </CardFooter>
      ) : null}
    </Card>
  );
}

/* ------------------------------------------------------------------ *
 * Reabertura
 * ------------------------------------------------------------------ */

function kpiHistorico(
  id: string,
  rotulo: string,
  valor: number | null,
  descricao: string
): Kpi {
  return {
    id,
    rotulo,
    valor,
    variacao: null,
    unidade: 'abs',
    variacaoTexto: null,
    fonte: 'historico',
    n: 0,
    descricao
  };
}

function Reabertura({
  dados,
  empresas,
  setor
}: {
  dados: ReaberturasPorMes;
  empresas: EmpresaReabertura[];
  setor: string | null;
}) {
  const fechados = dados.meses.filter((m) => !m.parcial);
  const antes = fechados.filter((m) => !m.aposMindRh);
  const depois = fechados.filter((m) => m.aposMindRh);
  const intervalo = (lista: typeof fechados) =>
    lista.length
      ? `${lista[0]?.rotulo} a ${lista[lista.length - 1]?.rotulo}`
      : 'sem meses fechados';
  const maximo = Math.max(1, ...dados.meses.map((m) => m.reaberturas));
  const variacao = dados.variacaoPct;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          kpi={kpiHistorico(
            'reabertura-antes',
            'Média antes do Mind RH',
            dados.mediaAntes,
            `De ${intervalo(antes)}.`
          )}
          rodape="vagas reabertas por mês"
        />
        <KpiCard
          kpi={kpiHistorico(
            'reabertura-depois',
            'Média com o Mind RH',
            dados.mediaDepois,
            `De ${intervalo(depois)}.`
          )}
          rodape="vagas reabertas por mês"
        />
        <KpiCard
          kpi={kpiHistorico(
            'reabertura-variacao',
            'Variação',
            variacao,
            'Média com o Mind RH contra a média antes, só meses fechados.'
          )}
          valor={
            variacao === null
              ? '—'
              : `${variacao > 0 ? '+' : variacao < 0 ? '−' : ''}${Math.abs(variacao)}%`
          }
          rodape={
            variacao === null
              ? 'Sem base para comparar'
              : variacao < 0
                ? 'menos reabertura por mês'
                : 'mais reabertura por mês'
          }
        />
      </div>

      <Card className="shadow-xs">
        <CardHeader>
          <TituloHistorico>Vagas reabertas por mês</TituloHistorico>
          <CardDescription>
            Últimos 12 meses · {setor ?? 'todos os setores'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid h-56 grid-cols-12 items-end gap-1 border-b pt-6 sm:gap-2">
            {dados.meses.map((mes) => {
              const marco = mes.mes === dados.mesMindRh;
              return (
                <div
                  key={mes.mes}
                  className={cn(
                    'relative flex h-full flex-col items-center justify-end gap-1',
                    marco && 'border-l border-dashed border-foreground/50'
                  )}
                >
                  {marco ? (
                    <span className="absolute -top-6 left-1 text-xs font-medium whitespace-nowrap">
                      Mind RH entra
                    </span>
                  ) : null}
                  <span
                    className={cn(
                      'text-xs tabular-nums',
                      mes.parcial ? 'text-muted-foreground' : 'font-medium'
                    )}
                  >
                    {mes.reaberturas}
                  </span>
                  <Dica
                    linhas={[
                      `${rotuloDoMes(mes.mes)}${mes.parcial ? ' (em curso)' : ''}`,
                      `${mes.reaberturas} ${mes.reaberturas === 1 ? 'vaga reaberta' : 'vagas reabertas'}`
                    ]}
                  >
                    <div
                      tabIndex={0}
                      className={cn(
                        'w-full max-w-10 rounded-t outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
                        mes.aposMindRh ? 'bg-primary' : 'bg-muted-foreground',
                        mes.parcial && 'opacity-35'
                      )}
                      style={{
                        height: `${(80 * mes.reaberturas) / maximo}%`,
                        minHeight: mes.reaberturas > 0 ? 2 : 0
                      }}
                    />
                  </Dica>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-12 gap-1 text-center text-xs text-muted-foreground sm:gap-2">
            {dados.meses.map((mes) => (
              <span
                key={mes.mes}
                className="truncate"
              >
                {mes.rotulo.split('/')[0]}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-muted-foreground" />
              Antes do Mind RH
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-primary" />
              Com o Mind RH
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-primary opacity-35" />
              Mês em curso
            </span>
          </div>
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          Reabertura é a mesma vaga, na mesma empresa, voltando em até 90 dias.
          É o indicador que o IEL escolheu para medir o resultado.
        </CardFooter>
      </Card>

      <Card className="shadow-xs">
        <CardHeader>
          <TituloHistorico>Empresas com mais reabertura</TituloHistorico>
          <CardDescription>
            Últimos 12 meses · {setor ?? 'todos os setores'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead scope="col">Empresa</TableHead>
                  <TableHead scope="col">Setor</TableHead>
                  <TableHead
                    scope="col"
                    className="text-right"
                  >
                    Reabertas
                  </TableHead>
                  <TableHead
                    scope="col"
                    className="text-right"
                  >
                    Vagas encerradas
                  </TableHead>
                  <TableHead
                    scope="col"
                    className="text-right"
                  >
                    Taxa
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {empresas.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground"
                    >
                      Nenhuma vaga reaberta neste setor.
                    </TableCell>
                  </TableRow>
                ) : (
                  empresas.map((empresa) => (
                    <TableRow key={empresa.companyId}>
                      <TableCell className="font-medium">
                        {empresa.empresa}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {empresa.setor}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {empresa.reaberturas}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {empresa.vagas}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {empresa.taxaPct === null ? '—' : `${empresa.taxaPct}%`}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

/* ------------------------------------------------------------------ *
 * Operação
 * ------------------------------------------------------------------ */

function dias(valor: number): string {
  return `${formatarNumero(valor)} ${valor === 1 ? 'dia' : 'dias'}`;
}

function leituraDoTempo(tempo: TempoPorEtapa): string {
  const gargalo = tempo.etapas.find((e) => e.id === tempo.gargalo);
  if (!gargalo) return '';
  const parte =
    gargalo.pct > 50
      ? 'Mais da metade do ciclo'
      : gargalo.pct >= 45
        ? 'Metade do ciclo'
        : `${gargalo.pct}% do ciclo`;
  if (gargalo.id === 'retorno-empresa') {
    return `${parte} é espera pelo retorno da empresa (${dias(gargalo.dias)} de ${dias(tempo.totalDias)}). É o gargalo que o retorno de um toque ataca.`;
  }
  return `${parte} vai em ${gargalo.rotulo.toLowerCase()} (${dias(gargalo.dias)} de ${dias(tempo.totalDias)}).`;
}

function TempoDaVaga({
  tempo,
  filtrado
}: {
  tempo: TempoPorEtapa;
  filtrado: boolean;
}) {
  return (
    <Card className="shadow-xs">
      <CardHeader>
        <TituloHistorico>Onde o tempo da vaga vai embora</TituloHistorico>
        <CardDescription>
          Média de dias por etapa em {formatarNumero(tempo.n)} vagas encerradas
          desde a entrada do Mind RH{filtrado ? ', todos os setores' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex h-8 w-full gap-0.5 overflow-hidden rounded-md">
          {tempo.etapas.map((etapa) => (
            <Dica
              key={etapa.id}
              linhas={[etapa.rotulo, `${dias(etapa.dias)} · ${etapa.pct}%`]}
            >
              <div
                tabIndex={0}
                aria-label={`${etapa.rotulo}: ${dias(etapa.dias)}`}
                className={cn(
                  'h-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
                  etapa.id === tempo.gargalo
                    ? 'bg-[hsl(var(--brand-accent))]'
                    : 'bg-primary'
                )}
                style={{ width: `${etapa.pct}%` }}
              />
            </Dica>
          ))}
        </div>
        <ol className="flex flex-col gap-2">
          {tempo.etapas.map((etapa) => (
            <li
              key={etapa.id}
              className="grid grid-cols-[1fr_auto_3rem] items-center gap-3 text-sm"
            >
              <span className="flex items-center gap-2">
                <span
                  className={cn(
                    'size-2 shrink-0 rounded-full',
                    etapa.id === tempo.gargalo
                      ? 'bg-[hsl(var(--brand-accent))]'
                      : 'bg-primary'
                  )}
                />
                {etapa.rotulo}
              </span>
              <span className="font-medium tabular-nums">
                {dias(etapa.dias)}
              </span>
              <span className="text-right text-muted-foreground tabular-nums">
                {etapa.pct}%
              </span>
            </li>
          ))}
          <li className="grid grid-cols-[1fr_auto_3rem] items-center gap-3 border-t pt-2 text-sm">
            <span className="text-muted-foreground">Ciclo inteiro</span>
            <span className="font-medium tabular-nums">
              {dias(tempo.totalDias)}
            </span>
            <span />
          </li>
        </ol>
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        {leituraDoTempo(tempo)}
      </CardFooter>
    </Card>
  );
}

/* ------------------------------------------------------------------ *
 * Exportação
 * ------------------------------------------------------------------ */

const OCULTO_CSV = 'oculto (menos de 5)';

/**
 * CSV só com rótulo e número: nenhuma linha carrega nome, contato ou id de
 * pessoa, porque nenhum seletor de BI devolve isso. Empresas aparecem pelo
 * nome, que não é dado pessoal. Separador `;` e BOM para abrir direto no
 * Excel em português.
 */
function montarCsv(dados: {
  periodo: Periodo;
  setor: string;
  faixas: FaixaPermanencia[];
  simulacao: SimulacaoDeCorte;
  mapa: AderenciaPorSetorEPonto;
  reaberturas: ReaberturasPorMes;
  empresas: EmpresaReabertura[];
  tempo: TempoPorEtapa;
}): string {
  const linhas: (string | number)[][] = [
    ['Seção', 'Recorte', 'Métrica', 'Valor'],
    ['Filtros', 'Período', '', PERIODO_LABEL[dados.periodo]],
    ['Filtros', 'Setor', '', dados.setor]
  ];
  const valor = (v: number | null) => (v === null ? OCULTO_CSV : v);

  for (const f of dados.faixas) {
    linhas.push([
      'Combina na entrada × ficou 90 dias',
      `Faixa ${f.rotulo}`,
      'Ficaram 90 dias (%)',
      valor(f.permanencia90Pct)
    ]);
    linhas.push([
      'Combina na entrada × ficou 90 dias',
      `Faixa ${f.rotulo}`,
      'Contratados apurados',
      f.oculto ? OCULTO_CSV : f.n
    ]);
  }

  const s = dados.simulacao;
  linhas.push(
    [
      'Calibração do corte',
      `Corte ${s.corte}`,
      'Ficam de fora (%)',
      valor(s.excluidosPct)
    ],
    [
      'Calibração do corte',
      `Corte ${ADHERENCE_THRESHOLD}`,
      'Ficam de fora (%)',
      valor(s.excluidosPctNoCorteAtual)
    ],
    [
      'Calibração do corte',
      `Corte ${s.corte}`,
      'Ganho na permanência (p.p.)',
      valor(s.ganhoPermanenciaPp)
    ]
  );

  for (const linha of dados.mapa.linhas) {
    linha.valores.forEach((v, indice) => {
      linhas.push([
        'Combina por setor e ponto',
        linha.setor,
        dados.mapa.pontos[indice]?.rotulo ?? v.axisId,
        valor(v.media)
      ]);
    });
  }

  for (const mes of dados.reaberturas.meses) {
    linhas.push([
      'Vagas reabertas por mês',
      mes.rotulo + (mes.parcial ? ' (em curso)' : ''),
      'Reabertas',
      mes.reaberturas
    ]);
  }
  linhas.push(
    [
      'Vagas reabertas por mês',
      'Antes do Mind RH',
      'Média mensal',
      valor(dados.reaberturas.mediaAntes)
    ],
    [
      'Vagas reabertas por mês',
      'Com o Mind RH',
      'Média mensal',
      valor(dados.reaberturas.mediaDepois)
    ],
    [
      'Vagas reabertas por mês',
      'Variação',
      '%',
      valor(dados.reaberturas.variacaoPct)
    ]
  );

  for (const e of dados.empresas) {
    linhas.push(
      ['Empresas com mais reabertura', e.empresa, 'Reabertas', e.reaberturas],
      ['Empresas com mais reabertura', e.empresa, 'Taxa (%)', valor(e.taxaPct)]
    );
  }

  for (const etapa of dados.tempo.etapas) {
    linhas.push(['Tempo da vaga', etapa.rotulo, 'Dias (média)', etapa.dias]);
  }

  return linhas
    .map((linha) =>
      linha
        .map((celula) => {
          const texto =
            typeof celula === 'number'
              ? String(celula).replace('.', ',')
              : celula;
          return /[;"\n]/.test(texto)
            ? `"${texto.replace(/"/g, '""')}"`
            : texto;
        })
        .join(';')
    )
    .join('\n');
}

/** Marca de ordem de bytes: o Excel só lê o CSV como UTF-8 com ela. */
const BOM = String.fromCharCode(0xfeff);

function baixarCsv(conteudo: string) {
  const blob = new Blob([BOM + conteudo], {
    type: 'text/csv;charset=utf-8'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'mind-rh-bi-agregado.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
