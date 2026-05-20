import { verifyDownload } from './_lib.js';
import { productZipBytes } from './_product.js';

export async function onRequestGet({ env, request }) {
  const token = new URL(request.url).searchParams.get('token');
  const payload = await verifyDownload(env, token).catch(() => null);
  if (!payload) return new Response('Invalid or expired download token', { status: 403 });
  let body;
  let contentType = 'application/zip';
  if (env.PRODUCT_BUCKET) {
    const obj = await env.PRODUCT_BUCKET.get(payload.fileKey);
    if (!obj) return new Response('Product file not found', { status: 404 });
    body = obj.body;
    contentType = obj.httpMetadata?.contentType || contentType;
  } else {
    // MVP fallback while R2 is not enabled on the account: bundle the small launch pack
    // inside the Pages Function and still require a signed post-payment token.
    body = productZipBytes();
  }
  return new Response(body, {
    headers: {
      'content-type': contentType,
      'content-disposition': `attachment; filename="${payload.fileKey.split('/').pop()}"`,
      'cache-control': 'private, no-store'
    }
  });
}
