'use client';

import { GoogleIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { signIn } from 'next-auth/react';

import { toSameOriginRedirect } from '@workspace/auth/redirect-url';
import { cn } from '@workspace/ui';

type SocialSignInButtonsProps = {
  redirectTo?: string;
  intent: 'signin' | 'signup';
  hasGitHub?: boolean;
  hasMicrosoft?: boolean;
  disabled?: boolean;
};

const linkClass =
  'flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-border/80 bg-base-200/50 px-4 text-sm font-medium text-foreground no-underline transition-colors hover:border-border hover:bg-base-200';

export function SocialSignInButtons({
  redirectTo,
  intent,
  disabled = false
}: SocialSignInButtonsProps) {
  const onGoogleSignIn = () => {
    if (disabled) return;

    const currentOrigin = window.location.origin;
    const safeRedirectTo = toSameOriginRedirect(redirectTo, { currentOrigin });
    const oauthCallbackURL = new URL('/auth/oauth-callback', currentOrigin);
    oauthCallbackURL.searchParams.set('intent', intent);
    oauthCallbackURL.searchParams.set('redirectTo', safeRedirectTo);

    const callbackPath = `${oauthCallbackURL.pathname}${oauthCallbackURL.search}`;
    void signIn(
      'google',
      { redirectTo: callbackPath, redirect: true },
      { prompt: 'select_account' }
    ).catch(() => {
      window.location.assign('/auth/sign-in?error=oauth_start_failed');
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={onGoogleSignIn}
        className={cn(linkClass, disabled && 'pointer-events-none opacity-50')}
        disabled={disabled}
      >
        <HugeiconsIcon
          icon={GoogleIcon}
          size={20}
        />
        Google
      </button>
    </div>
  );
}
