'use client';

import { useMemo, useState } from 'react';
import {
  ADHERENCE_THRESHOLD,
  type AdherenceResult
} from '@/features/iel-demo/analysis/adherence';
import {
  calcularPosicaoCultural,
  classificarCultura,
  MINIMO_DE_EIXOS_PARA_RANQUEAR,
  temBaseParaRanquear,
  TIPO_DE_CULTURA_DESCRICAO,
  TIPO_DE_CULTURA_LABEL,
  type ClassificacaoCultural
} from '@/features/iel-demo/analysis/mapa-cultural';
import { plural } from '@/features/iel-demo/format';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  getApplicationsByJob,
  getCompany,
  getCompanyCultureAnswers,
  getCultureFit,
  getCultureMapPoints,
  getJobsByCompany,
  type CultureMapPoint
} from '@/features/iel-demo/state/selectors';
import { ChevronDown } from 'lucide-react';

import { Alert } from '@workspace/ui';
import { cn } from '@workspace/ui/lib/utils';
import { Badge } from '@workspace/ui/shadcn/badge';
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@workspace/ui/shadcn/collapsible';
import { Label } from '@workspace/ui/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@workspace/ui/shadcn/select';
import { Tabs, TabsList, TabsTrigger } from '@workspace/ui/shadcn/tabs';

import { ABAS_SEM_ROLAGEM } from '../shared/abas';
import { ListaEntidadesMapa } from './lista-entidades-mapa';
import {
  COR_DA_EMPRESA,
  COR_DO_TALENTO,
  PlanoCultural
} from './plano-cultural';

/**
 * O mapa de cultura, agora dentro da empresa.
 *
 * Era tela solta no menu, aberta na base inteira com um seletor de empresa
 * dentro dela. Mas o cliente foi explícito — "uma coisa do fit cultural é
 * sobre a cultura da empresa. Não é sobre a vaga" (00:31:38) —, e uma
 * paisagem sem empresa de referência não responde pergunta de ninguém. Aqui
 * a pergunta é concreta e tem dono: **onde esta empresa está e quem na base
 * combina com esta cultura**.
 *
 * O desenho é o mesmo de antes, de propósito: o plano em alvo, a lista
 * ordenada com o piso de evidência e as regiões continuam sendo
 * `plano-cultural`, `lista-entidades-mapa` e `detalhe-ponto-cultural`. O que
 * mudou foi o recorte — a empresa entra por parâmetro, não por seletor.
 */

/**
 * Quantas pessoas ficam em primeiro plano ao redor da empresa. As demais
 * continuam no mapa, discretas: o recorte ordena a leitura, não elimina
 * candidato — quem ficou de fora segue clicável e listado ao lado.
 */
const PESSOAS_EM_PRIMEIRO_PLANO = 8;

const ORDEM_DOS_TIPOS: ClassificacaoCultural[] = [
  'colaborativa',
  'inovadora',
  'estruturada',
  'resultados'
];

type Escopo = 'inscritos' | 'base';

const TODAS_AS_VAGAS = 'todas';

/**
 * Ordena as pessoas pela aderência que a tela mostra.
 *
 * Quem não tem base suficiente desce para o fim, seja qual for o percentual:
 * 100% sobre um tema não disputa posição com 70% sobre dez. Empate desempata
 * por quantidade de temas comparados — o mesmo número apoiado em evidência
 * maior sobe.
 */
function ordenarPorAderencia(
  pessoas: CultureMapPoint[],
  aderencias: Map<string, AdherenceResult>
): CultureMapPoint[] {
  return [...pessoas].sort((a, b) => {
    const aderenciaA = aderencias.get(a.id);
    const aderenciaB = aderencias.get(b.id);

    const baseA = aderenciaA ? temBaseParaRanquear(aderenciaA) : false;
    const baseB = aderenciaB ? temBaseParaRanquear(aderenciaB) : false;
    if (baseA !== baseB) return baseA ? -1 : 1;

    const totalA = aderenciaA?.total ?? -1;
    const totalB = aderenciaB?.total ?? -1;
    if (totalA !== totalB) return totalB - totalA;

    const temasA = aderenciaA?.coverage.answeredAxes ?? 0;
    const temasB = aderenciaB?.coverage.answeredAxes ?? 0;
    if (temasA !== temasB) return temasB - temasA;

    return a.name.localeCompare(b.name, 'pt-BR');
  });
}

