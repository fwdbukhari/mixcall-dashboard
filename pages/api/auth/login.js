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
  if (process.env.ZAHID_PASSWORD) viewers.push({ name: 'Zahid', password: process.env.ZAHID_PASSWORD });
  else if (process.env.PARTNER_PASSWORD) viewers.push({ name: 'Partner', password: process.env.PARTNER_PASSWORD });

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

  const isProduction = process.env.NODE_ENV === 'production';
  const secure = isProduction ? '; Secure' : '';
  const maxAge = 7 * 24 * 60 * 60;

  // mc_role: HttpOnly (only needed server-side by middleware)
  const roleCookie = (val) => `mc_role=${val}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
  // mc_name: NO HttpOnly — must be readable by JavaScript in the browser
  const nameCookie = (val) => `mc_name=${encodeURIComponent(val)}; Path=/; SameSite=Lax; Max-Age=${maxAge}${secure}`;

  if (password === AP) {
    const adminName = process.env.ADMIN_NAME || 'Fawad';
    res.setHeader('Set-Cookie', [roleCookie('admin'), nameCookie(adminName)]);
    return res.status(200).json({ role: 'admin' });
  }

  const viewer = viewers.find(v => v.password === password);
  if (viewer) {
    res.setHeader('Set-Cookie', [roleCookie('partner'), nameCookie(viewer.name)]);
    return res.status(200).json({ role: 'partner', name: viewer.name });
  }

  return res.status(401).json({ error: 'Incorrect password. Please try again.' });
}
