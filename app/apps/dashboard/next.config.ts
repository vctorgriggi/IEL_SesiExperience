import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { type NextConfig } from 'next/types';
import withBundleAnalyzer from '@next/bundle-analyzer';
import { createSecureHeaders } from 'next-secure-headers';

/**
 * Raiz do monorepo. Sem isso o Turbopack sai procurando lockfile pra cima e
 * pode eleger um diretório fora do repositório como workspace root.
 */
const monorepoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..'
);

const INTERNAL_PACKAGES = [
  '@workspace/ai',
  '@workspace/auth',
  '@workspace/common',
  '@workspace/monitoring',
  '@workspace/rate-limit',
  '@workspace/routes',
  '@workspace/ui'
];

const nextConfig: NextConfig = {
  turbopack: { root: monorepoRoot },
  transpilePackages: INTERNAL_PACKAGES,
  serverExternalPackages: ['postgres', '@neondatabase/serverless', 'sharp'],
  experimental: {
    serverActions: {
      bodySizeLimit: '2.5mb'
    },
    optimizePackageImports: [
      'recharts',
      '@hugeicons/react',
      '@hugeicons/core-free-icons',
      'date-fns',
      ...INTERNAL_PACKAGES
    ]
  },
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    const frameGuard =
      process.env.SECURITY_X_FRAME_OPTIONS === 'sameorigin'
        ? 'sameorigin'
        : 'deny';
    const referrerPolicy =
      process.env.SECURITY_REFERRER_POLICY ?? 'strict-origin-when-cross-origin';
    return [
      {
        locale: false,
        source: '/(.*)',
        headers: createSecureHeaders({
          frameGuard,
          noopen: 'noopen',
          nosniff: 'nosniff',
          xssProtection: 'sanitize',
          forceHTTPSRedirect: [
            true,
            { maxAge: 60 * 60 * 24 * 360, includeSubDomains: true }
          ],
          referrerPolicy: referrerPolicy as 'strict-origin-when-cross-origin'
        })
      }
    ];
  },

  async redirects() {
    return [
      {
        source: '/',
        destination: '/auth',
        permanent: false
      },
      {
        source: '/auth',
        destination: '/auth/sign-in',
        permanent: false
      }
    ];
  }
};

const bundleAnalyzerConfig =
  process.env.ANALYZE === 'true'
    ? withBundleAnalyzer({ enabled: true })(nextConfig)
    : nextConfig;

export default async function getConfig(): Promise<NextConfig> {
  const { MonitoringProvider } = await import('@workspace/monitoring/provider');
  return MonitoringProvider.withConfig(bundleAnalyzerConfig);
}
