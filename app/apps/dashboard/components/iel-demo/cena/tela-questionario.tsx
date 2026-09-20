'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { IconLoader2 } from '@tabler/icons-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import { Separator } from '@workspace/ui/shadcn/separator';

import { FitQuestionnaireScreen } from '../candidate/fit-questionnaire-screen';

export type ModoDoQuestionario = 'iframe' | 'embutido';

/**
 * Quanto a cena espera o iframe antes de desistir dele.
 *
 * O iframe depende de um cabeçalho de resposta (`X-Frame-Options`) que é
 * decidido fora daqui, por variável de ambiente, e pode estar errado em
 * produção sem ninguém perceber. Quando ele é recusado, o navegador não
 * avisa: fica um retângulo vazio, que no telão é a cena morrendo no
 * último ato. Três segundos é mais do que a página real leva para abrir na
 * mesma origem; passando disso, o celular monta o componente direto — a
 * mesma tela, o mesmo estado — e a apresentação segue.
 */
const ESPERA_DO_IFRAME_MS = 3000;

/**
 * Ato 3: o questionário real, dentro do celular.
 *
 * Primeiro um "abrindo" curto, com a marca; depois a tela de verdade. Em
 * `iframe` é a página real carregada pela rede, a 390 px, como no celular
 * do candidato; em `embutido` é o mesmo componente da página, montado aqui
 * com o mesmo estado — a única diferença é que não passa pela rede. A
 * resposta dada aqui é a que aparece na mesa da analista.
 */
export function TelaQuestionario({
  applicationId,
  href,
  modo,
  aberto
}: {
  applicationId: string;
  /** A rota real do questionário. */
  href: string;
  modo: ModoDoQuestionario;
  /** Falso enquanto "abre"; verdadeiro quando o questionário está na tela. */
  aberto: boolean;
}) {
  const reduzido = useReducedMotion();

  /*
   * O iframe tem uma chance; se não carregar a tempo, a cena cai para o
   * componente montado direto e não volta atrás — trocar de novo no meio da
   * resposta perderia o que já foi respondido na tela.
   */
  const [desistiuDoIframe, setDesistiuDoIframe] = useState(false);
  const [iframeCarregou, setIframeCarregou] = useState(false);
  const usaIframe = modo === 'iframe' && !desistiuDoIframe;

  useEffect(() => {
    if (!aberto || !usaIframe || iframeCarregou) return;
    const id = window.setTimeout(
      () => setDesistiuDoIframe(true),
      ESPERA_DO_IFRAME_MS
    );
    return () => window.clearTimeout(id);
  }, [aberto, usaIframe, iframeCarregou]);

  return (
    <div className="absolute inset-0 bg-background">
      <AnimatePresence
        mode="wait"
        initial={false}
      >
        {aberto ? (
          <motion.div
            key="questionario"
            data-cena-questionario=""
            className="absolute inset-0 pt-12 select-text"
            initial={reduzido ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            {usaIframe ? (
              <iframe
                src={href}
                title="Questionário da vaga, como chega no celular"
                className="size-full border-0 bg-background"
                /*
                 * Um iframe recusado por cabeçalho dispara `load` com a
                 * página de erro do navegador, e não `error`: os dois
                 * caminhos param o relógio, e quem decide se deu certo é o
                 * próprio conteúdo — se não deu, o retângulo fica vazio.
                 * Por isso o `load` só conta como sucesso quando o
                 * documento de dentro pode ser lido, o que na mesma origem
                 * é verdade e num bloqueio não é.
                 */
                onLoad={(evento) => {
                  try {
                    const documento = evento.currentTarget.contentDocument;
                    if (documento && documento.body.childElementCount > 0) {
                      setIframeCarregou(true);
                      return;
                    }
                  } catch {
                    // Documento inacessível: o quadro não é nosso.
                  }
                  setDesistiuDoIframe(true);
                }}
                onError={() => setDesistiuDoIframe(true)}
              />
            ) : (
              <div className="flex h-full flex-col overflow-y-auto">
                {/*
                 * O mesmo cabeçalho da tela por link (layout/iel-shell.tsx):
                 * a marca e quem fala com o candidato.
                 */}
                <header className="flex h-12 shrink-0 items-center gap-2 px-4">
                  <Image
                    src="/marca/mindrh-wordmark.png"
                    alt="Mind RH"
                    width={2624}
                    height={613}
                    className="h-5 w-auto"
                  />
                  <Separator
                    orientation="vertical"
                    className="data-[orientation=vertical]:h-4"
                  />
                  <span className="truncate text-xs text-muted-foreground">
                    IEL · Centro de Empregos
                  </span>
                </header>
                <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-6">
                  <FitQuestionnaireScreen applicationId={applicationId} />
                </main>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="abrindo"
            aria-hidden="true"
            className="absolute inset-0 flex flex-col items-center justify-center gap-5"
            initial={reduzido ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduzido ? undefined : { opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Image
              src="/marca/mindrh-wordmark.png"
              alt=""
              width={2624}
              height={613}
              className="h-7 w-auto"
            />
            <span className="flex items-center gap-2 text-[13px] text-muted-foreground">
              <IconLoader2 className="size-4 animate-spin" />
              Abrindo o questionário
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
