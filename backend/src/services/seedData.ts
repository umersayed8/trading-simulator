export const achievements = [
    { name: 'First Steps',       description: 'Complete your first trade',        icon: 'trophy',          xp_reward: 50,  criteria_type: 'trades_count',      criteria_value: 1   },
    { name: 'Active Trader',     description: 'Complete 10 trades',               icon: 'trending-up',     xp_reward: 100, criteria_type: 'trades_count',      criteria_value: 10  },
    { name: 'Trading Pro',       description: 'Complete 50 trades',               icon: 'award',           xp_reward: 250, criteria_type: 'trades_count',      criteria_value: 50  },
    { name: 'Market Veteran',    description: 'Complete 100 trades',              icon: 'crown',           xp_reward: 500, criteria_type: 'trades_count',      criteria_value: 100 },
    { name: 'Profit Maker',      description: 'Make 5 profitable trades',         icon: 'dollar-sign',     xp_reward: 75,  criteria_type: 'profitable_trades', criteria_value: 5   },
    { name: 'Smart Investor',    description: 'Make 25 profitable trades',        icon: 'brain',           xp_reward: 200, criteria_type: 'profitable_trades', criteria_value: 25  },
    { name: 'First Lesson',      description: 'Complete your first lesson',       icon: 'book-open',       xp_reward: 50,  criteria_type: 'lessons_completed', criteria_value: 1   },
    { name: 'Knowledge Seeker',  description: 'Complete 5 lessons',               icon: 'graduation-cap',  xp_reward: 150, criteria_type: 'lessons_completed', criteria_value: 5   },
    { name: 'Scholar',           description: 'Complete 10 lessons',              icon: 'library',         xp_reward: 300, criteria_type: 'lessons_completed', criteria_value: 10  },
    { name: 'Finance Expert',    description: 'Complete all lessons',             icon: 'star',            xp_reward: 500, criteria_type: 'lessons_completed', criteria_value: 22  },
    { name: 'Algo Pioneer',     description: 'Complete all algo trading lessons', icon: 'bot',             xp_reward: 200, criteria_type: 'lessons_completed', criteria_value: 22  },
    { name: 'On Fire',           description: 'Maintain a 3-day streak',          icon: 'flame',           xp_reward: 50,  criteria_type: 'streak_days',       criteria_value: 3   },
    { name: 'Dedicated',         description: 'Maintain a 7-day streak',          icon: 'fire',            xp_reward: 100, criteria_type: 'streak_days',       criteria_value: 7   },
    { name: 'Unstoppable',       description: 'Maintain a 30-day streak',         icon: 'zap',             xp_reward: 300, criteria_type: 'streak_days',       criteria_value: 30  },
    { name: 'Diversifier',       description: 'Trade 5 different stocks',         icon: 'pie-chart',       xp_reward: 75,  criteria_type: 'unique_stocks',     criteria_value: 5   },
    { name: 'Portfolio Master',  description: 'Trade 15 different stocks',        icon: 'briefcase',       xp_reward: 200, criteria_type: 'unique_stocks',     criteria_value: 15  },
    { name: 'Risk Expert',       description: 'Complete all advanced lessons',    icon: 'shield',          xp_reward: 400, criteria_type: 'lessons_completed', criteria_value: 15  },
  ];

  export const dailyChallenges = [
    { title: 'Make a Trade',      description: 'Execute at least one trade today',     type: 'make_trade',     target: 1, xp_reward: 25 },
    { title: 'Complete a Lesson', description: 'Finish one learning module',           type: 'complete_lesson',target: 1, xp_reward: 30 },
    { title: 'Daily Login',       description: 'Log in to the platform',               type: 'daily_login',    target: 1, xp_reward: 10 },
    { title: 'Power Trader',      description: 'Make 3 trades in one day',             type: 'make_trade',     target: 3, xp_reward: 60 },
    { title: 'Learning Sprint',   description: 'Complete 2 lessons in a single day',   type: 'complete_lesson',target: 2, xp_reward: 50 },
  ];

  // ─── LESSONS ─────────────────────────────────────────────────────────────────

  export function mkLesson(
    title: string, description: string, category: string,
    difficulty: string, xp_reward: number, duration_minutes: number,
    order_index: number, prerequisite_id: number | null, content: object
  ) {
    return { title, description, category, difficulty, xp_reward, duration_minutes, order_index, prerequisite_id, content: JSON.stringify(content) };
  }

  export const lessons = [
    // ── BEGINNER ──────────────────────────────────────────────────────────────
    mkLesson('What is the Stock Market?', 'Discover how millions of people invest in businesses every day', 'basics', 'beginner', 25, 5, 1, null, {
      sections: [
        { type: 'story', title: 'Meet Kate', content: 'Kate is 17 and curious about where rich people put their money. She overheard her parents talking about "the market going up." What does that even mean?' },
        { type: 'text', title: 'The Stock Market Explained', content: 'The stock market is a marketplace where people buy and sell tiny pieces of companies. Just like a vegetable market sells vegetables, the stock market sells ownership pieces of businesses.' },
        { type: 'example', title: 'NSE & BSE — India\'s Two Main Exchanges', content: 'In India we have two major stock exchanges: the NSE (National Stock Exchange) and BSE (Bombay Stock Exchange, est. 1875 — Asia\'s oldest!). Companies list their shares here so anyone can buy them.' },
        { type: 'text', title: 'Why Does It Exist?', content: 'Companies need money to grow. Instead of only borrowing from banks, they can sell small ownership pieces (shares) to thousands of investors. Investors get a chance to profit as the company grows.' },
        { type: 'interactive', question: 'What is the stock market?', options: ['A physical fruit & vegetable market', 'A place to buy and sell ownership pieces of companies', 'A government bank', 'Only for very rich people'], correctAnswer: 1 },
      ],
      quiz: [
        { question: 'What does NSE stand for?', options: ['National Share Exchange', 'National Stock Exchange', 'New Stock Exchange', 'None of the above'], correctAnswer: 1, explanation: 'NSE stands for National Stock Exchange, one of India\'s two main stock exchanges.' },
        { question: 'Why do companies sell shares to the public?', options: ['To share profits equally', 'To raise money for growth', 'To pay employees', 'To avoid taxes'], correctAnswer: 1, explanation: 'Companies sell shares to raise capital they can use to expand, hire, build, and grow.' },
      ],
    }),

    mkLesson('What is a Share?', 'Understand what you actually own when you buy a share', 'basics', 'beginner', 25, 5, 2, 1, {
      sections: [
        { type: 'story', title: 'The Pizza Shop Analogy', content: 'Kate and 3 friends want to open a pizza shop worth ₹1,00,000. They split it into 1,000 equal parts (shares) at ₹100 each. Each friend buys 250 shares. They each own 25% of the pizza shop.' },
        { type: 'text', title: 'Shares = Ownership', content: 'A share (also called a stock) represents one unit of ownership in a company. If Reliance Industries has 1,000 crore shares and you own 100, you own a tiny fraction of one of India\'s biggest companies.' },
        { type: 'example', title: 'Rights as a Shareholder', content: 'As a shareholder you may receive: Dividends (share of profits), Voting rights on company decisions, and a claim on assets if the company is sold.' },
        { type: 'text', title: 'Face Value vs Market Price', content: 'Shares have a "face value" (usually ₹1 or ₹10) which is the original price. The "market price" is what people are currently willing to pay — this changes every second during market hours!' },
        { type: 'interactive', question: 'If a company has 500 shares and you own 50, what percentage do you own?', options: ['5%', '10%', '15%', '50%'], correctAnswer: 1 },
      ],
      quiz: [
        { question: 'What do shareholders receive as a share of company profits?', options: ['Salary', 'Loan', 'Dividend', 'Tax refund'], correctAnswer: 2, explanation: 'Companies sometimes distribute a portion of profits to shareholders as dividends.' },
        { question: 'The price at which a share currently trades is called:', options: ['Face value', 'Book value', 'Market price', 'Par value'], correctAnswer: 2, explanation: 'Market price is the current price at which shares are being bought and sold.' },
      ],
    }),

    mkLesson('Market Orders vs Limit Orders', 'Learn the two most important order types every trader must know', 'basics', 'beginner', 30, 7, 3, 2, {
      sections: [
        { type: 'text', title: 'Two Ways to Buy', content: 'When you want to buy a stock, you have to tell your broker HOW to buy it. The two main ways are: Market Orders and Limit Orders.' },
        { type: 'example', title: 'Market Order', content: 'A Market Order says: "Buy this stock RIGHT NOW at whatever price it\'s trading." You get the shares immediately, but you don\'t control the exact price. Great when speed matters.' },
        { type: 'example', title: 'Limit Order', content: 'A Limit Order says: "Buy this stock ONLY if the price reaches ₹500 or below." You control the price, but the order might not fill if the price never reaches your limit.' },
        { type: 'text', title: 'Which Should You Use?', content: 'For this simulator, all orders are market orders (instant execution at current price). In real trading, limit orders help you avoid buying at a bad price during volatile moments.' },
        { type: 'interactive', question: 'You want to buy TCS shares immediately at whatever the current price is. You should use a:', options: ['Limit order', 'Market order', 'Stop order', 'Options contract'], correctAnswer: 1 },
      ],
      quiz: [
        { question: 'A limit order guarantees:', options: ['Immediate execution', 'A specific price', 'High profits', 'Zero risk'], correctAnswer: 1, explanation: 'Limit orders guarantee the price you pay (or receive), but NOT that the order will be filled.' },
        { question: 'When would a market order NOT be ideal?', options: ['When you want fast execution', 'During a highly volatile, fast-moving stock', 'When buying large-cap stocks', 'When the market is open'], correctAnswer: 1, explanation: 'In volatile markets, a market order can fill at a much worse price than expected (called slippage).' },
      ],
    }),

    mkLesson('Bid and Ask Price', 'Understand how the two-sided market actually works', 'basics', 'beginner', 30, 7, 4, 3, {
      sections: [
        { type: 'story', title: 'The Auction House', content: 'Imagine an auction. The seller wants ₹500 for a painting. A buyer offers ₹490. There\'s a gap — the "spread." The stock market works the same way every millisecond.' },
        { type: 'text', title: 'Bid Price', content: 'The BID is the highest price a buyer is currently willing to PAY for a share. Think of it as the "buy offer" sitting in the market.' },
        { type: 'text', title: 'Ask Price', content: 'The ASK (or "offer") is the lowest price a seller is currently willing to ACCEPT. This is always higher than the bid.' },
        { type: 'example', title: 'The Spread', content: 'INFY Bid: ₹1,490 | Ask: ₹1,492. The "spread" is ₹2. This is how market makers earn money. When you BUY, you pay the Ask. When you SELL, you receive the Bid.' },
        { type: 'interactive', question: 'HDFC Bank Bid: ₹1,600 | Ask: ₹1,603. If you buy right now, how much do you pay per share?', options: ['₹1,600', '₹1,601.50', '₹1,603', '₹1,599'], correctAnswer: 2 },
      ],
      quiz: [
        { question: 'What is the "spread" in stock trading?', options: ['Total profit from a trade', 'Difference between bid and ask price', 'Daily price range', 'Brokerage commission'], correctAnswer: 1, explanation: 'The spread is the difference between the bid (buy) and ask (sell) price.' },
        { question: 'When you sell a stock, you receive:', options: ['The ask price', 'The bid price', 'The average of bid and ask', 'The previous day\'s closing price'], correctAnswer: 1, explanation: 'When selling, your trade executes at the bid price — what buyers are willing to pay.' },
      ],
    }),

    mkLesson('How Stock Charts Work', 'Read price charts like a pro trader', 'basics', 'beginner', 35, 8, 5, 4, {
      sections: [
        { type: 'text', title: 'A Picture of Price History', content: 'A stock chart is simply a visual record of a stock\'s price over time. The X-axis shows time, the Y-axis shows price. That\'s it!' },
        { type: 'text', title: 'Types of Charts', content: 'Line Chart: Just closing prices connected. Clean and simple. Bar Chart: Shows open, high, low, close for each period. Candlestick Chart: The most popular — colourful bars that show the same info as bar charts but easier to read.' },
        { type: 'example', title: 'Time Frames', content: 'Charts can show different time frames: 1 minute, 5 minutes, 1 hour, 1 day, 1 week. A day trader might watch 5-minute charts. A long-term investor might look at weekly or monthly charts.' },
        { type: 'text', title: 'Volume Bars', content: 'Below most charts, you\'ll see volume bars — how many shares were traded. High volume confirms a price move. Low volume moves are less reliable.' },
        { type: 'interactive', question: 'On a daily chart, each data point represents prices for:', options: ['One minute', 'One hour', 'One trading day', 'One week'], correctAnswer: 2 },
      ],
      quiz: [
        { question: 'What does the Y-axis on a price chart show?', options: ['Time', 'Volume', 'Price', 'Date'], correctAnswer: 2, explanation: 'The Y-axis (vertical) shows the price level, while X-axis shows time.' },
        { question: 'High volume during a price rise typically means:', options: ['The move is weak', 'The move is confirmed and strong', 'The stock will reverse', 'Nothing significant'], correctAnswer: 1, explanation: 'High volume confirms price moves. When many traders agree on a direction, it\'s more meaningful.' },
      ],
    }),

    mkLesson('Introduction to Candlesticks', 'Master the language of candlestick charts', 'basics', 'beginner', 35, 8, 6, 5, {
      sections: [
        { type: 'text', title: 'Why Candlesticks?', content: 'Invented by Japanese rice traders in the 1700s, candlestick charts pack 4 pieces of data into one visual shape: Open, High, Low, Close (OHLC).' },
        { type: 'example', title: 'Anatomy of a Candle', content: 'The BODY: thick part between Open and Close. The WICK/SHADOW: thin lines above and below the body showing High and Low. GREEN/WHITE body = price rose (close > open). RED/BLACK body = price fell (close < open).' },
        { type: 'example', title: 'Common Patterns', content: 'Doji: Open ≈ Close — market indecision. Hammer: Small body, long lower wick — potential reversal up. Shooting Star: Small body, long upper wick — potential reversal down.' },
        { type: 'text', title: 'Reading the Story', content: 'Each candle tells a story. A long green candle with no wicks = bulls completely dominated. A doji after a long trend = momentum fading. Patterns become more reliable over longer timeframes.' },
        { type: 'interactive', question: 'A red candlestick means:', options: ['The stock has high volume', 'The closing price was lower than the opening price', 'The stock hit a 52-week high', 'The market was closed'], correctAnswer: 1 },
      ],
      quiz: [
        { question: 'What does a "Doji" candlestick indicate?', options: ['Strong bullish momentum', 'Strong bearish momentum', 'Market indecision', 'High trading volume'], correctAnswer: 2, explanation: 'A Doji forms when Open ≈ Close, showing neither buyers nor sellers won — market indecision.' },
        { question: 'The thin lines above and below a candle\'s body are called:', options: ['Flags', 'Wicks or Shadows', 'Gaps', 'Spreads'], correctAnswer: 1, explanation: 'The thin lines show the High (upper wick) and Low (lower wick) of the trading period.' },
      ],
    }),

    // ── INTERMEDIATE ──────────────────────────────────────────────────────────
    mkLesson('Support and Resistance', 'Find the price levels where stocks historically bounce', 'technical', 'intermediate', 40, 10, 7, 6, {
      sections: [
        { type: 'text', title: 'Price Has Memory', content: 'Surprisingly, prices often bounce at the same levels repeatedly. This is because traders remember these levels and act on them — creating self-fulfilling prophecies.' },
        { type: 'example', title: 'Support Level', content: 'SUPPORT is a price level where a stock has repeatedly bounced UP from. Think of it as a floor. Why? At that price, many buyers step in ("it\'s cheap!"), absorbing sellers and pushing price back up.' },
        { type: 'example', title: 'Resistance Level', content: 'RESISTANCE is a price level where a stock has repeatedly failed to break above. Think of it as a ceiling. At that price, many sellers appear ("it\'s expensive!"), overwhelming buyers.' },
        { type: 'text', title: 'Role Reversal', content: 'When a stock breaks through resistance, that resistance level often BECOMES the new support. This "role reversal" is one of the most powerful concepts in technical analysis.' },
        { type: 'interactive', question: 'Reliance stock keeps bouncing off ₹2,400. This level is best described as:', options: ['Resistance', 'Support', 'Moving Average', 'Pivot Point'], correctAnswer: 1 },
      ],
      quiz: [
        { question: 'When a stock breaks above its resistance level, what often happens to that level?', options: ['It becomes irrelevant', 'It becomes the new support', 'It becomes a stronger resistance', 'Nothing changes'], correctAnswer: 1, explanation: 'This is called "role reversal" — broken resistance becomes new support as traders remember the breakout level.' },
        { question: 'At a support level, you typically find:', options: ['More sellers than buyers', 'Equal buyers and sellers', 'More buyers than sellers', 'No trading activity'], correctAnswer: 2, explanation: 'Support levels attract buyers who see the price as a good value, creating demand that holds price up.' },
      ],
    }),

    mkLesson('Trendlines', 'Draw and use trendlines to identify market direction', 'technical', 'intermediate', 40, 10, 8, 7, {
      sections: [
        { type: 'text', title: 'Trends Are Your Friend', content: 'One of the oldest trading sayings: "The trend is your friend." A trendline helps you visually identify the direction a stock is moving.' },
        { type: 'example', title: 'Uptrend Line', content: 'In an UPTREND, connect at least 2-3 higher lows with a straight line. This line acts as dynamic support. As long as price stays above the line, the uptrend is intact.' },
        { type: 'example', title: 'Downtrend Line', content: 'In a DOWNTREND, connect 2-3 lower highs. This line acts as dynamic resistance. Traders often sell when price "bounces off" the downtrend line.' },
        { type: 'text', title: 'Trendline Breaks', content: 'When price breaks through a trendline with strong volume, it often signals a trend change. This is one of the most watched signals in technical analysis.' },
        { type: 'interactive', question: 'To draw a valid uptrend line, you connect:', options: ['Lower highs', 'Higher highs', 'Higher lows', 'Equal lows'], correctAnswer: 2 },
      ],
      quiz: [
        { question: 'What does it signal when price breaks below an uptrend line with high volume?', options: ['Trend is strengthening', 'Possible trend reversal or weakening', 'Good time to buy', 'Nothing significant'], correctAnswer: 1, explanation: 'A break below an uptrend line on high volume suggests the uptrend may be ending.' },
        { question: 'How many points minimum are needed to draw a valid trendline?', options: ['1', '2', '5', '10'], correctAnswer: 1, explanation: 'You need at least 2 points to draw a line, but 3 or more points make the trendline much more reliable.' },
      ],
    }),

    mkLesson('Moving Averages', 'Use the most popular technical indicator to smooth price action', 'technical', 'intermediate', 45, 12, 9, 8, {
      sections: [
        { type: 'text', title: 'Smoothing the Noise', content: 'Prices are noisy and jump around. A Moving Average (MA) calculates the average price over a set period, creating a smooth line that shows the underlying trend.' },
        { type: 'example', title: '20-Day Moving Average', content: 'The 20 MA adds up the last 20 days of closing prices and divides by 20. Each day, the oldest price drops off and the newest one is added. The line "moves" with price.' },
        { type: 'text', title: 'Golden Cross & Death Cross', content: 'GOLDEN CROSS: 50-day MA crosses ABOVE 200-day MA → Bullish signal (many institutional traders buy). DEATH CROSS: 50-day MA crosses BELOW 200-day MA → Bearish signal.' },
        { type: 'example', title: 'Using MAs as Support/Resistance', content: 'The 200-day MA is watched by millions of traders worldwide. When a stock\'s price falls to its 200 MA, large funds often step in to buy. When price is far above it, a pullback is likely.' },
        { type: 'interactive', question: 'A "Golden Cross" occurs when:', options: ['Price touches its 52-week high', 'The 50 MA crosses above the 200 MA', 'The 200 MA crosses above the 50 MA', 'Volume doubles suddenly'], correctAnswer: 1 },
      ],
      quiz: [
        { question: 'What does a 50-day moving average calculate?', options: ['Sum of 50 days of prices', 'Average of last 50 days of closing prices', 'Highest price in 50 days', 'Average volume over 50 days'], correctAnswer: 1, explanation: 'Moving averages calculate the average closing price over a specified number of periods.' },
        { question: 'Why is the 200-day moving average significant?', options: ['It\'s required by SEBI', 'It\'s watched by millions of global traders who act on it', 'It predicts dividends', 'It shows company earnings'], correctAnswer: 1, explanation: 'The 200-day MA is a self-fulfilling signal because so many institutions watch and trade off it.' },
      ],
    }),

    mkLesson('Volume Analysis', 'Confirm price moves using volume — the fuel of the market', 'technical', 'intermediate', 45, 12, 10, 9, {
      sections: [
        { type: 'text', title: 'Volume is Fuel', content: 'Price is direction. Volume is conviction. A price move on high volume has strong backing. The same price move on low volume is suspect and often reverses.' },
        { type: 'example', title: 'Volume Confirms Breakouts', content: 'TCS breaks above ₹3,500 resistance. If this happens on 3x normal volume, it\'s a strong breakout. If it happens on 0.5x normal volume, it\'s likely a "false breakout" that will fail.' },
        { type: 'text', title: 'Volume Precedes Price', content: 'Often, volume spikes BEFORE a big price move. Unusual volume without a price move can mean "smart money" is accumulating quietly before a big announcement.' },
        { type: 'example', title: 'Volume Divergence', content: 'If a stock makes new highs but volume is decreasing, the trend is weakening. This "volume divergence" warns that the rally is losing steam and a reversal may be near.' },
        { type: 'interactive', question: 'A stock breaks out to a new high but volume is very low. This suggests:', options: ['Very strong breakout', 'Breakout may be false or weak', 'Time to immediately buy', 'The stock will split'], correctAnswer: 1 },
      ],
      quiz: [
        { question: 'High volume during a price decline means:', options: ['Weak selling pressure', 'Strong selling conviction — bearish', 'Time to buy immediately', 'Volume and direction are unrelated'], correctAnswer: 1, explanation: 'High volume confirms the conviction behind a move. High-volume declines show strong selling pressure.' },
        { question: 'Volume divergence (rising price, falling volume) typically signals:', options: ['Strengthening trend', 'Possible trend weakening', 'Increased buying', 'A dividend announcement'], correctAnswer: 1, explanation: 'When price rises but volume falls, fewer traders are participating — the trend may be losing steam.' },
      ],
    }),

    mkLesson('Risk vs Reward', 'Calculate if a trade is worth taking before you enter', 'fundamentals', 'intermediate', 45, 12, 11, 10, {
      sections: [
        { type: 'text', title: 'The Trade-Off Every Trader Must Calculate', content: 'Before entering ANY trade, ask: "How much can I lose? How much can I gain?" This risk/reward ratio determines if the trade is mathematically worth taking.' },
        { type: 'example', title: 'Calculating Risk/Reward', content: 'You buy HDFC Bank at ₹1,600. Your stop-loss (max loss) is at ₹1,560 = ₹40 risk. Your target (profit goal) is ₹1,720 = ₹120 reward. Risk:Reward = 1:3. That\'s excellent — risk ₹40 to make ₹120.' },
        { type: 'text', title: 'The Minimum Ratio', content: 'Most professional traders only take trades with at least 1:2 risk/reward. Even if you\'re only right 40% of the time, with 1:3 R/R you still make money overall.' },
        { type: 'example', title: 'Proof of the Math', content: '10 trades at 1:3 R/R. Win 4, Lose 6. Gains: 4 × ₹300 = ₹1,200. Losses: 6 × ₹100 = ₹600. Net profit: ₹600! Being right only 40% still beats the market with good R/R.' },
        { type: 'interactive', question: 'You risk ₹50 on a trade with a profit target of ₹150. Your risk:reward ratio is:', options: ['1:1', '1:2', '1:3', '3:1'], correctAnswer: 2 },
      ],
      quiz: [
        { question: 'What is the minimum risk:reward ratio most professionals recommend?', options: ['1:0.5', '1:1', '1:2', '1:5'], correctAnswer: 2, explanation: 'A 1:2 minimum means you aim to make at least twice what you\'re risking, giving an edge over time.' },
        { question: 'A "stop-loss" is used to:', options: ['Lock in profits', 'Limit the maximum loss on a trade', 'Calculate dividends', 'Predict future price'], correctAnswer: 1, explanation: 'A stop-loss is a pre-set price at which you\'ll exit a losing trade to prevent further losses.' },
      ],
    }),

    // ── ADVANCED ──────────────────────────────────────────────────────────────
    mkLesson('Risk Management', 'The skill that separates surviving traders from those who blow up', 'advanced', 'advanced', 50, 15, 12, 11, {
      sections: [
        { type: 'story', title: 'The Trader Who Survived', content: 'Most new traders blow up their account in the first year — not from bad stock picks, but from bad risk management. The best traders aren\'t those who are always right; they\'re those who control their losses.' },
        { type: 'text', title: 'The 1% Rule', content: 'Professional rule: Never risk more than 1-2% of your total portfolio on a single trade. With ₹1,00,000, that means risking max ₹1,000-₹2,000 per trade. This way, even 10 consecutive losses won\'t destroy you.' },
        { type: 'example', title: 'Position Sizing from Risk', content: 'Portfolio: ₹1,00,000. Max risk: 1% = ₹1,000. Stop-loss on INFY: ₹50 below entry. Position size = Risk / Stop = ₹1,000 / ₹50 = 20 shares. Simple!' },
        { type: 'text', title: 'The Ruin Formula', content: 'If you risk 50% on one trade and lose, you need to make 100% back just to break even. Risk 10% and lose: need 11% to recover. Risk 1%: need only 1.01% to recover. Small, controlled losses keep you in the game.' },
        { type: 'interactive', question: 'With a ₹1,00,000 portfolio and 1% risk rule, the maximum you should risk per trade is:', options: ['₹100', '₹1,000', '₹10,000', '₹50,000'], correctAnswer: 1 },
      ],
      quiz: [
        { question: 'Why do most retail traders fail to preserve capital?', options: ['They choose wrong stocks', 'They risk too much per trade and blow up', 'They trade too infrequently', 'They avoid stop losses because they help'], correctAnswer: 1, explanation: 'Most retail traders lose not because of stock selection but because of over-sizing positions and not using stop-losses.' },
        { question: 'If you lose 50% of your capital, what return do you need to get back to break-even?', options: ['50%', '75%', '100%', '25%'], correctAnswer: 2, explanation: 'A 50% loss requires a 100% gain to recover — demonstrating why protecting capital is paramount.' },
      ],
    }),

    mkLesson('Position Sizing', 'Calculate the exact number of shares to buy for every trade', 'advanced', 'advanced', 50, 15, 13, 12, {
      sections: [
        { type: 'text', title: 'Why Position Sizing Matters', content: 'Two traders use the same strategy. One sizes positions correctly and grows 30% a year. The other over-sizes and blows up. Position sizing is the difference between a career and a catastrophe.' },
        { type: 'example', title: 'The Formula', content: 'Position Size = (Portfolio × Risk%) ÷ (Entry Price - Stop Price)\n\nExample: Portfolio ₹5,00,000 | Risk 1% = ₹5,000 | Entry ₹2,000 | Stop ₹1,950 | Difference = ₹50\nPosition Size = ₹5,000 ÷ ₹50 = 100 shares (value: ₹2,00,000 = 40% of portfolio)' },
        { type: 'text', title: 'The Kelly Criterion', content: 'The Kelly Criterion is a mathematical formula that calculates the optimal position size based on your win rate and average win/loss ratio. Most pros use "half Kelly" to be more conservative.' },
        { type: 'example', title: 'Pyramid Into Winners', content: 'Advanced traders add to winning positions: buy 50% at breakout, add 25% when up 5%, add 25% when up 10%. This "pyramiding" maximises gains in strong trends without increasing initial risk.' },
        { type: 'interactive', question: 'Portfolio ₹1,00,000. Risk 2%. Entry ₹500. Stop ₹480. Position size should be:', options: ['10 shares', '100 shares', '50 shares', '200 shares'], correctAnswer: 1 },
      ],
      quiz: [
        { question: 'What is the main purpose of correct position sizing?', options: ['Maximize profits on every trade', 'Ensure no single loss can cripple the account', 'Predict future price movements', 'Avoid paying brokerage'], correctAnswer: 1, explanation: 'Position sizing ensures that even a string of losses is survivable, keeping you in the game long-term.' },
        { question: '"Pyramiding" in trading means:', options: ['A fraudulent trading scheme', 'Adding to a losing position', 'Adding to a winning position in stages', 'Diversifying across sectors'], correctAnswer: 2, explanation: 'Pyramiding means adding to a position as it moves in your favour, increasing gains in strong trends.' },
      ],
    }),

    mkLesson('Trading Psychology', 'Master your mind — the hardest part of trading', 'advanced', 'advanced', 55, 15, 14, 13, {
      sections: [
        { type: 'story', title: 'The Emotional Rollercoaster', content: 'Arjun had a perfect trading plan. But when the trade went red, fear paralysed him. He didn\'t cut his loss. When it went green, greed made him hold too long. He gave back all the gains. Sound familiar?' },
        { type: 'text', title: 'The Two Enemies: Fear & Greed', content: 'FEAR makes you exit winning trades too early, hesitate on good setups, and panic-sell at bottoms. GREED makes you hold losers too long ("it\'ll come back"), overtrade, and abandon your plan for excitement.' },
        { type: 'example', title: 'Cognitive Biases in Trading', content: 'Loss Aversion: Losses feel 2x more painful than equal gains feel good → leads to holding losers. Confirmation Bias: Only reading news that confirms your view. Recency Bias: Assuming recent trends will continue indefinitely.' },
        { type: 'text', title: 'The Trading Journal Solution', content: 'Professional traders keep a journal: entry reason, exit reason, emotions felt, lessons learned. Reviewing your journal exposes patterns in your mistakes. You can\'t fix what you don\'t track.' },
        { type: 'interactive', question: 'Which psychological bias causes traders to hold losing positions too long?', options: ['Overconfidence', 'Loss Aversion', 'Recency Bias', 'Anchoring'], correctAnswer: 1 },
      ],
      quiz: [
        { question: 'What is "loss aversion" in trading psychology?', options: ['Avoiding trades entirely', 'Feeling losses more intensely than equivalent gains', 'Only trading to avoid losing money', 'A trading strategy'], correctAnswer: 1, explanation: 'Loss aversion means losses feel roughly twice as painful as equivalent gains feel good, causing irrational holding of losers.' },
        { question: 'Why do professional traders keep a trading journal?', options: ['For tax purposes only', 'To identify emotional patterns and improve decision-making', 'To prove trades to their broker', 'It\'s required by regulation'], correctAnswer: 1, explanation: 'A trading journal helps traders identify recurring mistakes, emotional patterns, and refine their strategy over time.' },
      ],
    }),

    mkLesson('Strategy Backtesting', 'Test your strategy on historical data before risking real money', 'advanced', 'advanced', 55, 15, 15, 14, {
      sections: [
        { type: 'text', title: 'Test Before You Invest', content: 'Would you drive a car without testing it first? Before trading a strategy with real money, backtest it: apply the rules to historical price data and see how it would have performed.' },
        { type: 'example', title: 'What Backtesting Tells You', content: 'Win Rate: % of trades that were profitable. Avg Win / Avg Loss: Is your R/R ratio positive? Max Drawdown: Largest peak-to-trough loss. Sharpe Ratio: Return per unit of risk. These metrics reveal if a strategy has an edge.' },
        { type: 'text', title: 'The Backtest Trap', content: '"Curve fitting" or "overfitting" is when you optimize a strategy to perfectly fit past data. It looks incredible in backtests but fails in live trading. Always test on OUT-OF-SAMPLE data the strategy has never seen.' },
        { type: 'example', title: 'Walk-Forward Testing', content: 'Professional method: Optimize strategy on data from 2015-2020. Test on 2021-2023 data it\'s never seen. If results are similar, the strategy is robust. If performance collapses, it was overfit.' },
        { type: 'interactive', question: 'Testing a strategy on data it was optimized on (in-sample) and claiming good results is called:', options: ['Walk-forward testing', 'Curve fitting / overfitting', 'Monte Carlo testing', 'Paper trading'], correctAnswer: 1 },
      ],
      quiz: [
        { question: 'What is the maximum drawdown metric in backtesting?', options: ['Total return of the strategy', 'Largest peak-to-trough loss during the test period', 'Number of winning trades', 'Average trade duration'], correctAnswer: 1, explanation: 'Maximum drawdown shows the worst-case loss scenario — crucial for understanding if you can psychologically handle the strategy.' },
        { question: 'Out-of-sample testing means testing on:', options: ['Data used to build the strategy', 'Data the strategy has never seen before', 'Real-time live data only', 'The most recent 30 days'], correctAnswer: 1, explanation: 'Out-of-sample testing validates a strategy on data it wasn\'t optimized on, proving it\'s genuinely robust.' },
      ],
    }),

    mkLesson('Portfolio Diversification', 'Build a resilient portfolio that survives market storms', 'advanced', 'advanced', 55, 15, 16, 15, {
      sections: [
        { type: 'text', title: 'Beyond "Spread Your Money"', content: 'True diversification isn\'t just owning 20 stocks. If all 20 are IT companies, they\'ll all crash together. Real diversification means uncorrelated assets — things that don\'t all move in the same direction.' },
        { type: 'example', title: 'Correlation', content: 'TCS and Infosys are highly correlated — both fall when IT sector suffers. TCS and a pharma company like Sun Pharma are less correlated. Gold and stocks often move in opposite directions (negative correlation).' },
        { type: 'text', title: 'Asset Allocation', content: 'A simple allocation: 60% large-cap stocks across sectors, 20% mid-caps, 10% bonds/debt, 10% gold. Rebalance quarterly. This approach has historically delivered 12-15% annual returns with much less volatility than all-stock.' },
        { type: 'example', title: 'Sector Diversification in India', content: 'NSE has 11 major sectors: IT, Banking, Pharma, Auto, FMCG, Energy, Metals, Real Estate, Utilities, Telecom, Consumer Durables. Owning leaders from 5+ different sectors provides excellent sector diversification.' },
        { type: 'interactive', question: 'Which combination is BEST diversified?', options: ['TCS, Infosys, Wipro, HCL (all IT)', 'Reliance, HDFC Bank, Dr Reddy\'s, Maruti (4 different sectors)', 'Any 20 stocks', 'Only large-cap stocks'], correctAnswer: 1 },
      ],
      quiz: [
        { question: 'What does "correlation" mean in portfolio context?', options: ['How profitable two stocks are', 'How similarly two assets move together', 'Total value of two holdings', 'Trading volume between two stocks'], correctAnswer: 1, explanation: 'Correlation measures how similarly two assets move. High correlation = they move together, reducing diversification benefit.' },
        { question: 'Why is gold often included in a diversified portfolio?', options: ['Gold always goes up', 'Gold is negatively correlated with stocks during crises', 'Gold pays dividends', 'Gold has no volatility'], correctAnswer: 1, explanation: 'Gold often moves opposite to stocks during market crashes, acting as a hedge that reduces overall portfolio volatility.' },
      ],
    }),

    mkLesson('Risk Management: Advanced', 'Sophisticated strategies used by hedge funds and professional traders', 'advanced', 'advanced', 60, 18, 17, 16, {
      sections: [
        { type: 'text', title: 'From Beginner to Professional', content: 'You\'ve learned the basics of risk management. Now let\'s look at tools professionals use: hedging, options for protection, and portfolio-level risk metrics.' },
        { type: 'example', title: 'Value at Risk (VaR)', content: 'VaR tells you: "With 95% confidence, my portfolio won\'t lose more than X in one day." Example: Portfolio ₹10,00,000 with 1-day 95% VaR of ₹50,000 means 95% of days, you lose less than ₹50,000.' },
        { type: 'text', title: 'Hedging', content: 'HEDGING is buying an asset that moves opposite to your portfolio to reduce risk. Owning IT stocks? Buy puts on Nifty IT index to hedge. The hedge costs money (like insurance premium) but limits downside.' },
        { type: 'example', title: 'The Sharpe Ratio', content: 'Sharpe Ratio = (Return - Risk-Free Rate) / Standard Deviation. It measures return per unit of risk. Sharpe > 1 is good, > 2 is excellent. A strategy making 20% with high volatility may be worse than 15% with low volatility.' },
        { type: 'interactive', question: 'Hedging is best described as:', options: ['Taking larger positions', 'Buying assets that offset portfolio risk', 'Avoiding all risky investments', 'Concentrating in safe sectors'], correctAnswer: 1 },
      ],
      quiz: [
        { question: 'What does a Sharpe Ratio of 2.5 tell you compared to 0.5?', options: ['Higher returns only', 'Much better return relative to the risk taken', 'Lower volatility only', 'Better tax efficiency'], correctAnswer: 1, explanation: 'A higher Sharpe Ratio means you\'re generating more return for each unit of risk — a more efficient use of capital.' },
        { question: 'What is the main purpose of hedging a portfolio?', options: ['To increase returns', 'To reduce downside risk at the cost of some upside', 'To eliminate all risk', 'To reduce taxes'], correctAnswer: 1, explanation: 'Hedging reduces risk but also typically limits potential gains — it\'s insurance, not a profit strategy.' },
      ],
    }),

    mkLesson('Full Trading Simulation Challenge', 'Apply everything you\'ve learned in a complete trading exercise', 'advanced', 'advanced', 100, 20, 18, 17, {
      sections: [
        { type: 'text', title: 'The Final Challenge', content: 'Congratulations on reaching the final lesson! This is where everything comes together. You\'ll use all the skills you\'ve learned: chart reading, risk management, position sizing, and trading psychology.' },
        { type: 'example', title: 'Your Mission', content: 'Over the next week in StockSim: Execute at least 5 trades applying proper risk management. Keep each position risk under 2% of portfolio. Aim for 1:2+ risk/reward on every trade. Keep a mental note of your emotions.' },
        { type: 'text', title: 'The Professional\'s Checklist', content: 'Before every trade ask: 1. Is there a clear setup? 2. Where is my stop-loss? 3. What\'s my target? 4. Is R/R at least 1:2? 5. Am I trading a plan or an emotion? If you can\'t answer all 5, skip the trade.' },
        { type: 'example', title: 'What Separates the Top 10%', content: 'Consistent profitability comes from: Process (not predictions), Risk management (not stock tips), Patience (not overtrading), and Continuous learning (not arrogance). You now have the foundation. Keep learning. Keep improving.' },
        { type: 'interactive', question: 'Before entering a trade, which should you define FIRST?', options: ['The profit target', 'The stop-loss (maximum risk)', 'The entry price', 'The position size'], correctAnswer: 1 },
      ],
      quiz: [
        { question: 'What is the most important habit for long-term trading success?', options: ['Finding the best stock tips', 'Consistent risk management and process', 'Trading as frequently as possible', 'Never taking losses'], correctAnswer: 1, explanation: 'Consistent risk management and following a process — regardless of individual trade outcomes — is what creates long-term profitability.' },
        { question: 'You\'re about to enter a trade but can\'t identify a clear stop-loss level. You should:', options: ['Enter anyway with a gut-feel stop', 'Skip the trade', 'Use 10% below entry as default', 'Ask a friend'], correctAnswer: 1, explanation: 'Without a defined stop-loss, you have no risk management. Professional traders skip trades that don\'t have clear setups.' },
      ],
    }),

    // ── ALGO TRADING ──────────────────────────────────────────────────────────

    mkLesson('What is Algorithmic Trading?', 'Learn how computers execute trades faster and smarter than humans', 'algo', 'intermediate', 40, 10, 19, 18, {
      sections: [
        { type: 'story', title: 'The Robot Trader', content: 'Imagine you could clone yourself, give your clone a strict rulebook, and have it watch 500 stocks 24/7 without ever getting tired, greedy, or scared. That\'s essentially what algorithmic trading is. Instead of a human clone, it\'s a computer program executing trades based on pre-written rules.' },
        { type: 'text', title: 'What is Algorithmic Trading?', content: 'Algorithmic trading (also called "algo trading" or "automated trading") is the use of computer programs to execute buy and sell orders based on a defined set of rules — called a strategy. The rules can be based on price, timing, volume, technical indicators, or even news sentiment.' },
        { type: 'example', title: 'A Simple Algorithm in Plain English', content: 'Here\'s an example of a simple algo rule: "IF the 10-day moving average of RELIANCE crosses ABOVE the 20-day moving average, BUY 100 shares. IF the 10-day MA crosses BELOW the 20-day MA, SELL all shares." That\'s it. No emotion, no second-guessing — just rules.' },
        { type: 'text', title: 'Why Use Algorithms?', content: 'Speed: Computers react in milliseconds, humans take seconds. Discipline: An algo never breaks its rules out of fear or greed. Backtesting: You can test an algo on years of historical data before risking real money. Scale: One algo can monitor hundreds of stocks simultaneously.' },
        { type: 'text', title: 'Who Uses Algo Trading?', content: 'From hedge funds and investment banks using complex high-frequency strategies to retail traders using simple moving average systems, algo trading spans all levels. SEBI regulates algorithmic trading in India, and exchanges like NSE and BSE have specific frameworks for it.' },
        { type: 'example', title: 'Algo Trading in StockSim', content: 'In the Algorithmic Trading section of this simulator, you can: 1) Choose from 3 different strategies. 2) Customize their parameters. 3) Pick a stock and date range. 4) Run a backtest to see how the strategy would have performed historically. No real money involved — pure learning.' },
        { type: 'interactive', question: 'What is the biggest advantage of algorithmic trading over manual trading?', options: ['Algorithms always make profit', 'No brokerage fees', 'Removes emotional decision-making and enforces discipline', 'Only institutions can use it'], correctAnswer: 2 },
      ],
      quiz: [
        { question: 'What does "backtesting" mean in algo trading?', options: ['Testing your internet connection', 'Running the strategy on historical data to see past performance', 'Manually reviewing each trade', 'Asking other traders to review your strategy'], correctAnswer: 1, explanation: 'Backtesting applies a strategy to historical price data to evaluate how it would have performed, before you risk real money.' },
        { question: 'An algorithm executes a SELL order because the RSI crossed 70. The trader feels the stock will keep rising. What does the algo do?', options: ['Waits for the trader\'s confirmation', 'Overrides the trader and executes the SELL', 'Cancels itself', 'Sends a notification and waits 1 hour'], correctAnswer: 1, explanation: 'Algorithms follow their rules strictly — no emotions, no second-guessing. That consistency is their core strength.' },
        { question: 'Which Indian regulator oversees algorithmic trading?', options: ['RBI', 'SEBI', 'NSE', 'Finance Ministry'], correctAnswer: 1, explanation: 'SEBI (Securities and Exchange Board of India) regulates all forms of trading including algorithmic trading in Indian markets.' },
      ],
    }),

    mkLesson('Understanding Moving Average Crossover', 'Master the Golden Cross and Death Cross — the most famous signals in trading', 'algo', 'intermediate', 45, 12, 20, 19, {
      sections: [
        { type: 'text', title: 'Quick Recap: What is a Moving Average?', content: 'A Moving Average (MA) smooths out price data over a period. A 10-day MA is the average of the last 10 days\' closing prices. It updates every day, "moving" with the price. A 20-day MA does the same over 20 days, so it reacts more slowly.' },
        { type: 'example', title: 'Why Two Moving Averages?', content: 'One MA tells you the recent trend. Two MAs tell you when the trend is changing. The key insight: when a fast (short period) MA crosses above a slow (long period) MA, it signals the short-term price momentum has turned upward — that\'s a potential BUY signal.' },
        { type: 'text', title: 'The Golden Cross', content: 'A Golden Cross occurs when the short-term MA (e.g. 10-day) crosses ABOVE the long-term MA (e.g. 20-day). This suggests upward momentum is strengthening. Historically, Golden Crosses on the Nifty 50 have often preceded sustained rallies. Traders use this as a BUY signal.' },
        { type: 'text', title: 'The Death Cross', content: 'A Death Cross occurs when the short-term MA crosses BELOW the long-term MA. This signals downward momentum is taking over. It\'s typically used as a SELL signal. Famous Death Crosses — like the one before the 2008 crash — have preceded major market declines.' },
        { type: 'example', title: 'Real Example: NIFTY 50 MA Crossover', content: 'In early 2023, the Nifty 50\'s 50-day MA crossed above the 200-day MA (a longer-period "Golden Cross"). Traders who bought at that signal and held saw the index climb ~18% over the next 8 months before the next Death Cross appeared.' },
        { type: 'text', title: 'Strengths and Weaknesses', content: 'Strengths: Simple to understand. Objective — no room for interpretation. Works well in strong trending markets. Weaknesses: Lagging indicator — the signal comes AFTER the trend starts. In sideways/choppy markets it generates many false signals (called "whipsaws") where you buy and sell repeatedly at small losses.' },
        { type: 'text', title: 'Tuning the Parameters', content: 'In StockSim you can set the Short Period (default: 10) and Long Period (default: 20). Smaller periods = more sensitive, more signals, more whipsaws. Larger periods = fewer signals, less noise, but signals lag further behind price. Common combinations: 10/20, 20/50, 50/200.' },
        { type: 'interactive', question: 'The 10-day MA crosses ABOVE the 30-day MA. What is this called?', options: ['Death Cross', 'Bearish signal', 'Golden Cross', 'RSI divergence'], correctAnswer: 2 },
      ],
      quiz: [
        { question: 'Which market condition is the MA Crossover strategy BEST suited for?', options: ['Sideways, choppy market', 'Strongly trending market (up or down)', 'Markets with no volume', 'Markets with very high volatility'], correctAnswer: 1, explanation: 'MA Crossover performs best in trending markets where price moves decisively in one direction for extended periods.' },
        { question: 'A "whipsaw" in MA Crossover trading refers to:', options: ['A very profitable trade', 'A false signal that results in a quick reversal and loss', 'A long-term holding strategy', 'A type of candlestick pattern'], correctAnswer: 1, explanation: 'Whipsaws are rapid back-and-forth crosses that generate buy and sell signals in quick succession, typically resulting in small repeated losses in choppy markets.' },
        { question: 'If you want fewer but more reliable signals, you should:', options: ['Use shorter periods like 5 and 10', 'Use longer periods like 50 and 200', 'Use the same period for both MAs', 'Remove the long MA entirely'], correctAnswer: 1, explanation: 'Longer MA periods smooth out more noise, producing fewer signals — but those signals reflect more significant trend changes.' },
      ],
    }),

    mkLesson('RSI and Momentum Strategies Explained', 'Learn how RSI spots exhausted trends and how momentum captures explosive moves', 'algo', 'intermediate', 45, 12, 21, 20, {
      sections: [
        { type: 'text', title: 'Part 1: RSI — Relative Strength Index', content: 'RSI is a momentum oscillator developed by J. Welles Wilder in 1978. It measures the speed and magnitude of recent price changes on a scale of 0 to 100. RSI doesn\'t ask "where is price going?" — it asks "how fast is price moving, and is that pace sustainable?"' },
        { type: 'example', title: 'How RSI is Calculated', content: 'RSI = 100 − (100 / (1 + RS)), where RS = Average Gain over N days ÷ Average Loss over N days. Default N = 14 days. If price has gone up 10 of the last 14 days, RS is high, and RSI approaches 100. If it\'s fallen most days, RSI approaches 0.' },
        { type: 'text', title: 'The Oversold and Overbought Zones', content: 'RSI below 30: Oversold. The stock has fallen so fast it may be due for a bounce — potential BUY signal. RSI above 70: Overbought. The stock has risen so fast buyers may be exhausted — potential SELL signal. These are the thresholds used in the StockSim RSI strategy.' },
        { type: 'example', title: 'RSI in Action — HDFC Bank', content: 'In October 2022, HDFC Bank\'s RSI dropped to 28 (below 30) after a sharp sell-off. Traders who bought on this oversold signal saw the stock recover 22% over the following 3 months as buyers returned. Of course, RSI can stay below 30 in a real crash — it\'s a signal, not a guarantee.' },
        { type: 'text', title: 'RSI Strengths and Weaknesses', content: 'Strengths: Works well in ranging (sideways) markets. Helps identify reversals. Widely used so it can become self-fulfilling. Weaknesses: In a strong trend, RSI can stay overbought (>70) for weeks or months. Use it alongside trend indicators, not alone.' },
        { type: 'text', title: 'Part 2: Momentum Strategy', content: 'Momentum is one of the most robust phenomena in finance — academic research across 200+ years of data shows stocks that have risen recently tend to keep rising, and stocks that have fallen tend to keep falling. This is called the "momentum effect."' },
        { type: 'example', title: 'How the Momentum Strategy Works in StockSim', content: 'The algorithm calculates the % price change over a lookback period (default: 10 days). If price is up more than the threshold% (default: 2%), it generates a BUY signal. If down more than the threshold%, SELL. It\'s essentially asking: "Is this stock moving decisively in one direction?"' },
        { type: 'text', title: 'Momentum Strengths and Weaknesses', content: 'Strengths: Captures explosive trending moves quickly. Backed by decades of academic research. Weaknesses: Momentum reversal risk — buying near the top of a momentum surge can result in buying at the worst possible moment. Works poorly when volatility is high and erratic.' },
        { type: 'text', title: 'Combining Strategies', content: 'Professional traders rarely use one indicator alone. A common combo: use RSI to spot potential reversals (identify oversold zones), then wait for a Momentum confirmation (price actually starts moving up) before entering. This reduces false signals significantly.' },
        { type: 'interactive', question: 'A stock has an RSI of 25. According to the RSI strategy, this is a:', options: ['Sell signal — stock is overbought', 'Buy signal — stock is oversold', 'Hold signal — RSI is neutral', 'No signal — RSI is invalid below 30'], correctAnswer: 1 },
      ],
      quiz: [
        { question: 'RSI is best described as a:', options: ['Volume indicator', 'Moving average variant', 'Momentum oscillator measuring speed of price changes', 'Fundamental analysis tool'], correctAnswer: 2, explanation: 'RSI is a momentum oscillator — it measures the speed and magnitude of recent price movements, not the direction or volume.' },
        { question: 'In a very strong bull market, RSI stays above 80 for weeks. A trader keeps selling because RSI is "overbought." This is an example of:', options: ['Smart risk management', 'Misusing RSI in a strongly trending market', 'Correct application of RSI', 'Hedging strategy'], correctAnswer: 1, explanation: 'In strong trends, RSI can stay in overbought territory for extended periods. Blindly selling every time RSI hits 70 in a bull market would cause you to miss major gains.' },
        { question: 'The "momentum effect" in finance refers to:', options: ['Large stocks always outperforming small ones', 'Assets that have risen recently tend to continue rising', 'Markets always returning to their average price', 'RSI always being accurate'], correctAnswer: 1, explanation: 'The momentum effect is one of the most documented anomalies in financial markets — assets with recent positive performance tend to continue outperforming in the short term.' },
      ],
    }),

    mkLesson('How to Use the Algo Trading Simulator', 'A complete hands-on guide to running backtests and interpreting results', 'algo', 'intermediate', 35, 8, 22, 21, {
      sections: [
        { type: 'text', title: 'Welcome to the Algo Lab', content: 'The Algorithmic Trading page in StockSim is your personal strategy testing lab. Before any professional trader deploys an algo with real money, they backtest it exhaustively. This simulator lets you do the same — free, with real Indian stock data.' },
        { type: 'example', title: 'Step 1: Choose a Strategy', content: 'On the left panel, select one of three strategies: Moving Average Crossover (trend-following), RSI Oscillator (reversal-based), or Price Momentum (trend-capturing). Each card shows the strategy name, risk level, and a brief description. Click "How it works" to see strengths and weaknesses.' },
        { type: 'example', title: 'Step 2: Pick a Stock', content: 'In the Stock Symbol box, type the name or ticker of an Indian stock (e.g. "Infosys", "RELIANCE", "TCS"). The search will suggest matching symbols. Select one — the selected ticker will be confirmed below the search box. NSE symbols are used (e.g. RELIANCE.NS).' },
        { type: 'example', title: 'Step 3: Tune the Parameters', content: 'Each strategy has parameters you can adjust with the +/− buttons or by typing directly. For MA Crossover: Short Period (how many days for the fast MA) and Long Period (slow MA). For RSI: Period (lookback), Oversold threshold, Overbought threshold. For Momentum: Lookback Period and Threshold %. The slider shows where your value sits in the allowed range.' },
        { type: 'example', title: 'Step 4: Set the Date Range and Capital', content: 'Choose Start Date and End Date for the backtest window. Longer periods (2+ years) give more statistically meaningful results. Set Initial Capital — this is your simulated starting portfolio. Default is ₹1,00,000 which is a realistic starting amount for retail traders.' },
        { type: 'example', title: 'Step 5: Run and Read Results', content: 'Hit "Run Backtest." Results appear in under a second. You\'ll see: Final Value (how much your ₹1L became), Total Return %, Win Rate (% of SELL trades that were profitable), Max Drawdown (worst dip from any peak), and Sharpe Ratio (risk-adjusted return).' },
        { type: 'text', title: 'The Equity Curve', content: 'Switch to the "Equity Curve" tab to see a chart of your portfolio value over time. A smooth upward curve = consistent profits. A jagged curve with deep drops = high volatility and risk. The ideal equity curve climbs steadily with small, controlled drawdowns.' },
        { type: 'text', title: 'The Trade Log', content: 'The "Trade Log" tab shows every individual BUY and SELL executed by the strategy — the date, price, quantity, total value, and the exact signal reason (e.g. "RSI (28.5) deep oversold territory"). This is incredibly useful for understanding WHEN and WHY the strategy made its decisions.' },
        { type: 'text', title: 'What Good Results Look Like', content: 'There\'s no single "good" result — context matters. A strategy that returned +30% with a Sharpe of 1.5 and Max Drawdown of 8% is excellent. The same +30% with a Max Drawdown of 45% means you may have had to sit through terrifying losses to get there. Focus on risk-adjusted returns, not raw returns.' },
        { type: 'text', title: 'Important Limitation: Overfitting', content: 'A critical warning: don\'t over-optimize parameters to fit past data. If you tweak parameters until the backtest looks perfect on 2020-2023 data, those exact parameters will likely fail on 2024 data. This is called "overfitting." Professional practice: find parameters that perform reasonably well across MULTIPLE time periods.' },
        { type: 'interactive', question: 'A backtest shows +85% return but a 60% Max Drawdown. This means:', options: ['The strategy is excellent', 'You would have lost 60% of your portfolio at some point to earn 85%', 'The Sharpe Ratio is above 2', 'The strategy had no losing trades'], correctAnswer: 1 },
      ],
      quiz: [
        { question: 'What does the Sharpe Ratio measure?', options: ['Total return', 'Number of winning trades', 'Risk-adjusted return (return earned per unit of risk)', 'Maximum loss'], correctAnswer: 2, explanation: 'Sharpe Ratio = (Return − Risk-Free Rate) / Standard Deviation of Returns. A Sharpe above 1 is generally considered good; above 2 is excellent.' },
        { question: 'What is "overfitting" in backtesting?', options: ['Running too many backtests', 'Over-optimizing parameters to past data so the strategy fails on new data', 'Using too long a date range', 'Having too many trades in the log'], correctAnswer: 1, explanation: 'Overfitting is one of the most common mistakes in algorithmic trading. A strategy that\'s been over-tuned to historical data "memorizes" the past instead of learning a generalizable pattern.' },
        { question: 'You backtest a strategy on 2020-2022 and get great results. What should you do before trusting it?', options: ['Deploy it immediately with real money', 'Test it on a different time period (e.g. 2017-2019) to check robustness', 'Increase the initial capital and rerun', 'Share it online'], correctAnswer: 1, explanation: 'Testing on multiple, non-overlapping time periods is called "out-of-sample testing" — it\'s the gold standard for validating a trading strategy\'s robustness.' },
      ],
    }),
  ];