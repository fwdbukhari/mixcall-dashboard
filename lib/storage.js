// In-memory fallback (data won't persist across serverless restarts — set up Vercel KV for persistence)
const mem = { months: [], data: {} };

function isKVConfigured() {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

async function getKV() {
  if (!isKVConfigured()) return null;
  const { kv } = await import('@vercel/kv');
  return kv;
}

export async function getMonthData(month) {
  const kv = await getKV();
  if (kv) return await kv.get(`mc:data:${month}`);
  return mem.data[month] || null;
}

export async function saveMonthData(month, data) {
  const payload = { ...data, updatedAt: new Date().toISOString() };
  const kv = await getKV();
  if (kv) {
    await kv.set(`mc:data:${month}`, payload);
    const months = (await kv.get('mc:months')) || [];
    if (!months.includes(month)) {
      months.push(month);
      months.sort().reverse();
      await kv.set('mc:months', months);
    }
  } else {
    mem.data[month] = payload;
    if (!mem.months.includes(month)) {
      mem.months.push(month);
      mem.months.sort().reverse();
    }
  }
  return payload;
}

export async function getAllMonths() {
  const kv = await getKV();
  if (kv) return (await kv.get('mc:months')) || [];
  return mem.months;
}

export function isKVReady() {
  return isKVConfigured();
}
