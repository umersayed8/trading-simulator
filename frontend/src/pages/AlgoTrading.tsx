import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { algoApi, tradingApi } from '../api/client';
import {
  Bot, Play, Settings, BarChart3, AlertCircle,
  TrendingUp, TrendingDown, Search, X, ChevronRight,
  Info, Loader2, RefreshCw, CheckCircle2, Minus, Plus,
  BookOpen, Zap, Shield, Activity,
} from 'lucide-react';
import { createChart, IChartApi, ISeriesApi, ColorType } from 'lightweight-charts';
import { MascotEmpty } from '../components/mascot/Mascot';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StrategyConfig {
  id: string;
  name: string;
  description: string;
  riskLevel?: 'Low' | 'Medium' | 'High';
  parameters: Record<string, {
    type: string; default: number; min: number; max: number; description?: string;
  }>;
}

interface BacktestResult {
  backtestId: string;
  strategy: string;
  symbol: string;
  period: string;
  initialCapital: number;
  finalValue: number;
  totalReturn: number;
  totalTrades: number;
  winRate: number;
  maxDrawdown: number;
  sharpeRatio?: number;
  dataPoints?: number;
  trades: Array<{
    date: string; type: 'BUY' | 'SELL'; price: number;
    quantity: number; signal: string; value: number; pnl?: number;
  }>;
}

// ─── Strategy how-it-works blurbs ─────────────────────────────────────────────

const STRATEGY_EXPLAINERS: Record<
  string,
  { how: string; good: string; bad: string; icon: React.FC<any> }
> = {
  ma_crossover: {
    icon: Activity,
    how: 'Tracks two moving averages of different lengths. When the faster (short) MA crosses above the slower (long) MA it is a "Golden Cross" → Buy signal. When it crosses below → "Death Cross" → Sell.',
    good: "Works well in trending markets. Easy to understand. Reduces emotional decisions.",
    bad: "Lags behind price — signals come late. Produces many false signals in sideways markets.",
  },

  rsi: {
    icon: BarChart3,
    how: "RSI measures how fast price has moved recently on a 0–100 scale. Below 30 = oversold (potential buy). Above 70 = overbought (potential sell).",
    good: "Great at spotting reversals and exhausted trends. Works in ranging (sideways) markets.",
    bad: "Can stay overbought/oversold for a long time in strong trends. Use with other signals.",
  },

  momentum: {
    icon: Zap,
    how: "Calculates the percentage price change over a lookback window. If price is up more than the threshold%, buy. If down more than the threshold%, sell.",
    good: "Captures strong trending moves quickly. Simple and easy to tune.",
    bad: "Can trigger at tops/bottoms right before reversals. Volatile in choppy markets.",
  },
};


