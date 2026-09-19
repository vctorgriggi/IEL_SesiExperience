import { apiGet } from '@/lib/api-client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getMyOrganizationsClient } from './organizations';

vi.mock('@/lib/api-client', () => ({
  apiGet: vi.fn()
}));

const mockedApiGet = vi.mocked(apiGet);

describe('organizations service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getMyOrganizationsClient', () => {
    it('calls apiGet with /api/users/me/organizations and returns data', async () => {
      const orgs = [
        { id: 'org-1', name: 'Org 1', slug: 'org-1' },
        { id: 'org-2', name: 'Org 2', slug: 'org-2' }
      ];
      mockedApiGet.mockResolvedValue(orgs);

      const result = await getMyOrganizationsClient();

      expect(mockedApiGet).toHaveBeenCalledTimes(1);
      expect(mockedApiGet).toHaveBeenCalledWith('/api/users/me/organizations');
      expect(result).toEqual(orgs);
    });

    it('rethrows when apiGet throws', async () => {
      mockedApiGet.mockRejectedValue(new Error('Network error'));

      await expect(getMyOrganizationsClient()).rejects.toThrow('Network error');
    });

    it('returns empty array when apiGet returns null', async () => {
      mockedApiGet.mockResolvedValue(null);

      const result = await getMyOrganizationsClient();

      expect(result).toEqual([]);
    });
  });
});
