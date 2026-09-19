'use client';

import { useRouter } from 'next/navigation';
import {
  updateMarketingEmails,
  updateTransactionalEmails
} from '@/features/account/actions';
import {
  marketingEmailsSchema,
  transactionalEmailsSchema,
  type MarketingEmailsValues,
  type TransactionalEmailsValues
} from '@/features/account/schemas/notifications-form-schema';
import type { AccountEmails } from '@/features/account/types';
import { useZodForm } from '@/hooks/use-zod-form';
import { firstValidationError, getErrorMessage } from '@/lib/get-error-message';
import { useAction } from 'next-safe-action/hooks';

import { Button, toast } from '@workspace/ui';

const NOTIFICATIONS_FALLBACK = 'Erro ao salvar';

type NotificationsFormProps = {
  defaultValues: AccountEmails;
};

export function NotificationsForm({ defaultValues }: NotificationsFormProps) {
  const router = useRouter();

  const { execute: executeMarketing, isExecuting: isMarketingExecuting } =
    useAction(updateMarketingEmails, {
      onSuccess: () => {
        toast.success('Preferências de marketing salvas');
        router.refresh();
      },
      onError: ({ error }) => {
        const message =
          error.serverError ?? firstValidationError(error.validationErrors);
        toast.error(getErrorMessage(message, NOTIFICATIONS_FALLBACK));
      }
    });

  const {
    execute: executeTransactional,
    isExecuting: isTransactionalExecuting
  } = useAction(updateTransactionalEmails, {
    onSuccess: () => {
      toast.success('Preferências transacionais salvas');
      router.refresh();
    },
    onError: ({ error }) => {
      const message =
        error.serverError ?? firstValidationError(error.validationErrors);
      toast.error(getErrorMessage(message, NOTIFICATIONS_FALLBACK));
    }
  });

  const marketingForm = useZodForm({
    schema: marketingEmailsSchema,
    defaultValues: defaultValues.marketing
  });

  const transactionalForm = useZodForm({
    schema: transactionalEmailsSchema,
    defaultValues: defaultValues.transactional
  });

  const onMarketingSubmit = (data: MarketingEmailsValues) => {
    executeMarketing(data);
  };

  const onTransactionalSubmit = (data: TransactionalEmailsValues) => {
    executeTransactional(data);
  };

  return (
    <div className="space-y-6">
      {/* Marketing */}
      <form
        onSubmit={marketingForm.handleSubmit(onMarketingSubmit)}
        className="space-y-4 border-t border-border/80 pt-6"
      >
        <div>
          <h2 className="text-sm font-medium text-foreground">
            Emails de marketing
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Novidades e atualizações do produto.
          </p>
        </div>
        <div className="space-y-4">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              {...marketingForm.register('enabledNewsletter')}
              className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
            <span className="text-sm font-medium text-foreground">
              Newsletter
            </span>
          </label>
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              {...marketingForm.register('enabledProductUpdates')}
              className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
            <span className="text-sm font-medium text-foreground">
              Atualizações de produto
            </span>
          </label>
        </div>
        <div className="pt-2">
          <Button
            type="submit"
            loading={
              marketingForm.formState.isSubmitting || isMarketingExecuting
            }
          >
            Salvar
          </Button>
        </div>
      </form>

      {/* Transactional */}
      <form
        onSubmit={transactionalForm.handleSubmit(onTransactionalSubmit)}
        className="space-y-4 border-t border-border/80 pt-6"
      >
        <div>
          <h2 className="text-sm font-medium text-foreground">
            Emails transacionais
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Notificações importantes sobre sua conta e atividades.
          </p>
        </div>
        <div className="space-y-4">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              {...transactionalForm.register('enabledInboxNotifications')}
              className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
            <span className="text-sm font-medium text-foreground">
              Notificações da caixa de entrada
            </span>
          </label>
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              {...transactionalForm.register('enabledWeeklySummary')}
              className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
            <span className="text-sm font-medium text-foreground">
              Resumo semanal
            </span>
          </label>
        </div>
        <div className="pt-2">
          <Button
            type="submit"
            loading={
              transactionalForm.formState.isSubmitting ||
              isTransactionalExecuting
            }
          >
            Salvar
          </Button>
        </div>
      </form>
    </div>
  );
}
