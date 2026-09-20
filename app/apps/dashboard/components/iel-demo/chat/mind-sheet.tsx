'use client';

import { useMemo, useRef, useState, type FormEvent } from 'react';
import Image from 'next/image';
import { montarPendencias } from '@/components/iel-demo/overview/pendencias';
import { buildAssistantRequestPayload } from '@/features/iel-demo/ai/build-request';
import {
  assistantResponseSchema,
  MAX_PERGUNTA,
  type AssistantResponse
} from '@/features/iel-demo/ai/types';
import {
  candidaturasParaPergunta,
  contextoDaRota,
  pedeContato,
  perguntasSugeridas,
  RECUSA_DE_CONTATO,
  responderMind,
  saudacaoDoMind,
  SEM_MODELO,
  tipoDaPerguntaLivre,
  vagaDoContexto,
  type MindContexto,
  type MindPergunta,
  type MindResposta
} from '@/features/iel-demo/chat/mind';
import { montarContextoLivre } from '@/features/iel-demo/chat/mind-livre';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import { getJob } from '@/features/iel-demo/state/selectors';
import { IconArrowUp, IconRotate2 } from '@tabler/icons-react';

import { api, routes } from '@workspace/routes';
import { Badge } from '@workspace/ui/shadcn/badge';
import { Button } from '@workspace/ui/shadcn/button';
import { Input } from '@workspace/ui/shadcn/input';
import { ScrollArea } from '@workspace/ui/shadcn/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@workspace/ui/shadcn/sheet';

import { useMovimentoReduzido } from './use-voz';

export { contextoDaRota, type MindContexto };

/**
 * Mind, o assistente da analista, num `Sheet` à direita.
 *
 * A conversa é guiada por chips: cada chip é uma pergunta que o Mind sabe
 * responder a partir dos mesmos seletores da tela (`features/.../chat/mind`).
 * O campo livre manda a pergunta, com as palavras da analista, para
 * `/api/iel/assistant`. Com modelo ligado (Gemini), a resposta vem dele,
 * sobre dados pseudonimizados no servidor; sem modelo, o Mind é honesto e
 * diz que responde pelas sugestões. O campo nunca vira porta para contato de
 * pessoa: um pedido de telefone ou e-mail é recusado aqui mesmo, sem chamar
 * a API.
 */
export type MindSheetProps = {
  contexto: MindContexto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type Mensagem =
  | { id: string; autor: 'pessoa'; texto: string }
  | { id: string; autor: 'mind'; texto: string }
  | { id: string; autor: 'mind'; resposta: MindResposta };

/** Nome do modelo como a analista o lê no rodapé da resposta. */
function nomeDoModelo(corpo: AssistantResponse): string {
  if (corpo.provider === 'deepseek') {
    return `DeepSeek (${corpo.modelo ?? 'modelo padrão'})`;
  }
  if (corpo.provider === 'gemini') {
    return `Gemini (${corpo.modelo ?? 'modelo padrão'})`;
  }
  if (corpo.provider === 'anthropic') return 'Claude (Anthropic)';
  return corpo.provider;
}

/** Texto do provedor em parágrafos, sem o título que a regra fixa põe. */
function paragrafosDe(texto: string): string[] {
  return texto
    .split(/\n{2,}/)
    .map((paragrafo) => paragrafo.trim())
    .filter(Boolean);
}

export function MindSheet({ contexto, open, onOpenChange }: MindSheetProps) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Image
              src="/marca/simbolo.png"
              alt=""
              width={20}
              height={20}
              className="size-5"
            />
            <span>
              <strong className="font-semibold">Mind</strong>
              <span className="font-normal text-muted-foreground">
                {' '}
                · assistente do Mind RH
              </span>
            </span>
          </SheetTitle>
          <SheetDescription className="text-xs">
            Responde só com o que o seu perfil pode ver. Dados pessoais saem
            mascarados.
          </SheetDescription>
        </SheetHeader>
        {/* A conversa recomeça quando o contexto muda: a pergunta de uma vaga
            não vale para a outra. */}
        <ConversaMind
          key={`${contexto.tipo}:${contexto.id ?? ''}`}
          contexto={contexto}
        />
      </SheetContent>
    </Sheet>
  );
}

