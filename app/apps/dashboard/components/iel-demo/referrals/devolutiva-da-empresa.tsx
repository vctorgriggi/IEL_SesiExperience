'use client';

import { useState } from 'react';
import {
  DESFECHO_BOTAO,
  MOTIVO_NAO_CONTRATOU_LABEL,
  MOTIVO_SAIDA_LABEL,
  MOTIVOS_NAO_CONTRATOU,
  MOTIVOS_SAIDA,
  PERMANENCIA_DIAS,
  type MotivoNaoContratacao,
  type MotivoSaida
} from '@/features/iel-demo/analysis/devolutiva';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import type { ReferralReportPerson } from '@/features/iel-demo/state/selectors';
import { nowIso } from '@/features/iel-demo/state/storage';
import { CircleCheck, CircleDashed, CircleMinus, Undo2 } from 'lucide-react';

import { toast } from '@workspace/ui';
import { cn } from '@workspace/ui/lib/utils';
import { Button } from '@workspace/ui/shadcn/button';
import { Label } from '@workspace/ui/shadcn/label';

import { BADGE_DE_ESTADO } from '../metricas/cores';

/**
 * A devolutiva de um clique, na página que a empresa abre por link (C3).
 *
 * Fica **aqui**, e não numa tela nova, porque é aqui que o RH já está: ele
 * abriu o link para escolher quem chamar, e é no mesmo lugar que ele volta
 * quando o processo termina. "Se colocar mais uma etapa para a empresa, eles
 * não vão fazer" (00:23:28) — então não há login, não há formulário e não há
 * botão de enviar. Um clique por pessoa, e acabou.
 *
 * O motivo vem depois do clique, em lista curta e com texto livre, sempre
 * opcional: o dado que o IEL precisa é o desfecho; o motivo é cortesia de
 * quem tiver dez segundos. E é operacional — salário, horário, contrato,
 * desistência —, nunca saúde, família ou desempenho pessoal.
 *
 * "Não contratei" não é avaliação da pessoa exibida a ninguém: é decisão da
 * empresa sobre o processo dela, e a tela diz isso com todas as letras.
 */

/** Chips de motivo: lista curta, clique salva, nada obrigatório. */
function MotivoChips<T extends string>({
  legenda,
  opcoes,
  rotulos,
  selecionado,
  onEscolher
}: {
  legenda: string;
  opcoes: readonly T[];
  rotulos: Record<T, string>;
  selecionado: T | null;
  onEscolher: (motivo: T) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs text-muted-foreground">{legenda}</p>
      <div className="flex flex-wrap gap-1.5">
        {opcoes.map((motivo) => (
          <Button
            key={motivo}
            type="button"
            size="sm"
            variant={selecionado === motivo ? 'default' : 'outline'}
            aria-pressed={selecionado === motivo}
            className="h-7 rounded-full px-3 text-xs font-normal"
            onClick={() => onEscolher(motivo)}
          >
            {rotulos[motivo]}
          </Button>
        ))}
      </div>
    </div>
  );
}

/** O que já foi respondido, escrito por extenso ao lado do ícone. */
function Registrado({
  texto,
  tom
}: {
  texto: string;
  tom: 'combina' | 'neutro' | 'atencao';
}) {
  const Icone =
    tom === 'combina'
      ? CircleCheck
      : tom === 'atencao'
        ? CircleMinus
        : CircleDashed;
  return (
    <span
      className={cn(
        'inline-flex h-6 w-fit shrink-0 items-center gap-1.5 self-start rounded-md px-2 text-xs font-medium',
        BADGE_DE_ESTADO[tom]
      )}
    >
      <Icone
        aria-hidden="true"
        className="size-3.5"
      />
      {texto}
    </span>
  );
}

