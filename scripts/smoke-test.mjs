import { readFileSync } from 'node:fs';
const files = ['public/index.html','public/products.json','functions/api/create-order.js','functions/api/capture-order.js','functions/api/download.js','functions/api/recover-download.js','functions/api/_lib.js','wrangler.toml'];
for (const f of files) {
  const s = readFileSync(f, 'utf8');
  if (!s.trim()) throw new Error(`${f} empty`);
}
const html = readFileSync('public/index.html', 'utf8');
if (!html.includes('postMessage({ type: \'download-ready\'')) throw new Error('return popup must notify opener with download URL');
if (!html.includes('window.close()')) throw new Error('checkout popup must close itself after notifying opener');
if (!html.includes('recover-download')) throw new Error('page must include re-download recovery flow');
if (!html.includes('Skyknow Checkout')) throw new Error('page must use Skyknow Checkout branding');
if (!html.includes('Technical-live')) throw new Error('page must show QA status label for current item');
const manifest = JSON.parse(readFileSync('public/products.json', 'utf8'));
if (!manifest.items?.length) throw new Error('products.json must define at least one item');
if (!manifest.items.every(item => item.status)) throw new Error('each product manifest item must carry a QA status');
const lib = readFileSync('functions/api/_lib.js', 'utf8');
if (!lib.includes('recordCompletedOrder')) throw new Error('capture flow must persist completed orders');
const capture = readFileSync('functions/api/capture-order.js', 'utf8');
if (!capture.includes('recordCompletedOrder')) throw new Error('capture endpoint must record completed order');
if (!capture.includes('sendPurchaseEmail')) throw new Error('capture endpoint must send purchase email when payer email is available');
if (!lib.includes('api.resend.com/emails')) throw new Error('library must integrate with Resend email API');
console.log('smoke ok');
