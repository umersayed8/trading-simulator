import { Router, Response } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validation';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import * as PortfolioModel from '../models/Portfolio';
import * as StockData from '../services/stockData';
import { query, insert, update } from '../config/database';
import { successResponse, errorResponse } from '../utils/helpers';

const router = Router();

// Get portfolio summary
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const summary = await PortfolioModel.getPortfolioSummary(req.user!.userId);
    
    if (!summary) {
      res.status(404).json(errorResponse('NOT_FOUND', 'Portfolio not found'));
      return;
    }
    
    res.json(successResponse(summary));
  } catch (error) {
    console.error('Get portfolio error:', error);
    res.status(500).json(errorResponse('SERVER_ERROR', 'Failed to get portfolio'));
  }
});

// Get holdings
router.get('/holdings', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const portfolio = await PortfolioModel.getPortfolio(req.user!.userId);
    
    if (!portfolio) {
      res.status(404).json(errorResponse('NOT_FOUND', 'Portfolio not found'));
      return;
    }
    
    const holdings = await PortfolioModel.getHoldingsWithValues(portfolio.id);
    
    res.json(successResponse(holdings));
  } catch (error) {
    console.error('Get holdings error:', error);
    res.status(500).json(errorResponse('SERVER_ERROR', 'Failed to get holdings'));
  }
});

// Get watchlist
router.get('/watchlist', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const watchlist = await query<Array<{ symbol: string }>>(
      'SELECT symbol FROM watchlists WHERE user_id = ? ORDER BY created_at DESC',
      [req.user!.userId]
    );
    
    // Get quotes for all watchlist items
    const symbols = watchlist.map(w => w.symbol);
    const quotes = await StockData.getQuotes(symbols);
    
    const watchlistWithQuotes = symbols.map(symbol => {
      const quote = quotes.get(symbol);
      return {
        symbol,
        name: quote?.name || symbol,
        price: quote?.price || 0,
        change: quote?.change || 0,
        changePercent: quote?.changePercent || 0,
      };
    });
    
    res.json(successResponse(watchlistWithQuotes));
  } catch (error) {
    console.error('Get watchlist error:', error);
    res.status(500).json(errorResponse('SERVER_ERROR', 'Failed to get watchlist'));
  }
});

// Add to watchlist
router.post(
  '/watchlist',
  authenticate,
  validate([
    body('symbol').notEmpty().withMessage('Symbol is required'),
  ]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { symbol } = req.body;
      
      // Verify stock exists
      const quote = await StockData.getQuote(symbol);
      if (!quote) {
        res.status(404).json(errorResponse('NOT_FOUND', 'Stock not found'));
        return;
      }
      
      // Check if already in watchlist
      const existing = await query<Array<{ id: number }>>(
        'SELECT id FROM watchlists WHERE user_id = ? AND symbol = ?',
        [req.user!.userId, symbol]
      );
      
      if (existing.length > 0) {
        res.status(400).json(errorResponse('ALREADY_EXISTS', 'Stock already in watchlist'));
        return;
      }
      
      // Add to watchlist
      await insert(
        'INSERT INTO watchlists (user_id, symbol) VALUES (?, ?)',
        [req.user!.userId, symbol]
      );
      
      res.status(201).json(successResponse({
        symbol,
        name: quote.name,
        price: quote.price,
        change: quote.change,
        changePercent: quote.changePercent,
      }, 'Added to watchlist'));
    } catch (error) {
      console.error('Add to watchlist error:', error);
      res.status(500).json(errorResponse('SERVER_ERROR', 'Failed to add to watchlist'));
    }
  }
);

// Remove from watchlist
router.delete('/watchlist/:symbol', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { symbol } = req.params;
    
    const affected = await update(
      'DELETE FROM watchlists WHERE user_id = ? AND symbol = ?',
      [req.user!.userId, symbol]
    );
    
    if (affected === 0) {
      res.status(404).json(errorResponse('NOT_FOUND', 'Stock not in watchlist'));
      return;
    }
    
    res.json(successResponse(null, 'Removed from watchlist'));
  } catch (error) {
    console.error('Remove from watchlist error:', error);
    res.status(500).json(errorResponse('SERVER_ERROR', 'Failed to remove from watchlist'));
  }
});

export default router;
