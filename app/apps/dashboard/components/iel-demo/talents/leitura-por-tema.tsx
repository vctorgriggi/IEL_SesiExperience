'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { respostaDentroDaValidade } from '@/features/iel-demo/analysis/candidate-questionnaire';
import {
  CULTURE_SCALE_MAX,
  CULTURE_SCALE_MIN
} from '@/features/iel-demo/analysis/culture';
import { FIT_AXES } from '@/features/iel-demo/analysis/fit-axes';
import {
  ESCALA_CONCORDANCIA,
  type ValorDaEscala
} from '@/features/iel-demo/analysis/instrumento';
import {
  leituraPorTema,
  MEIO_DA_ESCALA,
  rotuloDaTendencia,
  type LeituraDoTema
} from '@/features/iel-demo/analysis/leitura-por-tema';
import { COPY } from '@/features/iel-demo/copy';
import { plural } from '@/features/iel-demo/format';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  getApplicationsByTalent,
  getRespostasDaPessoa,
  validadeDasRespostas
} from '@/features/iel-demo/state/selectors';
import { nowIso } from '@/features/iel-demo/state/storage';

import { routes } from '@workspace/routes';
import { Alert } from '@workspace/ui';
import { cn } from '@workspace/ui/lib/utils';
import { Badge } from '@workspace/ui/shadcn/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@workspace/ui/shadcn/card';

import { BADGE_DE_ESTADO, LADO, TRILHO } from '../metricas/cores';
import { formatarData } from '../shared/datas';

/**
 * Como a pessoa prefere trabalhar, tema a tema, sem empresa do outro lado.
 *
 * A aba "Onde ela se encaixa" compara; esta só lê. É a resposta à pergunta
 * "na visão de quem?": na dela. Cada linha é um tema do instrumento, o
 * trilho de 1 a 5 com o marcador onde a média dela caiu, a palavra da
 * tendência e a frase pronta que ela mesma recebeu ao terminar o
 * questionário (`analysis/leitura-por-tema.ts`).
 *
 * O que a tela não faz, de propósito: não dá nota, não ordena os temas por
 * "melhor", não chama nada de perfil, e não muda quando a empresa muda —
 * é o que a linha do rodapé diz. Tema que ela não respondeu aparece como
 * ausência, nunca como zero ou "meio".
 */

/** Um tema sem resposta, dito como tal. */
type LinhaDoTema =
  | { tema: (typeof FIT_AXES)[number]; leitura: LeituraDoTema }
  | { tema: (typeof FIT_AXES)[number]; leitura: null };

/**
 * O trilho de cinco pontos, só desenho: a informação vai escrita ao lado
 * (a palavra e a frase) e em `sr-only` (o degrau da escala mais próximo).
 */
function TrilhoDaPessoa({ leitura }: { leitura: LeituraDoTema }) {
  const percentual =
    ((leitura.media - CULTURE_SCALE_MIN) /
      (CULTURE_SCALE_MAX - CULTURE_SCALE_MIN)) *
    100;
  const degraus = ESCALA_CONCORDANCIA.map((entrada) => entrada.valor);

  return (
    <div
      aria-hidden="true"
      className="relative h-4 w-28 shrink-0"
    >
      {/* Marcadores numa faixa recuada: no 1 e no 5 metade do círculo ficaria fora. */}
      <div className="absolute inset-x-1.5 inset-y-0">
        <span
          className={cn(
            'absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full',
            TRILHO.trilha
          )}
        />
        {degraus.map((degrau) => (
          <span
            key={degrau}
            className={cn(
              'absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full',
              // O meio ("tanto faz") fica um pouco mais marcado: é a referência
              // de onde "tende a" começa.
              degrau === MEIO_DA_ESCALA
                ? 'bg-muted-foreground/60'
                : 'bg-muted-foreground/30'
            )}
            style={{
              left: `${((degrau - CULTURE_SCALE_MIN) / (CULTURE_SCALE_MAX - CULTURE_SCALE_MIN)) * 100}%`
            }}
          />
        ))}
        <span
          className={cn(
            'absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-background',
            LADO.pessoa.preenchimento
          )}
          style={{ left: `${percentual}%` }}
        />
      </div>
    </div>
  );
}

function BadgeDaTendencia({ leitura }: { leitura: LeituraDoTema }) {
  const noMeio = leitura.lado === 'meio';
  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium',
        noMeio
          ? BADGE_DE_ESTADO.neutro
          : cn('border-transparent', LADO.pessoa.fundo, LADO.pessoa.texto)
      )}
    >
      {rotuloDaTendencia(leitura)}
    </Badge>
  );
}

