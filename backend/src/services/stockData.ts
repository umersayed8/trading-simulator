import { validationResult } from 'express-validator';
/* =========================================================
   Indian Stock Market Service – indianapi.in
   ========================================================= */

// NOTE: dotenv is loaded in index.ts BEFORE this module is imported.
// We read the key lazily inside getApiKey() so it is always resolved at
// call-time, never at module-load time (avoids ESM hoisting issues).

const BASE_URL = 'https://stock.indianapi.in';

/** Reads INDIAN_API_KEY at call-time – guarantees dotenv has already run */
function getApiKey(): string {
  const key = process.env.INDIAN_API_KEY;
  if (!key || key === 'your_indianapi_key_here' || key.trim() === '') {
    throw new Error(
      '[stockData] INDIAN_API_KEY is not configured. ' +
      'Open backend/.env and set: INDIAN_API_KEY=<your key from indianapi.in>'
    );
  }
  return key.trim();
}

async function apiFetch(path: string): Promise<any> {
  const url = `${BASE_URL}${path}`;
  const res  = await fetch(url, {
    headers: { 'X-Api-Key': getApiKey(), 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error(
        `[stockData] 401 Unauthorized – your INDIAN_API_KEY in backend/.env is ` +
        `missing or invalid. Get a key at https://indianapi.in  (path: ${path})`
      );
    }
    throw new Error(`indianapi.in responded ${res.status} for ${path}`);
  }
  return res.json();
}

// ─── CACHE (5 minutes) ───────────────────────────────────────────────────────

const CACHE_TTL = 1000 * 60 * 5;
const quoteCache   = new Map<string, { data: StockQuote;     timestamp: number }>();
const historyCache = new Map<string, { data: StockHistory[]; timestamp: number }>();

// ─── INTERFACES ──────────────────────────────────────────────────────────────

export interface StockQuote {
  symbol: string; name: string; price: number;
  change: number; changePercent: number;
  dayHigh: number; dayLow: number; volume: number;
  previousClose: number; timestamp: Date;
}

export interface StockHistory {
  date: string; open: number; high: number; low: number;
  close: number; volume: number;
}

export interface SearchResult { symbol: string; name: string; exchange: string; }

// ─── POPULAR STOCKS ──────────────────────────────────────────────────────────

export const POPULAR_STOCKS = [
  { symbol: 'RELIANCE',   name: 'Reliance Industries Limited'  },
  { symbol: 'TCS',        name: 'Tata Consultancy Services'     },
  { symbol: 'HDFCBANK',   name: 'HDFC Bank Limited'             },
  { symbol: 'INFY',       name: 'Infosys Limited'               },
  { symbol: 'ICICIBANK',  name: 'ICICI Bank Limited'            },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Limited'    },
  { symbol: 'SBIN',       name: 'State Bank of India'           },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Limited'         },
  { symbol: 'ITC',        name: 'ITC Limited'                   },
  { symbol: 'KOTAKBANK',  name: 'Kotak Mahindra Bank Limited'   },
  { symbol: 'LT',         name: 'Larsen & Toubro Limited'       },
  { symbol: 'WIPRO',      name: 'Wipro Limited'                 },
  { symbol: 'ASIANPAINT', name: 'Asian Paints Limited'          },
  { symbol: 'AXISBANK',   name: 'Axis Bank Limited'             },
  { symbol: 'TATAMOTORS', name: 'Tata Motors Limited'           },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance Limited'         },
  { symbol: 'HCLTECH',    name: 'HCL Technologies Limited'      },
  { symbol: 'SUNPHARMA',  name: 'Sun Pharmaceutical Industries' },
  { symbol: 'ULTRACEMCO', name: 'UltraTech Cement Limited'      },
  { symbol: 'TITAN',      name: 'Titan Company Limited'         },
];

// ─── SYMBOL VALIDATION ───────────────────────────────────────────────────────

export function isValidTicker(symbol: string): boolean {
  if (!symbol || typeof symbol !== 'string') return false;
  const s = symbol.trim().toUpperCase();
  if (/^S\d{7}$/.test(s))  return false;   // internal industry IDs
  if (/^MF\d+$/i.test(s))  return false;   // mutual fund IDs
  return /^[A-Z0-9&-]{1,20}(\.NS|\.BO)?$/.test(s);
}

export function resolveToTicker(raw: string): string {
  if (!raw) return raw;

  // ── Strip legacy exchange suffixes left over from Alpha Vantage symbols ──
  // e.g. "RELIANCE.BSE" → "RELIANCE",  "TCS.NS" → "TCS",  "INFY.BO" → "INFY"
  let upper = raw.trim().toUpperCase().replace(/\.(BSE|NSE|NS|BO)$/i, '');

  if (isValidTicker(upper)) return upper;

  // Fuzzy match by name against popular stocks list
  const hit = POPULAR_STOCKS.find(
    s => s.symbol === upper || s.name.toUpperCase().includes(upper)
  );
  return hit ? hit.symbol : upper;
}

// ─── DATA TRANSFORMATION ─────────────────────────────────────────────────────

function transformQuote(raw: any, symbol: string): StockQuote {
  const price         = raw.currentPrice?.NSE ?? raw.currentPrice?.BSE ?? 0;
  const changePercent = parseFloat(String(raw.percentChange ?? '0')) || 0;
  const change        = parseFloat((price * changePercent / 100).toFixed(2));
  const previousClose = parseFloat((price - change).toFixed(2));
  const tech          = raw.stockTechnicalData ?? {};
  const dayHigh       = parseFloat(tech.high ?? tech.dayHigh ?? price) || price;
  const dayLow        = parseFloat(tech.low  ?? tech.dayLow  ?? price) || price;
  const volume        = parseInt(String(tech.volume ?? '0')) || 0;
  return {
    symbol, name: raw.companyName ?? symbol,
    price, change, changePercent, dayHigh, dayLow, volume, previousClose,
    timestamp: new Date(),
  };
}

/**
 * Transform /historical_data response → StockHistory[].
 *
 * The API returns a "datasets" array. The price dataset has metric = "Price"
 * and values shaped as: [ ["YYYY-MM-DD", "priceStr"], ... ]
 *
 * We defensively handle multiple possible shapes:
 *   - datasets[].metric === "Price"  (documented)
 *   - datasets[].label  includes "Price" or "NSE" (fallback)
 *   - flat array of objects with date/close keys (alternative shape)
 */
function transformHistory(raw: any): StockHistory[] {
  // ── Shape A: { datasets: [...] } ─────────────────────────────────────────
  if (raw && Array.isArray(raw.datasets) && raw.datasets.length > 0) {
    const datasets: any[] = raw.datasets;

    // Try exact metric match first, then label match
    const priceDs =
      datasets.find((d: any) => d.metric === 'Price') ??
      datasets.find((d: any) =>
        String(d.label ?? '').toLowerCase().includes('price') ||
        String(d.label ?? '').toLowerCase().includes('nse')
      ) ??
      datasets[0];  // last resort: use first dataset

    const volumeDs = datasets.find((d: any) =>
      d.metric === 'Volume' || String(d.label ?? '').toLowerCase().includes('volume')
    );

    if (!priceDs || !Array.isArray(priceDs.values) || priceDs.values.length === 0) {
      console.warn('[transformHistory] Price dataset missing or empty. datasets:', JSON.stringify(datasets.map((d:any)=>({metric:d.metric,label:d.label,len:d.values?.length}))));
      return [];
    }

    const volByDate = new Map<string, number>();
    if (volumeDs && Array.isArray(volumeDs.values)) {
      for (const row of volumeDs.values) {
        const [date, vol] = row;
        volByDate.set(date, typeof vol === 'number' ? vol : parseInt(String(vol)) || 0);
      }
    }

    const result: StockHistory[] = [];
    for (const row of priceDs.values) {
      // row can be [date, price] or [date, price, extraObj]
      const date  = String(row[0] ?? '');
      const close = parseFloat(String(row[1] ?? '0')) || 0;
      if (!date || close <= 0) continue;
      result.push({ date, open: close, high: close, low: close, close, volume: volByDate.get(date) ?? 0 });
    }

    return result.sort((a, b) => a.date.localeCompare(b.date));
  }

  // ── Shape B: flat array of { date, close, ... } objects ──────────────────
  if (Array.isArray(raw) && raw.length > 0 && raw[0].date) {
    return raw
      .map((d: any) => ({
        date:   String(d.date ?? d.Date ?? ''),
        open:   parseFloat(d.open  ?? d.Open  ?? d.close ?? d.Close ?? 0),
        high:   parseFloat(d.high  ?? d.High  ?? d.close ?? d.Close ?? 0),
        low:    parseFloat(d.low   ?? d.Low   ?? d.close ?? d.Close ?? 0),
        close:  parseFloat(d.close ?? d.Close ?? 0),
        volume: parseInt(String(d.volume ?? d.Volume ?? '0')) || 0,
      }))
      .filter((d: StockHistory) => d.date && d.close > 0)
      .sort((a: StockHistory, b: StockHistory) => a.date.localeCompare(b.date));
  }

  console.warn('[transformHistory] Unrecognised response shape. Keys:', Object.keys(raw ?? {}));
  return [];
}

// ─── PERIOD MAPPING ──────────────────────────────────────────────────────────

/** Map frontend period strings → indianapi.in period param values */
function mapPeriod(period: string): string {
  const map: Record<string, string> = {
    '1d':  '1m',   // indianapi.in minimum is 1m
    '5d':  '1m',
    '1mo': '6m',
    '3mo': '6m',
    '6mo': '6m',
    '1y':  '1yr',
    '3y':  '3yr',
    '5y':  '5yr',
  };
  return map[period] ?? '1yr';
}

// ─── PUBLIC API ──────────────────────────────────────────────────────────────

export async function getQuote(rawSymbol: string): Promise<StockQuote | null> {
  const symbol = resolveToTicker(rawSymbol);
  if (!isValidTicker(symbol)) {
    console.warn(`[stockData] getQuote: rejected invalid symbol "${rawSymbol}"`);
    return null;
  }

  const cached = quoteCache.get(symbol);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) return cached.data;

  try {
    const json  = await apiFetch(`/stock?name=${encodeURIComponent(symbol)}`);

    const quote = transformQuote(json, symbol);
    quoteCache.set(symbol, { data: quote, timestamp: Date.now() });
    return quote;
  } catch (err) {
    console.error(`[stockData] getQuote error for ${symbol}:`, err);
    return cached?.data ?? null;
  }
}

