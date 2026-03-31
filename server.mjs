import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const LICENSE_API = (process.env.LICENSE_API_URL || 'http://127.0.0.1:5050').replace(/\/$/, '');
const SECRET = (process.env.LICENSE_ADMIN_SECRET || '').trim();
const PORT = Number(process.env.ISSUER_SERVER_PORT || 5180);

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '64kb' }));

app.post('/license/create', async (req, res) => {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (SECRET) headers.Authorization = `Bearer ${SECRET}`;
    const r = await fetch(`${LICENSE_API}/license/create`, {
      method: 'POST',
      headers,
      body: JSON.stringify(req.body ?? {})
    });
    const text = await r.text();
    let j;
    try {
      j = JSON.parse(text);
    } catch {
      j = { ok: false, error: 'invalid_json', message: text.slice(0, 200) };
    }
    res.status(r.status).json(j);
  } catch (e) {
    console.error('[license issuer proxy]', e);
    res.status(502).json({ ok: false, error: 'proxy_error', message: 'Cannot reach license API.' });
  }
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`License issuer proxy → ${LICENSE_API} (http://127.0.0.1:${PORT})`);
});
