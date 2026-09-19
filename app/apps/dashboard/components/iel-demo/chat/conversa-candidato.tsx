'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CANDIDATE_CONSENT_VERSION } from '@/features/iel-demo/analysis/candidate-questionnaire';
import {
  montarRoteiroCandidato,
  respostasDaEscala,
  type VarianteCandidato
} from '@/features/iel-demo/chat/roteiro-candidato';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  getApplication,
  getCandidateJobView,
  getFitResponse,
  getFitStatus,
  perguntasDoCandidato
} from '@/features/iel-demo/state/selectors';
import { nowIso } from '@/features/iel-demo/state/storage';

import { routes } from '@workspace/routes';
import { Badge } from '@workspace/ui/shadcn/badge';
import { Button } from '@workspace/ui/shadcn/button';

import { ConversaCarregando, ConversaGuiada } from './conversa-guiada';
import { useMontado } from './use-voz';

/**
 * A conversa do candidato, montada sobre o motor (C2).
 *
 * Grava pela mesma ação do questionário em telas (`answer-fit-questionnaire`),
 * com a versão do aceite e o relógio único da demo. O que a pessoa vê da vaga
 * sai de `getCandidateJobView` — atividade, cidade, segmento e turno, nunca o
 * nome da empresa (R5) — e nada aqui mostra percentual, ranking ou outros
 * candidatos.
 *
 * O roteiro depende do estado (já respondeu? prazo vencido?) só até o
 * primeiro toque. Depois disso ele congela: a própria resposta muda o estado
 * para "já respondeu", e a conversa não pode trocar de roteiro no meio.
 */
export function ConversaCandidato({
  applicationId
}: {
  applicationId: string;
}) {
  const montado = useMontado();
  const { state, dispatch } = useIelDemo();
  const [travada, setTravada] = useState<VarianteCandidato | null>(null);
  const [sessao, setSessao] = useState(0);

  const application = getApplication(state, applicationId);
  const vaga = getCandidateJobView(state, applicationId);
  const existente = getFitResponse(state, applicationId);

  const varianteAtual: VarianteCandidato =
    !application || !vaga
      ? 'invalido'
      : existente
        ? 'ja-respondeu'
        : getFitStatus(state, application) === 'expirado'
          ? 'expirado'
          : 'novo';
  const variante = travada ?? varianteAtual;

  // As 10 frases que a empresa da vaga escolheu, no texto simples.
  const perguntas = application
    ? perguntasDoCandidato(state, application.jobId)
    : [];
  const itemIds = perguntas.map((pergunta) => pergunta.itemId);

  if (!montado) return <ConversaCarregando />;

  const roteiro = montarRoteiroCandidato({
    variante,
    vaga,
    respondidoEm: existente?.answeredAt ?? null,
    frases: perguntas.map((pergunta) => ({
      itemId: pergunta.itemId,
      texto: pergunta.item.textoSimples
    }))
  });

  const recomecar = () => {
    setTravada('novo');
    setSessao((atual) => atual + 1);
  };

  return (
    <ConversaGuiada
      key={`${variante}:${sessao}`}
      roteiro={roteiro}
      focarAoAbrir={sessao > 0}
      contexto={
        vaga ? (
          <Badge
            variant="outline"
            className="font-medium text-muted-foreground"
          >
            Vaga de {vaga.activity}
          </Badge>
        ) : null
      }
      onPrimeiraResposta={() => setTravada(variante)}
      onConcluir={(respostas) => {
        const answers = respostasDaEscala(respostas, itemIds);
        if (!answers) return;
        dispatch({
          type: 'answer-fit-questionnaire',
          applicationId,
          answers,
          consentVersion: CANDIDATE_CONSENT_VERSION,
          at: nowIso()
        });
      }}
      renderAcoesFinais={(acoes) => (
        // A primeira ação do roteiro é a principal; as outras ficam discretas.
        <div className="flex flex-col gap-2">
          {acoes.map((acao, index) => {
            const variant = index === 0 ? 'default' : 'ghost';
            const classe = 'h-12 w-full text-[15px]';
            if (acao === 'ver-registro') {
              return (
                <Button
                  key={acao}
                  asChild
                  variant={variant}
                  className={classe}
                >
                  <Link
                    href={
                      routes.dashboard.iel.applications.byId(applicationId).fit
                    }
                  >
                    Ver o que está registrado sobre você
                  </Link>
                </Button>
              );
            }
            return (
              <Button
                key={acao}
                variant={variant}
                className={classe}
                onClick={recomecar}
              >
                {acao === 'responder-mesmo-assim'
                  ? 'Responder mesmo assim'
                  : 'Responder de novo'}
              </Button>
            );
          })}
        </div>
      )}
    />
  );
}
