// Uses @upstash/redis for persistent KV storage
// Env vars KV_REST_API_URL and KV_REST_API_TOKEN are auto-set by Vercel when you connect Upstash

const mem = { months: [], data: {} };

function isRedisConfigured() {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

async function getRedis() {
  if (!isRedisConfigured()) return null;
  const { Redis } = await import('@upstash/redis');
  return new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
  });
}

export async function getMonthData(month) {
  const redis = await getRedis();
  if (redis) return await redis.get(`mc:data:${month}`);
  return mem.data[month] || null;
}

export async function saveMonthData(month, data) {
  const payload = { ...data, updatedAt: new Date().toISOString() };
  const redis = await getRedis();
  if (redis) {
    await redis.set(`mc:data:${month}`, JSON.stringify(payload));
    const raw = await redis.get('mc:months');
    const months = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : [];
    if (!months.includes(month)) {
      months.push(month);
      months.sort().reverse();
      await redis.set('mc:months', JSON.stringify(months));
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
  const redis = await getRedis();
  if (redis) {
    const raw = await redis.get('mc:months');
    if (!raw) return [];
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  }
  return mem.months;
}

export function isKVReady() {
  return isRedisConfigured();
}
