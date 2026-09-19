'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

import { cn } from '../../lib/utils';

type ButtonVariant =
  | 'default'
  | 'secondary'
  | 'ghost'
  | 'destructive'
  | 'outline';

type ButtonMode = 'filled' | 'outlined' | 'text' | 'link';

type ButtonSize = 'small' | 'medium' | 'large' | 'sm' | 'icon' | 'circle';

type ButtonSeverity =
  | 'success'
  | 'info'
  | 'warning'
  | 'danger'
  | 'secondary'
  | 'contrast'
  | 'help';

type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  children?: ReactNode;
  icon?: ReactNode;
  iconPos?: 'left' | 'right';
  size?: ButtonSize;
  variant?: ButtonVariant;
  severity?: ButtonSeverity;
  outlined?: boolean;
  text?: boolean;
  link?: boolean;
  plain?: boolean;
  rounded?: boolean;
  loading?: boolean;
};

const BUTTON_BASE_CLASSNAME =
  'ui-button inline-flex items-center justify-center gap-2 rounded-[var(--control-radius)] border text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50';

const variantClassName: Record<ButtonVariant, string> = {
  default: 'ui-button--variant-default',
  secondary: 'ui-button--variant-secondary',
  ghost: 'ui-button--variant-ghost',
  destructive: 'ui-button--variant-destructive',
  outline: 'ui-button--variant-outline'
};

const modeClassName: Record<ButtonMode, string> = {
  filled: 'ui-button--mode-filled',
  outlined: 'ui-button--mode-outlined',
  text: 'ui-button--mode-text',
  link: 'ui-button--mode-link'
};

const sizeClassName: Record<ButtonSize, string> = {
  small: 'h-[var(--control-height-sm)] px-3',
  medium: 'h-[var(--control-height-md)] px-4',
  large: 'h-[var(--control-height-lg)] px-5 text-base',
  sm: 'h-8 px-3 text-xs',
  icon: 'size-[var(--control-height-sm)] p-0',
  circle: 'size-[var(--control-height-sm)] rounded-full p-0'
};

function resolveVariant(
  severity: ButtonSeverity | undefined,
  explicit: ButtonVariant | undefined
): ButtonVariant {
  if (explicit != null) return explicit;
  if (severity === 'danger') return 'destructive';
  if (severity === 'secondary' || severity === 'contrast') return 'secondary';
  return 'default';
}

function resolveMode({
  outlined,
  text,
  link,
  plain
}: Pick<ButtonProps, 'outlined' | 'text' | 'link' | 'plain'>): ButtonMode {
  if (link) return 'link';
  if (text || plain) return 'text';
  if (outlined) return 'outlined';
  return 'filled';
}

function renderIcon(icon: ReactNode): ReactNode {
  if (icon == null) return null;
  if (typeof icon === 'string')
    return (
      <i
        className={icon}
        aria-hidden="true"
      />
    );
  return icon;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    icon,
    size = 'small',
    variant,
    severity,
    outlined,
    text,
    link,
    plain,
    rounded,
    loading = false,
    iconPos = 'left',
    type = 'button',
    disabled,
    children,
    ...props
  },
  ref
) {
  const resolvedVariant = resolveVariant(severity, variant);
  const resolvedMode = resolveMode({ outlined, text, link, plain });
  const isDisabled = disabled || loading;
  const iconNode = renderIcon(icon);

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cn(
        BUTTON_BASE_CLASSNAME,
        variantClassName[resolvedVariant],
        modeClassName[resolvedMode],
        sizeClassName[size],
        rounded && 'rounded-full',
        className
      )}
      {...props}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
        />
      ) : (
        iconPos === 'left' && iconNode
      )}
      {children}
      {!loading && iconPos === 'right' && iconNode}
    </button>
  );
});

export { Button };
export type { ButtonProps };
