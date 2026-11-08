// 自然急 后端：零依赖，Node 18+。前端只调 /api/*，模型密钥只在服务器上。
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');

// ---------- 配置 ----------
(function loadEnv() {
  try {
    for (const line of fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/); if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch (_) {}
})();
const PORT = +process.env.PORT || 8787;
const BASE = (process.env.LLM_BASE || '').replace(/\/$/, '');
const KEY = process.env.LLM_KEY || '';
const MODEL = process.env.LLM_MODEL || 'deepseek-chat';
const VISION = process.env.VISION_MODEL || MODEL;       // 看图用的模型，默认同一个
// openai = /chat/completions；anthropic = /messages。不填时按地址和模型名猜
const PROTO = process.env.LLM_PROTOCOL || (/anthropic|claude/i.test(BASE + MODEL) ? 'anthropic' : 'openai');
const PUB = path.join(__dirname, 'public'), DBF = path.join(__dirname, 'data', 'db.json');

// ---------- 存储：一个 JSON 文件 ----------
let db = { users: {}, shares: {} };
try { db = JSON.parse(fs.readFileSync(DBF, 'utf8')); } catch (_) {}
let saveT;
function flush() {
  clearTimeout(saveT);
  try { fs.mkdirSync(path.dirname(DBF), { recursive: true }); fs.writeFileSync(DBF + '.tmp', JSON.stringify(db)); fs.renameSync(DBF + '.tmp', DBF); } catch (_) {}
}
function save() { clearTimeout(saveT); saveT = setTimeout(flush, 300); }
// 被 systemctl 停止/重启时也要把内存里的数据落盘
for (const sig of ['SIGTERM', 'SIGINT']) process.on(sig, () => { flush(); process.exit(0); });
const user = uid => (db.users[uid] ||= { nick: '', nights: [], created: Date.now() });

// ---------- 个人模型：首段睡眠时长 = a − b × 睡前饮水(ml)，每晚反馈后重新拟合（自进化） ----------
const PRIOR = { a: 460, b: 0.075 }, LA = 3, LB = 450000;
function fit(nights) {
  // 带先验的最小二乘：y = a + c·x，c = −b；夜数少时贴近先验，越多越贴近你自己
  let n = LA, sx = 0, sxx = LB, sy = LA * PRIOR.a, sxy = LB * -PRIOR.b;
  for (const g of nights) {
    if (g.y == null) continue;
    const w = g.who === 'body' ? 1 : g.who === 'flop' ? .6 : .4; // 闹钟先响/自己醒是不完整观测，权重低
    n += w; sx += w * g.ml; sxx += w * g.ml * g.ml; sy += w * g.y; sxy += w * g.ml * g.y;
  }
  const det = n * sxx - sx * sx, a = (sy * sxx - sx * sxy) / det, c = (n * sxy - sx * sy) / det;
  const last = nights[nights.length - 1];
  return {
    a: Math.round(Math.max(300, Math.min(600, a))),
    b: +Math.max(.01, Math.min(.2, -c)).toFixed(4),
    shift: last && last.who === 'flop' ? -100 : last && last.who === 'alarm' ? 50 : 0
  };
}
const gap = (from, to) => ((to - from) % 1440 + 1440) % 1440;
function stats(u) {
  const ns = u.nights, body = ns.filter(g => g.who === 'body');
  const hits = body.filter(g => Math.abs(g.err) <= 30).length;
  const last3 = body.slice(-3), worst = last3.length ? Math.max(...last3.map(g => Math.abs(g.err))) : null;
  const title = last3.length < 3 ? '校准中' : worst <= 5 ? '原子钟级' : worst <= 10 ? '瑞士机芯' : worst <= 30 ? '老座钟' : '随缘报时';
  const avgErr = body.length ? Math.round(body.reduce((s, g) => s + Math.abs(g.err), 0) / body.length) : null;
  let streak = 0; for (let i = ns.length - 1; i >= 0 && ns[i].who === 'body' && Math.abs(ns[i].err) <= 30; i--) streak++;
  return { n: ns.length, hits, body: body.length, flops: ns.filter(g => g.who === 'flop').length, avgErr, title, streak };
}

// ---------- 大模型：兼容 OpenAI Chat Completions 与 Anthropic Messages，用工具调用拿结构化 JSON ----------
const KNOWLEDGE = `你是「自然急」App 里的小水滴「小急」，说话简短、冷幽默、不说教。常识：喝水后约 40 分钟开始利尿、约 2 小时达峰；夜里抗利尿激素升高，产尿变慢；咖啡因利尿效应偏小但会影响睡眠；酒精会抑制抗利尿激素、让人夜里更容易醒。睡前 2 小时饮水上限 800 ml。不做医学判断，不推荐药物。`;
async function post(url, headers, body) {
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 30000);
  try {
    const r = await fetch(url, { method: 'POST', signal: ctl.signal, headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
    const txt = await r.text();
    if (!r.ok) { const e = new Error(`llm ${r.status} ${txt.slice(0, 200)}`); e.status = r.status; throw e; }
    return JSON.parse(txt);
  } finally { clearTimeout(t); }
}
const pickJSON = txt => { const m = String(txt || '').match(/\{[\s\S]*\}/); if (!m) throw new Error('no json'); return JSON.parse(m[0]); };
// ask({ system, text, images: [dataURL], schema, model }) → 对象
async function ask({ system, text, images = [], schema, model = MODEL, max = 400 }) {
  if (!KEY || !BASE) throw new Error('nokey');
  const name = 'submit';
  const plain = `${system}\n只输出一个 JSON 对象，字段：${JSON.stringify(schema.properties)}`;
  if (PROTO === 'anthropic') {
    const content = [...images.map(u => { const m = u.match(/^data:(image\/[\w+.-]+);base64,(.+)$/); return { type: 'image', source: { type: 'base64', media_type: m[1], data: m[2] } }; }), { type: 'text', text }];
    const call = withTools => post(BASE + '/messages', { 'x-api-key': KEY, 'anthropic-version': '2023-06-01', Authorization: 'Bearer ' + KEY }, {
      model, max_tokens: max, temperature: 0, system: withTools ? system : plain, messages: [{ role: 'user', content }],
      ...(withTools ? { tools: [{ name, description: '提交结果', input_schema: schema }], tool_choice: { type: 'tool', name } } : {})
    });
    let j; try { j = await call(true); } catch (e) { if (e.status !== 400 && e.status !== 422) throw e; j = await call(false); }
    const tool = (j.content || []).find(c => c.type === 'tool_use');
    return tool ? tool.input : pickJSON((j.content || []).map(c => c.text || '').join(''));
  }
  const content = images.length ? [{ type: 'text', text }, ...images.map(url => ({ type: 'image_url', image_url: { url } }))] : text;
  const call = withTools => post(BASE + '/chat/completions', { Authorization: 'Bearer ' + KEY }, {
    model, max_tokens: max, temperature: 0, messages: [{ role: 'system', content: withTools ? system : plain }, { role: 'user', content }],
    ...(withTools ? { tools: [{ type: 'function', function: { name, description: '提交结果', parameters: schema } }], tool_choice: { type: 'function', function: { name } } } : {})
  });
  let j; try { j = await call(true); } catch (e) { if (e.status !== 400 && e.status !== 422) throw e; j = await call(false); }
  const msg = j.choices?.[0]?.message || {}, tc = msg.tool_calls?.[0]?.function?.arguments;
  return tc ? (typeof tc === 'string' ? JSON.parse(tc) : tc) : pickJSON(msg.content);
}
const S_ITEM = { type: 'object', properties: { k: { type: 'string', enum: ['eat', 'drink', 'move'] }, name: { type: 'string', description: '中文短名' }, ml: { type: 'number', description: '饮品毫升' }, kcal: { type: 'number', description: '估算热量 kcal' }, min: { type: 'number', description: '运动分钟' }, caf: { type: 'boolean' }, alc: { type: 'boolean' } }, required: ['k', 'name'] };
const S_PHOTO = { type: 'object', properties: { ok: { type: 'boolean', description: '照片里有没有食物或饮品' }, t: { type: 'string', enum: ['eat', 'drink'] }, n: { type: 'string', description: '中文短名' }, kcal: { type: 'number' }, ml: { type: 'number' }, caf: { type: 'boolean' } }, required: ['ok', 't', 'n', 'kcal'] };
const S_NIGHT = { type: 'object', properties: { adj: { type: 'integer', description: '对预计醒来时间的修正，-20 到 20 分钟' }, note: { type: 'string', description: '不超过 40 字的一句话' } }, required: ['adj', 'note'] };
const num = (v, lo, hi, d) => { v = Number(v); return Number.isFinite(v) ? Math.max(lo, Math.min(hi, Math.round(v))) : d; };
function cleanItem(o) {
  const k = ['eat', 'drink', 'move'].includes(o.k) ? o.k : 'eat';
  const it = { k, name: String(o.name || '一餐').slice(0, 14) };
  if (k === 'drink') Object.assign(it, { ml: num(o.ml, 30, 2000, 350), kcal: num(o.kcal, 0, 2000, 0), caf: !!o.caf, alc: !!o.alc });
  if (k === 'eat') it.kcal = num(o.kcal, 0, 3000, 450);
  if (k === 'move') Object.assign(it, { min: num(o.min, 1, 600, 30), kcal: num(o.kcal, 0, 3000, 150) });
  return it;
}

// ---------- 接口 ----------
const routes = {
  'GET /api/health': async (q) => {
    const out = { ok: true, protocol: PROTO, model: MODEL, vision: VISION, key: !!KEY };
    if (q.get('ping')) { try { const o = await ask({ system: '测试', text: '提交 adj=0, note="ok"', schema: S_NIGHT, max: 60 }); out.llm = o; } catch (e) { out.llm = String(e.message); } }
    return out;
  },

  // 一句话 → 结构化记录
  'POST /api/parse': async (_, b) => {
    const text = String(b.text || '').slice(0, 120); if (!text) throw 400;
    const o = await ask({ system: KNOWLEDGE + '\n把用户的一句话解析成一条记录：吃的 k=eat，喝的 k=drink（给出 ml），运动 k=move（给出 min）。都要估算 kcal。份量不明时按国内常见份量估。', text, schema: S_ITEM });
    return cleanItem(o);
  },

  // 照片 → 识别（需要配置 VISION_MODEL）
  'POST /api/photo': async (_, b) => {
    const img = String(b.image || ''); if (!/^data:image\/[\w+.-]+;base64,/.test(img) || img.length > 2.5e6) throw 400;
    const o = await ask({ system: '识别照片里的食物或饮品，估算整份热量。饮品给出毫升和是否含咖啡因。看不出是吃喝的东西时 ok=false。', text: '这是什么？', images: [img], schema: S_PHOTO, model: VISION, max: 200 });
    if (o.ok === false) throw 422;
    return { t: o.t === 'drink' ? 'drink' : 'eat', n: String(o.n || '一餐').slice(0, 14), kcal: num(o.kcal, 0, 3000, 450), ml: num(o.ml, 30, 2000, 350), caf: !!o.caf };
  },

  // 今晚建议：个人模型给基线，大模型在 ±20 分钟内微调并写一句话
  'POST /api/night': async (_, b) => {
    const u = user(uid(b)), model = fit(u.nights), st = stats(u);
    const target = num(b.target, 300, 600, 420), ml = num(b.ml, 0, 800, 250), sleepAt = num(b.sleepAt, 0, 1439, 1410);
    const base = (sleepAt + model.a - model.b * ml) % 1440;
    const eveRaw = b.evening || {};
    const eve = { ml: num(eveRaw.ml, 0, 5000, 0), caf: !!eveRaw.caf, alc: !!eveRaw.alc };
    let adj = 0, note = '';
    try {
      const recent = u.nights.slice(-7).map(g => `${g.who === 'body' ? '身体叫醒' : g.who === 'flop' ? '半夜被叫醒' : g.who === 'alarm' ? '闹钟先响' : '自己醒'}，喝 ${g.ml}ml，误差 ${g.err ?? '-'} 分钟`).join('；') || '还没有记录';
      const o = await ask({ system: KNOWLEDGE + '\n根据用户数据，对个人模型给出的预计醒来时间做 -20 到 20 分钟的修正，再用一句不超过 40 字的话给今晚的建议。', text: `想 ${hm(target)} 醒；今晚打算睡前喝 ${ml}ml；个人模型预计 ${hm(base)} 被身体叫醒（已用 ${st.n} 晚数据校准）；傍晚后喝了 ${eve.ml || 0}ml，${eve.caf ? '有' : '没有'}咖啡因，${eve.alc ? '有' : '没有'}酒精；最近几晚：${recent}`, schema: S_NIGHT, max: 160 });
      adj = num(o.adj, -20, 20, 0); note = String(o.note || '').slice(0, 60);
    } catch (_) {}
    return { model, adj, note, n: st.n, stats: st };
  },

  // 早晨反馈：存一晚、重新拟合模型、生成对决卡和分享链接
  'POST /api/morning': async (_, b) => {
    const id = uid(b), u = user(id);
    const who = ['body', 'alarm', 'self', 'flop'].includes(b.who) ? b.who : 'self';
    const at = num(b.at, 0, 1439, 420), target = num(b.target, 300, 600, 420), ml = num(b.ml, 0, 800, 250), sleepAt = num(b.sleepAt, 0, 1439, 1410);
    const fusp = gap(sleepAt, at), pred = (sleepAt + fit(u.nights).a - fit(u.nights).b * ml) % 1440;
    const err = who === 'body' ? ((at - target + 720) % 1440 + 1440) % 1440 - 720 : null;
    // 闹钟先响：身体至少睡到了闹钟之后，记一个偏保守的观测
    const y = who === 'body' || who === 'flop' ? fusp : who === 'alarm' ? gap(sleepAt, target) + 20 : fusp + 10;
    u.nights.push({ d: new Date().toISOString().slice(0, 10), who, at, target, ml, sleepAt, err, y, pred: Math.round(pred) });
    if (u.nights.length > 200) u.nights.shift();
    const st = stats(u), n = u.nights.length;
    const card = {
      body: { l: ['身体', hm(at)], r: ['闹钟', hm(target)], h: err <= 0 ? `身体赢了 ${-err} 分钟` : `身体晚了 ${err} 分钟` },
      alarm: { l: ['闹钟', hm(target)], r: ['身体', '还在睡'], h: '这次闹钟先到' },
      self: { l: ['你自己', hm(at)], r: ['闹钟', hm(target)], h: '身体和闹钟都输给了你' },
      flop: { l: ['身体', hm(at)], r: ['目标', hm(target)], h: '身体今天加班了', flop: true }
    }[who];
    card.p = who === 'flop' ? `提前 ${dur(gap(at, target))} 报时。下一晚建议水量自动少 100 ml。` : `第 ${n} 夜 · 命中 ${st.hits} 次 · 称号「${st.title}」`;
    const sid = crypto.randomBytes(5).toString('hex');
    db.shares[sid] = { nick: u.nick || '匿名', n, card, t: Date.now() };
    save();
    flush();
    return { card, n, stats: st, model: fit(u.nights), share: { id: sid, text: `自然急 · 第 ${n} 夜｜${card.l[0]} ${card.l[1]} vs ${card.r[0]} ${card.r[1]}，${card.h}。` } };
  },

  'GET /api/me': async (q) => { const u = user(uid({ uid: q.get('uid') })); return { nick: u.nick, nights: u.nights.slice(-21), stats: stats(u), model: fit(u.nights) }; },

  'POST /api/nick': async (_, b) => { const u = user(uid(b)); u.nick = String(b.nick || '').replace(/[<>&"'\s]/g, '').slice(0, 12); save(); return { nick: u.nick }; },

  // 排行榜：命中次数优先，其次平均误差
  'GET /api/board': async (q) => {
    const me = q.get('uid');
    const list = Object.entries(db.users).filter(([, u]) => u.nights.length).map(([id, u]) => ({ nick: u.nick || '匿名水滴', ...stats(u), me: id === me }))
      .sort((x, y) => y.hits - x.hits || (x.avgErr ?? 999) - (y.avgErr ?? 999)).slice(0, 20)
      .map(({ nick, hits, n, avgErr, title, streak, me }) => ({ nick, hits, n, avgErr, title, streak, me }));
    return { list, total: Object.values(db.users).filter(u => u.nights.length).length };
  }
};
function uid(b) { const v = String(b.uid || ''); if (!/^[a-f0-9]{16,32}$/.test(v)) throw 400; return v; }
const pad = n => String(n).padStart(2, '0');
const hm = m => { m = ((Math.round(m) % 1440) + 1440) % 1440; return pad(Math.floor(m / 60)) + ':' + pad(m % 60); };
const dur = m => { const h = Math.floor(m / 60), r = Math.round(m % 60); return h ? `${h} 小时 ${r} 分` : `${r} 分钟`; };
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---------- 分享页 ----------
function sharePage(s) {
  const c = s.card, title = `${s.nick} 的第 ${s.n} 夜：${c.h}`;
  return `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="睡前一杯水，明早身体比闹钟先叫醒你。自然急。">
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:linear-gradient(180deg,#E9C9B2,#ECE7DF);font-family:"PingFang SC","Noto Sans SC",system-ui,sans-serif;color:#1A1917}
.w{width:min(360px,92vw);display:flex;flex-direction:column;gap:16px}.d{border-radius:32px;padding:24px;background:${c.flop ? '#3A2D2A' : '#1D1C1A'};color:#F3EFE8}
.b{font-size:12px;letter-spacing:.3em;opacity:.6}.s{display:flex;justify-content:space-between;align-items:end;margin:24px 0 14px}.s span{display:block;font-size:12px;opacity:.6}
.s b{font:300 42px/1 "Jost","Avenir Next",system-ui;letter-spacing:.01em}h1{font-size:22px;font-weight:500;margin:0}p{font-size:13px;opacity:.65;margin:6px 0 0}
a{display:block;text-align:center;padding:16px;border-radius:99px;background:#1D1C1A;color:#F3EFE8;text-decoration:none;letter-spacing:.1em}</style></head>
<body><div class="w"><div class="d"><div class="b">自然急 · ${esc(s.nick)} · 第 ${s.n} 夜</div><div class="s"><div><span>${esc(c.l[0])}</span><b>${esc(c.l[1])}</b></div><div style="text-align:right"><span>${esc(c.r[0])}</span><b>${esc(c.r[1])}</b></div></div><h1>${esc(c.h)}</h1><p>${esc(c.p)}</p></div>
<a href="/">我也要试试：睡前一杯水，看身体能不能比闹钟先叫醒你</a></div></body></html>`;
}

// ---------- 限流 + 同源检查 ----------
const hits = new Map();
function limited(ip, cost) {
  const now = Date.now(), h = hits.get(ip) || { t: now, n: 0 };
  if (now - h.t > 60000) { h.t = now; h.n = 0; }
  h.n += cost; hits.set(ip, h);
  // 防止大量不同 IP 把限流表撑大（内存上限只有 256M）
  if (hits.size > 5000) { for (const [k, v] of hits) if (now - v.t > 120000) hits.delete(k); if (hits.size > 20000) hits.clear(); }
  return h.n > 60;
}
const AI_COST = { '/api/parse': 3, '/api/photo': 6, '/api/night': 2 };

// ---------- 服务 ----------
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.gif': 'image/gif', '.json': 'application/json', '.webmanifest': 'application/manifest+json' };
http.createServer(async (req, res) => {
  const send = (code, body, type = 'application/json; charset=utf-8', cache = 'no-store') => {
    if (res.headersSent) { try { res.end(); } catch (_) {} return; }
    res.writeHead(code, { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': cache });
    res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
  };
  try {
    const url = new URL(req.url, 'http://x'), ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();

    if (url.pathname.startsWith('/s/')) {
      const id = url.pathname.slice(3);
      const s = /^[0-9a-f]{10}$/.test(id) && Object.prototype.hasOwnProperty.call(db.shares, id) ? db.shares[id] : null;
      return s ? send(200, sharePage(s), 'text/html; charset=utf-8') : send(404, '分享已过期', 'text/plain; charset=utf-8');
    }

    if (url.pathname.startsWith('/api/')) {
      // 只接受同源页面的写请求，别人的网页拿不到这个接口
      const origin = req.headers.origin;
      if (req.method === 'POST' && origin) {
        let oh = ''; try { oh = new URL(origin).host; } catch (_) {}
        if (oh !== req.headers.host) return send(403, { error: 'forbidden' });
      }
      if (limited(ip, AI_COST[url.pathname] || 1)) return send(429, { error: '太快了，歇一会儿' });
      const fn = routes[req.method + ' ' + url.pathname]; if (!fn) return send(404, { error: 'not found' });
      let body = {};
      if (req.method === 'POST') {
        let raw = '';
        for await (const chunk of req) { raw += chunk; if (raw.length > 3e6) return send(413, { error: 'too large' }); }
        try { body = JSON.parse(raw || '{}'); } catch (_) { return send(400, { error: 'bad json' }); }
      }
      try { return send(200, await fn(url.searchParams, body)); }
      catch (e) {
        if (typeof e === 'number') return send(e, { error: e === 422 ? 'not food' : 'bad request' });
        console.error(url.pathname, e.message); return send(e.message === 'nokey' ? 503 : 502, { error: 'ai unavailable' });
      }
    }

    // 静态文件
    let p; try { p = path.normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, ''); } catch (_) { return send(400, 'bad request', 'text/plain'); }
    if (p === '/' || p === '\\') p = '/index.html';
    const file = path.join(PUB, p);
    if (file !== PUB && !file.startsWith(PUB + path.sep)) return send(403, 'forbidden', 'text/plain');
    const ext = path.extname(file);
    // 图片/脚本可以缓存，html 保持及时更新
    const cache = ext === '.html' ? 'no-store' : 'public, max-age=86400';
    fs.readFile(file, (err, data) => err ? send(404, 'not found', 'text/plain') : send(200, data, TYPES[ext] || 'application/octet-stream', cache));
  } catch (e) {
    // 单个坏请求不能把进程带崩（Node 15+ 未捕获的 rejection 会直接退出）
    console.error('handler', e && e.message);
    send(500, { error: 'server error' });
  }
}).listen(PORT, () => console.log(`自然急 → http://localhost:${PORT}  ${KEY ? `${PROTO} · ${MODEL} · 看图 ${VISION}` : '没有配置 LLM_KEY，AI 功能会提示不可用'}`));
