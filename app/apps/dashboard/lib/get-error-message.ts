const FRIENDLY_VALIDATION_MESSAGES: Array<{
  pattern: RegExp;
  message: string;
}> = [
  {
    pattern: /expected date|received string|invalid_type.*date/i,
    message: 'Verifique as datas e horários do evento.'
  },
  {
    pattern: /invalid.*uuid|ID do evento/i,
    message: 'Dados do evento inválidos. Tente novamente.'
  },
  {
    pattern: /422|validation|validat|dados inválidos/i,
    message:
      'Alguns dados estão incorretos. Revise os campos e tente novamente.'
  },
  {
    pattern: /forbidden|não permitido|limit/i,
    message: 'Limite atingido ou ação não permitida.'
  },
  {
    pattern: /401|API error 401|unauthorized|não autorizado/i,
    message: 'E-mail ou senha incorretos.'
  }
];

export function firstValidationError(
  validationErrors: unknown
): string | undefined {
  if (!validationErrors || typeof validationErrors !== 'object')
    return undefined;
  for (const v of Object.values(validationErrors as Record<string, unknown>)) {
    if (
      v &&
      typeof v === 'object' &&
      '_errors' in v &&
      Array.isArray((v as { _errors?: string[] })._errors)
    ) {
      const err = (v as { _errors: string[] })._errors[0];
      if (err) return err;
    }
  }
  return undefined;
}

export function getErrorMessage(err: unknown, fallback: string): string {
  const raw =
    err instanceof Error ? err.message : typeof err === 'string' ? err : '';
  if (!raw) return fallback;
  const friendly = FRIENDLY_VALIDATION_MESSAGES.find(({ pattern }) =>
    pattern.test(raw)
  );
  return friendly ? friendly.message : raw;
}
