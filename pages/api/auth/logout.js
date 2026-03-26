export default function handler(req, res) {
  const isProduction = process.env.NODE_ENV === 'production';
  const secure = isProduction ? '; Secure' : '';
  res.setHeader('Set-Cookie', [
    `mc_role=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`,
    `mc_name=; Path=/; SameSite=Lax; Max-Age=0${secure}`,
  ]);
  res.status(200).json({ ok: true });
}
