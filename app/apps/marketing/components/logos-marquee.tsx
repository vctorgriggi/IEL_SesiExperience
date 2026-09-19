const logos = [
  { name: 'Stripe', symbol: '◈' },
  { name: 'Vercel', symbol: '▲' },
  { name: 'Supabase', symbol: '⬡' },
  { name: 'Resend', symbol: '✉' },
  { name: 'PostHog', symbol: '◉' },
  { name: 'Drizzle', symbol: '◆' },
  { name: 'Next.js', symbol: '▶' },
  { name: 'TypeScript', symbol: 'TS' },
  { name: 'Tailwind', symbol: '◎' },
  { name: 'Better Auth', symbol: '⬟' }
];

function LogoItem({ name, symbol }: { name: string; symbol: string }) {
  return (
    <div className="flex shrink-0 items-center gap-2.5 px-8 text-muted-foreground transition-colors hover:text-foreground">
      <span className="text-xl font-bold leading-none opacity-60">
        {symbol}
      </span>
      <span className="text-base font-semibold tracking-tight">{name}</span>
    </div>
  );
}

export function LogosMarquee() {
  return (
    <section className="section-shell border-y border-border/90 py-8">
      <p className="mb-6 text-center text-sm font-medium text-muted-foreground">
        Construído com as melhores ferramentas do ecossistema SaaS
      </p>
      <div className="marquee-fade overflow-hidden">
        <div className="flex animate-marquee">
          {[...logos, ...logos].map((logo, i) => (
            <LogoItem
              key={`${logo.name}-${i}`}
              name={logo.name}
              symbol={logo.symbol}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
