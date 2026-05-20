import { extractPayer, json, paypalAccessToken, paypalBase, recordCompletedOrder, sendPurchaseEmail, signDownload } from './_lib.js';

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
    const { payerEmail, payerName } = extractPayer(data);
    await recordCompletedOrder(env, { orderId, payerEmail, payerName, fileKey });
    const expiresMinutes = Number(env.DOWNLOAD_EXPIRES_MINUTES || 60);
    const tokenOut = await signDownload(env, { orderId, fileKey, exp: Date.now() + expiresMinutes * 60 * 1000 });
    const downloadUrl = `/api/download?token=${encodeURIComponent(tokenOut)}`;
    const absoluteDownloadUrl = new URL(downloadUrl, request.url).href;
    const email = await sendPurchaseEmail(env, { to: payerEmail, orderId, downloadUrl: absoluteDownloadUrl, expiresMinutes });
    return json({ status: data.status, downloadUrl, expiresMinutes, orderId, payerEmail, email });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
