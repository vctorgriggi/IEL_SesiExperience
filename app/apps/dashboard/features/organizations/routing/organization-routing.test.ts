import { describe, expect, it } from 'vitest';

import {
  extractOrganizationSlugFromPathname,
  hasOrganizationSlug,
  MAX_SLUG_LENGTH,
  RESERVED_FIRST_SEGMENTS
} from './organization-routing';

describe('organization routing helpers', () => {
  it('extracts slug from valid path', () => {
    expect(extractOrganizationSlugFromPathname('/acme/home')).toBe('acme');
  });

  it('returns null for reserved first segment', () => {
    const [reservedSegment] = Array.from(RESERVED_FIRST_SEGMENTS);
    expect(
      extractOrganizationSlugFromPathname(`/${reservedSegment}/home`)
    ).toBeNull();
  });

  it('returns null when slug exceeds max length', () => {
    const tooLongSlug = 'a'.repeat(MAX_SLUG_LENGTH + 1);
    expect(
      extractOrganizationSlugFromPathname(`/${tooLongSlug}/home`)
    ).toBeNull();
  });

  it('returns null for empty/null pathnames', () => {
    expect(extractOrganizationSlugFromPathname(null)).toBeNull();
    expect(extractOrganizationSlugFromPathname('')).toBeNull();
    expect(extractOrganizationSlugFromPathname('/')).toBeNull();
  });

  it('reports slug presence consistently', () => {
    expect(hasOrganizationSlug('/acme/events')).toBe(true);
    expect(hasOrganizationSlug('/onboarding')).toBe(false);
  });
});
