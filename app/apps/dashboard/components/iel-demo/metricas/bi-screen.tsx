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
import {
  Download,
  History,
  Repeat,
  TrendingDown,
  TrendingUp
} from 'lucide-react';

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
import {
  BADGE_DE_ESTADO,
  barraDaAderencia,
  corDaVariacao,
  ESCALA,
  LADO,
  PREENCHIMENTO_CLARO,
  PREENCHIMENTO_DE_ESTADO,
  PREENCHIMENTO_PARCIAL,
  TEXTO_DE_ESTADO,
  TRACO_ATENCAO
} from './cores';
import { formatarNumero } from './formato';
import { KpiCard } from './kpi-card';
import { MarcadorHistorico } from './marcador-historico';
import { SeletorPeriodo } from './seletor-periodo';
import { ValorOculto } from './valor-oculto';

const TODOS = 'todos';

const PREENCHIMENTO_NEUTRO_CLARO = PREENCHIMENTO_CLARO.neutro;
const PREENCHIMENTO_ATENCAO_CLARO = PREENCHIMENTO_CLARO.atencao;
const PREENCHIMENTO_PESSOA_CLARO = PREENCHIMENTO_CLARO.pessoa;

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

/**
 * Item de legenda em pílula: amostra da marca e o nome da série. A amostra é
 * só desenho; o nome é o texto.
 */
