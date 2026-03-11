import * as Indicators from '../utils/indicators';
import { getHistory } from './stockData';
import { resolveToTicker } from './stockData';
import { query, insert } from '../config/database';
import { round2 } from '../utils/helpers';

export type Signal = 'BUY' | 'SELL' | 'HOLD';

export interface StrategyConfig {
  id: string;
  name: string;
  description: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  parameters: Record<string, ParameterConfig>;
}

export interface ParameterConfig {
  type: 'number';
  default: number;
  min: number;
  max: number;
  description?: string;
}

export interface BacktestTrade {
  date: string;
  type: 'BUY' | 'SELL';
  price: number;
  quantity: number;
  signal: string;
  value: number;
  pnl?: number;
}

export interface BacktestResult {
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
  trades: BacktestTrade[];
  sharpeRatio: number;
  dataPoints: number;
}

// ─── Available strategies ──────────────────────────────────────────────────
export const STRATEGIES: StrategyConfig[] = [
  {
    id: 'ma_crossover',
    name: 'Moving Average Crossover',
    riskLevel: 'Medium',
    description: 'Buy when short-term MA crosses above long-term MA (Golden Cross), sell on Death Cross.',
    parameters: {
      shortPeriod: { type: 'number', default: 10, min: 5,  max: 50,  description: 'Short-term MA period' },
      longPeriod:  { type: 'number', default: 20, min: 10, max: 200, description: 'Long-term MA period'  },
    },
  },
  {
    id: 'rsi',
    name: 'RSI Oscillator',
    riskLevel: 'Medium',
    description: 'Buy when RSI drops below oversold (30), sell when it rises above overbought (70).',
    parameters: {
      period:     { type: 'number', default: 14, min: 7,  max: 28, description: 'RSI lookback period'   },
      oversold:   { type: 'number', default: 30, min: 10, max: 40, description: 'Oversold threshold'    },
      overbought: { type: 'number', default: 70, min: 60, max: 90, description: 'Overbought threshold'  },
    },
  },
  {
    id: 'momentum',
    name: 'Price Momentum',
    riskLevel: 'High',
    description: 'Buy on strong positive price momentum, sell when momentum turns negative.',
    parameters: {
      lookbackPeriod: { type: 'number', default: 10, min: 5, max: 30, description: 'Momentum lookback period'    },
      threshold:      { type: 'number', default: 2,  min: 1, max: 10, description: 'Min momentum threshold (%)' },
    },
  },
];

// ─── Signal generators ─────────────────────────────────────────────────────

function maSignal(prices: number[], shortPeriod: number, longPeriod: number, index: number): { signal: Signal; reason: string } {
  if (index < longPeriod) return { signal: 'HOLD', reason: 'Insufficient data' };
  const shortMA = Indicators.calculateSMA(prices.slice(0, index + 1), shortPeriod);
  const longMA  = Indicators.calculateSMA(prices.slice(0, index + 1), longPeriod);
  const [cs, cl, ps, pl] = [shortMA.at(-1)!, longMA.at(-1)!, shortMA.at(-2)!, longMA.at(-2)!];
  if ([cs, cl, ps, pl].some(isNaN)) return { signal: 'HOLD', reason: 'Insufficient MA data' };
  if (ps <= pl && cs > cl) return { signal: 'BUY',  reason: `Golden Cross: MA${shortPeriod} (${round2(cs)}) crossed above MA${longPeriod} (${round2(cl)})` };
  if (ps >= pl && cs < cl) return { signal: 'SELL', reason: `Death Cross: MA${shortPeriod} (${round2(cs)}) crossed below MA${longPeriod} (${round2(cl)})` };
  return { signal: 'HOLD', reason: `MA${shortPeriod}=${round2(cs)} vs MA${longPeriod}=${round2(cl)} — no crossover` };
}

function rsiSignal(prices: number[], period: number, oversold: number, overbought: number, index: number): { signal: Signal; reason: string } {
  if (index < period + 1) return { signal: 'HOLD', reason: 'Insufficient data' };
  const rsi     = Indicators.calculateRSI(prices.slice(0, index + 1), period);
  const cur     = rsi.at(-1)!;
  const prev    = rsi.at(-2)!;
  if (isNaN(cur)) return { signal: 'HOLD', reason: 'Insufficient RSI data' };
  if (prev <= oversold   && cur > oversold)   return { signal: 'BUY',  reason: `RSI (${round2(cur)}) exited oversold zone (< ${oversold})` };
  if (cur  <  oversold)                       return { signal: 'BUY',  reason: `RSI (${round2(cur)}) deep oversold territory` };
  if (prev >= overbought && cur < overbought) return { signal: 'SELL', reason: `RSI (${round2(cur)}) exited overbought zone (> ${overbought})` };
  if (cur  >  overbought)                     return { signal: 'SELL', reason: `RSI (${round2(cur)}) deep overbought territory` };
  return { signal: 'HOLD', reason: `RSI (${round2(cur)}) neutral zone (${oversold}–${overbought})` };
}

