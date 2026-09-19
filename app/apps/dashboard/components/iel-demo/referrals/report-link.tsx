'use client';

import { useState } from 'react';
import {
  getCompany,
  getJob,
  getReportTokenForJob
} from '@/features/iel-demo/state/selectors';
import { Copy } from 'lucide-react';

import { routes } from '@workspace/routes';
import { toast } from '@workspace/ui';
import { Button } from '@workspace/ui/shadcn/button';

import { SimularEnvioButton } from '../chat/simular-envio-dialog';

/**
 * O link do relatório, para a analista mandar à empresa (S3).
 *
 * Aparece depois que o encaminhamento é registrado, porque é o registro que
 * cria o que a empresa vai abrir: antes dele o endereço existe mas não tem
 * conteúdo, e a página diz isso. O link é por vaga, não por pessoa — a
 * empresa recebe uma remessa, e é a remessa que a página mostra.
 */
export function ReferralReportLink({ jobId }: { jobId: string }) {
  const [visivel, setVisivel] = useState(false);
  const job = getJob(jobId);
  const empresa = job ? getCompany(job.companyId)?.name : undefined;
  const path = routes.dashboard.iel.report.byToken(getReportTokenForJob(jobId));
  const url =
    typeof window === 'undefined' ? path : `${window.location.origin}${path}`;

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link do relatório copiado.');
    } catch {
      // Sem permissão de área de transferência (ou sem HTTPS): mostrar o
      // endereço é o que permite copiar à mão, em vez de um erro sem saída.
      setVisivel(true);
      toast.info('Não deu para copiar. O link está logo abaixo.');
    }
  };

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3">
      <p className="text-sm font-medium">Link do relatório para a empresa</p>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Abre sem login e mostra só quem foi enviado nesta vaga. Vale por 30
        dias.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => void copiar()}
        >
          <Copy />
          Copiar link
        </Button>
        <Button
          size="sm"
          variant="ghost"
          asChild
        >
          <a
            href={path}
            target="_blank"
            rel="noreferrer"
          >
            Abrir o que a empresa vê
          </a>
        </Button>
        <SimularEnvioButton
          destinatario="empresa"
          link={path}
          contexto={{ empresa, vaga: job?.title }}
        />
      </div>
      {visivel ? (
        <p className="break-all text-xs text-muted-foreground">{url}</p>
      ) : null}
    </div>
  );
}
