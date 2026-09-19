'use client';

import { useState } from 'react';
import { CULTURE_CONSENT_VERSION } from '@/features/iel-demo/analysis/culture-invites';
import {
  montarRoteiroColaborador,
  respostasDoColaborador
} from '@/features/iel-demo/chat/roteiro-colaborador';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  getInviteByToken,
  type CultureInviteView
} from '@/features/iel-demo/state/selectors';
import { nowIso } from '@/features/iel-demo/state/storage';

import { Badge } from '@workspace/ui/shadcn/badge';

import { ConversaCarregando, ConversaGuiada } from './conversa-guiada';
import { useMontado } from './use-voz';

/**
 * "Como é trabalhar aqui?" em forma de conversa, para quem trabalha na
 * empresa (M2 + C2).
 *
 * Grava pela mesma ação da tela em passos (`answer-culture-invite`), com a
 * versão do aceite e o relógio único da demo. O convite é resolvido pelo
 * token e respeita o estado: respondido ou vencido vira uma mensagem final,
 * sem pergunta — o link é de uso único e vale 3 dias (PRODUTO.md §5.4).
 *
 * Nenhum nome de pessoa aparece; o convite se apresenta pela empresa.
 */
export function ConversaColaborador({ token }: { token: string }) {
  const montado = useMontado();
  const { state, dispatch } = useIelDemo();
  // Congela o convite no primeiro toque: a própria resposta muda o status
  // para "respondido", e a conversa não pode virar outra no meio.
  const [travado, setTravado] = useState<CultureInviteView | null>(null);

  const convite = travado ?? getInviteByToken(state, token);

  if (!montado) return <ConversaCarregando />;

  const roteiro = montarRoteiroColaborador(convite);

  return (
    <ConversaGuiada
      key={`${roteiro.id}:${convite?.inviteId ?? 'nenhum'}`}
      roteiro={roteiro}
      contexto={
        convite ? (
          <Badge
            variant="outline"
            className="font-medium text-muted-foreground"
          >
            Consulta à equipe · {convite.companyName}
          </Badge>
        ) : null
      }
      onPrimeiraResposta={() => setTravado(convite)}
      onConcluir={(respostas) => {
        const answers = respostasDoColaborador(respostas);
        if (!answers) return;
        dispatch({
          type: 'answer-culture-invite',
          token,
          answers,
          consentVersion: CULTURE_CONSENT_VERSION,
          at: nowIso()
        });
      }}
    />
  );
}
