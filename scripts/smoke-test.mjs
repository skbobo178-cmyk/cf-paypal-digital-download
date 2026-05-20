import { readFileSync } from 'node:fs';
const files = ['public/index.html','functions/api/create-order.js','functions/api/capture-order.js','functions/api/download.js','functions/api/_lib.js','wrangler.toml'];
for (const f of files) {
  const s = readFileSync(f, 'utf8');
  if (!s.trim()) throw new Error(`${f} empty`);
}
console.log('smoke ok');
