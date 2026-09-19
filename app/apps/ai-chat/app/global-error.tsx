'use client';

import NextError from 'next/error';

import { useCaptureError } from '@workspace/monitoring/hooks/use-capture-error';

export type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  error: { digest, ...error }
}: GlobalErrorProps) {
  useCaptureError(error);
  return (
    <html>
      <body>
        <NextError statusCode={undefined as never} />
      </body>
    </html>
  );
}
