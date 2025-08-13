import { getStore } from '@netlify/blobs';

function okAuth(event){
  const hdr = event.headers.authorization || '';
  const u = process.env.ADMIN_USER;
  const p = process.env.ADMIN_PASS;
  if (!u || !p) return false;
  const exp = 'Basic ' + Buffer.from(`${u}:${p}`).toString('base64');
  return hdr === exp;
}

export const handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return { statusCode: 405, headers: { Allow: 'POST' }, body: 'Method Not Allowed' };
    if (!okAuth(event)) return { statusCode: 403, body: 'Forbidden' };

    const store = getStore({ name: 'images', encryption: false });
    // create presigned URL for direct upload
    const { url, id } = await store.createPresignedUpload({
      expiry: 60 * 5,
      contentType: 'image/*'
    });
    return { statusCode: 200, body: JSON.stringify({ uploadUrl: url, id }) };
  } catch (e) {
    return { statusCode: 500, body: 'Error: ' + e.message };
  }
};

