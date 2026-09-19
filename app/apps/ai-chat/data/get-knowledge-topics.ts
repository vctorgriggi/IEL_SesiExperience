import 'server-only';

import { listKnowledgeDocuments } from '@workspace/ai';

const MAX_TOPICS = 4;

export async function getKnowledgeTopics() {
  const documents = await listKnowledgeDocuments();

  return documents
    .filter((document) => document.status === 'ready')
    .slice(0, MAX_TOPICS)
    .map((document) =>
      document.fileName
        .replace(/\.[^.]+$/, '')
        .replace(/[_-]+/g, ' ')
        .trim()
    )
    .filter((topic) => topic.length > 0);
}
