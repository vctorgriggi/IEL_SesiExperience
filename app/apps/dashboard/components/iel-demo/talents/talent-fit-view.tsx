'use client';

import {
  ADHERENCE_THRESHOLD,
  type AdherenceAxisEntry,
  type AdherenceResult
} from '@/features/iel-demo/analysis/adherence';
import {
  CULTURE_SCALE_MAX,
  CULTURE_SCALE_MIN,
  getCultureQuestion,
  type CultureOption,
  type CultureOptionValue
} from '@/features/iel-demo/analysis/culture';
import {
  getFitAxis,
  type FitAxisId
} from '@/features/iel-demo/analysis/fit-axes';
import { getFitInsights } from '@/features/iel-demo/analysis/fit-insights';
import { COPY, type EstadoDeLeitura } from '@/features/iel-demo/copy';
import { plural } from '@/features/iel-demo/format';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  AXIS_WEIGHT_LABEL,
  getAdherence,
  getAxisWeights,
  getClarificationsByApplication,
  getFitReading,
  getJobRanking,
  getReusedEvidences,
  getTalentJourney,
  JOURNEY_OUTCOME_LABEL,
  type FitReadingEntry
} from '@/features/iel-demo/state/selectors';
import type { Application, Job, Talent } from '@/features/iel-demo/types';
import { Check, CircleAlert, CircleDashed, Lightbulb, X } from 'lucide-react';

import { cn } from '@workspace/ui/lib/utils';
import { Badge } from '@workspace/ui/shadcn/badge';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@workspace/ui/shadcn/card';
import {
  Table,
  TableBody,
  TableCaption,
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
  BADGE_DE_ESTADO,
  barraDaAderencia,
  corDaAderencia,
  LADO,
  TEXTO_DE_ESTADO,
  textoDaAderencia,
  TRILHO,
  type EstadoDeCor
} from '../metricas/cores';
import { formatarData } from '../shared/datas';

/**
 * O glossário aplicado ao texto que vem pronto da regra.
 *
 * As frases de `getFitInsights` ainda falam em "eixo" e "coleta dirigida" —
 * vocabulário de quem desenhou o instrumento, não de quem lê a tela. O texto
 * mora em `features/`, que é domínio de outra mão; enquanto ele não for
 * reescrito lá, a troca acontece aqui, na fronteira da apresentação.
 */
const JARGAO: [RegExp, string][] = [
  [/\bcoleta dirigida\b/gi, 'pergunta à pessoa'],
  [/\beixos\b/gi, 'pontos do dia a dia'],
  [/\beixo\b/gi, 'ponto do dia a dia'],
  [/\bencaminhamento\b/gi, 'envio do currículo'],
  [/\baderência\b/gi, 'o quanto combina']
];

export function semJargao(texto: string): string {
  return JARGAO.reduce(
    (frase, [padrao, troca]) => frase.replace(padrao, troca),
    texto
  );
}

/** Posição de um valor da escala 1..3 no trilho, em porcentagem. */
function posicao(valor: number): number {
  const amplitude = CULTURE_SCALE_MAX - CULTURE_SCALE_MIN;
  return ((valor - CULTURE_SCALE_MIN) / amplitude) * 100;
}

/**
 * O trilho de um ponto do dia a dia.
 *
 * Um quadrado azul marca onde a empresa está, em média; um círculo
 * verde-azulado marca onde a pessoa está. Entre os dois, uma faixa clara diz a
 * distância: verde quando estão perto, vermelha quando estão longe. Lado
 * nenhum vira zero quando falta: o marcador simplesmente não aparece, e o que
 * sobra no trilho é o silêncio, visível.
 */