export async function getQuotes(symbols: string[]): Promise<Map<string, StockQuote>> {
  const results = new Map<string, StockQuote>();
  await Promise.allSettled(symbols.map(async (sym) => {
    const q = await getQuote(sym);
    if (q) results.set(sym, q);
  }));
  return results;
}

export async function getHistory(rawSymbol: string, period = '1y'): Promise<StockHistory[]> {
  const symbol = resolveToTicker(rawSymbol);
  if (!isValidTicker(symbol)) {
    console.warn(`[stockData] getHistory: rejected invalid symbol "${rawSymbol}"`);
    return [];
  }

  const cacheKey = `${symbol}:${period}`;
  const cached   = historyCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) return cached.data;

  const apiPeriod = mapPeriod(period);
  // Fallback period: if short period returns nothing, escalate to 1yr
  const fallbackPeriod = apiPeriod === '1m' ? '6m' : apiPeriod === '6m' ? '1yr' : null;

  // ── Try all known param + filter combinations ────────────────────────────
  // Docs say "stock_name" but example URL uses "symbol". Try all variants.
  const buildUrls = (p: string) => [
    `/historical_data?stock_name=${encodeURIComponent(symbol)}&period=${p}&filter=price`,
    `/historical_data?name=${encodeURIComponent(symbol)}&period=${p}&filter=price`,
    `/historical_data?symbol=${encodeURIComponent(symbol)}&period=${p}&filter=price`,
    `/historical_data?stock_name=${encodeURIComponent(symbol)}&period=${p}`,
    `/historical_data?name=${encodeURIComponent(symbol)}&period=${p}`,
  ];
  const urls = [
    ...buildUrls(apiPeriod),
    ...(fallbackPeriod ? buildUrls(fallbackPeriod) : []),
  ];

  for (const url of urls) {
    try {
      const json    = await apiFetch(url);
      const history = transformHistory(json);

      if (history.length > 0) {
        console.log(`[stockData] getHistory: ${symbol} got ${history.length} points via ${url}`);
        historyCache.set(cacheKey, { data: history, timestamp: Date.now() });
        return history;
      }

      // Response was ok but yielded no data – log and try next param variant
      console.warn(`[stockData] getHistory: zero data points from ${url}. Raw keys: ${Object.keys(json ?? {}).join(', ')}`);
    } catch (err) {
      console.warn(`[stockData] getHistory: param variant failed (${url}):`, (err as Error).message);
    }
  }

  console.error(`[stockData] getHistory: all param variants failed for ${symbol}`);
  // Return stale cached data if available — better than empty
  if (cached?.data && cached.data.length > 0) return cached.data;
  return [];
}

