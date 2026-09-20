'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ValorDaEscala } from '@/features/iel-demo/analysis/instrumento';
import {
  gerarLeituraPessoal,
  type ContextoDaLeitura,
  type LeituraPessoal as Leitura,
  type PapelDaLeitura
} from '@/features/iel-demo/analysis/leitura-pessoal';
import { SparklesIcon } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@workspace/ui/shadcn/card';

import { PREENCHIMENTO_DO_TOM } from '../metricas/cores';

/**
 * A devolutiva pessoal, no fim do questionário.
 *
 * Quem responde recebe algo de volta, e o recebe **na hora**: a regra fixa
 * (`analysis/leitura-pessoal.ts`) roda no navegador, sem esperar rede. Em
 * seguida o cartão pede a `/api/iel/leitura-pessoal` uma versão reescrita
 * pelo Mind; se ela vier (`origem: 'mind'`), o texto troca com uma
 * transição discreta e uma linha diz que foi revisado. Se não vier, ou
 * demorar mais de 6 s, fica a regra — sem aviso de erro, porque não houve
 * erro: a devolutiva é a regra, o Mind é polimento.
 *
 * O que este cartão não mostra, de propósito: percentual, gráfico ou
 * comparação com a empresa. Isso é da analista (PRODUTO.md §5.1); aqui é o
 * que a pessoa disse, do jeito dela. E o que ele não manda para a rota: o
 * nome. `primeiroNome` fica na tela.
 */

export type LeituraPessoalProps = {
  papel: PapelDaLeitura;
  respostas: Record<string, ValorDaEscala>;
  /** Só candidato; o colaborador é anônimo. Nunca sai daqui. */
  primeiroNome?: string;
  contexto?: ContextoDaLeitura;
};

/** Quanto o cartão espera pelo Mind antes de desistir, em silêncio. */
const ESPERA_PELO_MIND_MS = 14_000;

/** Duração da troca de texto: some, troca, volta. */
const TRANSICAO_MS = 180;

const TITULO_DO_AMBIENTE: Record<PapelDaLeitura, string> = {
  candidato: 'Um lugar que combina com você',
  colaborador: 'O que isso diz do lugar'
};

const QUEM_VE: Record<PapelDaLeitura, string> = {
  candidato:
    'Se o seu currículo for enviado, a empresa vê só o quanto vocês combinam por tema; este texto é seu.',
  colaborador: 'Ninguém mais vê este texto.'
};

const SEM_TRACO: Record<PapelDaLeitura, string> = {
  candidato:
    'Você ficou no meio-termo na maior parte das frases — e tudo bem: isso também é um jeito de responder.',
  colaborador:
    'As suas respostas ficaram no meio na maior parte das frases — e tudo bem: nem todo lugar é de um jeito só.'
};

export function LeituraPessoal({
  papel,
  respostas,
  primeiroNome,
  contexto
}: LeituraPessoalProps) {
  // A chave estável das respostas: o objeto pode ser recriado a cada render,
  // e a regra fixa não precisa rodar de novo se nada mudou.
  const chave = JSON.stringify(respostas);
  const regra = useMemo(
    () =>
      gerarLeituraPessoal(
        JSON.parse(chave) as Record<string, ValorDaEscala>,
        papel,
        contexto
      ),
    [chave, papel, contexto]
  );

  const [leitura, setLeitura] = useState<Leitura>(regra);
  const [visivel, setVisivel] = useState(true);

  useEffect(() => {
    setLeitura(regra);
    setVisivel(true);

    // Sem traço e sem nuance não há o que o Mind reescrever.
    if (regra.tracos.length === 0 && !regra.nuance) return;

    const controle = new AbortController();
    const relogio = setTimeout(() => controle.abort(), ESPERA_PELO_MIND_MS);
    let troca: ReturnType<typeof setTimeout> | null = null;

    fetch('/api/iel/leitura-pessoal', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        papel,
        respostas: JSON.parse(chave) as Record<string, ValorDaEscala>,
        ...(contexto ? { contexto } : {})
      }),
      signal: controle.signal
    })
      .then((resposta) => (resposta.ok ? resposta.json() : null))
      .then((corpo: Leitura | null) => {
        if (!corpo || corpo.origem !== 'mind') return;
        // Some, troca, volta: a pessoa percebe que o texto mudou sem que
        // ele pule na tela.
        setVisivel(false);
        troca = setTimeout(() => {
          setLeitura(corpo);
          setVisivel(true);
        }, TRANSICAO_MS);
      })
      .catch(() => {
        // Rede, timeout, 429: fica a regra fixa, e ninguém precisa saber.
      })
      .finally(() => clearTimeout(relogio));

    return () => {
      controle.abort();
      clearTimeout(relogio);
      if (troca) clearTimeout(troca);
    };
  }, [regra, chave, papel, contexto]);

  const saudacao =
    papel === 'candidato'
      ? `${primeiroNome ? `${primeiroNome}, isto` : 'Isto'} é o que você contou sobre o seu jeito de trabalhar, nas suas palavras.`
      : 'Montado só com as suas respostas, sem o seu nome.';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          <h2>{leitura.titulo}</h2>
        </CardTitle>
        <CardDescription className="leading-relaxed">
          {saudacao}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          aria-live="polite"
          data-origem={leitura.origem}
          className={`flex flex-col gap-5 motion-safe:transition-opacity motion-safe:duration-200 ${visivel ? 'opacity-100' : 'opacity-0'}`}
        >
          {leitura.tracos.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {leitura.tracos.map((traco) => (
                <li
                  key={traco.tema}
                  className="flex gap-3"
                >
                  <span
                    aria-hidden="true"
                    className={`mt-[9px] size-2 shrink-0 rounded-full ${PREENCHIMENTO_DO_TOM.pessoa}`}
                  />
                  <p className="text-[15px] leading-relaxed text-foreground">
                    {traco.frase}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[15px] leading-relaxed text-foreground">
              {SEM_TRACO[papel]}
            </p>
          )}

          {leitura.ambiente.length > 0 ? (
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-medium">
                {TITULO_DO_AMBIENTE[papel]}
              </h3>
              <ul className="flex flex-col gap-1.5">
                {leitura.ambiente.map((linha) => (
                  <li
                    key={linha}
                    className="text-sm leading-relaxed text-muted-foreground"
                  >
                    {linha}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {leitura.nuance ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {leitura.nuance}
            </p>
          ) : null}

          {leitura.origem === 'mind' ? (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <SparklesIcon
                aria-hidden="true"
                className="size-3.5"
              />
              Texto revisado pelo Mind
            </p>
          ) : null}
        </div>
      </CardContent>
      <CardFooter className="flex-col items-start gap-1.5">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {leitura.aviso}
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {QUEM_VE[papel]}
        </p>
      </CardFooter>
    </Card>
  );
}