function ConversaMind({ contexto }: { contexto: MindContexto }) {
  const { state } = useIelDemo();
  const reduzir = useMovimentoReduzido();
  const [mensagens, setMensagens] = useState<Mensagem[]>(() => [
    { id: 'oi', autor: 'mind', texto: saudacaoDoMind(contexto) }
  ]);
  const [chipsVisiveis, setChipsVisiveis] = useState(true);
  const [pensando, setPensando] = useState(false);
  const [texto, setTexto] = useState('');
  const fimRef = useRef<HTMLDivElement>(null);
  const contador = useRef(0);

  const perguntas = useMemo(
    () => perguntasSugeridas(state, contexto),
    [state, contexto]
  );

  const novoId = () => {
    contador.current += 1;
    return `m${contador.current}`;
  };

  const rolar = () => {
    window.requestAnimationFrame(() =>
      fimRef.current?.scrollIntoView({
        block: 'end',
        behavior: reduzir ? 'auto' : 'smooth'
      })
    );
  };

  const acrescentar = (...novas: Mensagem[]) => {
    setMensagens((atuais) => [...atuais, ...novas]);
    rolar();
  };

  const perguntar = (pergunta: MindPergunta) => {
    const pendencias =
      contexto.tipo === 'hoje'
        ? montarPendencias(state).map((pendencia) => ({
            tipo: pendencia.tipo,
            titulo: pendencia.titulo,
            resumo: pendencia.resumo,
            verbo: pendencia.verbo
          }))
        : undefined;
    const resposta = responderMind(state, contexto, pergunta.id, {
      pendencias
    });
    setChipsVisiveis(false);
    acrescentar(
      { id: novoId(), autor: 'pessoa', texto: pergunta.texto },
      { id: novoId(), autor: 'mind', resposta }
    );
  };

  const perguntaLivre = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const pergunta = texto.trim();
    if (!pergunta || pensando) return;
    setTexto('');
    setChipsVisiveis(false);
    acrescentar({ id: novoId(), autor: 'pessoa', texto: pergunta });

    // Contato não sai daqui, e a pergunta nem chega à API.
    if (pedeContato(pergunta)) {
      acrescentar({ id: novoId(), autor: 'mind', texto: RECUSA_DE_CONTATO });
      setChipsVisiveis(true);
      return;
    }

    const jobId = vagaDoContexto(contexto);
    if (!jobId) {
      acrescentar({ id: novoId(), autor: 'mind', texto: SEM_MODELO });
      setChipsVisiveis(true);
      return;
    }

    // O tipo inferido só serve à regra fixa, se o modelo cair; com modelo,
    // quem manda é a pergunta.
    const kind = tipoDaPerguntaLivre(pergunta);
    setPensando(true);
    rolar();
    try {
      const selecionadas = candidaturasParaPergunta(state, jobId);
      const pendencias =
        contexto.tipo === 'hoje'
          ? montarPendencias(state).map(
              (pendencia) => `${pendencia.titulo}: ${pendencia.resumo}`
            )
          : [];
      const payload = {
        ...buildAssistantRequestPayload(state, jobId, selecionadas, kind),
        pergunta,
        contexto: montarContextoLivre(state, jobId, selecionadas, pendencias)
      };
      const resposta = await fetch(api.iel.assistant(), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (resposta.status === 429) {
        acrescentar({
          id: novoId(),
          autor: 'mind',
          texto:
            'Muitas perguntas seguidas. Espere um minuto e tente de novo; as sugestões continuam funcionando.'
        });
        setChipsVisiveis(true);
        return;
      }
      const corpo = assistantResponseSchema.parse(await resposta.json());
      const job = getJob(jobId);
      const fontes = [
        ...(job ? [job.title] : []),
        ...corpo.citations.map((citacao) => citacao.label)
      ].filter((fonte, indice, todas) => todas.indexOf(fonte) === indice);

      // Sem modelo ligado: o comportamento de sempre, honesto.
      if (corpo.provider === 'deterministic' && !corpo.aviso) {
        acrescentar({ id: novoId(), autor: 'mind', texto: SEM_MODELO });
        setChipsVisiveis(true);
        return;
      }

      // O modelo estava ligado, mas falhou: a regra fixa respondeu.
      if (corpo.provider === 'deterministic') {
        acrescentar({
          id: novoId(),
          autor: 'mind',
          resposta: {
            paragrafos: [
              corpo.aviso ?? SEM_MODELO,
              ...paragrafosDe(corpo.text)
            ],
            fontes,
            origem: { tipo: 'regra' },
            fecho: 'A decisão é sua.'
          }
        });
        return;
      }

      acrescentar({
        id: novoId(),
        autor: 'mind',
        resposta: {
          paragrafos: paragrafosDe(corpo.text),
          fontes,
          origem: { tipo: 'modelo', nome: nomeDoModelo(corpo) },
          fecho: 'A decisão é sua.'
        }
      });
    } catch {
      acrescentar({
        id: novoId(),
        autor: 'mind',
        texto:
          'Não consegui responder agora. As perguntas sugeridas continuam funcionando.'
      });
      setChipsVisiveis(true);
    } finally {
      setPensando(false);
    }
  };

  const ultima = mensagens[mensagens.length - 1];
  const mostrarOutra = !chipsVisiveis && !pensando && ultima?.autor === 'mind';

  return (
    <>
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-3 p-4">
          {/* Só as falas ficam no `log`: sugestões e botões entram e saem
              sem serem anunciados como mensagem. */}
          <div
            role="log"
            aria-live="polite"
            aria-relevant="additions"
            aria-label="Conversa com o Mind"
            className="flex flex-col gap-3"
          >
            {mensagens.map((mensagem) => (
              <BolhaMind
                key={mensagem.id}
                mensagem={mensagem}
              />
            ))}
          </div>

          {pensando ? (
            <div className="flex justify-start">
              <p
                role="status"
                className="flex items-center gap-2 rounded-2xl rounded-tl-sm bg-muted px-3 py-2 text-sm text-muted-foreground"
              >
                <span
                  aria-hidden="true"
                  className="flex gap-1"
                >
                  {[0, 1, 2].map((ponto) => (
                    <span
                      key={ponto}
                      className="size-1.5 rounded-full bg-muted-foreground/60 motion-safe:animate-pulse"
                      style={{ animationDelay: `${ponto * 150}ms` }}
                    />
                  ))}
                </span>
                Mind está digitando…
              </p>
            </div>
          ) : null}

          {chipsVisiveis && perguntas.length > 0 ? (
            <div className="flex flex-col gap-2">
              <span className="text-xs text-muted-foreground">
                Experimente perguntar
              </span>
              <div className="flex flex-col items-start gap-2">
                {perguntas.map((pergunta) => (
                  <Button
                    key={pergunta.id}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-auto min-h-8 rounded-full py-1.5 text-left whitespace-normal"
                    onClick={() => perguntar(pergunta)}
                  >
                    {pergunta.texto}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}

          {mostrarOutra ? (
            <div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setChipsVisiveis(true);
                  rolar();
                }}
              >
                <IconRotate2 aria-hidden="true" />
                Fazer outra pergunta
              </Button>
            </div>
          ) : null}
          <div ref={fimRef} />
        </div>
      </ScrollArea>

      <form
        onSubmit={perguntaLivre}
        className="flex items-center gap-2 border-t p-4"
      >
        <Input
          value={texto}
          onChange={(event) => setTexto(event.target.value)}
          placeholder="Pergunte ao Mind…"
          aria-label="Pergunte ao Mind"
          maxLength={MAX_PERGUNTA}
          autoComplete="off"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!texto.trim() || pensando}
          aria-label="Enviar pergunta"
        >
          <IconArrowUp aria-hidden="true" />
        </Button>
      </form>
    </>
  );
}

function BolhaMind({ mensagem }: { mensagem: Mensagem }) {
  if (mensagem.autor === 'pessoa') {
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-3 py-2 text-sm text-primary-foreground">
          <span className="sr-only">Você perguntou: </span>
          {mensagem.texto}
        </p>
      </div>
    );
  }

  if ('texto' in mensagem) {
    return (
      <div className="flex justify-start">
        <p className="max-w-[90%] rounded-2xl rounded-tl-sm bg-muted px-3 py-2 text-sm leading-relaxed">
          <span className="sr-only">Mind disse: </span>
          {mensagem.texto}
        </p>
      </div>
    );
  }

  const { resposta } = mensagem;
  return (
    <div className="flex flex-col items-start gap-1.5">
      <div className="flex max-w-[90%] flex-col gap-2 rounded-2xl rounded-tl-sm bg-muted px-3 py-2.5 text-sm leading-relaxed">
        <span className="sr-only">Mind respondeu:</span>
        {resposta.paragrafos.map((paragrafo, index) => (
          <p key={index}>{paragrafo}</p>
        ))}
        {resposta.itens && resposta.itens.length > 0 ? (
          <ul className="flex flex-col gap-1 pl-4 [&>li]:list-disc">
            {resposta.itens.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
        {resposta.fecho ? <p>{resposta.fecho}</p> : null}
      </div>
      {resposta.fontes.length > 0 ? (
        <div
          className="flex flex-wrap items-center gap-1"
          aria-label="De onde vieram os dados"
        >
          {resposta.fontes.map((fonte) => (
            <Badge
              key={fonte}
              variant="outline"
              className="px-1.5 text-[11px] font-normal text-muted-foreground"
            >
              {fonte}
            </Badge>
          ))}
        </div>
      ) : null}
      <p className="text-xs text-muted-foreground">
        {resposta.origem.tipo === 'regra'
          ? 'Regra fixa, sem IA paga'
          : `Modelo: ${resposta.origem.nome}`}
      </p>
    </div>
  );
}

/**
 * Prefixos das telas por link, lidos de `@workspace/routes` como a casca faz.
 * Nelas o Mind não aparece: candidato e empresa não têm assistente.
 */
const SENTINELA = '__id__';
function prefixo(caminho: string): string {
  return caminho.slice(0, caminho.indexOf(SENTINELA));
}
const PREFIXOS_POR_LINK = [
  prefixo(routes.dashboard.iel.applications.byId(SENTINELA).fit),
  prefixo(routes.dashboard.iel.cultureInvite.byToken(SENTINELA)),
  prefixo(routes.dashboard.iel.report.byToken(SENTINELA))
];

export function ehTelaPorLink(pathname: string): boolean {
  return PREFIXOS_POR_LINK.some((base) => pathname.startsWith(base));
}
