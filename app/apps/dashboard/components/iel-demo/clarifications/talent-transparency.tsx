'use client';

import { useState } from 'react';
import { getFitAxis } from '@/features/iel-demo/analysis/fit-axes';
import { plural } from '@/features/iel-demo/format';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import { getTalentTransparency } from '@/features/iel-demo/state/selectors';

import { Button } from '@workspace/ui';

import { formatDate, Panel, PanelHeader, SourceDot } from '../shared/ui';

/**
 * Devolutiva ao candidato.
 *
 * As exigências normativas do desafio pedem LGPD com transparência e controle
 * de acesso. A pessoa que está sendo analisada precisa alcançar o que foi
 * registrado a respeito dela, de onde veio e para onde foi — é isso que torna
 * possível contestar um registro errado antes que ele pese numa decisão.
 *
 * O recorte é estreito de propósito. O briefing determina que o candidato não
 * veja avaliações internas nem informação sobre outras pessoas, então nada da
 * análise por critério aparece aqui: nem estado, nem nota do analista, nem
 * comparação. O que aparece é a matéria-prima e o destino dela.
 */
export function TalentTransparency({ talentId }: { talentId: string }) {
  const { state } = useIelDemo();
  const [open, setOpen] = useState(false);
  const transparency = getTalentTransparency(state, talentId);

  const total = transparency.records.length + transparency.preferences.length;

  return (
    <Panel padding="sm">
      <PanelHeader
        eyebrow="Seus dados"
        title="O que está registrado sobre você"
        hint="Você pode ver a informação que a central reuniu a seu respeito, de onde ela veio e para quais empresas foi enviada. Se algum registro estiver errado, é possível corrigi-lo antes que ele pese numa decisão."
        meta={
          <>
            {plural(total, 'registro', 'registros')} ·{' '}
            {transparency.sharedWith.length === 0
              ? 'nenhuma empresa recebeu seu perfil até agora'
              : `${plural(transparency.sharedWith.length, 'empresa recebeu', 'empresas receberam')} seu perfil`}
          </>
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? 'Ocultar' : 'Ver meus dados'}
          </Button>
        }
      />

      {open ? (
        <div className="mt-4 space-y-4 border-t border-border pt-4">
          <section>
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Informações a seu respeito
            </h3>
            <ul className="mt-1.5 space-y-2">
              {transparency.records.map((record) => (
                <li key={record.id}>
                  <p className="text-xs leading-relaxed text-foreground/85">
                    {record.information}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
                    <SourceDot sourceId={record.sourceId} />
                    {record.originLabel} · {formatDate(record.updatedAt)}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          {transparency.preferences.length > 0 ? (
            <section>
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                O que você declarou sobre como prefere trabalhar
              </h3>
              <ul className="mt-1.5 space-y-2">
                {transparency.preferences.map((preference) => (
                  <li key={preference.id}>
                    <p className="text-xs leading-relaxed text-foreground/85">
                      <span className="font-medium text-foreground">
                        {getFitAxis(preference.axisId).label}:
                      </span>{' '}
                      {preference.value}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
                      <SourceDot sourceId={preference.sourceId} />
                      {preference.origin} · {formatDate(preference.updatedAt)}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section>
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Para quem seu perfil foi enviado
            </h3>
            {transparency.sharedWith.length === 0 ? (
              <p className="mt-1.5 text-xs text-muted-foreground">
                Nenhuma empresa recebeu seu perfil até agora. O envio só
                acontece quando o IEL registra um encaminhamento.
              </p>
            ) : (
              <ul className="mt-1.5 space-y-1.5">
                {transparency.sharedWith.map((entry, index) => (
                  <li
                    key={`${entry.jobTitle}-${index}`}
                    className="text-xs text-foreground/85"
                  >
                    {/* Atividade, localidade e segmento — nunca o nome da
                        empresa. R5: ele só aparece na entrevista. */}
                    <span className="font-medium text-foreground">
                      {entry.jobView?.activity ?? entry.jobTitle}
                    </span>
                    {entry.jobView ? (
                      <>
                        {' '}
                        · {entry.jobView.sector} · {entry.jobView.location}
                      </>
                    ) : null}
                    <span className="text-muted-foreground">
                      {entry.jobView ? ` · ${entry.jobView.shift}` : ''}
                      {entry.sharedAt ? ` · ${formatDate(entry.sharedAt)}` : ''}
                      {' · '}
                      {plural(
                        entry.recordCount,
                        'registro compartilhado',
                        'registros compartilhados'
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {transparency.internalCount > 0 ? (
            <p className="border-t border-border pt-3 text-[11px] leading-relaxed text-muted-foreground">
              O IEL mantém{' '}
              {plural(
                transparency.internalCount,
                'anotação interna de análise',
                'anotações internas de análise'
              )}{' '}
              a seu respeito. Elas não são enviadas às empresas e não aparecem
              aqui, mas a existência delas fica registrada.
            </p>
          ) : null}

          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Encontrou algo errado? Responda a pergunta abaixo dizendo o que
            precisa ser corrigido — a correção entra com a sua resposta como
            origem.
          </p>
        </div>
      ) : null}
    </Panel>
  );
}