function Pilula({
  amostra,
  children
}: {
  amostra: ReactNode;
  children: ReactNode;
}) {
  return (
    <span className="inline-flex h-5 items-center gap-1.5 rounded-full border bg-card px-2 text-xs text-muted-foreground">
      <span
        aria-hidden="true"
        className="flex items-center"
      >
        {amostra}
      </span>
      {children}
    </span>
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
  const estadoDaVariacao = corDaVariacao(variacao, true);
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
          icone={Repeat}
          tom="neutro"
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
          icone={Repeat}
          tom="pessoa"
        />
        <KpiCard
          kpi={kpiHistorico(
            'reabertura-variacao',
            'Variação',
            variacao,
            'Taxa com o Mind RH contra a taxa antes, só meses fechados.'
          )}
          // Aqui cair é bom: menos reabertura é o resultado que o IEL quer.
          quedaEBoa
          icone={variacao !== null && variacao > 0 ? TrendingUp : TrendingDown}
          tom={estadoDaVariacao}
          valor={
            variacao === null ? (
              '—'
            ) : (
              <span className={TEXTO_DE_ESTADO[estadoDaVariacao]}>
                {`${variacao > 0 ? '+' : variacao < 0 ? '−' : ''}${Math.abs(variacao)}%`}
              </span>
            )
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
        <div className="pt-8">
          <div
            className="relative h-56 border-b border-border/60"
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
                      marco &&
                        cn('border-l-2 border-dashed', LADO.empresa.borda)
                    )}
                  >
                    {marco ? (
                      <span
                        className={cn(
                          'absolute -top-7 -left-px rounded-full rounded-bl-none px-2 py-0.5 text-xs font-medium whitespace-nowrap text-white',
                          LADO.empresa.preenchimento
                        )}
                      >
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
                          'w-full max-w-10 rounded-t-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
                          mes.parcial
                            ? PREENCHIMENTO_PARCIAL
                            : mes.aposMindRh
                              ? LADO.pessoa.preenchimento
                              : PREENCHIMENTO_NEUTRO_CLARO
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
                stroke={TRACO_ATENCAO}
                strokeWidth={3}
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            {pontosDaLinha.map((p) => (
              <span
                key={p.mes.mes}
                aria-hidden
                className={cn(
                  'pointer-events-none absolute size-2.5 -translate-x-1/2 translate-y-1/2 rounded-full border-2 border-card',
                  PREENCHIMENTO_DE_ESTADO.atencao
                )}
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
        <div className="flex flex-wrap gap-2 pt-1">
          <Pilula
            amostra={
              <span
                className={cn(
                  'size-2.5 rounded-sm',
                  PREENCHIMENTO_NEUTRO_CLARO
                )}
              />
            }
          >
            Antes do Mind RH
          </Pilula>
          <Pilula
            amostra={
              <span
                className={cn('size-2.5 rounded-sm', LADO.pessoa.preenchimento)}
              />
            }
          >
            Com o Mind RH
          </Pilula>
          <Pilula
            amostra={
              <span
                className={cn('size-2.5 rounded-sm', PREENCHIMENTO_PARCIAL)}
              />
            }
          >
            Mês em curso
          </Pilula>
          <Pilula
            amostra={
              <span
                className={cn(
                  'h-[3px] w-4 rounded-full',
                  PREENCHIMENTO_DE_ESTADO.atencao
                )}
              />
            }
          >
            Média dos últimos 3 meses
          </Pilula>
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

/**
 * A barra de cada faixa na mesma régua do "combina" do resto do produto
 * (abaixo de 35 laranja, 35–59 verde-azulado, 60 ou mais verde), mas só a
 * faixa de cima vai no tom forte: é ela que dá o recado "quem combina mais,
 * fica". As outras ficam no claro do mesmo tom.
 */
const TOM_DA_FAIXA: Record<FaixaPermanencia['faixa'], string> = {
  'abaixo-35': PREENCHIMENTO_ATENCAO_CLARO,
  '35-59': PREENCHIMENTO_PESSOA_CLARO,
  '60-mais': barraDaAderencia(60)
};

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
          className="grid h-64 items-end gap-6 border-b border-border/60 px-4"
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
              <span className="text-2xl font-semibold tabular-nums">
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
                    className={cn(
                      'w-full max-w-20 rounded-t-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
                      TOM_DA_FAIXA[faixa.faixa]
                    )}
                    style={{ height: `${faixa.permanencia90Pct * 0.7}%` }}
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
  const acima = leitura.permanenciaAcimaPct;
  const abaixo = leitura.permanenciaAbaixoPct;
  return (
    <Card className={cn('border-transparent shadow-xs', LADO.pessoa.fundo)}>
      <CardHeader>
        <TituloHistorico>{`O corte de ${ADHERENCE_THRESHOLD}%`}</TituloHistorico>
        <CardDescription>
          {recorte(setor, PERIODO_LABEL[periodo].toLowerCase())}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-lg leading-relaxed font-medium text-balance">
          {fraseDoCorte(leitura)}
        </p>
        {acima === null || abaixo === null ? null : (
          <div className="flex flex-wrap items-center gap-2 text-sm tabular-nums">
            <span
              className={cn(
                'inline-flex items-baseline gap-1.5 rounded-full px-3 py-1',
                BADGE_DE_ESTADO.combina
              )}
            >
              <span className="text-lg font-semibold">{acima}%</span>
              ficaram, entre quem passa (n={leitura.nAcima})
            </span>
            <span
              aria-hidden="true"
              className="text-muted-foreground"
            >
              ×
            </span>
            <span className="sr-only">contra</span>
            <span
              className={cn(
                'inline-flex items-baseline gap-1.5 rounded-full px-3 py-1',
                BADGE_DE_ESTADO.atencao
              )}
            >
              <span className="text-lg font-semibold">{abaixo}%</span>
              entre quem não passa (n={leitura.nAbaixo})
            </span>
          </div>
        )}
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
  const maiorPp = Math.max(1, ...pontos.map((p) => p.diferencaPp ?? 0));

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
                <LinhaDoPonto
                  linha={linha}
                  maiorPp={maiorPp}
                />
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

function LinhaDoPonto({
  linha,
  maiorPp
}: {
  linha: PontoQueMaisSepara;
  /** Maior diferença da lista: a barra é relativa a ela. */
  maiorPp: number;
}) {
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
    <div className="flex flex-col gap-1.5">
      <span>
        <span className="font-medium">{linha.setor}</span> ·{' '}
        <span className="font-semibold">{linha.ponto}</span>
      </span>
      <div className="grid grid-cols-[1fr_4.5rem] items-center gap-3">
        <div
          aria-hidden="true"
          className="h-2 overflow-hidden rounded-full bg-muted/70"
        >
          <div
            className={cn('h-full rounded-full', LADO.pessoa.preenchimento)}
            style={{ width: `${(100 * linha.diferencaPp) / maiorPp}%` }}
          />
        </div>
        <span className="ml-2 text-right font-medium tabular-nums">
          <span aria-hidden="true">+{linha.diferencaPp} p.p.</span>
          <span className="sr-only">
            quem ficou combinava {linha.diferencaPp} p.p. a mais
          </span>
        </span>
      </div>
    </div>
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

/**
 * Tom de cada etapa do tempo da vaga: o gargalo em laranja e as demais em
 * degraus da `ESCALA`, na ordem do ciclo. `texto` é a cor do rótulo dentro
 * do segmento, escolhida pelo contraste (≥ 4,5:1) com o fundo.
 */
function tonsDoTempo(
  tempo: TempoPorEtapa
): Record<string, { fundo: string; texto: string }> {
  // Degraus claros: o laranja do gargalo é a única cor forte da barra.
  const degraus = [0, 1, 2, 1, 0] as const;
  const tons: Record<string, { fundo: string; texto: string }> = {};
  let proximo = 0;
  for (const etapa of tempo.etapas) {
    if (etapa.id === tempo.gargalo) {
      tons[etapa.id] = {
        fundo: PREENCHIMENTO_DE_ESTADO.atencao,
        texto: 'text-foreground'
      };
      continue;
    }
    const degrau = degraus[proximo % degraus.length] ?? 1;
    proximo += 1;
    tons[etapa.id] = {
      fundo: ESCALA[degrau],
      texto: 'text-foreground'
    };
  }
  return tons;
}

function TempoDaVaga({
  tempo,
  filtrado
}: {
  tempo: TempoPorEtapa;
  filtrado: boolean;
}) {
  const tons = tonsDoTempo(tempo);
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
        <div className="flex h-10 w-full gap-0.5 overflow-hidden rounded-lg">
          {tempo.etapas.map((etapa) => (
            <Dica
              key={etapa.id}
              linhas={[etapa.rotulo, `${dias(etapa.dias)} · ${etapa.pct}%`]}
            >
              <div
                tabIndex={0}
                aria-label={`${etapa.rotulo}: ${dias(etapa.dias)}`}
                className={cn(
                  'flex h-full items-center justify-center text-xs font-semibold tabular-nums outline-none first:rounded-l-lg last:rounded-r-lg focus-visible:ring-[3px] focus-visible:ring-ring/50',
                  tons[etapa.id]?.fundo,
                  tons[etapa.id]?.texto
                )}
                style={{ width: `${etapa.pct}%` }}
              >
                {/* Só cabe o rótulo em segmento largo; a lista abaixo tem todos. */}
                {etapa.pct >= 12 ? (
                  <span aria-hidden="true">{dias(etapa.dias)}</span>
                ) : null}
              </div>
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
                  aria-hidden="true"
                  className={cn(
                    'size-3 shrink-0 rounded-sm',
                    tons[etapa.id]?.fundo
                  )}
                />
                {etapa.rotulo}
                {etapa.id === tempo.gargalo ? (
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-medium',
                      BADGE_DE_ESTADO.atencao
                    )}
                  >
                    gargalo
                  </span>
                ) : null}
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
  // A barrinha é relativa à maior taxa da lista; o % escrito é o real.
  // Só a maior taxa vai no laranja cheio; as outras no laranja claro.
  const maiorTaxa = Math.max(1, ...empresas.map((e) => e.taxaPct ?? 0));
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
                    <TableCell className="w-44">
                      <div className="flex items-center justify-end gap-2 tabular-nums">
                        {empresa.taxaPct === null ? null : (
                          <div
                            aria-hidden="true"
                            className="h-2 w-24 overflow-hidden rounded-full bg-muted/70"
                          >
                            <div
                              className={cn(
                                'h-full rounded-full',
                                empresa.taxaPct === maiorTaxa
                                  ? PREENCHIMENTO_DE_ESTADO.atencao
                                  : PREENCHIMENTO_ATENCAO_CLARO
                              )}
                              style={{
                                width: `${(100 * empresa.taxaPct) / maiorTaxa}%`
                              }}
                            />
                          </div>
                        )}
                        <span className="w-10 text-right font-medium">
                          {empresa.taxaPct === null
                            ? '—'
                            : `${empresa.taxaPct}%`}
                        </span>
                      </div>
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
