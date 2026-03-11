# Algorithmic Trading Strategies

This document explains the algorithmic trading strategies implemented in StockSim for educational purposes. All strategies are for simulation only and do not involve real money.

## Overview

Algorithmic trading uses mathematical models and rules to make trading decisions automatically. In StockSim, we implement three beginner-friendly strategies to teach the fundamentals of technical analysis.

---

## 1. Moving Average Crossover Strategy

### Concept

A moving average (MA) smooths out price data to identify trends. When two moving averages of different periods cross, it can signal a potential trade opportunity.

### How It Works

```
Short-term MA (e.g., 10-day): Reacts quickly to price changes
Long-term MA (e.g., 20-day): Shows the overall trend

BUY Signal:  Short MA crosses ABOVE Long MA (Golden Cross)
SELL Signal: Short MA crosses BELOW Long MA (Death Cross)
```

### Visual Representation

```
Price
  │
  │     ╭──── Short MA crosses above ──── BUY
  │    ╱ ╲
  │   ╱   ╲    Long MA (20-day)
  │  ╱     ╲  ╱
  │ ╱  ─────╳─────────────────
  │╱       ╱╲
  │───────╱──╲────────────────  Short MA (10-day)
  │      ╱    ╲
  │            ╲ Short MA crosses below ──── SELL
  └────────────────────────────────────────▶ Time
```

### Implementation

```typescript
function calculateSMA(prices: number[], period: number): number {
  const slice = prices.slice(-period);
  return slice.reduce((sum, price) => sum + price, 0) / period;
}

function maSignal(prices: number[], shortPeriod: number, longPeriod: number): Signal {
  const shortMA = calculateSMA(prices, shortPeriod);
  const longMA = calculateSMA(prices, longPeriod);
  const prevShortMA = calculateSMA(prices.slice(0, -1), shortPeriod);
  const prevLongMA = calculateSMA(prices.slice(0, -1), longPeriod);
  
  // Golden Cross: Short crosses above Long
  if (prevShortMA <= prevLongMA && shortMA > longMA) {
    return 'BUY';
  }
  
  // Death Cross: Short crosses below Long
  if (prevShortMA >= prevLongMA && shortMA < longMA) {
    return 'SELL';
  }
  
  return 'HOLD';
}
```

### Parameters

| Parameter | Default | Range | Description |
|-----------|---------|-------|-------------|
| Short Period | 10 | 5-50 | Days for short-term MA |
| Long Period | 20 | 10-200 | Days for long-term MA |

### Educational Points

- **Trend Following**: This strategy follows the trend rather than predicting reversals
- **Lag**: Moving averages lag behind actual price movements
- **Whipsaws**: In sideways markets, frequent false signals can occur
- **Best For**: Trending markets with clear directional moves

---

## 2. RSI (Relative Strength Index) Strategy

### Concept

RSI measures the speed and magnitude of price changes to identify overbought or oversold conditions. It ranges from 0 to 100.

### How It Works

```
RSI < 30:  Oversold → Potential BUY opportunity
RSI > 70:  Overbought → Potential SELL opportunity
RSI 30-70: Neutral zone → HOLD
```

### Visual Representation

```
RSI
100 ┬───────────────────────────────────
    │                    ╭─╮
 80 ┤                   ╱   ╲
    │                  ╱     ╲
 70 ┤─────────────────╱───────╲────────  ← Overbought (SELL)
    │      ╭──╮      ╱         ╲
 50 ┤     ╱    ╲    ╱           ╲
    │    ╱      ╲  ╱             ╲
 30 ┤───╱────────╲╱───────────────╲────  ← Oversold (BUY)
    │  ╱          ╲                ╲
 20 ┤ ╱                             ╲
    │╱                               ╲
  0 ┴────────────────────────────────────▶ Time
```

### Implementation

```typescript
function calculateRSI(prices: number[], period: number = 14): number {
  const changes = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }
  
  const gains = changes.map(c => c > 0 ? c : 0);
  const losses = changes.map(c => c < 0 ? Math.abs(c) : 0);
  
  const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
  const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;
  
  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function rsiSignal(
  prices: number[], 
  period: number, 
  oversold: number, 
  overbought: number
): Signal {
  const rsi = calculateRSI(prices, period);
  
  if (rsi < oversold) return 'BUY';
  if (rsi > overbought) return 'SELL';
  return 'HOLD';
}
```

### Parameters

| Parameter | Default | Range | Description |
|-----------|---------|-------|-------------|
| Period | 14 | 7-28 | Days for RSI calculation |
| Oversold | 30 | 10-40 | RSI level to trigger buy |
| Overbought | 70 | 60-90 | RSI level to trigger sell |

### Educational Points

- **Mean Reversion**: RSI assumes prices will revert to their average
- **Divergence**: When price makes new highs but RSI doesn't, it may signal weakness
- **Confirmation**: Best used with other indicators for confirmation
- **Best For**: Range-bound markets with clear support/resistance

---

## 3. Momentum Strategy

### Concept

Momentum trading assumes that stocks moving strongly in one direction will continue to move in that direction. "The trend is your friend."

