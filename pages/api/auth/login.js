/**
 * Login API
 * 
 * Supports:
 *  - Admin:   ADMIN_PASSWORD env var
 *  - Viewers: ZAHID_PASSWORD, PARTNER_PASSWORD (legacy)
 *             VIEWER_USERS env var for multiple viewers
 *             Format: "Name1:Password1,Name2:Password2"
 *             Example: "Zahid:Zahid@25pct,John:John@123"
 */

function getViewers() {
  const viewers = [];

  // Legacy single partner support
  const legacy = process.env.PARTNER_PASSWORD || process.env.ZAHID_PASSWORD;
  if (legacy) viewers.push({ name: 'partner', password: legacy });

  // Multi-viewer support via VIEWER_USERS
  const raw = process.env.VIEWER_USERS || '';
  if (raw) {
    raw.split(',').forEach(entry => {
      const colonIdx = entry.indexOf(':');
      if (colonIdx > 0) {
        const name = entry.slice(0, colonIdx).trim().toLowerCase().replace(/\s+/g, '_');
        const password = entry.slice(colonIdx + 1).trim();
        if (name && password && !viewers.find(v => v.password === password)) {
          viewers.push({ name, password });
        }
      }
    });
  }
  return viewers;
}

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { password } = req.body || {};
  const AP = process.env.ADMIN_PASSWORD;
  const viewers = getViewers();

  if (!AP) {
    return res.status(503).json({
      error: 'Dashboard not configured. Please set ADMIN_PASSWORD in Vercel Environment Variables.',
    });
  }

  const maxAge = 7 * 24 * 60 * 60;

  if (password === AP) {
    const adminName = process.env.ADMIN_NAME || 'Fawad';
    res.setHeader('Set-Cookie', [
      `mc_role=admin; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}`,
      `mc_name=${encodeURIComponent(adminName)}; Path=/; SameSite=Strict; Max-Age=${maxAge}`,
    ]);
    return res.status(200).json({ role: 'admin' });
  }

  const viewer = viewers.find(v => v.password === password);
  if (viewer) {
    res.setHeader('Set-Cookie', [
      `mc_role=partner; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}`,
      `mc_name=${encodeURIComponent(viewer.name)}; Path=/; SameSite=Strict; Max-Age=${maxAge}`,
    ]);
    return res.status(200).json({ role: 'partner', name: viewer.name });
  }

  return res.status(401).json({ error: 'Incorrect password. Please try again.' });
}
