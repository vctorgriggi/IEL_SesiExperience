'use client';

import type { EtapaDaMensagem } from '@/features/iel-demo/analysis/mensagens';
import type {
  Application,
  FitStatus,
  ReferralItem
} from '@/features/iel-demo/types';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@workspace/ui/shadcn/sheet';

import { MensagemDoMind } from './mensagem-do-mind';

/**
 * A gaveta "Mensagem do Mind": abre da mesa de seleção e dos Enviados com a
 * pessoa e a etapa que a tela deduziu. O conteúdo é `MensagemDoMind`; aqui
 * só mora a moldura e a dedução da etapa, para as duas telas deduzirem do
 * mesmo jeito.
 */
export type MensagemDoMindSheetProps = {
  applicationId: string | null;
  etapa: EtapaDaMensagem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * A etapa pela situação da candidatura na mesa de seleção.
 *
 * A decisão da empresa vence o resto: quem recebeu "quero entrevistar" não
 * precisa ser lembrado do questionário. Sem resposta, é convite no prazo e
 * lembrete depois dele. Quem respondeu e ainda não foi enviado abre em
 * "currículo enviado", que é o próximo aviso que a analista vai mandar; o
 * seletor da gaveta troca em um toque.
 */
export function etapaPelaCandidatura(
  application: Application,
  fitStatus: FitStatus
): EtapaDaMensagem {
  if (application.referralStage === 'interesse-em-entrevista') {
    return 'empresa-quer-conversar';
  }
  if (application.referralStage === 'nao-avancou') return 'nao-foi-desta-vez';
  if (application.referralStage === 'encaminhada') return 'curriculo-enviado';
  if (fitStatus === 'pendente') return 'convite-questionario';
  if (fitStatus === 'expirado') return 'lembrete-questionario';
  return 'curriculo-enviado';
}

/**
 * A etapa pelo retorno da empresa, nos Enviados. Contratou → é hora do
 * "como está sendo"; quer entrevistar → a ligação; não avançou → o retorno
 * honesto; sem retorno ainda → avisar que o currículo foi.
 */
export function etapaPeloEncaminhamento(item: ReferralItem): EtapaDaMensagem {
  if (item.outcome?.hiring === 'contratou') return 'como-esta-sendo';
  if (item.managerDecision === 'quero-entrevistar') {
    return 'empresa-quer-conversar';
  }
  if (item.managerDecision === 'nao-avancar') return 'nao-foi-desta-vez';
  return 'curriculo-enviado';
}

export function MensagemDoMindSheet({
  applicationId,
  etapa,
  open,
  onOpenChange
}: MensagemDoMindSheetProps) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b">
          <SheetTitle className="text-base">Mensagem do Mind</SheetTitle>
          <SheetDescription className="text-xs">
            O rascunho de WhatsApp para esta pessoa, nesta etapa. Sem o nome da
            empresa até a entrevista.
          </SheetDescription>
        </SheetHeader>
        <div className="p-4">
          {applicationId ? (
            <MensagemDoMind
              key={applicationId}
              applicationId={applicationId}
              etapa={etapa}
            />
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
