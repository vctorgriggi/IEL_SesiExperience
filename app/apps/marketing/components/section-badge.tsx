import type { ReactNode } from 'react';

type SectionBadgeProps = {
  children: ReactNode;
  className?: string;
};

export function SectionBadge({ children, className = '' }: SectionBadgeProps) {
  return <span className={`pill ${className}`}>{children}</span>;
}
