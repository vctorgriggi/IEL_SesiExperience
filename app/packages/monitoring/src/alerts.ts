/** Disparo de alertas por webhook (eventos críticos). MONITORING_ALERT_WEBHOOK_URL para ativar. */

export type AlertLevel = 'info' | 'warning' | 'error' | 'critical';

export type AlertPayload = {
  level: AlertLevel;
  title: string;
  message?: string;
  timestamp: string;
  environment?: string;
  metadata?: Record<string, unknown>;
};

const WEBHOOK_URL = process.env.MONITORING_ALERT_WEBHOOK_URL;

export async function sendAlert(
  level: AlertLevel,
  title: string,
  options?: { message?: string; metadata?: Record<string, unknown> }
): Promise<void> {
  if (!WEBHOOK_URL) return;

  const payload: AlertPayload = {
    level,
    title,
    message: options?.message,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    metadata: options?.metadata
  };

  try {
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error('[Monitoring] Failed to send alert:', err);
  }
}