const RISK_COLORS = {
  Low:    'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
  Medium: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  High:   'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const INR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const fmt = (v: number) => INR.format(isNaN(v) || !isFinite(v) ? 0 : v);
const pct = (v: number, d = 2) => (isNaN(v) || !isFinite(v) ? 0 : v).toFixed(d);

// Build equity curve from trades + prices
function buildEquityCurve(result: BacktestResult): Array<{ time: string; value: number }> {
  if (!result.trades.length) return [];
  const pts: Array<{ time: string; value: number }> = [
    { time: result.trades[0]?.date ?? '', value: result.initialCapital },
  ];
  let portfolio = result.initialCapital;
  for (const t of result.trades) {
    if (t.type === 'SELL' && t.pnl !== undefined) {
      portfolio += t.pnl;
    }
    pts.push({ time: t.date, value: Math.round(portfolio) });
  }
  return pts;
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatBox({ label, value, sub, color = '' }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="rounded-xl p-4" style={{ background: 'var(--bg-page)', border: '1px solid var(--border)' }}>
      <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className={`text-xl font-bold font-mono ${color}`}>{value}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
    </div>
  );
}

function EquityChart({ result }: { result: BacktestResult }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef     = useRef<IChartApi | null>(null);
  const seriesRef    = useRef<ISeriesApi<'Area'> | null>(null);

  const init = useCallback((node: HTMLDivElement | null) => {
    if (chartRef.current) { try { chartRef.current.remove(); } catch {} chartRef.current = null; seriesRef.current = null; }
    if (!node) return;
    const dark   = document.documentElement.classList.contains('dark');
    const bg     = dark ? '#131d2e' : '#ffffff';
    const grid   = dark ? 'rgba(255,255,255,0.05)' : '#f1f5f9';
    const border = dark ? 'rgba(255,255,255,0.08)' : '#e2e8f0';
    const text   = dark ? '#64748b' : '#94a3b8';

    const chart = createChart(node, {
      layout: { background: { type: ColorType.Solid, color: bg }, textColor: text, fontFamily: "'DM Sans', system-ui" },
      grid: { vertLines: { color: grid }, horzLines: { color: grid } },
      rightPriceScale: { borderColor: border },
      timeScale: { borderColor: border, timeVisible: false },
      width: node.clientWidth || 500,
      height: 200,
    });
    const area = chart.addAreaSeries({
      lineColor: result.totalReturn >= 0 ? '#10b981' : '#ef4444',
      topColor:  result.totalReturn >= 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
      bottomColor: 'rgba(0,0,0,0)',
      lineWidth: 2,
      priceLineVisible: false,
      crosshairMarkerVisible: true,
    });
    const curve = buildEquityCurve(result);
    if (curve.length > 1) {
      const seen = new Set<string>();
      const deduped = curve
        .filter(p => p.time && !seen.has(p.time) && seen.add(p.time))
        .sort((a, b) => a.time.localeCompare(b.time)) as any[];
      try { area.setData(deduped); chart.timeScale().fitContent(); } catch {}
    }
    chartRef.current = chart;
    seriesRef.current = area as any;
    const ro = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect?.width;
      if (w && chartRef.current) chartRef.current.applyOptions({ width: w });
    });
    ro.observe(node);
    (node as any).__cleanup = () => { ro.disconnect(); try { chart.remove(); } catch {} };
  }, [result]);

  const cbRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) { const prev = (containerRef as any).current; prev?.__cleanup?.(); }
    (containerRef as any).current = node;
    init(node);
  }, [init]);

  return <div ref={cbRef} className="w-full rounded-xl overflow-hidden" style={{ height: 200 }} />;
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function AlgoTrading() {
  const [strategies,       setStrategies]       = useState<StrategyConfig[]>([]);
  const [selected,         setSelected]         = useState<StrategyConfig | null>(null);
  const [parameters,       setParameters]       = useState<Record<string, number>>({});
  const [symbol,           setSymbol]           = useState('RELIANCE.NS');
  const [symbolQuery,      setSymbolQuery]      = useState('');
  const [searchResults,    setSearchResults]    = useState<any[]>([]);
  const [startDate,        setStartDate]        = useState('2023-01-01');
  const [endDate,          setEndDate]          = useState('2024-12-31');
  const [initialCapital,   setInitialCapital]   = useState(100000);
  const [result,           setResult]           = useState<BacktestResult | null>(null);
  const [loading,          setLoading]          = useState(true);
  const [running,          setRunning]          = useState(false);
  const [error,            setError]            = useState<string | null>(null);
  const [showExplainer,    setShowExplainer]    = useState(false);
  const [tradeTab,         setTradeTab]         = useState<'chart' | 'log'>('chart');

  // ─── Init ───────────────────────────────────────────────────────────────

  useEffect(() => {
    algoApi.getStrategies()
      .then(r => {
        const list: StrategyConfig[] = r.data.data;
        setStrategies(list);
        if (list.length) {
          setSelected(list[0]);
          const defaults: Record<string, number> = {};
          Object.entries(list[0].parameters).forEach(([k, v]) => { defaults[k] = v.default; });
          setParameters(defaults);
        }
      })
      .catch(() => setError('Could not load strategies'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) return;
    const defaults: Record<string, number> = {};
    Object.entries(selected.parameters).forEach(([k, v]) => { defaults[k] = v.default; });
    setParameters(defaults);
  }, [selected]);

  // Symbol search debounce
  useEffect(() => {
    const t = setTimeout(async () => {
      if (symbolQuery.length >= 1) {
        try { setSearchResults((await tradingApi.searchStocks(symbolQuery)).data.data); } catch {}
      } else { setSearchResults([]); }
    }, 300);
    return () => clearTimeout(t);
  }, [symbolQuery]);

  // ─── Run backtest ────────────────────────────────────────────────────────

  const runBacktest = async () => {
    if (!selected) return;
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await algoApi.runBacktest({
        strategyId: selected.id, symbol, parameters, startDate, endDate, initialCapital,
      });
      setResult(res.data.data);
      setTradeTab('chart');
    } catch (e: any) {
      const msg = e?.response?.data?.error?.message ?? e?.message ?? 'Backtest failed';
      setError(msg);
    } finally { setRunning(false); }
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────

  const explainer = selected ? STRATEGY_EXPLAINERS[selected.id] : null;
  const ExIcon    = explainer?.icon ?? Bot;

  const paramLabel = (key: string) =>
    key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 rounded-lg w-56" style={{ background: 'var(--bg-card)' }} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 rounded-2xl" style={{ background: 'var(--bg-card)' }} />)}
        </div>
        <div className="lg:col-span-2 h-96 rounded-2xl" style={{ background: 'var(--bg-card)' }} />
      </div>
    </div>
  );

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 animate-fade-up">

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>
            Algorithmic Trading
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Backtest trading strategies on historical data — no real money
          </p>
        </div>
        {/* Educational flag */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium"
          style={{ background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.2)', color: 'var(--text-secondary)' }}
        >
          <BookOpen className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400 shrink-0" />
          Educational simulator — past performance ≠ future results
        </div>
      </div>

      {/* ── Algo lessons CTA ── */}
      <Link
        to="/learn"
        className="flex items-center justify-between gap-4 px-5 py-3.5 rounded-2xl transition-all hover:scale-[1.01] group"
        style={{ background: 'linear-gradient(135deg, rgba(20,184,166,0.1), rgba(13,148,136,0.05))', border: '1px solid rgba(20,184,166,0.2)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              New: Algo Trading Lessons available
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              4 lessons covering algo basics, MA Crossover, RSI, Momentum &amp; how to use this page
            </p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 shrink-0 group-hover:translate-x-1 transition-transform" style={{ color: 'var(--text-muted)' }} />
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ══════════════════════════════════════
            LEFT: Configuration panel
        ══════════════════════════════════════ */}
        <div className="space-y-4">

          {/* ── Strategy selector ── */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Bot className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                Strategy
              </h2>
              {selected && (
                <button
                  onClick={() => setShowExplainer(!showExplainer)}
                  className="flex items-center gap-1 text-xs transition-colors"
                  style={{ color: showExplainer ? '#14b8a6' : 'var(--text-muted)' }}
                >
                  <Info className="w-3.5 h-3.5" />
                  {showExplainer ? 'Hide' : 'How it works'}
                </button>
              )}
            </div>

            <div className="space-y-2">
              {strategies.map(s => {
                const isActive  = selected?.id === s.id;
                const explInfo  = STRATEGY_EXPLAINERS[s.id];
                const SIcon     = explInfo?.icon ?? Bot;
                const risk      = (s as any).riskLevel ?? 'Medium';
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelected(s)}
                    className="w-full text-left p-3 rounded-xl transition-all"
                    style={{
                      border: `1.5px solid ${isActive ? '#14b8a6' : 'var(--border)'}`,
                      background: isActive ? 'rgba(20,184,166,0.07)' : 'var(--bg-page)',
                    }}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: isActive ? 'rgba(20,184,166,0.15)' : 'var(--border)' }}
                      >
                        <SIcon className="w-4 h-4" style={{ color: isActive ? '#0d9488' : 'var(--text-muted)' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                            {s.name}
                          </span>
                          <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${RISK_COLORS[risk as keyof typeof RISK_COLORS] || RISK_COLORS.Medium}`}>
                            {risk}
                          </span>
                        </div>
                        <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                          {s.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Strategy explainer panel */}
            {showExplainer && selected && explainer && (
              <div className="mt-3 rounded-xl p-3 space-y-2 animate-fade-up text-xs"
                   style={{ background: 'var(--bg-page)', border: '1px solid var(--border)' }}>
                <p style={{ color: 'var(--text-secondary)' }}><strong style={{ color: 'var(--text-primary)' }}>How it works:</strong> {explainer.how}</p>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <p className="font-semibold text-up mb-0.5">Strengths</p>
                    <p style={{ color: 'var(--text-muted)' }}>{explainer.good}</p>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-down mb-0.5">Weaknesses</p>
                    <p style={{ color: 'var(--text-muted)' }}>{explainer.bad}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Stock symbol ── */}
          <div className="card">
            <h2 className="font-semibold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>
              Stock Symbol
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              <input
                className="input pl-9 pr-8 text-sm"
                placeholder="Search or type symbol…"
                value={symbolQuery || symbol}
                onChange={e => setSymbolQuery(e.target.value)}
                onFocus={() => setSymbolQuery('')}
              />
              {symbolQuery && (
                <button onClick={() => { setSymbolQuery(''); setSearchResults([]); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {searchResults.length > 0 && (
              <div className="mt-1.5 rounded-xl overflow-hidden animate-fade-down"
                   style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                {searchResults.slice(0, 6).map(r => (
                  <button key={r.symbol}
                    onClick={() => { setSymbol(r.symbol); setSymbolQuery(''); setSearchResults([]); }}
                    className="w-full flex items-center justify-between px-3 py-2 text-left text-sm transition-colors"
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--sidebar-hover-bg)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{r.symbol}</span>
                    <span className="text-xs truncate ml-2" style={{ color: 'var(--text-muted)' }}>{r.name}</span>
                  </button>
                ))}
              </div>
            )}
            <p className="text-xs mt-2 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
              <CheckCircle2 className="w-3.5 h-3.5 text-up" />
              Backtesting: <strong style={{ color: 'var(--text-secondary)' }}>{symbol}</strong>
            </p>
          </div>

          {/* ── Parameters ── */}
          {selected && Object.keys(selected.parameters).length > 0 && (
            <div className="card">
              <h2 className="font-semibold text-sm mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Settings className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                Parameters
              </h2>
              <div className="space-y-4">
                {Object.entries(selected.parameters).map(([key, cfg]) => (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                        {paramLabel(key)}
                      </label>
                      {cfg.description && (
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{cfg.description}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setParameters(p => ({ ...p, [key]: Math.max(cfg.min, (p[key] ?? cfg.default) - 1) }))}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0"
                        style={{ background: 'var(--bg-page)', border: '1px solid var(--border)' }}
                      >
                        <Minus className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} />
                      </button>
                      <input
                        type="number"
                        value={parameters[key] ?? cfg.default}
                        onChange={e => setParameters(p => ({ ...p, [key]: parseFloat(e.target.value) || cfg.default }))}
                        min={cfg.min} max={cfg.max}
                        className="input text-center text-sm font-mono font-semibold flex-1"
                      />
                      <button
                        onClick={() => setParameters(p => ({ ...p, [key]: Math.min(cfg.max, (p[key] ?? cfg.default) + 1) }))}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0"
                        style={{ background: 'var(--bg-page)', border: '1px solid var(--border)' }}
                      >
                        <Plus className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} />
                      </button>
                    </div>
                    {/* Range slider */}
                    <div className="mt-1.5 relative h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                      <div
                        className="absolute left-0 top-0 h-full rounded-full bg-brand-gradient"
                        style={{ width: `${((( parameters[key] ?? cfg.default) - cfg.min) / (cfg.max - cfg.min)) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Range: {cfg.min} – {cfg.max}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Date / Capital ── */}
          <div className="card">
            <h2 className="font-semibold text-sm mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <BarChart3 className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              Backtest Settings
            </h2>
            <div className="space-y-3">
              <div>
                <label className="label">Start Date</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input text-sm" />
              </div>
              <div>
                <label className="label">End Date</label>
                <input type="date" value={endDate}   onChange={e => setEndDate(e.target.value)}   className="input text-sm" />
              </div>
              <div>
                <label className="label">Initial Capital (₹)</label>
                <input
                  type="number" value={initialCapital}
                  onChange={e => setInitialCapital(Math.max(1000, parseFloat(e.target.value) || 100000))}
                  min={1000} className="input text-sm font-mono"
                />
              </div>
            </div>
          </div>

          {/* ── Run button ── */}
          <button
            onClick={runBacktest}
            disabled={running || !selected}
            className="w-full py-3.5 rounded-xl font-semibold text-sm text-white bg-brand-gradient
                       transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2
                       hover:shadow-glow-teal"
          >
            {running
              ? <><Loader2 className="w-4 h-4 animate-spin" />Running Backtest…</>
              : <><Play  className="w-4 h-4" />Run Backtest</>}
          </button>
        </div>

        {/* ══════════════════════════════════════
            RIGHT: Results panel
        ══════════════════════════════════════ */}
        <div className="lg:col-span-2 space-y-5">

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl text-sm animate-fade-down"
                 style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--text-secondary)' }}>
              <AlertCircle className="w-4 h-4 text-down shrink-0 mt-0.5" />
              <span className="flex-1">{error}</span>
              <button onClick={() => setError(null)}><X className="w-4 h-4" style={{ color: 'var(--text-muted)' }} /></button>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-4 animate-fade-up">

              {/* Summary header */}
              <div className="card">
                <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest mb-1 text-primary-600 dark:text-primary-400">
                      Backtest Complete
                    </p>
                    <h2 className="text-lg font-display font-bold" style={{ color: 'var(--text-primary)' }}>
                      {result.strategy} — {result.symbol}
                    </h2>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      Period: {result.period} · {result.dataPoints ?? '–'} trading days
                    </p>
                  </div>
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-lg font-mono ${
                    result.totalReturn >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                  }`}>
                    {result.totalReturn >= 0
                      ? <TrendingUp className="w-5 h-5" />
                      : <TrendingDown className="w-5 h-5" />}
                    {result.totalReturn >= 0 ? '+' : ''}{pct(result.totalReturn)}%
                  </div>
                </div>

                {/* Stat grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatBox
                    label="Final Value"
                    value={fmt(result.finalValue)}
                    sub={`Started at ${fmt(result.initialCapital)}`}
                    color={result.finalValue >= result.initialCapital ? 'text-up' : 'text-down'}
                  />
                  <StatBox
                    label="Win Rate"
                    value={`${pct(result.winRate, 1)}%`}
                    sub={`${result.totalTrades} total trades`}
                    color={result.winRate >= 50 ? 'text-up' : 'text-down'}
                  />
                  <StatBox
                    label="Max Drawdown"
                    value={`-${pct(result.maxDrawdown)}%`}
                    sub="Worst peak-to-trough"
                    color="text-down"
                  />
                  <StatBox
                    label="Sharpe Ratio"
                    value={result.sharpeRatio !== undefined ? pct(result.sharpeRatio) : '—'}
                    sub="Risk-adjusted return"
                    color={
                      result.sharpeRatio !== undefined
                        ? result.sharpeRatio > 1 ? 'text-up' : result.sharpeRatio < 0 ? 'text-down' : ''
                        : ''
                    }
                  />
                </div>
              </div>

              {/* Equity curve + trade log tabs */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--bg-page)' }}>
                    {(['chart', 'log'] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setTradeTab(tab)}
                        className="px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
                        style={{
                          background: tradeTab === tab ? 'var(--bg-card)' : 'transparent',
                          color: tradeTab === tab ? 'var(--sidebar-active-text)' : 'var(--text-muted)',
                          boxShadow: tradeTab === tab ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                        }}
                      >
                        {tab === 'chart' ? 'Equity Curve' : `Trade Log (${result.trades.length})`}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {result.totalTrades} executions
                  </p>
                </div>

                {tradeTab === 'chart' ? (
                  result.trades.length >= 2
                    ? <EquityChart result={result} />
                    : (
                      <div className="flex items-center justify-center h-48 rounded-xl" style={{ background: 'var(--bg-page)' }}>
                        <div className="text-center">
                          <BarChart3 className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
                          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                            Not enough trades to plot an equity curve
                          </p>
                        </div>
                      </div>
                    )
                ) : (
                  result.trades.length > 0 ? (
                    <div className="overflow-x-auto -mx-1">
                      <table className="w-full text-xs min-w-[520px]">
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border)' }}>
                            {['Date', 'Type', 'Price', 'Qty', 'Value', 'Signal'].map(h => (
                              <th key={h}
                                className={`pb-2 font-semibold ${h === 'Signal' ? 'text-left pl-2' : h === 'Date' || h === 'Type' ? 'text-left' : 'text-right'}`}
                                style={{ color: 'var(--text-muted)' }}
                              >{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {result.trades.slice(0, 30).map((t, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}
                              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--sidebar-hover-bg)'}
                              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                            >
                              <td className="py-2 font-mono" style={{ color: 'var(--text-secondary)' }}>{t.date}</td>
                              <td className="py-2">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-xs ${
                                  t.type === 'BUY' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                                }`}>
                                  {t.type === 'BUY' ? <Plus className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                                  {t.type}
                                </span>
                              </td>
                              <td className="py-2 text-right font-mono" style={{ color: 'var(--text-secondary)' }}>{fmt(t.price)}</td>
                              <td className="py-2 text-right font-mono" style={{ color: 'var(--text-secondary)' }}>{t.quantity}</td>
                              <td className="py-2 text-right font-mono" style={{ color: 'var(--text-secondary)' }}>{fmt(t.value)}</td>
                              <td className="py-2 pl-2 max-w-xs truncate text-xs" style={{ color: 'var(--text-muted)' }}>{t.signal}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {result.trades.length > 30 && (
                        <p className="text-center text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
                          Showing 30 of {result.trades.length} trades
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-32 rounded-xl" style={{ background: 'var(--bg-page)' }}>
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No trades were executed in this period</p>
                    </div>
                  )
                )}
              </div>

              {/* Interpretation card */}
              <div className="rounded-xl p-4 text-sm"
                   style={{ background: 'rgba(20,184,166,0.06)', border: '1px solid rgba(20,184,166,0.15)' }}>
                <p className="font-semibold mb-2 text-primary-700 dark:text-primary-300 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  How to read these results
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5" style={{ color: 'var(--text-secondary)' }}>
                  <p><strong style={{ color: 'var(--text-primary)' }}>Win Rate</strong> — % of sell trades that were profitable</p>
                  <p><strong style={{ color: 'var(--text-primary)' }}>Max Drawdown</strong> — worst portfolio dip from any peak</p>
                  <p><strong style={{ color: 'var(--text-primary)' }}>Sharpe Ratio</strong> — return earned per unit of risk (&gt;1 = good)</p>
                  <p><strong style={{ color: 'var(--text-primary)' }}>Equity Curve</strong> — how portfolio value changed over time</p>
                </div>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!result && !error && !running && (
            <div className="card min-h-96 flex items-center justify-center">
              <MascotEmpty
                mood="thinking"
                title="Configure and run a backtest"
                subtitle="Select a strategy, pick a stock, set the date range, then hit Run."
                size={100}
                action={
                  <button onClick={runBacktest} disabled={!selected}
                    className="btn-primary text-sm px-5 py-2.5 mt-2">
                    <Play className="w-4 h-4" />
                    Run Backtest
                  </button>
                }
              />
            </div>
          )}

          {/* Running animation */}
          {running && (
            <div className="card min-h-96 flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-full bg-brand-gradient flex items-center justify-center animate-pulse-soft">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <div className="text-center">
                <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Running backtest…</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                  Simulating {selected?.name} on {symbol}
                </p>
              </div>
              <div className="flex gap-1.5">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="w-2 h-2 rounded-full bg-primary-500 animate-bounce-soft"
                       style={{ animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