export function MapaDaEmpresa({
  companyId,
  vagaInicial
}: {
  companyId: string;
  /** Vaga que já vinha no link, para abrir o escopo nela. */
  vagaInicial?: string | null;
}) {
  const { state } = useIelDemo();
  const company = getCompany(companyId);

  const vagas = useMemo(() => getJobsByCompany(companyId), [companyId]);
  const [escopo, setEscopo] = useState<Escopo>('inscritos');
  const [vagaEscolhida, setVagaEscolhida] = useState<string>(
    vagaInicial && vagas.some((vaga) => vaga.id === vagaInicial)
      ? vagaInicial
      : TODAS_AS_VAGAS
  );
  const [quadranteAtivo, setQuadranteAtivo] =
    useState<ClassificacaoCultural | null>(null);
  const [busca, setBusca] = useState('');
  const [selecionado, setSelecionado] = useState<string | null>(null);

  /*
   * A empresa é montada aqui, e não lida de `getCultureMapPoints`: varrer as
   * 2.500 empresas da carteira para achar uma só seria trabalho jogado fora
   * a cada render. As pessoas, sim, vêm do índice — são 268 e todas entram.
   */
  const pontoDaEmpresa = useMemo((): CultureMapPoint | null => {
    if (!company) return null;
    const respostas = getCompanyCultureAnswers(state, companyId);
    const posicao = calcularPosicaoCultural(respostas.declared);
    if (!posicao) return null;
    return {
      id: company.id,
      name: company.name,
      detail: company.sector,
      kind: 'empresa',
      position: posicao,
      culture: classificarCultura(posicao),
      teamPosition:
        respostas.divergentAxes > 0
          ? calcularPosicaoCultural(respostas.team)
          : null,
      divergentAxes: respostas.divergentAxes
    };
  }, [state, company, companyId]);

  const pessoas = useMemo(
    () => getCultureMapPoints(state, 'talentos'),
    [state]
  );

  /** Quem se inscreveu numa vaga desta empresa, pelo recorte escolhido. */
  const idsInscritos = useMemo(() => {
    const alvo =
      vagaEscolhida === TODAS_AS_VAGAS
        ? vagas
        : vagas.filter((vaga) => vaga.id === vagaEscolhida);
    const inscritos = new Set<string>();
    for (const vaga of alvo) {
      for (const candidatura of getApplicationsByJob(state, vaga.id)) {
        inscritos.add(candidatura.talentId);
      }
    }
    return inscritos;
  }, [state, vagas, vagaEscolhida]);

  /**
   * A aderência de cada pessoa à cultura desta empresa.
   *
   * O ranking existe só aqui dentro, contra uma empresa: ordenar a base por
   * um número solto seria o "ranking universal de melhores pessoas" que o
   * briefing veda e que a reunião manteve fora.
   */
  const aderenciaPorPessoa = useMemo(() => {
    const mapa = new Map<string, AdherenceResult>();
    if (!pontoDaEmpresa) return mapa;
    for (const pessoa of pessoas) {
      const leitura = getCultureFit(state, pessoa.id, companyId);
      if (leitura?.aderencia) mapa.set(pessoa.id, leitura.aderencia);
    }
    return mapa;
  }, [state, pessoas, pontoDaEmpresa, companyId]);

  /*
   * Quem se inscreveu **e** respondeu. O contador da aba conta o que o mapa
   * desenha, não quantas candidaturas existem: a vaga tem 92 inscritos e o
   * mapa mostra 27, porque quem não respondeu não tem posição. Contar 92 e
   * desenhar 27 faria a tela prometer o que ela não mostra.
   */
  const inscritasNoMapa = useMemo(
    () => pessoas.filter((pessoa) => idsInscritos.has(pessoa.id)),
    [pessoas, idsInscritos]
  );

  const pessoasNoEscopo = useMemo(() => {
    const recortadas = escopo === 'inscritos' ? inscritasNoMapa : pessoas;
    return ordenarPorAderencia(recortadas, aderenciaPorPessoa);
  }, [pessoas, escopo, inscritasNoMapa, aderenciaPorPessoa]);

  const pessoasExibidas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return pessoasNoEscopo.filter((pessoa) => {
      if (quadranteAtivo && pessoa.culture !== quadranteAtivo) return false;
      if (termo.length === 0) return true;
      return (
        pessoa.name.toLowerCase().includes(termo) ||
        pessoa.detail?.toLowerCase().includes(termo)
      );
    });
  }, [pessoasNoEscopo, quadranteAtivo, busca]);

  const pontosExibidos = useMemo(
    () => (pontoDaEmpresa ? [pontoDaEmpresa, ...pessoasExibidas] : []),
    [pontoDaEmpresa, pessoasExibidas]
  );

  /** Quem o plano desenha em primeiro plano: as mais próximas da empresa. */
  const idsEmFoco = useMemo(() => {
    if (!pontoDaEmpresa) return null;
    if (pessoasExibidas.length <= PESSOAS_EM_PRIMEIRO_PLANO) return null;
    const foco = new Set(
      pessoasExibidas.slice(0, PESSOAS_EM_PRIMEIRO_PLANO).map((p) => p.id)
    );
    foco.add(pontoDaEmpresa.id);
    if (selecionado) foco.add(selecionado);
    return foco;
  }, [pessoasExibidas, pontoDaEmpresa, selecionado]);

  const regioes = useMemo(() => {
    const contagem = new Map<ClassificacaoCultural, number>();
    for (const pessoa of pessoasNoEscopo) {
      contagem.set(pessoa.culture, (contagem.get(pessoa.culture) ?? 0) + 1);
    }
    return ORDEM_DOS_TIPOS.map((tipo) => ({
      tipo,
      total: contagem.get(tipo) ?? 0,
      porcentagem:
        pessoasNoEscopo.length > 0
          ? Math.round(
              ((contagem.get(tipo) ?? 0) / pessoasNoEscopo.length) * 100
            )
          : 0
    }));
  }, [pessoasNoEscopo]);

  const acimaDoCorte = useMemo(
    () =>
      pessoasNoEscopo.filter(
        (pessoa) => aderenciaPorPessoa.get(pessoa.id)?.compatible === true
      ).length,
    [pessoasNoEscopo, aderenciaPorPessoa]
  );

  if (!company) {
    return (
      <p className="text-sm text-muted-foreground">Empresa não encontrada.</p>
    );
  }

  /*
   * Sem perfil fechado não há de onde medir. A tela diz isso em vez de
   * desenhar um ponto no centro do plano: ausência de resposta não é uma
   * posição, é uma consulta que ainda não sustenta o perfil.
   */
  if (!pontoDaEmpresa) {
    return (
      <Alert variant="warning">
        Esta empresa ainda não tem tema nenhum fechado na consulta à equipe,
        então não há posição a desenhar. O mapa só aparece depois que a amostra
        responde — na aba Colaboradores dá para convidar e cobrar quem falta.
      </Alert>
    );
  }

  const trocarEscopo = (valor: string) => {
    if (valor !== 'inscritos' && valor !== 'base') return;
    setEscopo(valor);
    setSelecionado(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Quem combina com a cultura de {company.name}
          </CardTitle>
          <CardDescription>
            A empresa fica no centro e a distância de cada pessoa é a aderência
            dela: quanto mais perto, maior o percentual. A direção diz de que
            lado do ambiente ela puxa.{' '}
            {pessoasExibidas.length === 0 ? null : (
              <>
                {plural(pessoasExibidas.length, 'pessoa', 'pessoas')} no mapa ·{' '}
                {acimaDoCorte} acima do mínimo de {ADHERENCE_THRESHOLD}%
                {escopo === 'inscritos'
                  ? ` · ${inscritasNoMapa.length} de ${idsInscritos.size} inscritos responderam`
                  : ''}
                .
              </>
            )}
          </CardDescription>
          <CardAction>
            <Tabs
              value={escopo}
              onValueChange={trocarEscopo}
            >
              <TabsList
                className={cn(
                  ABAS_SEM_ROLAGEM,
                  '**:data-[slot=badge]:h-5 **:data-[slot=badge]:min-w-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:px-1'
                )}
              >
                <TabsTrigger value="inscritos">
                  Quem se inscreveu{' '}
                  <Badge variant="secondary">{inscritasNoMapa.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="base">
                  Toda a base{' '}
                  <Badge variant="secondary">{pessoas.length}</Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardAction>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {/*
           * A vaga só delimita quem conta como inscrito, então só aparece
           * junto do escopo dos inscritos. Em "Toda a base" ela ficaria
           * visível e editável sem mudar nada na tela.
           */}
          {escopo === 'inscritos' && vagas.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <Label
                htmlFor="mapa-vaga"
                className="text-sm font-medium"
              >
                Vaga
              </Label>
              <Select
                value={vagaEscolhida}
                onValueChange={(valor) => {
                  setVagaEscolhida(valor);
                  setSelecionado(null);
                }}
              >
                <SelectTrigger
                  size="sm"
                  id="mapa-vaga"
                  className="w-[260px]"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TODAS_AS_VAGAS}>
                    Todas as vagas ({vagas.length})
                  </SelectItem>
                  {vagas.map((vaga) => (
                    <SelectItem
                      key={vaga.id}
                      value={vaga.id}
                    >
                      {vaga.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="flex flex-col justify-between gap-3">
              <PlanoCultural
                aderenciaPorTalento={aderenciaPorPessoa}
                focusIds={idsEmFoco}
                onSelect={(id) =>
                  setSelecionado((atual) => (atual === id ? null : id))
                }
                points={pontosExibidos}
                referenceId={pontoDaEmpresa.id}
                selectedId={selecionado}
                showProximityRings
              />

              {/*
               * A legenda fica sempre visível: com duas séries, a identidade
               * não pode depender de alguém acertar a cor de cabeça. A forma
               * repete o que a cor diz — bolinha para pessoa, quadrado para
               * empresa.
               */}
              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t pt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: COR_DO_TALENTO }}
                  />
                  Pessoa
                </span>
                <span className="flex items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className="size-2.5 rounded-[2px]"
                    style={{ backgroundColor: COR_DA_EMPRESA }}
                  />
                  {company.name}
                </span>
                <span>
                  Anéis em 35%, 65% e 85% de aderência dão a escala da distância
                </span>
              </div>
            </div>

            <ListaEntidadesMapa
              aderenciaPorTalento={aderenciaPorPessoa}
              busca={busca}
              empresaReferencia={pontoDaEmpresa}
              onBuscaChange={setBusca}
              onLimparQuadrante={() => setQuadranteAtivo(null)}
              onSelect={setSelecionado}
              pontos={pontosExibidos}
              quadranteAtivo={quadranteAtivo}
              selecionadoId={selecionado}
              todosPontos={pontosExibidos}
              /*
               * Só há contexto de vaga quando a vaga está escolhida à vista.
               * Com o seletor escondido, o link do perfil apontaria para uma
               * vaga que a tela não mostra em lugar nenhum.
               */
              vagaContextoId={
                escopo === 'inscritos' && vagaEscolhida !== TODAS_AS_VAGAS
                  ? vagaEscolhida
                  : null
              }
            />
          </div>
        </CardContent>

        <CardFooter className="flex-col items-start gap-1 border-t text-xs text-muted-foreground">
          <p>
            O mapa apoia a decisão humana e não descarta ninguém. Abaixo de{' '}
            {MINIMO_DE_EIXOS_PARA_RANQUEAR} temas respondidos pelos dois lados a
            pessoa aparece sob &ldquo;Sem base suficiente para posição&rdquo;,
            sem número de posição e sem faixa, mas com o percentual à vista e
            clicável: não ranquear não é descartar.
          </p>
          <p>
            Aderência não é nota nem previsão de desempenho: compara condições
            de trabalho declaradas pelos dois lados. O corte de{' '}
            {ADHERENCE_THRESHOLD}% marca para o olho humano e não elimina
            ninguém, e quem não respondeu fica de fora do mapa — ausência nunca
            vira zero.
          </p>
        </CardFooter>
      </Card>

      {/*
       * As regiões são leitura de apoio: quem chega quer saber quem combina,
       * não a taxonomia. Por isso vêm recolhidas, e abrem quando a conversa
       * pede "e que tipo de ambiente é esse?".
       */}
      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="group/regioes"
          >
            <ChevronDown
              aria-hidden="true"
              className="transition-transform group-data-[state=open]/regioes:rotate-180"
            />
            Onde esta empresa está no mapa
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                O que cada região descreve
              </CardTitle>
              <CardDescription>
                {company.name} descreve um ambiente{' '}
                <strong className="font-medium text-foreground">
                  {TIPO_DE_CULTURA_LABEL[pontoDaEmpresa.culture].toLowerCase()}
                </strong>
                . As quatro regiões falam de ambiente de trabalho, nunca de quem
                a pessoa é. Clique numa região para recortar o mapa acima.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {regioes.map((regiao) => {
                  const ativa = quadranteAtivo === regiao.tipo;
                  const daEmpresa = pontoDaEmpresa.culture === regiao.tipo;
                  return (
                    <button
                      key={regiao.tipo}
                      type="button"
                      aria-pressed={ativa}
                      onClick={() =>
                        setQuadranteAtivo((atual) =>
                          atual === regiao.tipo ? null : regiao.tipo
                        )
                      }
                      className={cn(
                        'flex flex-col gap-2 rounded-lg border p-3 text-left',
                        ativa ? 'border-primary bg-muted' : 'bg-card'
                      )}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">
                          {TIPO_DE_CULTURA_LABEL[regiao.tipo]}
                        </span>
                        <Badge variant={ativa ? 'default' : 'outline'}>
                          {regiao.total}
                        </Badge>
                      </span>
                      {daEmpresa ? (
                        <Badge
                          variant="secondary"
                          className="w-fit font-normal"
                        >
                          a região desta empresa
                        </Badge>
                      ) : null}
                      <span className="text-xs leading-relaxed text-muted-foreground">
                        {TIPO_DE_CULTURA_DESCRICAO[regiao.tipo]}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {regiao.porcentagem}% de quem está no recorte
                      </span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
