// Technical Analysis Indicators

export interface PriceData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Simple Moving Average (SMA)
export function calculateSMA(prices: number[], period: number): number[] {
  const sma: number[] = [];
  
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      sma.push(NaN);
    } else {
      const slice = prices.slice(i - period + 1, i + 1);
      const avg = slice.reduce((sum, val) => sum + val, 0) / period;
      sma.push(avg);
    }
  }
  
  return sma;
}

// Exponential Moving Average (EMA)
export function calculateEMA(prices: number[], period: number): number[] {
  const ema: number[] = [];
  const multiplier = 2 / (period + 1);
  
  // First EMA is the SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += prices[i];
    ema.push(NaN);
  }
  ema[period - 1] = sum / period;
  
  // Calculate EMA for remaining prices
  for (let i = period; i < prices.length; i++) {
    const prevEma = ema[i - 1];
    const currentEma = (prices[i] - prevEma) * multiplier + prevEma;
    ema.push(currentEma);
  }
  
  return ema;
}

// Relative Strength Index (RSI)
export function calculateRSI(prices: number[], period: number = 14): number[] {
  const rsi: number[] = [];
  const gains: number[] = [];
  const losses: number[] = [];
  
  // Calculate price changes
  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  
  // First RSI value
  rsi.push(NaN);
  
  for (let i = 0; i < gains.length; i++) {
    if (i < period - 1) {
      rsi.push(NaN);
    } else if (i === period - 1) {
      // First RSI calculation uses simple average
      const avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
      const avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
      
      if (avgLoss === 0) {
        rsi.push(100);
      } else {
        const rs = avgGain / avgLoss;
        rsi.push(100 - (100 / (1 + rs)));
      }
    } else {
      // Subsequent RSI uses smoothed average
      const prevRsi = rsi[rsi.length - 1];
      const avgGain = (gains[i] + (prevRsi === 100 ? 0 : gains.slice(i - period + 1, i).reduce((a, b) => a + b, 0))) / period;
      const avgLoss = (losses[i] + losses.slice(i - period + 1, i).reduce((a, b) => a + b, 0)) / period;
      
      if (avgLoss === 0) {
        rsi.push(100);
      } else {
        const rs = avgGain / avgLoss;
        rsi.push(100 - (100 / (1 + rs)));
      }
    }
  }
  
  return rsi;
}

// Momentum (Rate of Change)
export function calculateMomentum(prices: number[], period: number = 10): number[] {
  const momentum: number[] = [];
  
  for (let i = 0; i < prices.length; i++) {
    if (i < period) {
      momentum.push(NaN);
    } else {
      const change = ((prices[i] - prices[i - period]) / prices[i - period]) * 100;
      momentum.push(change);
    }
  }
  
  return momentum;
}

// Bollinger Bands
export function calculateBollingerBands(
  prices: number[],
  period: number = 20,
  stdDev: number = 2
): { upper: number[]; middle: number[]; lower: number[] } {
  const middle = calculateSMA(prices, period);
  const upper: number[] = [];
  const lower: number[] = [];
  
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      upper.push(NaN);
      lower.push(NaN);
    } else {
      const slice = prices.slice(i - period + 1, i + 1);
      const mean = middle[i];
      const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
      const std = Math.sqrt(variance);
      
      upper.push(mean + stdDev * std);
      lower.push(mean - stdDev * std);
    }
  }
  
  return { upper, middle, lower };
}

// MACD (Moving Average Convergence Divergence)
export function calculateMACD(
  prices: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): { macd: number[]; signal: number[]; histogram: number[] } {
  const fastEMA = calculateEMA(prices, fastPeriod);
  const slowEMA = calculateEMA(prices, slowPeriod);
  
  const macd: number[] = [];
  for (let i = 0; i < prices.length; i++) {
    if (isNaN(fastEMA[i]) || isNaN(slowEMA[i])) {
      macd.push(NaN);
    } else {
      macd.push(fastEMA[i] - slowEMA[i]);
    }
  }
  
  // Calculate signal line (EMA of MACD)
  const validMacd = macd.filter(v => !isNaN(v));
  const signalEMA = calculateEMA(validMacd, signalPeriod);
  
  const signal: number[] = [];
  const histogram: number[] = [];
  let signalIdx = 0;
  
  for (let i = 0; i < macd.length; i++) {
    if (isNaN(macd[i])) {
      signal.push(NaN);
      histogram.push(NaN);
    } else {
      signal.push(signalEMA[signalIdx] || NaN);
      histogram.push(isNaN(signalEMA[signalIdx]) ? NaN : macd[i] - signalEMA[signalIdx]);
      signalIdx++;
    }
  }
  
  return { macd, signal, histogram };
}
