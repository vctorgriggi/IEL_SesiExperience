'use client';

import { useMemo, useState } from 'react';
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
  getTalent,
  perguntasDoCandidato,
  perguntasQueFaltam,
  reaproveitamentoDaCandidatura,
  respostasResolvidas,
  versaoDoAceiteVigente
} from '@/features/iel-demo/state/selectors';
import { nowIso } from '@/features/iel-demo/state/storage';

import { routes } from '@workspace/routes';
import { Badge } from '@workspace/ui/shadcn/badge';
import { Button } from '@workspace/ui/shadcn/button';

import { LeituraPessoal } from '../shared/leitura-pessoal';
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
  /*
   * "Responder de novo" recusa o reaproveitamento e refaz as frases todas —
   * metade reaproveitada e metade nova não seria "de novo". É o desfazer que
   * o aceite promete.
   */
  const [responderTudo, setResponderTudo] = useState(false);

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
        : reuso?.nadaAPerguntar && !responderTudo
          ? 'reaproveita'
          : getFitStatus(state, application) === 'expirado'
            ? 'expirado'
            : 'novo';
  const variante = travada ?? varianteAtual;

  /*
   * Só o que falta perguntar: as frases da vaga menos as que a pessoa já
   * respondeu dentro dos 12 meses. Quem pediu para responder de novo vê a
   * lista inteira.
   */
  const perguntas = !application
    ? []
    : responderTudo
      ? perguntasDoCandidato(state, application.jobId)
      : perguntasQueFaltam(state, applicationId);
  const itemIds = perguntas.map((pergunta) => pergunta.itemId);

  /*
   * O que a devolutiva lê no fim: as respostas resolvidas desta candidatura
   * (reaproveitadas e novas), já gravadas pelo `onConcluir`. Contexto sem o
   * nome da empresa (R5), e estável entre renderizações para a devolutiva
   * não pedir o texto de novo a cada fala que entra.
   */
  const atividade = vaga?.activity;
  const setor = vaga?.sector;
  const contextoDaLeitura = useMemo(
    () => ({ atividade, setor }),
    [atividade, setor]
  );
  const primeiroNome = application
    ? getTalent(application.talentId, state)?.name.split(' ')[0]
    : undefined;

  if (!montado) return <ConversaCarregando />;

  const roteiro = montarRoteiroCandidato({
    variante,
    vaga,
    respondidoEm: existente?.answeredAt ?? null,
    frases: perguntas.map((pergunta) => ({
      itemId: pergunta.itemId,
      cena: pergunta.item.cena,
      original: pergunta.item.texto
    })),
    reuso: responderTudo ? null : reuso
  });

  const recomecar = () => {
    setResponderTudo(true);
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
        const resolvidas = respostasResolvidas(state, applicationId)?.valores;
        const valores =
          resolvidas && Object.keys(resolvidas).length > 0
            ? resolvidas
            : respostasDaEscala(respostas, itemIds);
        if (!valores || Object.keys(valores).length === 0) return null;
        return (
          <LeituraPessoal
            papel="candidato"
            respostas={valores}
            primeiroNome={primeiroNome}
            contexto={contextoDaLeitura}
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
                  {/*
                   * Levava para `/fit`, o próprio questionário, com o rótulo
                   * "Ver o que está registrado sobre você" — a pessoa tocava
                   * esperando o seu registro e caía de volta na primeira
                   * pergunta. O registro mora em "Minha candidatura".
                   */}
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
