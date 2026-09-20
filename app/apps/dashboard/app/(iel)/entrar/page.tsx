import type { Metadata } from 'next';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import {
  acessoExigeSenha,
  temSessaoDaAnalista
} from '@/features/iel-demo/acesso/sessao';

import { routes } from '@workspace/routes';

import { EntrarForm } from './entrar-form';

export const metadata: Metadata = { title: 'Entrar · Mind RH' };

/**
 * A porta da Central, só para a analista do IEL.
 *
 * Candidato, colaborador e empresa entram por link, sem senha (R9 e R10):
 * essas rotas não passam por aqui.
 */
export default async function EntrarPage() {
  if (!acessoExigeSenha() || (await temSessaoDaAnalista())) {
    redirect(routes.dashboard.iel.index);
  }

  return (
    <div
      data-iel-theme=""
      className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-muted px-4 py-10"
    >
      <Image
        src="/marca/mindrh-assinatura.png"
        alt="Mind RH, uma solução Madvic"
        width={2940}
        height={1407}
        priority
        className="h-auto w-[min(20rem,72vw)]"
      />

      <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-xs">
        <div className="mb-5 flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight">
            Central de Seleção
          </h1>
          <p className="text-sm text-muted-foreground">
            Acesso da equipe do IEL · Centro de Empregos da Indústria.
          </p>
        </div>

        <EntrarForm />
      </div>

      <p className="max-w-sm text-center text-xs text-muted-foreground">
        Candidatos e empresas não entram por aqui: eles respondem pelo link que
        recebem, sem senha.
      </p>
    </div>
  );
}