export async function searchStocks(query: string): Promise<SearchResult[]> {
  const q = query.toLowerCase().trim();
  return POPULAR_STOCKS
    .filter(s => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q))
    .slice(0, 10)
    .map(s => ({ symbol: s.symbol, name: s.name, exchange: 'NSE' }));
}

export async function getCurrentPrice(symbol: string): Promise<number | null> {
  const q = await getQuote(symbol);
  return q?.price ?? null;
}

// ─── TRENDING ────────────────────────────────────────────────────────────────

export interface TrendingStock {
  ticker_id: string; company_name: string;
  price: string; percent_change: string; net_change: string;
  high: string; low: string; volume: string;
  nseRic?: string; bseRic?: string;
}

export interface TrendingData {
  top_gainers: TrendingStock[];
  top_losers:  TrendingStock[];
}

function resolveTrendingSymbol(s: TrendingStock): string | null {
  if (s.nseRic) {
    const clean = s.nseRic.replace(/\.NS$/i, '').trim().toUpperCase();
    if (isValidTicker(clean)) return clean;
  }
  const tid = s.ticker_id?.trim().toUpperCase();
  if (tid && isValidTicker(tid)) return tid;
  const nameLower = (s.company_name ?? '').toLowerCase();
  const hit = POPULAR_STOCKS.find(p =>
    nameLower.includes(p.name.toLowerCase().split(' ')[0].toLowerCase())
  );
  return hit ? hit.symbol : null;
}

