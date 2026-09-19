type DividerProps = {
  text?: string;
  className?: string;
};

export function Divider({ text = 'ou', className = '' }: DividerProps) {
  return (
    <div className={className}>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border/60" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-background px-4 text-sm font-medium text-muted-foreground">
            {text}
          </span>
        </div>
      </div>
    </div>
  );
}
