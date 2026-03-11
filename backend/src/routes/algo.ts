import { Router, Response } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validation';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import * as AlgoEngine from '../services/algoEngine';
import { successResponse, errorResponse } from '../utils/helpers';

const router = Router();

// Get available strategies
router.get('/strategies', (req, res: Response) => {
  res.json(successResponse(AlgoEngine.STRATEGIES));
});

// Run backtest
router.post(
  '/backtest',
  authenticate,
  validate([
    body('strategyId').notEmpty().withMessage('Strategy ID is required'),
    body('symbol').notEmpty().withMessage('Symbol is required'),
    body('parameters').isObject().withMessage('Parameters must be an object'),
    body('startDate').isISO8601().withMessage('Invalid start date'),
    body('endDate').isISO8601().withMessage('Invalid end date'),
    body('initialCapital').isFloat({ min: 1000 }).withMessage('Initial capital must be at least 1000'),
  ]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { strategyId, symbol, parameters, startDate, endDate, initialCapital } = req.body;
      
      // Validate strategy exists
      const strategy = AlgoEngine.STRATEGIES.find(s => s.id === strategyId);
      if (!strategy) {
        res.status(400).json(errorResponse('INVALID_STRATEGY', 'Unknown strategy ID'));
        return;
      }
      
      // Validate parameters
      for (const [key, config] of Object.entries(strategy.parameters)) {
        const value = parameters[key];
        if (value === undefined) {
          parameters[key] = config.default;
        } else if (value < config.min || value > config.max) {
          res.status(400).json(errorResponse(
            'INVALID_PARAMETER',
            `Parameter ${key} must be between ${config.min} and ${config.max}`
          ));
          return;
        }
      }
      
      const result = await AlgoEngine.runBacktest(
        strategyId,
        symbol,
        parameters,
        startDate.split('T')[0],
        endDate.split('T')[0],
        initialCapital,
        req.user!.userId
      );
      
      res.json(successResponse(result));
    } catch (error) {
      console.error('Backtest error:', error);
      res.status(500).json(errorResponse(
        'BACKTEST_FAILED',
        error instanceof Error ? error.message : 'Backtest failed'
      ));
    }
  }
);

// Get user's configured strategies
router.get('/user-strategies', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const strategies = await AlgoEngine.getUserStrategies(req.user!.userId);
    
    const formattedStrategies = strategies.map(s => ({
      id: s.id,
      strategyId: s.strategy_type,
      strategyName: AlgoEngine.STRATEGIES.find(st => st.id === s.strategy_type)?.name || s.strategy_type,
      symbol: s.symbol,
      parameters: JSON.parse(s.parameters),
      enabled: s.enabled,
      createdAt: s.created_at,
    }));
    
    res.json(successResponse(formattedStrategies));
  } catch (error) {
    console.error('Get strategies error:', error);
    res.status(500).json(errorResponse('SERVER_ERROR', 'Failed to get strategies'));
  }
});

// Save a new strategy configuration
router.post(
  '/user-strategies',
  authenticate,
  validate([
    body('strategyId').notEmpty().withMessage('Strategy ID is required'),
    body('symbol').notEmpty().withMessage('Symbol is required'),
    body('parameters').isObject().withMessage('Parameters must be an object'),
  ]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { strategyId, symbol, parameters, enabled } = req.body;
      
      // Validate strategy exists
      const strategy = AlgoEngine.STRATEGIES.find(s => s.id === strategyId);
      if (!strategy) {
        res.status(400).json(errorResponse('INVALID_STRATEGY', 'Unknown strategy ID'));
        return;
      }
      
      const id = await AlgoEngine.saveUserStrategy(
        req.user!.userId,
        strategyId,
        symbol,
        parameters,
        enabled || false
      );
      
      res.status(201).json(successResponse({
        id,
        strategyId,
        strategyName: strategy.name,
        symbol,
        parameters,
        enabled: enabled || false,
      }, 'Strategy saved'));
    } catch (error) {
      console.error('Save strategy error:', error);
      res.status(500).json(errorResponse('SERVER_ERROR', 'Failed to save strategy'));
    }
  }
);

// Toggle strategy enabled/disabled
router.put(
  '/user-strategies/:id/toggle',
  authenticate,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      const newEnabled = await AlgoEngine.toggleStrategy(req.user!.userId, id);
      
      res.json(successResponse({ id, enabled: newEnabled }));
    } catch (error) {
      console.error('Toggle strategy error:', error);
      if (error instanceof Error && error.message === 'Strategy not found') {
        res.status(404).json(errorResponse('NOT_FOUND', 'Strategy not found'));
      } else {
        res.status(500).json(errorResponse('SERVER_ERROR', 'Failed to toggle strategy'));
      }
    }
  }
);

export default router;
