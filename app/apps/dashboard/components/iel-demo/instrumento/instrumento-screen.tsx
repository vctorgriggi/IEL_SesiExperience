'use client';

import { useId, useMemo, useState } from 'react';
import {
  FIT_AXES,
  type FitAxisId
} from '@/features/iel-demo/analysis/fit-axes';
import {
  configuracaoDoInstrumento,
  instrumentoDeFabrica,
  ITEM_PADRAO_POR_TEMA,
  itemAtivo,
  itemPadraoDoTema,
  ITENS_DO_INSTRUMENTO,
  itensDoTema,
  type ConfiguracaoDoInstrumento
} from '@/features/iel-demo/analysis/instrumento';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import { usoDoInstrumento } from '@/features/iel-demo/state/selectors';
import { nowIso } from '@/features/iel-demo/state/storage';
import { IconArrowBackUp, IconSearch } from '@tabler/icons-react';

import { toast } from '@workspace/ui';
import { cn } from '@workspace/ui/lib/utils';
import { Button } from '@workspace/ui/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@workspace/ui/shadcn/card';
import { Checkbox } from '@workspace/ui/shadcn/checkbox';
import { Input } from '@workspace/ui/shadcn/input';
import { Label } from '@workspace/ui/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@workspace/ui/shadcn/select';

import { normalizarBusca } from '../jobs/busca';
import { usePageHeader } from '../layout/page-header-context';
import { LinhaDaFrase } from './linha-da-frase';

/** Valor do seletor de tema quando nenhum está escolhido. */
const TODOS_OS_TEMAS = 'todos';

/**
 * Instrumento: as 52 frases do cliente, visíveis e ajustáveis pela analista.
 *
 * A tela responde "o que estamos perguntando, e por quê?". Até 20/09 as
 * frases só existiam em código; o dono do produto pediu um lugar para vê-las
 * e controlá-las. O que se controla é pouco, de propósito: **ligar/desligar**
 * uma frase e dizer se ela **separa pessoas**. Ninguém escreve frase nova —
 * o instrumento continua sendo o do cliente (PRODUTO.md §11.1).
 *
 * Cada ajuste vai para o estado da demonstração (`state.instrumento`) e,
 * dali, para os seletores que escolhem as frases do candidato, montam o
 * bloco do colaborador e calculam a aderência. Três regras impedem a
 * analista de deixar um tema sem frase (`motivoParaNaoDesligar`), e a tela
 * mostra o motivo no lugar de deixar tocar.
 */