export function LeituraPorTemaDaPessoa({
  talentId,
  talentName
}: {
  talentId: string;
  talentName: string;
}) {
  const { state } = useIelDemo();
  const iel = routes.dashboard.iel;
  const primeiroNome = talentName.split(' ')[0] ?? talentName;

  /*
   * Só o que vale hoje: resposta vencida é como se não existisse
   * (`respostas-da-pessoa.ts`, regra 2). A última resposta a cada frase já
   * vem escolhida pelo índice.
   */
  const respostas = useMemo(() => {
    const daPessoa = getRespostasDaPessoa(state, talentId);
    const agora = nowIso();
    const valores: Record<string, ValorDaEscala> = {};
    if (!daPessoa) return valores;
    for (const resposta of daPessoa.porFrase.values()) {
      if (respostaDentroDaValidade(resposta.answeredAt, agora)) {
        valores[resposta.itemId] = resposta.value;
      }
    }
    return valores;
  }, [state, talentId]);

  const leituras = useMemo(() => leituraPorTema(respostas), [respostas]);
  const validade = useMemo(
    () => validadeDasRespostas(state, talentId),
    [state, talentId]
  );

  const linhas: LinhaDoTema[] = FIT_AXES.map((tema) => ({
    tema,
    leitura: leituras.find((leitura) => leitura.tema === tema.id) ?? null
  }));
  const respondidos = leituras.length;
  const frases = Object.keys(respostas).length;

  if (respondidos === 0) {
    /*
     * Para onde apontar: o questionário abre por candidatura. Com uma, o
     * link vai direto; sem nenhuma, vai para a tela dos questionários.
     */
    const candidatura = getApplicationsByTalent(state, talentId)[0] ?? null;
    return (
      <Alert variant="default">
        {primeiroNome} ainda não respondeu o questionário de como prefere
        trabalhar, então não há leitura por tema. Ausência não vira zero nem
        meio-termo: enquanto a resposta não vier, esta aba fica sem marcador.{' '}
        <Link
          className="underline"
          href={
            candidatura
              ? iel.applications.byId(candidatura.id).fit
              : iel.candidates
          }
        >
          {candidatura ? 'Abrir o questionário' : 'Ver os questionários'}
        </Link>
        .
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="text-base font-semibold">
          Como {primeiroNome} prefere trabalhar
        </CardTitle>
        <CardDescription>
          {plural(respondidos, 'tema respondido', 'temas respondidos')} de{' '}
          {FIT_AXES.length}, em {plural(frases, 'frase', 'frases')}. Para que
          lado {primeiroNome} pende em cada um — nas próprias palavras, sem
          empresa do outro lado.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <ul className="flex flex-col divide-y">
          {linhas.map(({ tema, leitura }) => (
            <li
              key={tema.id}
              className="flex flex-col gap-1.5 py-3 first:pt-0 last:pb-0 sm:grid sm:grid-cols-[9.5rem_minmax(0,1fr)] sm:items-start sm:gap-x-4"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">
                  {COPY.axis(tema.id)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {tema.description}
                </span>
              </div>

              {leitura ? (
                <div className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <TrilhoDaPessoa leitura={leitura} />
                    <span className="sr-only">
                      Marcador em {leitura.media.toFixed(1)} de{' '}
                      {CULTURE_SCALE_MAX}, no sentido do tema.
                    </span>
                    <BadgeDaTendencia leitura={leitura} />
                    <span className="text-xs text-muted-foreground">
                      {plural(leitura.frases, 'frase', 'frases')}
                    </span>
                  </div>
                  <p className="text-sm">
                    {leitura.lado === 'meio' ? (
                      leitura.frase
                    ) : (
                      <>&ldquo;{leitura.frase}&rdquo;</>
                    )}
                  </p>
                </div>
              ) : (
                /*
                 * Sem trilho e sem marcador: um ponto no meio diria "tanto
                 * faz", e ela não disse isso. A falta é escrita.
                 */
                <p className="text-sm text-muted-foreground">
                  Ainda não respondeu frase deste tema.
                </p>
              )}
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter className="flex-col items-start gap-1 border-t text-xs text-muted-foreground">
        <p>
          É o que {primeiroNome} respondeu, do seu jeito. Não é nota, e não muda
          com a empresa.
        </p>
        {validade?.respondidoEm && validade.validaAte ? (
          <p>
            Última resposta em {formatarData(validade.respondidoEm)}; vale até{' '}
            {formatarData(validade.validaAte)}. Depois disso as frases voltam a
            ser perguntadas.
          </p>
        ) : null}
      </CardFooter>
    </Card>
  );
}
