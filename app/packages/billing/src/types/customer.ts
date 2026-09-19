export type Customer = Readonly<{
  id: string;
  email?: string;
  name?: string;
  metadata?: Readonly<Record<string, string>>;
}>;
