import { routes } from '@workspace/routes';

type OptionalOrganizationSlug = string | null | undefined;

export function getOrganizationFallbackPath(): string {
  return routes.dashboard.onboarding.index;
}

export function getEventsIndexPath(
  organizationSlug?: OptionalOrganizationSlug
): string {
  if (!organizationSlug) {
    return getOrganizationFallbackPath();
  }

  return routes.dashboard.org(organizationSlug).events.index;
}

export function getCreateEventPath(
  organizationSlug?: OptionalOrganizationSlug
): string {
  if (!organizationSlug) {
    return getOrganizationFallbackPath();
  }

  return routes.dashboard.org(organizationSlug).events.create;
}

export function getEventPath(
  eventId: string,
  organizationSlug?: OptionalOrganizationSlug
): string {
  if (!organizationSlug) {
    return getOrganizationFallbackPath();
  }

  return routes.dashboard.org(organizationSlug).events.byId(eventId).index;
}

export function getEditEventPath(
  eventId: string,
  organizationSlug?: OptionalOrganizationSlug
): string {
  if (!organizationSlug) {
    return getOrganizationFallbackPath();
  }

  return routes.dashboard.org(organizationSlug).events.byId(eventId).edit;
}

export function getEventAttendeesPath(
  eventId: string,
  organizationSlug?: OptionalOrganizationSlug
): string {
  if (!organizationSlug) {
    return getOrganizationFallbackPath();
  }

  return routes.dashboard.org(organizationSlug).events.byId(eventId).attendees;
}

export function getEventTicketsPath(
  eventId: string,
  organizationSlug?: OptionalOrganizationSlug
): string {
  if (!organizationSlug) {
    return getOrganizationFallbackPath();
  }

  return routes.dashboard.org(organizationSlug).events.byId(eventId).tickets;
}

export function getEventCheckinPath(
  eventId: string,
  organizationSlug?: OptionalOrganizationSlug
): string {
  if (!organizationSlug) {
    return getOrganizationFallbackPath();
  }

  return routes.dashboard.org(organizationSlug).checkin.byId(eventId).index;
}
