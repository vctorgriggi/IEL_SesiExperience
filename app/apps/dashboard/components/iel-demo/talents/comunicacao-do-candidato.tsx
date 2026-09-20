'use client';

import {
  CANAL_LABEL,
  getComunicacaoDaCandidatura
} from '@/features/iel-demo/analysis/analytics';
import { plural } from '@/features/iel-demo/format';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import { nowIso } from '@/features/iel-demo/state/storage';
import {
  IconBellRinging,
  IconCircleCheck,
  IconCircleDashed,
  IconMailOpened,
  IconSend
} from '@tabler/icons-react';
import type { TablerIcon } from '@tabler/icons-react';

import { toast } from '@workspace/ui';
import { Badge } from '@workspace/ui/shadcn/badge';
import { Button } from '@workspace/ui/shadcn/button';

import { BADGE_DE_ESTADO, type EstadoDeCor } from '../metricas/cores';
import { formatarDataHora } from '../shared/datas';

type Passo = {
  chave: string;
  Icone: TablerIcon;
  titulo: string;
  quando: string;
  detalhe?: string;
};

/**
 * O convite do questionário, contado como uma conversa.
 *
 * A gaveta já dizia o que a pessoa respondeu; não dizia por onde a pergunta
 * foi nem até onde ela chegou. Sem isso, "ainda não respondeu" parece
 * desinteresse quando muitas vezes é um e-mail que não abriu — e a analista
 * não tinha como agir sem sair da tela.
 *
 * Os passos vêm do mesmo evento que alimenta o funil de Questionários
 * (`getComunicacaoDaCandidatura`), então a tela agregada e esta gaveta nunca
 * divergem. Reenviar não cria link novo: é o mesmo link da candidatura, pelo
 * mesmo canal do convite (R11).
 */
export function ComunicacaoDoCandidato({
  applicationId
}: {
  applicationId: string;
}) {
  const { state, dispatch } = useIelDemo();
  const { evento, lembretes, ultimoLembreteEm, podeReenviar } =
    getComunicacaoDaCandidatura(state, applicationId);

  if (!evento) {
    return (
      <section className="flex flex-col gap-2">
        <h3 className="text-base font-medium">Comunicação com o candidato</h3>
        <p className="text-muted-foreground">
          O convite ao questionário ainda não saiu para esta candidatura.
        </p>
      </section>
    );
  }

  const canal = CANAL_LABEL[evento.canal];

  const passos: Passo[] = [
    {
      chave: 'enviado',
      Icone: IconSend,
      titulo: `Convite enviado por ${canal}`,
      quando: formatarDataHora(evento.enviadoEm),
      detalhe: evento.entregue
        ? 'Em nome do IEL, com link único e sem login'
        : 'A entrega falhou: o endereço não recebeu a mensagem'
    }
  ];

  if (evento.aberto) {
    passos.push({
      chave: 'aberto',
      Icone: IconMailOpened,
      titulo: evento.concluido
        ? 'Questionário concluído'
        : evento.iniciado
          ? 'Questionário aberto, não concluído'
          : 'Convite aberto, questionário não começou',
      quando: evento.dispositivo === 'celular' ? 'No celular' : 'No computador',
      detalhe: evento.concluido
        ? evento.duracaoMin
          ? `Levou ${evento.duracaoMin} minutos.`
          : undefined
        : evento.paradaEm === 'aceite'
          ? 'Parou no aceite, antes da primeira frase.'
          : typeof evento.paradaEm === 'number'
            ? `Parou na pergunta ${evento.paradaEm}.`
            : 'Ainda está no prazo do link.'
    });
  }

  for (const [indice, lembrete] of lembretes.entries()) {
    passos.push({
      chave: `lembrete-${lembrete.at}-${indice}`,
      Icone: IconBellRinging,
      titulo: `Lembrete reenviado por ${CANAL_LABEL[lembrete.canal]}`,
      quando: formatarDataHora(lembrete.at),
      detalhe: 'O link é o mesmo do convite.'
    });
  }

  const tom: EstadoDeCor = evento.concluido
    ? 'combina'
    : evento.aberto
      ? 'atencao'
      : 'neutro';
  const rotulo = evento.concluido
    ? 'Respondeu'
    : evento.aberto
      ? 'Abriu e não concluiu'
      : evento.entregue
        ? 'Não abriu'
        : 'Não entregue';

  const reenviar = () => {
    dispatch({
      type: 'resend-fit-invite',
      applicationId,
      canal: evento.canal,
      at: nowIso()
    });
    toast.success(`Lembrete reenviado por ${canal}. O link é o mesmo.`);
  };

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-base font-medium">Comunicação com o candidato</h3>
        <Badge
          variant="outline"
          className={BADGE_DE_ESTADO[tom]}
        >
          {evento.concluido ? (
            <IconCircleCheck aria-hidden="true" />
          ) : (
            <IconCircleDashed aria-hidden="true" />
          )}
          {rotulo}
        </Badge>
      </div>

      <ol className="flex flex-col gap-3">
        {passos.map((passo) => (
          <li
            key={passo.chave}
            className="grid grid-cols-[1.25rem_1fr] gap-3"
          >
            <passo.Icone
              aria-hidden="true"
              className="mt-0.5 size-4 text-muted-foreground"
            />
            <div className="flex min-w-0 flex-col gap-0.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="font-medium">{passo.titulo}</span>
                <span className="text-xs text-muted-foreground">
                  {passo.quando}
                </span>
              </div>
              {passo.detalhe ? (
                <span className="text-muted-foreground">{passo.detalhe}</span>
              ) : null}
            </div>
          </li>
        ))}
      </ol>

      {podeReenviar ? (
        <div className="flex flex-wrap items-center gap-3">
          <Button
            size="sm"
            onClick={reenviar}
          >
            <IconBellRinging aria-hidden="true" />
            Reenviar lembrete agora
          </Button>
          <span className="text-xs text-muted-foreground">
            {ultimoLembreteEm
              ? `${plural(lembretes.length, 'lembrete enviado', 'lembretes enviados')}; o último em ${formatarDataHora(ultimoLembreteEm)}.`
              : 'Nenhum lembrete foi reenviado ainda.'}
          </span>
        </div>
      ) : null}
    </section>
  );
}
