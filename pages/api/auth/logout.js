export default function handler(req, res) {
  const isProduction = process.env.NODE_ENV === 'production';
  const secure = isProduction ? '; Secure' : '';
  const clear = `Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
  res.setHeader('Set-Cookie', [
    `mc_role=; ${clear}`,
    `mc_name=; ${clear}`,
  ]);
  res.status(200).json({ ok: true });
}
