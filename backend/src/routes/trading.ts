import { Router, Response } from 'express';
import { body, query as queryValidator } from 'express-validator';
import { validate } from '../middleware/validation';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import * as StockData from '../services/stockData';
import * as Portfolio from '../models/Portfolio';
import * as User from '../models/User';
import * as GamificationEngine from '../services/gamificationEngine';
import { successResponse, errorResponse } from '../utils/helpers';

const router = Router();

// ─── Search stocks ─────────────────────────────────────────────────────────────
router.get('/stocks/search', async (req, res: Response) => {
  try {
    const q = (req.query.q as string) || '';

    if (q.length < 1) {
      // Return popular stocks when no query is provided
      res.json(successResponse(
        StockData.POPULAR_STOCKS.slice(0, 10).map(s => ({
          symbol:   s.symbol,
          name:     s.name,
          exchange: 'NSE',
        }))
      ));
      return;
    }

    const results = await StockData.searchStocks(q);
    res.json(successResponse(results));
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json(errorResponse('SERVER_ERROR', 'Search failed'));
  }
});

// ─── Recommended / Popular stocks (Task 4) ────────────────────────────────────
router.get('/stocks/recommended', async (_req, res: Response) => {
  try {
    const trending = await StockData.getTrending();

    const allStocks = [
      ...trending.top_gainers.slice(0, 4),
      ...trending.top_losers.slice(0, 4),
    ];

    const seen = new Set<string>();
    const recommended = allStocks
      .filter(s => {
        // ticker_id has already been sanitised by getTrending()
        // but double-check here as a safety net
        const sym = StockData.resolveToTicker(s.ticker_id);
        if (!StockData.isValidTicker(sym)) return false;
        if (seen.has(sym)) return false;
        seen.add(sym);
        return true;
      })
      .map(s => {
        const sym = StockData.resolveToTicker(s.ticker_id);
        // Look up a friendly name from popular stocks list if available
        const known = StockData.POPULAR_STOCKS.find(p => p.symbol === sym);
        return {
          symbol:        sym,
          name:          known?.name ?? s.company_name,
          price:         parseFloat(s.price)          || 0,
          changePercent: parseFloat(s.percent_change) || 0,
          change:        parseFloat(s.net_change)     || 0,
          high:          parseFloat(s.high)           || 0,
          low:           parseFloat(s.low)            || 0,
          volume:        parseInt(s.volume)           || 0,
        };
      });

    // If trending returned nothing useful, fall back to the popular list
    if (recommended.length === 0) {
      return res.json(successResponse(
        StockData.POPULAR_STOCKS.slice(0, 8).map(s => ({
          symbol: s.symbol, name: s.name,
          price: 0, changePercent: 0, change: 0, high: 0, low: 0, volume: 0,
        }))
      ));
    }

    res.json(successResponse(recommended));
  } catch (error) {
    console.error('Recommended stocks error:', error);
    res.json(successResponse(
      StockData.POPULAR_STOCKS.slice(0, 8).map(s => ({
        symbol: s.symbol, name: s.name,
        price: 0, changePercent: 0, change: 0, high: 0, low: 0, volume: 0,
      }))
    ));
  }
});

// ─── Pro Tips / Market Insights (Task 5) ─────────────────────────────────────
router.get('/insights', async (_req, res: Response) => {
  try {
    // Fetch analyst recommendations for a set of blue-chip stocks
    // and build actionable pro-tips from the data
    const tipStocks = ['TCS', 'RELIANCE', 'INFY', 'HDFCBANK', 'ICICIBANK'];

    const recs = await Promise.allSettled(
      tipStocks.map(id => StockData.getAnalystRec(id))
    );

    const insights = recs
      .map((r, i) => {
        if (r.status !== 'fulfilled' || !r.value) return null;
        const rec = r.value;
        const stock = StockData.POPULAR_STOCKS.find(s => s.symbol === tipStocks[i]);
        return {
          stockId:     rec.stockId,
          stockName:   stock?.name ?? rec.stockId,
          label:       rec.label,
          meanScore:   rec.meanScore,
          analysts:    rec.analysts,
          priceTarget: rec.priceTarget,
          tip:         buildTip(rec, stock?.name ?? rec.stockId),
        };
      })
      .filter(Boolean);

    // Always include a set of static educational tips as a baseline
    const staticTips = getStaticTips();

    res.json(successResponse({ insights, staticTips }));
  } catch (error) {
    console.error('Insights error:', error);
    res.json(successResponse({ insights: [], staticTips: getStaticTips() }));
  }
});

/** Build a human-readable tip string from an analyst recommendation */
function buildTip(rec: StockData.AnalystRec, stockName: string): string {
  const targetStr = rec.priceTarget
    ? ` with a target price of ₹${rec.priceTarget.toFixed(0)}`
    : '';
  return `${rec.analysts} analysts rate ${stockName} as "${rec.label}"${targetStr}.`;
}

/** Static educational pro-tips always shown */
function getStaticTips(): string[] {
  return [
    '📊 Diversify across sectors to reduce portfolio risk.',
    '⏳ Rupee-cost averaging helps smooth out market volatility.',
    '🔍 Always check P/E ratio against the sector average before buying.',
    '📰 Quarterly results drive short-term price movements – watch earnings dates.',
    '💡 A rising Nifty 50 often signals broad market strength.',
    '🛡️ Never invest more than you can afford to lose in a single stock.',
    '📈 SIP investing is one of the most effective long-term wealth builders.',
    '⚠️ High volume breakouts confirm price moves more reliably than low-volume ones.',
  ];
}

