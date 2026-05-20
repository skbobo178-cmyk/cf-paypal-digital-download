export function paypalBase(env) {
  return (env.PAYPAL_ENV || 'sandbox') === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

export async function paypalAccessToken(env) {
  if (!env.PAYPAL_CLIENT_ID || !env.PAYPAL_CLIENT_SECRET) throw new Error('Missing PayPal credentials');
  const auth = btoa(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`);
  const res = await fetch(`${paypalBase(env)}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials'
  });
  if (!res.ok) throw new Error(`PayPal token failed: ${res.status}`);
  return (await res.json()).access_token;
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
}

function b64url(buf) {
  const bytes = buf instanceof ArrayBuffer ? new Uint8Array(buf) : new TextEncoder().encode(String(buf));
  let s = btoa(String.fromCharCode(...bytes));
  return s.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromB64url(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return atob(s);
}

async function hmac(secret, text) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return crypto.subtle.sign('HMAC', key, new TextEncoder().encode(text));
}

export async function signDownload(env, payload) {
  if (!env.DOWNLOAD_SECRET) throw new Error('Missing DOWNLOAD_SECRET');
  const body = b64url(JSON.stringify(payload));
  const sig = b64url(await hmac(env.DOWNLOAD_SECRET, body));
  return `${body}.${sig}`;
}

export async function verifyDownload(env, token) {
  if (!env.DOWNLOAD_SECRET) throw new Error('Missing DOWNLOAD_SECRET');
  const [body, sig] = String(token || '').split('.');
  if (!body || !sig) return null;
  const expected = b64url(await hmac(env.DOWNLOAD_SECRET, body));
  if (expected !== sig) return null;
  const payload = JSON.parse(fromB64url(body));
  if (!payload.exp || Date.now() > payload.exp) return null;
  return payload;
}
