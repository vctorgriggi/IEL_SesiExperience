import type { Member } from '@/features/members/types';

export type Membership = Member | null;

export type Permissions = {
  viewMembers: boolean;
  inviteMembers: boolean;
  removeMembers: boolean;
  updateMemberRoles: boolean;
  viewBilling: boolean;
  updateOrgSettings: boolean;
  viewEvents: boolean;
  checkIn: boolean;
  isOwner: boolean;
  viewRevenue: boolean;
  viewSupport: boolean;
};

function isAdminRole(role: string, isOwner: boolean): boolean {
  return role === 'admin' || isOwner === true;
}

export function can(membership: Membership): Permissions {
  const isMember = !!membership;
  const isAdmin = membership?.role === 'admin' || membership?.isOwner === true;

  return {
    viewMembers: isMember,
    inviteMembers: isAdmin,
    removeMembers: isAdmin,
    updateMemberRoles: isAdmin,
    viewBilling: isAdmin,
    updateOrgSettings: isAdmin,
    viewEvents: isMember,
    checkIn: isMember,
    isOwner: membership?.isOwner === true,
    viewRevenue: isAdmin,
    viewSupport: isAdmin
  };
}

/**
 * Pode acessar a rota /organizations (lista/criar workspace)?
 * Sim se: não tem nenhuma org (criar primeira) OU é admin/owner em pelo menos uma.
 * Member em todas as orgs → false.
 */
export function canAccessOrganizationsList(
  organizations: { role: string; isOwner: boolean }[]
): boolean {
  if (organizations.length === 0) return true;
  return organizations.some((o) => isAdminRole(o.role, o.isOwner));
}
