import { verifyDownload } from './_lib.js';

export async function onRequestGet({ env, request }) {
  const token = new URL(request.url).searchParams.get('token');
  const payload = await verifyDownload(env, token).catch(() => null);
  if (!payload) return new Response('Invalid or expired download token', { status: 403 });
  if (!env.PRODUCT_BUCKET) return new Response('R2 bucket binding PRODUCT_BUCKET is not configured', { status: 500 });
  const obj = await env.PRODUCT_BUCKET.get(payload.fileKey);
  if (!obj) return new Response('Product file not found', { status: 404 });
  return new Response(obj.body, {
    headers: {
      'content-type': obj.httpMetadata?.contentType || 'application/zip',
      'content-disposition': `attachment; filename="${payload.fileKey.split('/').pop()}"`,
      'cache-control': 'private, no-store'
    }
  });
}
