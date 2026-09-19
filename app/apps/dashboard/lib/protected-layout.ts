/**
 * Helpers usados pelo layout protegido (sidebar, visibilidade).
 */

export function shouldHideSidebar(
  pathname: string | null,
  currentOrgSlug: string | null
): boolean {
  const onOrganizationsIndex =
    pathname === '/organizations' && currentOrgSlug == null;
  const onOnboarding = pathname != null && pathname.startsWith('/onboarding');
  return onOrganizationsIndex || onOnboarding;
}
