export default function handler(req, res) {
  res.setHeader('Set-Cookie', 'mc_role=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0');
  res.status(200).json({ ok: true });
}
