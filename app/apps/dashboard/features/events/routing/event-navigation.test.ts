import { describe, expect, it } from 'vitest';

import { routes } from '@workspace/routes';

import {
  getCreateEventPath,
  getEditEventPath,
  getEventAttendeesPath,
  getEventCheckinPath,
  getEventPath,
  getEventsIndexPath,
  getEventTicketsPath,
  getOrganizationFallbackPath
} from './event-navigation';

describe('event navigation helpers', () => {
  it('returns onboarding fallback when slug is missing', () => {
    expect(getOrganizationFallbackPath()).toBe(
      routes.dashboard.onboarding.index
    );
    expect(getEventsIndexPath(undefined)).toBe(
      routes.dashboard.onboarding.index
    );
    expect(getEventCheckinPath('event-1', null)).toBe(
      routes.dashboard.onboarding.index
    );
  });

  it('builds event paths with current organization slug', () => {
    const orgBase = routes.dashboard.org('acme').index;

    expect(getEventsIndexPath('acme')).toBe(
      routes.dashboard.org('acme').events.index
    );
    expect(getCreateEventPath('acme')).toBe(
      routes.dashboard.org('acme').events.create
    );
    expect(getEventPath('event-1', 'acme')).toBe(`${orgBase}/events/event-1`);
    expect(getEditEventPath('event-1', 'acme')).toBe(
      `${orgBase}/events/event-1/edit`
    );
    expect(getEventAttendeesPath('event-1', 'acme')).toBe(
      `${orgBase}/events/event-1/attendees`
    );
    expect(getEventTicketsPath('event-1', 'acme')).toBe(
      `${orgBase}/events/event-1/tickets`
    );
    expect(getEventCheckinPath('event-1', 'acme')).toBe(
      `${orgBase}/checkin/event-1`
    );
  });
});
