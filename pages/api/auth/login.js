export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { password } = req.body || {};
  const AP = process.env.ADMIN_PASSWORD;
  const PP = process.env.PARTNER_PASSWORD;

  if (!AP || !PP) {
    return res.status(503).json({
      error: 'Passwords not configured. Please set ADMIN_PASSWORD and PARTNER_PASSWORD in Vercel Environment Variables.',
    });
  }

  let role = null;
  if (password === AP) role = 'admin';
  else if (password === PP) role = 'partner';

  if (!role) return res.status(401).json({ error: 'Incorrect password. Please try again.' });

  const maxAge = 7 * 24 * 60 * 60; // 7 days
  res.setHeader('Set-Cookie', `mc_role=${role}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}`);
  return res.status(200).json({ role });
}
