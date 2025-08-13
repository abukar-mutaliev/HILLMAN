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
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: { Allow: 'POST' }, body: 'Method Not Allowed' };
  if (!okAuth(event)) return { statusCode: 403, body: 'Forbidden' };
  try {
    const store = getStore({
      name: 'works',
      consistency: 'strong',
      siteID: process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_API_TOKEN,
    });
    await store.set('items.json', JSON.stringify([]));
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    return { statusCode: 500, body: 'Error: ' + e.message };
  }
};

