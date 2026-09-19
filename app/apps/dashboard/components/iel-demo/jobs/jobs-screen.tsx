'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  CANDIDATE_FIT_DEADLINE_DAYS,
  getApplicationsByJob,
  getCompany,
  getCompatibleCount,
  getJobListState,
  getReferralListSelection,
  getVisibleJobs,
  JOB_LIST_STATE_LABEL,
  REFERRAL_LIMIT,
  type JobListState
} from '@/features/iel-demo/state/selectors';
import { Search } from 'lucide-react';

import { routes } from '@workspace/routes';
import { Badge } from '@workspace/ui/shadcn/badge';
import { Input } from '@workspace/ui/shadcn/input';
import { Label } from '@workspace/ui/shadcn/label';
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
import { Tabs, TabsList, TabsTrigger } from '@workspace/ui/shadcn/tabs';

import { usePageHeader } from '../layout/page-header-context';
import { formatarDataCurta } from '../shared/datas';
import { normalizarBusca } from './busca';
import { RodapeDaTabela, usePaginacao } from './table-pagination';

const ESTADOS: JobListState[] = [
  'em-selecao',
  'aguardando-empresa',
  'encerrada'
];

const TODAS_AS_CIDADES = 'todas';

/** Fim do prazo de resposta do questionário: a mesma conta da tela da vaga. */
function prazoDaVaga(atualizadaEm: string): string {
  const data = new Date(`${atualizadaEm.slice(0, 10)}T12:00:00.000Z`);
  if (Number.isNaN(data.getTime())) return '—';
  data.setUTCDate(data.getUTCDate() + CANDIDATE_FIT_DEADLINE_DAYS);
  return formatarDataCurta(data.toISOString().slice(0, 10));
}

/**
 * Uma linha por vaga, no volume do mês.
 *
 * O IEL abre perto de 2.500 vagas por mês, e a barra lateral não carrega mais
 * árvore de empresas: é aqui que se chega a uma vaga. A lista não classifica
 * vaga nenhuma — responde onde o trabalho está: quantos se candidataram,
 * quantos passam do corte e quantos dos 5 currículos já foram marcados.
 */
