'use client';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Bom dia';
  if (hour >= 12 && hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

export type HomeGreetingProps = {
  userName?: string | null;
  variant?: 'default' | 'hero';
};

export function HomeGreeting({
  userName,
  variant = 'default'
}: HomeGreetingProps) {
  const greeting = getGreeting();
  const name = userName?.trim() || 'usuário';

  if (variant === 'hero') {
    return (
      <div
        className="max-w-[600px] w-full rounded-xl bg-gradient-to-r from-primary/[0.08] via-primary/[0.04] to-transparent px-5 py-4 "
        aria-label={`${greeting}, ${name}`}
      >
        <p className="text-2xl font-normal tracking-tight text-foreground md:text-3xl">
          <span className="text-foreground/50">{greeting}</span>,{' '}
          <span className="text-foreground">{name} 👋</span>
        </p>
        <p className="text-xl font-thin text-muted-foreground">
          Acompanhe aqui os dados mais importantes da sua organização.
        </p>
      </div>
    );
  }

  return (
    <p className="text-sm text-muted-foreground">
      <span>{greeting}</span>, <span className="text-foreground">{name}</span>
    </p>
  );
}
