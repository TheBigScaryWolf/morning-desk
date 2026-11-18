// Shared helpers for the VC pages (vcs.html, vc.html).
window.VC = (() => {
  const $ = (id) => document.getElementById(id);
  const el = (tag, attrs = {}, ...kids) => { const n = document.createElement(tag); for (const [k, v] of Object.entries(attrs)) { if (v == null) continue; if (k === 'class') n.className = v; else if (k === 'text') n.textContent = v; else if (k.startsWith('on')) n.addEventListener(k.slice(2), v); else n.setAttribute(k, v); } for (const k of kids) if (k != null && k !== false) n.append(k.nodeType ? k : document.createTextNode(k)); return n; };
  const usd = (v) => { if (v == null || !isFinite(v)) return '—'; const a = Math.abs(v); if (a >= 1e9) return '$' + (a / 1e9).toFixed(a >= 1e10 ? 1 : 2) + 'B'; if (a >= 1e6) return '$' + (a / 1e6).toFixed(a >= 1e8 ? 0 : 1) + 'M'; if (a >= 1e3) return '$' + (a / 1e3).toFixed(0) + 'K'; return '$' + a.toFixed(0); };
  const link = (url, text, cls = 'lnk') => url ? el('a', { href: url, target: '_blank', rel: 'noopener', class: cls, text }) : el('span', { text });
  let tip;
  const showTip = (x, y, lines) => { tip ||= document.body.appendChild(el('div', { id: 'tip' })); tip.replaceChildren(...lines.map(l => el('div', { text: l }))); tip.style.display = 'block'; const r = tip.getBoundingClientRect(); let L = x + 14, T = y - r.height - 10; if (L + r.width > innerWidth - 6) L = x - r.width - 14; if (T < 6) T = y + 16; tip.style.left = L + 'px'; tip.style.top = T + 'px'; };
  const hideTip = () => tip && (tip.style.display = 'none');

  // Simple bar chart: pts = [{label, v, v2?, tip:[...]}]. v2 (optional) is drawn as a darker overlay from the baseline.
  function bars(host, pts, { height = 200, fmt = (v) => v, labelEvery } = {}) {
    host.replaceChildren(); if (!pts.length) return;
    const ns = 'http://www.w3.org/2000/svg', W = host.clientWidth || 600, H = height, pl = 4, pr = 48, pt = 8, pb = 18;
    const max = Math.max(...pts.map(p => p.v), 1), bw = (W - pl - pr) / pts.length, Y = (v) => pt + (1 - v / max) * (H - pt - pb);
    const svg = document.createElementNS(ns, 'svg'); svg.setAttribute('width', W); svg.setAttribute('height', H);
    const mk = (t, a) => { const n = document.createElementNS(ns, t); for (const k in a) n.setAttribute(k, a[k]); return n; };
    for (const v of [max, max / 2]) { svg.append(mk('line', { x1: pl, x2: W - pr, y1: Y(v), y2: Y(v), stroke: '#2e2e2b' })); const t = mk('text', { x: W - pr + 6, y: Y(v) + 4 }); t.textContent = fmt(v); svg.append(t); }
    const gap = Math.min(2, bw * .25);
    pts.forEach((p, i) => { const x = pl + i * bw;
      svg.append(mk('rect', { x: x + gap / 2, width: Math.max(1, bw - gap), y: Y(p.v), height: Math.max(0, H - pb - Y(p.v)), rx: Math.min(3, bw / 4), fill: 'var(--series-1)', opacity: p.v2 != null ? .45 : .85 }));
      if (p.v2) svg.append(mk('rect', { x: x + gap / 2, width: Math.max(1, bw - gap), y: Y(p.v2), height: Math.max(0, H - pb - Y(p.v2)), rx: Math.min(3, bw / 4), fill: 'var(--series-1)' }));
      const hit = mk('rect', { x, width: bw, y: 0, height: H, fill: 'transparent' });
      hit.addEventListener('mousemove', (e) => showTip(e.clientX, e.clientY, p.tip || [p.label, fmt(p.v)])); hit.addEventListener('mouseleave', hideTip); svg.append(hit); });
    const every = labelEvery || Math.max(1, Math.ceil(pts.length / 6));
    pts.forEach((p, i) => { if (i % every && i !== pts.length - 1) return; if (i !== pts.length - 1 && pts.length - 1 - i < every / 2) return; const t = mk('text', { x: Math.min(pl + i * bw + bw / 2, W - pr - 30), y: H - 4, 'text-anchor': 'middle' }); t.textContent = p.label; svg.append(t); });
    host.append(svg);
  }

  async function load() {
    const [h, d] = await Promise.all([fetch('funding-history.json').then(r => r.json()), fetch('vc-data.json?t=' + Date.now()).then(r => r.json())]);
    const A = d.aliases || {}; const canon = (n) => A[n] || n;
    const rows = h.rows.map(x => { const L = [...new Set(x.l.map(canon))]; const O = [...new Set(x.o.map(canon))].filter(n => !L.includes(n)); return { ...x, t: Date.parse(x.d + 'T00:00:00Z'), L, O }; });
    TYPES = d.types || {};
    return { rows, data: d, canon, meta: h.meta };
  }
  // Investor type: 'angel' (individual), 'corp' (corporate / exchange / ecosystem / market maker) or 'fund'.
  const ORG = /(capital|ventures?|\blabs?\b|fund|partners|\bvc\b|dao|group|holdings|digital|network|foundation|protocol|finance|exchange|research|investments?|management|asset|global|crypto|coin|chain|block|systems|studio|combinator|accelerator|incubator|wallet|bank|\binc\b|llc|ltd|technolog|securities|markets?|trading|associates|collective|catalyst|perkins|commons|works|street|prime|angels?\b|velocity|peak|investimentos|mellon|rollup|neutral|investors?|holding|fintech|dragon|lightspeed|faction|draper|advisors?|equity|office|syndicate|club|house|hub|alpha|quant|ventur|limited|company|corp|enterprises?|incubat|launchpad|pad\b|guild|games?|gaming|media|dao|ai\b|tech\b|pay\b|x\b|one\b|interactive|emergent|alliance|financial|hippeau|classic|entrepreneur|gifford|point nine|cartel|colab|facilities|starting line|scend|wace|seven seven six|chapter one|hard yaka|the lao|flow traders|brevan|sequoia|accel|tether|circle|ripple|a16z|andreessen|y combinator)/i;
  const CORP = /(binance|coinbase|okx|kucoin|bybit|\bgate\b|huobi|\bhtx\b|bitget|mexc|crypto\.com|kraken|robinhood|tether|circle|ripple|paypal|visa|mastercard|google|samsung|sony|nasdaq|animoca|foundation|consensys|yzi labs|polygon|solana|aptos|\bsui\b|avalanche|ava labs|protocol labs|mask network|\bgsr\b|wintermute|amber group|dwf labs|jump crypto|jump trading|flow traders|jane street|galaxy digital|\bdcg\b|mellon|fidelity|franklin|blackrock|alameda|ftx|bitmain|tencent|alibaba|softbank|microsoft|nvidia|goldman|jpmorgan|citi|deutsche|standard chartered|bnb chain|near\b|ton\b|tron|ethereum|arbitrum|optimism|starknet|celo|cosmos|hedera|algorand|stellar|cardano|polkadot)/i;
  const PERSON = /^[A-Z][a-z][a-zA-Z.'’-]*( (de|van|von|da|del|le|la|[A-Z][a-z][a-zA-Z.'’-]*|[A-Z]\.)){1,3}$/;
  let TYPES = {};
  const typeOf = (n) => TYPES[n] || (CORP.test(n) ? 'corp' : (!ORG.test(n) && PERSON.test(n)) ? 'angel' : 'fund');
  const TYPE_LABEL = { fund: 'VC / fund', angel: 'Angel', corp: 'Corporate / exchange / ecosystem' };
  const q = (t) => { const d = new Date(t); return d.getUTCFullYear() + ' Q' + (Math.floor(d.getUTCMonth() / 3) + 1); };
  return { $, el, usd, link, bars, load, showTip, hideTip, q, typeOf, TYPE_LABEL };
})();
