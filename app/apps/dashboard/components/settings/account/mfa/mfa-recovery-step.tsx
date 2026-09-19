'use client';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@workspace/ui';

export type MfaRecoveryStepProps = {
  recoveryCodes: string[];
  onFinish: () => void;
};

export function MfaRecoveryStep({
  recoveryCodes,
  onFinish
}: MfaRecoveryStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Códigos de recuperação</CardTitle>
        <CardDescription>
          Guarde esses códigos em local seguro. Cada um pode ser usado uma vez
          para acessar sem o autenticador.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <pre className="rounded-md bg-muted p-4 text-sm font-mono">
          {recoveryCodes.join('\n')}
        </pre>
      </CardContent>
      <CardFooter>
        <Button onClick={onFinish}>Concluir</Button>
      </CardFooter>
    </Card>
  );
}
