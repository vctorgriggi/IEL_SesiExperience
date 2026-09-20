'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { IconMessageCircle } from '@tabler/icons-react';

import { Badge } from '@workspace/ui/shadcn/badge';
import { Button } from '@workspace/ui/shadcn/button';
import { Card, CardContent } from '@workspace/ui/shadcn/card';

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
            <IconMessageCircle aria-hidden="true" />
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
