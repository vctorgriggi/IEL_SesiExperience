'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  calcularCustoDaRotatividade,
  formatarReais,
  fraseParaLigacao,
  GANHO_INICIAL_PP,
  GANHOS_PP,
  getHistoricoDeReabertura,
  PARCELAS_INICIAIS,
  type Parcelas
} from '@/features/iel-demo/analysis/custo-da-rotatividade';
import { plural } from '@/features/iel-demo/format';
import {
  IconChevronDown,
  IconCopy,
  IconInfoCircle,
  IconRotate2
} from '@tabler/icons-react';

import { toast } from '@workspace/ui';
import { cn } from '@workspace/ui/lib/utils';
import { Badge } from '@workspace/ui/shadcn/badge';
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@workspace/ui/shadcn/collapsible';
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
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@workspace/ui/shadcn/tooltip';

import {
  BADGE_DE_ESTADO,
  ICONE_TINGIDO,
  SELO,
  TEXTO_DE_ESTADO
} from '../metricas/cores';
import { MarcadorHistorico } from '../metricas/marcador-historico';

/**
 * O argumento que faz a indústria topar (S5).
 *
 * O IEL não cobra pelo serviço, então a empresa não compra a etapa nova: ela
 * é convencida na ligação, que é onde a relação acontece. Esta é a peça que
 * a analista tem aberta nessa hora — o número grande em cima, as parcelas a
 * um clique e a frase pronta para ler em voz alta.
 *
 * Três cuidados que valem mais que o desenho:
 *
 * - **Toda parcela é estimativa e está escrita como tal**, com valor à vista
 *   e campo para a empresa corrigir no meio da conversa. Não há estatística
 *   de mercado aqui, porque não há fonte para citar.
 * - **A conta é da vaga reaberta, não de quem saiu.** Em nenhum lugar uma
 *   pessoa vira custo.
 * - **A economia é projeção declarada**, dependente de uma hipótese que a
 *   analista escolhe. O produto não promete queda de rotatividade.
 */

/** O rascunho fica em texto para o campo aceitar apagar tudo e recomeçar. */
type Rascunho = Record<keyof Parcelas, string>;

const RASCUNHO_INICIAL: Rascunho = {
  rescisao: String(PARCELAS_INICIAIS.rescisao),
  processo: String(PARCELAS_INICIAIS.processo),
  treinamento: String(PARCELAS_INICIAIS.treinamento),
  diasAteProduzir: String(PARCELAS_INICIAIS.diasAteProduzir),
  custoDoDia: String(PARCELAS_INICIAIS.custoDoDia)
};

function paraNumero(texto: string): number {
  const limpo = texto.replace(/\D/g, '');
  return limpo.length === 0 ? 0 : Number(limpo);
}

const chaveDoCusto = (companyId: string) => `mind-rh:custo:${companyId}`;

/**
 * Os ajustes ficam no navegador de quem ligou, por empresa: a analista
 * corrige os valores com a indústria de um lado da linha e os reencontra na
 * próxima ligação. É protótipo — não passa pelo estado da demonstração.
 * Armazenamento bloqueado (aba anônima, cota) não quebra a tela.
 */
function lerRascunho(companyId: string): Rascunho | null {
  try {
    const bruto = window.localStorage.getItem(chaveDoCusto(companyId));
    if (!bruto) return null;
    const lido = JSON.parse(bruto) as Partial<Rascunho>;
    const campos = Object.keys(RASCUNHO_INICIAL) as (keyof Parcelas)[];
    return campos.reduce((acc, campo) => {
      acc[campo] =
        typeof lido[campo] === 'string' ? lido[campo] : RASCUNHO_INICIAL[campo];
      return acc;
    }, {} as Rascunho);
  } catch {
    return null;
  }
}

function gravarRascunho(companyId: string, rascunho: Rascunho): void {
  try {
    window.localStorage.setItem(
      chaveDoCusto(companyId),
      JSON.stringify(rascunho)
    );
  } catch {
    // Sem armazenamento a conta continua valendo na tela; só não volta depois.
  }
}

/** O ⓘ de apoio: a explicação fica a um toque, nunca em parágrafo na tela. */
function Ajuda({ rotulo, texto }: { rotulo: string; texto: string }) {
  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={`Sobre ${rotulo}`}
            className="inline-flex size-3.5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring"
          >
            <IconInfoCircle
              aria-hidden="true"
              className="size-3.5"
            />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-64 text-pretty">
          {texto}
        </TooltipContent>
      </Tooltip>
      <span className="sr-only">{texto}</span>
    </>
  );
}

