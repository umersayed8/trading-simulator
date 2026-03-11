# API Documentation

Base URL: `http://localhost:3001/api`

## Authentication

All protected routes require a Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## Auth Routes

### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "username": "trader_john",
  "age": 16
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "username": "trader_john",
      "level": 1,
      "xp": 0
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### POST /auth/login
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "username": "trader_john",
      "level": 5,
      "xp": 450
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### GET /auth/me
Get current user profile. **[Protected]**

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "username": "trader_john",
    "level": 5,
    "xp": 450,
    "streak": 7,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

## Trading Routes

### GET /trading/stocks/search
Search for stocks by symbol or name.

**Query Parameters:**
- `q` (string): Search query (e.g., "RELIANCE", "TCS")

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "symbol": "RELIANCE.NS",
      "name": "Reliance Industries Limited",
      "exchange": "NSE"
    },
    {
      "symbol": "RELIANCE.BO",
      "name": "Reliance Industries Limited",
      "exchange": "BSE"
    }
  ]
}
```

### GET /trading/stocks/:symbol/quote
Get real-time quote for a stock.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "symbol": "RELIANCE.NS",
    "name": "Reliance Industries Limited",
    "price": 2450.50,
    "change": 25.30,
    "changePercent": 1.04,
    "dayHigh": 2475.00,
    "dayLow": 2420.00,
    "volume": 5234567,
    "previousClose": 2425.20,
    "timestamp": "2024-01-15T14:30:00Z"
  }
}
```

### GET /trading/stocks/:symbol/history
Get historical price data for a stock.

**Query Parameters:**
- `period` (string): "1d", "5d", "1mo", "3mo", "6mo", "1y" (default: "1mo")

**Response (200):**
```json
{
  "success": true,
  "data": {
    "symbol": "RELIANCE.NS",
    "history": [
      {
        "date": "2024-01-01",
        "open": 2400.00,
        "high": 2420.00,
        "low": 2380.00,
        "close": 2410.00,
        "volume": 4500000
      }
    ]
  }
}
```

### POST /trading/orders
Place a buy or sell order. **[Protected]**

**Request Body:**
```json
{
  "symbol": "RELIANCE.NS",
  "type": "BUY",
  "quantity": 10
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Order executed successfully",
  "data": {
    "orderId": 123,
    "symbol": "RELIANCE.NS",
    "type": "BUY",
    "quantity": 10,
    "price": 2450.50,
    "total": 24505.00,
    "executedAt": "2024-01-15T14:30:00Z"
  }
}
```

### GET /trading/orders
Get user's order history. **[Protected]**

**Query Parameters:**
- `limit` (number): Number of orders to return (default: 50)
- `offset` (number): Pagination offset (default: 0)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": 123,
        "symbol": "RELIANCE.NS",
        "type": "BUY",
        "quantity": 10,
        "price": 2450.50,
        "total": 24505.00,
        "executedAt": "2024-01-15T14:30:00Z"
      }
    ],
    "total": 45,
    "limit": 50,
    "offset": 0
  }
}
```

---

## Portfolio Routes

### GET /portfolio
Get user's portfolio summary. **[Protected]**

**Response (200):**
```json
{
  "success": true,
  "data": {
    "balance": 75495.00,
    "investedValue": 24505.00,
    "currentValue": 25200.00,
    "totalPnL": 695.00,
    "totalPnLPercent": 2.84,
    "holdings": [
      {
        "symbol": "RELIANCE.NS",
        "name": "Reliance Industries",
        "quantity": 10,
        "avgBuyPrice": 2450.50,
        "currentPrice": 2520.00,
        "investedValue": 24505.00,
        "currentValue": 25200.00,
        "pnl": 695.00,
        "pnlPercent": 2.84
      }
    ]
  }
}
```

### GET /portfolio/holdings
Get detailed holdings. **[Protected]**

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "symbol": "RELIANCE.NS",
      "name": "Reliance Industries",
      "quantity": 10,
      "avgBuyPrice": 2450.50,
      "currentPrice": 2520.00,
      "pnl": 695.00,
      "pnlPercent": 2.84
    }
  ]
}
```

