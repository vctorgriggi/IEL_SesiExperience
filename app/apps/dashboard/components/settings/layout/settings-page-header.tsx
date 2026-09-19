type SettingsPageHeaderProps = {
  title: string;
  description: string;
};

export function SettingsPageHeader({
  title,
  description
}: SettingsPageHeaderProps) {
  return (
    <header className="mb-5">
      <h1 className="text-xl font-semibold tracking-tight text-foreground">
        {title}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </header>
  );
}