/** Um campo de valor em reais (ou em dias), curto e numérico. */
function CampoDaParcela({
  id,
  rotulo,
  prefixo,
  sufixo,
  valor,
  onChange
}: {
  id: string;
  rotulo: string;
  prefixo?: string;
  sufixo?: string;
  valor: string;
  onChange: (valor: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Label
        htmlFor={id}
        className="sr-only"
      >
        {rotulo}
      </Label>
      {prefixo ? (
        <span
          aria-hidden="true"
          className="text-sm text-muted-foreground"
        >
          {prefixo}
        </span>
      ) : null}
      <Input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={valor}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, ''))}
        className="h-8 w-24 text-right tabular-nums"
      />
      {sufixo ? (
        <span
          aria-hidden="true"
          className="text-sm text-muted-foreground"
        >
          {sufixo}
        </span>
      ) : null}
    </div>
  );
}

export function CustoDaRotatividadeCard({
  companyId,
  companyName
}: {
  companyId: string;
  companyName: string;
}) {
  const [rascunho, setRascunho] = useState<Rascunho>(RASCUNHO_INICIAL);
  const [ganhoPp, setGanhoPp] = useState<number>(GANHO_INICIAL_PP);
  const [parcelasAbertas, setParcelasAbertas] = useState(false);
  const [fraseVisivel, setFraseVisivel] = useState(false);

  // `localStorage` só existe no navegador: lê depois de montar.
  useEffect(() => {
    setRascunho(lerRascunho(companyId) ?? RASCUNHO_INICIAL);
  }, [companyId]);

  const historico = useMemo(
    () => getHistoricoDeReabertura(companyId),
    [companyId]
  );

  const parcelas: Parcelas = useMemo(
    () => ({
      rescisao: paraNumero(rascunho.rescisao),
      processo: paraNumero(rascunho.processo),
      treinamento: paraNumero(rascunho.treinamento),
      diasAteProduzir: paraNumero(rascunho.diasAteProduzir),
      custoDoDia: paraNumero(rascunho.custoDoDia)
    }),
    [rascunho]
  );

  const custo = useMemo(
    () => calcularCustoDaRotatividade(historico, parcelas, ganhoPp),
    [historico, parcelas, ganhoPp]
  );

  const frase = fraseParaLigacao(companyName, historico, custo);

  const alterar = (campo: keyof Parcelas) => (valor: string) => {
    setRascunho((atual) => {
      const proximo = { ...atual, [campo]: valor };
      gravarRascunho(companyId, proximo);
      return proximo;
    });
  };

  const restaurar = () => {
    setRascunho(RASCUNHO_INICIAL);
    gravarRascunho(companyId, RASCUNHO_INICIAL);
    toast.success('Parcelas de volta aos valores padrão.');
  };

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(frase);
      toast.success('Frase copiada.');
    } catch {
      // Sem permissão de área de transferência (ou sem HTTPS): o texto
      // aparece selecionável, para copiar à mão.
      setFraseVisivel(true);
      toast.info('Não deu para copiar. A frase está logo abaixo.');
    }
  };

  // Sem reabertura na base, o número grande vira o custo de uma vaga: é o
  // que a analista ainda pode dizer com honestidade.
  const temAno = custo.noAno !== null;
  const valorPrincipal = custo.noAno ?? custo.porVaga;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1 text-base font-semibold">
            Custo de reabrir a vaga <MarcadorHistorico />
          </CardTitle>
          <CardDescription>
            {historico.naBase
              ? `Últimos 12 meses · ${plural(historico.vagas12m, 'vaga encerrada', 'vagas encerradas')} nesta empresa`
              : 'Esta empresa ainda não tem vaga encerrada na base'}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-6">
          {/*
           * O número grande primeiro: a analista está no telefone e precisa
           * lê-lo de relance. A conta que o produziu vem na linha de baixo,
           * em uma frase, para ninguém achar que caiu do céu.
           */}
          <div className="flex flex-wrap items-start gap-4">
            <span
              aria-hidden="true"
              className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-md',
                ICONE_TINGIDO.atencao
              )}
            >
              <IconRotate2 className="size-4" />
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <p className="text-sm text-muted-foreground">
                {temAno
                  ? 'Gasto estimado com reabertura em 12 meses'
                  : 'Cada vaga que reabre'}
              </p>
              <p className="text-4xl font-semibold tabular-nums">
                {formatarReais(valorPrincipal)}
              </p>
              <p className="text-sm">
                {temAno ? (
                  <>
                    {plural(
                      historico.reaberturas12m,
                      'vaga reaberta',
                      'vagas reabertas'
                    )}{' '}
                    × {formatarReais(custo.porVaga)} por vaga
                    {historico.cargoMaisReaberto ? (
                      <span className="text-muted-foreground">
                        {' '}
                        · a que mais voltou foi{' '}
                        {historico.cargoMaisReaberto.toLowerCase()}
                      </span>
                    ) : null}
                  </>
                ) : historico.naBase ? (
                  'A base não registra reabertura desta empresa nos últimos 12 meses. O custo por vaga vale para a conversa; o total do ano, não.'
                ) : (
                  'A base ainda não tem histórico desta empresa. O custo por vaga vale para a conversa; o total do ano, não.'
                )}
              </p>
            </div>
            <Badge
              variant="outline"
              className={cn(SELO, BADGE_DE_ESTADO.neutro, 'ml-auto')}
            >
              parcelas estimadas
            </Badge>
          </div>

          {/*
           * O contrafactual, com a hipótese escolhida à vista. Não é promessa
           * do Mind RH: é a conta de "se acontecer isto, deixa de sair
           * aquilo", e o rodapé diz exatamente isso.
           */}
          <div className="flex flex-col gap-2 rounded-lg border p-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Label htmlFor="ganho-de-permanencia">
                Se a permanência em 90 dias subir
              </Label>
              <Select
                value={String(ganhoPp)}
                onValueChange={(valor) => setGanhoPp(Number(valor))}
              >
                <SelectTrigger
                  size="sm"
                  className="w-[9.5rem]"
                  id="ganho-de-permanencia"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GANHOS_PP.map((pp) => (
                    <SelectItem
                      key={pp}
                      value={String(pp)}
                    >
                      {pp} pontos
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Ajuda
                rotulo="a hipótese de permanência"
                texto="Quantos contratados a mais, em cada 100, passariam dos 90 dias. O número é hipótese da analista, não previsão do sistema."
              />
            </div>
            <p className="text-sm">
              {custo.economiaNoAno === null ? (
                <span className="text-muted-foreground">
                  Sem reabertura registrada, não dá para projetar economia desta
                  empresa.
                </span>
              ) : (
                <>
                  deixa de gastar cerca de{' '}
                  <strong
                    className={cn(
                      'text-base tabular-nums',
                      TEXTO_DE_ESTADO.combina
                    )}
                  >
                    {formatarReais(custo.economiaNoAno)}
                  </strong>{' '}
                  por ano.
                </>
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              Projeção que depende dessa hipótese. O Mind RH não garante queda
              de rotatividade.
            </p>
          </div>

          {/*
           * As parcelas a um clique: fechadas, o cartão responde em dois
           * segundos; abertas, a analista muda qualquer valor com a empresa
           * na linha e vê o total reagir.
           */}
          <Collapsible
            open={parcelasAbertas}
            onOpenChange={setParcelasAbertas}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CollapsibleTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                >
                  <IconChevronDown
                    aria-hidden="true"
                    className={cn(
                      'transition-transform',
                      parcelasAbertas && 'rotate-180'
                    )}
                  />
                  {parcelasAbertas
                    ? 'Esconder as parcelas'
                    : 'Ver e ajustar as parcelas'}
                </Button>
              </CollapsibleTrigger>
              {parcelasAbertas ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={restaurar}
                >
                  <IconRotate2 aria-hidden="true" />
                  Voltar ao padrão
                </Button>
              ) : null}
            </div>

            <CollapsibleContent className="flex flex-col gap-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Valores padrão do IEL para uma vaga operacional. São
                estimativas, não medição: troque cada um pelo número que a
                empresa disser.
              </p>

              <ul className="flex flex-col gap-3">
                {custo.parcelas.map((parcela) => (
                  <li
                    key={parcela.id}
                    className="flex flex-wrap items-center justify-between gap-3 border-b pb-3 last:border-b-0 last:pb-0"
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="text-sm font-medium">
                        {parcela.rotulo}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {parcela.detalhe}
                      </span>
                    </div>
                    {parcela.id === 'ateProduzir' ? (
                      <div className="flex items-center gap-2">
                        <CampoDaParcela
                          id="parcela-dias"
                          rotulo="Dias até produzir como antes"
                          valor={rascunho.diasAteProduzir}
                          sufixo="dias"
                          onChange={alterar('diasAteProduzir')}
                        />
                        <span
                          aria-hidden="true"
                          className="text-sm text-muted-foreground"
                        >
                          ×
                        </span>
                        <CampoDaParcela
                          id="parcela-custo-dia"
                          rotulo="Custo de um dia de trabalho, em reais"
                          prefixo="R$"
                          valor={rascunho.custoDoDia}
                          onChange={alterar('custoDoDia')}
                        />
                        <span className="w-28 text-right text-sm font-medium tabular-nums">
                          {formatarReais(parcela.valor)}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <CampoDaParcela
                          id={`parcela-${parcela.id}`}
                          rotulo={`${parcela.rotulo}, em reais`}
                          prefixo="R$"
                          valor={rascunho[parcela.id]}
                          onChange={alterar(parcela.id)}
                        />
                        <span className="w-28 text-right text-sm font-medium tabular-nums">
                          {formatarReais(parcela.valor)}
                        </span>
                      </div>
                    )}
                  </li>
                ))}
              </ul>

              <div
                aria-live="polite"
                className="flex items-center justify-between gap-3 rounded-lg bg-muted px-4 py-3"
              >
                <span className="text-sm font-medium">
                  Cada vaga que reabre
                </span>
                <span className="text-lg font-semibold tabular-nums">
                  {formatarReais(custo.porVaga)}
                </span>
              </div>

              {/*
               * O que a empresa faz, ao lado do que ela gasta: sem isto o
               * número seria genérico, e o cliente pediu o custo dela.
               */}
              <dl className="grid gap-3 text-sm sm:grid-cols-3">
                <div className="flex flex-col">
                  <dt className="text-xs text-muted-foreground">
                    Vagas reabertas em 12 meses
                  </dt>
                  <dd className="tabular-nums">
                    {historico.naBase ? (
                      historico.reaberturas12m
                    ) : (
                      <span className="text-muted-foreground">
                        sem histórico
                      </span>
                    )}
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="flex items-center gap-1 text-xs text-muted-foreground">
                    A cada 100 vagas
                    <Ajuda
                      rotulo="a taxa de reabertura"
                      texto="Reaberturas a cada 100 vagas encerradas da empresa. Com menos de 5 vagas no período não vira taxa."
                    />
                  </dt>
                  <dd className="tabular-nums">
                    {historico.taxaPor100 === null ? (
                      <span className="text-muted-foreground">
                        base pequena
                      </span>
                    ) : (
                      `${historico.taxaPor100} reabrem`
                    )}
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="flex items-center gap-1 text-xs text-muted-foreground">
                    Passaram dos 90 dias
                    <Ajuda
                      rotulo="a permanência em 90 dias"
                      texto="Dos contratados desta empresa com os 90 dias vencidos. Com menos de 5 apurados não é mostrado."
                    />
                  </dt>
                  <dd className="tabular-nums">
                    {historico.permanencia90Pct === null ? (
                      <span className="text-muted-foreground">
                        ainda não dá para dizer
                      </span>
                    ) : (
                      `${historico.permanencia90Pct}% de ${historico.apurados90}`
                    )}
                  </dd>
                </div>
              </dl>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>

        <CardFooter className="text-xs text-muted-foreground">
          O serviço do IEL segue sem cobrança. Este número existe para mostrar o
          que a rotatividade custa, não para cobrar por resolvê-la.
        </CardFooter>
      </Card>

      {/* A frase pronta, do jeito que se lê em voz alta. */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">
            Para ler ao telefone
          </CardTitle>
          <CardDescription>
            Acompanha os valores acima: mudou uma parcela, muda a frase.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="max-w-[70ch] text-pretty">{frase}</p>
          <div>
            <Button
              size="sm"
              onClick={copiar}
            >
              <IconCopy aria-hidden="true" />
              Copiar frase
            </Button>
          </div>
          {fraseVisivel ? (
            <textarea
              readOnly
              rows={4}
              aria-label="Frase para copiar à mão"
              className="w-full rounded-lg border bg-muted p-3 text-sm"
              value={frase}
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
