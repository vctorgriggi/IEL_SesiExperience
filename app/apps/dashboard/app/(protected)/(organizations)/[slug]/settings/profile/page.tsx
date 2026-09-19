import { notFound } from 'next/navigation';
import { ProfileForm } from '@/components/settings/account/profile/profile-form';
import { SettingsPageHeader } from '@/components/settings/layout/settings-page-header';
import { getAccountDetails } from '@/features/account/data/get-account-details';

export default async function ProfileSettingsPage() {
  const details = await getAccountDetails();
  if (!details) notFound();

  const defaultValues = {
    name: details.name,
    phone: details.phone ?? ''
  };

  return (
    <div className="max-w-2xl">
      <SettingsPageHeader
        title="Perfil"
        description="Informações visíveis apenas para você. Atualize quando quiser."
      />
      <ProfileForm
        defaultValues={defaultValues}
        userImage={details.image}
      />
    </div>
  );
}
