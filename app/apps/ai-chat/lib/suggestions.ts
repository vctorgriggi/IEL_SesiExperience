const TEMPLATES = [
  (topic: string) => `Resuma "${topic}"`,
  (topic: string) => `Quais são os pontos principais de "${topic}"?`
] as const;

export function buildSuggestions(topics: readonly string[]) {
  return topics.map((topic, index) =>
    TEMPLATES[index % TEMPLATES.length]!(topic)
  );
}
