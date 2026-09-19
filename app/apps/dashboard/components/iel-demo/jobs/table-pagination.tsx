'use client';

import { useId, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';

import { Button } from '@workspace/ui/shadcn/button';
import { Label } from '@workspace/ui/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@workspace/ui/shadcn/select';

/** Tamanhos de página das listas grandes (vagas, pessoas, fila do dia). */
export const TAMANHOS_DE_PAGINA = [10, 20, 50] as const;

export type Paginacao<T> = {
  /** Linhas da página atual. */
  linhas: T[];
  pagina: number;
  totalPaginas: number;
  porPagina: number;
  irPara: (pagina: number) => void;
  mudarTamanho: (tamanho: number) => void;
};

/**
 * Paginação de uma lista já filtrada.
 *
 * A página atual é sempre recortada ao total: quando a busca encolhe a lista,
 * a tela não fica numa "página 7 de 2" vazia.
 */
export function usePaginacao<T>(lista: T[], tamanhoInicial = 10): Paginacao<T> {
  const [pagina, setPagina] = useState(0);
  const [porPagina, setPorPagina] = useState(tamanhoInicial);

  const totalPaginas = Math.max(1, Math.ceil(lista.length / porPagina));
  const atual = Math.min(pagina, totalPaginas - 1);

  return {
    linhas: lista.slice(atual * porPagina, atual * porPagina + porPagina),
    pagina: atual,
    totalPaginas,
    porPagina,
    irPara: (destino) =>
      setPagina(Math.max(0, Math.min(totalPaginas - 1, destino))),
    mudarTamanho: (tamanho) => {
      setPorPagina(tamanho);
      setPagina(0);
    }
  };
}

/**
 * Rodapé da tabela no padrão do `dashboard-01`: contagem à esquerda, linhas
 * por página, "Página X de Y" e os quatro botões.
 */
export function RodapeDaTabela<T>({
  paginacao,
  resumo
}: {
  paginacao: Paginacao<T>;
  /** Texto da esquerda, ex.: "40 vagas". */
  resumo: string;
}) {
  const id = useId();
  const { pagina, totalPaginas, porPagina, irPara, mudarTamanho } = paginacao;
  const primeira = pagina === 0;
  const ultima = pagina >= totalPaginas - 1;

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="hidden flex-1 text-sm text-muted-foreground tabular-nums lg:flex">
        {resumo}
      </div>
      <div className="flex w-full items-center gap-8 lg:w-fit">
        <div className="hidden items-center gap-2 lg:flex">
          <Label
            htmlFor={id}
            className="text-sm font-medium"
          >
            Linhas por página
          </Label>
          <Select
            value={`${porPagina}`}
            onValueChange={(valor) => mudarTamanho(Number(valor))}
          >
            <SelectTrigger
              size="sm"
              className="w-20"
              id={id}
            >
              <SelectValue placeholder={`${porPagina}`} />
            </SelectTrigger>
            <SelectContent side="top">
              {TAMANHOS_DE_PAGINA.map((tamanho) => (
                <SelectItem
                  key={tamanho}
                  value={`${tamanho}`}
                >
                  {tamanho}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-fit items-center justify-center text-sm font-medium tabular-nums">
          Página {pagina + 1} de {totalPaginas}
        </div>
        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <Button
            variant="outline"
            size="icon"
            className="hidden size-8 lg:flex"
            onClick={() => irPara(0)}
            disabled={primeira}
          >
            <span className="sr-only">Primeira página</span>
            <ChevronsLeft />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => irPara(pagina - 1)}
            disabled={primeira}
          >
            <span className="sr-only">Página anterior</span>
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => irPara(pagina + 1)}
            disabled={ultima}
          >
            <span className="sr-only">Próxima página</span>
            <ChevronRight />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="hidden size-8 lg:flex"
            onClick={() => irPara(totalPaginas - 1)}
            disabled={ultima}
          >
            <span className="sr-only">Última página</span>
            <ChevronsRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
