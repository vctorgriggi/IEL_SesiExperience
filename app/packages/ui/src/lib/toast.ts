type ToastSeverity = 'success' | 'info' | 'warn' | 'error';

export type ToastMessage = {
  severity: ToastSeverity;
  message: string;
};

export type ToastHandle = {
  show: (toast: ToastMessage) => void;
  clear: () => void;
};

let handle: ToastHandle | null = null;

export function registerToastHandle(next: ToastHandle | null): void {
  handle = next;
}

function show(severity: ToastSeverity, message: string): void {
  if (typeof window === 'undefined') return;
  handle?.show({ severity, message });
}

export const toast = {
  success(message: string): void {
    show('success', message);
  },
  error(message: string): void {
    show('error', message);
  },
  info(message: string): void {
    show('info', message);
  },
  warn(message: string): void {
    show('warn', message);
  },
  dismissAll(): void {
    handle?.clear();
  }
};
