import Link from 'next/link';
import { ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { cn } from '@workspace/ui';

export type BreadcrumbItem = {
  label: string;
  href?: string;
  icon?: 'home';
};

type PageBreadcrumbProps = {
  items: BreadcrumbItem[];
  className?: string;
};

export function PageBreadcrumb({ items, className }: PageBreadcrumbProps) {
  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Navegação (breadcrumb)"
      className={cn(
        'flex min-w-0 items-center gap-1 overflow-hidden text-sm',
        className
      )}
    >
      <ol className="flex min-w-0 list-none items-center gap-1 overflow-hidden p-0">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isLink = item.href != null && item.href !== '' && !isLast;
          const isHomeItem =
            index === 0 &&
            (item.icon === 'home' ||
              item.label.trim().toLowerCase() === 'início' ||
              item.label.trim().toLowerCase() === 'inicio');

          return (
            <li
              key={index}
              className="flex min-w-0 items-center gap-1"
            >
              {index > 0 && (
                <span
                  className="shrink-0 text-muted-foreground"
                  aria-hidden
                >
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    size={14}
                    className="text-muted-foreground"
                  />
                </span>
              )}
              {isLink ? (
                <Link
                  href={{
                    pathname: item.href
                  }}
                  className="inline-flex items-center gap-1 truncate text-muted-foreground transition-colors hover:text-foreground"
                >
                  {isHomeItem && (
                    <span
                      className="shrink-0"
                      aria-hidden
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="14"
                        height="14"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-muted-foreground"
                      >
                        <path d="M3 10.5L12 3l9 7.5" />
                        <path d="M5 9.5V20h14V9.5" />
                      </svg>
                    </span>
                  )}
                  {item.label}
                </Link>
              ) : (
                <span
                  className="inline-flex items-center gap-1 truncate font-medium text-foreground"
                  aria-current={isLast ? 'page' : undefined}
                >
                  {isHomeItem && (
                    <span
                      className="shrink-0"
                      aria-hidden
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="14"
                        height="14"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-foreground"
                      >
                        <path d="M3 10.5L12 3l9 7.5" />
                        <path d="M5 9.5V20h14V9.5" />
                      </svg>
                    </span>
                  )}
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
