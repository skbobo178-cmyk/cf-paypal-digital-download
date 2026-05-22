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

export async function ensureOrdersTable(env) {
  if (!env.ORDERS_DB) return false;
  await env.ORDERS_DB.prepare(`
    CREATE TABLE IF NOT EXISTS completed_orders (
      order_id TEXT PRIMARY KEY,
      payer_email TEXT,
      payer_name TEXT,
      file_key TEXT NOT NULL,
      captured_at INTEGER NOT NULL
    )
  `).run();
  return true;
}

export function extractPayer(data) {
  const payer = data?.payer || {};
  const name = [payer.name?.given_name, payer.name?.surname].filter(Boolean).join(' ');
  return { payerEmail: String(payer.email_address || '').toLowerCase(), payerName: name };
}

export async function recordCompletedOrder(env, { orderId, payerEmail, payerName, fileKey }) {
  if (!await ensureOrdersTable(env)) return false;
  await env.ORDERS_DB.prepare(`
    INSERT OR REPLACE INTO completed_orders (order_id, payer_email, payer_name, file_key, captured_at)
    VALUES (?1, ?2, ?3, ?4, ?5)
  `).bind(orderId, payerEmail || '', payerName || '', fileKey, Date.now()).run();
  return true;
}

export async function findCompletedOrder(env, { orderId, payerEmail }) {
  if (!await ensureOrdersTable(env)) return null;
  const row = await env.ORDERS_DB.prepare(`
    SELECT order_id, payer_email, payer_name, file_key, captured_at
    FROM completed_orders
    WHERE order_id = ?1
  `).bind(orderId).first();
  if (!row) return null;
  if (String(row.payer_email || '').toLowerCase() !== String(payerEmail || '').toLowerCase()) return null;
  return row;
}

export async function sendPurchaseEmail(env, { to, orderId, downloadUrl, expiresMinutes }) {
  if (!env.RESEND_API_KEY || !to || !downloadUrl) return { skipped: true };
  const from = env.EMAIL_FROM || 'Field Service Follow-up Kit <onboarding@resend.dev>';
  const subject = `Your Skyknow Checkout download${orderId ? ` (${orderId})` : ''}`;
  const productName = env.PRODUCT_NAME || 'your Skyknow purchase';
  const text = `Thanks for your purchase.\n\nProduct: ${productName}\nPayPal Order ID: ${orderId}\nDownload link: ${downloadUrl}\nThis link expires in ${expiresMinutes || 60} minutes.\n\nIf it expires, return to the checkout page and use your PayPal Order ID plus buyer email to generate a fresh link.`;
  const html = `<p>Thanks for your purchase.</p><p><strong>Product:</strong> ${productName}</p><p><strong>PayPal Order ID:</strong> ${orderId}</p><p><a href="${downloadUrl}">Download your purchase</a></p><p>This link expires in ${expiresMinutes || 60} minutes.</p><p>If it expires, return to the checkout page and use your PayPal Order ID plus buyer email to generate a fresh link.</p>`;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, subject, text, html })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { sent: false, status: res.status, error: data };
  return { sent: true, id: data.id };
}
