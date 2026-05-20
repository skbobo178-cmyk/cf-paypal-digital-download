import { json, paypalAccessToken, paypalBase, signDownload } from './_lib.js';

export async function onRequestPost({ env, request }) {
  try {
    const { orderId } = await request.json();
    if (!orderId) return json({ error: 'Missing orderId' }, 400);
    const token = await paypalAccessToken(env);
    const res = await fetch(`${paypalBase(env)}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' }
    });
    const data = await res.json();
    if (!res.ok) return json({ error: 'PayPal capture failed', details: data }, 502);
    if (data.status !== 'COMPLETED') return json({ error: `Payment not completed: ${data.status}`, details: data }, 402);
    const fileKey = env.PRODUCT_FILE_KEY || 'field-service-followup-kit-launch-pack.zip';
    const expiresMinutes = Number(env.DOWNLOAD_EXPIRES_MINUTES || 60);
    const tokenOut = await signDownload(env, { orderId, fileKey, exp: Date.now() + expiresMinutes * 60 * 1000 });
    return json({ status: data.status, downloadUrl: `/api/download?token=${encodeURIComponent(tokenOut)}`, expiresMinutes });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
