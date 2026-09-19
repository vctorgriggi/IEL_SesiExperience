import { validate as uuidValidate } from 'uuid';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  checkSession,
  generateSessionToken,
  getSessionExpiryFromNow
} from './session';

describe('session helpers', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns false when session is null', () => {
    expect(checkSession(null)).toBe(false);
  });

  it('returns false when user is missing', () => {
    expect(checkSession({} as never)).toBe(false);
  });

  it('returns false when user id is not a UUID', () => {
    expect(
      checkSession({
        user: {
          id: 'not-a-uuid',
          email: 'user@acme.com',
          name: 'User'
        }
      } as never)
    ).toBe(false);
  });

  it('returns false when email is missing', () => {
    expect(
      checkSession({
        user: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'User'
        }
      } as never)
    ).toBe(false);
  });

  it('returns false when name is missing', () => {
    expect(
      checkSession({
        user: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'user@acme.com'
        }
      } as never)
    ).toBe(false);
  });

  it('returns true when session shape is valid', () => {
    const session = {
      user: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'user@acme.com',
        name: 'User'
      }
    } as never;

    expect(checkSession(session)).toBe(true);
  });

  it('generateSessionToken returns a UUID', () => {
    const token = generateSessionToken();
    expect(uuidValidate(token)).toBe(true);
  });

  it('getSessionExpiryFromNow uses session maxAge window', () => {
    const now = Date.now();
    const expires = getSessionExpiryFromNow().getTime();
    const secondsDiff = Math.round((expires - now) / 1000);

    expect(secondsDiff).toBeGreaterThanOrEqual(60 * 60 * 24 * 30 - 1);
    expect(secondsDiff).toBeLessThanOrEqual(60 * 60 * 24 * 30 + 1);
  });
});
