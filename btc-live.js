// Live BTC/USDT from Binance (same feed as the Binance app) — shows the price in the browser tab title.
(() => {
  const base = document.title.replace(/^[\d,.]+ \| BTCUSDT · /, '');
  const fmt = (v) => v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const URLS = ['wss://stream.binance.com:9443/ws/btcusdt@miniTicker', 'wss://data-stream.binance.vision/ws/btcusdt@miniTicker'];
  let i = 0, last = 0, ws;
  function connect() {
    try { ws = new WebSocket(URLS[i % URLS.length]); } catch (e) { i++; return setTimeout(connect, 3000); }
    ws.onmessage = (e) => {
      const m = JSON.parse(e.data), c = +m.c, o = +m.o; if (!c) return;
      window.__btcLive = { price: c, ch24: (c / o - 1) * 100, at: Date.now() };
      const now = Date.now(); if (now - last < 1000) return; last = now;
      document.title = fmt(c) + ' | BTCUSDT · ' + base;
      const el = document.getElementById('btc-price'); if (el) el.textContent = '$' + fmt(c);
      const ch = document.getElementById('btc-24h');
      if (ch && typeof window.__pctEl === 'function') ch.replaceChildren(window.__pctEl(window.__btcLive.ch24, 2), ' 24h');
    };
    ws.onclose = () => { i++; setTimeout(connect, 3000); };
    ws.onerror = () => { try { ws.close(); } catch (e) {} };
  }
  connect();
})();
