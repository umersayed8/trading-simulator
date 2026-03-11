# StockSim - Gamified Stock Trading Simulator

A web-based stock trading simulator designed to teach financial literacy to teenagers (ages 13-18) through gamification, story-based learning, and simulated algorithmic trading.

## Features

### Core Features
- **Virtual Trading**: Start with ₹100,000 virtual money to practice trading
- **Real-Time Data**: Live Indian stock market data (NSE/BSE) via Yahoo Finance
- **Portfolio Management**: Track holdings, profit/loss, and order history

### Gamification
- **XP & Levels**: Earn experience points and level up (1-50)
- **Achievements**: Unlock badges for milestones
- **Daily Challenges**: Complete tasks for bonus rewards
- **Leaderboards**: Compete with other users
- **Streak Rewards**: Maintain daily login streaks

### Algorithmic Trading (Educational)
- **Pre-built Strategies**: Moving Average Crossover, RSI, Momentum
- **Backtesting**: Test strategies on historical data
- **Visual Explanations**: Understand why trades are executed

### Learning Modules
- **Story-Based Onboarding**: Interactive introduction to stock trading
- **Interactive Tutorials**: Learn stock basics, risk management, diversification
- **Educational Feedback**: Get insights on your trading decisions

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Redux Toolkit |
| Backend | Node.js, Express, TypeScript |
| Database | MySQL 8.0 |
| Stock Data | Yahoo Finance (yahoo-finance2) |
| Charts | Lightweight Charts (TradingView) |
| Authentication | JWT + bcrypt |

## Project Structure

```
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── middleware/     # Auth, validation middleware
│   │   ├── routes/         # API route handlers
│   │   ├── services/       # Business logic
│   │   ├── models/         # Database models
│   │   └── utils/          # Helper functions
│   └── seeds/              # Sample data
│
├── frontend/               # React application
│   └── src/
│       ├── api/            # API client
│       ├── components/     # Reusable components
│       ├── pages/          # Page components
│       ├── store/          # Redux store
│       ├── hooks/          # Custom hooks
│       └── styles/         # Global styles
```

## Prerequisites

- Node.js 18+ 
- MySQL 8.0+
- npm or yarn

## Quick Start

### 1. Clone and Install

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your settings
# - Database credentials
# - JWT secret
# - API keys (if any)
```

### 3. Setup Database

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE stocksim;"

# Run migrations (from backend folder)
npm run migrate

# Seed sample data
npm run seed
```

### 4. Start Development Servers

```bash
# Terminal 1 - Backend (port 3001)
cd backend
npm run dev

# Terminal 2 - Frontend (port 5173)
cd frontend
npm run dev
```

### 5. Access Application

Open http://localhost:5173 in your browser.

## Environment Variables

See `.env.example` for all configuration options:

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=stocksim

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d

# Server
PORT=3001
NODE_ENV=development
```

## API Documentation

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete API reference.

## Database Schema

See [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) for entity-relationship diagram and table definitions.

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for step-by-step deployment instructions.

## Algorithm Documentation

See [ALGORITHMS.md](./ALGORITHMS.md) for trading strategy explanations.

## Team

BTech CSE Final Year Project - Team of 4

## Disclaimer

This application uses **virtual money only** and is designed for **educational purposes**. It does not involve real trading, real money, or brokerage integration. The platform is intended to teach financial literacy concepts in a safe, risk-free environment.

## License

MIT License - See LICENSE file for details
