import { query, queryOne, insert, update, transaction } from '../config/database';
import { PoolConnection } from 'mysql2/promise';
import { getCurrentPrice } from '../services/stockData';
import { round2 } from '../utils/helpers';

export interface Portfolio {
  id: number;
  user_id: number;
  balance: string;
  created_at: Date;
  updated_at: Date;
}

export interface Holding {
  id: number;
  portfolio_id: number;
  symbol: string;
  quantity: number;
  avg_buy_price: number;
  created_at: Date;
  updated_at: Date;
}

export interface HoldingWithValue extends Holding {
  avgBuyPrice: number;   // camelCase alias for frontend (avg_buy_price is snake_case from DB)
  currentPrice: number;
  currentValue: number;
  investedValue: number;
  pnl: number;
  pnlPercent: number;
}

export interface PortfolioSummary {
  balance: number;
  investedValue: number;
  currentValue: number;
  totalPnL: number;
  totalPnLPercent: number;
  holdings: HoldingWithValue[];
}

// Get user's portfolio
export async function getPortfolio(userId: number): Promise<Portfolio | null> {
  return queryOne<Portfolio>(
    'SELECT * FROM portfolios WHERE user_id = ?',
    [userId]
  );
}

// Get portfolio holdings
export async function getHoldings(portfolioId: number): Promise<Holding[]> {
  return query<Holding[]>(
    'SELECT * FROM holdings WHERE portfolio_id = ? ORDER BY symbol',
    [portfolioId]
  );
}

// Get holdings with current values
export async function getHoldingsWithValues(portfolioId: number): Promise<HoldingWithValue[]> {
  const holdings = await getHoldings(portfolioId);
  
  const holdingsWithValues: HoldingWithValue[] = [];
  
  for (const holding of holdings) {
    // MySQL DECIMAL columns are returned as strings – always cast to Number first
    const avgBuyPrice  = Number(holding.avg_buy_price) || 0;
    const qty          = Number(holding.quantity)       || 0;
    const currentPrice = (await getCurrentPrice(holding.symbol)) ?? avgBuyPrice;
    const safePrice    = Number(currentPrice) || avgBuyPrice;

    const investedValue = round2(qty * avgBuyPrice);
    const currentValue  = round2(qty * safePrice);
    const pnl           = round2(currentValue - investedValue);
    const pnlPercent    = investedValue > 0 ? round2((pnl / investedValue) * 100) : 0;

    holdingsWithValues.push({
      ...holding,
      avg_buy_price: avgBuyPrice,   // normalised to number
      avgBuyPrice,                  // camelCase alias for frontend
      quantity: qty,
      currentPrice: safePrice,
      currentValue,
      investedValue,
      pnl,
      pnlPercent,
    });
  }
  
  return holdingsWithValues;
}

// Get portfolio summary
export async function getPortfolioSummary(userId: number): Promise<PortfolioSummary | null> {
  const portfolio = await getPortfolio(userId);
  if (!portfolio) return null;
  
  const holdings = await getHoldingsWithValues(portfolio.id);
  
  const investedValue = holdings.reduce((sum, h) => sum + h.investedValue, 0);
  const currentValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
  const totalPnL = round2(currentValue - investedValue);
  const totalPnLPercent = investedValue > 0 ? round2((totalPnL / investedValue) * 100) : 0;
  
  return {
    balance: Number.parseFloat(portfolio.balance),
    investedValue: round2(investedValue),
    currentValue: round2(currentValue),
    totalPnL,
    totalPnLPercent,
    holdings,
  };
}

