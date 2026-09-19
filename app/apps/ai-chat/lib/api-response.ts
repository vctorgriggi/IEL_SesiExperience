export function jsonError(
  error: string,
  status: number,
  extra?: Record<string, unknown>
) {
  return new Response(JSON.stringify({ error, ...extra }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
