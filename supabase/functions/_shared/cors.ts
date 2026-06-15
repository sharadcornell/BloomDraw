// CORS — HYGIENE ONLY, not the security boundary (docs/03 §10, docs/05 §1).
//
// Native mobile clients do not enforce browser CORS, so these headers must NOT
// be relied on to protect the functions. Real protection = input validation,
// server-side secrets, device/session checks, rate limiting, safe errors.
export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-device-id, x-app-env',
};

/** Response for a CORS preflight (OPTIONS) request. */
export function preflightResponse(): Response {
  return new Response('ok', { headers: corsHeaders });
}
