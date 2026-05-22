# Live launch log

## 2026-05-22 PayPal Live switch

Updated Cloudflare Pages production secrets for project `cf-paypal-digital-download`:

- `PAYPAL_CLIENT_ID`: updated to provided PayPal Live app client ID.
- `PAYPAL_CLIENT_SECRET`: updated to provided PayPal Live app secret.
- `PAYPAL_ENV`: set to `live`.

Also updated the static page title to `WaterGG checkout — Field Service Follow-up Kit`.

## Verification

- `npm test` smoke test passed before deploy.
- Redeployed Cloudflare Pages production.
- `/api/create-order` returned HTTP 200 with a live PayPal approval URL on `www.paypal.com`, not sandbox.

## Email state

- Cloudflare Pages has encrypted `RESEND_API_KEY` configured.
- 2026-05-22: `EMAIL_FROM` production secret updated to `Skyknow Checkout <downloads@skyknow.cc>`.
- Cloudflare secret values are encrypted and cannot be read back, but `wrangler pages secret list` confirms `EMAIL_FROM` is present after update.
- Next real verification requires a live small payment capture, which should trigger the production Resend send path from `Skyknow Checkout <downloads@skyknow.cc>`.

## Not performed automatically

- No live payment was captured by the agent.
- No test purchase was completed.
- No PayPal dashboard app metadata was changed directly; the provided credentials are for the PayPal app whose display name should be `WaterGG checkout`.
