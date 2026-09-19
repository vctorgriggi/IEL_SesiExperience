/** Helpers compartilhados dos providers. Tracking desativado só quando env = 'true'. */

export function shouldDisableLocalhost(disableEnvValue: string | undefined): boolean {
  return disableEnvValue === 'true';
}
