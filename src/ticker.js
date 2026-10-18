// Market ticker: major indices, rates, commodities, currencies and crypto.
// Quotes come from Yahoo Finance's public chart endpoint and CoinGecko, cached at the edge for 5 minutes.

const MARKETS = [
  ["^GSPC", "S&P 500"], ["^DJI", "Dow"], ["^IXIC", "Nasdaq"], ["^RUT", "Russell 2000"], ["^VIX", "VIX"],
  ["^TNX", "10-Yr Yield", "yield"], ["CL=F", "WTI Crude"], ["BZ=F", "Brent"], ["GC=F", "Gold"], ["SI=F", "Silver"],
  ["NG=F", "Nat Gas"], ["DX-Y.NYB", "Dollar Index"], ["EURUSD=X", "EUR/USD", "fx"], ["JPY=X", "USD/JPY", "fx"],
  ["^FTSE", "FTSE 100"], ["^GDAXI", "DAX"], ["^N225", "Nikkei"], ["^HSI", "Hang Seng"],
];
const COINS = [
  ["bitcoin", "Bitcoin"], ["ethereum", "Ether"], ["solana", "Solana"], ["ripple", "XRP"],
  ["binancecoin", "BNB"], ["dogecoin", "Dogecoin"], ["cardano", "Cardano"],
];
const UA = { "user-agent": "Mozilla/5.0 (compatible; DaltonDaily/1.0; +https://www.daltondaily.com)" };

async function yahoo([symbol, name, kind]) {
  const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=5d&interval=1d`, { headers: UA });
  if (!r.ok) return null;
  const m = (await r.json())?.chart?.result?.[0]?.meta;
  const price = m?.regularMarketPrice;
  const prev = m?.chartPreviousClose ?? m?.previousClose;
  if (price == null || !prev) return null;
  return { name, price, change: ((price - prev) / prev) * 100, kind: kind || "index" };
}

async function coins() {
  const ids = COINS.map((c) => c[0]).join(",");
  const r = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`, { headers: UA });
  if (!r.ok) return [];
  const j = await r.json();
  return COINS.filter(([id]) => j[id]?.usd != null).map(([id, name]) => ({ name, price: j[id].usd, change: j[id].usd_24h_change || 0, kind: "crypto" }));
}

async function build() {
  const settled = await Promise.allSettled([...MARKETS.map(yahoo), coins()]);
  const quotes = [];
  for (const s of settled) {
    if (s.status !== "fulfilled" || !s.value) continue;
    Array.isArray(s.value) ? quotes.push(...s.value) : quotes.push(s.value);
  }
  return { asOf: new Date().toISOString(), quotes };
}

export async function ticker(ctx) {
  const cache = caches.default;
  const key = new Request("https://ticker.daltondaily.internal/v1");
  const hit = await cache.match(key);
  if (hit) return hit;
  const data = await build();
  const res = new Response(JSON.stringify(data), {
    headers: { "content-type": "application/json", "cache-control": `public, max-age=${data.quotes.length ? 300 : 30}` },
  });
  ctx.waitUntil(cache.put(key, res.clone()));
  return res;
}
