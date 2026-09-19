export enum Provider {
  Credentials = 'credentials',
  TotpCode = 'totp-code',
  RecoveryCode = 'recovery-code',
  Google = 'google'
}

export enum OAuthProvider {
  Google = Provider.Google
}
