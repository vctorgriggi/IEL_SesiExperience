'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { api } from '@workspace/routes';
import { Button, toast } from '@workspace/ui';

import { BuyCreditsDialog } from '~/components/buy-credits-dialog';

type KnowledgeDocument = {
  id: string;
  fileName: string;
  status: 'processing' | 'ready' | 'failed';
  error: string | null;
  chunkCount: number;
  createdAt: Date;
};

const STATUS_LABEL: Record<KnowledgeDocument['status'], string> = {
  processing: 'Processando',
  ready: 'Pronto',
  failed: 'Falhou'
};

const STATUS_CLASS: Record<KnowledgeDocument['status'], string> = {
  processing: 'bg-muted text-muted-foreground',
  ready: 'bg-emerald-100 text-emerald-800',
  failed: 'bg-red-100 text-red-800'
};

export function KnowledgeManager({
  documents,
  canDelete = false,
  uploadLimit
}: {
  documents: KnowledgeDocument[];
  canDelete?: boolean;
  uploadLimit: number;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showBuyCredits, setShowBuyCredits] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch(api.knowledge.root(), { method: 'POST', body });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
          code?: string;
        } | null;
        if (data?.code === 'DEMO_LIMIT') {
          setShowBuyCredits(true);
        }
        throw new Error(data?.error ?? 'Erro ao enviar o documento.');
      }
      toast.success('Documento indexado.');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Erro ao enviar o documento.'
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
      router.refresh();
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(api.knowledge.byId(id), { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao remover o documento.');
      toast.success('Documento removido.');
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Erro ao remover o documento.'
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="text-xl font-semibold text-foreground">
        Base de conhecimento
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Os documentos enviados aqui são a única fonte usada pelo chat para
        responder.
        {canDelete
          ? ''
          : ` Na demonstração são ${uploadLimit} envios por visitante.`}
      </p>

      <div className="mt-6">
        <input
          ref={inputRef}
          type="file"
          accept=".md,.txt,.pdf"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleUpload(file);
          }}
        />
        <Button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? 'Indexando…' : 'Enviar documento'}
        </Button>
      </div>

      <ul className="mt-6 divide-y rounded-md border">
        {documents.length === 0 ? (
          <li className="p-4 text-sm text-muted-foreground">
            Nenhum documento na base ainda.
          </li>
        ) : (
          documents.map((document) => (
            <li
              key={document.id}
              className="flex items-center gap-3 p-4 text-sm"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">
                  {document.fileName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(document.createdAt).toLocaleDateString('pt-BR')} ·{' '}
                  {document.chunkCount} trechos
                  {document.error ? ` · ${document.error}` : ''}
                </p>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${STATUS_CLASS[document.status]}`}
              >
                {STATUS_LABEL[document.status]}
              </span>
              {canDelete && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={deletingId === document.id}
                  onClick={() => void handleDelete(document.id)}
                >
                  Remover
                </Button>
              )}
            </li>
          ))
        )}
      </ul>

      <BuyCreditsDialog
        open={showBuyCredits}
        onOpenChange={setShowBuyCredits}
      />
    </div>
  );
}
