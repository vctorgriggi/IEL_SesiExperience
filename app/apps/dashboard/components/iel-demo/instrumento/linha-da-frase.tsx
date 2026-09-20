'use client';

import { useId, useState } from 'react';
import {
  discrimina,
  getItem,
  itemAtivo,
  motivoParaNaoDesligar,
  motivoParaNaoDesmarcarDiscrimina,
  parDoItem,
  type ConfiguracaoDoInstrumento
} from '@/features/iel-demo/analysis/instrumento';
import { IconArrowDown, IconArrowUp } from '@tabler/icons-react';

import { cn } from '@workspace/ui/lib/utils';
import { Badge } from '@workspace/ui/shadcn/badge';
import { Button } from '@workspace/ui/shadcn/button';
import { Label } from '@workspace/ui/shadcn/label';
import { Switch } from '@workspace/ui/shadcn/switch';

import { BADGE_DE_ESTADO, SELO, TEXTO_DE_ESTADO } from '../metricas/cores';

/**
 * Uma frase do instrumento, como a analista a controla.
 *
 * A **cena** vem em destaque porque é o que a pessoa lê na tela de resposta;
 * a frase original do cliente fica "num toque", como nas telas de resposta.
 * Polo e par são jargão do instrumento e ficam em letra pequena, com a
 * palavra ao lado da seta. Os dois interruptores têm rótulo escrito e, quando
 * uma regra impede o ajuste, o interruptor fica desabilitado e o motivo
 * aparece ao lado — bloqueio sem explicação seria um botão quebrado.
 */
export function LinhaDaFrase({
  itemId,
  config,
  padrao,
  escolhidaEm,
  ajudaId,
  onAjustar
}: {
  itemId: string;
  config: ConfiguracaoDoInstrumento;
  /** É a frase padrão do tema com a configuração em vigor. */
  padrao: boolean;
  /** Em quantas empresas com perfil fechado ela é a escolhida do candidato. */
  escolhidaEm: number;
  /** Id do parágrafo que explica os interruptores (`aria-describedby`). */
  ajudaId: string;
  onAjustar: (
    itemId: string,
    ajuste: { ativa?: boolean; discrimina?: boolean }
  ) => void;
}) {
  const item = getItem(itemId);
  const [mostrarOriginal, setMostrarOriginal] = useState(false);
  const idBase = useId();
  if (!item) return null;

  const ativa = itemAtivo(itemId, config);
  const separa = discrimina(item, config);
  const bloqueioDesligar = ativa ? motivoParaNaoDesligar(itemId, config) : null;
  const bloqueioSepara = separa
    ? motivoParaNaoDesmarcarDiscrimina(itemId, config)
    : null;
  const par = parDoItem(itemId);
  const originalId = `${idBase}-original`;
  const motivoId = `${idBase}-motivo`;
  const motivo = bloqueioDesligar ?? bloqueioSepara;

  return (
    <li className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge
            variant="outline"
            className="tabular-nums"
          >
            {item.id}
          </Badge>
          {padrao ? <Badge variant="secondary">Padrão do tema</Badge> : null}
          {!ativa ? (
            <Badge className={cn(SELO, BADGE_DE_ESTADO.neutro)}>
              Desligada
            </Badge>
          ) : null}
          <span className="text-xs text-muted-foreground">{item.subtema}</span>
        </div>

        <p
          className={cn(
            'text-sm font-medium',
            !ativa && 'text-muted-foreground'
          )}
        >
          {item.cena}
        </p>

        <div>
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-xs"
            aria-expanded={mostrarOriginal}
            aria-controls={originalId}
            onClick={() => setMostrarOriginal((aberto) => !aberto)}
          >
            {mostrarOriginal
              ? 'Esconder a frase original'
              : 'Ver a frase original'}
          </Button>
          {mostrarOriginal ? (
            <p
              id={originalId}
              className="mt-1 text-sm text-muted-foreground"
            >
              “{item.texto}”
            </p>
          ) : null}
        </div>

        {/*
         * Polo e par: a seta é só reforço; a palavra diz o que é. "Mesmo
         * sentido" quer dizer que concordar com a frase é concordar com o
         * tema; "invertida", o contrário (a resposta entra espelhada).
         */}
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            {item.polo === 1 ? (
              <IconArrowUp
                aria-hidden
                className="size-3.5"
              />
            ) : (
              <IconArrowDown
                aria-hidden
                className="size-3.5"
              />
            )}
            {item.polo === 1 ? 'Mesmo sentido do tema' : 'Invertida'}
          </span>
          {par ? (
            <span>
              {par.invertido ? 'Par invertido com' : 'Equivale a'}{' '}
              <span className="tabular-nums">{par.outro}</span>
            </span>
          ) : null}
          <span className="tabular-nums">
            {escolhidaEm === 0
              ? 'Nenhuma empresa a escolheu para o candidato'
              : escolhidaEm === 1
                ? 'Escolhida para o candidato em 1 empresa'
                : `Escolhida para o candidato em ${escolhidaEm} empresas`}
          </span>
        </p>
      </div>

      <div className="flex shrink-0 flex-col gap-2 lg:w-64 lg:items-end">
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <div className="flex items-center gap-2">
            <Switch
              id={`${idBase}-ativa`}
              checked={ativa}
              disabled={bloqueioDesligar !== null}
              aria-describedby={
                bloqueioDesligar ? `${motivoId} ${ajudaId}` : ajudaId
              }
              onCheckedChange={(valor) => onAjustar(itemId, { ativa: valor })}
            />
            <Label
              htmlFor={`${idBase}-ativa`}
              className="font-normal"
            >
              Ligada
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id={`${idBase}-separa`}
              checked={separa}
              disabled={!ativa || bloqueioSepara !== null}
              aria-describedby={
                bloqueioSepara ? `${motivoId} ${ajudaId}` : ajudaId
              }
              onCheckedChange={(valor) =>
                onAjustar(itemId, { discrimina: valor })
              }
            />
            <Label
              htmlFor={`${idBase}-separa`}
              className="font-normal"
            >
              Separa pessoas
            </Label>
          </div>
        </div>
        {motivo ? (
          <p
            id={motivoId}
            className={cn('text-xs lg:text-right', TEXTO_DE_ESTADO.atencao)}
          >
            {motivo}
          </p>
        ) : null}
      </div>
    </li>
  );
}
