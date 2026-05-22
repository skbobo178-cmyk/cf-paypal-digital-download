# Custom domain log

## 2026-05-22T21:42:30

Attempted to attach custom domain `checkout.skyknow.cc` to Cloudflare Pages project `cf-paypal-digital-download` via Cloudflare API.

Result: domain added to Pages project, status `initializing` / verification pending.

Current DNS check: `checkout.skyknow.cc` does not resolve yet. The Cloudflare account authenticated in Wrangler can manage Pages, but API zone lookup for `skyknow.cc` returned no zone in this account, so DNS could not be created automatically from here.

Required DNS record at the DNS host for `skyknow.cc`:

```text
Type: CNAME
Name: checkout
Target: cf-paypal-digital-download.pages.dev
Proxy: DNS-only or proxied according to provider/Cloudflare Pages instructions
```

After DNS exists, re-check `https://checkout.skyknow.cc/` and the Pages custom-domain status.
