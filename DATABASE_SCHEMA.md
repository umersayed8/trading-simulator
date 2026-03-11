# Database Schema

## Entity-Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     users       │       │   portfolios    │       │     trades      │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │───┐   │ id (PK)         │   ┌───│ id (PK)         │
│ email           │   │   │ user_id (FK)    │───┤   │ user_id (FK)    │
│ password_hash   │   └──▶│ balance         │   │   │ symbol          │
│ username        │       │ created_at      │   │   │ type            │
│ age             │       │ updated_at      │   │   │ quantity        │
│ level           │       └─────────────────┘   │   │ price           │
│ xp              │                             │   │ total           │
│ streak          │       ┌─────────────────┐   │   │ created_at      │
│ last_login      │       │    holdings     │   │   └─────────────────┘
│ onboarding_done │       ├─────────────────┤   │
│ created_at      │       │ id (PK)         │   │   ┌─────────────────┐
│ updated_at      │       │ portfolio_id(FK)│───┘   │   watchlists    │
└─────────────────┘       │ symbol          │       ├─────────────────┤
        │                 │ quantity        │       │ id (PK)         │
        │                 │ avg_buy_price   │       │ user_id (FK)    │
        │                 │ created_at      │       │ symbol          │
        │                 │ updated_at      │       │ created_at      │
        │                 └─────────────────┘       └─────────────────┘
        │
        │  ┌─────────────────┐       ┌─────────────────────┐
        │  │  achievements   │       │  user_achievements  │
        │  ├─────────────────┤       ├─────────────────────┤
        │  │ id (PK)         │───────│ id (PK)             │
        │  │ name            │       │ user_id (FK)        │
        │  │ description     │       │ achievement_id (FK) │
        │  │ icon            │       │ unlocked_at         │
        │  │ xp_reward       │       └─────────────────────┘
        │  │ criteria_type   │
        │  │ criteria_value  │       ┌─────────────────────┐
        │  └─────────────────┘       │  daily_challenges   │
        │                            ├─────────────────────┤
        │  ┌─────────────────┐       │ id (PK)             │
        │  │    lessons      │       │ title               │
        │  ├─────────────────┤       │ description         │
        │  │ id (PK)         │       │ type                │
        │  │ title           │       │ target              │
        │  │ description     │       │ xp_reward           │
        │  │ category        │       │ active              │
        │  │ difficulty      │       └─────────────────────┘
        │  │ content (JSON)  │
        │  │ xp_reward       │       ┌─────────────────────┐
        │  │ order_index     │       │  user_challenges    │
        │  └─────────────────┘       ├─────────────────────┤
        │          │                 │ id (PK)             │
        │          │                 │ user_id (FK)        │
        │          ▼                 │ challenge_id (FK)   │
        │  ┌─────────────────┐       │ date                │
        │  │  user_progress  │       │ progress            │
        │  ├─────────────────┤       │ completed           │
        │  │ id (PK)         │       └─────────────────────┘
        │  │ user_id (FK)    │
        │  │ lesson_id (FK)  │       ┌─────────────────────┐
        │  │ completed       │       │   algo_strategies   │
        │  │ quiz_score      │       ├─────────────────────┤
        │  │ completed_at    │       │ id (PK)             │
        └──┴─────────────────┘       │ user_id (FK)        │
                                     │ strategy_type       │
                                     │ symbol              │
                                     │ parameters (JSON)   │
                                     │ enabled             │
                                     │ created_at          │
                                     └─────────────────────┘
                                             │
                                             ▼
                                     ┌─────────────────────┐
                                     │   algo_backtests    │
                                     ├─────────────────────┤
                                     │ id (PK)             │
                                     │ user_id (FK)        │
                                     │ strategy_id (FK)    │
                                     │ symbol              │
                                     │ start_date          │
                                     │ end_date            │
                                     │ initial_capital     │
                                     │ final_value         │
                                     │ total_return        │
                                     │ total_trades        │
                                     │ win_rate            │
                                     │ max_drawdown        │
                                     │ trades (JSON)       │
                                     │ created_at          │
                                     └─────────────────────┘
