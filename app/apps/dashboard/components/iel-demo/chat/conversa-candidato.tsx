'use client';

import { useState } from 'react';
import Link from 'next/link';
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
  perguntasQueFaltam,
  reaproveitamentoDaCandidatura,
  respostasResolvidas,
  versaoDoAceiteVigente
} from '@/features/iel-demo/state/selectors';
import { nowIso } from '@/features/iel-demo/state/storage';

import { routes } from '@workspace/routes';
import { Badge } from '@workspace/ui/shadcn/badge';
import { Button } from '@workspace/ui/shadcn/button';

import { AtalhoDaEquipe } from '../shared/fluxo-por-link';
import { SuasRespostas } from '../shared/suas-respostas';
import { ConversaCarregando, ConversaGuiada } from './conversa-guiada';
import { useMontado } from './use-voz';

/**
 * A conversa do candidato, montada sobre o motor (C2).
 *
 * Grava pela mesma ação do questionário em telas (`answer-fit-questionnaire`),
 * com a versão do aceite e o relógio único da demo. O que a pessoa vê da vaga
 * sai de `getCandidateJobView` — atividade, cidade, segmento e turno, nunca o
 * nome da empresa (R5) — e nada aqui mostra percentual, ranking, outros
 * candidatos ou uma leitura sobre a pessoa: no fim, o que ela respondeu.
 *
 * O roteiro depende do estado (já respondeu? prazo vencido?) só até o
 * primeiro toque. Depois disso ele congela: a própria resposta muda o estado
 * para "já respondeu", e a conversa não pode trocar de roteiro no meio.
 *
 * Não há "responder de novo": a resposta é uma só e vale 12 meses. O único
 * recomeço é "Responder mesmo assim", de quem chegou fora do prazo.
 */
export function ConversaCandidato({
  applicationId,
  equipeLogada = false
}: {
  applicationId: string;
  /** Sessão da analista confirmada pela página: mostra o atalho de volta. */
  equipeLogada?: boolean;
}) {
  const montado = useMontado();
  const { state, dispatch } = useIelDemo();
  const [travada, setTravada] = useState<VarianteCandidato | null>(null);
  const [sessao, setSessao] = useState(0);

  const application = getApplication(state, applicationId);
  const vaga = getCandidateJobView(state, applicationId);
  const existente = getFitResponse(state, applicationId);

  const reuso = reaproveitamentoDaCandidatura(state, applicationId);

  /*
   * Registro não basta: com validade de 12 meses, um registro vencido é uma
   * vaga que volta a precisar das frases. "Já respondeu" é ter registro e
   * não faltar nenhuma.
   */
  const respondido = existente !== null && (reuso?.faltantes ?? 0) === 0;

  const varianteAtual: VarianteCandidato =
    !application || !vaga
      ? 'invalido'
      : respondido
        ? 'ja-respondeu'
        : reuso?.nadaAPerguntar
          ? 'reaproveita'
          : getFitStatus(state, application) === 'expirado'
            ? 'expirado'
            : 'novo';
  const variante = travada ?? varianteAtual;

  // Só o que falta perguntar: as frases da vaga menos as que a pessoa já
  // respondeu dentro dos 12 meses.
  const perguntas = application ? perguntasQueFaltam(state, applicationId) : [];
  const itemIds = perguntas.map((pergunta) => pergunta.itemId);

  if (!montado) return <ConversaCarregando />;

  const roteiro = montarRoteiroCandidato({
    variante,
    vaga,
    respondidoEm: existente?.answeredAt ?? null,
    frases: perguntas.map((pergunta) => ({
      itemId: pergunta.itemId,
      texto: pergunta.item.texto
    })),
    reuso
  });

  // Fora do prazo, "Responder mesmo assim" abre o roteiro normal.
  const responderMesmoAssim = () => {
    setTravada('novo');
    setSessao((atual) => atual + 1);
  };

  return (
    <ConversaGuiada
      key={`${variante}:${sessao}`}
      roteiro={roteiro}
      focarAoAbrir={sessao > 0}
      // Uma chave por candidatura: quem fecha o celular na frase 7 volta na 7.
      rascunhoChave={`iel-rascunho:conversa-fit:${applicationId}`}
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
      rodape={
        equipeLogada && application ? (
          <AtalhoDaEquipe
            href={
              application.talentId
                ? routes.dashboard.iel.talents.byId(application.talentId).index
                : routes.dashboard.iel.jobs.byId(application.jobId).index
            }
          />
        ) : null
      }
      onPrimeiraResposta={() => setTravada(variante)}
      onConcluir={(respostas) => {
        // Na conversa de reaproveitamento não há frase nenhuma: o que a
        // pessoa deu foi o aceite, e o que se grava é a confirmação.
        if (variante === 'reaproveita') {
          dispatch({
            type: 'reuse-fit-answers',
            applicationId,
            consentVersion: versaoDoAceiteVigente(),
            at: nowIso()
          });
          return;
        }
        const answers = respostasDaEscala(respostas, itemIds);
        if (!answers) return;
        dispatch({
          type: 'answer-fit-questionnaire',
          applicationId,
          answers,
          consentVersion: versaoDoAceiteVigente(),
          at: nowIso()
        });
      }}
      renderFim={(respostas) => {
        // As respostas resolvidas desta candidatura (reaproveitadas e novas),
        // já gravadas pelo `onConcluir`; se ainda não chegaram, as da
        // própria conversa.
        const resolvidas = respostasResolvidas(state, applicationId)?.valores;
        const valores =
          resolvidas && Object.keys(resolvidas).length > 0
            ? resolvidas
            : respostasDaEscala(respostas, itemIds);
        if (!valores || Object.keys(valores).length === 0) return null;
        return (
          <SuasRespostas
            papel="candidato"
            respostas={valores}
          />
        );
      }}
      renderAcoesFinais={(acoes) => (
        // A primeira ação do roteiro é a principal; as outras ficam discretas.
        <div className="flex flex-col gap-2">
          {acoes.map((acao, index) => {
            const variant = index === 0 ? 'default' : 'ghost';
            const classe = 'h-12 w-full text-[15px]';
            if (acao === 'ver-candidatura') {
              return (
                <Button
                  key={acao}
                  asChild
                  variant={variant}
                  className={classe}
                >
                  <Link
                    href={
                      routes.dashboard.iel.applications.byId(applicationId)
                        .index
                    }
                  >
                    Ver minha candidatura
                  </Link>
                </Button>
              );
            }
            return (
              <Button
                key={acao}
                variant={variant}
                className={classe}
                onClick={responderMesmoAssim}
              >
                Responder mesmo assim
              </Button>
            );
          })}
        </div>
      )}
    />
  );
}
