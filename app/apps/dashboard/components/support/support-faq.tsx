'use client';

import { supportFaqItems } from '@/features/support/constants/support-faq';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@workspace/ui';

export function SupportFaq() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-1.5 pb-2">
        <CardTitle className="text-xl text-primary font-semibold tracking-tight">
          Perguntas frequentes
        </CardTitle>
        <CardDescription className="text-base">
          Respostas para as dúvidas mais comuns sobre a plataforma.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="m-0 flex w-full list-none flex-col gap-2 p-0">
          {supportFaqItems.map((item, index) => (
            <li key={index}>
              <details className="group rounded-md border border-border/70 bg-background open:shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-base font-medium text-foreground transition-colors hover:bg-muted/40 [&::-webkit-details-marker]:hidden">
                  <span>{item.question}</span>
                  <span
                    aria-hidden="true"
                    className="text-muted-foreground transition-transform duration-200 group-open:rotate-180"
                  >
                    ▾
                  </span>
                </summary>
                <div className="border-t border-border/70 px-4 py-3">
                  <p className="leading-relaxed text-muted-foreground">
                    {item.answer}
                  </p>
                </div>
              </details>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
