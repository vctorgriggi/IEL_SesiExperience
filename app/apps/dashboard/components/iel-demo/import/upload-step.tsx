'use client';

import { useRef, useState } from 'react';
import { loadExampleSpreadsheet } from '@/features/iel-demo/fixtures';

import { Button, cn } from '@workspace/ui';

import { Explain, HowItWorks, Panel, PanelHeader } from '../shared/ui';

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
    <div className="space-y-6">
      <Panel className="space-y-4">
        <PanelHeader
          eyebrow="Passo 1"
          title="Escolha a planilha"
          meta="Arquivo .csv ou .txt exportado da Empregare."
        />

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
            'flex flex-col items-center gap-3 rounded-[var(--control-radius)] border border-dashed border-border px-4 py-8 text-center transition-colors',
            arrastando && 'border-primary bg-muted'
          )}
        >
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
          <Button
            type="button"
            size="large"
            onClick={() => inputRef.current?.click()}
          >
            Escolher arquivo
          </Button>
          <p className="text-sm text-muted-foreground">
            ou arraste a planilha para cá
          </p>
          {arquivoLido ? (
            <p className="text-xs text-muted-foreground">
              Último arquivo lido: {arquivoLido}
            </p>
          ) : null}
          {erro ? <p className="text-sm text-destructive">{erro}</p> : null}
        </div>

        <p className="text-sm text-muted-foreground">
          Sem planilha à mão?{' '}
          <button
            type="button"
            className="iel-interactive font-medium text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            onClick={() => {
              setErro(null);
              onConteudo(loadExampleSpreadsheet(), 'planilha-exemplo.csv');
            }}
          >
            Usar planilha de exemplo
          </button>
          <Explain
            className="ml-1"
            label="Nesta demonstração o arquivo é lido dentro do seu navegador. Nada é enviado para servidor nenhum."
          />
        </p>

        <HowItWorks title="Que planilha é essa">
          <p>
            É a exportação da vaga com os candidatos que a Empregare já produz:
            uma linha por pessoa, com o percentual de requisitos da vaga que ela
            mesma calculou.
          </p>
          <ul className="space-y-1">
            {COLUNAS_ESPERADAS.map((coluna) => (
              <li key={coluna.coluna}>
                <span className="font-medium text-foreground">
                  {coluna.coluna}
                </span>{' '}
                — {coluna.obrigatoria ? 'obrigatória' : 'opcional'}.{' '}
                {coluna.conteudo}
              </li>
            ))}
          </ul>
          <p>
            A ordem das colunas não importa, o separador pode ser ponto e
            vírgula ou vírgula, e linha com erro não derruba a importação: ela
            aparece na conferência com o motivo.
          </p>
          <p>
            Hoje a entrada é por planilha. Quando a Empregare liberar a
            API/webhook, os mesmos dados chegam sozinhos — o sistema já está
            preparado para isso.
          </p>
        </HowItWorks>
      </Panel>
    </div>
  );
}
