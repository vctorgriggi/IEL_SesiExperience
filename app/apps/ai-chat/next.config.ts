import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { type NextConfig } from 'next/types';

/**
 * Raiz do monorepo. Sem isso o Turbopack sai procurando lockfile pra cima e
 * pode eleger um diretório fora do repositório como workspace root, o que
 * resolve dependência do lugar errado.
 */
const monorepoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..'
);

const INTERNAL_PACKAGES = [
  '@workspace/ai',
  '@workspace/auth',
  '@workspace/common',
  '@workspace/routes',
  '@workspace/ui'
];

const nextConfig: NextConfig = {
  turbopack: { root: monorepoRoot },
  transpilePackages: INTERNAL_PACKAGES,
  serverExternalPackages: ['postgres'],
  experimental: {
    optimizePackageImports: [
      '@hugeicons/react',
      '@hugeicons/core-free-icons',
      ...INTERNAL_PACKAGES
    ]
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'images.unsplash.com' }]
  },
  reactStrictMode: true,
  poweredByHeader: false,
  async redirects() {
    return [
      {
        source: '/',
        destination: '/chat',
        permanent: false
      },
      {
        source: '/auth/sign-in',
        destination: '/sign-in',
        permanent: false
      },
      {
        source: '/auth/sign-up',
        destination: '/sign-up',
        permanent: false
      },
      {
        source: '/auth/error',
        destination: '/sign-in',
        permanent: false
      }
    ];
  }
};

export default nextConfig;
