import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { portfolioApi, gamificationApi, tradingApi } from '../api/client';
import {
  TrendingUp, TrendingDown, Wallet, Target, Trophy,
  ChevronRight, Star, Lightbulb, RefreshCw, BarChart3,
  ArrowUpRight, Zap, BookOpen, Activity, CircleDollarSign, Award,
} from 'lucide-react';
import { FlameIcon } from '../components/gamification/GamificationUI';
import { DashboardSkeleton } from '../components/ui/Skeleton';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Holding {
  symbol: string;
  quantity: number;
  avgBuyPrice?: number;
  avg_buy_price?: number;
  currentPrice: number;
  investedValue: number;
  currentValue: number;
  pnl: number;
  pnlPercent: number;
}

interface PortfolioSummary {
  balance: number; investedValue: number; currentValue: number;
  totalPnL: number; totalPnLPercent: number; holdings: Holding[];
}

interface GamProfile {
  level: number; xp: number; xpToNextLevel: number;
  xpProgress: number; streak: number; totalBadges: number; rank: number;
}

interface Challenge {
  id: number; title: string; xpReward: number;
  progress: number; target: number; completed: boolean;
}

interface WatchlistItem { symbol: string; name: string; price: number; change: number; changePercent: number; }
interface TrendingStock  { symbol: string; name: string; price: number; changePercent: number; change: number; }

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getAvgPrice(h: Holding): number {
  const v = h.avgBuyPrice ?? h.avg_buy_price;
  const n = Number(v);
  return isNaN(n) || n <= 0 ? 0 : n;
}

const INR  = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 });
const INR2 = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fc   = (v: number) => INR.format(isNaN(v) || !isFinite(v) ? 0 : v);
const fc2  = (v: number) => INR2.format(isNaN(v) || !isFinite(v) ? 0 : v);
const pct  = (v: number, d = 2) => (isNaN(v) || !isFinite(v) ? 0 : v).toFixed(d);
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function isMarketOpen() {
  const ist = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  if (ist.getDay() === 0 || ist.getDay() === 6) return false;
  const m = ist.getHours() * 60 + ist.getMinutes();
  return m >= 555 && m <= 930;
}

// ─── Donut chart (pure SVG) ───────────────────────────────────────────────────

const PALETTE = ['#14b8a6','#10b981','#f59e0b','#ef4444','#0d9488','#06b6d4','#f97316','#ec4899'];

