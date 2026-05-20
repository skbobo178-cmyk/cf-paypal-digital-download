# Cloudflare + PayPal Digital Download Platform

A minimal self-hosted checkout/digital-delivery platform for selling ZIP/PDF/XLSX products on Cloudflare Pages + Functions, with PayPal Checkout and private R2 file delivery.

## Why this exists

Gumroad/Lemon Squeezy are convenient, but they require marketplace accounts. This repo gives waterGG an owned checkout layer:

- Static product page on Cloudflare Pages
- Server-side PayPal order creation/capture in Cloudflare Functions
- Signed expiring download links
- Private file delivery from Cloudflare R2
- No database required for MVP

## Required accounts/secrets

You still need payment-provider credentials; no platform can collect PayPal money without them.

Cloudflare Pages environment variables:

```text
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_ENV=sandbox   # or live
DOWNLOAD_SECRET=random-long-string
PRODUCT_SKU=field-service-followup-kit
PRODUCT_PRICE=79.00
PRODUCT_CURRENCY=USD
PRODUCT_FILE_KEY=field-service-followup-kit-launch-pack.zip
DOWNLOAD_EXPIRES_MINUTES=60
```

Cloudflare R2 binding:

```text
PRODUCT_BUCKET -> digital-products
```

Upload the product ZIP to R2 with key:

```text
field-service-followup-kit-launch-pack.zip
```

## Deploy

```bash
npm install
npx wrangler login
npx wrangler r2 bucket create digital-products
npx wrangler r2 object put digital-products/field-service-followup-kit-launch-pack.zip --file ../field-service-followup-kit/field-service-followup-kit-launch-pack.zip
npx wrangler pages project create cf-paypal-digital-download --production-branch main
npx wrangler pages deploy public --project-name cf-paypal-digital-download
```

Then configure environment variables and R2 binding in Cloudflare Dashboard → Pages → Project → Settings.

## PayPal setup

1. Create a PayPal Developer app.
2. Start with sandbox credentials.
3. Set `PAYPAL_ENV=sandbox` for testing.
4. After test purchase/capture succeeds, switch to live credentials and `PAYPAL_ENV=live`.

## MVP limitations

- No customer email collection yet.
- No resend/download history page yet.
- No VAT/sales-tax handling.
- No refunds dashboard.

For paid launch, add webhook verification and transaction logging in D1.