### GET /portfolio/watchlist
Get user's watchlist. **[Protected]**

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "symbol": "TCS.NS",
      "name": "Tata Consultancy Services",
      "price": 3850.00,
      "change": -15.50,
      "changePercent": -0.40
    }
  ]
}
```

### POST /portfolio/watchlist
Add stock to watchlist. **[Protected]**

**Request Body:**
```json
{
  "symbol": "TCS.NS"
}
```

### DELETE /portfolio/watchlist/:symbol
Remove stock from watchlist. **[Protected]**

---

## Gamification Routes

### GET /gamification/profile
Get user's gamification profile. **[Protected]**

**Response (200):**
```json
{
  "success": true,
  "data": {
    "level": 5,
    "xp": 450,
    "xpToNextLevel": 550,
    "streak": 7,
    "totalBadges": 12,
    "rank": 156
  }
}
```

### GET /gamification/achievements
Get all achievements and user's progress. **[Protected]**

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "First Trade",
      "description": "Complete your first stock trade",
      "icon": "trophy",
      "xpReward": 50,
      "unlocked": true,
      "unlockedAt": "2024-01-10T10:00:00Z"
    },
    {
      "id": 2,
      "name": "Profit Maker",
      "description": "Make a profit of ₹1,000",
      "icon": "chart-up",
      "xpReward": 100,
      "unlocked": false,
      "progress": 65
    }
  ]
}
```

### GET /gamification/challenges
Get daily challenges. **[Protected]**

**Response (200):**
```json
{
  "success": true,
  "data": {
    "daily": [
      {
        "id": 1,
        "title": "Make a Trade",
        "description": "Execute at least one trade today",
        "xpReward": 25,
        "completed": false,
        "progress": 0,
        "target": 1
      },
      {
        "id": 2,
        "title": "Complete a Lesson",
        "description": "Finish one learning module",
        "xpReward": 30,
        "completed": true
      }
    ],
    "resetsAt": "2024-01-16T00:00:00Z"
  }
}
```

### GET /gamification/leaderboard
Get leaderboard rankings.

**Query Parameters:**
- `period` (string): "weekly", "monthly", "alltime" (default: "weekly")
- `limit` (number): Number of entries (default: 50)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "period": "weekly",
    "rankings": [
      {
        "rank": 1,
        "userId": 42,
        "username": "stock_master",
        "level": 25,
        "portfolioValue": 185000.00,
        "pnlPercent": 85.0
      }
    ],
    "userRank": {
      "rank": 156,
      "portfolioValue": 125200.00,
      "pnlPercent": 25.2
    }
  }
}
```

---

## Algo Trading Routes

### GET /algo/strategies
Get available algorithmic trading strategies.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "ma_crossover",
      "name": "Moving Average Crossover",
      "description": "Buy when short-term MA crosses above long-term MA",
      "parameters": {
        "shortPeriod": { "type": "number", "default": 10, "min": 5, "max": 50 },
        "longPeriod": { "type": "number", "default": 20, "min": 10, "max": 200 }
      }
    },
    {
      "id": "rsi",
      "name": "RSI Strategy",
      "description": "Buy when RSI is oversold, sell when overbought",
      "parameters": {
        "period": { "type": "number", "default": 14, "min": 7, "max": 28 },
        "oversold": { "type": "number", "default": 30, "min": 10, "max": 40 },
        "overbought": { "type": "number", "default": 70, "min": 60, "max": 90 }
      }
    },
    {
      "id": "momentum",
      "name": "Momentum Strategy",
      "description": "Buy stocks with positive price momentum",
      "parameters": {
        "lookbackPeriod": { "type": "number", "default": 10, "min": 5, "max": 30 },
        "threshold": { "type": "number", "default": 2, "min": 1, "max": 10 }
      }
    }
  ]
}
```

