import { describe, expect, it } from 'vitest';

import { api, routes, routeUrls } from './index';

describe('@workspace/routes', () => {
  it('builds dashboard org paths without placeholders', () => {
    const orgRoutes = routes.dashboard.org('acme team');

    expect(orgRoutes.index).toBe('/acme%20team');
    expect(orgRoutes.events.index).toBe('/acme%20team/events');
    expect(orgRoutes.events.byId('evt/1').index).toBe(
      '/acme%20team/events/evt%2F1'
    );
    expect(orgRoutes.events.byId('evt/1').tickets).toBe(
      '/acme%20team/events/evt%2F1/tickets'
    );
    expect(orgRoutes.checkin.byId('abc 123').index).toBe(
      '/acme%20team/checkin/abc%20123'
    );
  });

  it('builds auth and invitation tokenized routes', () => {
    expect(routes.dashboard.auth.resetPassword.request.byId('req/id')).toBe(
      '/auth/reset-password/request/req%2Fid'
    );
    expect(routes.dashboard.auth.verifyEmail.request.byToken('tok en')).toBe(
      '/auth/verify-email/request/tok%20en'
    );
    expect(routes.dashboard.invitations.request('inv/token')).toBe(
      '/invitations/request/inv%2Ftoken'
    );
  });

  it('exposes absolute URLs via routeUrls', () => {
    expect(routeUrls.dashboard.auth.signIn).toMatch(/^https?:\/\//);
    expect(routeUrls.dashboard.org('my-org').events.byId('1').index).toMatch(
      /^https?:\/\/.*\/my-org\/events\/1$/
    );
    expect(routeUrls.marketing.contact).toMatch(/^https?:\/\//);
  });

  it('keeps api routes relative and encoded', () => {
    expect(api.events.registrationsExport('evt/10')).toBe(
      '/api/events/evt%2F10/registrations/export'
    );
    expect(api.invitations.validate('tok en')).toBe(
      '/api/invitations/validate/tok%20en'
    );
  });
});
