'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ADHERENCE_THRESHOLD,
  formatAdherence,
  type AdherenceResult
} from '@/features/iel-demo/analysis/adherence';
import {
  faixaDeAderencia,
  MINIMO_DE_EIXOS_PARA_RANQUEAR,
  temBaseParaRanquear
} from '@/features/iel-demo/analysis/mapa-cultural';
import { COPY, verdictSentence } from '@/features/iel-demo/copy';
import { plural } from '@/features/iel-demo/format';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  getApplicationsByTalent,
  getCultureFit,
  getCultureMapPoints,
  getJob,
  getJobsByCompany,
  getTalentCultureAnswers,
  JOB_STAGE_LABEL,
  type CultureMapPoint
} from '@/features/iel-demo/state/selectors';
import { IconArrowRight, IconMap } from '@tabler/icons-react';

import { routes } from '@workspace/routes';
import { Alert } from '@workspace/ui';
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

import { PontosDoDia } from '../aderencia/pontos-do-dia';
import { RadarDeAderencia } from '../aderencia/radar-de-aderencia';
import { FaixaBadge } from '../mapa-cultural/faixa-badge';
import {
  barraDaAderencia,
  TEXTO_DE_ESTADO,
  textoDaAderencia,
  TRILHO
} from '../metricas/cores';

/**
 * A leitura de aderência, agora ancorada na pessoa.
 *
 * Era tela própria no menu, organizada por vaga — e por vaga ela repetia a
 * mesa de seleção com outra roupa. O cliente já tinha dito onde a medida
 * mora: "uma coisa do fit cultural é sobre a cultura da empresa. Não é sobre
 * a vaga" (00:31:38). Ancorada na pessoa, a mesma conta responde o que faz o
 * banco de talentos valer: **esta pessoa, e as empresas em que ela se
 * encaixa** — não só aquela em cuja vaga ela está sendo olhada agora.
 *
 * O ranking continua sendo por empresa: aqui se ordenam empresas para uma
 * pessoa, nunca pessoas em abstrato.
 */

type Encaixe = {
  empresa: CultureMapPoint;
  aderencia: AdherenceResult;
  /** Quantos temas a gestão e a equipe respondem diferente. */
  divergentes: number;
  temBase: boolean;
};

/** Ordena as empresas pela aderência desta pessoa, com o piso de evidência. */
function ordenar(encaixes: Encaixe[]): Encaixe[] {
  return [...encaixes].sort((a, b) => {
    if (a.temBase !== b.temBase) return a.temBase ? -1 : 1;
    const totalA = a.aderencia.total ?? -1;
    const totalB = b.aderencia.total ?? -1;
    if (totalA !== totalB) return totalB - totalA;
    const temasA = a.aderencia.coverage.answeredAxes;
    const temasB = b.aderencia.coverage.answeredAxes;
    if (temasA !== temasB) return temasB - temasA;
    return a.empresa.name.localeCompare(b.empresa.name, 'pt-BR');
  });
}

