import type { PropsWithChildren } from 'react';
import Image from 'next/image';

const COVER_IMAGE =
  process.env.NEXT_PUBLIC_AUTH_COVER_IMAGE_URL ??
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80';

export const AUTH_CARD_CLASS = 'border-0 bg-transparent px-0 shadow-none';

export function AuthShell({ children }: PropsWithChildren) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden lg:block">
        <Image
          src={COVER_IMAGE}
          alt=""
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/80 via-primary/40 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-end gap-3 p-10 text-primary-foreground">
          <p className="max-w-sm text-2xl leading-snug font-semibold text-balance">
            Converse com a sua base de conhecimento.
          </p>
          <p className="max-w-sm text-sm text-primary-foreground/80">
            As respostas saem só dos documentos que você indexa — sem invenção.
          </p>
        </div>
      </aside>

      <main className="flex flex-col px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto flex w-full max-w-[400px] min-w-[280px] flex-1 flex-col justify-center gap-8">
          <AuthWordmark />
          {children}
        </div>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Interface de Chat Demo
        </p>
      </main>
    </div>
  );
}

function AuthWordmark() {
  return (
    <div className="flex items-center justify-center gap-2.5">
      <span
        aria-hidden
        className="flex size-9 items-center justify-center rounded-lg bg-primary text-base font-bold text-primary-foreground"
      >
        N
      </span>
      <span className="text-xl font-semibold tracking-tight text-foreground">
        Nimbus<span className="text-muted-foreground">Chat</span>
      </span>
    </div>
  );
}
