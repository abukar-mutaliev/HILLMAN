import { getStore } from '@netlify/blobs';

export const handler = async () => {
  try {
    const store = getStore({
      name: 'works',
      consistency: 'strong',
      siteID: process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_API_TOKEN,
    });
    const json = await store.get('items.json');
    const items = json ? JSON.parse(json) : [];
    return { statusCode: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify(items) };
  } catch (e) {
    return { statusCode: 500, body: 'Error: ' + e.message };
  }
};