export async function getTrending(): Promise<TrendingData> {
  try {
    const json = await apiFetch('/trending');
    const raw  = (json.trending_stocks ?? json) as TrendingData;
    const sanitise = (list: TrendingStock[]) =>
      list.map(s => {
        const resolved = resolveTrendingSymbol(s);
        return resolved ? { ...s, ticker_id: resolved } as TrendingStock : null;
      }).filter((s): s is TrendingStock => s !== null);

    return { top_gainers: sanitise(raw.top_gainers ?? []), top_losers: sanitise(raw.top_losers ?? []) };
  } catch (err) {
    console.error('[stockData] getTrending error:', err);
    const fallback = POPULAR_STOCKS.slice(0, 6).map(s => ({
      ticker_id: s.symbol, company_name: s.name,
      price: '0', percent_change: '0', net_change: '0', high: '0', low: '0', volume: '0',
    }));
    return { top_gainers: fallback.slice(0, 3), top_losers: fallback.slice(3, 6) };
  }
}

// ─── ANALYST RECOMMENDATIONS ─────────────────────────────────────────────────

export interface AnalystRec {
  stockId: string; meanScore: number; label: string;
  analysts: number; priceTarget: number | null;
}

const REC_LABELS: Record<number, string> = {
  1: 'Strong Buy', 2: 'Outperform', 3: 'Hold', 4: 'Underperform', 5: 'Sell',
};

export async function getAnalystRec(stockId: string): Promise<AnalystRec | null> {
  try {
    const json      = await apiFetch(`/stock_target_price?stock_id=${encodeURIComponent(stockId)}`);
    const rec       = json.recommendation ?? {};
    const target    = json.priceTarget    ?? {};
    const meanRaw   = parseFloat(String(rec.Mean ?? rec.PreliminaryMean ?? '3'));
    const meanRound = Math.min(5, Math.max(1, Math.round(meanRaw)));
    return {
      stockId, meanScore: meanRaw, label: REC_LABELS[meanRound] ?? 'Hold',
      analysts: parseInt(String(rec.NumberOfRecommendations ?? '0')) || 0,
      priceTarget: target.Mean ? parseFloat(target.Mean) : null,
    };
  } catch (err) {
    console.error(`[stockData] getAnalystRec error for ${stockId}:`, err);
    return null;
  }
}

// ─── STOCK NEWS ──────────────────────────────────────────────────────────────

export interface StockNews {
  headline: string;
  url: string;
  source: string;
  publishedAt: string;
  summary?: string;
}

export async function getStockNews(rawSymbol: string): Promise<StockNews[]> {
  const symbol = resolveToTicker(rawSymbol);
  if (!isValidTicker(symbol)) return [];
  try {
    // The indianapi.in /stock endpoint returns news in the response
    const json = await apiFetch(`/stock?name=${encodeURIComponent(symbol)}`);
    const rawNews: any[] = json.news ?? json.recentNews ?? json.latest_news ?? [];
    return rawNews.slice(0, 6).map((n: any) => ({
      headline:    n.headline ?? n.title ?? n.heading ?? 'News update',
      url:         n.url ?? n.link ?? '#',
      source:      n.source ?? n.publisher ?? 'Market News',
      publishedAt: n.publishedAt ?? n.date ?? n.published_date ?? new Date().toISOString(),
      summary:     n.summary ?? n.description ?? '',
    }));
  } catch (err) {
    console.error(`[stockData] getStockNews error for ${symbol}:`, err);
    return [];
  }
}
