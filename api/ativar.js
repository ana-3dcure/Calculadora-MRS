/* Ativação dos códigos de acesso da Calculadora MRS.
   POST /api/ativar  { codigo, aparelho, acao: 'ativar' | 'conferir' }

   - Confere se o código existe, não foi cancelado e está dentro da validade.
   - Cada código vale em até LIMITE aparelhos (guardado no Redis da Vercel/Upstash).
   - 'conferir' é a checagem silenciosa que o app faz ao abrir: não ocupa aparelho novo. */
const crypto = require('crypto');
const { SAL, VALIDADE, REVOGADOS, CODIGOS } = require('./_codigos');

const LIMITE = 3;              // iPhone conta 2: Safari e app instalado guardam dados separados
const TENTATIVAS_HORA = 30;    // por IP, para impedir adivinhação
/* vale até o fim do dia 01/12/2027, horário de Brasília */
const FIM = new Date(VALIDADE + 'T23:59:59-03:00').getTime();

function redisCfg(){
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ''), token } : null;
}
async function redis(cfg, comandos){
  const r = await fetch(cfg.url + '/pipeline', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + cfg.token, 'Content-Type': 'application/json' },
    body: JSON.stringify(comandos)
  });
  if (!r.ok) throw new Error('redis ' + r.status);
  const out = await r.json();
  return out.map(x => { if (x.error) throw new Error(x.error); return x.result; });
}

function normaliza(c){
  c = String(c || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
  if (c.length === 13 && c.indexOf('MRS') === 0) c = c.slice(3);
  return c;
}
function numeroDoCodigo(c){
  if (c.length !== 10) return 0;
  const h = crypto.scryptSync(c, SAL, 32, { N: 16384, r: 8, p: 1 }).toString('hex');
  const i = CODIGOS.indexOf(h);
  return i < 0 ? 0 : i + 1;
}

module.exports = async function handler(req, res){
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ ok: false, erro: 'metodo' });

  const cfg = redisCfg();
  if (!cfg) return res.status(503).json({ ok: false, erro: 'servidor' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};
  const aparelho = String(body.aparelho || '').slice(0, 64);
  const acao = body.acao === 'conferir' ? 'conferir' : 'ativar';
  if (!/^[0-9a-zA-Z-]{8,64}$/.test(aparelho)) return res.status(400).json({ ok: false, erro: 'aparelho' });

  try {
    const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'sem-ip';
    const [tent] = await redis(cfg, [['INCR', 'tent:' + ip], ['EXPIRE', 'tent:' + ip, '3600', 'NX']]);
    if (tent > TENTATIVAS_HORA) return res.status(429).json({ ok: false, erro: 'tentativas' });

    const n = numeroDoCodigo(normaliza(body.codigo));
    if (!n) return res.status(404).json({ ok: false, erro: 'invalido' });
    if (REVOGADOS.indexOf(n) > -1) return res.status(403).json({ ok: false, erro: 'cancelado' });
    if (Date.now() > FIM) return res.status(410).json({ ok: false, erro: 'expirado' });

    const chave = 'atv:' + n;
    const [jaTem, total] = await redis(cfg, [['SISMEMBER', chave, aparelho], ['SCARD', chave]]);
    if (!jaTem) {
      if (acao === 'conferir') return res.status(403).json({ ok: false, erro: 'nao_ativado' });
      if (total >= LIMITE) return res.status(409).json({ ok: false, erro: 'limite', limite: LIMITE });
      await redis(cfg, [['SADD', chave, aparelho], ['HSETNX', 'info:' + n, 'primeira', new Date().toISOString()]]);
    }
    /* depois de um acerto, zera o contador de tentativas deste IP */
    await redis(cfg, [['DEL', 'tent:' + ip]]);
    return res.status(200).json({ ok: true, validade: VALIDADE });
  } catch (e) {
    console.error('ativar:', e.message);
    return res.status(500).json({ ok: false, erro: 'servidor' });
  }
};