### How It Works

```
Calculate price change over lookback period
If change > threshold%: BUY (positive momentum)
If change < -threshold%: SELL (negative momentum)
Otherwise: HOLD
```

### Visual Representation

```
Price Change %
     │
 +5% ┤        ╭───╮           BUY zone
     │       ╱     ╲
 +2% ┤──────╱───────╲─────────────────── threshold
     │     ╱         ╲      ╭─╮
  0% ┤────╱───────────╲────╱───╲─────────
     │   ╱             ╲  ╱     ╲
 -2% ┤──╱───────────────╲╱───────╲────── threshold
     │ ╱                         ╲
 -5% ┤╱                           ╲    SELL zone
     └───────────────────────────────▶ Time
```

### Implementation

```typescript
function calculateMomentum(prices: number[], lookback: number): number {
  const currentPrice = prices[prices.length - 1];
  const pastPrice = prices[prices.length - 1 - lookback];
  return ((currentPrice - pastPrice) / pastPrice) * 100;
}

function momentumSignal(
  prices: number[], 
  lookback: number, 
  threshold: number
): Signal {
  const momentum = calculateMomentum(prices, lookback);
  
  if (momentum > threshold) return 'BUY';
  if (momentum < -threshold) return 'SELL';
  return 'HOLD';
}
```

### Parameters

| Parameter | Default | Range | Description |
|-----------|---------|-------|-------------|
| Lookback Period | 10 | 5-30 | Days to measure momentum |
| Threshold | 2% | 1-10% | Minimum change to trigger signal |

### Educational Points

- **Trend Continuation**: Assumes strong trends persist
- **Risk**: Can lead to buying at tops and selling at bottoms if trend reverses
- **Volume Confirmation**: Higher volume often confirms momentum
- **Best For**: Strongly trending markets with clear momentum

---

## Backtesting

### What is Backtesting?

Backtesting simulates how a strategy would have performed on historical data. This helps evaluate:

1. **Total Return**: Overall profit/loss
2. **Win Rate**: Percentage of profitable trades
3. **Max Drawdown**: Largest peak-to-trough decline
4. **Number of Trades**: Trading frequency

### How StockSim Backtests Work

```
1. Load historical price data for selected period
2. Start with initial virtual capital (e.g., ₹100,000)
3. For each day:
   - Calculate indicator values
   - Check for buy/sell signals
   - Execute simulated trades
   - Track portfolio value
4. Calculate final metrics
```

### Backtest Output Example

```
Strategy: Moving Average Crossover
Symbol: RELIANCE.NS
Period: Jan 2023 - Jan 2024

Initial Capital: ₹100,000
Final Value:     ₹118,500
Total Return:    +18.5%

Trades: 24
Win Rate: 58.3%
Max Drawdown: -8.2%

Trade Log:
┌──────────────┬──────┬──────────┬──────┬────────────────────────────────┐
│ Date         │ Type │ Price    │ Qty  │ Signal Reason                  │
├──────────────┼──────┼──────────┼──────┼────────────────────────────────┤
│ 2023-02-15   │ BUY  │ ₹2,350   │ 10   │ Short MA crossed above Long MA │
│ 2023-03-20   │ SELL │ ₹2,480   │ 10   │ Short MA crossed below Long MA │
│ ...          │      │          │      │                                │
└──────────────┴──────┴──────────┴──────┴────────────────────────────────┘
```

### Important Limitations

1. **Past ≠ Future**: Historical performance doesn't guarantee future results
2. **Overfitting**: Optimizing too much for past data may not work in the future
3. **Transaction Costs**: Real trading has fees (not simulated here)
4. **Slippage**: Real prices may differ from expected execution prices
5. **Market Impact**: Large orders can move prices (not simulated)

---

## Combining Strategies

For more robust signals, traders often combine multiple indicators:

```
Example: Confirmation Strategy

BUY only when:
  - MA Crossover = BUY (trend confirmation)
  - AND RSI < 40 (not overbought)
  - AND Momentum > 0 (positive direction)

SELL only when:
  - MA Crossover = SELL
  - AND RSI > 60
  - AND Momentum < 0
```

This reduces false signals but may also reduce trading opportunities.

---

## Risk Management Concepts

### Position Sizing

Never risk too much on a single trade:

```
Risk per trade = 1-2% of total capital
Position size = Risk amount / (Entry price - Stop loss)
```

### Stop Loss

Automatically sell if price drops below a threshold:

```
Stop Loss = Entry Price × (1 - Stop Loss %)
Example: ₹2,450 × (1 - 5%) = ₹2,327.50
```

### Diversification

Don't put all money in one stock:

```
Maximum per stock = 20-25% of portfolio
Minimum 4-5 different stocks recommended
```

---

## Disclaimer

These algorithms are for **educational purposes only**. They demonstrate basic concepts of technical analysis and algorithmic trading. Real trading involves:

- Significant financial risk
- Transaction costs and taxes
- Emotional decision-making challenges
- Market conditions that change over time

Always consult with a qualified financial advisor before making real investment decisions.
