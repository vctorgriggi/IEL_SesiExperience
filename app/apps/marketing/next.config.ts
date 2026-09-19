import { fileURLToPath } from 'node:url';
import path from 'node:path';
import type { NextConfig } from 'next';

/**
 * Raiz do monorepo. Sem isso o Turbopack sai procurando lockfile pra cima e
 * pode eleger um diretório fora do repositório como workspace root.
 */
const monorepoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..'
);

const nextConfig: NextConfig = {
  turbopack: { root: monorepoRoot },
  transpilePackages: [
    '@workspace/ui',
    '@workspace/common',
    '@workspace/routes'
  ],
  reactStrictMode: true,
  poweredByHeader: false
};

export default nextConfig;