function Trilho({ entry }: { entry: AdherenceAxisEntry | null }) {
  const empresa = entry?.companyMean ?? null;
  const pessoa = entry?.candidateValue ?? null;
  const cinza = empresa === null || pessoa === null;
  const perto = (entry?.adherence ?? 0) >= ADHERENCE_THRESHOLD;

  return (
    <div
      aria-hidden="true"
      className={cn('relative mr-6 h-1.5 rounded-full', TRILHO.trilha)}
    >
      {empresa === null || pessoa === null ? null : (
        <span
          aria-hidden="true"
          className={cn(
            'absolute -top-0.5 h-2.5 rounded-full',
            perto ? TRILHO.perto : TRILHO.longe
          )}
          style={{
            left: `${Math.min(posicao(empresa), posicao(pessoa))}%`,
            width: `${Math.abs(posicao(empresa) - posicao(pessoa))}%`
          }}
        />
      )}
      {empresa === null ? null : (
        <span
          aria-hidden="true"
          className={cn(
            'absolute -top-1 size-3.5 -translate-x-1/2 rounded-xs',
            cinza ? 'bg-muted-foreground/50' : LADO.empresa.preenchimento
          )}
          style={{ left: `${posicao(empresa)}%` }}
        />
      )}
      {pessoa === null ? null : (
        <span
          aria-hidden="true"
          className={cn(
            'absolute -top-1 size-3.5 -translate-x-1/2 rounded-full border-[3px] bg-background',
            cinza ? 'border-muted-foreground/60' : LADO.pessoa.borda
          )}
          style={{ left: `${posicao(pessoa)}%` }}
        />
      )}
    </div>
  );
}

/**
 * O rótulo da alternativa que a média da empresa mais se aproxima.
 *
 * A empresa responde por várias vozes — gestão, RH, equipe — e a média sai
 * contínua (1,67). Ninguém marcou "1,67": o que a analista precisa ler é qual
 * das três alternativas do questionário aquela média descreve. Empate entre
 * duas não acontece na prática (a escala tem passo 1 e a média raramente cai
 * exatamente no meio), e quando cai, a primeira da lista ganha — o texto
 * abaixo, com o percentual do ponto, é que carrega a precisão.
 */
function rotuloDaEmpresa(
  axisId: FitAxisId,
  media: number | null
): string | null {
  if (media === null) return null;
  const question = getCultureQuestion(axisId);
  if (!question) return null;
  const opcao = question.options.reduce<CultureOption | null>(
    (melhor, atual) =>
      melhor === null ||
      Math.abs(atual.value - media) < Math.abs(melhor.value - media)
        ? atual
        : melhor,
    null
  );
  return opcao?.label ?? null;
}

/** O rótulo da alternativa que a pessoa marcou no questionário. */
function rotuloDaPessoa(
  axisId: FitAxisId,
  valor: CultureOptionValue | null
): string | null {
  if (valor === null) return null;
  const question = getCultureQuestion(axisId);
  return (
    question?.options.find((option) => option.value === valor)?.label ?? null
  );
}

/**
 * O estado de um ponto, lido do questionário e não do texto livre.
 *
 * A ordem importa: primeiro se pergunta se há os dois lados, e só depois se
 * eles combinam. Falta da empresa e falta da pessoa são ausências diferentes
 * e a tela diz qual das duas é — quem lê precisa saber a quem cobrar.
 */
function estadoDoPonto(entry: AdherenceAxisEntry): EstadoDeLeitura {
  if (entry.companyMean === null) return 'faltando';
  if (entry.candidateValue === null) return 'sem-resposta';
  return (entry.adherence ?? 0) >= ADHERENCE_THRESHOLD ? 'combina' : 'difere';
}

const TOM_DO_PONTO: Record<EstadoDeLeitura, EstadoDeCor> = {
  combina: 'combina',
  difere: 'difere',
  faltando: 'atencao',
  'sem-resposta': 'neutro'
};

function EstadoDoPonto({ estado }: { estado: EstadoDeLeitura }) {
  const Icone =
    estado === 'combina'
      ? Check
      : estado === 'difere'
        ? X
        : estado === 'faltando'
          ? CircleAlert
          : CircleDashed;

  return (
    <Badge
      variant="outline"
      className={cn('px-1.5', BADGE_DE_ESTADO[TOM_DO_PONTO[estado]])}
    >
      <Icone aria-hidden="true" />
      {COPY.estado(estado)}
    </Badge>
  );
}

/**
 * "Empresa: por conta própria · Ana: com alguém junto" — as duas alternativas
 * marcadas, nas palavras do questionário.
 *
 * Quando a empresa não fecha o ponto a frase não finge um lado: diz que
 * faltam respostas. Zero não é resposta, e "—" não explica de quem é a falta.
 */
