import { Cancel01Icon, Tick01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { MINIMUM_PASSWORD_LENGTH } from '@workspace/auth/constants';
import { passwordValidator } from '@workspace/auth/password';
import type { Maybe } from '@workspace/common/maybe';

import { cn } from '../../lib/utils';

export type PasswordFormMessageProps = {
  password: Maybe<string>;
  error?: string;
  formMessageId?: string;
};

export function PasswordFormMessage({
  password,
  error,
  formMessageId
}: PasswordFormMessageProps) {
  const containsLowerAndUpperCase =
    passwordValidator.containsLowerAndUpperCase(password);
  const hasMinimumLength = passwordValidator.hasMinimumLength(password);
  const containsNumber = passwordValidator.containsNumber(password);
  const isPasswordValid =
    containsLowerAndUpperCase && hasMinimumLength && containsNumber;

  const getRequirementToShow = () => {
    if (isPasswordValid) {
      return {
        met: true,
        text: 'Todos os requisitos foram atendidos'
      };
    }

    if (!hasMinimumLength) {
      return {
        met: false,
        text: `${MINIMUM_PASSWORD_LENGTH} ou mais caracteres`
      };
    }

    if (!containsLowerAndUpperCase) {
      return {
        met: false,
        text: 'Letras maiúsculas e minúsculas'
      };
    }

    return {
      met: false,
      text: 'Pelo menos um número'
    };
  };

  const requirement = getRequirementToShow();

  return (
    <div
      id={formMessageId}
      className={cn(
        'flex items-center gap-1.5 px-1 text-[0.8rem] font-medium',
        requirement.met
          ? 'text-green-500'
          : error
            ? 'text-destructive'
            : 'text-muted-foreground'
      )}
    >
      <HugeiconsIcon
        icon={requirement.met ? Tick01Icon : Cancel01Icon}
        size={14}
      />
      <p>{requirement.text}</p>
    </div>
  );
}
