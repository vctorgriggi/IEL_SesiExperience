import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z.string().min(1).url()
});

export const keys = () =>
  schema.parse({
    DATABASE_URL: process.env.DATABASE_URL
  });
