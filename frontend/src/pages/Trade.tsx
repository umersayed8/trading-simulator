import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tradingApi, portfolioApi } from '../api/client';
import { createChart, IChartApi, ISeriesApi, ColorType, CrosshairMode } from 'lightweight-charts';
import {
  Search, TrendingUp, TrendingDown, Plus, Minus,
  Star, StarOff, Loader2, Lightbulb, RefreshCw, Target,
  X, ChevronDown, BarChart2, AlertCircle,
} from 'lucide-react';
import { TradeSkeleton, StockDetailSkeleton } from '../components/ui/Skeleton';
import { MascotEmpty } from '../components/mascot/Mascot';
import { FlameIcon } from '../components/gamification/GamificationUI';

interface StockQuote {
  symbol: string; name: string; price: number;
  change: number; changePercent: number;
  dayHigh: number; dayLow: number; volume: number; previousClose: number;
}
interface SearchResult   { symbol: string; name: string; exchange: string; }
interface RecommendedStock { symbol: string; name: string; price: number; changePercent: number; change: number; }
interface Insight {
  stockId: string; stockName: string; label: string;
  meanScore: number; analysts: number; priceTarget: number | null; tip: string;
}
interface InsightsData { insights: Insight[]; staticTips: string[]; }

const UP_COLOR   = '#10b981';
const DOWN_COLOR = '#ef4444';
const PERIODS    = ['1d', '5d', '1mo', '3mo', '6mo', '1y'] as const;

// ─── Synthetic history fallback ───────────────────────────────────────────────
// When the API returns no data for a given period, generate plausible-looking
// synthetic price data seeded from the stock's current price so the chart is
// never blank. This eliminates the "Not enough historical data" error.
function makeSyntheticHistory(basePrice: number, period: string): Array<{ date: string; close: number }> {
  const days: Record<string, number> = {
    '1d': 1, '5d': 5, '1mo': 30, '3mo': 90, '6mo': 180, '1y': 365,
  };
  const count = days[period] ?? 365;
  const result = [];
  let price = basePrice * (0.85 + Math.random() * 0.1); // start slightly below
  const now = new Date();

  for (let i = count; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    // Skip weekends
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    // Random walk with slight upward drift
    const change = price * ((-0.015) + Math.random() * 0.03);
    price = Math.max(price + change, 1);
    result.push({
      date:  d.toISOString().slice(0, 10),
      close: parseFloat(price.toFixed(2)),
    });
  }
  // Ensure last point is exactly the current price
  if (result.length > 0) result[result.length - 1].close = basePrice;
  return result;
}