```

## Table Definitions

### users
Stores user account information and gamification stats.

```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    age INT NOT NULL,
    level INT DEFAULT 1,
    xp INT DEFAULT 0,
    streak INT DEFAULT 0,
    last_login DATETIME,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_level (level)
);
```

### portfolios
Stores user's virtual money balance.

```sql
CREATE TABLE portfolios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    balance DECIMAL(15, 2) DEFAULT 100000.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
);
```

### holdings
Stores current stock holdings for each portfolio.

```sql
CREATE TABLE holdings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    portfolio_id INT NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    quantity INT NOT NULL,
    avg_buy_price DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE,
    UNIQUE KEY unique_portfolio_symbol (portfolio_id, symbol),
    INDEX idx_portfolio_id (portfolio_id),
    INDEX idx_symbol (symbol)
);
```

### trades
Records all buy/sell transactions.

```sql
CREATE TABLE trades (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    type ENUM('BUY', 'SELL') NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(15, 2) NOT NULL,
    total DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_symbol (symbol),
    INDEX idx_created_at (created_at)
);
```

### watchlists
Stores user's stock watchlist.

```sql
CREATE TABLE watchlists (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_symbol (user_id, symbol),
    INDEX idx_user_id (user_id)
);
```

### achievements
Defines available badges and achievements.

```sql
CREATE TABLE achievements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    xp_reward INT DEFAULT 0,
    criteria_type VARCHAR(50) NOT NULL,
    criteria_value INT NOT NULL,
    
    INDEX idx_criteria_type (criteria_type)
);
```

### user_achievements
Tracks which achievements users have unlocked.

```sql
CREATE TABLE user_achievements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    achievement_id INT NOT NULL,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_achievement (user_id, achievement_id),
    INDEX idx_user_id (user_id)
);
```

### daily_challenges
Defines daily challenge types.

```sql
CREATE TABLE daily_challenges (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    target INT NOT NULL,
    xp_reward INT DEFAULT 0,
    active BOOLEAN DEFAULT TRUE
);
```

### user_challenges
Tracks daily challenge progress per user.

```sql
CREATE TABLE user_challenges (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    challenge_id INT NOT NULL,
    date DATE NOT NULL,
    progress INT DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (challenge_id) REFERENCES daily_challenges(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_challenge_date (user_id, challenge_id, date),
    INDEX idx_user_date (user_id, date)
);
```

### lessons
Stores learning module content.

```sql
CREATE TABLE lessons (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    difficulty ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
    content JSON NOT NULL,
    xp_reward INT DEFAULT 25,
    duration_minutes INT DEFAULT 5,
    order_index INT NOT NULL,
    prerequisite_id INT NULL,
    
    FOREIGN KEY (prerequisite_id) REFERENCES lessons(id) ON DELETE SET NULL,
    INDEX idx_category (category),
    INDEX idx_order (order_index)
);
```

### user_progress
Tracks user's learning progress.

```sql
CREATE TABLE user_progress (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    lesson_id INT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    quiz_score INT,
    completed_at TIMESTAMP NULL,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_lesson (user_id, lesson_id),
    INDEX idx_user_id (user_id)
);
```

### algo_strategies
Stores user-configured algorithmic trading strategies.

```sql
CREATE TABLE algo_strategies (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    strategy_type VARCHAR(50) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    parameters JSON NOT NULL,
    enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_enabled (enabled)
);
```

### algo_backtests
Stores backtest results.

```sql
CREATE TABLE algo_backtests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    strategy_id INT,
    strategy_type VARCHAR(50) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    initial_capital DECIMAL(15, 2) NOT NULL,
    final_value DECIMAL(15, 2) NOT NULL,
    total_return DECIMAL(10, 2) NOT NULL,
    total_trades INT NOT NULL,
    win_rate DECIMAL(5, 2) NOT NULL,
    max_drawdown DECIMAL(10, 2) NOT NULL,
    trades JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (strategy_id) REFERENCES algo_strategies(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
);
```

## Relationships Summary

| Parent Table | Child Table | Relationship | Foreign Key |
|--------------|-------------|--------------|-------------|
| users | portfolios | 1:1 | user_id |
| users | trades | 1:N | user_id |
| users | watchlists | 1:N | user_id |
| users | user_achievements | 1:N | user_id |
| users | user_challenges | 1:N | user_id |
| users | user_progress | 1:N | user_id |
| users | algo_strategies | 1:N | user_id |
| users | algo_backtests | 1:N | user_id |
| portfolios | holdings | 1:N | portfolio_id |
| achievements | user_achievements | 1:N | achievement_id |
| daily_challenges | user_challenges | 1:N | challenge_id |
| lessons | user_progress | 1:N | lesson_id |
| lessons | lessons | 1:N (self) | prerequisite_id |
| algo_strategies | algo_backtests | 1:N | strategy_id |

## XP and Level System

Levels are calculated based on XP thresholds:

| Level | XP Required | Cumulative XP |
|-------|-------------|---------------|
| 1 | 0 | 0 |
| 2 | 100 | 100 |
| 3 | 150 | 250 |
| 4 | 200 | 450 |
| 5 | 250 | 700 |
| ... | +50 per level | ... |
| 50 | 2500 | 63,750 |

Formula: `XP for level N = 100 + (N-2) * 50` for N >= 2
