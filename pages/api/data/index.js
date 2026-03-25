import { getAllMonths } from '../../../lib/storage';

export default async function handler(req, res) {
  const role = req.cookies.mc_role;
  if (!role) return res.status(401).json({ error: 'Unauthorized' });
  if (req.method !== 'GET') return res.status(405).end();
  try {
    const months = await getAllMonths();
    return res.status(200).json({ months });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