// Buy stock
export async function buyStock(
  userId: number,
  symbol: string,
  quantity: number,
  price: number
): Promise<{ success: boolean; message: string; trade?: object }> {
  const total = round2(quantity * price);
  
  return transaction(async (connection: PoolConnection) => {
    // Get portfolio
    const [portfolioRows] = await connection.execute(
      'SELECT * FROM portfolios WHERE user_id = ? FOR UPDATE',
      [userId]
    );
    const portfolio = (portfolioRows as Portfolio[])[0];
    
    if (!portfolio) {
      return { success: false, message: 'Portfolio not found' };
    }
    
    // Check balance
    if (Number(portfolio.balance) < total) {
      return { success: false, message: 'Insufficient balance' };
    }
    
    // Deduct balance
    await connection.execute(
      'UPDATE portfolios SET balance = balance - ? WHERE id = ?',
      [total, portfolio.id]
    );
    
    // Check existing holding
    const [holdingRows] = await connection.execute(
      'SELECT * FROM holdings WHERE portfolio_id = ? AND symbol = ? FOR UPDATE',
      [portfolio.id, symbol]
    );
    const existingHolding = (holdingRows as Holding[])[0];
    
    if (existingHolding) {
      // Update existing holding with new average price
      const newQuantity = existingHolding.quantity + quantity;
      const newAvgPrice = round2(
        (existingHolding.quantity * existingHolding.avg_buy_price + quantity * price) / newQuantity
      );
      
      await connection.execute(
        'UPDATE holdings SET quantity = ?, avg_buy_price = ? WHERE id = ?',
        [newQuantity, newAvgPrice, existingHolding.id]
      );
    } else {
      // Create new holding
      await connection.execute(
        'INSERT INTO holdings (portfolio_id, symbol, quantity, avg_buy_price) VALUES (?, ?, ?, ?)',
        [portfolio.id, symbol, quantity, price]
      );
    }
    
    // Record trade
    const [tradeResult] = await connection.execute(
      'INSERT INTO trades (user_id, symbol, type, quantity, price, total) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, symbol, 'BUY', quantity, price, total]
    );
    
    return {
      success: true,
      message: 'Stock purchased successfully',
      trade: {
        orderId: (tradeResult as any).insertId,
        symbol,
        type: 'BUY',
        quantity,
        price,
        total,
        executedAt: new Date(),
      },
    };
  });
}

// Sell stock
export async function sellStock(
  userId: number,
  symbol: string,
  quantity: number,
  price: number
): Promise<{ success: boolean; message: string; trade?: object; pnl?: number }> {
  const total = round2(quantity * price);
  
  return transaction(async (connection: PoolConnection) => {
    // Get portfolio
    const [portfolioRows] = await connection.execute(
      'SELECT * FROM portfolios WHERE user_id = ? FOR UPDATE',
      [userId]
    );
    const portfolio = (portfolioRows as Portfolio[])[0];
    
    if (!portfolio) {
      return { success: false, message: 'Portfolio not found' };
    }
    
    // Check holding
    const [holdingRows] = await connection.execute(
      'SELECT * FROM holdings WHERE portfolio_id = ? AND symbol = ? FOR UPDATE',
      [portfolio.id, symbol]
    );
    const holding = (holdingRows as Holding[])[0];
    
    if (!holding || holding.quantity < quantity) {
      return { success: false, message: 'Insufficient holdings' };
    }
    
    // Calculate P&L
    const costBasis = round2(quantity * holding.avg_buy_price);
    const pnl = round2(total - costBasis);
    
    // Add balance
    await connection.execute(
      'UPDATE portfolios SET balance = balance + ? WHERE id = ?',
      [total, portfolio.id]
    );
    
    // Update or delete holding
    if (holding.quantity === quantity) {
      await connection.execute(
        'DELETE FROM holdings WHERE id = ?',
        [holding.id]
      );
    } else {
      await connection.execute(
        'UPDATE holdings SET quantity = quantity - ? WHERE id = ?',
        [quantity, holding.id]
      );
    }
    
    // Record trade
    const [tradeResult] = await connection.execute(
      'INSERT INTO trades (user_id, symbol, type, quantity, price, total) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, symbol, 'SELL', quantity, price, total]
    );
    
    return {
      success: true,
      message: 'Stock sold successfully',
      pnl,
      trade: {
        orderId: (tradeResult as any).insertId,
        symbol,
        type: 'SELL',
        quantity,
        price,
        total,
        pnl,
        executedAt: new Date(),
      },
    };
  });
}

// Get trade history
export async function getTradeHistory(
  userId: number,
  limit: number = 50,
  offset: number = 0
): Promise<{ trades: object[]; total: number }> {

  // 🔐 sanitize pagination
  const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 100));
  const safeOffset = Math.max(0, Number(offset) || 0);

  const trades = await query<object[]>(
    `
    SELECT 
      id,
      symbol,
      type,
      quantity,
      price,
      total,
      created_at AS executedAt
    FROM trades
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ${safeLimit} OFFSET ${safeOffset}
    `,
    [userId] // ✅ ONLY userId is parameterized
  );

  const [countResult] = await query<[{ count: number }]>(
    'SELECT COUNT(*) AS count FROM trades WHERE user_id = ?',
    [userId]
  );

  return {
    trades,
    total: countResult?.count || 0,
  };
}

