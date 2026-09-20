'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { IconArrowUpRight, IconChevronDown } from '@tabler/icons-react';

import { cn } from '@workspace/ui/lib/utils';
import { Badge } from '@workspace/ui/shadcn/badge';
import { Button } from '@workspace/ui/shadcn/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@workspace/ui/shadcn/card';
import { Checkbox } from '@workspace/ui/shadcn/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@workspace/ui/shadcn/collapsible';
import { Label } from '@workspace/ui/shadcn/label';

/**
 * As peças que o candidato e o colaborador têm em comum.
 *
 * São dois fluxos diferentes — um responde sobre si, o outro sobre a empresa
 * onde trabalha —, mas a pessoa do outro lado é a mesma: celular, sem login,
 * pouco tempo e pouca paciência para texto. O tamanho da tarefa, o aceite
 * curto e a porta para a conversa se escrevem uma vez só, para as telas
 * dizerem a mesma coisa do mesmo jeito.
 */

/**
 * A porta para a versão em conversa (C2), numa linha só.
 *
 * Era um cartão com título, explicação e botão. Para quem abre o link no
 * celular, o cartão competia com o aceite — e a conversa é alternativa, não
 * pedido. Fica no rodapé, como um link.
 */
export function CaminhoDaConversa({ href }: { href: string }) {
  return (
    <p className="text-center text-sm text-muted-foreground">
      <Link
        href={href}
        className="inline-flex min-h-12 items-center underline underline-offset-4"
      >
        Prefere responder conversando?
      </Link>
    </p>
  );
}

/**
 * "16 frases", "uns 5 minutos": o tamanho da tarefa, dito antes do aceite.
 * Quem abre um link sem saber o que é decide continuar ou fechar por esta
 * linha.
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
 * O aceite curto: três linhas, o texto inteiro a um toque, a caixa e o botão.
 *
 * O texto inteiro do aceite é o que a versão gravada identifica, então ele
 * continua existindo palavra por palavra — só não ocupa a tela. Quem quiser
 * lê em "Ler o texto completo"; quem não quiser lê três linhas em palavra
 * comum: o que responde e para quê, quem vê, por quanto tempo vale (LGPD,
 * art. 9º). A caixa nasce desmarcada e o botão só abre com ela marcada:
 * consentimento marcado de antemão não é consentimento.
 *
 * O que fica de fora, de propósito: "sem o aceite o questionário não abre"
 * (o botão desabilitado já diz), a versão do texto (vai gravada na resposta,
 * não na tela) e qualquer explicação de método.
 */
export function AceiteCurto({
  id,
  titulo = 'Antes de responder',
  linhas,
  textoCompleto,
  aceito,
  onAceitar,
  rotuloDaCaixa = 'Li e aceito',
  rotuloDoBotao,
  onConfirmar
}: {
  /** Prefixo dos ids da caixa e do texto, um por tela. */
  id: string;
  titulo?: string;
  /** As três linhas do resumo. */
  linhas: readonly string[];
  /** O texto inteiro, uma frase por item, atrás de "Ler o texto completo". */
  textoCompleto: readonly string[];
  aceito: boolean;
  onAceitar: (aceito: boolean) => void;
  rotuloDaCaixa?: string;
  rotuloDoBotao: string;
  onConfirmar: () => void;
}) {
  const [aberto, setAberto] = useState(false);
  return (
    <div className="flex flex-col gap-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            <h2>{titulo}</h2>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <ul className="flex flex-col gap-2.5">
            {linhas.map((linha) => (
              <li
                key={linha}
                className="flex gap-2.5 text-[15px] leading-relaxed text-foreground"
              >
                <span
                  aria-hidden="true"
                  className="mt-[11px] size-1.5 shrink-0 rounded-full bg-muted-foreground/60"
                />
                {linha}
              </li>
            ))}
          </ul>
          <Collapsible
            open={aberto}
            onOpenChange={setAberto}
            className="flex flex-col items-start gap-2"
          >
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                // 32px de desenho, 48px de toque.
                className="relative -ml-2 h-8 gap-1 px-2 text-[13px] font-normal text-muted-foreground after:absolute after:-inset-y-2 after:inset-x-0 after:content-['']"
              >
                <IconChevronDown
                  aria-hidden="true"
                  className={cn(
                    'size-3.5 transition-transform',
                    aberto ? 'rotate-180' : ''
                  )}
                />
                {aberto ? 'Esconder o texto completo' : 'Ler o texto completo'}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div
                id={`${id}-texto`}
                className="flex flex-col gap-2 rounded-lg border border-dashed px-3 py-2.5 text-sm leading-relaxed text-muted-foreground"
              >
                {textoCompleto.map((frase) => (
                  <p key={frase}>{frase}</p>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      <Label
        htmlFor={`${id}-caixa`}
        className="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border p-4 text-[15px] leading-snug font-medium"
      >
        <Checkbox
          id={`${id}-caixa`}
          className="size-5"
          checked={aceito}
          onCheckedChange={(valor) => onAceitar(valor === true)}
        />
        {rotuloDaCaixa}
      </Label>
      <Button
        size="lg"
        className="h-12 w-full text-[15px]"
        disabled={!aceito}
        onClick={onConfirmar}
      >
        {rotuloDoBotao}
      </Button>
    </div>
  );
}

/**
 * A moldura das telas por link: a etiqueta no alto à direita (a vaga, ou a
 * empresa da consulta) e o resto. O quadrado da marca já vem da casca.
 */
export function MolduraPorLink({
  etiqueta,
  atalhoDaEquipe,
  children
}: {
  etiqueta: ReactNode;
  /** Só com sessão da analista: a linha de volta ao Mind RH, no rodapé. */
  atalhoDaEquipe?: { href: string };
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-6rem)] w-full max-w-md flex-col gap-5 px-1 pt-2">
      <div className="flex items-center justify-end gap-2">{etiqueta}</div>
      {children}
      {atalhoDaEquipe ? <AtalhoDaEquipe href={atalhoDaEquipe.href} /> : null}
    </div>
  );
}

/**
 * A volta ao Mind RH para quem é da equipe do IEL.
 *
 * Quem apresenta responde como candidato ou colaborador e precisa voltar à
 * Central para ver a resposta chegar. A linha só existe quando a página
 * confirmou a sessão da analista pelo cookie (`analistaLogada`); para quem
 * abre o link de verdade, sem cookie, o DOM não tem nem um wrapper vazio.
 * É comportamento de produto ("você é da equipe, então tem o atalho"), não
 * texto de bastidor.
 */
export function AtalhoDaEquipe({ href }: { href: string }) {
  return (
    <p className="mt-auto flex items-center justify-between gap-3 border-t pt-3 text-xs text-muted-foreground">
      <span>Equipe do IEL</span>
      <Link
        href={href}
        className="inline-flex items-center gap-1 underline-offset-4 hover:underline"
      >
        Abrir no Mind RH
        <IconArrowUpRight
          aria-hidden="true"
          className="size-3.5"
        />
      </Link>
    </p>
  );
}
