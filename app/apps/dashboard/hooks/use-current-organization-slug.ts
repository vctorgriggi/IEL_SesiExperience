'use client';

import { useParams } from 'next/navigation';

export function useCurrentOrganizationSlug(): string | null {
  const params = useParams<{ slug?: string }>();

  return typeof params.slug === 'string' && params.slug.length > 0
    ? params.slug
    : null;
}
