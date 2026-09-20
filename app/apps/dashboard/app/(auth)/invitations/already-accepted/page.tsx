import Link from 'next/link';

import { routes } from '@workspace/routes';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@workspace/ui';

export default function AlreadyAcceptedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Convite já aceito</CardTitle>
          <CardDescription>
            Este convite já foi aceito anteriormente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href={routes.dashboard.painel}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Ir para organizações
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