// ─── Get stock quote ──────────────────────────────────────────────────────────
router.get('/stocks/:symbol/quote', async (req, res: Response) => {
  try {
    const raw    = req.params.symbol;
    // Resolve and validate before touching the external API
    const symbol = StockData.resolveToTicker(raw);
    if (!StockData.isValidTicker(symbol)) {
      res.status(400).json(errorResponse('INVALID_SYMBOL',
        `"${raw}" is not a valid stock symbol. Use NSE tickers like RELIANCE, TCS, INFY.`));
      return;
    }

    const quote = await StockData.getQuote(symbol);
    if (!quote) {
      res.status(404).json(errorResponse('NOT_FOUND', 'Stock not found'));
      return;
    }

    res.json(successResponse(quote));
  } catch (error) {
    console.error('Quote error:', error);
    res.status(500).json(errorResponse('SERVER_ERROR', 'Failed to get quote'));
  }
});

// ─── Get stock history ────────────────────────────────────────────────────────
router.get('/stocks/:symbol/history', async (req, res: Response) => {
  try {
    const raw    = req.params.symbol;
    // Resolve and validate before touching the external API
    const symbol = StockData.resolveToTicker(raw);
    if (!StockData.isValidTicker(symbol)) {
      res.status(400).json(errorResponse('INVALID_SYMBOL',
        `"${raw}" is not a valid stock symbol. Use NSE tickers like RELIANCE, TCS, INFY.`));
      return;
    }

    const period = (req.query.period as string) || '1y';
    const validPeriods = ['1d', '5d', '1mo', '3mo', '6mo', '1y'];
    if (!validPeriods.includes(period)) {
      res.status(400).json(errorResponse('VALIDATION_ERROR', 'Invalid period'));
      return;
    }

    const history = await StockData.getHistory(symbol, period);
    res.json(successResponse({ symbol, history }));
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json(errorResponse('SERVER_ERROR', 'Failed to get history'));
  }
});

// ─── Place order (buy / sell) ─────────────────────────────────────────────────
router.post(
  '/orders',
  authenticate,
  validate([
    body('symbol').notEmpty().withMessage('Symbol is required'),
    body('type').isIn(['BUY', 'SELL']).withMessage('Type must be BUY or SELL'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  ]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { symbol: rawSymbol, type, quantity } = req.body;
      const symbol = StockData.resolveToTicker(rawSymbol);
      const userId = req.user!.userId;

      // Guard against internal IDs / invalid symbols reaching the external API
      if (!StockData.isValidTicker(symbol)) {
        res.status(400).json(errorResponse('INVALID_SYMBOL',
          `"${rawSymbol}" is not a valid stock symbol.`));
        return;
      }

      // ─── Daily trade limit (anti-addiction) ──────────────────────────
      const histResult = await Portfolio.getTradeHistory(userId, 200, 0);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const todayCount = histResult.trades.filter((t: any) => new Date(t.executedAt) >= today).length;
      if (todayCount >= 30) {
        res.status(429).json(errorResponse('DAILY_LIMIT_REACHED',
          'You have reached your daily limit of 30 trades. Please take a break and come back tomorrow! 🐻'));
        return;
      }

      const quote = await StockData.getQuote(symbol);
      if (!quote) {
        res.status(404).json(errorResponse('NOT_FOUND', 'Stock not found'));
        return;
      }

      const price = quote.price;
      let result: Awaited<ReturnType<typeof Portfolio.buyStock>>;

      if (type === 'BUY') {
        result = await Portfolio.buyStock(userId, symbol, quantity, price);
      } else {
        result = await Portfolio.sellStock(userId, symbol, quantity, price);
      }

      if (!result.success) {
        res.status(400).json(errorResponse('TRADE_FAILED', result.message));
        return;
      }

      // Full gamification: XP + streak + achievements
      const gamResult = await GamificationEngine.processEvent(userId, 'trade');

      res.status(201).json(successResponse(
        { ...result.trade, xpEarned: gamResult.xpEarned, newAchievements: gamResult.newAchievements, levelUp: gamResult.levelUp, newLevel: gamResult.newLevel },
        result.message
      ));
    } catch (error) {
      console.error('Order error:', error);
      res.status(500).json(errorResponse('SERVER_ERROR', 'Order failed'));
    }
  }
);

// ─── Get stock news ───────────────────────────────────────────────────────────
router.get('/stocks/:symbol/news', async (req, res: Response) => {
  try {
    const raw    = req.params.symbol;
    const symbol = StockData.resolveToTicker(raw);
    if (!StockData.isValidTicker(symbol)) {
      res.status(400).json(errorResponse('INVALID_SYMBOL', `"${raw}" is not a valid stock symbol.`));
      return;
    }
    const news = await StockData.getStockNews(symbol);
    res.json(successResponse(news));
  } catch (error) {
    console.error('News error:', error);
    res.status(500).json(errorResponse('SERVER_ERROR', 'Failed to get news'));
  }
});

// ─── Daily trade count (for addiction control) ────────────────────────────────
router.get('/orders/today-count', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const result = await Portfolio.getTradeHistory(userId, 200, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = result.trades.filter((t: any) => {
      const d = new Date(t.executedAt);
      return d >= today;
    }).length;
    res.json(successResponse({ count: todayCount, limit: 30 }));
  } catch (error) {
    res.status(500).json(errorResponse('SERVER_ERROR', 'Failed to get trade count'));
  }
});

// ─── Get order history ────────────────────────────────────────────────────────
router.get('/orders', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const limit  = parseInt(req.query.limit  as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await Portfolio.getTradeHistory(req.user!.userId, limit, offset);

    res.json(successResponse({
      orders: result.trades,
      total:  result.total,
      limit,
      offset,
    }));
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json(errorResponse('SERVER_ERROR', 'Failed to get orders'));
  }
});

export default router;
