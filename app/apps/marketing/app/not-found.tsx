import Link from 'next/link';

import { APP_NAME } from '@workspace/common/app';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold text-foreground">
        Página não encontrada
      </h1>
      <p className="text-muted-foreground">
        A página que você procura não existe ou foi movida.
      </p>
      <Link
        href="/"
        className="text-primary underline underline-offset-2 hover:no-underline"
      >
        Voltar para {APP_NAME}
      </Link>
    </div>
  );
}
