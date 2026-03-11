// ⚠️ dotenv MUST be loaded before any other import that reads process.env
// With ESM, all imports are hoisted, so we use dotenv/config as a side-effect
// import at the very top to guarantee .env is parsed first.
import 'dotenv/config';
import { runMigrations } from "./scripts/migrate";

import express from 'express';
import cors from 'cors';
import { testConnection } from './config/database';

// Import routes (these modules read process.env at load time)
import authRoutes from './routes/auth';
import tradingRoutes from './routes/trading';
import portfolioRoutes from './routes/portfolio';
import gamificationRoutes from './routes/gamification';
import algoRoutes from './routes/algo';
import learningRoutes from './routes/learning';

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// Middleware
app.set('trust proxy',1);

app.use(cors({
  origin: ["https://gamified-stock-trading-simulator.vercel.app", "http://localhost:5173"],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({
    status: "API running",
    service: "Trading Simulator Backend"
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/trading', tradingRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/algo', algoRoutes);
app.use('/api/learning', learningRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
});

// Global error handler
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'SERVER_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : err.message,
    },
  });
});

// Start server
async function startServer() {
  // ── Validate required environment variables ──────────────────────────────
  const missingKey =
    !process.env.INDIAN_API_KEY ||
    process.env.INDIAN_API_KEY === 'your_indianapi_key_here' ||
    process.env.INDIAN_API_KEY.trim() === '';

  if (missingKey) {
    console.error('');
    console.error('╔══════════════════════════════════════════════════════════╗');
    console.error('║  ⚠️  INDIAN_API_KEY is not configured                    ║');
    console.error('║                                                          ║');
    console.error('║  1. Go to https://indianapi.in and get your API key      ║');
    console.error('║  2. Open  backend/.env                                   ║');
    console.error('║  3. Set   INDIAN_API_KEY=<your_real_key>                 ║');
    console.error('║                                                          ║');
    console.error('║  All stock data endpoints will return 401 until this     ║');
    console.error('║  is fixed.                                               ║');
    console.error('╚══════════════════════════════════════════════════════════╝');
    console.error('');
  } else {
    console.log(`✅ INDIAN_API_KEY loaded (${process.env.INDIAN_API_KEY!.slice(0, 6)}…)`);
  }

  await runMigrations();
  // Test database connection
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.error('Failed to connect to database. Exiting...');
    process.exit(1);
  }

  app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
}

startServer();
