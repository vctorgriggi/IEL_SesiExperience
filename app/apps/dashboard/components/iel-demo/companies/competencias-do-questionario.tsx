'use client';

import { useState } from 'react';
import {
  FIT_AXES,
  MAXIMO_DE_COMPETENCIAS,
  MINIMO_DE_COMPETENCIAS,
  type FitAxisId
} from '@/features/iel-demo/analysis/fit-axes';
import { plural } from '@/features/iel-demo/format';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  competenciasDaEmpresa,
  getCultureSampleProgress,
  resumoDeCompetencias
} from '@/features/iel-demo/state/selectors';
import { nowIso } from '@/features/iel-demo/state/storage';

import { toast } from '@workspace/ui';
import { cn } from '@workspace/ui/lib/utils';
import { Badge } from '@workspace/ui/shadcn/badge';
import { Button } from '@workspace/ui/shadcn/button';
import { Checkbox } from '@workspace/ui/shadcn/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@workspace/ui/shadcn/tooltip';

/**
 * O que a empresa quer medir: de 3 a 11 competências.
 *
 * O IEL pediu em 20/09/2026 que o envio do questionário deixasse a empresa
 * escolher "quais competências ela julga relevante dentre as 11 criadas,
 * podendo selecionar entre 3 a 11". A escolha não é preferência de tela: ela
 * manda no bloco que o colaborador recebe, nas frases que o candidato
 * responde e no denominador da aderência.
 *
 * Duas portas, uma ação só (`set-company-competencies`): a analista escolhe
 * junto com a empresa na hora de enviar o convite, e a empresa reabre a
 * escolha na própria página. O piso de 3 é recusado pelo reducer, não só
 * pelo formulário — e a tela escreve o motivo em vez de só apagar o botão.
 */

/** O texto da trava, quando faltam competências para chegar ao mínimo. */
export function razaoDoMinimo(quantas: number): string | null {
  if (quantas >= MINIMO_DE_COMPETENCIAS) return null;
  const faltam = MINIMO_DE_COMPETENCIAS - quantas;
  return `Marque ${faltam === 1 ? 'mais uma competência' : `mais ${faltam} competências`}: o questionário precisa de pelo menos ${MINIMO_DE_COMPETENCIAS} para o resultado significar alguma coisa.`;
}

/** "8 de 11 competências · mínimo 3". */
export function contadorDeCompetencias(quantas: number): string {
  return `${quantas} de ${MAXIMO_DE_COMPETENCIAS} ${plural(quantas, 'competência', 'competências', { includeCount: false })} · mínimo ${MINIMO_DE_COMPETENCIAS}`;
}

/**
 * A lista das 11 com caixa de seleção, em duas colunas no monitor e uma no
 * celular. Controlada: quem usa decide quando gravar.
 */
