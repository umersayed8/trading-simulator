import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tradingApi, portfolioApi } from '../api/client';
import { createChart, IChartApi, ISeriesApi, ColorType, CrosshairMode } from 'lightweight-charts';
import {
  ArrowLeft, TrendingUp, TrendingDown, Plus, Minus,
  Star, StarOff, Loader2, RefreshCw, AlertCircle,
  BarChart2, ChevronDown, ExternalLink, Newspaper, X,
} from 'lucide-react';
import { StockDetailSkeleton } from '../components/ui/Skeleton';
import { useAddictionControl } from '../hooks/useAddictionControl';

interface StockQuote {
  symbol: string; name: string; price: number;
  change: number; changePercent: number;
  dayHigh: number; dayLow: number; volume: number; previousClose: number;
}

interface StockNews {
  headline: string; url: string; source: string;
  publishedAt: string; summary?: string;
}

const UP_COLOR = '#10b981';
const DOWN_COLOR = '#ef4444';
const PERIODS = ['1d', '5d', '1mo', '3mo', '6mo', '1y'] as const;

function makeSyntheticHistory(basePrice: number, period: string) {
  const days: Record<string, number> = {
    '1d': 1, '5d': 5, '1mo': 30, '3mo': 90, '6mo': 180, '1y': 365,
  };
  const count = days[period] ?? 365;
  const result = [];
  let price = basePrice * (0.85 + Math.random() * 0.1);
  const now = new Date();
  for (let i = count; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    const change = price * ((-0.015) + Math.random() * 0.03);
    price = Math.max(price + change, 1);
    result.push({ date: d.toISOString().slice(0, 10), close: parseFloat(price.toFixed(2)) });
  }
  if (result.length > 0) result[result.length - 1].close = basePrice;
  return result;
}

