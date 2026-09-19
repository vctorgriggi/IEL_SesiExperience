'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { plural } from '@/features/iel-demo/format';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';

import { routes } from '@workspace/routes';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@workspace/ui/shadcn/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@workspace/ui/shadcn/tabs';

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * O método, explicado uma vez para o produto inteiro.
 *
 * As ressalvas são obrigatórias — são o que impede alguém de ler o percentual
 * como nota de pessoa —, e moram num lugar só, alcançável de qualquer tela.
 */
export function ComoFuncionaDialog({ open, onOpenChange }: DialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Como funciona</DialogTitle>
          <DialogDescription>O método, em seis pontos.</DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto text-sm leading-relaxed text-muted-foreground">
          <div>
            <p className="font-medium text-foreground">
              O percentual é sobre a empresa, não sobre a vaga.
            </p>
            <p>
              Ele compara o que a empresa pratica no dia a dia com o que a
              pessoa procura, em cinco pontos. Os requisitos técnicos da vaga
              são a outra coluna, e vêm prontos do sistema de vagas.
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground">
              Como a empresa trabalha é a média de quem trabalha nela.
            </p>
            <p>
              Não é a resposta de uma pessoa do RH: é a média das respostas de
              colaboradores de áreas e níveis diferentes. Quando a equipe
              responde pouco, o ponto fica em aberto e não entra na conta.
              Quando gestão e equipe respondem diferente, a diferença aparece ao
              lado da média.
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground">
              O mínimo é 35%, e quem decide é uma pessoa.
            </p>
            <p>
              Abaixo disso a pessoa não é considerada compatível, mas continua
              visível e marcada: o corte é do IEL, serve para organizar a
              leitura e não descarta ninguém sozinho.
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground">
              Não é teste psicológico e não produz nota.
            </p>
            <p>
              São cinco perguntas sobre preferências de trabalho no cotidiano.
              Nada de personalidade, saúde, família, religião ou opinião. O
              número não prevê desempenho nem qualifica ninguém.
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground">
              Os resumos são montados por regra fixa.
            </p>
            <p>
              Nenhuma etapa do caminho depende de serviço cobrado por candidato.
              Inteligência artificial paga existe como camada opcional,
              desligada por padrão, e nunca no caminho principal.
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground">
              O candidato não vê o nome da empresa.
            </p>
            <p>
              Antes da entrevista ele vê atividade, localidade, segmento e
              turno. O nome só aparece quando a empresa o chama.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Roteiro da demonstração: a jornada completa e o recorte de três minutos. */
export function RoteiroDialog({ open, onOpenChange }: DialogProps) {
  const { state } = useIelDemo();
  const iel = routes.dashboard.iel;
  const fechar = () => onOpenChange(false);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Roteiro da demonstração</DialogTitle>
          <DialogDescription>
            A jornada completa, ou o recorte de três minutos para apresentar.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          defaultValue="completo"
          className="max-h-[60vh] overflow-y-auto"
        >
          <TabsList>
            <TabsTrigger value="completo">Completo — 7 passos</TabsTrigger>
            <TabsTrigger value="curto">Curto — 3 minutos</TabsTrigger>
          </TabsList>

          <TabsContent value="completo">
            <ol className="space-y-3 text-sm text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">
                  1. Encontrar o processo que precisa de atenção.
                </span>{' '}
                <Link
                  className="underline"
                  href={iel.index}
                  onClick={fechar}
                >
                  Visão geral
                </Link>{' '}
                → vaga Assistente de Logística.
              </li>
              <li>
                <span className="font-medium text-foreground">
                  2. Ver a integração dos dados.
                </span>{' '}
                <Link
                  className="underline"
                  href={iel.jobs.byId('VAG-01').index}
                  onClick={fechar}
                >
                  Mesa de seleção da vaga 1
                </Link>{' '}
                → abrir Ana Ribeiro e clicar numa conclusão para ver a
                evidência.
              </li>
              <li>
                <span className="font-medium text-foreground">
                  3. Comparar.
                </span>{' '}
                Selecionar Ana e Bruno na matriz e abrir{' '}
                <Link
                  className="underline"
                  href={iel.jobs.byId('VAG-01').comparison}
                  onClick={fechar}
                >
                  comparação
                </Link>
                .
              </li>
              <li>
                <span className="font-medium text-foreground">
                  4. Esclarecer com a pessoa certa.
                </span>{' '}
                Criar a pergunta ao gestor sobre apoio inicial, abrir a
                experiência do destinatário em{' '}
                <Link
                  className="underline"
                  href={iel.clarifications.index}
                  onClick={fechar}
                >
                  Perguntas pendentes
                </Link>{' '}
                e incorporar a resposta.
              </li>
              <li>
                <span className="font-medium text-foreground">
                  5. Mesmo perfil, outra leitura.
                </span>{' '}
                Abrir{' '}
                <Link
                  className="underline"
                  href={iel.jobs.byId('VAG-02').index}
                  onClick={fechar}
                >
                  a vaga 2
                </Link>{' '}
                e ver Ana com contexto organizacional diferente; esclarecer a
                disponibilidade pendente.
              </li>
              <li>
                <span className="font-medium text-foreground">
                  6. Preparar e registrar o encaminhamento.
                </span>{' '}
                Adicionar Ana à lista da vaga 2 e registrar em{' '}
                <Link
                  className="underline"
                  href={iel.jobs.byId('VAG-02').referral}
                  onClick={fechar}
                >
                  preparação do encaminhamento
                </Link>
                .
              </li>
              <li>
                <span className="font-medium text-foreground">
                  7. Ver a resposta da empresa.
                </span>{' '}
                Trocar a persona para “Gestor — Horizonte Alimentos”, registrar
                “Quero entrevistar” e voltar como analista para ver o histórico.
              </li>
            </ol>
          </TabsContent>

          <TabsContent value="curto">
            <RoteiroCurto onNavigate={fechar} />
          </TabsContent>
        </Tabs>

        <p className="border-t pt-3 text-xs text-muted-foreground">
          Estado atual: {state.clarifications.length} solicitações registradas,{' '}
          {plural(state.referrals.length, 'encaminhamento', 'encaminhamentos')}.
        </p>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Recorte de três minutos.
 *
 * O briefing pede uma versão curta para apresentar, e avisa que os passos
 * abreviados precisam ter estado válido — nada de pular validação para
 * encurtar. Por isso o caminho é o mesmo da jornada completa; o que muda é
 * quais paradas se mostra.
 */
function RoteiroCurto({ onNavigate }: { onNavigate: () => void }) {
  const iel = routes.dashboard.iel;

  const steps: { text: ReactNode; href?: string }[] = [
    {
      text: 'Abrir a mesa de seleção da vaga com 90 candidaturas.',
      href: iel.jobs.byId('VAG-01').index
    },
    {
      text: 'Filtrar por “Requisito obrigatório sem informação”: a triagem que substitui abrir perfil por perfil.'
    },
    {
      text: 'Selecionar Ana e Bruno e abrir a comparação.',
      href: iel.jobs.byId('VAG-01').comparison
    },
    {
      text: 'Clicar numa conclusão e mostrar a evidência, com a fonte de onde veio.'
    },
    {
      text: 'Esclarecer o apoio inicial com o gestor e incorporar a resposta.',
      href: iel.clarifications.index
    },
    {
      text: 'Abrir Ana na vaga 2: mesmo perfil, contexto da empresa diferente, leitura diferente.',
      href: iel.jobs.byId('VAG-02').index
    },
    {
      text: 'Responder o fit como candidata (Ana, vaga 2): aceite, cinco perguntas no celular, sem login e sem o nome da empresa.',
      href: iel.applications.byId('CAND-05').fit
    },
    {
      text: 'Registrar o encaminhamento e ver a trajetória dela entre os dois processos.',
      href: iel.jobs.byId('VAG-02').referral
    }
  ];

  return (
    <ol className="space-y-2.5 text-sm text-muted-foreground">
      {steps.map((step, index) => (
        <li
          key={index}
          className="flex gap-2.5"
        >
          <span
            aria-hidden="true"
            className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-muted text-[11px] font-semibold text-foreground"
          >
            {index + 1}
          </span>
          <span>
            {step.text}
            {step.href ? (
              <>
                {' '}
                <Link
                  className="font-medium text-foreground underline underline-offset-2"
                  href={step.href}
                  onClick={onNavigate}
                >
                  abrir
                </Link>
              </>
            ) : null}
          </span>
        </li>
      ))}
    </ol>
  );
}
