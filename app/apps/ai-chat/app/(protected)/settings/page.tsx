import { notFound } from 'next/navigation';

import { dedupedAuth } from '@workspace/auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@workspace/ui';

import { AppShell } from '~/components/app-shell';
import { PasswordForm } from '~/components/settings/password-form';
import { ProfileForm } from '~/components/settings/profile-form';
import { ThemePreference } from '~/components/settings/theme-preference';
import { getConversations } from '~/data/get-conversations';
import { getCurrentUser } from '~/features/account/data/current-user';
import { getDefaultChatModel } from '~/lib/available-models';
import { canOpenKnowledge } from '~/lib/knowledge-access';

export const metadata = { title: 'Configurações' };

export default async function SettingsPage() {
  const session = await dedupedAuth();
  if (!session?.user?.id) notFound();

  const [user, page] = await Promise.all([
    getCurrentUser(session.user.id),
    getConversations()
  ]);
  if (!user) notFound();

  return (
    <AppShell
      title="Configurações"
      conversations={page.items}
      nextCursor={page.nextCursor}
      defaultModel={getDefaultChatModel()}
      canOpenKnowledge={canOpenKnowledge(session.user.email)}
      user={session.user}
    >
      <div className="flex w-full max-w-2xl flex-col gap-6 px-4 py-8 md:px-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Configurações
          </h1>
          <p className="text-sm text-muted-foreground">
            Sua conta e suas preferências neste chat.
          </p>
        </div>

        <Card className="gap-6">
          <CardHeader>
            <CardTitle>Perfil</CardTitle>
            <CardDescription>Como você aparece no chat.</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm
              name={user.name}
              email={user.email ?? ''}
            />
          </CardContent>
        </Card>

        <Card className="gap-6">
          <CardHeader>
            <CardTitle>Senha</CardTitle>
            <CardDescription>
              Use uma senha que você não usa em outro lugar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PasswordForm />
          </CardContent>
        </Card>

        <Card className="gap-6">
          <CardHeader>
            <CardTitle>Preferências</CardTitle>
            <CardDescription>Valem neste navegador.</CardDescription>
          </CardHeader>
          <CardContent>
            <ThemePreference />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
