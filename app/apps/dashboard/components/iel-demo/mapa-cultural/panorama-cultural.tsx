'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { type AdherenceResult } from '@/features/iel-demo/analysis/adherence';
import {
  calcularEncaixeCultural,
  temBaseParaRanquear,
  TIPO_DE_CULTURA_DESCRICAO,
  TIPO_DE_CULTURA_LABEL,
  type ClassificacaoCultural
} from '@/features/iel-demo/analysis/mapa-cultural';
import { ALL_COMPANIES } from '@/features/iel-demo/fixtures';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  getApplicationsByJob,
  getCultureFit,
  getCultureMapPoints,
  getVisibleJobs,
  type CultureMapFilter
} from '@/features/iel-demo/state/selectors';

import { routes } from '@workspace/routes';
import { Alert, cn, FilterNativeSelect } from '@workspace/ui';
import { Badge } from '@workspace/ui/shadcn/badge';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@workspace/ui/shadcn/card';

import { usePageHeader } from '../layout/page-header-context';
import { ListaEntidadesMapa } from './lista-entidades-mapa';
import {
  COR_DA_EMPRESA,
  COR_DO_TALENTO,
  PlanoCultural
} from './plano-cultural';

const FILTROS_TIPO: { value: CultureMapFilter; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'talentos', label: 'Talentos' },
  { value: 'empresas', label: 'Empresas' }
];

const ORDEM_DOS_TIPOS: ClassificacaoCultural[] = [
  'colaborativa',
  'inovadora',
  'estruturada',
  'resultados'
];

/**
 * Quantos talentos ficam em primeiro plano ao redor da empresa de referência.
 * Os demais continuam no mapa, discretos: o recorte ordena a leitura, não
 * elimina candidato — quem ficou de fora segue clicável e listado ao lado.
 */
const TALENTOS_EM_PRIMEIRO_PLANO = 8;