function doisLados(entry: AdherenceAxisEntry, primeiroNome: string): string {
  const empresa =
    rotuloDaEmpresa(entry.axisId, entry.companyMean) ??
    'sem respostas suficientes';
  const pessoa =
    rotuloDaPessoa(entry.axisId, entry.candidateValue) ?? 'ainda não respondeu';
  return `Empresa: ${empresa} · ${primeiroNome}: ${pessoa}`;
}

/**
 * A evidência em texto livre, quando existe.
 *
 * A empresa às vezes descreve a condição com as próprias palavras e a pessoa
 * às vezes escreveu o que espera. Isso enriquece, mas não mede: fica numa
 * segunda linha menor, abaixo das alternativas marcadas, e nunca ocupa o
 * lugar delas.
 */
function evidencia(entry: FitReadingEntry | null): string | null {
  if (!entry) return null;
  const partes = [entry.condition?.value, entry.preference?.value].filter(
    (parte): parte is string => Boolean(parte)
  );
  return partes.length > 0 ? partes.join(' · ') : null;
}

/** Os dois números que respondem a pergunta da tela, lado a lado. */
export function FitCards({
  adherence,
  technicalMatch,
  rank,
  total
}: {
  adherence: AdherenceResult | null;
  technicalMatch: number | null;
  rank: number | null;
  total: number;
}) {
  const percentual = adherence?.total ?? null;
  const medidos = adherence?.coverage.answeredAxes ?? 0;
  const pontos = adherence?.coverage.totalAxes ?? 5;
  const faltam = pontos - medidos;

  return (
    // Os dois cartões com a mesma altura e o mesmo desenho: rótulo com duas
    // linhas reservadas (o da esquerda quebra por causa do selo), número,
    // barra e a nota colada embaixo, alinhada com a do vizinho.
    <div className="grid items-stretch gap-4 @md/fit:grid-cols-2">
      <Card className="h-full">
        <CardHeader>
          <CardDescription className="min-h-10">
            {COPY.fit.label}
          </CardDescription>
          <CardTitle
            className={cn(
              'text-3xl font-semibold tracking-tight tabular-nums',
              percentual === null ? undefined : textoDaAderencia(percentual)
            )}
          >
            {percentual === null ? (
              <>
                <span aria-hidden="true">—</span>
                <span className="sr-only">Ainda sem medida</span>
              </>
            ) : (
              `${Math.round(percentual)}%`
            )}
          </CardTitle>
          {percentual === null ? null : (
            <CardAction>
              <Badge
                variant="outline"
                className={BADGE_DE_ESTADO[corDaAderencia(percentual)]}
              >
                {percentual >= ADHERENCE_THRESHOLD ? (
                  <Check aria-hidden="true" />
                ) : (
                  <X aria-hidden="true" />
                )}
                {percentual >= ADHERENCE_THRESHOLD ? 'acima' : 'abaixo'} de{' '}
                {ADHERENCE_THRESHOLD}%
              </Badge>
            </CardAction>
          )}
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-1.5">
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
                className={cn(
                  'h-full rounded-full',
                  barraDaAderencia(percentual)
                )}
                style={{ width: `${percentual ?? 0}%` }}
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
          <p className="mt-auto text-xs text-muted-foreground">
            {percentual === null
              ? COPY.fit.semResposta
              : `medido em ${medidos} de ${pontos} pontos${
                  faltam > 0
                    ? ` · ${plural(faltam, 'ponto ainda em aberto', 'pontos ainda em aberto')}`
                    : ''
                }`}
          </p>
        </CardContent>
      </Card>

      <Card className="h-full">
        <CardHeader>
          <CardDescription className="min-h-10">
            {COPY.technical.label}
          </CardDescription>
          <CardTitle className="text-3xl font-semibold tracking-tight tabular-nums">
            {technicalMatch === null ? (
              <>
                <span aria-hidden="true">—</span>
                <span className="sr-only">Sem percentual</span>
              </>
            ) : (
              `${technicalMatch}%`
            )}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">Empregare</Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-1.5">
          <div
            aria-hidden="true"
            className={cn('h-2.5 overflow-hidden rounded-full', TRILHO.trilha)}
          >
            <div
              className={cn('h-full rounded-full', LADO.empresa.preenchimento)}
              style={{ width: `${technicalMatch ?? 0}%` }}
            />
          </div>
          <p className="mt-auto text-xs text-muted-foreground">
            {rank === null
              ? 'sem posição nesta vaga'
              : `${rank}º de ${total} nesta vaga`}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Esta pessoa nesta vaga — o mesmo conteúdo na gaveta e na página.
 *
 * A gaveta abre sobre a lista, para decidir sem perder o lugar; a página
 * existe para quem chegou por link. Seria a mesma leitura escrita duas vezes
 * se o conteúdo não morasse num componente só.
 */
export function TalentFitView({
  job,
  talent,
  application
}: {
  job: Job;
  talent: Talent;
  application: Application;
}) {
  const { state } = useIelDemo();

  const reading = getFitReading(state, job, talent.id);
  const weights = getAxisWeights(state, job);
  const insights = getFitInsights(reading, weights);
  const ranking = getJobRanking(state, job.id);
  const entry =
    ranking.find((item) => item.application.id === application.id) ?? null;
  /*
   * O ranking já traz a aderência de quem está nele; quem abriu a página por
   * link direto pode não estar (vaga encerrada, candidatura arquivada), e aí
   * a conta vem do estado pela candidatura. É a mesma função nos dois
   * caminhos — a tabela nunca fica sem os cinco pontos.
   */
  const adherence = entry?.adherence ?? getAdherence(state, application.id);
  const pontos = adherence?.byAxis ?? [];
  const primeiroNome = talent.name.split(' ')[0] ?? talent.name;

  const journey = getTalentJourney(state, talent.id);
  const reusadas = getReusedEvidences(state, talent.id);
  const perguntas = getClarificationsByApplication(state, application.id);
  const resumo = insights[0] ?? null;

  return (
    <div className="@container/fit flex flex-col gap-6">
      <FitCards
        adherence={adherence}
        technicalMatch={entry?.technicalMatch ?? null}
        rank={entry?.rank ?? null}
        total={ranking.length}
      />

      <Tabs
        defaultValue="pontos"
        className="gap-2"
      >
        <TabsList className="w-fit">
          <TabsTrigger value="pontos">{COPY.axes.label}</TabsTrigger>
          <TabsTrigger value="requisitos">Requisitos</TabsTrigger>
          <TabsTrigger value="sobre">Sobre a pessoa</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="pontos">
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableCaption className="sr-only">{`Pontos do dia a dia: onde a empresa e ${primeiroNome} estão em cada um`}</TableCaption>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead scope="col">Ponto do dia a dia</TableHead>
                  <TableHead
                    scope="col"
                    className="w-[200px]"
                  >
                    <span
                      aria-hidden="true"
                      className="inline-flex items-center gap-1.5"
                    >
                      <span
                        className={cn(
                          'size-2.5 rounded-xs',
                          LADO.empresa.preenchimento
                        )}
                      />
                      Empresa
                      <span className="text-muted-foreground">·</span>
                      <span
                        className={cn(
                          'size-2.5 rounded-full border-2 bg-background',
                          LADO.pessoa.borda
                        )}
                      />
                      {primeiroNome}
                    </span>
                    <span className="sr-only">
                      Posição da empresa e de {primeiroNome}
                    </span>
                  </TableHead>
                  <TableHead
                    scope="col"
                    className="w-[140px]"
                  >
                    Estado
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/*
                 * A linha de cada ponto vem do questionário — a média da
                 * empresa e a alternativa que a pessoa marcou —, que é a mesma
                 * fonte do percentual do cartão acima. Ler a tabela de um
                 * lugar e o número de outro foi o que produzia "86% · medido
                 * em 2 de 5" acima de cinco linhas dizendo "faltam respostas".
                 */}
                {pontos.map((eixo) => {
                  const axis = getFitAxis(eixo.axisId);
                  const estado = estadoDoPonto(eixo);
                  const textoLivre = evidencia(
                    reading.find((item) => item.axis.id === eixo.axisId) ?? null
                  );
                  return (
                    <TableRow key={eixo.axisId}>
                      <TableCell className="whitespace-normal">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-medium">{axis.label}</span>
                          <Badge
                            variant="secondary"
                            className="rounded-md px-1.5 text-[11px] font-medium text-muted-foreground"
                          >
                            {AXIS_WEIGHT_LABEL[eixo.weight]}
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {doisLados(eixo, primeiroNome)}
                        </p>
                        {textoLivre ? (
                          <p className="mt-0.5 text-xs text-muted-foreground/80">
                            {textoLivre}
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <Trilho entry={eixo} />
                      </TableCell>
                      <TableCell>
                        <EstadoDoPonto estado={estado} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="requisitos">
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableCaption className="sr-only">
                Requisitos desta vaga e se são obrigatórios
              </TableCaption>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead scope="col">Requisito da vaga</TableHead>
                  <TableHead
                    scope="col"
                    className="w-[160px]"
                  >
                    Obrigatoriedade
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {job.criteria.map((criterion) => (
                  <TableRow key={criterion.id}>
                    <TableCell className="whitespace-normal">
                      <span className="font-medium">{criterion.label}</span>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {criterion.confirmedBy}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="px-1.5 text-muted-foreground"
                      >
                        {criterion.required ? 'Obrigatório' : 'Complementar'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent
          value="sobre"
          className="flex flex-col gap-3 text-sm"
        >
          <p className="text-muted-foreground">{talent.summary}</p>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableCaption className="sr-only">{`Experiências de ${primeiroNome}`}</TableCaption>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead scope="col">Experiência</TableHead>
                  <TableHead
                    scope="col"
                    className="w-[160px]"
                  >
                    Período
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {talent.experiences.map((experience) => (
                  <TableRow key={experience.id}>
                    <TableCell className="whitespace-normal">
                      <span className="font-medium">
                        {experience.role} · {experience.organization}
                      </span>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {experience.activities}
                      </p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {experience.period}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {talent.declaredSkills.map((skill) => (
              <Badge
                key={skill}
                variant="secondary"
                className="rounded-md"
              >
                {skill}
              </Badge>
            ))}
          </div>
        </TabsContent>

        <TabsContent
          value="historico"
          className="flex flex-col gap-3 text-sm"
        >
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableCaption className="sr-only">{`Candidaturas de ${primeiroNome} e o resultado de cada uma`}</TableCaption>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead scope="col">Vaga</TableHead>
                  <TableHead
                    scope="col"
                    className="w-[220px]"
                  >
                    Resultado
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {journey.map((item) => (
                  <TableRow key={item.application.id}>
                    <TableCell className="whitespace-normal">
                      <span className="font-medium">
                        {item.job?.title ?? 'Vaga fora da base'}
                      </span>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {item.company?.name ?? '—'} ·{' '}
                        {formatarData(item.application.appliedAt)}
                      </p>
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      <Badge
                        variant="outline"
                        className="px-1.5 text-muted-foreground"
                      >
                        {JOURNEY_OUTCOME_LABEL[item.outcome]}
                      </Badge>
                      {item.managerNote ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          “{item.managerNote}”
                        </p>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground">
            {reusadas.length > 0
              ? `${plural(reusadas.length, 'registro reaproveitado', 'registros reaproveitados')} entre processos desta pessoa.`
              : 'Nenhum registro reaproveitado entre processos ainda.'}
            {perguntas.length > 0
              ? ` ${plural(perguntas.length, 'pergunta registrada', 'perguntas registradas')} nesta candidatura.`
              : ''}
          </p>
        </TabsContent>
      </Tabs>

      <Card className="bg-muted/40 shadow-none">
        <CardContent className="flex items-start gap-3">
          <Lightbulb className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">{COPY.reading.label}</span>
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              {resumo
                ? semJargao(`${resumo.title} ${resumo.detail}`)
                : 'Ainda não há ponto com os dois lados respondidos o suficiente para um resumo. Não é um resultado ruim: é um espaço em branco.'}
            </p>
            <span className="text-xs text-muted-foreground/80">
              Regra fixa, sem IA paga.
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
