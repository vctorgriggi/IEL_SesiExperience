'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { ADHERENCE_THRESHOLD } from '@/features/iel-demo/analysis/adherence';
import {
  getAderenciaVsPermanencia,
  getEmpresasComMaisReabertura,
  getLeituraDoCorte,
  getPontoQueMaisSeparaPorSetor,
  getReaberturasPorMes,
  getSetoresDoHistorico,
  getTempoPorEtapa,
  PERIODO_LABEL,
  rotuloDoMes,
  type EmpresaReabertura,
  type FaixaPermanencia,
  type Kpi,
  type LeituraDoCorte,
  type Periodo,
  type PontoQueMaisSepara,
  type ReaberturaMes,
  type ReaberturasPorMes,
  type TempoPorEtapa
} from '@/features/iel-demo/analysis/analytics';
import { Download, History } from 'lucide-react';

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
 * Três perguntas, uma por aba: a reabertura de vagas caiu? o "combina com a
 * empresa" prevê quem fica? onde o tempo da vaga vai embora? A primeira é o
 * critério de sucesso do MVP, por isso abre a tela. Tudo vem do histórico
 * simulado, sem nome nem contato de ninguém, e todo recorte com menos de 5
 * pessoas sai como "—".
 */
export function BiScreen() {
  const [periodo, setPeriodo] = useState<Periodo>(PERIODO_DO_BI);
  const [setor, setSetor] = useState<string>(TODOS);

  const filtros = setor === TODOS ? undefined : { setor };

  const setores = useMemo(() => getSetoresDoHistorico(), []);
  const faixas = getAderenciaVsPermanencia(periodo, filtros);
  const corte = getLeituraDoCorte(periodo, filtros);
  const pontos = getPontoQueMaisSeparaPorSetor(filtros);
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
        corte,
        pontos,
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
      <div className="flex flex-col gap-4">
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
        <div
          role="note"
          className="flex items-start gap-2 rounded-lg border bg-muted/40 px-4 py-3 text-sm"
        >
          <History className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <p>
            Dados simulados: mostram o que o Mind RH passa a medir com o retorno
            de um toque das empresas.
          </p>
        </div>
      </div>

      <Tabs defaultValue="reabertura">
        <TabsList>
          <TabsTrigger value="reabertura">Reabertura</TabsTrigger>
          <TabsTrigger value="match">Qualidade do match</TabsTrigger>
          <TabsTrigger value="operacao">Operação</TabsTrigger>
        </TabsList>

        <TabsContent
          value="reabertura"
          className="flex flex-col gap-4 pt-2"
        >
          <Reabertura
            dados={reaberturas}
            setor={filtros?.setor ?? null}
          />
        </TabsContent>

        <TabsContent
          value="match"
          className="flex flex-col gap-4 pt-2"
        >
          <OCorteNumaFrase
            leitura={corte}
            periodo={periodo}
            setor={filtros?.setor ?? null}
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <AderenciaVsPermanencia
              faixas={faixas}
              periodo={periodo}
              setor={filtros?.setor ?? null}
            />
            <PontoQueMaisPesa
              pontos={pontos}
              setor={filtros?.setor ?? null}
            />
          </div>
        </TabsContent>

        <TabsContent
          value="operacao"
          className="flex flex-col gap-4 pt-2"
        >
          <TempoDaVaga
            tempo={tempo}
            filtrado={Boolean(filtros)}
          />
          <EmpresasComMaisReabertura
            empresas={empresas}
            setor={filtros?.setor ?? null}
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

/** "Últimos 12 meses · Frigorífico" ou "· todos os setores". */
function recorte(setor: string | null, periodo = 'últimos 12 meses'): string {
  return `${periodo} · ${setor ?? 'todos os setores'}`;
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

/** Altura útil das barras, em % da coluna: o resto é o rótulo do valor. */
const ALTURA_UTIL = 80;

function Reabertura({
  dados,
  setor
}: {
  dados: ReaberturasPorMes;
  setor: string | null;
}) {
  const fechados = dados.meses.filter((m) => !m.parcial);
  const antes = fechados.filter((m) => !m.aposMindRh);
  const depois = fechados.filter((m) => m.aposMindRh);
  const intervalo = (lista: ReaberturaMes[]) =>
    lista.length
      ? `${lista[0]?.rotulo} a ${lista[lista.length - 1]?.rotulo}`
      : 'sem meses fechados';
  const soma = (lista: ReaberturaMes[], campo: 'reaberturas' | 'vagas') =>
    lista.reduce((t, m) => t + m[campo], 0);
  const base = (lista: ReaberturaMes[]) =>
    `${intervalo(lista)}: ${soma(lista, 'reaberturas')} reaberturas em ${soma(lista, 'vagas')} vagas.`;
  const variacao = dados.variacaoPct;
  const taxa = (valor: number | null) =>
    valor === null ? '—' : formatarNumero(valor);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          kpi={kpiHistorico(
            'reabertura-antes',
            'Antes do Mind RH',
            dados.taxaAntes,
            `De ${base(antes)}`
          )}
          valor={taxa(dados.taxaAntes)}
          rodape="reaberturas a cada 100 vagas"
        />
        <KpiCard
          kpi={kpiHistorico(
            'reabertura-depois',
            'Com o Mind RH',
            dados.taxaDepois,
            `De ${base(depois)}`
          )}
          valor={taxa(dados.taxaDepois)}
          rodape="reaberturas a cada 100 vagas"
        />
        <KpiCard
          kpi={kpiHistorico(
            'reabertura-variacao',
            'Variação',
            variacao,
            'Taxa com o Mind RH contra a taxa antes, só meses fechados.'
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
                ? 'menos reabertura a cada 100 vagas'
                : 'mais reabertura a cada 100 vagas'
          }
        />
      </div>

      <GraficoDeReabertura
        dados={dados}
        setor={setor}
      />
    </>
  );
}

function GraficoDeReabertura({
  dados,
  setor
}: {
  dados: ReaberturasPorMes;
  setor: string | null;
}) {
  const maximo = Math.max(
    1,
    ...dados.meses.map((m) => m.taxaPor100 ?? 0),
    ...dados.meses.map((m) => m.mediaMovel3 ?? 0)
  );
  const colunas = dados.meses.length;
  const altura = (valor: number) => (ALTURA_UTIL * valor) / maximo;

  // A linha da média móvel: centro de cada coluna, no mesmo eixo das barras.
  const pontosDaLinha = dados.meses
    .map((mes, indice) =>
      mes.mediaMovel3 === null
        ? null
        : {
            x: ((indice + 0.5) / colunas) * 100,
            y: 100 - altura(mes.mediaMovel3),
            mes
          }
    )
    .filter((p): p is { x: number; y: number; mes: ReaberturaMes } =>
      Boolean(p)
    );

  const descricaoAcessivel = dados.meses
    .map(
      (m) =>
        `${m.rotulo}${m.parcial ? ' (em curso)' : ''}: ${m.taxaPor100 === null ? 'sem vagas' : formatarNumero(m.taxaPor100)}${m.mediaMovel3 === null ? '' : `, média de 3 meses ${formatarNumero(m.mediaMovel3)}`}`
    )
    .join('; ');

  return (
    <Card className="shadow-xs">
      <CardHeader>
        <TituloHistorico>Reabertura a cada 100 vagas</TituloHistorico>
        <CardDescription>
          Vagas reabertas no mês a cada 100 vagas abertas no mesmo mês ·{' '}
          {recorte(setor)}. Sempre 12 meses, qualquer que seja o período.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="pt-6">
          <div
            className="relative h-56 border-b"
            role="img"
            aria-label={descricaoAcessivel}
          >
            <div className="grid h-full grid-cols-12">
              {dados.meses.map((mes) => {
                const marco = mes.mes === dados.mesMindRh;
                const valor = mes.taxaPor100;
                return (
                  <div
                    key={mes.mes}
                    className={cn(
                      'relative flex h-full flex-col items-center justify-end gap-1 px-0.5 sm:px-1',
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
                        'relative z-10 hidden rounded-sm bg-card/85 px-0.5 text-xs tabular-nums sm:block',
                        mes.parcial ? 'text-muted-foreground' : 'font-medium'
                      )}
                    >
                      {valor === null ? '—' : formatarNumero(valor)}
                    </span>
                    <Dica
                      linhas={[
                        `${rotuloDoMes(mes.mes)}${mes.parcial ? ' (em curso)' : ''}`,
                        valor === null
                          ? 'Nenhuma vaga aberta no mês'
                          : `${formatarNumero(valor)} a cada 100 vagas`,
                        `${mes.reaberturas} ${mes.reaberturas === 1 ? 'reabertura' : 'reaberturas'} em ${mes.vagas} ${mes.vagas === 1 ? 'vaga' : 'vagas'}`,
                        ...(mes.mediaMovel3 === null
                          ? []
                          : [
                              `Média de 3 meses: ${formatarNumero(mes.mediaMovel3)}`
                            ])
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
                          height: `${altura(valor ?? 0)}%`,
                          minHeight: valor ? 2 : 0
                        }}
                      />
                    </Dica>
                  </div>
                );
              })}
            </div>
            <svg
              className="pointer-events-none absolute inset-0 size-full overflow-visible"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden
            >
              <polyline
                points={pontosDaLinha.map((p) => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke="hsl(var(--brand-accent))"
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            {pontosDaLinha.map((p) => (
              <span
                key={p.mes.mes}
                aria-hidden
                className="pointer-events-none absolute size-2 -translate-x-1/2 translate-y-1/2 rounded-full border-2 border-card bg-[hsl(var(--brand-accent))]"
                style={{ left: `${p.x}%`, bottom: `${100 - p.y}%` }}
              />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-12 text-center text-xs text-muted-foreground">
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
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded-full bg-[hsl(var(--brand-accent))]" />
            Média dos últimos 3 meses
          </span>
        </div>
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        Reabertura é a mesma vaga, na mesma empresa, voltando em até 90 dias. É
        o indicador que o IEL escolheu para medir o resultado; em taxa, mês com
        menos vagas não parece melhor do que é.
      </CardFooter>
    </Card>
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
  const sobe = visiveis.every(
    (f, i) =>
      i === 0 ||
      (f.permanencia90Pct ?? 0) >= (visiveis[i - 1]?.permanencia90Pct ?? 0)
  );
  return sobe
    ? 'Quanto mais combina na entrada, mais fica.'
    : 'Neste recorte a permanência não sobe junto com o quanto combinava. Vale olhar com mais meses ou todos os setores.';
}

function AderenciaVsPermanencia({
  faixas,
  periodo,
  setor
}: {
  faixas: FaixaPermanencia[];
  periodo: Periodo;
  setor: string | null;
}) {
  return (
    <Card className="shadow-xs">
      <CardHeader>
        <TituloHistorico>
          Combina na entrada × quem ficou 90 dias
        </TituloHistorico>
        <CardDescription>
          Permanência em 90 dias por faixa de quanto combinava com a empresa ·{' '}
          {recorte(setor, PERIODO_LABEL[periodo].toLowerCase())}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-end">
        <div
          className="grid h-64 items-end gap-6 border-b px-4"
          style={{ gridTemplateColumns: `repeat(${faixas.length}, 1fr)` }}
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
                    className="w-full max-w-20 rounded-t bg-primary outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    style={{ height: `${faixa.permanencia90Pct * 0.8}%` }}
                  />
                </Dica>
              )}
            </div>
          ))}
        </div>
        <div
          className="grid gap-6 px-4 pt-2 text-center"
          style={{ gridTemplateColumns: `repeat(${faixas.length}, 1fr)` }}
        >
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

function fraseDoCorte(leitura: LeituraDoCorte): string {
  const fora =
    leitura.deFora === null
      ? `O corte de ${leitura.corte}% separa quem combina pouco.`
      : `O corte de ${leitura.corte}% deixa de fora ${leitura.deFora}% dos currículos.`;
  if (leitura.razao === null) {
    return `${fora} Quem passa dele tende a ficar mais aos 90 dias, mas neste recorte um dos lados tem menos de 5 contratados para comparar.`;
  }
  return `${fora} Quem passa dele fica ${formatarNumero(leitura.razao)}× mais aos 90 dias do que quem não passa.`;
}

function OCorteNumaFrase({
  leitura,
  periodo,
  setor
}: {
  leitura: LeituraDoCorte;
  periodo: Periodo;
  setor: string | null;
}) {
  const lados =
    leitura.permanenciaAcimaPct === null ||
    leitura.permanenciaAbaixoPct === null
      ? null
      : `${leitura.permanenciaAcimaPct}% contra ${leitura.permanenciaAbaixoPct}% ficaram 90 dias (n=${leitura.nAcima} e n=${leitura.nAbaixo}).`;
  return (
    <Card className="shadow-xs">
      <CardHeader>
        <TituloHistorico>{`O corte de ${ADHERENCE_THRESHOLD}%`}</TituloHistorico>
        <CardDescription>
          {recorte(setor, PERIODO_LABEL[periodo].toLowerCase())}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <p className="text-base leading-relaxed">{fraseDoCorte(leitura)}</p>
        {lados ? (
          <p className="text-xs text-muted-foreground tabular-nums">{lados}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

/** Quantos setores a lista mostra antes de "ver todos". */
const SETORES_VISIVEIS = 8;

function PontoQueMaisPesa({
  pontos,
  setor
}: {
  pontos: PontoQueMaisSepara[];
  setor: string | null;
}) {
  const [todos, setTodos] = useState(false);
  // Os setores ocultos (menos de 5 contratados) só aparecem em "ver todos":
  // uma lista de traços no alto do card não diz nada à analista.
  const comLeitura = pontos.filter((p) => !p.oculto);
  const linhas = todos ? pontos : comLeitura.slice(0, SETORES_VISIVEIS);
  const ocultos = pontos.length - comLeitura.length;

  return (
    <Card className="shadow-xs">
      <CardHeader>
        <TituloHistorico>O ponto que mais pesa, por setor</TituloHistorico>
        <CardDescription>
          Onde quem ficou 90 dias mais se diferencia de quem saiu ·{' '}
          {recorte(setor)}. Sempre 12 meses, qualquer que seja o período.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {linhas.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {pontos.length === 0
              ? 'Nenhuma contratação apurada neste setor nos últimos 12 meses.'
              : 'Menos de 5 contratados apurados neste recorte: o ponto fica oculto para proteger quem foi contratado.'}
          </p>
        ) : (
          <ul className="flex flex-col divide-y text-sm">
            {linhas.map((linha) => (
              <li
                key={linha.setor}
                className="py-2 first:pt-0 last:pb-0"
              >
                <LinhaDoPonto linha={linha} />
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            Use na ligação com a empresa: é a pergunta que mais separa quem
            fica.
            {ocultos > 0 && !todos && comLeitura.length > 0
              ? ` ${ocultos} ${ocultos === 1 ? 'setor tem' : 'setores têm'} menos de 5 contratados apurados e não ${ocultos === 1 ? 'aparece' : 'aparecem'} aqui.`
              : ''}
          </p>
          {pontos.length > linhas.length || todos ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setTodos((valor) => !valor)}
            >
              {todos ? 'Ver menos' : `Ver os ${pontos.length} setores`}
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function LinhaDoPonto({ linha }: { linha: PontoQueMaisSepara }) {
  if (linha.oculto) {
    return (
      <span className="text-muted-foreground">
        <span className="font-medium text-foreground">{linha.setor}</span> ·{' '}
        <ValorOculto /> · menos de 5 contratados apurados
      </span>
    );
  }
  if (linha.ponto === null || linha.diferencaPp === null) {
    return (
      <span className="text-muted-foreground">
        <span className="font-medium text-foreground">{linha.setor}</span> ·
        todos ficaram (ou todos saíram): sem comparação
      </span>
    );
  }
  if (linha.diferencaPp <= 0) {
    return (
      <span>
        <span className="font-medium">{linha.setor}</span> ·{' '}
        <span className="text-muted-foreground">
          nenhum ponto separa quem ficou de quem saiu
        </span>
      </span>
    );
  }
  return (
    <span>
      <span className="font-medium">{linha.setor}</span> · {linha.ponto} ·{' '}
      <span className="text-muted-foreground">
        quem ficou combinava{' '}
        <span className="font-medium text-foreground tabular-nums">
          {linha.diferencaPp} p.p.
        </span>{' '}
        a mais
      </span>
    </span>
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
          desde a entrada do Mind RH · todos os setores
          {filtrado ? ' (o filtro de setor não se aplica aqui)' : ''}
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

function EmpresasComMaisReabertura({
  empresas,
  setor
}: {
  empresas: EmpresaReabertura[];
  setor: string | null;
}) {
  return (
    <Card className="shadow-xs">
      <CardHeader>
        <TituloHistorico>Empresas com mais reabertura</TituloHistorico>
        <CardDescription>
          {recorte(setor)}. Sempre 12 meses, qualquer que seja o período.
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
  corte: LeituraDoCorte;
  pontos: PontoQueMaisSepara[];
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

  const r = dados.reaberturas;
  for (const mes of r.meses) {
    const rotulo = mes.rotulo + (mes.parcial ? ' (em curso)' : '');
    linhas.push(
      ['Reabertura a cada 100 vagas', rotulo, 'Reabertas', mes.reaberturas],
      ['Reabertura a cada 100 vagas', rotulo, 'Vagas abertas', mes.vagas],
      [
        'Reabertura a cada 100 vagas',
        rotulo,
        'Taxa a cada 100',
        mes.taxaPor100 ?? '—'
      ],
      [
        'Reabertura a cada 100 vagas',
        rotulo,
        'Média móvel de 3 meses',
        mes.mediaMovel3 ?? '—'
      ]
    );
  }
  linhas.push(
    [
      'Reabertura a cada 100 vagas',
      'Antes do Mind RH',
      'Taxa a cada 100',
      r.taxaAntes ?? '—'
    ],
    [
      'Reabertura a cada 100 vagas',
      'Com o Mind RH',
      'Taxa a cada 100',
      r.taxaDepois ?? '—'
    ],
    ['Reabertura a cada 100 vagas', 'Variação', '%', r.variacaoPct ?? '—']
  );

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

  const c = dados.corte;
  linhas.push(
    [
      `O corte de ${c.corte}%`,
      'Questionários respondidos',
      'Abaixo do corte (%)',
      c.deFora ?? '—'
    ],
    [
      `O corte de ${c.corte}%`,
      'Passa do corte',
      'Ficaram 90 dias (%)',
      valor(c.permanenciaAcimaPct)
    ],
    [
      `O corte de ${c.corte}%`,
      'Não passa do corte',
      'Ficaram 90 dias (%)',
      valor(c.permanenciaAbaixoPct)
    ],
    [`O corte de ${c.corte}%`, 'Razão', 'vezes', valor(c.razao)]
  );

  for (const p of dados.pontos) {
    linhas.push([
      'O ponto que mais pesa, por setor',
      p.setor,
      p.oculto ? OCULTO_CSV : (p.ponto ?? 'sem comparação'),
      p.diferencaPp === null ? '—' : `${p.diferencaPp} p.p.`
    ]);
  }

  for (const etapa of dados.tempo.etapas) {
    linhas.push(['Tempo da vaga', etapa.rotulo, 'Dias (média)', etapa.dias]);
  }

  for (const e of dados.empresas) {
    linhas.push(
      ['Empresas com mais reabertura', e.empresa, 'Reabertas', e.reaberturas],
      ['Empresas com mais reabertura', e.empresa, 'Taxa (%)', valor(e.taxaPct)]
    );
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
