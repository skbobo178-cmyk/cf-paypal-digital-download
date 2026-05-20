import { findCompletedOrder, json, signDownload } from './_lib.js';

export async function onRequestPost({ env, request }) {
  try {
    const { orderId, payerEmail } = await request.json();
    if (!orderId || !payerEmail) return json({ error: 'Enter both PayPal order ID and buyer email.' }, 400);
    const row = await findCompletedOrder(env, { orderId, payerEmail });
    if (!row) return json({ error: 'No completed order found for that order ID and email.' }, 404);
    const expiresMinutes = Number(env.DOWNLOAD_EXPIRES_MINUTES || 60);
    const tokenOut = await signDownload(env, { orderId: row.order_id, fileKey: row.file_key, exp: Date.now() + expiresMinutes * 60 * 1000 });
    return json({ downloadUrl: `/api/download?token=${encodeURIComponent(tokenOut)}`, expiresMinutes });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