export function PanoramaCultural() {
  const { state, persona } = useIelDemo();
  const [modoVisualizacao, setModoVisualizacao] = useState<
    'empresa-talentos' | 'panorama-geral'
  >('empresa-talentos');

  // Estado do Modo Empresa -> Talentos
  const [empresaIdSelecionada, setEmpresaIdSelecionada] = useState<string>(
    ALL_COMPANIES[0]?.id ?? 'EMP-01'
  );
  const [vagaIdSelecionada, setVagaIdSelecionada] = useState<string>('todas');
  // Abre pelos inscritos: a base inteira de uma vez não é leitura, é poluição.
  const [filtroEscopoTalentos, setFiltroEscopoTalentos] = useState<
    'candidatos-vaga' | 'todos-talentos'
  >('candidatos-vaga');

  // Filtros gerais
  const [filtroTipo, setFiltroTipo] = useState<CultureMapFilter>('todos');
  const [quadranteAtivo, setQuadranteAtivo] =
    useState<ClassificacaoCultural | null>(null);
  const [busca, setBusca] = useState('');
  const [selecionado, setSelecionado] = useState<string | null>(null);

  const iel = routes.dashboard.iel;

  /*
   * O alternador de modo vive no cabeçalho da casca, como nas demais telas:
   * a tela publica o que é seu e a casca desenha a trilha e as ações.
   */
  const alternadorDeModo = (
    <div className="flex items-center rounded-lg border border-border bg-muted/40 p-1">
      <button
        className={cn(
          'rounded-md px-3 py-1.5 text-xs font-semibold transition-all',
          modoVisualizacao === 'empresa-talentos'
            ? 'bg-card text-foreground shadow-xs'
            : 'text-muted-foreground hover:text-foreground'
        )}
        onClick={() => setModoVisualizacao('empresa-talentos')}
        type="button"
      >
        Empresa &amp; Talentos
      </button>
      <button
        className={cn(
          'rounded-md px-3 py-1.5 text-xs font-semibold transition-all',
          modoVisualizacao === 'panorama-geral'
            ? 'bg-card text-foreground shadow-xs'
            : 'text-muted-foreground hover:text-foreground'
        )}
        onClick={() => setModoVisualizacao('panorama-geral')}
        type="button"
      >
        Panorama da Base
      </button>
    </div>
  );

  usePageHeader({
    breadcrumb: [{ label: 'Mapa de cultura' }],
    actions: alternadorDeModo
  });
  const vagas = useMemo(() => getVisibleJobs(state), [state]);

  const vagasDaEmpresa = useMemo(() => {
    return vagas.filter((v) => v.companyId === empresaIdSelecionada);
  }, [vagas, empresaIdSelecionada]);

  const todosPontos = useMemo(
    () => getCultureMapPoints(state, 'todos'),
    [state]
  );

  const pontoEmpresaReferencia = useMemo(() => {
    return (
      todosPontos.find(
        (p) => p.kind === 'empresa' && p.id === empresaIdSelecionada
      ) ?? null
    );
  }, [todosPontos, empresaIdSelecionada]);

  // Talentos candidatos na vaga selecionada
  const idsTalentosCandidatos = useMemo(() => {
    if (vagaIdSelecionada === 'todas') {
      const candidaturas = vagasDaEmpresa.flatMap((vaga) =>
        getApplicationsByJob(state, vaga.id)
      );
      return new Set(candidaturas.map((c) => c.talentId));
    }
    const candidaturas = getApplicationsByJob(state, vagaIdSelecionada);
    return new Set(candidaturas.map((c) => c.talentId));
  }, [state, vagaIdSelecionada, vagasDaEmpresa]);

  /**
   * Aderência de cada talento à cultura da empresa de referência.
   *
   * O ranking existe só aqui dentro, contra uma empresa: ordenar a base inteira
   * por um número seria o "ranking universal de melhores pessoas" que o
   * briefing veda e que a reunião manteve fora.
   */
  const aderenciaPorTalento = useMemo(() => {
    const mapa = new Map<string, AdherenceResult>();
    if (!pontoEmpresaReferencia) return mapa;

    for (const ponto of todosPontos) {
      if (ponto.kind !== 'talento') continue;
      const leitura = getCultureFit(state, ponto.id, pontoEmpresaReferencia.id);
      if (leitura?.aderencia) mapa.set(ponto.id, leitura.aderencia);
    }

    return mapa;
  }, [state, todosPontos, pontoEmpresaReferencia]);

  // Pontos a exibir no modo Empresa vs Talentos
  const pontosModoEmpresa = useMemo(() => {
    if (!pontoEmpresaReferencia) return todosPontos;

    const talentos = todosPontos.filter((p) => {
      if (p.kind !== 'talento') return false;
      if (
        filtroEscopoTalentos === 'candidatos-vaga' &&
        idsTalentosCandidatos.size > 0
      ) {
        return idsTalentosCandidatos.has(p.id);
      }
      return true;
    });

    /*
     * Ordena pela aderência que a tela mostra — ordenar por distância no plano
     * deixaria a lista fora da ordem do número exibido ao lado de cada nome.
     *
     * Empate desempata por quantidade de eixos comparados, e não por nome:
     * 100% sobre 4 eixos e 100% sobre 1 eixo são o mesmo número apoiado em
     * evidência muito diferente. Quem respondeu mais sobe.
     */
    talentos.sort((a, b) => {
      const aderenciaA = aderenciaPorTalento.get(a.id);
      const aderenciaB = aderenciaPorTalento.get(b.id);

      // Sem base suficiente desce para o fim, seja qual for o percentual: 100%
      // sobre um eixo não disputa posição com 70% sobre cinco.
      const baseA = aderenciaA ? temBaseParaRanquear(aderenciaA) : false;
      const baseB = aderenciaB ? temBaseParaRanquear(aderenciaB) : false;
      if (baseA !== baseB) return baseA ? -1 : 1;

      const totalA = aderenciaA?.total ?? -1;
      const totalB = aderenciaB?.total ?? -1;
      if (totalA !== totalB) return totalB - totalA;

      const eixosA = aderenciaA?.coverage.answeredAxes ?? 0;
      const eixosB = aderenciaB?.coverage.answeredAxes ?? 0;
      if (eixosA !== eixosB) return eixosB - eixosA;

      return a.name.localeCompare(b.name, 'pt-BR');
    });

    return [pontoEmpresaReferencia, ...talentos];
  }, [
    aderenciaPorTalento,
    todosPontos,
    pontoEmpresaReferencia,
    filtroEscopoTalentos,
    idsTalentosCandidatos
  ]);

  const basePontos =
    modoVisualizacao === 'empresa-talentos' ? pontosModoEmpresa : todosPontos;

  const pontosFiltradosPorTipo = useMemo(() => {
    if (modoVisualizacao === 'empresa-talentos') return basePontos;
    return getCultureMapPoints(state, filtroTipo);
  }, [state, modoVisualizacao, basePontos, filtroTipo]);

  const pontosExibidos = useMemo(() => {
    return pontosFiltradosPorTipo.filter((ponto) => {
      if (quadranteAtivo && ponto.culture !== quadranteAtivo) return false;
      if (!busca.trim()) return true;
      const termo = busca.trim().toLowerCase();
      return (
        ponto.name.toLowerCase().includes(termo) ||
        ponto.detail?.toLowerCase().includes(termo)
      );
    });
  }, [pontosFiltradosPorTipo, quadranteAtivo, busca]);

  /**
   * Os talentos mais próximos da empresa de referência, que o plano desenha em
   * primeiro plano. Sem empresa de referência não há de onde medir distância,
   * então todos os pontos pesam igual e o recorte fica desligado.
   */
  const idsEmFoco = useMemo(() => {
    if (!pontoEmpresaReferencia) return null;

    const candidatos = pontosExibidos
      .filter((ponto) => ponto.id !== pontoEmpresaReferencia.id)
      .map((ponto) => ({
        id: ponto.id,
        distancia: calcularEncaixeCultural(
          ponto.position,
          pontoEmpresaReferencia.position
        ).distancia
      }))
      .sort((a, b) => a.distancia - b.distancia);

    if (candidatos.length <= TALENTOS_EM_PRIMEIRO_PLANO) return null;

    const foco = new Set(
      candidatos
        .slice(0, TALENTOS_EM_PRIMEIRO_PLANO)
        .map((candidato) => candidato.id)
    );
    foco.add(pontoEmpresaReferencia.id);
    if (selecionado) foco.add(selecionado);

    return foco;
  }, [pontosExibidos, pontoEmpresaReferencia, selecionado]);

  /** Alimenta a contagem ao lado de cada filtro de tipo. */
  const totaisGerais = useMemo(() => {
    const totalTalentos = todosPontos.filter(
      (p) => p.kind === 'talento'
    ).length;
    const totalEmpresas = todosPontos.filter(
      (p) => p.kind === 'empresa'
    ).length;
    return {
      total: todosPontos.length,
      talentos: totalTalentos,
      empresas: totalEmpresas
    };
  }, [todosPontos]);

  const distribuicaoQuadrantes = useMemo(() => {
    const contagem = new Map<ClassificacaoCultural, number>();
    for (const ponto of pontosFiltradosPorTipo) {
      contagem.set(ponto.culture, (contagem.get(ponto.culture) ?? 0) + 1);
    }
    return ORDEM_DOS_TIPOS.map((tipo) => ({
      tipo,
      total: contagem.get(tipo) ?? 0,
      porcentagem:
        pontosFiltradosPorTipo.length > 0
          ? Math.round(
              ((contagem.get(tipo) ?? 0) / pontosFiltradosPorTipo.length) * 100
            )
          : 0
    }));
  }, [pontosFiltradosPorTipo]);

  if (persona.kind === 'gestor') {
    return (
      <Alert variant="warning">
        O panorama cultural reúne a base de talentos do IEL e não é visível para
        o perfil de gestor. A empresa vê o próprio traçado em{' '}
        <Link
          className="underline"
          href={iel.companies.index}
        >
          Contexto da equipe
        </Link>
        .
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Mapeamento de ambiente de trabalho com base nos eixos respondidos. O
        mapa aproxima perfis semelhantes e orienta conexões em escala sem
        descartar ninguém.
      </p>

      {/* Painel Central do Mapa */}
      <Card>
        <CardHeader>
          <CardTitle>
            {modoVisualizacao === 'empresa-talentos'
              ? `Encaixe com ${pontoEmpresaReferencia?.name ?? 'Empresa'}`
              : 'Distribuição dos Perfis'}
          </CardTitle>
          <CardDescription>
            Exibindo{' '}
            <strong className="text-foreground">{pontosExibidos.length}</strong>{' '}
            registros. O plano mostra em que região cada lado descreve o próprio
            ambiente; o percentual de aderência está na lista, ao lado de cada
            nome. O mapa orienta a conversa e não descarta ninguém.
          </CardDescription>
          <CardAction>
            {modoVisualizacao === 'panorama-geral' ? (
              <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-muted/40 p-1">
                {FILTROS_TIPO.map((opcao) => {
                  const count =
                    opcao.value === 'todos'
                      ? totaisGerais.total
                      : opcao.value === 'talentos'
                        ? totaisGerais.talentos
                        : totaisGerais.empresas;
                  const isSelected = filtroTipo === opcao.value;
                  return (
                    <button
                      className={cn(
                        'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all',
                        isSelected
                          ? 'bg-card text-foreground shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                      key={opcao.value}
                      onClick={() => setFiltroTipo(opcao.value)}
                      type="button"
                    >
                      <span>{opcao.label}</span>
                      <span className="rounded-full bg-background/60 px-1.5 py-0.2 text-[10px] text-muted-foreground">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </CardAction>
        </CardHeader>
        <CardContent>
          {/* Barra de Filtros Contextuais (Modo Empresa & Talentos) */}
          {modoVisualizacao === 'empresa-talentos' ? (
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-border/70 bg-muted/20 p-3">
              <div className="min-w-[200px] flex-1">
                <label
                  className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                  htmlFor="seletor-empresa"
                >
                  Empresa de Referência
                </label>
                <FilterNativeSelect
                  aria-label="Selecionar empresa"
                  id="seletor-empresa"
                  onChange={(e) => {
                    setEmpresaIdSelecionada(e.target.value);
                    setVagaIdSelecionada('todas');
                  }}
                  value={empresaIdSelecionada}
                >
                  {ALL_COMPANIES.map((comp) => (
                    <option
                      key={comp.id}
                      value={comp.id}
                    >
                      {comp.name} ({comp.sector})
                    </option>
                  ))}
                </FilterNativeSelect>
              </div>

              {/*
              A vaga só delimita quem conta como inscrito, então só aparece
              junto de "Só Inscritos". Em "Toda a Base" ela ficava visível e
              editável sem mudar nada na tela.
            */}
              {filtroEscopoTalentos === 'candidatos-vaga' ? (
                <div className="min-w-[180px] flex-1">
                  <label
                    className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                    htmlFor="seletor-vaga"
                  >
                    Vaga da Empresa
                  </label>
                  <FilterNativeSelect
                    aria-label="Selecionar vaga"
                    id="seletor-vaga"
                    onChange={(e) => setVagaIdSelecionada(e.target.value)}
                    value={vagaIdSelecionada}
                  >
                    <option value="todas">
                      Todas as vagas ({vagasDaEmpresa.length})
                    </option>
                    {vagasDaEmpresa.map((vaga) => (
                      <option
                        key={vaga.id}
                        value={vaga.id}
                      >
                        {vaga.title}
                      </option>
                    ))}
                  </FilterNativeSelect>
                </div>
              ) : null}

              <div className="flex self-end">
                <div className="flex items-center rounded-lg border border-border bg-card p-1">
                  <button
                    className={cn(
                      'rounded-md px-2.5 py-1 text-xs font-medium transition-all',
                      filtroEscopoTalentos === 'todos-talentos'
                        ? 'bg-muted text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                    onClick={() => setFiltroEscopoTalentos('todos-talentos')}
                    type="button"
                  >
                    Toda a Base
                  </button>
                  <button
                    className={cn(
                      'rounded-md px-2.5 py-1 text-xs font-medium transition-all',
                      filtroEscopoTalentos === 'candidatos-vaga'
                        ? 'bg-muted text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                    onClick={() => setFiltroEscopoTalentos('candidatos-vaga')}
                    type="button"
                  >
                    Só Inscritos
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {/* Grade: Canvas do Mapa + Lista Lateral */}
          <div className="mt-5 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="flex flex-col justify-between space-y-3">
              <PlanoCultural
                aderenciaPorTalento={aderenciaPorTalento}
                focusIds={idsEmFoco}
                highlightQuadrant={quadranteAtivo}
                onSelect={(id) =>
                  setSelecionado((atual) => (atual === id ? null : id))
                }
                points={pontosExibidos}
                referenceId={
                  modoVisualizacao === 'empresa-talentos'
                    ? empresaIdSelecionada
                    : null
                }
                selectedId={selecionado}
                showProximityRings={modoVisualizacao === 'empresa-talentos'}
              />

              {/*
              A legenda fica sempre visível: com duas séries, a identidade não
              pode depender de alguém acertar a cor de cabeça. A forma repete o
              que a cor diz — bolinha para pessoa, quadrado para empresa.
            */}
              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-border/40 pt-2 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span
                    aria-hidden
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: COR_DO_TALENTO }}
                  />
                  Talento
                </span>
                <span className="flex items-center gap-1.5">
                  <span
                    aria-hidden
                    className="size-2.5 rounded-[2px]"
                    style={{ backgroundColor: COR_DA_EMPRESA }}
                  />
                  Empresa
                </span>
                <span className="flex items-center gap-1.5">
                  <span
                    aria-hidden
                    className="size-2.5 rounded-full border-[1.5px]"
                    style={{ borderColor: COR_DA_EMPRESA }}
                  />
                  Voz da equipe (divergência)
                </span>
              </div>
            </div>

            <ListaEntidadesMapa
              aderenciaPorTalento={aderenciaPorTalento}
              busca={busca}
              empresaReferencia={
                modoVisualizacao === 'empresa-talentos'
                  ? pontoEmpresaReferencia
                  : null
              }
              onBuscaChange={setBusca}
              onLimparQuadrante={() => setQuadranteAtivo(null)}
              onSelect={setSelecionado}
              pontos={pontosExibidos}
              quadranteAtivo={quadranteAtivo}
              selecionadoId={selecionado}
              todosPontos={todosPontos}
              /*
              Só há contexto de vaga quando a vaga está escolhida à vista. Com o
              seletor escondido, o link do perfil apontaria para uma vaga que a
              tela não mostra em lugar nenhum.
            */
              vagaContextoId={
                filtroEscopoTalentos === 'candidatos-vaga' &&
                vagaIdSelecionada !== 'todas'
                  ? vagaIdSelecionada
                  : null
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Regiões Culturais com Barras de Distribuição */}
      <Card>
        <CardHeader>
          <CardTitle>O que cada região descreve</CardTitle>
          <CardDescription>
            Os quatro quadrantes descrevem o ambiente de trabalho relatado nos
            eixos. Clique em qualquer região para filtrar o mapa acima.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {distribuicaoQuadrantes.map((entrada) => {
              const isSelected = quadranteAtivo === entrada.tipo;
              return (
                <button
                  className={cn(
                    'flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all',
                    isSelected
                      ? 'border-primary bg-primary/10 ring-1 ring-primary/40 shadow-xs'
                      : 'border-border/80 bg-card hover:border-primary/40 hover:bg-muted/20'
                  )}
                  key={entrada.tipo}
                  onClick={() =>
                    setQuadranteAtivo((atual) =>
                      atual === entrada.tipo ? null : entrada.tipo
                    )
                  }
                  type="button"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-foreground">
                        {TIPO_DE_CULTURA_LABEL[entrada.tipo]}
                      </span>
                      <Badge variant={isSelected ? 'default' : 'outline'}>
                        {entrada.total}
                      </Badge>
                    </div>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
                      {TIPO_DE_CULTURA_DESCRICAO[entrada.tipo]}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-border/40">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                      <span>Proporção na base</span>
                      <span className="font-semibold text-foreground">
                        {entrada.porcentagem}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-300',
                          isSelected ? 'bg-primary' : 'bg-primary/50'
                        )}
                        style={{ width: `${entrada.porcentagem}%` }}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
