'use client';

import { plural } from '@/features/iel-demo/format';
import { getImportHistory } from '@/features/iel-demo/state/selectors';
import type { DemoState } from '@/features/iel-demo/types';

import { Badge } from '@workspace/ui/shadcn/badge';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@workspace/ui/shadcn/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@workspace/ui/shadcn/table';

import { formatarDataHora } from '../shared/datas';

/** Importações já aplicadas nesta vaga, com o que cada uma fez. */
export function ImportHistory({
  state,
  jobId
}: {
  state: DemoState;
  jobId: string;
}) {
  const historico = getImportHistory(state, jobId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Importações desta vaga</CardTitle>
        <CardDescription>
          Toda planilha confirmada fica registrada com o que ela mudou.
        </CardDescription>
        <CardAction>
          <Badge
            variant="outline"
            className="text-muted-foreground"
          >
            {historico.length === 0
              ? 'nenhuma ainda'
              : plural(historico.length, 'importação', 'importações')}
          </Badge>
        </CardAction>
      </CardHeader>

      <CardContent>
        {historico.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Assim que você confirmar a primeira planilha, ela aparece aqui.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead scope="col">Quando</TableHead>
                  <TableHead scope="col">Entraram</TableHead>
                  <TableHead scope="col">Atualizados</TableHead>
                  <TableHead scope="col">Sem mudança</TableHead>
                  <TableHead scope="col">Com erro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historico.map((registro) => (
                  <TableRow key={registro.id}>
                    <TableCell className="font-medium tabular-nums text-foreground">
                      {formatarDataHora(registro.at)}
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {registro.counts.newApplications}
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {registro.counts.updatedMatches}
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {registro.counts.ignored}
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {registro.counts.errors}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