export function ListaDeCompetencias({
  escolhidas,
  onChange,
  idPrefix
}: {
  escolhidas: FitAxisId[];
  onChange: (axisIds: FitAxisId[]) => void;
  /** Prefixo dos ids, para duas listas na mesma página não colidirem. */
  idPrefix: string;
}) {
  const marcadas = new Set(escolhidas);
  const razao = razaoDoMinimo(escolhidas.length);

  const alternar = (axisId: FitAxisId, marcar: boolean) => {
    const proxima = marcar
      ? [...escolhidas, axisId]
      : escolhidas.filter((id) => id !== axisId);
    onChange(proxima);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p
          className="text-xs tabular-nums text-muted-foreground"
          aria-live="polite"
        >
          {contadorDeCompetencias(escolhidas.length)}
        </p>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange(FIT_AXES.map((axis) => axis.id))}
            disabled={escolhidas.length === MAXIMO_DE_COMPETENCIAS}
          >
            Marcar todas
          </Button>
        </div>
      </div>

      {/*
       * Duas colunas a partir do monitor, uma no celular: cada item tem nome
       * e descrição, e em coluna única a 1440 a lista ficaria com meia tela
       * vazia ao lado.
       */}
      <ul className="grid gap-2 lg:grid-cols-2">
        {FIT_AXES.map((axis) => {
          const id = `${idPrefix}-${axis.id}`;
          const marcada = marcadas.has(axis.id);
          return (
            <li key={axis.id}>
              <label
                htmlFor={id}
                className={cn(
                  'flex h-full cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
                  marcada ? 'bg-card' : 'bg-muted/40'
                )}
              >
                <Checkbox
                  id={id}
                  className="mt-0.5"
                  checked={marcada}
                  onCheckedChange={(valor) => alternar(axis.id, valor === true)}
                />
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{axis.label}</span>
                  <span className="text-xs leading-relaxed text-muted-foreground">
                    {axis.description}
                  </span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      {/*
       * A razão é dita, não só sinalizada por um botão apagado: quem marcou
       * duas precisa saber o que fazer para destravar.
       */}
      {razao ? (
        <p
          role="alert"
          className="rounded-lg border border-[hsl(var(--estado-atencao))] bg-[hsl(var(--estado-atencao-bg))] p-3 text-sm text-[hsl(var(--estado-atencao-fg))]"
        >
          {razao}
        </p>
      ) : null}
    </div>
  );
}

/**
 * O passo do formulário de convite: a analista marca o que a empresa quer
 * medir antes de digitar os e-mails.
 */
export function PassoDeCompetencias({
  escolhidas,
  onChange,
  idPrefix
}: {
  escolhidas: FitAxisId[];
  onChange: (axisIds: FitAxisId[]) => void;
  idPrefix: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-medium">O que a empresa quer medir</h3>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Marque as competências que a empresa considera relevantes para esta
          equipe. Quem for convidado responde só sobre o que ficar marcado, e é
          só isso que entra na comparação com os candidatos.
        </p>
      </div>
      <ListaDeCompetencias
        escolhidas={escolhidas}
        onChange={onChange}
        idPrefix={idPrefix}
      />
    </div>
  );
}

/**
 * A mesma escolha na página da empresa, editável e com botão de gravar.
 *
 * É a porta da persona gestor: a empresa mexe no próprio critério sem passar
 * pela analista. Quando a amostra já respondeu, a tela diz numa linha o que
 * muda — retirar um tema não apaga resposta nenhuma.
 */
export function CompetenciasDaEmpresaCard({
  companyId,
  decidedBy
}: {
  companyId: string;
  decidedBy: 'analista' | 'empresa';
}) {
  const { state, dispatch } = useIelDemo();
  const gravadas = competenciasDaEmpresa(state, companyId);
  const [escolhidas, setEscolhidas] = useState<FitAxisId[]>(gravadas);
  const progress = getCultureSampleProgress(state, companyId);

  const mudou =
    escolhidas.length !== gravadas.length ||
    escolhidas.some((id) => !gravadas.includes(id));
  const razao = razaoDoMinimo(escolhidas.length);

  const salvar = () => {
    dispatch({
      type: 'set-company-competencies',
      companyId,
      axisIds: escolhidas,
      decidedBy,
      at: nowIso()
    });
    toast.success(
      `${plural(escolhidas.length, 'competência guardada', 'competências guardadas')}. O próximo convite e o questionário dos candidatos já saem com elas.`
    );
  };

  return (
    <section className="flex flex-col gap-4 rounded-lg border p-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold">O que a empresa quer medir</h2>
        <p className="text-xs leading-relaxed text-muted-foreground">
          De {MINIMO_DE_COMPETENCIAS} a {MAXIMO_DE_COMPETENCIAS} competências. O
          que ficar marcado é o que os colaboradores respondem, o que os
          candidatos respondem e o que entra na conta da aderência.
        </p>
      </div>

      <ListaDeCompetencias
        escolhidas={escolhidas}
        onChange={setEscolhidas}
        idPrefix={`empresa-${companyId}`}
      />

      {/*
       * Só aparece quando há resposta na base: com a consulta em branco não
       * há nada a avisar, e a linha viraria ruído.
       */}
      {progress.answered > 0 ? (
        <p className="text-xs leading-relaxed text-muted-foreground">
          As respostas dos temas retirados continuam guardadas e deixam de
          contar. Se a empresa reincluir o tema, elas voltam a valer.
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          disabled={!mudou || razao !== null}
          onClick={salvar}
        >
          Salvar competências
        </Button>
        {mudou ? (
          <Button
            variant="ghost"
            onClick={() => setEscolhidas(gravadas)}
          >
            Desfazer
          </Button>
        ) : null}
      </div>
    </section>
  );
}

/** "Competências escolhidas: 8 de 11", com as retiradas ao lado. */
export function LinhaDeCompetencias({
  companyId,
  className
}: {
  companyId: string;
  className?: string;
}) {
  const { state } = useIelDemo();
  const resumo = resumoDeCompetencias(state, companyId);
  const retiradas = resumo.retiradas
    .map((id) => FIT_AXES.find((axis) => axis.id === id)?.label ?? id)
    .join(', ');

  return (
    <p
      className={cn(
        'flex flex-wrap items-center gap-2 text-sm text-muted-foreground',
        className
      )}
    >
      <span>
        Competências escolhidas:{' '}
        <span className="font-medium text-foreground tabular-nums">
          {resumo.escolhidas.length} de {resumo.total}
        </span>
      </span>
      {resumo.completo ? null : (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className="cursor-help px-1.5 font-normal text-muted-foreground"
              >
                fora: {retiradas}
              </Badge>
            </TooltipTrigger>
            <TooltipContent className="max-w-72 text-pretty">
              A empresa não pediu {retiradas.toLowerCase()}. Ninguém responde
              sobre{' '}
              {resumo.retiradas.length === 1 ? 'esse tema' : 'esses temas'} e{' '}
              {resumo.retiradas.length === 1
                ? 'ele não entra'
                : 'eles não entram'}{' '}
              na conta da aderência.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </p>
  );
}

/** O que aparece no lugar do número, num tema que a empresa não pediu. */
export const TEMA_NAO_PEDIDO = 'A empresa não pediu esta competência';