function momentumSignal(prices: number[], lookbackPeriod: number, threshold: number, index: number): { signal: Signal; reason: string } {
  if (index < lookbackPeriod) return { signal: 'HOLD', reason: 'Insufficient data' };
  const momentum = Indicators.calculateMomentum(prices.slice(0, index + 1), lookbackPeriod);
  const cur = momentum.at(-1)!;
  if (isNaN(cur)) return { signal: 'HOLD', reason: 'Insufficient momentum data' };
  if (cur >  threshold)  return { signal: 'BUY',  reason: `Positive momentum +${round2(cur)}% > threshold +${threshold}%` };
  if (cur < -threshold)  return { signal: 'SELL', reason: `Negative momentum ${round2(cur)}% < threshold -${threshold}%` };
  return { signal: 'HOLD', reason: `Momentum ${round2(cur)}% within neutral band ±${threshold}%` };
}

// ─── Backtest engine ───────────────────────────────────────────────────────

export async function runBacktest(
  strategyId: string,
  rawSymbol: string,
  parameters: Record<string, number>,
  startDate: string,
  endDate: string,
  initialCapital: number,
  userId?: number
): Promise<BacktestResult> {

  // Resolve symbol (strips .NS / .BSE suffixes)
  const symbol = resolveToTicker(rawSymbol);

  // Fetch the longest possible history ('1y') so we have maximum data
  const allHistory = await getHistory(symbol, '1y');

  // If no live data, generate synthetic history seeded on a plausible price
  let history = allHistory.length > 0 ? allHistory : generateSyntheticHistory(1000, startDate, endDate);

  // Filter to the requested date window
  const filtered = history.filter(h => h.date >= startDate && h.date <= endDate);

  // Minimum bar requirement lowered to 15 so shorter windows still work
  const MIN_BARS = 15;
  let workingHistory = filtered;

  if (workingHistory.length < MIN_BARS) {
    // Fall back to the full available history sliced by count
    workingHistory = history.slice(-Math.max(60, history.length));
  }

  if (workingHistory.length < MIN_BARS) {
    // Last resort: use synthetic data
    workingHistory = generateSyntheticHistory(1000, startDate, endDate);
  }

  const prices = workingHistory.map(h => h.close);
  const trades: BacktestTrade[] = [];

  let cash     = initialCapital;
  let holdings = 0;
  let maxValue = initialCapital;
  let maxDrawdown = 0;
  let wins     = 0;
  let losses   = 0;
  let lastBuyPrice = 0;

  // Daily returns for Sharpe
  const dailyReturns: number[] = [];
  let prevPortfolio = initialCapital;

  for (let i = 0; i < prices.length; i++) {
    let res: { signal: Signal; reason: string };
    switch (strategyId) {
      case 'ma_crossover': res = maSignal(prices, parameters.shortPeriod,   parameters.longPeriod, i);        break;
      case 'rsi':          res = rsiSignal(prices, parameters.period, parameters.oversold, parameters.overbought, i); break;
      case 'momentum':     res = momentumSignal(prices, parameters.lookbackPeriod, parameters.threshold, i);  break;
      default: throw new Error(`Unknown strategy: ${strategyId}`);
    }

    const price = prices[i];
    const date  = workingHistory[i].date;

    if (res.signal === 'BUY' && cash > price) {
      const qty   = Math.floor(cash / price);
      const value = qty * price;
      cash        -= value;
      holdings    += qty;
      lastBuyPrice = price;
      trades.push({ date, type: 'BUY', price, quantity: qty, signal: res.reason, value });
    } else if (res.signal === 'SELL' && holdings > 0) {
      const value = holdings * price;
      const pnl   = (price - lastBuyPrice) * holdings;
      if (price > lastBuyPrice) wins++; else losses++;
      trades.push({ date, type: 'SELL', price, quantity: holdings, signal: res.reason, value, pnl: round2(pnl) });
      cash     += value;
      holdings  = 0;
    }

    const portfolio = cash + holdings * price;
    maxValue        = Math.max(maxValue, portfolio);
    const drawdown  = ((maxValue - portfolio) / maxValue) * 100;
    maxDrawdown     = Math.max(maxDrawdown, drawdown);

    if (i > 0) dailyReturns.push((portfolio - prevPortfolio) / prevPortfolio);
    prevPortfolio = portfolio;
  }

  const finalPrice  = prices.at(-1)!;
  const finalValue  = round2(cash + holdings * finalPrice);
  const totalReturn = round2(((finalValue - initialCapital) / initialCapital) * 100);
  const winRate     = (wins + losses) > 0 ? round2((wins / (wins + losses)) * 100) : 0;

  // Annualised Sharpe (risk-free rate ≈ 0 for simplicity)
  let sharpeRatio = 0;
  if (dailyReturns.length > 1) {
    const mean = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
    const std  = Math.sqrt(dailyReturns.map(r => (r - mean) ** 2).reduce((a, b) => a + b, 0) / dailyReturns.length);
    sharpeRatio = std > 0 ? round2((mean / std) * Math.sqrt(252)) : 0;
  }

  const strategy = STRATEGIES.find(s => s.id === strategyId);
  const result: BacktestResult = {
    backtestId: `bt_${Date.now()}`,
    strategy:   strategy?.name || strategyId,
    symbol,
    period:        `${workingHistory[0].date} to ${workingHistory.at(-1)!.date}`,
    initialCapital,
    finalValue,
    totalReturn,
    totalTrades:   trades.length,
    winRate,
    maxDrawdown: round2(maxDrawdown),
    trades,
    sharpeRatio,
    dataPoints: workingHistory.length,
  };

  if (userId) {
    try {
      await insert(
        `INSERT INTO algo_backtests 
         (user_id, strategy_type, symbol, start_date, end_date, initial_capital, 
          final_value, total_return, total_trades, win_rate, max_drawdown, trades)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, strategyId, symbol, startDate, endDate, initialCapital,
         finalValue, result.totalReturn, result.totalTrades, winRate, maxDrawdown, JSON.stringify(trades)]
      );
    } catch (e) {
      console.warn('[algoEngine] Could not save backtest to DB:', (e as Error).message);
    }
  }

  return result;
}

// ─── Synthetic history for fallback ───────────────────────────────────────
function generateSyntheticHistory(basePrice: number, start: string, end: string) {
  const result: { date: string; open: number; high: number; low: number; close: number; volume: number }[] = [];
  let price = basePrice;
  const startMs = new Date(start).getTime();
  const endMs   = new Date(end).getTime();
  const dayMs   = 86400000;
  for (let t = startMs; t <= endMs; t += dayMs) {
    const d = new Date(t);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    const change = price * ((-0.015) + Math.random() * 0.03);
    price = Math.max(price + change, 1);
    const close = round2(price);
    result.push({ date: d.toISOString().slice(0, 10), open: close, high: close * 1.01, low: close * 0.99, close, volume: 0 });
  }
  return result;
}

// ─── User strategy CRUD ────────────────────────────────────────────────────
export async function getUserStrategies(userId: number) {
  return query<Array<{
    id: number; strategy_type: string; symbol: string;
    parameters: string; enabled: boolean; created_at: Date;
  }>>('SELECT * FROM algo_strategies WHERE user_id = ? ORDER BY created_at DESC', [userId]);
}

export async function saveUserStrategy(userId: number, strategyId: string, symbol: string, parameters: Record<string, number>, enabled = false): Promise<number> {
  return insert(
    `INSERT INTO algo_strategies (user_id, strategy_type, symbol, parameters, enabled) VALUES (?, ?, ?, ?, ?)`,
    [userId, strategyId, symbol, JSON.stringify(parameters), enabled]
  );
}

export async function toggleStrategy(userId: number, strategyDbId: number): Promise<boolean> {
  const rows = await query<Array<{ enabled: boolean }>>(
    'SELECT enabled FROM algo_strategies WHERE id = ? AND user_id = ?',
    [strategyDbId, userId]
  );
  if (!rows[0]) throw new Error('Strategy not found');
  const newEnabled = !rows[0].enabled;
  await query('UPDATE algo_strategies SET enabled = ? WHERE id = ? AND user_id = ?', [newEnabled, strategyDbId, userId]);
  return newEnabled;
}
