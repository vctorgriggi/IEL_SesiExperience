'use client';

import { useState } from 'react';
import type {
  ImportPlan,
  ImportPlanEntry
} from '@/features/iel-demo/analysis/spreadsheet-import';
import { plural } from '@/features/iel-demo/format';
import { getTalent } from '@/features/iel-demo/state/selectors';
import type { DemoState } from '@/features/iel-demo/types';

import { Button } from '@workspace/ui';

import { Panel, PanelHeader } from '../shared/ui';
import { GrupoDeDecisao, type EstadoDaImportacao } from './decision-group';

const LINHAS_VISIVEIS = 5;

const DESCARTADA = 'descartado pelo filtro do Empregare — entra no resgate';

type Linha = {
  id: string;
  texto: string;
  descartada: boolean;
};

type Grupo = {
  id: string;
  titulo: string;
  estado: EstadoDaImportacao;
  resumo?: string;
  linhas: Linha[];
};

function nomeDaPessoa(entrada: ImportPlanEntry, state: DemoState): string {
  return (
    entrada.talent?.name ??
    getTalent(entrada.talentId, state)?.name ??
    `Linha ${entrada.line}`
  );
}

function percentual(valor: number | null): string {
  return valor === null ? 'sem percentual' : `${valor}%`;
}

function montarLinhas(
  entradas: ImportPlanEntry[],
  state: DemoState,
  texto: (entrada: ImportPlanEntry, nome: string) => string
): Linha[] {
  return entradas.map((entrada) => ({
    id: `${entrada.line}`,
    texto: texto(entrada, nomeDaPessoa(entrada, state)),
    descartada: entrada.discarded
  }));
}

function montarGrupos(plano: ImportPlan, state: DemoState): Grupo[] {
  const por = (decisao: ImportPlanEntry['decision']): ImportPlanEntry[] =>
    plano.entries.filter((entrada) => entrada.decision === decisao);

  const novosTalentos = por('novo-talento');
  const novasCandidaturas = por('nova-candidatura');
  const atualizadas = por('match-atualizado');
  const ignoradas = por('ignorada');

  const grupos: Grupo[] = [];

  if (novosTalentos.length > 0) {
    grupos.push({
      id: 'novos',
      titulo: plural(novosTalentos.length, 'pessoa nova', 'pessoas novas'),
      estado: 'entram',
      resumo: 'Ninguém com esse e-mail estava na base.',
      linhas: montarLinhas(
        novosTalentos,
        state,
        (entrada, nome) =>
          `${nome} — ${percentual(entrada.technicalMatch)} nos requisitos da vaga`
      )
    });
  }

  if (novasCandidaturas.length > 0) {
    grupos.push({
      id: 'ja-na-base',
      titulo: plural(
        novasCandidaturas.length,
        'pessoa já estava na base',
        'pessoas já estavam na base'
      ),
      estado: 'entram',
      resumo: 'Entram nesta vaga sem virar cadastro novo.',
      linhas: montarLinhas(
        novasCandidaturas,
        state,
        (entrada, nome) =>
          `${nome} — ${percentual(entrada.technicalMatch)} nos requisitos da vaga`
      )
    });
  }

  if (atualizadas.length > 0) {
    const primeira = atualizadas[0];
    grupos.push({
      id: 'atualizadas',
      titulo: plural(
        atualizadas.length,
        'requisito da vaga atualizado',
        'requisitos da vaga atualizados'
      ),
      estado: 'atualizam',
      resumo: primeira
        ? `${nomeDaPessoa(primeira, state)}: ${percentual(primeira.previousTechnicalMatch)} → ${percentual(primeira.technicalMatch)}.`
        : undefined,
      linhas: montarLinhas(
        atualizadas,
        state,
        (entrada, nome) =>
          `${nome} — ${percentual(entrada.previousTechnicalMatch)} → ${percentual(entrada.technicalMatch)}`
      )
    });
  }

  if (ignoradas.length > 0) {
    grupos.push({
      id: 'ignoradas',
      titulo: plural(
        ignoradas.length,
        'pessoa já estava nesta vaga',
        'pessoas já estavam nesta vaga'
      ),
      estado: 'sem-mudanca',
      resumo: 'Mesmo percentual de antes: nada muda.',
      linhas: montarLinhas(ignoradas, state, (_entrada, nome) => nome)
    });
  }

  if (plano.errors.length > 0) {
    grupos.push({
      id: 'erros',
      titulo: plural(plano.errors.length, 'linha com erro', 'linhas com erro'),
      estado: 'com-erro',
      resumo: 'Ficam de fora. O resto da planilha entra normalmente.',
      linhas: plano.errors.map((erro, indice) => ({
        id: `${erro.line}-${erro.column}-${indice}`,
        texto: `Linha ${erro.line}, coluna ${erro.column} — ${erro.reason}`,
        descartada: false
      }))
    });
  }

  return grupos;
}

function ListaDoGrupo({ linhas }: { linhas: Linha[] }) {
  const [verTodas, setVerTodas] = useState(false);
  const visiveis = verTodas ? linhas : linhas.slice(0, LINHAS_VISIVEIS);

  return (
    <div className="space-y-2">
      <ul className="space-y-1.5">
        {visiveis.map((linha) => (
          <li
            key={linha.id}
            className="iel-prose text-sm text-foreground"
          >
            {linha.texto}
            {linha.descartada ? (
              <span className="block text-xs text-warning">{DESCARTADA}</span>
            ) : null}
          </li>
        ))}
      </ul>
      {linhas.length > visiveis.length ? (
        <button
          type="button"
          onClick={() => setVerTodas(true)}
          className="iel-interactive text-sm font-medium text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          Ver todas as {linhas.length}
        </button>
      ) : null}
    </div>
  );
}

/**
 * Passo 2: o que vai acontecer, antes de acontecer.
 *
 * O plano já está decidido linha a linha; esta tela só o conta em voz alta e
 * espera a confirmação. Nada é gravado enquanto o analista não confirma.
 */
export function ReviewStep({
  plano,
  state,
  jaImportada,
  onConfirmar,
  onTrocarArquivo
}: {
  plano: ImportPlan;
  state: DemoState;
  /** A mesma planilha já foi importada nesta vaga: confirmar não muda nada. */
  jaImportada: boolean;
  onConfirmar: () => void;
  onTrocarArquivo: () => void;
}) {
  const grupos = montarGrupos(plano, state);

  return (
    <Panel
      elevation={1}
      className="space-y-4"
    >
      <PanelHeader
        eyebrow="Passo 2"
        title="O que vai entrar"
        meta={
          jaImportada
            ? 'Esta planilha já foi importada nesta vaga: confirmar não muda nada.'
            : undefined
        }
      />

      {grupos.length === 0 ? (
        <p className="iel-prose text-sm text-muted-foreground">
          A planilha não trouxe nenhuma linha para esta vaga. Confira se o
          arquivo é o da vaga certa.
        </p>
      ) : (
        <div>
          {grupos.map((grupo) => (
            <GrupoDeDecisao
              key={grupo.id}
              titulo={grupo.titulo}
              estado={grupo.estado}
              resumo={grupo.resumo}
            >
              <ListaDoGrupo linhas={grupo.linhas} />
            </GrupoDeDecisao>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center">
        <Button
          size="large"
          onClick={onConfirmar}
        >
          Confirmar importação
        </Button>
        <Button
          variant="outline"
          size="large"
          onClick={onTrocarArquivo}
        >
          Escolher outro arquivo
        </Button>
      </div>
    </Panel>
  );
}
