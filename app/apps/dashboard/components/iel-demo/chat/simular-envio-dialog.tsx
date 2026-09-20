'use client';

import { useState, type ReactNode } from 'react';
import { IconCopy, IconExternalLink, IconSend } from '@tabler/icons-react';

import { toast } from '@workspace/ui';
import { Button } from '@workspace/ui/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@workspace/ui/shadcn/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@workspace/ui/shadcn/tabs';

/**
 * "Simular envio": na demonstração, mostra de onde vem o link.
 *
 * Quem assiste à demo vê a tela do analista e, de repente, uma tela de
 * celular. Este diálogo fecha o buraco: é a mensagem que a pessoa recebe no
 * WhatsApp ou no e-mail, com o link e o prazo, em nome do IEL · Centro de
 * Empregos. Nada é enviado de verdade.
 *
 * O texto obedece ao mesmo escopo das telas:
 *
 * - **Candidato**: nunca o nome da empresa (R5). A vaga é dita pela atividade
 *   e pela cidade, como em `getCandidateJobView`.
 * - **Colaborador**: sem nome de pessoa. O convite se apresenta pela empresa.
 * - **Empresa**: o relatório dos até 5 enviados, que vale 30 dias.
 */
export type SimularEnvioDestinatario = 'candidato' | 'colaborador' | 'empresa';

export type SimularEnvioContexto = {
  atividade?: string;
  cidade?: string;
  empresa?: string;
  vaga?: string;
};

