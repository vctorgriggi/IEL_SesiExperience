'use client';

import {
  BuildingIcon,
  EyeOffIcon,
  PercentIcon,
  RulerIcon,
  ScaleIcon,
  UsersIcon,
  type LucideIcon
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@workspace/ui/shadcn/dialog';

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
      'São frases sobre preferências de trabalho — nada de personalidade, saúde, família, religião ou opinião.'
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
