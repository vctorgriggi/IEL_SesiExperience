'use client';

import { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  confirmCheckInByCode,
  validateCheckInByCode
} from '@/features/events/actions';
import { firstValidationError } from '@/lib/get-error-message';
import {
  Camera01Icon,
  Loading03Icon,
  ScanBarcode
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label
} from '@workspace/ui';

const Scanner = dynamic(
  () => import('@yudiel/react-qr-scanner').then((mod) => mod.Scanner),
  { ssr: false }
);

type CheckinScannerProps = {
  eventId: string;
  eventTitle: string;
};

function getActionErrorMessage(
  serverError: string | undefined,
  validationErrors: unknown
): string {
  if (serverError) return serverError;
  const validationMsg = validationErrors
    ? firstValidationError(validationErrors)
    : undefined;
  return validationMsg ?? 'Código inválido.';
}

type Message = {
  type: 'success' | 'error' | 'info';
  text: string;
};

const SCAN_COOLDOWN_MS = 2000;

export function CheckinScanner({
  eventId,
  eventTitle: _eventTitle
}: CheckinScannerProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannerPaused, setScannerPaused] = useState(false);

  const processCode = useCallback(
    async (trimmed: string) => {
      if (!trimmed) return;
      setMessage(null);
      setLoading(true);
      try {
        const validateResult = await validateCheckInByCode({ code: trimmed });
        if (validateResult?.serverError || validateResult?.validationErrors) {
          setMessage({
            type: 'error',
            text: getActionErrorMessage(
              validateResult.serverError,
              validateResult.validationErrors
            )
          });
          setLoading(false);
          return;
        }
        const validated = validateResult?.data;
        if (!validated) {
          setMessage({ type: 'error', text: 'Código inválido.' });
          setLoading(false);
          return;
        }
        if (validated.eventId !== eventId) {
          setMessage({
            type: 'error',
            text: 'Este código não é deste evento.'
          });
          setLoading(false);
          return;
        }
        if (validated.alreadyCheckedIn) {
          setMessage({
            type: 'info',
            text: `${validated.name ?? 'Participante'} já fez check-in.`
          });
          setCode('');
          setLoading(false);
          return;
        }
        const confirmResult = await confirmCheckInByCode({ code: trimmed });
        if (confirmResult?.serverError || confirmResult?.validationErrors) {
          setMessage({
            type: 'error',
            text: getActionErrorMessage(
              confirmResult.serverError,
              confirmResult.validationErrors
            )
          });
          setLoading(false);
          return;
        }
        setMessage({
          type: 'success',
          text: `Check-in confirmado para ${validated.name ?? 'participante'}.`
        });
        setCode('');
        setScannerPaused(true);
        setTimeout(() => setScannerPaused(false), SCAN_COOLDOWN_MS);
      } catch (err) {
        setMessage({
          type: 'error',
          text: err instanceof Error ? err.message : 'Código inválido.'
        });
      } finally {
        setLoading(false);
      }
    },
    [eventId]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    await processCode(trimmed);
  }

  function handleScan(detectedCodes: { rawValue: string }[]) {
    const raw = detectedCodes[0]?.rawValue?.trim();
    if (!raw || loading || scannerPaused) return;
    void processCode(raw);
  }

  function handleCameraError(error: unknown) {
    const msg =
      error instanceof Error
        ? error.message
        : 'Não foi possível acessar a câmera.';
    setCameraError(msg);
  }

  const cardClassName =
    'max-w-md rounded-xl border border-border/80 bg-card shadow-none';

  return (
    <Card className={cardClassName}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-medium text-foreground">
          <HugeiconsIcon
            icon={ScanBarcode}
            size={18}
            className="text-muted-foreground"
          />
          Check-in
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 pt-0">
        {!showCamera ? (
          <>
            <Button
              type="button"
              outlined
              className="w-full rounded-lg border-border bg-card text-foreground hover:bg-muted/50"
              onClick={() => {
                setShowCamera(true);
                setCameraError(null);
              }}
            >
              <HugeiconsIcon
                icon={Camera01Icon}
                size={16}
                className="mr-2"
              />
              Escanear com câmera
            </Button>
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/80" />
              </div>
              <span className="relative flex justify-center bg-card">
                <span className="px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  ou digite o código
                </span>
              </span>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <div className="overflow-hidden rounded-xl border border-border/80 bg-muted/20 aspect-square max-h-[280px]">
              <Scanner
                onScan={handleScan}
                onError={handleCameraError}
                paused={loading || scannerPaused}
                constraints={{ facingMode: 'environment' }}
                formats={['qr_code']}
                scanDelay={SCAN_COOLDOWN_MS}
                components={{ finder: true }}
                classNames={{ container: 'w-full h-full' }}
              />
            </div>
            {cameraError && (
              <p className="text-sm text-destructive">{cameraError}</p>
            )}
            <Button
              type="button"
              outlined
              className="text-muted-foreground hover:text-foreground"
              onClick={() => {
                setShowCamera(false);
                setCameraError(null);
              }}
            >
              Digitar código manualmente
            </Button>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label
              htmlFor="code"
              className="text-sm font-medium text-muted-foreground"
            >
              Código do ingresso
            </Label>
            <Input
              id="code"
              type="text"
              placeholder="Cole o código ou digite"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={loading}
              autoComplete="off"
              className="rounded-lg border-border/80 bg-card text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/20"
            />
          </div>
          <Button
            type="submit"
            disabled={loading || !code.trim()}
            className="rounded-lg"
          >
            {loading ? (
              <>
                <HugeiconsIcon
                  icon={Loading03Icon}
                  size={18}
                  className="animate-spin"
                />
                <span className="ml-2">Confirmando...</span>
              </>
            ) : (
              'Confirmar entrada'
            )}
          </Button>
        </form>
        {message && (
          <div
            className={`rounded-xl border p-4 text-sm ${
              message.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                : message.type === 'error'
                  ? 'border-destructive/30 bg-destructive/10 text-destructive'
                  : 'border-border/80 bg-muted/30 text-muted-foreground'
            }`}
          >
            {message.text}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
