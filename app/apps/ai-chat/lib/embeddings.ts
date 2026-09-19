import 'server-only';

import { openai } from '@ai-sdk/openai';
import { embed, embedMany } from 'ai';

export const EMBEDDING_MODEL_ID = 'text-embedding-3-small';

export async function embedQuery(text: string) {
  const { embedding } = await embed({
    model: openai.embeddingModel(EMBEDDING_MODEL_ID),
    value: text
  });
  return embedding;
}

export async function embedChunks(texts: string[]) {
  const { embeddings } = await embedMany({
    model: openai.embeddingModel(EMBEDDING_MODEL_ID),
    values: texts
  });
  return embeddings;
}
