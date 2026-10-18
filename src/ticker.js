// Market ticker: major indices, rates, commodities, currencies and crypto.
// Quotes come from Yahoo Finance's public chart endpoint (crypto included), cached at the edge for 5 minutes.

const MARKETS = [
  ["^GSPC", "S&P 500"], ["^DJI", "Dow"], ["^IXIC", "Nasdaq"], ["^RUT", "Russell 2000"], ["^VIX", "VIX"],
  ["^TNX", "10-Yr Yield", "yield"], ["CL=F", "WTI Crude"], ["BZ=F", "Brent"], ["GC=F", "Gold"], ["SI=F", "Silver"],
  ["NG=F", "Nat Gas"], ["DX-Y.NYB", "Dollar Index"], ["EURUSD=X", "EUR/USD", "fx"], ["JPY=X", "USD/JPY", "fx"],
  ["^FTSE", "FTSE 100"], ["^GDAXI", "DAX"], ["^N225", "Nikkei"], ["^HSI", "Hang Seng"],
];
const COINS = [
  ["BTC-USD", "Bitcoin", "crypto"], ["ETH-USD", "Ether", "crypto"], ["SOL-USD", "Solana", "crypto"], ["XRP-USD", "XRP", "crypto"],
  ["BNB-USD", "BNB", "crypto"], ["DOGE-USD", "Dogecoin", "crypto"], ["ADA-USD", "Cardano", "crypto"],
];
const UA = { "user-agent": "Mozilla/5.0 (compatible; DaltonDaily/1.0; +https://www.daltondaily.com)" };

async function yahoo([symbol, name, kind]) {
  const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=5d&interval=1d`, { headers: UA });
  if (!r.ok) return null;
  const res = (await r.json())?.chart?.result?.[0];
  const m = res?.meta;
  const price = m?.regularMarketPrice;
  // Day change: against the prior session's close (the second-to-last daily close in the window).
  const closes = (res?.indicators?.quote?.[0]?.close || []).filter((c) => c != null);
  const lastBar = closes[closes.length - 1];
  const prev = closes.length >= 2
    ? (Math.abs(lastBar - price) / price < 0.02 ? closes[closes.length - 2] : lastBar)
    : m?.previousClose ?? m?.chartPreviousClose;
  if (price == null || !prev) return null;
  return { name, price, change: ((price - prev) / prev) * 100, kind: kind || "index" };
}

async function build() {
  const settled = await Promise.allSettled([...MARKETS, ...COINS].map(yahoo));
  const quotes = [];
  for (const s of settled) {
    if (s.status !== "fulfilled" || !s.value) continue;
    Array.isArray(s.value) ? quotes.push(...s.value) : quotes.push(s.value);
  }
  return { asOf: new Date().toISOString(), quotes };
}

export async function ticker(ctx) {
  const cache = caches.default;
  const key = new Request("https://ticker.daltondaily.internal/v2");
  const hit = await cache.match(key);
  if (hit) return hit;
  const data = await build();
  const res = new Response(JSON.stringify(data), {
    headers: { "content-type": "application/json", "cache-control": `public, max-age=${data.quotes.length ? 300 : 30}` },
  });
  ctx.waitUntil(cache.put(key, res.clone()));
  return res;
}
