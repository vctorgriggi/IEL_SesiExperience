import type { FieldPath, FieldValues, UseFormSetError } from 'react-hook-form';

type ServerValidationErrors = Record<
  string,
  { _errors?: string[] } | undefined
>;

export function applyServerValidationErrors<TFieldValues extends FieldValues>(
  validationErrors: unknown,
  setError: UseFormSetError<TFieldValues>,
  fieldNames: FieldPath<TFieldValues>[]
): void {
  if (!validationErrors || typeof validationErrors !== 'object') return;
  const obj = validationErrors as ServerValidationErrors;
  for (const field of fieldNames) {
    const entry = obj[field as string];
    const msg = Array.isArray(entry?._errors) ? entry._errors[0] : undefined;
    if (msg) setError(field, { message: msg });
  }
}
