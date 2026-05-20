import { readFileSync } from 'node:fs';
const files = ['public/index.html','functions/api/create-order.js','functions/api/capture-order.js','functions/api/download.js','functions/api/recover-download.js','functions/api/_lib.js','wrangler.toml'];
for (const f of files) {
  const s = readFileSync(f, 'utf8');
  if (!s.trim()) throw new Error(`${f} empty`);
}
const html = readFileSync('public/index.html', 'utf8');
if (!html.includes('postMessage({ type: \'download-ready\'')) throw new Error('return popup must notify opener with download URL');
if (!html.includes('recover-download')) throw new Error('page must include re-download recovery flow');
const lib = readFileSync('functions/api/_lib.js', 'utf8');
if (!lib.includes('recordCompletedOrder')) throw new Error('capture flow must persist completed orders');
const capture = readFileSync('functions/api/capture-order.js', 'utf8');
if (!capture.includes('recordCompletedOrder')) throw new Error('capture endpoint must record completed order');
console.log('smoke ok');
