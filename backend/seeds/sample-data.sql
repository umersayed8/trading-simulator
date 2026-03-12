-- Disable foreign key checks to allow truncation/deletion of related tables
SET FOREIGN_KEY_CHECKS = 0;

-- Clear existing data
TRUNCATE TABLE achievements;
TRUNCATE TABLE daily_challenges;
TRUNCATE TABLE lessons;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- ─── Seed Achievements ───────────────────────────────────────────────────────
INSERT INTO achievements (name, description, icon, xp_reward, criteria_type, criteria_value) VALUES
('First Steps', 'Complete your first trade', 'trophy', 50, 'trades_count', 1),
('Active Trader', 'Complete 10 trades', 'trending-up', 100, 'trades_count', 10),
('Trading Pro', 'Complete 50 trades', 'award', 250, 'trades_count', 50),
('Market Veteran', 'Complete 100 trades', 'crown', 500, 'trades_count', 100),
('Profit Maker', 'Make 5 profitable trades', 'dollar-sign', 75, 'profitable_trades', 5),
('Smart Investor', 'Make 25 profitable trades', 'brain', 200, 'profitable_trades', 25),
('Learner', 'Complete your first lesson', 'book-open', 50, 'lessons_completed', 1),
('Knowledge Seeker', 'Complete 5 lessons', 'graduation-cap', 150, 'lessons_completed', 5),
('Finance Expert', 'Complete all lessons', 'star', 500, 'lessons_completed', 15),
('Consistent', 'Maintain a 3-day streak', 'flame', 50, 'streak_days', 3),
('Dedicated', 'Maintain a 7-day streak', 'fire', 100, 'streak_days', 7),
('Unstoppable', 'Maintain a 30-day streak', 'zap', 300, 'streak_days', 30),
('Diversifier', 'Trade 5 different stocks', 'pie-chart', 75, 'unique_stocks', 5),
('Portfolio Master', 'Trade 15 different stocks', 'briefcase', 200, 'unique_stocks', 15);

-- ─── Seed Daily Challenges ──────────────────────────────────────────────────
INSERT INTO daily_challenges (title, description, type, target, xp_reward, active) VALUES
('Make a Trade', 'Execute at least one trade today', 'make_trade', 1, 25, TRUE),
('Complete a Lesson', 'Finish one learning module', 'complete_lesson', 1, 30, TRUE),
('Daily Login', 'Log in to the platform', 'daily_login', 1, 10, TRUE);

-- ─── Seed Lessons ─────────────────────────────────────────────────────────────
-- Using a variable to handle prerequisites if IDs are auto-incremented
INSERT INTO lessons (title, description, category, difficulty, xp_reward, duration_minutes, order_index, prerequisite_id, content) VALUES
(
  'What are Stocks?',
  'Learn the basics of stocks and what it means to own a piece of a company',
  'basics', 'beginner', 25, 5, 1, NULL,
  '{"sections":[{"type":"story","title":"Meet Aarav","content":"Aarav is a 16-year-old student..."},{"type":"text","title":"What is a Stock?","content":"A stock represents a small piece of ownership..."},{"type":"interactive","question":"If a company has 1000 shares and you own 10, what percentage do you own?","options":["0.1%","1%","10%","100%"],"correctAnswer":1}],"quiz":[{"question":"What does owning a stock mean?","options":["You lent money","You own part of a company","You work for them","You owe money"],"correctAnswer":1}]}'
);

-- For the following lessons, we assume the IDs 1, 2, 3... are assigned sequentially due to the TRUNCATE
INSERT INTO lessons (title, description, category, difficulty, xp_reward, duration_minutes, order_index, prerequisite_id, content) VALUES
(
  'Why Do Stock Prices Change?',
  'Understand the forces of supply and demand',
  'basics', 'beginner', 30, 7, 2, 1,
  '{"sections":[{"type":"text","title":"Supply and Demand","content":"Stock prices change based on supply and demand."}],"quiz":[{"question":"What determines stock prices?","options":["Government","Supply and demand","CEO","Random"],"correctAnswer":1}]}'
),
(
  'Risk and Reward',
  'Learn the relationship between risk and returns',
  'fundamentals', 'beginner', 35, 8, 3, 2,
  '{"sections":[{"type":"text","title":"The Golden Rule","content":"Higher potential rewards come with higher risks."}],"quiz":[{"question":"Higher risk means?","options":["Lower reward","Higher potential reward","No relation","Guaranteed profit"],"correctAnswer":1}]}'
),
(
  'Diversification',
  'Learn how spreading investments reduces risk',
  'fundamentals', 'beginner', 35, 8, 4, 3,
  '{"sections":[{"type":"text","title":"Diversification","content":"Spreading investments across different assets reduces risk."}],"quiz":[{"question":"What is diversification?","options":["One stock","Multiple assets","Banks only","Daily trading"],"correctAnswer":1}]}'
),
(
  'Reading Stock Charts',
  'Understand candlestick charts',
  'technical', 'intermediate', 40, 10, 5, 4,
  '{"sections":[{"type":"text","title":"Candlesticks","content":"A candlestick shows Open, High, Low, and Close prices."}],"quiz":[{"question":"A green candle means?","options":["Price fell","Price rose","No change","Holiday"],"correctAnswer":1}]}'
);