export default function StockDetail() {
  const { symbol: urlSymbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();

  const [stock, setStock]         = useState<StockQuote | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [period, setPeriod]       = useState('1y');
  const [loading, setLoading]     = useState(true);
  const [chartSynthetic, setChartSynthetic] = useState(false);

  const [orderType, setOrderType]     = useState<'BUY' | 'SELL'>('BUY');
  const [quantity, setQuantity]       = useState(1);
  const [orderLoading, setOrderLoading] = useState(false);
  const [message, setMessage]         = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [balance, setBalance]     = useState(100000);
  const [holdings, setHoldings]   = useState<any[]>([]);

  const [news, setNews]           = useState<StockNews[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);

  // Addiction control
  const [todayTrades, setTodayTrades] = useState(0);
  const DAILY_LIMIT = 30;
  const { reminder, dismissReminder } = useAddictionControl(todayTrades);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef          = useRef<IChartApi | null>(null);
  const seriesRef         = useRef<ISeriesApi<'Area'> | null>(null);

  const isDark = document.documentElement.classList.contains('dark');

  const fmt  = (v: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);
  const fmt2 = (v: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
  const fmtN = (v: number) => new Intl.NumberFormat('en-IN').format(v);
  const fmtDate = (s: string) => {
    try { return new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return s; }
  };

  useEffect(() => {
    if (!urlSymbol) return;
    (async () => {
      try {
        const [wl, pf, tc] = await Promise.all([
          portfolioApi.getWatchlist(),
          portfolioApi.getSummary(),
          tradingApi.getTodayTradeCount(),
        ]);
        setWatchlist(wl.data.data.map((w: any) => w.symbol));
        setBalance(pf.data.data.balance);
        setHoldings(pf.data.data.holdings);
        setTodayTrades(tc.data.data.count);
      } catch {}
      await loadStock(urlSymbol);
      fetchNews(urlSymbol);
    })();
  }, [urlSymbol]);

  useEffect(() => {
    if (!seriesRef.current || !chartRef.current) return;
    applyChartData(chartData, seriesRef.current, chartRef.current);
  }, [chartData]);

  function getChartColors() {
    const dark = document.documentElement.classList.contains('dark');
    return {
      bg: dark ? '#131d2e' : '#ffffff',
      text: dark ? '#94a3b8' : '#64748b',
      grid: dark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
      border: dark ? 'rgba(255,255,255,0.08)' : '#e2e8f0',
    };
  }

  const initChart = useCallback((node: HTMLDivElement | null) => {
    if (chartRef.current) {
      try { chartRef.current.remove(); } catch {}
      chartRef.current = null; seriesRef.current = null;
    }
    if (!node) return;
    const c = getChartColors();
    const chart = createChart(node, {
      layout: { background: { type: ColorType.Solid, color: c.bg }, textColor: c.text, fontFamily: "'DM Sans', system-ui, sans-serif" },
      grid: { vertLines: { color: c.grid }, horzLines: { color: c.grid } },
      rightPriceScale: { borderColor: c.border },
      timeScale: { borderColor: c.border, timeVisible: true },
      crosshair: { mode: CrosshairMode.Normal },
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
      handleScale: { mouseWheel: true, pinch: true },
      width: node.clientWidth || 600, height: 340,
    });
    const area = chart.addAreaSeries({
      lineColor: UP_COLOR, topColor: 'rgba(16,185,129,0.2)',
      bottomColor: 'rgba(16,185,129,0)', lineWidth: 2,
      crosshairMarkerVisible: true, priceLineVisible: false,
    });
    chartRef.current = chart;
    seriesRef.current = area as any;
    const ro = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect?.width;
      if (w && chartRef.current) chartRef.current.applyOptions({ width: w });
    });
    ro.observe(node);
    if (chartData.length > 0) applyChartData(chartData, area as any, chart);
    (node as any).__chartCleanup = () => { ro.disconnect(); try { chart.remove(); } catch {} };
  }, []);

  const chartCb = useCallback((node: HTMLDivElement | null) => {
    if (!node) { const prev = (chartContainerRef as any).current; if (prev?.__chartCleanup) prev.__chartCleanup(); }
    (chartContainerRef as any).current = node;
    initChart(node);
  }, [initChart]);

  useEffect(() => {
    if (!chartRef.current) return;
    const c = getChartColors();
    chartRef.current.applyOptions({
      layout: { background: { type: ColorType.Solid, color: c.bg }, textColor: c.text },
      grid: { vertLines: { color: c.grid }, horzLines: { color: c.grid } },
      rightPriceScale: { borderColor: c.border }, timeScale: { borderColor: c.border },
    });
  }, [isDark]);

  function applyChartData(data: any[], series: ISeriesApi<'Area'>, chart: IChartApi) {
    if (!data || data.length === 0) return;
    const seen = new Set<string>();
    const formatted = data
      .map((d: any) => ({ time: String(d.date), value: Number(d.close) }))
      .filter(d => d.value > 0 && d.time && /^\d{4}-\d{2}-\d{2}$/.test(d.time) && !seen.has(d.time) && seen.add(d.time))
      .sort((a, b) => a.time.localeCompare(b.time));
    if (!formatted.length) return;
    const isUp = formatted[formatted.length - 1].value >= formatted[0].value;
    try {
      (series as any).applyOptions({
        lineColor: isUp ? UP_COLOR : DOWN_COLOR,
        topColor: isUp ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
        bottomColor: isUp ? 'rgba(16,185,129,0)' : 'rgba(239,68,68,0)',
      });
      series.setData(formatted as any);
      chart.timeScale().fitContent();
    } catch {}
  }

  const loadStock = async (symbol: string) => {
    setLoading(true); setChartSynthetic(false);
    try {
      const [qRes, hRes] = await Promise.all([tradingApi.getQuote(symbol), tradingApi.getHistory(symbol, period)]);
      const s = qRes.data.data;
      setStock(s);
      let history: any[] = hRes.data.data?.history ?? [];
      if (history.length < 2 && s?.price > 0) { history = makeSyntheticHistory(s.price, period); setChartSynthetic(true); }
      setChartData(history);
    } catch (e: any) {
      setMessage({ type: 'error', text: e?.response?.data?.error?.message ?? 'Failed to load stock data' });
    } finally { setLoading(false); }
  };

  const handlePeriodChange = async (p: string) => {
    setPeriod(p);
    if (!stock) return;
    setChartSynthetic(false);
    try {
      const res = await tradingApi.getHistory(stock.symbol, p);
      let history: any[] = res.data.data?.history ?? [];
      if (history.length < 2 && stock.price > 0) { history = makeSyntheticHistory(stock.price, p); setChartSynthetic(true); }
      setChartData(history);
    } catch {}
  };

  const fetchNews = async (symbol: string) => {
    setNewsLoading(true);
    try {
      const res = await tradingApi.getNews(symbol);
      setNews(res.data.data ?? []);
    } catch { setNews([]); }
    finally { setNewsLoading(false); }
  };

  const handleOrder = async () => {
    if (!stock) return;
    if (todayTrades >= DAILY_LIMIT) {
      setMessage({ type: 'error', text: `Daily limit of ${DAILY_LIMIT} trades reached. Come back tomorrow! 🐻` });
      return;
    }
    setOrderLoading(true);
    try {
      await tradingApi.placeOrder({ symbol: stock.symbol, type: orderType, quantity });
      setMessage({ type: 'success', text: `${orderType === 'BUY' ? 'Bought' : 'Sold'} ${quantity} share${quantity > 1 ? 's' : ''} of ${stock.symbol}` });
      const [pf, tc] = await Promise.all([portfolioApi.getSummary(), tradingApi.getTodayTradeCount()]);
      setBalance(pf.data.data.balance);
      setHoldings(pf.data.data.holdings);
      setTodayTrades(tc.data.data.count);
    } catch (e: any) {
      const msg = e.response?.data?.error?.message || 'Order failed';
      setMessage({ type: 'error', text: msg });
    } finally { setOrderLoading(false); }
  };

  const toggleWatchlist = async () => {
    if (!stock) return;
    try {
      if (watchlist.includes(stock.symbol)) {
        await portfolioApi.removeFromWatchlist(stock.symbol);
        setWatchlist(w => w.filter(s => s !== stock.symbol));
      } else {
        await portfolioApi.addToWatchlist(stock.symbol);
        setWatchlist(w => [...w, stock.symbol]);
      }
    } catch {}
  };

  const currentHolding = stock ? holdings.find((h: any) => h.symbol === stock.symbol) : null;
  const orderTotal = stock ? stock.price * quantity : 0;
  const canBuy  = orderType === 'BUY'  && orderTotal <= balance;
  const canSell = orderType === 'SELL' && currentHolding && currentHolding.quantity >= quantity;
  const tradesLeft = DAILY_LIMIT - todayTrades;

  if (loading) return (
    <div className="space-y-5 animate-fade-up">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <StockDetailSkeleton />
    </div>
  );

  if (!stock) return (
    <div className="space-y-5 animate-fade-up">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <div className="card text-center py-12">
        <p style={{ color: 'var(--text-muted)' }}>Stock not found.</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-up">

      {/* Back + Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-70"
          style={{ color: 'var(--text-muted)' }}
        >
          <ArrowLeft className="w-4 h-4" /> Back to Trade
        </button>
        {/* Daily trade counter */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold"
          style={{
            background: tradesLeft <= 5 ? 'rgba(239,68,68,0.1)' : 'var(--bg-card)',
            border: `1px solid ${tradesLeft <= 5 ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`,
            color: tradesLeft <= 5 ? '#ef4444' : 'var(--text-muted)',
          }}
        >
          🐻 {todayTrades}/{DAILY_LIMIT} trades today
        </div>
      </div>

      {/* Toast */}
      {message && (
        <div className={`flex items-start justify-between gap-3 px-4 py-3 rounded-xl text-sm font-medium animate-fade-down ${
          message.type === 'success'
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
            : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Limit warning */}
      {tradesLeft <= 5 && tradesLeft > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl animate-fade-down"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <span className="text-xl">🐻</span>
          <div>
            <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
              Kate says: Only {tradesLeft} trade{tradesLeft !== 1 ? 's' : ''} left today!
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              You're approaching your daily limit. Remember to trade mindfully! 🌟
            </p>
          </div>
        </div>
      )}

      {tradesLeft === 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl animate-fade-down"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <span className="text-2xl">🐻</span>
          <div>
            <p className="text-sm font-semibold text-red-600 dark:text-red-400">
              Kate says: Daily limit reached! Time to rest.
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              You've hit your 30-trade daily limit. Take a break, review your portfolio, and come back fresh tomorrow!
            </p>
          </div>
        </div>
      )}

      {/* Kate timed break reminder */}
      {reminder && (
        <div className="relative animate-fade-down px-4 py-3 rounded-xl flex items-start gap-3"
          style={{
            background: reminder.type === 'limit_reached' ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)',
            border: `1px solid ${reminder.type === 'limit_reached' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}`,
          }}>
          <span className="text-2xl shrink-0">🐻</span>
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: reminder.type === 'limit_reached' ? '#ef4444' : '#d97706' }}>
              Kate says:
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{reminder.message}</p>
          </div>
          <button onClick={dismissReminder} className="shrink-0 p-1" style={{ color: 'var(--text-muted)' }}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left: Chart + Stats + News */}
        <div className="lg:col-span-2 space-y-4">

          {/* Chart card */}
          <div className="card">
            {/* Stock header */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>
                    {stock.symbol}
                  </h1>
                  <button
                    onClick={toggleWatchlist}
                    className="p-1.5 rounded-lg transition-all hover:scale-110"
                    title={watchlist.includes(stock.symbol) ? 'Remove from watchlist' : 'Add to watchlist'}
                  >
                    {watchlist.includes(stock.symbol)
                      ? <Star className="w-5 h-5 text-accent-500 fill-accent-500" />
                      : <StarOff className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />}
                  </button>
                </div>
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{stock.name}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-display font-bold font-mono" style={{ color: 'var(--text-primary)' }}>
                  {fmt2(stock.price)}
                </p>
                <p className={`flex items-center justify-end gap-1 text-sm font-semibold ${stock.change >= 0 ? 'text-up' : 'text-down'}`}>
                  {stock.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                </p>
              </div>
            </div>

            {/* Period selector */}
            <div className="flex gap-1.5 mb-4 p-1 rounded-xl w-fit" style={{ background: 'var(--bg-page)' }}>
              {PERIODS.map(p => (
                <button key={p} onClick={() => handlePeriodChange(p)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: period === p ? 'var(--bg-card)' : 'transparent',
                    color: period === p ? 'var(--sidebar-active-text)' : 'var(--text-muted)',
                    boxShadow: period === p ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  }}
                >{p.toUpperCase()}</button>
              ))}
            </div>

            {/* Chart */}
            <div ref={chartCb} className="w-full rounded-xl overflow-hidden" style={{ height: 340 }} />

            {chartSynthetic && (
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
              { label: 'Day High',   val: fmt2(stock.dayHigh),       icon: <TrendingUp  className="w-3.5 h-3.5 text-up" /> },
              { label: 'Day Low',    val: fmt2(stock.dayLow),        icon: <TrendingDown className="w-3.5 h-3.5 text-down" /> },
              { label: 'Prev Close', val: fmt2(stock.previousClose), icon: <BarChart2 className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} /> },
              { label: 'Volume',     val: stock.volume > 0 ? fmtN(stock.volume) : '—', icon: <ChevronDown className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} /> },
            ].map(({ label, val, icon }) => (
              <div key={label}>
                <div className="flex items-center gap-1.5 mb-1">{icon}<p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</p></div>
                <p className="font-semibold font-mono text-sm" style={{ color: 'var(--text-primary)' }}>{val}</p>
              </div>
            ))}
          </div>

          {/* News section */}
          <div
          className="h-fit rounded-2xl p-5 space-y-4 sticky top-6"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <h3 className="font-display font-semibold" style={{ color: 'var(--text-primary)' }}>Place Order</h3>

          {/* Balance */}
          <div className="rounded-xl px-4 py-3" style={{ background: 'var(--bg-page)' }}>
            <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Available Balance</p>
            <p className="text-xl font-bold font-mono mt-0.5" style={{ color: 'var(--text-primary)' }}>{fmt(balance)}</p>
          </div>

          {/* Holdings badge */}
          {currentHolding && (
            <div className="rounded-xl px-4 py-3 bg-primary-50 dark:bg-primary-900/20">
              <p className="text-xs font-medium text-primary-600 dark:text-primary-400">You own</p>
              <p className="text-xl font-bold text-primary-700 dark:text-primary-300 mt-0.5">
                {currentHolding.quantity} shares
              </p>
              {currentHolding.pnl !== undefined && (
                <p className={`text-xs font-semibold mt-0.5 ${currentHolding.pnl >= 0 ? 'text-up' : 'text-down'}`}>
                  P&L: {currentHolding.pnl >= 0 ? '+' : ''}{fmt2(currentHolding.pnl)} ({currentHolding.pnlPercent?.toFixed(2)}%)
                </p>
              )}
            </div>
          )}

          {/* Buy / Sell toggle */}
          <div className="grid grid-cols-2 gap-2">
            {(['BUY', 'SELL'] as const).map(t => (
              <button key={t} onClick={() => setOrderType(t)}
                className="py-2.5 rounded-xl font-semibold text-sm transition-all"
                style={{
                  background: orderType === t ? (t === 'BUY' ? '#10b981' : '#ef4444') : 'var(--bg-page)',
                  color: orderType === t ? 'white' : 'var(--text-secondary)',
                  border: `1.5px solid ${orderType === t ? 'transparent' : 'var(--border)'}`,
                }}
              >{t === 'BUY' ? 'Buy' : 'Sell'}</button>
            ))}
          </div>

          {/* Quantity */}
          <div>
            <label className="label">Quantity</label>
            <div className="flex items-center gap-2">
              <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                style={{ background: 'var(--bg-page)', border: '1px solid var(--border)' }}>
                <Minus className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
              </button>
              <input type="number" value={quantity} min="1"
                onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="input text-center flex-1 font-mono font-semibold" />
              <button onClick={() => setQuantity(q => q + 1)}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                style={{ background: 'var(--bg-page)', border: '1px solid var(--border)' }}>
                <Plus className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-2 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
            {[
              { label: 'Price per share', val: fmt2(stock.price) },
              { label: 'Quantity', val: quantity.toString() },
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
            disabled={orderLoading || todayTrades >= DAILY_LIMIT || (orderType === 'BUY' ? !canBuy : !canSell)}
            className="w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-98"
            style={{ background: orderType === 'BUY' ? '#10b981' : '#ef4444', color: 'white' }}
          >
            {orderLoading
              ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Processing…</span>
              : todayTrades >= DAILY_LIMIT
              ? '🐻 Daily limit reached'
              : `${orderType} ${quantity} Share${quantity > 1 ? 's' : ''}`}
          </button>

          {orderType === 'BUY' && !canBuy && todayTrades < DAILY_LIMIT && (
            <p className="text-xs text-down text-center">Insufficient balance</p>
          )}
          {orderType === 'SELL' && !canSell && (
            <p className="text-xs text-down text-center">
              {currentHolding ? 'Insufficient shares' : "You don't own this stock"}
            </p>
          )}

          {/* Trades left meter */}
          <div className="pt-2" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Daily trades</span>
              <span className="text-xs font-semibold" style={{ color: tradesLeft <= 5 ? '#ef4444' : 'var(--text-muted)' }}>
                {todayTrades}/{DAILY_LIMIT}
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-page)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(todayTrades / DAILY_LIMIT) * 100}%`,
                  background: todayTrades >= 25 ? '#ef4444' : todayTrades >= 20 ? '#f59e0b' : '#10b981',
                }}
              />
            </div>
          </div>
        </div>
        </div>

        {/* Right: Order Panel */}
        
        <div className="card sm:">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Newspaper className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Recent News</h2>
              </div>
              <button onClick={() => fetchNews(stock.symbol)}
                className="flex items-center gap-1 text-xs transition-colors"
                style={{ color: 'var(--text-muted)' }}>
                <RefreshCw className={`w-3 h-3 ${newsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {newsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="rounded-xl p-3 space-y-2" style={{ border: '1px solid var(--border)' }}>
                    <div className="skeleton h-4 w-3/4" />
                    <div className="skeleton h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : news.length > 0 ? (
              <div className="space-y-3">
                {news.map((item, i) => (
                  <a
                    key={i}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 p-3 rounded-xl transition-all group"
                    style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(20,184,166,0.4)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px -4px rgba(20,184,166,0.15)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-snug group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors"
                        style={{ color: 'var(--text-primary)' }}>
                        {item.headline}
                      </p>
                      {item.summary && (
                        <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{item.summary}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs font-medium text-primary-600 dark:text-primary-400">{item.source}</span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>·</span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{fmtDate(item.publishedAt)}</span>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 shrink-0 mt-0.5 opacity-40 group-hover:opacity-70 transition-opacity" style={{ color: 'var(--text-muted)' }} />
                  </a>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Newspaper className="w-8 h-8 mx-auto mb-2 opacity-30" style={{ color: 'var(--text-muted)' }} />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No recent news available for {stock.symbol}</p>
              </div>
            )}
          </div>
      </div>
    </div>
  );
}