export function InstrumentoScreen() {
  const { state, dispatch } = useIelDemo();
  const config = configuracaoDoInstrumento(state);
  const uso = usoDoInstrumento(state);

  const [busca, setBusca] = useState('');
  const [tema, setTema] = useState<string>(TODOS_OS_TEMAS);
  const [soLigadas, setSoLigadas] = useState(false);
  const ajudaDiscriminaId = useId();
  const soLigadasId = useId();

  usePageHeader({ breadcrumb: [{ label: 'Instrumento' }] });

  const totalAtivas = ITENS_DO_INSTRUMENTO.filter((item) =>
    itemAtivo(item.id, config)
  ).length;
  const temasComPadraoAtivo = FIT_AXES.filter((axis) =>
    itemAtivo(ITEM_PADRAO_POR_TEMA[axis.id], config)
  ).length;
  const deFabrica = instrumentoDeFabrica(config);

  const termo = normalizarBusca(busca);

  // As seções depois dos filtros. A busca olha a cena, a frase original, o
  // subtema e o id, para "I12" e "conferir" acharem a mesma frase.
  const secoes = useMemo(
    () =>
      FIT_AXES.filter(
        (axis) => tema === TODOS_OS_TEMAS || axis.id === tema
      ).map((axis) => {
        const todas = itensDoTema(axis.id);
        const visiveis = todas.filter((item) => {
          if (soLigadas && !itemAtivo(item.id, config)) return false;
          if (!termo) return true;
          return normalizarBusca(
            `${item.id} ${item.cena} ${item.texto} ${item.subtema}`
          ).includes(termo);
        });
        return { axis, todas, visiveis };
      }),
    [tema, soLigadas, termo, config]
  );

  const nadaEncontrado = secoes.every((secao) => secao.visiveis.length === 0);

  const ajustar = (
    itemId: string,
    ajuste: { ativa?: boolean; discrimina?: boolean }
  ) => {
    dispatch({ type: 'set-instrumento-item', itemId, ...ajuste, at: nowIso() });
  };

  const voltarAoDoCliente = () => {
    dispatch({ type: 'reset-instrumento', at: nowIso() });
    toast.success('Instrumento de volta ao do cliente: 52 frases ligadas.');
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Instrumento</h1>
        <p className="text-sm text-muted-foreground">
          As 52 frases do cliente, em 10 temas: o que o candidato e o
          colaborador respondem, e o que pesa na aderência
        </p>
      </div>

      <div
        className="grid gap-4 sm:grid-cols-3"
        data-tour="instrumento-numeros"
      >
        <NumeroDoCabecalho
          rotulo="Frases ligadas"
          valor={`${totalAtivas} de ${ITENS_DO_INSTRUMENTO.length}`}
          detalhe={
            totalAtivas === ITENS_DO_INSTRUMENTO.length
              ? 'O instrumento inteiro do cliente'
              : `${ITENS_DO_INSTRUMENTO.length - totalAtivas} desligada(s) pela analista`
          }
        />
        <NumeroDoCabecalho
          rotulo="Temas com a frase padrão ligada"
          valor={`${temasComPadraoAtivo} de ${FIT_AXES.length}`}
          detalhe={
            temasComPadraoAtivo === FIT_AXES.length
              ? 'A frase que o candidato recebe sem base da empresa'
              : 'Onde a padrão foi desligada, a primeira ligada assume'
          }
        />
        <NumeroDoCabecalho
          rotulo="Empresas que respondem por tema"
          valor={String(uso.empresasComPerfil)}
          detalhe="Com perfil fechado em ao menos um tema"
        />
      </div>

      {/*
       * A explicação cabe em duas linhas e fica uma vez só, antes das
       * frases: repetida 52 vezes ao lado de cada interruptor viraria ruído.
       * Os interruptores apontam para cá por `aria-describedby`.
       */}
      <p
        id={ajudaDiscriminaId}
        className="text-sm text-muted-foreground"
      >
        Frase desligada não é perguntada nem pesa. Frase que não separa pessoas
        é aquela em que quase todo mundo concorda: entra no perfil da empresa,
        mas não é escolhida para o candidato nem conta na aderência. O que já
        foi respondido continua guardado; só sai da conta.
      </p>

      <div
        className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center"
        data-tour="instrumento-filtros"
      >
        <div className="relative sm:w-64">
          <IconSearch
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Buscar frase ou id (I12)…"
            aria-label="Buscar frase"
            className="pl-8"
          />
        </div>
        <Select
          value={tema}
          onValueChange={setTema}
        >
          <SelectTrigger
            aria-label="Filtrar por tema"
            className="sm:w-56"
          >
            <SelectValue placeholder="Todos os temas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS_OS_TEMAS}>Todos os temas</SelectItem>
            {FIT_AXES.map((axis) => (
              <SelectItem
                key={axis.id}
                value={axis.id}
              >
                {axis.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Checkbox
            id={soLigadasId}
            checked={soLigadas}
            onCheckedChange={(valor) => setSoLigadas(valor === true)}
          />
          <Label
            htmlFor={soLigadasId}
            className="font-normal"
          >
            Só ligadas
          </Label>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="sm:ml-auto"
          disabled={deFabrica}
          onClick={voltarAoDoCliente}
        >
          <IconArrowBackUp />
          Voltar ao instrumento do cliente
        </Button>
      </div>

      {nadaEncontrado ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma frase com esse filtro.
        </p>
      ) : null}

      {secoes
        .filter((secao) => secao.visiveis.length > 0)
        .map(({ axis, todas, visiveis }) => (
          <SecaoDoTema
            key={axis.id}
            axisId={axis.id}
            todas={todas.length}
            visiveis={visiveis.map((item) => item.id)}
            config={config}
            uso={uso.escolhidaEm}
            ajudaId={ajudaDiscriminaId}
            onAjustar={ajustar}
          />
        ))}
    </div>
  );
}

/** Um dos três números do topo, no formato dos section cards. */
function NumeroDoCabecalho({
  rotulo,
  valor,
  detalhe
}: {
  rotulo: string;
  valor: string;
  detalhe: string;
}) {
  return (
    <Card className="shadow-xs">
      <CardHeader>
        <CardDescription>{rotulo}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums">
          {valor}
        </CardTitle>
        <p className="text-xs text-muted-foreground">{detalhe}</p>
      </CardHeader>
    </Card>
  );
}

/**
 * Um tema: quantas frases tem, quantas estão ligadas, qual é a padrão, e as
 * frases que passaram pelo filtro.
 */
function SecaoDoTema({
  axisId,
  todas,
  visiveis,
  config,
  uso,
  ajudaId,
  onAjustar
}: {
  axisId: FitAxisId;
  todas: number;
  visiveis: string[];
  config: ConfiguracaoDoInstrumento;
  uso: Record<string, number>;
  ajudaId: string;
  onAjustar: (
    itemId: string,
    ajuste: { ativa?: boolean; discrimina?: boolean }
  ) => void;
}) {
  const axis = FIT_AXES.find((entry) => entry.id === axisId)!;
  const ligadas = itensDoTema(axisId).filter((item) =>
    itemAtivo(item.id, config)
  ).length;
  const padraoDeFabrica = ITEM_PADRAO_POR_TEMA[axisId];
  const padrao = itemPadraoDoTema(axisId, config);
  const padraoTrocada = padrao !== padraoDeFabrica;

  return (
    <Card className="shadow-xs">
      <CardHeader>
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <CardTitle className="text-base font-semibold">
            {axis.label}
          </CardTitle>
          <span
            className={cn(
              'text-sm tabular-nums',
              ligadas < todas ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            {ligadas} de {todas} ligadas
          </span>
        </div>
        <CardDescription>
          {axis.tituloOriginal} · {axis.description}
        </CardDescription>
        <p className="text-sm">
          <span className="text-muted-foreground">Frase padrão: </span>
          <span className="font-medium tabular-nums">{padrao}</span>
          {padraoTrocada ? (
            <span className="text-muted-foreground">
              {' '}
              — no lugar de {padraoDeFabrica}, que está desligada ou deixou de
              separar pessoas
            </span>
          ) : null}
        </p>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col divide-y">
          {visiveis.map((itemId) => (
            <LinhaDaFrase
              key={itemId}
              itemId={itemId}
              config={config}
              padrao={padrao === itemId}
              escolhidaEm={uso[itemId] ?? 0}
              ajudaId={ajudaId}
              onAjustar={onAjustar}
            />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
