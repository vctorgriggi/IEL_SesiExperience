'use client';

import { useRef, useState } from 'react';
import { loadExampleSpreadsheet } from '@/features/iel-demo/fixtures';
import { IconChevronDown, IconUpload } from '@tabler/icons-react';

import { cn } from '@workspace/ui/lib/utils';
import { Badge } from '@workspace/ui/shadcn/badge';
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

const COLUNAS_ESPERADAS: {
  coluna: string;
  obrigatoria: boolean;
  conteudo: string;
}[] = [
  { coluna: 'nome', obrigatoria: true, conteudo: 'Nome da pessoa.' },
  {
    coluna: 'email',
    obrigatoria: true,
    conteudo: 'É por ele que o sistema sabe se a pessoa já está na base.'
  },
  { coluna: 'telefone', obrigatoria: false, conteudo: 'Telefone de contato.' },
  { coluna: 'cidade', obrigatoria: false, conteudo: 'Cidade e estado.' },
  {
    coluna: 'vaga',
    obrigatoria: true,
    conteudo: 'Precisa ser o título desta vaga.'
  },
  {
    coluna: 'match_tecnico',
    obrigatoria: true,
    conteudo: 'De 0 a 100. Aceita "82" e "82%". Em branco fica sem valor.'
  },
  {
    coluna: 'situacao',
    obrigatoria: false,
    conteudo: 'Por exemplo: "Descartado pelo filtro".'
  }
];

/**
 * Passo 1: de onde vem o arquivo.
 *
 * O arquivo é lido no próprio navegador e nada é enviado: por isso o
 * `FileReader` e não um upload. A planilha de exemplo existe para quem quer
 * ver a tela funcionando sem ter uma exportação à mão.
 */
export function UploadStep({
  onConteudo,
  arquivoLido
}: {
  onConteudo: (conteudo: string, nomeDoArquivo: string) => void;
  /** Nome do último arquivo lido, quando o analista volta para trocá-lo. */
  arquivoLido: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [arrastando, setArrastando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const lerArquivo = (arquivo: File): void => {
    const leitor = new FileReader();
    leitor.onerror = () => {
      setErro('Não foi possível ler o arquivo. Tente escolher de novo.');
    };
    leitor.onload = () => {
      const conteudo = leitor.result;
      if (typeof conteudo !== 'string') {
        setErro('Não foi possível ler o arquivo. Tente escolher de novo.');
        return;
      }
      setErro(null);
      onConteudo(conteudo, arquivo.name);
    };
    leitor.readAsText(arquivo);
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardDescription>Passo 1</CardDescription>
          <CardTitle>Escolha a planilha</CardTitle>
          <CardDescription>
            Arquivo .csv ou .txt exportado da Empregare. O arquivo é lido no seu
            navegador: nada é enviado para servidor nenhum.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-3">
          <div
            onDragOver={(evento) => {
              evento.preventDefault();
              setArrastando(true);
            }}
            onDragLeave={() => setArrastando(false)}
            onDrop={(evento) => {
              evento.preventDefault();
              setArrastando(false);
              const arquivo = evento.dataTransfer.files[0];
              if (arquivo) lerArquivo(arquivo);
            }}
            className={cn(
              'flex flex-col items-center gap-3 rounded-xl border border-dashed px-4 py-10 text-center transition-colors',
              arrastando && 'border-foreground bg-muted/50'
            )}
          >
            <IconUpload
              aria-hidden="true"
              className="size-5 text-muted-foreground"
            />
            <input
              ref={inputRef}
              id="planilha-arquivo"
              type="file"
              accept=".csv,.txt,text/csv,text/plain"
              className="sr-only"
              onChange={(evento) => {
                const arquivo = evento.target.files?.[0];
                if (arquivo) lerArquivo(arquivo);
                evento.target.value = '';
              }}
            />
            <div className="space-y-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => inputRef.current?.click()}
              >
                Escolher arquivo
              </Button>
              <p className="text-sm text-muted-foreground">
                ou arraste a planilha para cá
              </p>
            </div>
            {arquivoLido ? (
              <p className="text-xs text-muted-foreground">
                Último arquivo lido: {arquivoLido}
              </p>
            ) : null}
            {erro ? <p className="text-sm text-destructive">{erro}</p> : null}
          </div>

          <p className="text-sm text-muted-foreground">
            Sem planilha à mão?{' '}
            <Button
              type="button"
              variant="link"
              className="h-auto p-0"
              onClick={() => {
                setErro(null);
                onConteudo(loadExampleSpreadsheet(), 'planilha-exemplo.csv');
              }}
            >
              Usar planilha de exemplo
            </Button>
          </p>
        </CardContent>
      </Card>

      <Collapsible>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Que planilha é essa</CardTitle>
            <CardDescription>
              As colunas que a exportação da vaga precisa ter.
            </CardDescription>
            <CardAction>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="group/colunas"
                >
                  Ver as colunas
                  <IconChevronDown
                    aria-hidden="true"
                    className="transition-transform group-data-[state=open]/colunas:rotate-180"
                  />
                </Button>
              </CollapsibleTrigger>
            </CardAction>
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="flex flex-col gap-4">
              <p className="max-w-[80ch] text-sm text-muted-foreground">
                É a exportação da vaga com os candidatos que a Empregare já
                produz: uma linha por pessoa, com o percentual de requisitos da
                vaga que ela mesma calculou. A ordem das colunas não importa, o
                separador pode ser ponto e vírgula ou vírgula, e linha com erro
                não derruba a importação — ela aparece na conferência com o
                motivo.
              </p>

              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead scope="col">Coluna</TableHead>
                      <TableHead scope="col">Obrigatória</TableHead>
                      <TableHead scope="col">O que vai nela</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {COLUNAS_ESPERADAS.map((coluna) => (
                      <TableRow key={coluna.coluna}>
                        <TableCell className="font-medium text-foreground">
                          {coluna.coluna}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="text-muted-foreground"
                          >
                            {coluna.obrigatoria ? 'sim' : 'não'}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-normal text-muted-foreground">
                          {coluna.conteudo}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <p className="max-w-[80ch] border-t pt-4 text-sm text-muted-foreground">
                Hoje a entrada é por planilha porque é o que a Empregare
                exporta. Quando ela liberar API ou webhook, os mesmos dados
                chegam sozinhos e esta tela vira exceção — o caminho de dentro
                já é o mesmo.
              </p>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}
