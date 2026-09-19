import { Skeleton } from '@workspace/ui';

/**
 * Esqueleto no formato da tela real (sidebar + conversa + campo de envio),
 * para o carregamento não pular layout quando o conteúdo chega.
 */
export function ChatSkeleton() {
  return (
    <div className="flex h-screen bg-background">
      <div className="hidden w-64 shrink-0 flex-col gap-2 border-r p-3 md:flex">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <div className="mt-4 space-y-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton
              key={index}
              className="h-8 w-full"
            />
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col">
        <div className="flex h-14 items-center justify-between border-b px-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-8 w-28" />
        </div>
        <div className="flex-1 space-y-4 p-6">
          <Skeleton className="h-16 w-3/4" />
          <Skeleton className="ml-auto h-16 w-2/3" />
          <Skeleton className="h-16 w-4/5" />
        </div>
        <div className="border-t p-4">
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}
