import { json, paypalAccessToken, paypalBase } from './_lib.js';

export async function onRequestPost({ env, request }) {
  try {
    const token = await paypalAccessToken(env);
    const price = env.PRODUCT_PRICE || '79.00';
    const currency = env.PRODUCT_CURRENCY || 'USD';
    const sku = env.PRODUCT_SKU || 'field-service-followup-kit';
    const origin = new URL(request.url).origin;
    const res = await fetch(`${paypalBase(env)}/v2/checkout/orders`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{ reference_id: sku, amount: { currency_code: currency, value: price } }],
        application_context: { brand_name: env.CHECKOUT_BRAND || 'Skyknow Checkout', user_action: 'PAY_NOW', return_url: origin + '/', cancel_url: origin + '/' }
      })
    });
    const data = await res.json();
    if (!res.ok) return json({ error: 'PayPal create order failed', details: data }, 502);
    const approveUrl = (data.links || []).find(l => l.rel === 'approve')?.href;
    return json({ id: data.id, approveUrl });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