export default function Trade() {
  const { symbol: urlSymbol } = useParams();
  const navigate = useNavigate();

  const [searchQuery,   setSearchQuery]   = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedStock, setSelectedStock] = useState<StockQuote | null>(null);
  const [chartData,     setChartData]     = useState<any[]>([]);
  const [period,        setPeriod]        = useState<string>('1y');
  const [initialLoading, setInitialLoading] = useState(true);
  const [stockLoading,   setStockLoading]   = useState(false);
  const [chartUsingSynthetic, setChartUsingSynthetic] = useState(false);

  const [orderType,    setOrderType]    = useState<'BUY' | 'SELL'>('BUY');
  const [quantity,     setQuantity]     = useState(1);
  const [orderLoading, setOrderLoading] = useState(false);
  const [message,      setMessage]      = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [watchlist,  setWatchlist]  = useState<string[]>([]);
  const [balance,    setBalance]    = useState(100000);
  const [holdings,   setHoldings]   = useState<any[]>([]);

  const [recommended,     setRecommended]     = useState<RecommendedStock[]>([]);
  const [insightsData,    setInsightsData]    = useState<InsightsData | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [recLoading,      setRecLoading]      = useState(false);
  const [tipIndex,        setTipIndex]        = useState(0);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef          = useRef<IChartApi | null>(null);
  const seriesRef         = useRef<ISeriesApi<'Area'> | null>(null);
  const isDark            = document.documentElement.classList.contains('dark');

  // ─── Init ───────────────────────────────────────────────────────────────

  useEffect(() => {
    (async () => {
      try {
        const [wl, pf] = await Promise.all([portfolioApi.getWatchlist(), portfolioApi.getSummary()]);
        setWatchlist(wl.data.data.map((w: any) => w.symbol));
        setBalance(pf.data.data.balance);
        setHoldings(pf.data.data.holdings);
      } catch {}
      finally { setInitialLoading(false); }
    })();
    fetchRecommended();
    fetchInsights();
  }, []);

  useEffect(() => {
    const tips = insightsData?.staticTips ?? [];
    if (!tips.length) return;
    const id = setInterval(() => setTipIndex(i => (i + 1) % tips.length), 6000);
    return () => clearInterval(id);
  }, [insightsData?.staticTips]);

  useEffect(() => { if (urlSymbol) loadStock(urlSymbol); }, [urlSymbol]);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (searchQuery.length >= 1) {
        try { setSearchResults((await tradingApi.searchStocks(searchQuery)).data.data); }
        catch { setSearchResults([]); }
      } else { setSearchResults([]); }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // ─── Chart creation (callback ref) ─────────────────────────────────────

  function getChartColors() {
    const dark = document.documentElement.classList.contains('dark');
    return {
      bg:     dark ? '#131d2e' : '#ffffff',
      text:   dark ? '#94a3b8' : '#64748b',
      grid:   dark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
      border: dark ? 'rgba(255,255,255,0.08)' : '#e2e8f0',
    };
  }

  const initChart = useCallback((node: HTMLDivElement | null) => {
    if (chartRef.current) {
      try { chartRef.current.remove(); } catch {}
      chartRef.current  = null;
      seriesRef.current = null;
    }
    if (!node) return;

    const c = getChartColors();
    const chart = createChart(node, {
      layout: {
        background:  { type: ColorType.Solid, color: c.bg },
        textColor:   c.text,
        fontFamily:  "'DM Sans', system-ui, sans-serif",
      },
      grid: {
        vertLines: { color: c.grid },
        horzLines: { color: c.grid },
      },
      rightPriceScale: { borderColor: c.border },
      timeScale:       { borderColor: c.border, timeVisible: true },
      crosshair: { mode: CrosshairMode.Normal },
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
      handleScale:  { mouseWheel: true, pinch: true },
      width:  node.clientWidth  || 600,
      height: 320,
    });

    // Area series for a cleaner fintech look
    const area = chart.addAreaSeries({
      lineColor:        UP_COLOR,
      topColor:         'rgba(16,185,129,0.2)',
      bottomColor:      'rgba(16,185,129,0)',
      lineWidth:        2,
      crosshairMarkerVisible: true,
      priceLineVisible: false,
    });

    chartRef.current  = chart;
    seriesRef.current = area as any;

    const ro = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect?.width;
      if (w && chartRef.current) chartRef.current.applyOptions({ width: w });
    });
    ro.observe(node);

    if (chartData.length > 0) applyChartData(chartData, area as any, chart);

    (node as any).__chartCleanup = () => {
      ro.disconnect();
      try { chart.remove(); } catch {}
      chartRef.current  = null;
      seriesRef.current = null;
    };
  }, []); // eslint-disable-line

  const chartContainerCb = useCallback((node: HTMLDivElement | null) => {
    if (!node) {
      const prev = (chartContainerRef as any).current;
      if (prev?.__chartCleanup) prev.__chartCleanup();
    }
    (chartContainerRef as any).current = node;
    initChart(node);
  }, [initChart]);

  // Re-theme chart when dark mode changes
  useEffect(() => {
    if (!chartRef.current) return;
    const c = getChartColors();
    chartRef.current.applyOptions({
      layout: { background: { type: ColorType.Solid, color: c.bg }, textColor: c.text },
      grid: { vertLines: { color: c.grid }, horzLines: { color: c.grid } },
      rightPriceScale: { borderColor: c.border },
      timeScale: { borderColor: c.border },
    });
  }, [isDark]);

  // Paint data
  useEffect(() => {
    if (!seriesRef.current || !chartRef.current) return;
    applyChartData(chartData, seriesRef.current, chartRef.current);
  }, [chartData]);

  function applyChartData(data: any[], series: ISeriesApi<'Area'>, chart: IChartApi) {
    if (!data || data.length === 0) return;
    const seen = new Set<string>();
    const formatted = data
      .map((d: any) => ({ time: String(d.date), value: Number(d.close) }))
      .filter(d => d.value > 0 && d.time && /^\d{4}-\d{2}-\d{2}$/.test(d.time) && !seen.has(d.time) && seen.add(d.time))
      .sort((a, b) => a.time.localeCompare(b.time));

    if (!formatted.length) return;

    const first = formatted[0].value;
    const last  = formatted[formatted.length - 1].value;
    const isUp  = last >= first;

    try {
      (series as any).applyOptions({
        lineColor:   isUp ? UP_COLOR : DOWN_COLOR,
        topColor:    isUp ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
        bottomColor: isUp ? 'rgba(16,185,129,0)'   : 'rgba(239,68,68,0)',
      });
      series.setData(formatted as any);
      chart.timeScale().fitContent();
    } catch (err) {
      console.error('[Chart] setData error:', err);
    }
  }

  // ─── Data fetching ──────────────────────────────────────────────────────

  const fetchRecommended = async () => {
    setRecLoading(true);
    try { setRecommended((await tradingApi.getRecommended()).data.data ?? []); } catch {}
    finally { setRecLoading(false); }
  };

  const fetchInsights = async () => {
    setInsightsLoading(true);
    try { setInsightsData((await tradingApi.getInsights()).data.data); } catch {}
    finally { setInsightsLoading(false); }
  };

  const loadStock = async (symbol: string) => {
    setStockLoading(true);
    setChartUsingSynthetic(false);
    try {
      const [qRes, hRes] = await Promise.all([
        tradingApi.getQuote(symbol),
        tradingApi.getHistory(symbol, period),
      ]);
      const stock = qRes.data.data;
      setSelectedStock(stock);

      let history: any[] = hRes.data.data?.history ?? [];

      // ── Chart fix: if API returns no data, generate synthetic history ──
      if (history.length < 2 && stock?.price > 0) {
        history = makeSyntheticHistory(stock.price, period);
        setChartUsingSynthetic(true);
      }

      setChartData(history);
      setSearchQuery('');
      setSearchResults([]);
    } catch (e: any) {
      const msg = e?.response?.data?.error?.message ?? 'Failed to load stock data';
      setMessage({ type: 'error', text: msg });
    } finally { setStockLoading(false); }
  };

  const handlePeriodChange = async (p: string) => {
    setPeriod(p);
    if (!selectedStock) return;
    setChartUsingSynthetic(false);
    try {
      const res     = await tradingApi.getHistory(selectedStock.symbol, p);
      let history: any[] = res.data.data?.history ?? [];
      if (history.length < 2 && selectedStock.price > 0) {
        history = makeSyntheticHistory(selectedStock.price, p);
        setChartUsingSynthetic(true);
      }
      setChartData(history);
    } catch {}
  };

  const handleOrder = async () => {
    if (!selectedStock) return;
    setOrderLoading(true);
    try {
      await tradingApi.placeOrder({ symbol: selectedStock.symbol, type: orderType, quantity });
      setMessage({
        type: 'success',
        text: `${orderType === 'BUY' ? 'Bought' : 'Sold'} ${quantity} share${quantity > 1 ? 's' : ''} of ${selectedStock.symbol}`,
      });
      const pf = await portfolioApi.getSummary();
      setBalance(pf.data.data.balance);
      setHoldings(pf.data.data.holdings);
    } catch (e: any) {
      setMessage({ type: 'error', text: e.response?.data?.error?.message || 'Order failed' });
    } finally { setOrderLoading(false); }
  };

  const toggleWatchlist = async () => {
    if (!selectedStock) return;
    try {
      if (watchlist.includes(selectedStock.symbol)) {
        await portfolioApi.removeFromWatchlist(selectedStock.symbol);
        setWatchlist(w => w.filter(s => s !== selectedStock.symbol));
      } else {
        await portfolioApi.addToWatchlist(selectedStock.symbol);
        setWatchlist(w => [...w, selectedStock.symbol]);
      }
    } catch {}
  };

  const fmt  = (v: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);
  const fmt2 = (v: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
  const fmtN = (v: number) => new Intl.NumberFormat('en-IN').format(v);

  const currentHolding = selectedStock ? holdings.find((h: any) => h.symbol === selectedStock.symbol) : null;
  const orderTotal     = selectedStock ? selectedStock.price * quantity : 0;
  const canBuy         = orderType === 'BUY'  && orderTotal <= balance;
  const canSell        = orderType === 'SELL' && currentHolding && currentHolding.quantity >= quantity;

  const insightBadge = (label: string) =>
    ['Strong Buy', 'Outperform'].includes(label) ? 'badge-success' :
    label === 'Hold'                              ? 'badge-warning'  : 'badge-danger';

  // ─── Render ──────────────────────────────────────────────────────────────

  if (initialLoading) return <TradeSkeleton />;

  return (
    <div className="space-y-5 animate-fade-up">

      {/* Page title */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>
          Trade Stocks
        </h1>
      </div>

      {/* Message toast */}
      {message && (
        <div
          className={`flex items-start justify-between gap-3 px-4 py-3 rounded-xl text-sm font-medium animate-fade-down ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
              : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="shrink-0"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Pro Tips */}
      <div
        className="flex items-start gap-3 px-4 py-3 rounded-xl"
        style={{ background: 'var(--bg-card)', border: '1px solid rgba(20,184,166,0.2)' }}
      >
        <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center shrink-0 mt-0.5">
          <Lightbulb className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wide">
              Market Insight
            </span>
            <button onClick={fetchInsights} className="transition-colors" style={{ color: 'var(--text-muted)' }}>
              <RefreshCw className={`w-3.5 h-3.5 ${insightsLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <p className="text-sm transition-all duration-500" style={{ color: 'var(--text-secondary)' }}>
            {insightsData?.staticTips?.[tipIndex] ?? 'Loading market insights…'}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text" value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search stocks (RELIANCE, TCS, INFY…)"
            className="input pl-9"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setSearchResults([]); }}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-muted)' }}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {searchResults.length > 0 && (
          <div
            className="mt-2 rounded-xl overflow-hidden divide-y animate-fade-down"
            style={{ border: '1px solid var(--border)', divideColor: 'var(--border)' }}
          >
            {searchResults.map(r => (
              <button
                key={r.symbol}
                onClick={() => { loadStock(r.symbol); navigate(`/trade/${r.symbol}`); }}
                className="w-full flex items-center justify-between p-3 text-left transition-colors"
                style={{ background: 'var(--bg-card)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--sidebar-hover-bg)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-card)')}
              >
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{r.symbol}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.name}</p>
                </div>
                <span className="badge-neutral">{r.exchange}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Trending Stocks */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FlameIcon size={18} />
            <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              Popular &amp; Trending
            </h2>
          </div>
          <button
            onClick={fetchRecommended}
            className="flex items-center gap-1 text-xs transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <RefreshCw className={`w-3 h-3 ${recLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {recLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-xl p-3 space-y-2" style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                <div className="skeleton h-4 w-20" />
                <div className="skeleton h-3 w-28" />
                <div className="skeleton h-5 w-24 mt-2" />
                <div className="skeleton h-3 w-14" />
              </div>
            ))}
          </div>
        ) : recommended.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {recommended.slice(0, 8).map((stock, i) => (
              <button
                key={stock.symbol}
                onClick={() => { loadStock(stock.symbol); navigate(`/trade/${stock.symbol}`); }}
                className="p-3 rounded-xl text-left transition-all group animate-fade-up"
                style={{
                  border: '1px solid var(--border)',
                  background: 'var(--bg-card)',
                  animationDelay: `${i * 40}ms`,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(20,184,166,0.4)';
                  (e.currentTarget as HTMLElement).style.boxShadow   = '0 4px 16px -4px rgba(20,184,166,0.2)';
                  (e.currentTarget as HTMLElement).style.transform   = 'translateY(-1px)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                  (e.currentTarget as HTMLElement).style.boxShadow   = 'none';
                  (e.currentTarget as HTMLElement).style.transform   = 'translateY(0)';
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                      {stock.symbol}
                    </p>
                    <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {stock.name}
                    </p>
                  </div>
                  {stock.changePercent >= 0
                    ? <TrendingUp  className="w-4 h-4 text-up shrink-0 ml-1" />
                    : <TrendingDown className="w-4 h-4 text-down shrink-0 ml-1" />}
                </div>
                <p className="text-sm font-bold font-mono" style={{ color: 'var(--text-primary)' }}>
                  {stock.price > 0 ? fmt(stock.price) : '—'}
                </p>
                <p className={`text-xs font-semibold ${stock.changePercent >= 0 ? 'text-up' : 'text-down'}`}>
                  {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                </p>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>
            No trending data available right now.
          </p>
        )}
      </div>

      {/* Analyst Insights */}
      {insightsData && insightsData.insights.length > 0 && (
        <div className="card animate-fade-up">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Analyst Insights</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {insightsData.insights.map(ins => (
              <div
                key={ins.stockId}
                className="p-3 rounded-xl transition-colors"
                style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                    {ins.stockId}
                  </span>
                  <span className={insightBadge(ins.label)}>{ins.label}</span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{ins.tip}</p>
                {ins.priceTarget && (
                  <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 mt-1.5 flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    Target: {fmt2(ins.priceTarget)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stock loading skeleton */}
      {stockLoading && <StockDetailSkeleton />}

      {/* Stock Detail */}
      {selectedStock && !stockLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-fade-up">

          {/* ── Left: Chart & Stats ── */}
          <div className="lg:col-span-2 space-y-4">
            <div className="card">

              {/* Stock header */}
              <div className="flex items-start justify-between mb-5">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-2xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>
                      {selectedStock.symbol}
                    </h2>
                    <button
                      onClick={toggleWatchlist}
                      className="p-1.5 rounded-lg transition-all hover:scale-110"
                      title={watchlist.includes(selectedStock.symbol) ? 'Remove from watchlist' : 'Add to watchlist'}
                    >
                      {watchlist.includes(selectedStock.symbol)
                        ? <Star    className="w-5 h-5 text-accent-500 fill-accent-500" />
                        : <StarOff className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />}
                    </button>
                  </div>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{selectedStock.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-display font-bold font-mono" style={{ color: 'var(--text-primary)' }}>
                    {fmt2(selectedStock.price)}
                  </p>
                  <p className={`flex items-center justify-end gap-1 text-sm font-semibold ${
                    selectedStock.change >= 0 ? 'text-up' : 'text-down'
                  }`}>
                    {selectedStock.change >= 0
                      ? <TrendingUp className="w-4 h-4" />
                      : <TrendingDown className="w-4 h-4" />}
                    {selectedStock.change >= 0 ? '+' : ''}
                    {selectedStock.change.toFixed(2)} ({selectedStock.changePercent.toFixed(2)}%)
                  </p>
                </div>
              </div>

              {/* Period selector */}
              <div className="flex gap-1.5 mb-4 p-1 rounded-xl w-fit" style={{ background: 'var(--bg-page)' }}>
                {PERIODS.map(p => (
                  <button
                    key={p}
                    onClick={() => handlePeriodChange(p)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: period === p ? 'var(--bg-card)' : 'transparent',
                      color: period === p ? 'var(--sidebar-active-text)' : 'var(--text-muted)',
                      boxShadow: period === p ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    }}
                  >
                    {p.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Chart */}
              <div ref={chartContainerCb} className="w-full rounded-xl overflow-hidden" style={{ height: 320 }} />

              {/* Synthetic data disclaimer */}
              {chartUsingSynthetic && (
                <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg text-xs"
                     style={{ background: 'rgba(245,158,11,0.08)', color: 'var(--text-muted)', border: '1px solid rgba(245,158,11,0.15)' }}>
                  <AlertCircle className="w-3.5 h-3.5 text-accent-500 shrink-0" />
                  Chart shows simulated data — live historical data unavailable for this stock.
                </div>
              )}
            </div>

            {/* Stats row */}
            <div className="card grid grid-cols-2 md:grid-cols-4 gap-5">
              {[
                { label: 'Day High',       val: fmt2(selectedStock.dayHigh),       icon: <TrendingUp  className="w-3.5 h-3.5 text-up" />    },
                { label: 'Day Low',        val: fmt2(selectedStock.dayLow),        icon: <TrendingDown className="w-3.5 h-3.5 text-down" />  },
                { label: 'Prev Close',     val: fmt2(selectedStock.previousClose), icon: <BarChart2    className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} /> },
                { label: 'Volume',         val: fmtN(selectedStock.volume),        icon: <ChevronDown  className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} /> },
              ].map(({ label, val, icon }) => (
                <div key={label}>
                  <div className="flex items-center gap-1.5 mb-1">
                    {icon}
                    <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</p>
                  </div>
                  <p className="font-semibold font-mono text-sm" style={{ color: 'var(--text-primary)' }}>{val}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: Order Panel ── */}
          <div
            className="h-fit rounded-2xl p-5 space-y-4"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <h3 className="font-display font-semibold" style={{ color: 'var(--text-primary)' }}>Place Order</h3>

            {/* Balance */}
            <div className="rounded-xl px-4 py-3" style={{ background: 'var(--bg-page)' }}>
              <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Available Balance</p>
              <p className="text-xl font-bold font-mono mt-0.5" style={{ color: 'var(--text-primary)' }}>
                {fmt(balance)}
              </p>
            </div>

            {/* Holdings badge */}
            {currentHolding && (
              <div className="rounded-xl px-4 py-3 bg-primary-50 dark:bg-primary-900/20">
                <p className="text-xs font-medium text-primary-600 dark:text-primary-400">You own</p>
                <p className="text-xl font-bold text-primary-700 dark:text-primary-300 mt-0.5">
                  {currentHolding.quantity} shares
                </p>
              </div>
            )}

            {/* Buy / Sell toggle */}
            <div className="grid grid-cols-2 gap-2">
              {(['BUY', 'SELL'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setOrderType(t)}
                  className="py-2.5 rounded-xl font-semibold text-sm transition-all"
                  style={{
                    background: orderType === t
                      ? t === 'BUY' ? '#10b981' : '#ef4444'
                      : 'var(--bg-page)',
                    color: orderType === t ? 'white' : 'var(--text-secondary)',
                    border: `1.5px solid ${orderType === t ? 'transparent' : 'var(--border)'}`,
                  }}
                >
                  {t === 'BUY' ? 'Buy' : 'Sell'}
                </button>
              ))}
            </div>

            {/* Quantity */}
            <div>
              <label className="label">Quantity</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                  style={{ background: 'var(--bg-page)', border: '1px solid var(--border)' }}
                >
                  <Minus className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                </button>
                <input
                  type="number" value={quantity} min="1"
                  onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="input text-center flex-1 font-mono font-semibold"
                />
                <button
                  onClick={() => setQuantity(q => q + 1)}
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                  style={{ background: 'var(--bg-page)', border: '1px solid var(--border)' }}
                >
                  <Plus className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                </button>
              </div>
            </div>

            {/* Summary */}
            <div className="space-y-2 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              {[
                { label: 'Price per share', val: fmt2(selectedStock.price) },
                { label: 'Quantity',        val: quantity.toString() },
              ].map(({ label, val }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                  <span className="font-mono font-medium" style={{ color: 'var(--text-secondary)' }}>{val}</span>
                </div>
              ))}
              <div className="flex justify-between text-base font-bold pt-1">
                <span style={{ color: 'var(--text-primary)' }}>Total</span>
                <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{fmt2(orderTotal)}</span>
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleOrder}
              disabled={orderLoading || (orderType === 'BUY' ? !canBuy : !canSell)}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-98"
              style={{
                background: orderType === 'BUY' ? '#10b981' : '#ef4444',
                color: 'white',
              }}
            >
              {orderLoading
                ? <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing…
                  </span>
                : `${orderType} ${quantity} Share${quantity > 1 ? 's' : ''}`}
            </button>

            {orderType === 'BUY'  && !canBuy  && (
              <p className="text-xs text-down text-center">Insufficient balance</p>
            )}
            {orderType === 'SELL' && !canSell && (
              <p className="text-xs text-down text-center">
                {currentHolding ? 'Insufficient shares' : "You don't own this stock"}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!selectedStock && !stockLoading && (
        <div className="card">
          <MascotEmpty
            mood="thinking"
            title="Search for a stock to get started"
            subtitle="Enter a symbol above or tap a trending stock below."
            size={100}
          />
        </div>
      )}
    </div>
  );
}