export function AderenciaDaPessoa({
  talentId,
  talentName,
  empresaInicial
}: {
  talentId: string;
  talentName: string;
  /** Empresa da vaga pela qual o perfil foi aberto, quando houver. */
  empresaInicial?: string | null;
}) {
  const { state } = useIelDemo();
  const primeiroNome = talentName.split(' ')[0] ?? talentName;

  const respondeu = useMemo(
    () => getTalentCultureAnswers(talentId).length > 0,
    [talentId]
  );

  /*
   * As empresas que têm perfil fechado — só elas têm contra o que medir. O
   * índice é o mesmo que o mapa de cultura usa e fica memorizado no estado:
   * a carteira tem 2.500 empresas, e varrê-la a cada render seria a conta
   * inteira refeita por causa de um clique de aba.
   */
  const empresasComPerfil = useMemo(
    () => getCultureMapPoints(state, 'empresas'),
    [state]
  );

  const encaixes = useMemo(() => {
    const lista: Encaixe[] = [];
    for (const empresa of empresasComPerfil) {
      const leitura = getCultureFit(state, talentId, empresa.id);
      if (!leitura) continue;
      lista.push({
        empresa,
        aderencia: leitura.aderencia,
        divergentes: leitura.divergentAxes,
        temBase: temBaseParaRanquear(leitura.aderencia)
      });
    }
    return ordenar(lista);
  }, [state, empresasComPerfil, talentId]);

  const candidaturas = useMemo(
    () => getApplicationsByTalent(state, talentId),
    [state, talentId]
  );

  /** Em quais destas empresas ela já se candidatou a alguma vaga. */
  const ondeSeCandidatou = useMemo(() => {
    const ids = new Set<string>();
    for (const candidatura of candidaturas) {
      const vaga = getJob(candidatura.jobId);
      if (vaga) ids.add(vaga.companyId);
    }
    return ids;
  }, [candidaturas]);

  const [escolhida, setEscolhida] = useState<string | null>(null);
  const encaixeAberto =
    encaixes.find((item) => item.empresa.id === escolhida) ??
    encaixes.find((item) => item.empresa.id === empresaInicial) ??
    encaixes[0] ??
    null;

  const acimaDoCorte = encaixes.filter(
    (item) => item.aderencia.compatible === true
  ).length;

  /*
   * A empresa aberta pode estar na décima linha — é o caso de quem chega pelo
   * link de uma vaga. Sem trazer a linha para a vista, a lista destaca algo
   * que quem lê não vê, e a leitura ao lado parece não ter dono.
   */
  const linhaAberta = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    linhaAberta.current?.scrollIntoView({ block: 'nearest' });
  }, [encaixeAberto?.empresa.id]);

  if (!respondeu) {
    return (
      <Alert variant="default">
        {primeiroNome} ainda não respondeu o questionário de como prefere
        trabalhar, então não há aderência a calcular. Ausência de resposta não
        vira zero: enquanto ela não responder, a tela fica sem número em vez de
        mostrar o menor deles.
      </Alert>
    );
  }

  if (encaixes.length === 0) {
    return (
      <Alert variant="default">
        Nenhuma empresa da carteira fechou tema suficiente na consulta à equipe
        para ser comparada com {primeiroNome}. A aderência precisa dos dois
        lados respondidos.
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Onde {primeiroNome} se encaixa
            </CardTitle>
            <CardDescription>
              {plural(
                encaixes.length,
                'empresa comparada',
                'empresas comparadas'
              )}{' '}
              · {acimaDoCorte} acima do mínimo de {ADHERENCE_THRESHOLD}%. Abra
              uma para ver a leitura tema a tema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex max-h-[520px] flex-col gap-1.5 overflow-y-auto pr-1">
              {encaixes.map((item, indice) => {
                const anterior = encaixes[indice - 1];
                const abreSemBase =
                  !item.temBase && (indice === 0 || Boolean(anterior?.temBase));
                const posicao = item.temBase ? indice + 1 : null;
                const aberta = item.empresa.id === encaixeAberto?.empresa.id;
                const total = item.aderencia.total;

                return (
                  <li key={item.empresa.id}>
                    {abreSemBase ? (
                      /*
                       * Abaixo do piso não há posição a atribuir: um tema em
                       * comum vira 0 ou 100 e nada entre os dois. O percentual
                       * continua à vista e a linha continua clicável — não
                       * ranquear não é descartar.
                       */
                      <p className="mt-3 mb-1.5 border-t pt-2 text-xs font-medium text-muted-foreground">
                        Sem base suficiente para posição
                        <span className="font-normal">
                          {' '}
                          · menos de {MINIMO_DE_EIXOS_PARA_RANQUEAR} temas
                          respondidos pelos dois lados
                        </span>
                      </p>
                    ) : null}
                    <button
                      ref={aberta ? linhaAberta : undefined}
                      type="button"
                      aria-pressed={aberta}
                      onClick={() => setEscolhida(item.empresa.id)}
                      className={cn(
                        'flex w-full items-center justify-between gap-3 rounded-lg border p-2.5 text-left',
                        aberta ? 'border-primary bg-muted' : 'bg-card'
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        {posicao === null ? null : (
                          <span className="w-4 shrink-0 text-right text-xs font-medium tabular-nums text-muted-foreground">
                            {posicao}
                          </span>
                        )}
                        <span className="flex min-w-0 flex-col">
                          <span className="truncate text-sm font-medium">
                            {item.empresa.name}
                          </span>
                          <span className="truncate text-xs text-muted-foreground">
                            {item.empresa.detail}
                            {ondeSeCandidatou.has(item.empresa.id)
                              ? ' · já se candidatou'
                              : ''}
                          </span>
                        </span>
                      </span>

                      <span className="shrink-0 text-right">
                        <span className="flex items-center justify-end gap-1.5">
                          <span
                            className={cn(
                              'text-sm font-semibold tabular-nums',
                              item.temBase
                                ? 'text-foreground'
                                : 'text-muted-foreground'
                            )}
                          >
                            {formatAdherence(total)}
                          </span>
                          {item.temBase && total !== null ? (
                            <FaixaBadge faixa={faixaDeAderencia(total)} />
                          ) : null}
                        </span>
                        {/*
                         * O denominador fica à vista, e tanto o corte quanto a
                         * falta de base são ditos por escrito: estado de
                         * critério nunca depende só da cor.
                         */}
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {!item.temBase ? (
                            <>
                              só {item.aderencia.coverage.answeredAxes} de{' '}
                              {item.aderencia.coverage.totalAxes} temas em comum
                            </>
                          ) : item.aderencia.compatible ? (
                            <>
                              {item.aderencia.coverage.answeredAxes} de{' '}
                              {item.aderencia.coverage.totalAxes} temas medidos
                            </>
                          ) : (
                            <span
                              className={cn(
                                'font-medium',
                                TEXTO_DE_ESTADO.atencao
                              )}
                            >
                              abaixo do corte de {ADHERENCE_THRESHOLD}%
                            </span>
                          )}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </CardContent>
          <CardFooter className="border-t text-xs text-muted-foreground">
            O ranking é sempre dentro de um escopo: aqui se ordenam empresas
            para esta pessoa. Não existe lista de &ldquo;melhores
            pessoas&rdquo;.
          </CardFooter>
        </Card>

        {encaixeAberto ? (
          <LeituraNaEmpresa
            encaixe={encaixeAberto}
            primeiroNome={primeiroNome}
          />
        ) : null}
      </div>

      <Card className="bg-muted/40 shadow-none">
        <CardContent className="flex flex-col gap-1 text-xs text-muted-foreground">
          <p>
            Aderência não é nota nem previsão de desempenho: compara condições
            de trabalho declaradas pelos dois lados, tema a tema, por regra fixa
            e pública. {COPY.fit.hint}
          </p>
          <p>
            O corte de {ADHERENCE_THRESHOLD}% marca para o olho humano e não
            elimina ninguém — a decisão continua de quem lê. Tema sem resposta
            de um dos lados fica sem número e a tela diz de quem é a falta;
            ausência nunca vira zero.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * A leitura desta pessoa numa empresa: o número com o denominador, o radar
 * dos dez temas e o tema a tema com os dois lados escritos. É a mesma
 * marcação da antiga tela de aderência, que agora vive aqui.
 */
function LeituraNaEmpresa({
  encaixe,
  primeiroNome
}: {
  encaixe: Encaixe;
  primeiroNome: string;
}) {
  const iel = routes.dashboard.iel;
  const total = encaixe.aderencia.total;
  const vagas = useMemo(
    () =>
      getJobsByCompany(encaixe.empresa.id).filter(
        (vaga) => vaga.stage !== 'encerrada'
      ),
    [encaixe.empresa.id]
  );

  return (
    <Card className="@container/leitura">
      <CardHeader className="border-b">
        {/* Título de verdade: a casca dá o h1 e esta é a seção da leitura. */}
        <h2
          data-slot="card-title"
          className="text-base leading-none font-semibold"
        >
          {primeiroNome} na {encaixe.empresa.name}
        </h2>
        <CardDescription>
          {encaixe.empresa.detail} · a comparação é com o ambiente que a equipe
          desta empresa descreve, não com a vaga.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-col gap-2.5 rounded-lg border bg-muted/20 p-4">
          <div className="flex flex-wrap items-baseline gap-2.5">
            <span
              className={cn(
                /* O número de destaque da tela: 40px, `t-num`. */
                't-num',
                textoDaAderencia(total)
              )}
            >
              {total === null ? (
                <>
                  <span aria-hidden="true">—</span>
                  <span className="sr-only">Ainda sem medida</span>
                </>
              ) : (
                `${Math.round(total)}%`
              )}
            </span>
            <span className="text-sm font-medium">
              {verdictSentence(total, ADHERENCE_THRESHOLD)}
            </span>
          </div>

          {/* O número acima já diz o valor: a barra é só desenho. */}
          <div
            aria-hidden="true"
            className="relative"
          >
            <div
              className={cn(
                'h-2.5 overflow-hidden rounded-full',
                TRILHO.trilha
              )}
            >
              <div
                className={cn('h-full rounded-full', barraDaAderencia(total))}
                style={{ width: `${total ?? 0}%` }}
              />
            </div>
            <span
              className={cn('absolute -top-1 h-[18px] w-0.5', TRILHO.minimo)}
              style={{ left: `${ADHERENCE_THRESHOLD}%` }}
            />
            <span
              className={cn(
                'relative mt-1 block w-fit -translate-x-1/2 text-[11px] font-medium',
                TEXTO_DE_ESTADO.atencao
              )}
              style={{ left: `${ADHERENCE_THRESHOLD}%` }}
            >
              mínimo {ADHERENCE_THRESHOLD}%
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Badge
              variant="outline"
              className="font-normal"
            >
              {encaixe.aderencia.coverage.answeredAxes} de{' '}
              {encaixe.aderencia.coverage.totalAxes} temas medidos
            </Badge>
            {encaixe.temBase && total !== null ? (
              <FaixaBadge faixa={faixaDeAderencia(total)} />
            ) : (
              <Badge
                variant="outline"
                className="font-normal"
              >
                sem base suficiente para posição
              </Badge>
            )}
          </div>
        </div>

        {/*
         * A média é o perfil, a dispersão é o diagnóstico: quando gestão e
         * equipe respondem diferente, quem lê precisa saber — é o ambiente da
         * equipe que a pessoa encontra no primeiro mês.
         */}
        {encaixe.divergentes > 0 ? (
          <p className="text-sm text-muted-foreground">
            Nesta empresa, gestão e equipe respondem diferente em{' '}
            {plural(encaixe.divergentes, 'tema', 'temas')}. A leitura acima usa
            a média declarada; a divergência fica registrada na aba{' '}
            <em>Como a empresa trabalha</em>.
          </p>
        ) : null}

        <div className="grid gap-5 @3xl/leitura:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
          <div className="rounded-lg border bg-card p-3">
            <RadarDeAderencia
              pontos={encaixe.aderencia.byAxis}
              primeiroNome={primeiroNome}
            />
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-0.5">
              <h3 className="text-sm font-medium">
                Em que {primeiroNome} combina e em que difere
              </h3>
              <p className="text-xs text-muted-foreground">
                {COPY.axes.label} com o peso declarado pela empresa, o trilho
                com o mínimo marcado e os dois lados em números.
              </p>
            </div>
            <PontosDoDia
              pontos={encaixe.aderencia.byAxis}
              primeiroNome={primeiroNome}
            />
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex-col items-start gap-2 border-t">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <Link href={iel.companies.byId(encaixe.empresa.id)}>
              Abrir a empresa
              <IconArrowRight
                aria-hidden="true"
                className="size-3.5"
              />
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <Link href={iel.companies.cultureMapById(encaixe.empresa.id)}>
              <IconMap aria-hidden="true" />
              Ver o mapa desta empresa
            </Link>
          </Button>
        </div>
        {vagas.length > 0 ? (
          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
            <span>Vagas abertas nesta empresa:</span>
            <ul className="flex flex-wrap gap-x-3 gap-y-1">
              {vagas.map((vaga) => (
                <li key={vaga.id}>
                  <Link
                    href={iel.jobs.byId(vaga.id).index}
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    {vaga.title}
                  </Link>{' '}
                  · {JOB_STAGE_LABEL[vaga.stage]}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Sem vaga aberta nesta empresa agora. O encaixe continua valendo para
            a próxima que abrir.
          </p>
        )}
      </CardFooter>
    </Card>
  );
}
