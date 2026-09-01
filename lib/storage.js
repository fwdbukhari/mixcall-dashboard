/**
 * GitHub JSON Storage
 * 
 * All revenue data is stored in data/revenue.json in the GitHub repo.
 * - Reads: GitHub Contents API (always fresh, no cache issues)
 * - Writes: GitHub Contents API (creates a commit with updated data)
 * 
 * Required env var: GITHUB_TOKEN (repo scope)
 */

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO  = 'fwdbukhari/mixcall-dashboard';
const FILE_PATH    = 'data/revenue.json';
const BRANCH       = 'main';

async function fetchFromGitHub() {
  if (!GITHUB_TOKEN) {
    console.warn('GITHUB_TOKEN not set — using in-memory fallback');
    return { db: _mem, sha: null };
  }
  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
    },
    cache: 'no-store',
  });
  if (res.status === 404) return { db: { months: [], data: {} }, sha: null };
  if (!res.ok) throw new Error(`GitHub read failed: ${res.status}`);
  const json = await res.json();
  const content = Buffer.from(json.content, 'base64').toString('utf-8');
  return { db: JSON.parse(content), sha: json.sha };
}

async function writeToGitHub(db, sha) {
  if (!GITHUB_TOKEN) {
    _mem = db;
    return;
  }
  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}`;
  const content = Buffer.from(JSON.stringify(db, null, 2)).toString('base64');
  const body = {
    message: `data: update revenue.json [${new Date().toISOString().slice(0, 7)}]`,
    content,
    branch: BRANCH,
    ...(sha ? { sha } : {}),
  };
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github.v3+json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub write failed: ${res.status} — ${err}`);
  }
}

// In-memory fallback (when GITHUB_TOKEN not set)
let _mem = { months: [], data: {} };

export async function getMonthData(month) {
  const { db } = await fetchFromGitHub();
  return db.data?.[month] || null;
}

export async function saveMonthData(month, data) {
  const { db, sha } = await fetchFromGitHub();
  const payload = { ...data, updatedAt: new Date().toISOString() };
  if (!db.data) db.data = {};
  if (!db.months) db.months = [];
  db.data[month] = payload;
  if (!db.months.includes(month)) {
    db.months.push(month);
    db.months.sort().reverse();
  }
  await writeToGitHub(db, sha);
  return payload;
}

export async function getAllMonths() {
  const { db } = await fetchFromGitHub();
  return db.months || [];
}

export function isKVReady() {
  return !!(GITHUB_TOKEN);
}
