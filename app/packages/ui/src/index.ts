// Componentes
export { Button } from './components/actions/button';
export type { ButtonProps } from './components/actions/button';
export { Input } from './components/forms/input';
export { InputPassword } from './components/forms/input-password';
export type { InputPasswordProps } from './components/forms/input-password';

export { Label } from './components/forms/label';
export { Textarea } from './components/forms/textarea';
export type { TextareaProps } from './components/forms/textarea';
export { Switch } from './components/forms/switch';
export type { SwitchProps } from './components/forms/switch';
export { Switcher } from './components/forms/switcher';
export type {
  SwitcherOption,
  SwitcherProps
} from './components/forms/switcher';
export { Checkbox } from './components/forms/checkbox';
export type { CheckboxProps } from './components/forms/checkbox';
export { Calendar } from './components/forms/calendar';
export type { CalendarProps } from './components/forms/calendar';
export { DateTimePicker } from './components/forms/date-time-picker';
export type { DateTimePickerProps } from './components/forms/date-time-picker';
export { InputOTP } from './components/forms/input-otp';
export type { InputOTPProps } from './components/forms/input-otp';
export {
  NativeSelect,
  FilterNativeSelect,
  filterNativeSelectClass
} from './components/forms/native-select';
export type { NativeSelectProps } from './components/forms/native-select';
export { Select } from './components/forms/select';
export type { SelectOption, SelectProps } from './components/forms/select';
export { Alert, AlertDescription } from './components/feedback/alert';
export type { AlertVariant } from './components/feedback/alert';
export { Divider } from './components/layout/divider';
export { Separator } from './components/layout/separator';
export { Skeleton } from './components/feedback/skeleton';
export { AuthCardLayout } from './components/layout/auth-card-layout';
export type {
  AuthCardLayoutProps,
  AuthCardLayoutVariant
} from './components/layout/auth-card-layout';
export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from './components/layout/card';
export type { CardProps } from './components/layout/card';
export { Dialog, Modal, ModalProvider } from './components/overlay/modal';
export type { DialogProps } from './components/overlay/modal';
export { ConfirmationModal } from './components/overlay/confirmation-modal';
export type { ConfirmationModalProps } from './components/overlay/confirmation-modal';
export { PopupMenu } from './components/overlay/popup-menu';
export type {
  MenuItem,
  PopupMenuProps,
  PopupMenuTriggerParams
} from './components/overlay/popup-menu';
export { EmptyCard } from './components/layout/empty-card';
export type { EmptyCardProps } from './components/layout/empty-card';
export { EmptyState } from './components/layout/empty-state';
export type { EmptyStateProps } from './components/layout/empty-state';
export {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from './components/layout/table';

export { MetricCard } from './components/dashboard/metric-card';
export { CardMetric } from './components/dashboard/card-metric';
export type { CardMetricProps, CardMetricTrend } from './components/dashboard/card-metric';
export { PricingGrid } from './components/pricing';
export type {
  BillingInterval,
  PricingGridProps,
  PricingPlanCta,
  PricingPlanItem
} from './components/pricing';
export { Logo } from './components/branding/logo';
export { ThemeToggle } from './components/theme/theme-toggle';
export { ToastProvider } from './components/feedback/toast-provider';

// Hooks
export { useLocalStorage } from './hooks/use-local-storage';
export { useDebounce, useDebouncedCallback } from './hooks/use-debounce';
export { useToggle, useToggleValues } from './hooks/use-toggle';
export {
  useClickOutside,
  useClickOutsideMultiple
} from './hooks/use-click-outside';
export { useMediaQuery } from './hooks/use-media-query';
export { useMounted } from './hooks/use-mounted';
export { useCallbackRef } from './hooks/use-callback-ref';
export { useToast } from './hooks/use-toast';
export type { UseToastOptions } from './hooks/use-toast';

// Utilitários
export { cn } from './lib/utils';
export { toast } from './lib/toast';
export { linkClass } from './lib/auth-variants';
export {
  SidebarBackdrop,
  SidebarPanel,
  SidebarTrigger
} from './components/layout/sidebar';
export type {
  SidebarBackdropProps,
  SidebarPanelProps,
  SidebarTriggerProps
} from './components/layout/sidebar';
export { FormErrorAlert } from './components/auth/form-error-alert';
export { PasswordFormMessage } from './components/auth/password-form-message';
