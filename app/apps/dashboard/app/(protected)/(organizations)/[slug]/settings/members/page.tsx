import { redirect } from 'next/navigation';
import { SettingsPageHeader } from '@/components/settings/layout/settings-page-header';
import { InvitationsList } from '@/components/settings/organization/invitations-list';
import { InviteMemberForm } from '@/components/settings/organization/invite-member-form';
import { MembersList } from '@/components/settings/organization/members-list';
import { getActivePlan } from '@/features/billing/data/get-active-plan';
import { getInvitations } from '@/features/invitations/data/get-invitations';
import { getCurrentMembership } from '@/features/members/data/get-current-membership';
import { getMembersForOrganization } from '@/features/members/data/get-members-for-organization';
import { can } from '@/features/members/permissions';

import { getAuthOrganizationContext } from '@workspace/auth/context';
import { canUseFeature } from '@workspace/billing';
import { routes } from '@workspace/routes';

export default async function MembersSettingsPage() {
  const ctx = await getAuthOrganizationContext();
  const slug = ctx.organization.slug;

  const membership = await getCurrentMembership();

  if (!membership) {
    redirect(routes.dashboard.org(slug).home);
  }

  const permissions = can(membership);

  if (!permissions.updateOrgSettings) {
    redirect(routes.dashboard.org(slug).settings.profile);
  }

  const planId = getActivePlan(ctx.organization);

  const canInviteByPlan = canUseFeature(planId, 'invite_members');

  const [members, invitations] = await Promise.all([
    getMembersForOrganization(slug),
    getInvitations()
  ]);

  const showInvite = permissions.inviteMembers && canInviteByPlan;
  const canManageInvitations = permissions.updateOrgSettings;

  return (
    <div className="max-w-2xl space-y-6">
      <SettingsPageHeader
        title="Membros"
        description="Gerencie os membros e convites da organização."
      />

      {showInvite && (
        <div className="rounded-lg border bg-card p-5 space-y-4">
          <InviteMemberForm />
        </div>
      )}

      <div className="rounded-lg border bg-card p-5 space-y-4">
        <MembersList
          initialMembers={members}
          currentUserId={membership.userId}
        />
      </div>

      <div className="rounded-lg border bg-card p-5 space-y-4">
        <InvitationsList
          canManage={canManageInvitations}
          initialInvitations={invitations}
        />
      </div>
    </div>
  );
}
