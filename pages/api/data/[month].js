import { getMonthData, saveMonthData, isKVReady } from '../../../lib/storage';

export default async function handler(req, res) {
  const role = req.cookies.mc_role;
  if (!role) return res.status(401).json({ error: 'Unauthorized' });

  const { month } = req.query;
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: 'Invalid month format. Use YYYY-MM.' });
  }

  if (req.method === 'GET') {
    const data = await getMonthData(month);
    return res.status(200).json({ data, kvReady: isKVReady() });
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    if (role !== 'admin') return res.status(403).json({ error: 'Only admin can save data.' });
    const saved = await saveMonthData(month, req.body);
    return res.status(200).json({ data: saved, kvReady: isKVReady() });
  }

  return res.status(405).end();
}
