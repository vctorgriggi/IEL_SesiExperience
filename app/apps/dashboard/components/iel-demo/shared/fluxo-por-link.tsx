'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { ChevronDownIcon, MessageCircleIcon } from 'lucide-react';

import { cn } from '@workspace/ui/lib/utils';
import { Badge } from '@workspace/ui/shadcn/badge';
import { Button } from '@workspace/ui/shadcn/button';
import { Card, CardContent } from '@workspace/ui/shadcn/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@workspace/ui/shadcn/collapsible';

/**
 * As peças que o candidato e o colaborador têm em comum.
 *
 * São dois fluxos diferentes — um responde sobre si, o outro sobre a empresa
 * onde trabalha —, mas a pessoa do outro lado é a mesma: celular, sem login,
 * sem paciência para formulário. O tamanho da tarefa, a porta para a conversa
 * guiada e os passos do "o que acontece agora" se escrevem uma vez só, para
 * as duas telas dizerem a mesma coisa do mesmo jeito.
 */

/**
 * A porta para a versão em conversa (C2).
 *
 * A conversa guiada existe justamente para quem tem dificuldade com
 * formulário — e, até aqui, só chegava lá quem soubesse digitar `/conversa`
 * no endereço. Quem mais precisa dela é exatamente quem não faria isso.
 */
export function CaminhoDaConversa({ href }: { href: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-[15px] leading-snug font-medium">
            Prefere responder conversando?
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            A gente manda uma frase de cada vez, como numa mensagem, e pode ler
            em voz alta para você.
          </p>
        </div>
        <Button
          variant="outline"
          size="lg"
          className="h-12 w-full text-[15px]"
          asChild
        >
          <Link href={href}>
            <MessageCircleIcon aria-hidden="true" />
            Responder conversando
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * "16 frases", "uns 5 minutos": o tamanho da tarefa, dito antes do texto do
 * aceite. Quem abre um link sem saber o que é decide continuar ou fechar por
 * esta linha.
 */
export function TamanhoDaTarefa({ itens }: { itens: string[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5 pt-0.5">
      {itens.map((item) => (
        <li key={item}>
          <Badge
            variant="secondary"
            className="font-medium"
          >
            {item}
          </Badge>
        </li>
      ))}
    </ul>
  );
}

/**
 * A frase original do cliente, a um toque atrás da cena.
 *
 * Quem responde lê a cena ("Chega uma tarefa nova. Eu começo e vou
 * ajustando no caminho."); a analista e o auditor precisam poder conferir
 * que é o mesmo instrumento, com a mesma frase da planilha. Fica discreta —
 * um botão pequeno, sem cartão — para não competir com a cena, e fecha
 * sozinha na frase seguinte (quem a monta troca a `key`).
 */
export function FraseOriginal({ texto }: { texto: string }) {
  const [aberta, setAberta] = useState(false);
  return (
    <Collapsible
      open={aberta}
      onOpenChange={setAberta}
      className="flex flex-col items-start gap-1"
    >
      <CollapsibleTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          // 32px de desenho, 48px de toque: o pseudo-elemento alarga a área
          // clicável sem empurrar o resto da tela.
          className="relative -ml-2 h-8 gap-1 px-2 text-[13px] font-normal text-muted-foreground after:absolute after:-inset-y-2 after:inset-x-0 after:content-['']"
        >
          <ChevronDownIcon
            aria-hidden="true"
            className={cn(
              'size-3.5 transition-transform',
              aberta ? 'rotate-180' : ''
            )}
          />
          {aberta ? 'esconder a frase original' : 'ver a frase original'}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <p className="rounded-lg border border-dashed px-3 py-2 text-sm leading-relaxed text-muted-foreground">
          <span className="sr-only">Frase original: </span>
          {texto}
        </p>
      </CollapsibleContent>
    </Collapsible>
  );
}

/** Um passo numerado do "o que acontece agora". Nenhum fim sem ele. */
export function PassoDoFim({
  numero,
  children
}: {
  numero: number;
  children: ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span
        aria-hidden="true"
        className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold tabular-nums text-muted-foreground"
      >
        {numero}
      </span>
      <p className="text-[15px] leading-relaxed text-foreground">{children}</p>
    </li>
  );
}