### POST /algo/backtest
Run backtest on historical data. **[Protected]**

**Request Body:**
```json
{
  "strategyId": "ma_crossover",
  "symbol": "RELIANCE.NS",
  "parameters": {
    "shortPeriod": 10,
    "longPeriod": 20
  },
  "startDate": "2023-01-01",
  "endDate": "2024-01-01",
  "initialCapital": 100000
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "backtestId": "bt_123456",
    "strategy": "Moving Average Crossover",
    "symbol": "RELIANCE.NS",
    "period": "2023-01-01 to 2024-01-01",
    "initialCapital": 100000,
    "finalValue": 118500,
    "totalReturn": 18.5,
    "totalTrades": 24,
    "winRate": 58.3,
    "maxDrawdown": -8.2,
    "trades": [
      {
        "date": "2023-02-15",
        "type": "BUY",
        "price": 2350.00,
        "quantity": 10,
        "signal": "Short MA crossed above Long MA"
      }
    ]
  }
}
```

### GET /algo/user-strategies
Get user's configured algo strategies. **[Protected]**

### POST /algo/user-strategies
Save a configured strategy. **[Protected]**

**Request Body:**
```json
{
  "strategyId": "ma_crossover",
  "symbol": "RELIANCE.NS",
  "parameters": {
    "shortPeriod": 10,
    "longPeriod": 20
  },
  "enabled": true
}
```

### PUT /algo/user-strategies/:id/toggle
Enable or disable an algo strategy. **[Protected]**

---

## Learning Routes

### GET /learning/lessons
Get all available lessons.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "What are Stocks?",
      "description": "Learn the basics of stocks and the stock market",
      "category": "basics",
      "difficulty": "beginner",
      "xpReward": 25,
      "duration": "5 min",
      "completed": true
    },
    {
      "id": 2,
      "title": "Risk vs Reward",
      "description": "Understanding the relationship between risk and potential returns",
      "category": "fundamentals",
      "difficulty": "beginner",
      "xpReward": 30,
      "duration": "8 min",
      "completed": false,
      "locked": false
    }
  ]
}
```

### GET /learning/lessons/:id
Get lesson content. **[Protected]**

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "What are Stocks?",
    "content": [
      {
        "type": "story",
        "text": "Meet Aarav, a 16-year-old who just received ₹10,000 from his grandparents..."
      },
      {
        "type": "text",
        "content": "A stock represents a small piece of ownership in a company..."
      },
      {
        "type": "interactive",
        "question": "If a company has 1000 shares and you own 10, what percentage do you own?",
        "options": ["0.1%", "1%", "10%", "100%"],
        "correctAnswer": 1
      }
    ],
    "quiz": {
      "questions": [
        {
          "question": "What does owning a stock mean?",
          "options": ["You lent money to a company", "You own part of a company", "You work for a company"],
          "correctAnswer": 1
        }
      ]
    }
  }
}
```

### POST /learning/lessons/:id/complete
Mark a lesson as completed. **[Protected]**

**Request Body:**
```json
{
  "quizScore": 80
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Lesson completed!",
  "data": {
    "xpEarned": 25,
    "newTotalXp": 475,
    "levelUp": false
  }
}
```

### GET /learning/progress
Get user's learning progress. **[Protected]**

**Response (200):**
```json
{
  "success": true,
  "data": {
    "lessonsCompleted": 5,
    "totalLessons": 15,
    "percentComplete": 33.3,
    "categories": {
      "basics": { "completed": 3, "total": 4 },
      "fundamentals": { "completed": 2, "total": 5 },
      "advanced": { "completed": 0, "total": 6 }
    }
  }
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": {}
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Invalid request data |
| UNAUTHORIZED | 401 | Missing or invalid token |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| INSUFFICIENT_FUNDS | 400 | Not enough balance for trade |
| MARKET_CLOSED | 400 | Market is currently closed |
| RATE_LIMITED | 429 | Too many requests |
| SERVER_ERROR | 500 | Internal server error |
