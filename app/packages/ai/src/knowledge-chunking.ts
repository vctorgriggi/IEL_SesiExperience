export type TextChunk = { index: number; content: string };

export type ChunkOptions = { size?: number; overlap?: number };

export const CHUNK_SIZE = 1200;
export const CHUNK_OVERLAP = 200;

function splitLongBlock(block: string, size: number) {
  const parts: string[] = [];
  let rest = block;

  while (rest.length > size) {
    let cut = rest.lastIndexOf(' ', size);
    if (cut < size / 2) cut = size;
    parts.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) parts.push(rest);

  return parts;
}

export function chunkText(text: string, options: ChunkOptions = {}) {
  const size = options.size ?? CHUNK_SIZE;
  const overlap = options.overlap ?? CHUNK_OVERLAP;

  const blocks = text
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .flatMap((block) =>
      block.length > size ? splitLongBlock(block, size) : [block]
    );

  const contents: string[] = [];
  let current = '';

  for (const block of blocks) {
    const joined = current ? `${current}\n\n${block}` : block;
    if (current && joined.length > size) {
      contents.push(current);
      current = block;
    } else {
      current = joined;
    }
  }
  if (current) contents.push(current);

  return contents.map((content, index) => ({
    index,
    content:
      index === 0 || overlap <= 0
        ? content
        : `${contents[index - 1]!.slice(-overlap)}\n\n${content}`
  }));
}
