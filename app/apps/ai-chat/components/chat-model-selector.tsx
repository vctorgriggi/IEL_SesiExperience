'use client';

import { ArrowDown01Icon, Tick02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { cn, PopupMenu } from '@workspace/ui';

import { modelLabel } from '~/lib/models';
import type { ChatModel } from '~/lib/models';

export type { ChatModel };

type ChatModelSelectorProps = {
  value: ChatModel;
  /** Modelos habilitados no servidor (dependem das chaves configuradas). */
  models: readonly ChatModel[];
  onChange: (model: ChatModel) => void;
  disabled?: boolean;
};

export function ChatModelSelector({
  value,
  models,
  onChange,
  disabled
}: ChatModelSelectorProps) {
  // Com um provider só configurado não há escolha a fazer.
  if (models.length <= 1) return null;

  return (
    <PopupMenu
      popupAlignment="right"
      model={models.map((model) => ({
        label: modelLabel(model),
        icon: (
          <HugeiconsIcon
            icon={Tick02Icon}
            size={16}
            className={cn('shrink-0', model !== value && 'invisible')}
          />
        ),
        command: () => onChange(model)
      }))}
      trigger={({ toggle, open, id }) => (
        <button
          type="button"
          onClick={toggle}
          disabled={disabled}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={id}
          className={cn(
            'inline-flex h-11 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground transition-colors md:h-9',
            'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:pointer-events-none disabled:opacity-50'
          )}
        >
          {modelLabel(value)}
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            size={14}
            className={cn(
              'shrink-0 transition-transform',
              open && 'rotate-180'
            )}
          />
        </button>
      )}
    />
  );
}
