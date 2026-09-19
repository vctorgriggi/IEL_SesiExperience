import { AuthErrorCode } from '@workspace/auth/errors';

export const authErrorLabels: Record<AuthErrorCode, string> = {
  [AuthErrorCode.NewEmailConflict]: 'Este e-mail já está em uso.',
  [AuthErrorCode.UnverifiedEmail]: 'E-mail não verificado.',
  [AuthErrorCode.IncorrectEmailOrPassword]: 'E-mail ou senha incorretos.',
  [AuthErrorCode.TotpCodeRequired]: 'Código TOTP é obrigatório.',
  [AuthErrorCode.IncorrectTotpCode]: 'Código TOTP incorreto.',
  [AuthErrorCode.MissingRecoveryCodes]:
    'Códigos de recuperação não encontrados.',
  [AuthErrorCode.IncorrectRecoveryCode]: 'Código de recuperação incorreto.',
  [AuthErrorCode.RequestExpired]: 'Solicitação expirada.',
  [AuthErrorCode.RateLimitExceeded]:
    'Muitas tentativas. Tente novamente mais tarde.',
  [AuthErrorCode.IllegalOAuthProvider]: 'Provedor OAuth inválido.',
  [AuthErrorCode.InternalServerError]:
    'Algo deu errado. Tente novamente mais tarde.',
  [AuthErrorCode.MissingOAuthEmail]: 'E-mail do OAuth não informado.',
  [AuthErrorCode.AlreadyLinked]: 'Conta OAuth já está vinculada.',
  [AuthErrorCode.RequiresExplicitLinking]:
    'Faça login primeiro para vincular esta conta.',
  [AuthErrorCode.UnknownError]: 'Erro desconhecido.'
};

const authErrorFallbackLabels: Record<string, string> = {
  Configuration:
    'Não foi possível iniciar login social. Verifique a configuração.',
  OAuthSignin: 'Não foi possível iniciar login com Google. Tente novamente.',
  OAuthCallback: 'Falha no retorno do login com Google. Tente novamente.',
  OAuthCreateAccount:
    'Não foi possível criar conta via Google. Tente novamente.',
  OAuthAccountNotLinked:
    'Já existe conta com este e-mail. Faça login com e-mail e senha para vincular.',
  AccessDenied: 'Acesso negado pelo provedor OAuth.',
  CallbackRouteError: 'Não foi possível concluir o login social.',
  Verification: 'Falha de verificação na autenticação social.',
  oauth_account_not_found: 'Nenhuma conta encontrada. Cadastre-se primeiro.',
  oauth_account_exists: 'Já existe uma conta com este e-mail. Faça login.',
  oauth_start_failed:
    'Não foi possível iniciar login com Google. Tente novamente.',
  oauth_api_unreachable:
    'Serviço de autenticação indisponível. Tente novamente.',
  oauth_use_signout: 'Faça logout da conta atual para continuar com Google.',
  unable_to_link_account:
    'Não foi possível vincular a conta. Tente novamente, por favor.'
};

export function resolveAuthErrorMessage(
  codeOrKey: string,
  fallback?: string
): string {
  if (codeOrKey in authErrorLabels) {
    return authErrorLabels[codeOrKey as AuthErrorCode];
  }
  if (codeOrKey in authErrorFallbackLabels) {
    return authErrorFallbackLabels[codeOrKey];
  }
  return fallback ?? authErrorLabels[AuthErrorCode.UnknownError];
}
