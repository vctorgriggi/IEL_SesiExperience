import Link from 'next/link';
import { CheckmarkCircle01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { routes } from '@workspace/routes';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@workspace/ui';

export default async function OrganizationBillingSuccessPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const billingHref = routes.dashboard.org(slug).billing.index;

  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-center gap-2 text-base font-semibold text-green-600 dark:text-green-400">
            <HugeiconsIcon
              icon={CheckmarkCircle01Icon}
              size={20}
            />
            Pagamento concluído
          </CardTitle>
          <CardDescription className="text-center text-sm">
            Sua assinatura foi confirmada. Obrigado!
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <Link
            href={billingHref}
            className="w-full"
          >
            Ver meu plano
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
