// Netlify Function: save-items
// Persists portfolio items into GitHub repo at assets/portfolio/items.json
// Auth: Basic (ADMIN_USER / ADMIN_PASS env vars)

export const handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, headers: { Allow: 'POST' }, body: 'Method Not Allowed' };
    }

    const adminUser = process.env.ADMIN_USER;
    const adminPass = process.env.ADMIN_PASS;
    const authHeader = event.headers.authorization || '';
    const expected = 'Basic ' + Buffer.from(`${adminUser}:${adminPass}`).toString('base64');
    if (!adminUser || !adminPass || authHeader !== expected) {
      return { statusCode: 403, body: 'Forbidden' };
    }

    let items;
    try {
      items = JSON.parse(event.body || '[]');
    } catch (_) {
      return { statusCode: 400, body: 'Invalid JSON' };
    }
    if (!Array.isArray(items)) {
      return { statusCode: 422, body: 'Items must be an array' };
    }
    for (const it of items) {
      if (!it || typeof it.src !== 'string') {
        return { statusCode: 422, body: 'Invalid item structure' };
      }
    }

    const owner = process.env.REPO_OWNER;
    const repo = process.env.REPO_NAME;
    const branch = process.env.REPO_BRANCH || 'main';
    const token = process.env.GITHUB_TOKEN;

    if (!owner || !repo || !token) {
      return { statusCode: 500, body: 'Server not configured (repo or token missing)' };
    }

    const path = 'assets/portfolio/items.json';
    const apiBase = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`;

    // Read current sha if exists
    let sha = undefined;
    try {
      const getRes = await fetch(`${apiBase}?ref=${encodeURIComponent(branch)}`, {
        headers: { Authorization: `token ${token}`, 'User-Agent': 'netlify-fn' }
      });
      if (getRes.ok) {
        const json = await getRes.json();
        sha = json.sha;
      }
    } catch (_) { /* ignore */ }

    const content = Buffer.from(JSON.stringify(items, null, 2), 'utf8').toString('base64');
    const putRes = await fetch(apiBase, {
      method: 'PUT',
      headers: {
        Authorization: `token ${token}`,
        'User-Agent': 'netlify-fn',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'chore: update portfolio items.json via Netlify function',
        content,
        branch,
        sha
      })
    });

    if (!putRes.ok) {
      const txt = await putRes.text();
      return { statusCode: 502, body: `GitHub write failed: ${txt}` };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    return { statusCode: 500, body: `Unexpected error: ${e.message}` };
  }
};