function DonutChart({ holdings }: { holdings: Holding[] }) {
  const total = holdings.reduce((s, h) => s + (h.currentValue || 0), 0);
  if (!total) return null;
  const R = 52, CX = 64, CY = 64, SW = 20, C = 2 * Math.PI * R;
  let cum = 0;
  const slices = holdings.map((h, i) => {
    const dash = ((h.currentValue || 0) / total) * C;
    const s = { dash, offset: cum, color: PALETTE[i % PALETTE.length], symbol: h.symbol, pct: (h.currentValue / total) * 100 };
    cum += dash;
    return s;
  });
  return (
    <div className="flex items-center gap-5">
      <svg width={128} height={128} className="shrink-0" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#f1f5f9" strokeWidth={SW} />
        {slices.map((s, i) => (
          <circle key={i} cx={CX} cy={CY} r={R} fill="none" stroke={s.color} strokeWidth={SW}
            strokeDasharray={`${s.dash} ${C - s.dash}`} strokeDashoffset={-s.offset}
            style={{ transition: 'stroke-dasharray 0.6s ease' }} />
        ))}
      </svg>
      <div className="flex-1 space-y-1.5 min-w-0">
        {slices.slice(0, 5).map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
            <span className="text-gray-700 font-medium truncate">{s.symbol.replace(/\.(BSE|NS|BO)$/i,'')}</span>
            <span className="ml-auto text-gray-400 tabular-nums shrink-0">{s.pct.toFixed(0)}%</span>
          </div>
        ))}
        {slices.length > 5 && <p className="text-xs text-gray-400 pl-4">+{slices.length - 5} more</p>}
      </div>
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, subColor = 'text-gray-400', icon: Icon, iconColor, barPct, barColor, className = '' }:
  { label: string; value: string; sub?: string; subColor?: string; icon?: any; iconColor?: string; barPct?: number; barColor?: string; className?: string }) {
  return (
    <div className={`card flex flex-col gap-1 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
        {Icon && <Icon className={`w-4 h-4 ${iconColor ?? 'text-gray-300'}`} />}
      </div>
      <p className="text-2xl font-bold text-gray-900 tabular-nums leading-tight">{value}</p>
      {sub && <p className={`text-xs font-medium ${subColor}`}>{sub}</p>}
      {barPct !== undefined && (
        <div className="mt-1 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ${barColor ?? 'bg-primary-500'}`}
            style={{ width: `${clamp(barPct, 0, 100)}%` }} />
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [portfolio,  setPortfolio]  = useState<PortfolioSummary | null>(null);
  const [gamProfile, setGamProfile] = useState<GamProfile | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [watchlist,  setWatchlist]  = useState<WatchlistItem[]>([]);
  const [trending,   setTrending]   = useState<TrendingStock[]>([]);
  const [tips,       setTips]       = useState<string[]>([]);
  const [tipIdx,     setTipIdx]     = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt,  setUpdatedAt]  = useState<Date | null>(null);
  const [mktOpen]                   = useState(isMarketOpen());

  const fetchAll = useCallback(async (silent = false) => {
    silent ? setRefreshing(true) : setLoading(true);
    try {
      const [pR, gR, cR, wR] = await Promise.allSettled([
        portfolioApi.getSummary(), gamificationApi.getProfile(),
        gamificationApi.getChallenges(), portfolioApi.getWatchlist(),
      ]);
      if (pR.status === 'fulfilled') setPortfolio(pR.value.data.data);
      if (gR.status === 'fulfilled') setGamProfile(gR.value.data.data);
      if (cR.status === 'fulfilled') setChallenges(cR.value.data.data.daily ?? []);
      if (wR.status === 'fulfilled') setWatchlist(wR.value.data.data ?? []);
      setUpdatedAt(new Date());
    } finally { setLoading(false); setRefreshing(false); }
    tradingApi.getInsights().then(r => setTips(r.data?.data?.staticTips ?? [])).catch(() => {});
    tradingApi.getRecommended().then(r => setTrending(r.data?.data ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    fetchAll();
    const id = setInterval(() => fetchAll(true), 60_000);
    return () => clearInterval(id);
  }, [fetchAll]);

  useEffect(() => {
    if (tips.length < 2) return;
    const id = setInterval(() => setTipIdx(i => (i + 1) % tips.length), 7000);
    return () => clearInterval(id);
  }, [tips]);

  const holdings      = portfolio?.holdings ?? [];
  const cash          = portfolio?.balance ?? 100_000;
  const mktValue      = portfolio?.currentValue ?? 0;
  const totalValue    = cash + mktValue;
  const overallPnL    = totalValue - 100_000;
  const overallPct    = (overallPnL / 100_000) * 100;
  const holdingPnL    = portfolio?.totalPnL ?? 0;
  const holdingPnLPct = portfolio?.totalPnLPercent ?? 0;
  const cashPct       = totalValue > 0 ? (cash / totalValue) * 100 : 100;
  const investedPct   = totalValue > 0 ? (mktValue / totalValue) * 100 : 0;
  const doneCount     = challenges.filter(c => c.completed).length;
  const hour          = new Date().getHours();
  const greet         = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-5 animate-fade-up">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {greet}, <span className="text-primary-600">{user?.username}</span> 
          </h1>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            {updatedAt && (
              <span className="text-xs text-gray-400">
                Updated {updatedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full
              ${mktOpen ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${mktOpen ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
              Market {mktOpen ? 'Open' : 'Closed'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {(gamProfile?.streak ?? 0) > 0 && (
            <div className="flex items-center gap-1.5 bg-orange-50 text-orange-600 px-3 py-1.5 rounded-lg text-sm font-medium">
              <FlameIcon size={16} />{gamProfile!.streak}d streak
            </div>
          )}
          <button onClick={() => fetchAll(true)} title="Refresh"
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <Link to="/trade" className="btn-primary flex items-center gap-2 text-sm">
            <Zap className="w-4 h-4" /> Trade Now
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard className="col-span-2 lg:col-span-1"
          label="Total Portfolio" value={fc(totalValue)}
          sub={`${overallPnL >= 0 ? '+' : ''}${fc(overallPnL)} (${pct(overallPct)}%) all-time`}
          subColor={overallPnL >= 0 ? 'text-emerald-500' : 'text-red-500'}
          icon={CircleDollarSign} iconColor="text-primary-400" />
        <StatCard
          label="Cash Available" value={fc(cash)}
          sub={`${pct(cashPct, 0)}% of portfolio`}
          icon={Wallet} iconColor="text-emerald-400"
          barPct={cashPct} barColor="bg-emerald-400" />
        <StatCard
          label="Invested" value={fc(mktValue)}
          sub={`${holdingPnL >= 0 ? '+' : ''}${fc(holdingPnL)} (${pct(holdingPnLPct)}%) unrealised`}
          subColor={holdingPnL >= 0 ? 'text-emerald-500' : 'text-red-500'}
          icon={BarChart3} iconColor="text-primary-400"
          barPct={investedPct} barColor="bg-primary-400" />
        <StatCard
          label={`Level ${gamProfile?.level ?? 1}`} value={`${gamProfile?.xp ?? 0} XP`}
          sub={`${gamProfile?.xpToNextLevel ?? 100} XP to next level`}
          icon={Star} iconColor="text-yellow-400"
          barPct={gamProfile?.xpProgress ?? 0} barColor="bg-yellow-400" />
      </div>

      {/* Middle: Holdings + Donut + Rank */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Holdings</h2>
            <Link to="/portfolio" className="text-xs text-primary-600 hover:underline flex items-center gap-0.5">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {holdings.length > 0 ? (
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-sm min-w-[480px]">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Stock','Qty','Avg Price','Current','P&L'].map(h => (
                      <th key={h} className={`pb-2 text-xs font-semibold text-gray-400 ${h==='Stock'?'text-left':'text-right'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {holdings.slice(0, 6).map(h => {
                    const ap = getAvgPrice(h);
                    const up = h.pnl >= 0;
                    return (
                      <tr key={h.symbol}
                        onClick={() => navigate(`/trade/${h.symbol.replace(/\.(BSE|NS|BO)$/i,'')}`)}
                        className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors group">
                        <td className="py-3">
                          <p className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                            {h.symbol.replace(/\.(BSE|NS|BO)$/i,'')}
                          </p>
                          <p className="text-xs text-gray-400">{fc(h.currentValue)}</p>
                        </td>
                        <td className="py-3 text-right text-gray-700 tabular-nums">{h.quantity}</td>
                        <td className="py-3 text-right text-gray-700 tabular-nums">
                          {ap > 0 ? fc2(ap) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="py-3 text-right text-gray-700 tabular-nums">
                          {h.currentPrice > 0 ? fc2(h.currentPrice) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="py-3 text-right">
                          <span className={`font-semibold tabular-nums ${up ? 'text-emerald-600' : 'text-red-500'}`}>
                            {up ? '+' : ''}{pct(h.pnlPercent)}%
                          </span>
                          <p className={`text-xs tabular-nums ${up ? 'text-emerald-500' : 'text-red-400'}`}>
                            {up ? '+' : ''}{fc(h.pnl)}
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-3">
                <Wallet className="w-7 h-7 text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-500 mb-1">No holdings yet</p>
              <p className="text-xs text-gray-400 mb-4">Start trading to build your portfolio</p>
              <Link to="/trade" className="btn-primary text-sm">Browse Stocks</Link>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="card flex-1">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900">Allocation</h2>
              <div className="flex gap-3 text-xs text-gray-400">
                <span>Cash <strong className="text-gray-700">{pct(cashPct,0)}%</strong></span>
                <span>Stocks <strong className="text-gray-700">{pct(investedPct,0)}%</strong></span>
              </div>
            </div>
            {holdings.length > 0 ? <DonutChart holdings={holdings} /> : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <BarChart3 className="w-8 h-8 text-gray-200 mb-2" />
                <p className="text-xs text-gray-400">Appears after your first trade</p>
              </div>
            )}
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Your Rank</p>
                <p className="text-3xl font-bold text-gray-900">{gamProfile?.rank ? `#${gamProfile.rank}` : '—'}</p>
                <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                  <Award className="w-3 h-3" />{gamProfile?.totalBadges ?? 0} badges earned
                </p>
              </div>
              <div className="w-12 h-12 bg-primary-50 dark:bg-primary-950/20 rounded-2xl flex items-center justify-center">
                <Trophy className="w-6 h-6 text-primary-600" />
              </div>
            </div>
            <Link to="/leaderboard" className="mt-3 text-xs font-medium text-primary-600 hover:underline flex items-center gap-1">
              View leaderboard <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Watchlist | Trending | Challenges */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-300" /> Watchlist
            </h2>
            <Link to="/trade" className="text-xs text-primary-600 hover:underline">+ Add</Link>
          </div>
          {watchlist.length > 0 ? (
            <div className="space-y-1">
              {watchlist.slice(0, 5).map(item => (
                <button key={item.symbol} onClick={() => navigate(`/trade/${item.symbol}`)}
                  className="w-full flex items-center justify-between px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors text-left group">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-gray-900 group-hover:text-primary-600 transition-colors">{item.symbol}</p>
                    <p className="text-xs text-gray-400 truncate max-w-[120px]">{item.name}</p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-bold text-gray-800 tabular-nums">{item.price > 0 ? fc(item.price) : '—'}</p>
                    <p className={`text-xs font-medium tabular-nums ${item.changePercent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {item.changePercent >= 0 ? '↑' : '↓'} {Math.abs(item.changePercent).toFixed(2)}%
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Star className="w-8 h-8 text-gray-200 mb-2" />
              <p className="text-xs text-gray-400 mb-2">No watchlisted stocks</p>
              <Link to="/trade" className="text-xs text-primary-600 hover:underline">Browse &amp; add stocks →</Link>
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-orange-500" /> Trending
            </h2>
            <Link to="/trade" className="text-xs text-primary-600 hover:underline">See all</Link>
          </div>
          {trending.length > 0 ? (
            <div className="space-y-1">
              {trending.slice(0, 5).map(s => (
                <button key={s.symbol} onClick={() => navigate(`/trade/${s.symbol}`)}
                  className="w-full flex items-center justify-between px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors text-left group">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${s.changePercent >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                      {s.changePercent >= 0
                        ? <TrendingUp className="w-3 h-3 text-emerald-500" />
                        : <TrendingDown className="w-3 h-3 text-red-500" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-gray-900 group-hover:text-primary-600 transition-colors">{s.symbol}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[100px]">{s.name}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="text-sm font-bold text-gray-800 tabular-nums">{s.price > 0 ? fc(s.price) : '—'}</p>
                    <p className={`text-xs font-medium tabular-nums ${s.changePercent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {s.changePercent >= 0 ? '+' : ''}{pct(s.changePercent)}%
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-2">{[...Array(5)].map((_,i) => <div key={i} className="h-10 bg-gray-50 rounded-lg animate-pulse" />)}</div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Target className="w-4 h-4 text-primary-500" /> Daily Challenges
            </h2>
            <span className="text-xs font-semibold text-gray-400">{doneCount}/{challenges.length}</span>
          </div>
          {challenges.length > 0 ? (
            <div className="space-y-3">
              {challenges.slice(0, 3).map(c => (
                <div key={c.id} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold mt-0.5
                    ${c.completed ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                    {c.completed ? '✓' : c.progress}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium leading-snug ${c.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                      {c.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${c.completed ? 'bg-emerald-400' : 'bg-primary-500'}`}
                          style={{ width: `${Math.min((c.progress / Math.max(c.target, 1)) * 100, 100)}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-primary-500 shrink-0">+{c.xpReward} XP</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Target className="w-8 h-8 text-gray-200 mb-2" />
              <p className="text-xs text-gray-400">No challenges today. Check back tomorrow!</p>
            </div>
          )}
        </div>
      </div>

      {/* Tips + Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {tips.length > 0 && (
          <div className="md:col-span-3 rounded-xl border border-indigo-100 bg-gradient-to-br from-primary-50 via-white dark:from-primary-950/30 to-primary-50/20 p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
              <Lightbulb className="w-4 h-4 text-primary-700 dark:text-primary-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest mb-1">Market Insight</p>
              <p className="text-sm text-gray-700 leading-relaxed">{tips[tipIdx]}</p>
              <div className="flex items-center gap-2 mt-2.5">
                <div className="flex gap-1">
                  {tips.slice(0, Math.min(tips.length, 8)).map((_, i) => (
                    <button key={i} onClick={() => setTipIdx(i)}
                      className={`transition-all duration-300 rounded-full
                        ${i === tipIdx ? 'w-4 h-1.5 bg-indigo-500' : 'w-1.5 h-1.5 bg-indigo-200 hover:bg-indigo-300'}`} />
                  ))}
                </div>
                <Link to="/trade" className="ml-auto text-xs text-primary-600 dark:text-primary-400 font-semibold hover:underline flex items-center gap-0.5">
                  Trade <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className={`${tips.length > 0 ? 'md:col-span-2' : 'md:col-span-5'} card`}>
          <h2 className="font-semibold text-gray-900 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { to: '/trade',       bg: 'bg-primary-50 hover:bg-primary-100',  icon: TrendingUp,  color: 'text-primary-700',  label: 'Trade'       },
              { to: '/learn',       bg: 'bg-emerald-50 hover:bg-emerald-100',  icon: BookOpen,    color: 'text-emerald-700',  label: 'Learn'       },
              { to: '/algo',        bg: 'bg-primary-50 dark:bg-primary-950/20  hover:bg-violet-100',   icon: Zap,         color: 'text-violet-700',   label: 'Algo'        },
              { to: '/leaderboard', bg: 'bg-orange-50  hover:bg-orange-100',   icon: Trophy,      color: 'text-orange-700',   label: 'Leaderboard' },
            ].map(({ to, bg, icon: Icon, color, label }) => (
              <Link key={to} to={to} className={`${bg} rounded-xl p-3 flex items-center gap-2.5 transition-colors group`}>
                <Icon className={`w-4 h-4 ${color} shrink-0`} />
                <span className={`text-sm font-semibold ${color}`}>{label}</span>
                <ChevronRight className={`w-3 h-3 ${color} ml-auto opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all`} />
              </Link>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
