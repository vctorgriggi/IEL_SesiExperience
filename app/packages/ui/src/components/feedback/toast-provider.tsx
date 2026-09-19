'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode
} from 'react';
import { createPortal } from 'react-dom';

import { registerToastHandle, type ToastMessage } from '../../lib/toast';
import { cn } from '../../lib/utils';

type ToastSeverity = ToastMessage['severity'];

type ToastItem = {
  id: number;
  severity: ToastSeverity;
  message: string;
  open: boolean;
};

const TOAST_LIFE_MS = 4200;
const EXIT_DURATION_MS = 180;

const toneClassBySeverity: Record<ToastSeverity, string> = {
  success: 'border-emerald-300/70 bg-emerald-50 text-emerald-950',
  info: 'border-sky-300/70 bg-sky-50 text-sky-950',
  warn: 'border-amber-300/70 bg-amber-50 text-amber-950',
  error: 'border-red-300/70 bg-red-50 text-red-950'
};

const iconBySeverity: Record<ToastSeverity, string> = {
  success: '✓',
  info: 'i',
  warn: '!',
  error: '×'
};

type ToastProviderProps = {
  children: ReactNode;
};

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(1);
  const timersRef = useRef<Map<number, number>>(new Map());

  const clearTimer = useCallback((id: number) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const dismiss = useCallback(
    (id: number) => {
      clearTimer(id);
      setToasts((current) =>
        current.map((toast) =>
          toast.id === id ? { ...toast, open: false } : toast
        )
      );
      const removeTimer = window.setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
      }, EXIT_DURATION_MS);
      timersRef.current.set(id, removeTimer);
    },
    [clearTimer]
  );

  const show = useCallback(
    ({ severity, message }: ToastMessage) => {
      const id = idRef.current++;
      setToasts((current) => [
        ...current,
        { id, severity, message, open: false }
      ]);

      const openTimer = window.setTimeout(() => {
        setToasts((current) =>
          current.map((toast) =>
            toast.id === id ? { ...toast, open: true } : toast
          )
        );
      }, 10);
      timersRef.current.set(id, openTimer);

      const closeTimer = window.setTimeout(() => dismiss(id), TOAST_LIFE_MS);
      timersRef.current.set(id, closeTimer);
    },
    [dismiss]
  );

  const clear = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current.clear();
    setToasts((current) => current.map((toast) => ({ ...toast, open: false })));
    window.setTimeout(() => setToasts([]), EXIT_DURATION_MS);
  }, []);

  useEffect(() => {
    registerToastHandle({ show, clear });
    // O Set é criado uma vez e só é mutado, nunca trocado: guardar a
    // referência aqui é o mesmo conjunto que a limpeza precisa esvaziar.
    const timers = timersRef.current;
    return () => {
      registerToastHandle(null);
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
    };
  }, [show, clear]);

  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const portalTarget = mounted ? document.body : null;

  return (
    <>
      {children}
      {portalTarget &&
        createPortal(
          <div className="pointer-events-none fixed right-5 top-5 z-1400 flex w-88 max-w-[calc(100vw-2.5rem)] flex-col gap-2">
            {toasts.map((toast) => (
              <article
                key={toast.id}
                role="status"
                aria-live="polite"
                className={cn(
                  'pointer-events-auto flex items-start gap-3 rounded-md border p-3 shadow-sm transition-all duration-200 ease-out',
                  toneClassBySeverity[toast.severity],
                  toast.open
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-1 opacity-0'
                )}
              >
                <span
                  aria-hidden="true"
                  className="inline-flex size-6 items-center justify-center rounded-full border border-current/30 text-xs font-semibold"
                >
                  {iconBySeverity[toast.severity]}
                </span>
                <p className="flex-1 text-sm font-medium leading-5">
                  {toast.message}
                </p>
                <button
                  type="button"
                  aria-label="Fechar notificação"
                  onClick={() => dismiss(toast.id)}
                  className="-mr-1 -mt-1 inline-flex size-7 items-center justify-center rounded-full text-current/60 transition-colors hover:bg-black/5 hover:text-current"
                >
                  ×
                </button>
              </article>
            ))}
          </div>,
          portalTarget
        )}
    </>
  );
}
