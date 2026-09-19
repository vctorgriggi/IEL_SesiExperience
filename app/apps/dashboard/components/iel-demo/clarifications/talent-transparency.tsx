'use client';

import { useState, type ReactNode } from 'react';
import { getFitAxis } from '@/features/iel-demo/analysis/fit-axes';
import { plural } from '@/features/iel-demo/format';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import { getTalentTransparency } from '@/features/iel-demo/state/selectors';

import { Button } from '@workspace/ui/shadcn/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@workspace/ui/shadcn/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@workspace/ui/shadcn/collapsible';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@workspace/ui/shadcn/table';

import { formatarData } from '../shared/datas';

/**
 * Devolutiva ao candidato.
 *
 * As exigências normativas do desafio pedem LGPD com transparência e controle
 * de acesso. A pessoa que está sendo analisada precisa alcançar o que foi
 * registrado a respeito dela, de onde veio e para onde foi — é isso que torna
 * possível contestar um registro errado antes que ele pese numa decisão.
 * LGPD, art. 9º: "O titular tem direito ao acesso facilitado às informações
 * sobre o tratamento de seus dados".
 *
 * O recorte é estreito de propósito. O briefing determina que o candidato não
 * veja avaliações internas nem informação sobre outras pessoas, então nada da
 * análise por critério aparece aqui: nem estado, nem nota do analista, nem
 * comparação. O que aparece é a matéria-prima e o destino dela — e o destino
 * é descrito por atividade, segmento e localidade, nunca pelo nome da empresa
 * (R5).
 *
 * A existência das anotações internas é declarada mesmo sem o conteúdo: saber
 * que elas existem é o que permite pedir acesso ou correção. Omiti-las seria
 * transformar "não posso mostrar" em "não existe".
 */
export function TalentTransparency({ talentId }: { talentId: string }) {
  const { state } = useIelDemo();
  const [open, setOpen] = useState(false);
  const transparency = getTalentTransparency(state, talentId);

  const total = transparency.records.length + transparency.preferences.length;

  return (
    <Card>
      <Collapsible
        open={open}
        onOpenChange={setOpen}
      >
        <CardHeader>
          <CardDescription>Seus dados</CardDescription>
          <CardTitle className="text-base">
            {/* Seção da página do candidato: abaixo do título da tela. */}
            <h2>O que está registrado sobre você</h2>
          </CardTitle>
          <CardAction>
            <CollapsibleTrigger asChild>
              <Button
                variant="link"
                className="px-0"
              >
                {open ? 'Ocultar' : 'Ver meus dados'}
              </Button>
            </CollapsibleTrigger>
          </CardAction>
        </CardHeader>

        <CardContent className="pt-4 text-sm leading-relaxed text-muted-foreground">
          {plural(total, 'registro', 'registros')} ·{' '}
          {transparency.sharedWith.length === 0
            ? 'nenhuma empresa recebeu seu perfil até agora'
            : `${plural(transparency.sharedWith.length, 'empresa recebeu', 'empresas receberam')} seu perfil`}
          . Se algum registro estiver errado, é possível corrigi-lo antes que
          ele pese numa decisão.
        </CardContent>

        <CollapsibleContent>
          <CardContent className="flex flex-col gap-6 pt-4">
            <Secao titulo="Informações a seu respeito">
              <Table>
                <caption className="sr-only">
                  Informações a seu respeito, de onde vieram e quando foram
                  atualizadas
                </caption>
                <TableHeader>
                  <TableRow>
                    <TableHead scope="col">Informação</TableHead>
                    <TableHead scope="col">De onde veio</TableHead>
                    <TableHead scope="col">Atualizada em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transparency.records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="max-w-[28ch] whitespace-normal text-foreground">
                        {record.information}
                      </TableCell>
                      <TableCell className="whitespace-normal text-muted-foreground">
                        {record.originLabel}
                      </TableCell>
                      <TableCell className="text-muted-foreground tabular-nums">
                        {formatarData(record.updatedAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Secao>

            {transparency.preferences.length > 0 ? (
              <Secao titulo="O que você declarou sobre como prefere trabalhar">
                <Table>
                  <caption className="sr-only">
                    O que você declarou sobre como prefere trabalhar
                  </caption>
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col">Ponto</TableHead>
                      <TableHead scope="col">Sua resposta</TableHead>
                      <TableHead scope="col">De onde veio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transparency.preferences.map((preference) => (
                      <TableRow key={preference.id}>
                        <TableCell className="whitespace-normal font-medium text-foreground">
                          {getFitAxis(preference.axisId).label}
                        </TableCell>
                        <TableCell className="max-w-[24ch] whitespace-normal text-foreground">
                          {preference.value}
                        </TableCell>
                        <TableCell className="whitespace-normal text-muted-foreground">
                          {preference.origin} ·{' '}
                          {formatarData(preference.updatedAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Secao>
            ) : null}

            <Secao titulo="Para quem seu perfil foi enviado">
              {transparency.sharedWith.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma empresa recebeu seu perfil até agora. O envio só
                  acontece quando o IEL registra um encaminhamento.
                </p>
              ) : (
                <Table>
                  <caption className="sr-only">
                    Para quem seu perfil foi enviado
                  </caption>
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col">Vaga</TableHead>
                      <TableHead scope="col">Onde</TableHead>
                      <TableHead scope="col">Enviado em</TableHead>
                      <TableHead scope="col">Registros</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transparency.sharedWith.map((entry, index) => (
                      <TableRow key={`${entry.jobTitle}-${index}`}>
                        {/* Atividade, segmento e localidade — nunca o nome da
                            empresa. R5: ele só aparece na entrevista. */}
                        <TableCell className="whitespace-normal font-medium text-foreground">
                          {entry.jobView?.activity ?? entry.jobTitle}
                          {entry.jobView ? (
                            <span className="block text-xs font-normal text-muted-foreground">
                              {entry.jobView.sector} · {entry.jobView.shift}
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell className="whitespace-normal text-muted-foreground">
                          {entry.jobView?.location ?? '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground tabular-nums">
                          {entry.sharedAt ? formatarData(entry.sharedAt) : '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground tabular-nums">
                          {entry.recordCount}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Secao>

            {transparency.internalCount > 0 ? (
              <p className="border-t pt-4 text-xs leading-relaxed text-muted-foreground">
                O IEL mantém{' '}
                {plural(
                  transparency.internalCount,
                  'anotação interna de análise',
                  'anotações internas de análise'
                )}{' '}
                a seu respeito. Elas não são enviadas às empresas e não aparecem
                aqui, mas a existência delas fica registrada e você pode pedir
                acesso.
              </p>
            ) : null}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-xs font-medium text-muted-foreground">{titulo}</h3>
      <div className="overflow-hidden rounded-lg border">{children}</div>
    </section>
  );
}
