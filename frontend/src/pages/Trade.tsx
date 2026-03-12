import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tradingApi, portfolioApi } from '../api/client';
import {
  Search, TrendingUp, TrendingDown,
  Star, StarOff, Loader2, Lightbulb, RefreshCw, Target,
  X, BarChart2, Coffee,
} from 'lucide-react';
import { TradeSkeleton } from '../components/ui/Skeleton';
import { MascotEmpty, MascotSpeech } from '../components/mascot/Mascot';
import { FlameIcon } from '../components/gamification/GamificationUI';

interface SearchResult { symbol: string; name: string; exchange: string; }
interface RecommendedStock { symbol: string; name: string; price: number; changePercent: number; change: number; }
interface Insight {
  stockId: string; stockName: string; label: string;
  meanScore: number; analysts: number; priceTarget: number | null; tip: string;
}
interface InsightsData { insights: Insight[]; staticTips: string[]; }

const KATE_BREAK_MESSAGES = [
  "Hey! You've been trading for a while — maybe grab some water? 💧",
  "Remember: the best investors know when to step away! Take a 5-minute break 🌿",
  "Trading is a marathon, not a sprint. Rest up, I'll watch the markets! 🐻",
  "You've made several trades today. Reflect on your strategy before the next one! 📊",
  "Mindful trading = better decisions. Take a breather! 🌬️",
];