export type SimularEnvioDialogProps = {
  destinatario: SimularEnvioDestinatario;
  /** Caminho (`/candidatura/...`, `/consulta/...`) ou URL completa do link que a pessoa recebe. */
  link: string;
  contexto: SimularEnvioContexto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const REMETENTE = 'IEL · Centro de Empregos';

/** Prazo de cada link (PRODUTO.md §5.4 e R11; relatório: 30 dias). */
const PRAZO: Record<SimularEnvioDestinatario, string> = {
  candidato: 'O link vale 2 dias.',
  colaborador: 'O link vale 3 dias e serve uma vez só.',
  empresa: 'A página vale 30 dias.'
};

const QUEM_RECEBE: Record<SimularEnvioDestinatario, string> = {
  candidato: 'Candidato da vaga',
  colaborador: 'Colaborador da empresa',
  empresa: 'RH da empresa'
};

const O_QUE_FICA_DE_FORA: Record<SimularEnvioDestinatario, string> = {
  candidato:
    'Sem o nome da empresa: o candidato só conhece a empresa na entrevista.',
  colaborador: 'Sem nome de pessoa: a resposta entra só na média da empresa.',
  empresa: 'Só os currículos enviados, nunca os outros candidatos.'
};

type Mensagem = {
  /** Corpo curto, para o WhatsApp. */
  whatsapp: string;
  assunto: string;
  /** Parágrafos do e-mail, antes do link. */
  email: string[];
};

function montarMensagem(
  destinatario: SimularEnvioDestinatario,
  contexto: SimularEnvioContexto
): Mensagem {
  if (destinatario === 'candidato') {
    // R5: nem `contexto.empresa` nem nada que a identifique entra aqui.
    const atividade = contexto.atividade ?? contexto.vaga ?? 'a vaga';
    const onde = contexto.cidade ? `, em ${contexto.cidade}` : '';
    return {
      whatsapp: `Olá! Aqui é o ${REMETENTE}. Recebemos sua candidatura para a vaga de ${atividade}${onde}. Responda 10 frases rápidas sobre como você prefere trabalhar. É pelo celular e não precisa de senha.`,
      assunto: `Sua candidatura: ${atividade}${onde}`,
      email: [
        'Olá!',
        `Recebemos sua candidatura para a vaga de ${atividade}${onde}.`,
        'Para seguir, responda 10 frases rápidas sobre como você prefere trabalhar. Leva uns 5 minutos, pelo celular, e não existe resposta certa.'
      ]
    };
  }

  if (destinatario === 'colaborador') {
    const empresa = contexto.empresa ?? 'sua empresa';
    return {
      whatsapp: `Olá! Aqui é o ${REMETENTE}. A ${empresa} quer saber como é trabalhar aí, contado por quem vive o dia a dia. São cerca de 15 frases, uns 5 minutos. Ninguém vê a sua resposta, nem a sua gestão.`,
      assunto: `Como é trabalhar na ${empresa}? Cerca de 15 frases`,
      email: [
        'Olá!',
        `A ${empresa} está ouvindo quem trabalha lá para descrever como é o dia a dia. As respostas ajudam o IEL a indicar candidatos que combinam com o jeito da equipe.`,
        'São cerca de 15 frases, uns 5 minutos. A sua resposta entra só na média: ninguém vê o que você respondeu, nem a sua gestão.'
      ]
    };
  }

  const vaga = contexto.vaga ? ` para a vaga de ${contexto.vaga}` : '';
  return {
    whatsapp: `Olá! Aqui é o ${REMETENTE}. Os currículos${vaga} estão prontos. A página abre sem login e mostra, de cada pessoa, os requisitos e como ela combina com a empresa.`,
    assunto: `Currículos${vaga}`,
    email: [
      contexto.empresa ? `Olá, equipe ${contexto.empresa}!` : 'Olá!',
      `Os currículos${vaga} estão prontos para leitura.`,
      'A página abre sem login e mostra, de cada pessoa, os requisitos e como ela combina com a empresa nos 10 temas.'
    ]
  };
}

function urlCompleta(link: string): string {
  if (/^https?:\/\//.test(link) || typeof window === 'undefined') return link;
  return `${window.location.origin}${link.startsWith('/') ? '' : '/'}${link}`;
}

export function SimularEnvioDialog({
  destinatario,
  link,
  contexto,
  open,
  onOpenChange
}: SimularEnvioDialogProps) {
  const [canal, setCanal] = useState<'whatsapp' | 'email'>('whatsapp');
  const [textoVisivel, setTextoVisivel] = useState(false);

  const mensagem = montarMensagem(destinatario, contexto);
  const url = urlCompleta(link);
  const prazo = PRAZO[destinatario];

  const textoParaCopiar =
    canal === 'whatsapp'
      ? `${mensagem.whatsapp}\n\n${url}\n\n${prazo}`
      : [
          `Assunto: ${mensagem.assunto}`,
          '',
          ...mensagem.email.flatMap((paragrafo) => [paragrafo, '']),
          url,
          '',
          prazo,
          '',
          REMETENTE
        ].join('\n');

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(textoParaCopiar);
      toast.success('Mensagem copiada.');
    } catch {
      // Sem permissão de área de transferência (ou sem HTTPS): o texto
      // aparece selecionável, para copiar à mão.
      setTextoVisivel(true);
      toast.info('Não deu para copiar. O texto está logo abaixo.');
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(proximo) => {
        if (!proximo) setTextoVisivel(false);
        onOpenChange(proximo);
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Simular envio</DialogTitle>
          <DialogDescription>
            A mensagem que chega a quem recebe. Na demonstração, nada é enviado.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={canal}
          onValueChange={(valor) =>
            setCanal(valor === 'email' ? 'email' : 'whatsapp')
          }
          className="grid gap-6 md:grid-cols-[auto_1fr]"
        >
          <Celular>
            <TabsContent
              value="whatsapp"
              className="m-0 flex flex-1 flex-col"
            >
              <div className="flex items-center gap-2 border-b bg-muted px-3 py-2">
                <span className="flex size-7 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                  IEL
                </span>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-xs font-semibold">
                    {REMETENTE}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    WhatsApp
                  </span>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-2 bg-secondary/60 p-3">
                <div className="flex max-w-[92%] flex-col gap-2 rounded-lg rounded-tl-none border bg-background p-2.5 text-xs leading-relaxed shadow-xs">
                  <p>{mensagem.whatsapp}</p>
                  <p className="break-all font-medium text-primary underline underline-offset-2">
                    {url}
                  </p>
                  <p className="text-muted-foreground">{prazo}</p>
                </div>
              </div>
            </TabsContent>
            <TabsContent
              value="email"
              className="m-0 flex flex-1 flex-col"
            >
              <div className="flex flex-col gap-1 border-b px-3 py-2 text-[11px]">
                <span className="text-muted-foreground">
                  De: <span className="text-foreground">{REMETENTE}</span>
                </span>
                <span className="text-sm leading-snug font-semibold">
                  {mensagem.assunto}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-2 p-3 text-xs leading-relaxed">
                {mensagem.email.map((paragrafo) => (
                  <p key={paragrafo}>{paragrafo}</p>
                ))}
                <p className="break-all font-medium text-primary underline underline-offset-2">
                  {url}
                </p>
                <p className="text-muted-foreground">{prazo}</p>
                <p className="text-muted-foreground">{REMETENTE}</p>
              </div>
            </TabsContent>
          </Celular>

          <div className="flex flex-col gap-4">
            <TabsList className="self-start">
              <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
              <TabsTrigger value="email">E-mail</TabsTrigger>
            </TabsList>
            <dl className="grid gap-3 text-sm">
              <div className="grid gap-0.5">
                <dt className="text-xs text-muted-foreground">Quem recebe</dt>
                <dd>{QUEM_RECEBE[destinatario]}</dd>
              </div>
              <div className="grid gap-0.5">
                <dt className="text-xs text-muted-foreground">Prazo</dt>
                <dd>{prazo}</dd>
              </div>
              <div className="grid gap-0.5">
                <dt className="text-xs text-muted-foreground">
                  O que fica de fora
                </dt>
                <dd>{O_QUE_FICA_DE_FORA[destinatario]}</dd>
              </div>
            </dl>
            {textoVisivel ? (
              <textarea
                readOnly
                value={textoParaCopiar}
                aria-label="Texto da mensagem"
                className="min-h-32 w-full rounded-md border bg-background p-2 text-xs"
                onFocus={(event) => event.currentTarget.select()}
              />
            ) : null}
          </div>
        </Tabs>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={copiar}
          >
            <IconCopy aria-hidden="true" />
            Copiar mensagem
          </Button>
          <Button asChild>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <IconExternalLink aria-hidden="true" />
              Abrir como quem recebe
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** A moldura de celular, só em Tailwind: borda grossa, cantos e o entalhe. */
function Celular({ children }: { children: ReactNode }) {
  return (
    <div
      aria-label="Tela do celular de quem recebe"
      role="group"
      className="relative mx-auto h-[26rem] w-[15.5rem] shrink-0 rounded-[2.25rem] border-[8px] border-foreground bg-foreground"
    >
      <span
        aria-hidden="true"
        className="absolute top-0 left-1/2 z-10 h-4 w-20 -translate-x-1/2 rounded-b-xl bg-foreground"
      />
      <div className="flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-background pt-4">
        {children}
      </div>
    </div>
  );
}

/**
 * O botão que abre o diálogo, com as mesmas props (menos `open`).
 */
export function SimularEnvioButton(
  props: Omit<SimularEnvioDialogProps, 'open' | 'onOpenChange'>
) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <IconSend aria-hidden="true" />
        Simular envio
      </Button>
      <SimularEnvioDialog
        {...props}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
