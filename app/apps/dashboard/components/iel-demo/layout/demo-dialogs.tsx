'use client';

import Link from 'next/link';
import { plural } from '@/features/iel-demo/format';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import { getReportTokenForJob } from '@/features/iel-demo/state/selectors';
import {
  BuildingIcon,
  EyeOffIcon,
  PercentIcon,
  RulerIcon,
  ScaleIcon,
  UsersIcon,
  type LucideIcon
} from 'lucide-react';

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

/** Um lugar só para as rotas do roteiro: a lista abaixo é declarada fora do componente. */
const ROTAS = routes.dashboard.iel;

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * O método em seis frases.
 *
 * Uma frase por ponto é uma restrição, não um estilo: quem abre este diálogo
 * está no meio de uma conversa com o cliente e precisa poder ler em voz alta.
 * As três primeiras explicam de onde vem o número; as três últimas são as
 * ressalvas que impedem alguém de lê-lo como nota de pessoa.
 */
const COMO_FUNCIONA: { icone: LucideIcon; titulo: string; frase: string }[] = [
  {
    icone: PercentIcon,
    titulo: 'O percentual é sobre a empresa, não sobre a vaga.',
    frase:
      'Ele compara o que a empresa pratica no dia a dia com o que a pessoa procura; os requisitos técnicos são a outra coluna e vêm prontos do sistema de vagas.'
  },
  {
    icone: UsersIcon,
    titulo: 'Como a empresa trabalha é a média de quem trabalha nela.',
    frase:
      'São respostas de colaboradores de áreas e níveis diferentes — não a opinião de uma pessoa do RH.'
  },
  {
    icone: RulerIcon,
    titulo: 'Ponto com pouca resposta fica em aberto e não entra na conta.',
    frase:
      'E quando gestão e equipe respondem diferente, a divergência aparece ao lado da média em vez de sumir dentro dela.'
  },
  {
    icone: ScaleIcon,
    titulo: 'O mínimo é 35%, e quem decide é uma pessoa.',
    frase:
      'Abaixo disso a pessoa fica marcada e continua visível: o corte organiza a leitura do analista e não descarta ninguém sozinho.'
  },
  {
    icone: EyeOffIcon,
    titulo: 'Não é teste psicológico e não produz nota.',
    frase:
      'São cinco perguntas sobre preferências de trabalho — nada de personalidade, saúde, família, religião ou opinião.'
  },
  {
    icone: BuildingIcon,
    titulo: 'O candidato não vê o nome da empresa.',
    frase:
      'Antes da entrevista ele vê atividade, localidade, segmento e turno; o nome só aparece quando a empresa o chama.'
  }
];

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

        <ul className="max-h-[60vh] space-y-3 overflow-y-auto text-sm leading-relaxed">
          {COMO_FUNCIONA.map((ponto) => (
            <li
              key={ponto.titulo}
              className="flex gap-3"
            >
              <ponto.icone
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              />
              <span>
                <span className="font-medium text-foreground">
                  {ponto.titulo}
                </span>{' '}
                <span className="text-muted-foreground">{ponto.frase}</span>
              </span>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

/** Roteiro da demonstração: a jornada completa e o recorte de três minutos. */
export function RoteiroDialog({ open, onOpenChange }: DialogProps) {
  const { state } = useIelDemo();
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
            <TabsTrigger value="completo">Completo — 8 passos</TabsTrigger>
            <TabsTrigger value="curto">Curto — 4 paradas</TabsTrigger>
          </TabsList>

          <TabsContent value="completo">
            <RoteiroEmPassos
              passos={PASSOS_COMPLETOS}
              onNavigate={fechar}
            />
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

type Passo = { texto: string; href?: string; rotulo?: string };

/** A jornada inteira, do que chega à central ao que a empresa responde. */
const PASSOS_COMPLETOS: Passo[] = [
  {
    texto:
      'Importar a planilha de exemplo na vaga de Assistente de Logística: o analista confere pessoa por pessoa antes de gravar.',
    href: ROTAS.jobs.byId('VAG-01').import,
    rotulo: 'importar'
  },
  {
    texto:
      'Abrir a vaga e ler o ranking: requisitos técnicos e aderência lado a lado, quem ficou abaixo do corte marcado e visível.',
    href: ROTAS.jobs.byId('VAG-01').index,
    rotulo: 'abrir a vaga'
  },
  {
    texto:
      'Responder como colaborador da empresa pelo link do celular: cinco perguntas, sem login, sem ver colegas nem contagem.',
    href: ROTAS.cultureInvite.byToken('418c781c386bb301'),
    rotulo: 'responder'
  },
  {
    texto:
      'Responder o fit como candidata: aceite, cinco perguntas e nenhuma menção ao nome da empresa.',
    href: ROTAS.applications.byId('CAND-05').fit,
    rotulo: 'responder'
  },
  {
    texto:
      'Perguntar ao gestor o que falta, abrir a experiência de quem recebe e incorporar a resposta à análise.',
    href: ROTAS.clarifications.index,
    rotulo: 'perguntas'
  },
  {
    texto:
      'Mesmo perfil, outra leitura: Ana na vaga 2, com o contexto organizacional daquela empresa.',
    href: ROTAS.jobs.byId('VAG-02').index,
    rotulo: 'vaga 2'
  },
  {
    texto: 'Marcar quem vai e registrar o encaminhamento.',
    href: ROTAS.jobs.byId('VAG-02').referral,
    rotulo: 'encaminhar'
  },
  {
    texto:
      'Ver o relatório que a empresa recebe: só quem foi enviado, com a aderência por ponto e sem nota interna nenhuma.',
    href: ROTAS.report.byToken(getReportTokenForJob('VAG-02')),
    rotulo: 'ver o relatório'
  }
];

/** Os passos, numerados, com o link de cada parada. */
function RoteiroEmPassos({
  passos,
  onNavigate
}: {
  passos: Passo[];
  onNavigate: () => void;
}) {
  return (
    <ol className="flex flex-col gap-2.5 text-sm text-muted-foreground">
      {passos.map((passo, index) => (
        <li
          key={passo.texto}
          className="flex gap-2.5"
        >
          <span
            aria-hidden="true"
            className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-muted text-[11px] font-semibold text-foreground"
          >
            {index + 1}
          </span>
          <span>
            {passo.texto}
            {passo.href ? (
              <>
                {' '}
                <Link
                  className="font-medium text-foreground underline underline-offset-2"
                  href={passo.href}
                  onClick={onNavigate}
                >
                  {passo.rotulo ?? 'abrir'}
                </Link>
              </>
            ) : null}
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Os oito passos cortados para três minutos de apresentação. */
const PASSOS_CURTOS: Passo[] = [
  {
    texto: 'Importar a planilha de exemplo: 90 candidaturas entram conferidas.',
    href: ROTAS.jobs.byId('VAG-01').import,
    rotulo: 'importar'
  },
  {
    texto:
      'Abrir a vaga e ler o ranking: técnico e aderência lado a lado, com o corte de 35% marcado.',
    href: ROTAS.jobs.byId('VAG-01').index,
    rotulo: 'abrir a vaga'
  },
  {
    texto:
      'Responder pelo celular como candidata: aceite, cinco perguntas, nenhum nome de empresa.',
    href: ROTAS.applications.byId('CAND-05').fit,
    rotulo: 'responder'
  },
  {
    texto: 'Ver o relatório que a empresa recebe e encerrar por ele.',
    href: ROTAS.report.byToken(getReportTokenForJob('VAG-02')),
    rotulo: 'ver o relatório'
  }
];

/**
 * Recorte de três minutos.
 *
 * O briefing pede uma versão curta para apresentar, e avisa que os passos
 * abreviados precisam ter estado válido — nada de pular validação para
 * encurtar. Por isso o caminho é o mesmo da jornada completa; o que muda é
 * quais paradas se mostra.
 */
function RoteiroCurto({ onNavigate }: { onNavigate: () => void }) {
  return (
    <RoteiroEmPassos
      passos={PASSOS_CURTOS}
      onNavigate={onNavigate}
    />
  );
}