export default function Trade() {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery]   = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);

  const [recommended, setRecommended]   = useState<RecommendedStock[]>([]);
  const [insightsData, setInsightsData] = useState<InsightsData | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [recLoading, setRecLoading]     = useState(false);
  const [tipIndex, setTipIndex]         = useState(0);

  // Addiction control state
  const [todayTrades, setTodayTrades]   = useState(0);
  const [kateMessage, setKateMessage]   = useState<string | null>(null);
  const [lastBreakReminder, setLastBreakReminder] = useState(0);
  const DAILY_LIMIT = 30;

  useEffect(() => {
    (async () => {
      try {
        const tc = await tradingApi.getTodayTradeCount();
        setTodayTrades(tc.data.data.count);
      } catch {}
      finally { setInitialLoading(false); }
    })();
    fetchRecommended();
    fetchInsights();
  }, []);

  // Kate break reminder every 10 trades
  useEffect(() => {
    if (todayTrades > 0 && todayTrades % 10 === 0 && todayTrades !== lastBreakReminder) {
      const msg = KATE_BREAK_MESSAGES[Math.floor(Math.random() * KATE_BREAK_MESSAGES.length)];
      setKateMessage(msg);
      setLastBreakReminder(todayTrades);
    }
  }, [todayTrades]);

  useEffect(() => {
    const tips = insightsData?.staticTips ?? [];
    if (!tips.length) return;
    const id = setInterval(() => setTipIndex(i => (i + 1) % tips.length), 6000);
    return () => clearInterval(id);
  }, [insightsData?.staticTips]);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (searchQuery.length >= 1) {
        try { setSearchResults((await tradingApi.searchStocks(searchQuery)).data.data); }
        catch { setSearchResults([]); }
      } else { setSearchResults([]); }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

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

  const goToStock = (symbol: string) => {
    setSearchQuery('');
    setSearchResults([]);
    navigate(`/stocks/${symbol}`);
  };

  const fmt = (v: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

  const insightBadge = (label: string) =>
    ['Strong Buy', 'Outperform'].includes(label) ? 'badge-success' :
      label === 'Hold' ? 'badge-warning' : 'badge-danger';

  const tradesLeft = DAILY_LIMIT - todayTrades;

  if (initialLoading) return <TradeSkeleton />;

  return (
    <div className="space-y-5 animate-fade-up">

      {/* Page title + trade counter */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>
          Trade Stocks
        </h1>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold"
          style={{
            background: tradesLeft <= 5 ? 'rgba(239,68,68,0.1)' : 'var(--bg-card)',
            border: `1px solid ${tradesLeft <= 5 ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`,
            color: tradesLeft <= 5 ? '#ef4444' : 'var(--text-muted)',
          }}
        >
          🐻 {todayTrades}/{DAILY_LIMIT} today
        </div>
      </div>

      {/* Kate break reminder */}
      {kateMessage && (
        <div className="animate-fade-down">
          <div className="relative">
            <button
              onClick={() => setKateMessage(null)}
              className="absolute top-2 right-2 p-1 rounded-full z-10"
              style={{ color: 'var(--text-muted)' }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <MascotSpeech message={kateMessage} mood="warning" name="Kate" size={80} />
          </div>
        </div>
      )}

      {/* Daily limit reached */}
      {todayTrades >= DAILY_LIMIT && (
        <div className="animate-fade-down">
          <div className="relative">
            <MascotSpeech
              message="You've hit your 30-trade daily limit! I'm proud of your hustle, but it's time to rest. Come back tomorrow with fresh eyes! 🌙"
              mood="warning" name="Kate" size={90}
            />
          </div>
        </div>
      )}

      {/* Daily progress bar */}
      {todayTrades > 0 && (
        <div className="card py-3 px-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Coffee className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Daily trade limit</span>
            </div>
            <span className="text-xs font-semibold" style={{ color: tradesLeft <= 5 ? '#ef4444' : 'var(--text-secondary)' }}>
              {tradesLeft} remaining
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-page)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min((todayTrades / DAILY_LIMIT) * 100, 100)}%`,
                background: todayTrades >= 25 ? '#ef4444' : todayTrades >= 20 ? '#f59e0b' : '#10b981',
              }}
            />
          </div>
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
            <button onClick={() => { setSearchQuery(''); setSearchResults([]); }}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-muted)' }}>
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {searchResults.map(r => (
          <button
            key={r.symbol}
            onClick={() => goToStock(r.symbol)}
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

      {/* Trending Stocks */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FlameIcon size={18} />
            <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Popular &amp; Trending</h2>
          </div>
          <button onClick={fetchRecommended}
            className="flex items-center gap-1 text-xs transition-colors"
            style={{ color: 'var(--text-muted)' }}>
            <RefreshCw className={`w-3 h-3 ${recLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {recLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-xl p-3 space-y-2" style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                <div className="skeleton h-4 w-20" /><div className="skeleton h-3 w-28" />
                <div className="skeleton h-5 w-24 mt-2" /><div className="skeleton h-3 w-14" />
              </div>
            ))}
          </div>
        ) : recommended.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {recommended.slice(0, 8).map((stock, i) => (
              <button
                key={stock.symbol}
                onClick={() => goToStock(stock.symbol)}
                className="p-3 rounded-xl text-left transition-all group animate-fade-up"
                style={{ border: '1px solid var(--border)', background: 'var(--bg-card)', animationDelay: `${i * 40}ms` }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(20,184,166,0.4)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px -4px rgba(20,184,166,0.2)';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{stock.symbol}</p>
                    <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>{stock.name}</p>
                  </div>
                  {stock.changePercent >= 0
                    ? <TrendingUp className="w-4 h-4 text-up shrink-0 ml-1" />
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
          <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>No trending data available right now.</p>
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
              <button
                key={ins.stockId}
                onClick={() => goToStock(ins.stockId)}
                className="p-3 rounded-xl transition-colors text-left"
                style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(20,184,166,0.4)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{ins.stockId}</span>
                  <span className={insightBadge(ins.label)}>{ins.label}</span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{ins.tip}</p>
                {ins.priceTarget && (
                  <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 mt-1.5 flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    Target: ₹{ins.priceTarget.toFixed(2)}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      <div className="card">
        <MascotEmpty
          mood="happy"
          title="Search or tap a stock to get started"
          subtitle="Each stock opens a full detail page with chart, news, and order panel."
          size={100}
        />
      </div>
    </div>
  );
}
