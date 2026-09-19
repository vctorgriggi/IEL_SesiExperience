'use client';

import {
  useCallback,
  useId,
  useState,
  type MouseEvent,
  type ReactNode,
  type SyntheticEvent
} from 'react';

import { useClickOutside } from '../../hooks/use-click-outside';
import { cn } from '../../lib/utils';

export type MenuItem = {
  label?: string;
  icon?: ReactNode;
  url?: string;
  command?: () => void;
  separator?: boolean;
  disabled?: boolean;
  data?: unknown;
  template?: (
    item: MenuItem,
    options: { onClick: (event: SyntheticEvent) => void }
  ) => ReactNode;
};

export type PopupMenuTriggerParams = {
  toggle: (event: MouseEvent) => void;
  id: string;
  open: boolean;
};

export type PopupMenuProps = {
  model: MenuItem[];
  trigger: (params: PopupMenuTriggerParams) => ReactNode;
  id?: string;
  popupAlignment?: 'left' | 'right';
  className?: string;
  menuClassName?: string;
};

const MENU_SURFACE_CLASSNAME =
  'ui-menu-surface absolute z-50 mt-1 min-w-52 overflow-hidden rounded-md border border-border/70 bg-popover p-1 text-popover-foreground shadow-md';

const MENU_ACTION_CLASSNAME =
  'flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm font-medium text-foreground/90 transition-colors duration-150 hover:bg-muted focus-visible:bg-muted focus-visible:outline-none active:bg-accent disabled:pointer-events-none disabled:opacity-50';

export function PopupMenu({
  model,
  trigger,
  id: idProp,
  popupAlignment = 'left',
  className,
  menuClassName
}: PopupMenuProps) {
  const generatedId = useId();
  const id = idProp ?? `popup-menu-${generatedId.replace(/:/g, '')}`;
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);
  const containerRef = useClickOutside<HTMLDivElement>(close, open);

  const toggle = useCallback((event: MouseEvent) => {
    event.preventDefault();
    setOpen((current) => !current);
  }, []);

  const handleItemActivate = useCallback(
    (item: MenuItem) => (event: SyntheticEvent) => {
      if (item.disabled || item.separator) return;
      if (item.command) {
        event.preventDefault();
        item.command();
      }
      setOpen(false);
    },
    []
  );

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {trigger({ toggle, id, open })}

      {open && (
        <div
          id={id}
          role="menu"
          className={cn(
            MENU_SURFACE_CLASSNAME,
            popupAlignment === 'right' ? 'right-0' : 'left-0',
            menuClassName
          )}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.stopPropagation();
              close();
            }
          }}
        >
          <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
            {model.map((item, index) => {
              if (item.separator) {
                return (
                  <li
                    key={`sep-${index}`}
                    aria-hidden="true"
                    className="my-1 h-px bg-border/80"
                  />
                );
              }

              const onActivate = handleItemActivate(item);

              if (item.template) {
                return (
                  <li key={item.label ?? index} role="none">
                    <button
                      type="button"
                      role="menuitem"
                      disabled={item.disabled}
                      onClick={onActivate}
                      className="block w-full rounded-sm p-0 text-left disabled:pointer-events-none disabled:opacity-50"
                    >
                      {item.template(item, { onClick: onActivate })}
                    </button>
                  </li>
                );
              }

              const inner = (
                <>
                  {item.icon && (
                    <span className="text-muted-foreground">{item.icon}</span>
                  )}
                  <span className="truncate text-sm leading-5">{item.label}</span>
                </>
              );

              return (
                <li key={item.label ?? index} role="none">
                  {item.url ? (
                    <a
                      role="menuitem"
                      href={item.url}
                      onClick={onActivate}
                      className={MENU_ACTION_CLASSNAME}
                    >
                      {inner}
                    </a>
                  ) : (
                    <button
                      type="button"
                      role="menuitem"
                      disabled={item.disabled}
                      onClick={onActivate}
                      className={MENU_ACTION_CLASSNAME}
                    >
                      {inner}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
