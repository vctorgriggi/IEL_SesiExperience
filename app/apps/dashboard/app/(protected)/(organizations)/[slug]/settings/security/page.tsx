import { SecurityForm } from '@/components/settings/account/security/security-form';
import { SettingsPageHeader } from '@/components/settings/layout/settings-page-header';
import { getTotpStatus } from '@/features/account/data/get-totp-status';

import { getAuthContext } from '@workspace/auth/context';

export default async function SecuritySettingsPage() {
  const { session } = await getAuthContext();
  const { hasTotp } = await getTotpStatus();

  return (
    <div className="max-w-2xl">
      <SettingsPageHeader
        title="Segurança"
        description="Senha e autenticação em duas etapas. Só você vê e altera estas opções."
      />
      <SecurityForm
        userId={session.user.id}
        initialHasTotp={hasTotp}
      />
    </div>
  );
}