export function DevolutivaDaEmpresa({
  referralId,
  person
}: {
  referralId: string;
  person: ReferralReportPerson;
}) {
  const { dispatch } = useIelDemo();
  const [explicacao, setExplicacao] = useState('');
  const { outcome, retentionState } = person;
  const primeiroNome = person.name.split(' ')[0] ?? person.name;
  const campoId = `devolutiva-${person.applicationId}`;

  const registrar = (
    hiring: 'contratou' | 'nao-contratou',
    reason: MotivoNaoContratacao | null,
    note: string
  ) => {
    dispatch({
      type: 'company-outcome',
      referralId,
      applicationId: person.applicationId,
      hiring,
      reason,
      note,
      at: nowIso()
    });
  };

  const registrarPermanencia = (
    retention: 'continua' | 'saiu-antes-de-90-dias',
    reason: MotivoSaida | null,
    note: string
  ) => {
    dispatch({
      type: 'company-retention',
      referralId,
      applicationId: person.applicationId,
      retention,
      reason,
      note,
      at: nowIso()
    });
  };

  const desfazer = () => {
    dispatch({
      type: 'clear-company-outcome',
      referralId,
      applicationId: person.applicationId,
      at: nowIso()
    });
    setExplicacao('');
    toast.info('Resposta desfeita. Você pode responder de novo.');
  };

  const botaoDesfazer = (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      className="h-7 px-2 text-xs text-muted-foreground"
      onClick={desfazer}
    >
      <Undo2 aria-hidden="true" />
      Corrigir
    </Button>
  );

  /** O texto livre, oferecido só depois de a pessoa escolher um motivo. */
  const campoLivre = (salvar: (texto: string) => void) => (
    <div className="flex flex-col gap-1.5">
      <Label
        htmlFor={campoId}
        className="text-xs font-normal text-muted-foreground"
      >
        Quer explicar em uma frase? Também é opcional.
      </Label>
      <div className="flex flex-wrap items-center gap-2">
        <input
          id={campoId}
          value={explicacao}
          onChange={(evento) => setExplicacao(evento.target.value)}
          className="h-8 min-w-0 flex-1 rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          placeholder="Opcional"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8"
          disabled={explicacao.trim().length === 0}
          onClick={() => {
            salvar(explicacao);
            toast.success('Obrigado. Anotado.');
          }}
        >
          Salvar
        </Button>
      </div>
    </div>
  );

  return (
    <section
      aria-label={`O que aconteceu com ${person.name}`}
      className="col-span-full flex flex-col gap-3 border-t pt-4"
    >
      {outcome.hiring === 'pendente' ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <p className="text-sm font-medium">
            O que aconteceu com {primeiroNome}?
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => {
                registrar('contratou', null, '');
                toast.success(
                  'Obrigado. O IEL já conta essa contratação no indicador.'
                );
              }}
            >
              {DESFECHO_BOTAO.contratou}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                registrar('nao-contratou', null, '');
                toast.success('Obrigado. Retorno registrado.');
              }}
            >
              {DESFECHO_BOTAO['nao-contratou']}
            </Button>
          </div>
        </div>
      ) : null}

      {outcome.hiring === 'nao-contratou' ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Registrado
              texto={`Você respondeu: não contratei ${primeiroNome}`}
              tom="neutro"
            />
            {botaoDesfazer}
          </div>
          <MotivoChips
            legenda="Se quiser, diga o motivo. É opcional e ajuda o IEL a mandar gente mais próxima do que a vaga pede."
            opcoes={MOTIVOS_NAO_CONTRATOU}
            rotulos={MOTIVO_NAO_CONTRATOU_LABEL}
            selecionado={outcome.hiringReason}
            onEscolher={(motivo) =>
              registrar('nao-contratou', motivo, explicacao)
            }
          />
          {outcome.hiringReason
            ? campoLivre((texto) =>
                registrar('nao-contratou', outcome.hiringReason, texto)
              )
            : null}
          {outcome.hiringNote ? (
            <p className="text-xs text-muted-foreground">
              Você escreveu: “{outcome.hiringNote}”
            </p>
          ) : null}
        </>
      ) : null}

      {outcome.hiring === 'contratou' ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Registrado
              texto={`Você respondeu: contratei ${primeiroNome}`}
              tom="combina"
            />
            {retentionState === 'no-prazo' ? botaoDesfazer : null}
          </div>

          {retentionState === 'no-prazo' ? (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <p className="text-xs text-muted-foreground">
                Se {primeiroNome} sair antes de {PERMANENCIA_DIAS} dias, avise
                por aqui. Sem pressa: vamos perguntar de novo quando o prazo
                fechar.
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => {
                  registrarPermanencia('saiu-antes-de-90-dias', null, '');
                  toast.success('Obrigado. Registrado.');
                }}
              >
                Saiu antes de {PERMANENCIA_DIAS} dias
              </Button>
            </div>
          ) : null}

          {retentionState === 'a-perguntar' ? (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <p className="text-sm font-medium">
                Faz {PERMANENCIA_DIAS} dias. {primeiroNome} continua na equipe?
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    registrarPermanencia('continua', null, '');
                    toast.success('Obrigado. Registrado.');
                  }}
                >
                  Continua
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    registrarPermanencia('saiu-antes-de-90-dias', null, '');
                    toast.success('Obrigado. Registrado.');
                  }}
                >
                  Saiu antes de {PERMANENCIA_DIAS} dias
                </Button>
              </div>
            </div>
          ) : null}

          {retentionState === 'continua' ? (
            <Registrado
              texto={`Continua na equipe depois de ${PERMANENCIA_DIAS} dias`}
              tom="combina"
            />
          ) : null}

          {retentionState === 'saiu-antes-de-90-dias' ? (
            <>
              <Registrado
                texto={`Saiu antes de ${PERMANENCIA_DIAS} dias`}
                tom="atencao"
              />
              <MotivoChips
                legenda="Se quiser, diga o motivo da saída. Opcional."
                opcoes={MOTIVOS_SAIDA}
                rotulos={MOTIVO_SAIDA_LABEL}
                selecionado={outcome.retentionReason}
                onEscolher={(motivo) =>
                  registrarPermanencia(
                    'saiu-antes-de-90-dias',
                    motivo,
                    explicacao
                  )
                }
              />
              {outcome.retentionReason
                ? campoLivre((texto) =>
                    registrarPermanencia(
                      'saiu-antes-de-90-dias',
                      outcome.retentionReason,
                      texto
                    )
                  )
                : null}
              {outcome.retentionNote ? (
                <p className="text-xs text-muted-foreground">
                  Você escreveu: “{outcome.retentionNote}”
                </p>
              ) : null}
            </>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
