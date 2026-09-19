'use client';

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode
} from 'react';
import { createPortal } from 'react-dom';

import { cn } from '../../lib/utils';

type DialogSize = 'sm' | 'md' | 'lg';

const sizeClassBySize: Record<DialogSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-2xl'
};

export type DialogProps = {
  visible: boolean;
  onHide: () => void;
  header?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: DialogSize;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  style?: CSSProperties;
  className?: string;
  bodyClassName?: string;
};

export function Dialog({
  visible,
  onHide,
  header,
  description,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
  closeOnEscape = true,
  style,
  className,
  bodyClassName
}: DialogProps) {
  const [mounted, setMounted] = useState(visible);
  const [shown, setShown] = useState(visible);

  // Keep the latest onHide without making effects re-subscribe every render
  // (the parent may pass a fresh closure each render).
  const onHideRef = useRef(onHide);
  useEffect(() => {
    onHideRef.current = onHide;
  }, [onHide]);

  // Enter/exit animation driver.
  useEffect(() => {
    if (visible) {
      setMounted(true);
      // Double rAF: wait for the mounted (hidden) frame to paint, then flip to
      // shown so the enter transition actually runs. Cancel if `visible`
      // flips back before the callback fires (avoids a fade-in flash).
      const raf = requestAnimationFrame(() =>
        requestAnimationFrame(() => setShown(true))
      );
      return () => cancelAnimationFrame(raf);
    }
    setShown(false);
  }, [visible]);

  // Lock body scroll while mounted; cleanup restores it on unmount.
  useEffect(() => {
    if (!mounted) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mounted]);

  // Close on Escape while mounted.
  useEffect(() => {
    if (!mounted || !closeOnEscape) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onHideRef.current();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mounted, closeOnEscape]);

  if (typeof window === 'undefined' || !mounted) return null;

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-[1300] flex items-center justify-center p-4 transition-opacity duration-200',
        shown ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
      onTransitionEnd={(event) => {
        // Only react to THIS overlay's own opacity transition finishing —
        // ignore transitions bubbling up from the backdrop/panel children,
        // otherwise a faster child transition would unmount us early.
        if (
          event.target === event.currentTarget &&
          event.propertyName === 'opacity' &&
          !shown
        ) {
          setMounted(false);
        }
      }}
      aria-hidden={!shown}
    >
      <button
        type="button"
        aria-label="Fechar modal"
        className={cn(
          'absolute inset-0 bg-black/40 backdrop-blur-[6px] transition-opacity duration-200',
          shown ? 'opacity-100' : 'opacity-0'
        )}
        onClick={() => {
          if (closeOnBackdrop) onHide();
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        style={style}
        className={cn(
          'relative z-10 flex max-h-[calc(100dvh-2rem)] w-full flex-col rounded-2xl border border-border bg-card shadow-2xl transition-all duration-200 ease-out',
          sizeClassBySize[size],
          shown
            ? 'translate-y-0 scale-100 opacity-100'
            : 'translate-y-2 scale-[0.98] opacity-0',
          className
        )}
      >
        {header ? (
          <header className="shrink-0 border-b border-border px-6 py-4">
            <h3 className="text-xl font-semibold text-foreground">{header}</h3>
            {description ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            ) : null}
          </header>
        ) : null}

        <div
          className={cn(
            'min-h-0 flex-1 overflow-y-auto px-6 py-5',
            bodyClassName
          )}
        >
          {children}
        </div>

        {footer ? (
          <footer className="flex shrink-0 items-center justify-end gap-3 border-t border-border px-6 py-4">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
