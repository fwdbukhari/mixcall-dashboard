/**
 * ONE-TIME MIGRATION ENDPOINT
 * Reads all data from Upstash Redis and writes it to data/revenue.json on GitHub.
 * Call once as admin, then this file can be deleted.
 * 
 * POST /api/admin/migrate-to-github
 */

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO  = 'fwdbukhari/mixcall-dashboard';
const FILE_PATH    = 'data/revenue.json';

async function getFileSHA() {
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}`,
    { headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json' } }
  );
  if (res.status === 404) return null;
  const json = await res.json();
  return json.sha;
}

async function writeToGitHub(db, sha) {
  const content = Buffer.from(JSON.stringify(db, null, 2)).toString('base64');
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        message: 'data: migrate all revenue data from Redis to GitHub JSON',
        content,
        branch: 'main',
        ...(sha ? { sha } : {}),
      }),
    }
  );
  if (!res.ok) throw new Error(`GitHub write failed: ${res.status} ${await res.text()}`);
  return res.json();
}

export default async function handler(req, res) {
  if (req.cookies.mc_role !== 'admin') return res.status(401).json({ error: 'Unauthorized' });
  if (req.method !== 'POST') return res.status(405).end();

  try {
    // Connect to Redis
    const kvUrl   = process.env.KV_REST_API_URL;
    const kvToken = process.env.KV_REST_API_TOKEN;
    if (!kvUrl || !kvToken) return res.status(400).json({ error: 'Redis not configured — KV vars missing' });
    if (!GITHUB_TOKEN)      return res.status(400).json({ error: 'GITHUB_TOKEN not set' });

    const { Redis } = await import('@upstash/redis');
    const redis = new Redis({ url: kvUrl, token: kvToken });

    // Get all months list
    const raw = await redis.get('mc:months');
    const months = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : [];

    // Get data for each month
    const data = {};
    for (const month of months) {
      const entry = await redis.get(`mc:data:${month}`);
      if (entry) {
        data[month] = typeof entry === 'string' ? JSON.parse(entry) : entry;
      }
    }

    // Write to GitHub
    const sha = await getFileSHA();
    await writeToGitHub({ months, data }, sha);

    return res.status(200).json({
      success: true,
      migratedMonths: months.length,
      months,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
