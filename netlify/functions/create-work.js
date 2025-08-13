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

    const body = JSON.parse(event.body || '{}');
    const { src, caption = '', category = 'Kitchen' } = body;
    if (!src || typeof src !== 'string') return { statusCode: 422, body: 'src required' };

    const store = getStore({
      name: 'works',
      consistency: 'strong',
      siteID: process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_API_TOKEN,
    });
    const json = await store.get('items.json');
    const items = json ? JSON.parse(json) : [];
    const map = new Map(items.map(it => [it.src, it]));
    map.set(src, { src, caption, category });
    const next = Array.from(map.values());
    await store.set('items.json', JSON.stringify(next));
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    return { statusCode: 500, body: 'Error: ' + e.message };
  }
};