export function JobsScreen() {
  const { state, persona } = useIelDemo();
  const router = useRouter();
  const iel = routes.dashboard.iel;

  const [estado, setEstado] = useState<JobListState>('em-selecao');
  const [busca, setBusca] = useState('');
  const [cidade, setCidade] = useState(TODAS_AS_CIDADES);

  usePageHeader({ breadcrumb: [{ label: 'Vagas' }] });

  /*
   * O ranking de cada vaga é a conta mais cara da tela; ela roda uma vez por
   * mudança de estado, não a cada tecla da busca.
   */
  const todas = useMemo(() => {
    // Empresa sem nenhuma resposta de cultura não tem perfil: "0 compatíveis"
    // ali seria mentira (ninguém foi medido), então a coluna diz "sem perfil".
    const comPerfil = new Set(
      state.cultureAnswers.map((answer) => answer.companyId)
    );
    return getVisibleJobs(state).map((job) => {
      const company = getCompany(job.companyId);
      return {
        job,
        company,
        estado: getJobListState(state, job),
        candidaturas: getApplicationsByJob(state, job.id).length,
        compativeis: comPerfil.has(job.companyId)
          ? getCompatibleCount(state, job.id)
          : null,
        marcados: getReferralListSelection(state, job.id).length,
        busca: normalizarBusca(`${job.title} ${company?.name ?? ''}`)
      };
    });
  }, [state]);

  const cidades = useMemo(
    () =>
      [...new Set(todas.map((linha) => linha.job.location))].sort((a, b) =>
        a.localeCompare(b, 'pt-BR')
      ),
    [todas]
  );

  // Busca e cidade valem para as três abas, e os contadores seguem o filtro.
  const filtradas = useMemo(() => {
    const termo = normalizarBusca(busca);
    return todas.filter(
      (linha) =>
        (!termo || linha.busca.includes(termo)) &&
        (cidade === TODAS_AS_CIDADES || linha.job.location === cidade)
    );
  }, [todas, busca, cidade]);

  const contagem = useMemo(() => {
    const porEstado: Record<JobListState, number> = {
      'em-selecao': 0,
      'aguardando-empresa': 0,
      encerrada: 0
    };
    for (const linha of filtradas) porEstado[linha.estado] += 1;
    return porEstado;
  }, [filtradas]);

  const daAba = useMemo(
    () => filtradas.filter((linha) => linha.estado === estado),
    [filtradas, estado]
  );

  const paginacao = usePaginacao(daAba);

  const trocarAba = (valor: string) => {
    const escolhida = ESTADOS.find((item) => item === valor);
    if (!escolhida) return;
    setEstado(escolhida);
    paginacao.irPara(0);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Vagas</h1>
        <p className="text-sm text-muted-foreground">
          {persona.kind === 'gestor'
            ? 'As vagas da sua empresa.'
            : 'Todas as vagas das empresas atendidas. Clique para abrir.'}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Tabs
          value={estado}
          onValueChange={trocarAba}
          className="max-w-full overflow-x-auto"
        >
          <TabsList className="**:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:px-1">
            {ESTADOS.map((item) => (
              <TabsTrigger
                key={item}
                value={item}
              >
                {JOB_LIST_STATE_LABEL[item]}{' '}
                <Badge
                  variant="secondary"
                  className="tabular-nums"
                >
                  {contagem[item]}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Label
              htmlFor="buscar-vaga"
              className="sr-only"
            >
              Buscar vaga ou empresa
            </Label>
            <Input
              id="buscar-vaga"
              type="search"
              placeholder="Vaga ou empresa…"
              value={busca}
              onChange={(evento) => {
                setBusca(evento.target.value);
                paginacao.irPara(0);
              }}
              className="h-8 w-[220px] pl-8 text-[13px]"
            />
          </div>
          <Label
            htmlFor="filtrar-cidade"
            className="sr-only"
          >
            Cidade
          </Label>
          <Select
            value={cidade}
            onValueChange={(valor) => {
              setCidade(valor);
              paginacao.irPara(0);
            }}
          >
            <SelectTrigger
              id="filtrar-cidade"
              size="sm"
              className="w-[190px]"
            >
              <SelectValue placeholder="Cidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODAS_AS_CIDADES}>Todas as cidades</SelectItem>
              {cidades.map((item) => (
                <SelectItem
                  key={item}
                  value={item}
                >
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead>Vaga</TableHead>
              <TableHead className="w-[180px]">Cidade</TableHead>
              <TableHead className="w-[120px] text-right">
                Candidaturas
              </TableHead>
              <TableHead className="w-[120px] text-right">
                Compatíveis
              </TableHead>
              <TableHead className="w-[100px] text-right">Marcados</TableHead>
              <TableHead className="w-[90px] text-right">Prazo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginacao.linhas.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  Nenhuma vaga aqui com esse filtro.
                </TableCell>
              </TableRow>
            ) : (
              paginacao.linhas.map((linha) => {
                const href = iel.jobs.byId(linha.job.id).index;
                return (
                  <TableRow
                    key={linha.job.id}
                    className="cursor-pointer"
                    onClick={() => router.push(href)}
                  >
                    <TableCell className="max-w-0 whitespace-normal">
                      {/*
                       * O link fica no título para o teclado e o leitor de
                       * tela; o clique na linha é atalho para o mouse.
                       */}
                      <Link
                        href={href}
                        onClick={(evento) => evento.stopPropagation()}
                        className="block truncate font-medium underline-offset-4 hover:underline"
                      >
                        {linha.job.title}
                      </Link>
                      <span className="block truncate text-xs text-muted-foreground">
                        {linha.company?.name ?? '—'}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {linha.job.location}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {linha.candidaturas}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {linha.compativeis ?? (
                        <span className="font-normal text-muted-foreground">
                          sem perfil
                        </span>
                      )}
                    </TableCell>
                    {/*
                     * Marcados é sempre sobre o limite da remessa: "2"
                     * sozinho não diz se falta alguém, "2/5" diz.
                     */}
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {linha.marcados}/{REFERRAL_LIMIT}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {linha.estado === 'encerrada'
                        ? '—'
                        : prazoDaVaga(linha.job.updatedAt)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <RodapeDaTabela
        paginacao={paginacao}
        resumo={`${daAba.length} de ${todas.length} ${
          todas.length === 1 ? 'vaga' : 'vagas'
        }`}
      />
    </div>
  );
}
