import * as Lesson from '../models/Lesson';
import * as User from '../models/User';
import * as GamificationEngine from './gamificationEngine';

// Get all lessons with progress for a user
export async function getLessonsForUser(userId: number) {
  return Lesson.getLessonsWithProgress(userId);
}

// Get lesson detail with content
export async function getLessonDetail(userId: number, lessonId: number) {
  // Check access
  const canAccess = await Lesson.canAccessLesson(userId, lessonId);
  if (!canAccess) {
    throw new Error('Lesson is locked. Complete prerequisite lessons first.');
  }
  
  const lesson = await Lesson.getLessonById(lessonId);
  if (!lesson) {
    throw new Error('Lesson not found');
  }
  
  const content = await Lesson.getLessonContent(lessonId);
  
  return {
    id: lesson.id,
    title: lesson.title,
    description: lesson.description,
    category: lesson.category,
    difficulty: lesson.difficulty,
    xpReward: lesson.xp_reward,
    duration: `${lesson.duration_minutes} min`,
    content: content?.sections || [],
    quiz: content?.quiz || [],
  };
}

// Complete a lesson and award XP
export async function completeLesson(
  userId: number,
  lessonId: number,
  quizScore: number
): Promise<{
  xpEarned: number;
  newTotalXp: number;
  levelUp: boolean;
  newLevel: number;
  newAchievements: any[];
}> {
  const result = await Lesson.completeLesson(userId, lessonId, quizScore);

  if (result.alreadyCompleted) {
    const user = await User.findById(userId);
    return {
      xpEarned: 0,
      newTotalXp: user?.xp || 0,
      levelUp: false,
      newLevel: user?.level || 1,
      newAchievements: [],
    };
  }

  // Award lesson XP first
  if (result.xpEarned > 0) {
    await User.addXp(userId, result.xpEarned);
  }

  // Process lesson gamification event (streak + achievements)
  const lessonGam = await GamificationEngine.processEvent(userId, 'lesson');

  // If quiz passed, also fire quiz event for bonus XP
  let quizGam = { xpEarned: 0, newAchievements: [] as any[], levelUp: false, newLevel: 1 };
  if (quizScore >= 70) {
    quizGam = await GamificationEngine.processEvent(userId, 'quiz');
  }

  const user = await User.findById(userId);

  const totalXpEarned = result.xpEarned + lessonGam.xpEarned + quizGam.xpEarned;
  const allAchievements = [...lessonGam.newAchievements, ...quizGam.newAchievements];

  return {
    xpEarned: totalXpEarned,
    newTotalXp: user?.xp || 0,
    levelUp: lessonGam.levelUp || quizGam.levelUp,
    newLevel: user?.level || 1,
    newAchievements: allAchievements,
  };
}

// Get learning progress summary
export async function getProgress(userId: number) {
  return Lesson.getProgressSummary(userId);
}

// Default lesson content for seeding
export const DEFAULT_LESSONS: Array<{
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  content: Lesson.LessonContent;
  xp_reward: number;
  duration_minutes: number;
  order_index: number;
}> = [
  {
    title: 'What are Stocks?',
    description: 'Learn the basics of stocks and what it means to own a piece of a company',
    category: 'basics',
    difficulty: 'beginner',
    xp_reward: 25,
    duration_minutes: 5,
    order_index: 1,
    content: {
      sections: [
        {
          type: 'story',
          title: 'Meet Aarav',
          content: 'Aarav is a 16-year-old student who just received ₹10,000 from his grandparents. Instead of spending it all, he wants to make his money grow. His uncle, who works in finance, suggests he learn about the stock market.',
        },
        {
          type: 'text',
          title: 'What is a Stock?',
          content: 'A stock (also called a share) represents a small piece of ownership in a company. When you buy a stock, you become a part-owner of that company. If the company does well, your stock becomes more valuable. If it does poorly, your stock loses value.',
        },
        {
          type: 'example',
          title: 'Real-World Example',
          content: 'Imagine a pizza shop is divided into 100 equal slices. If you buy 1 slice, you own 1% of the pizza shop. If the shop makes more money, your slice becomes worth more!',
        },
        {
          type: 'interactive',
          question: 'If a company has 1000 shares and you own 10, what percentage of the company do you own?',
          options: ['0.1%', '1%', '10%', '100%'],
          correctAnswer: 1,
        },
      ],
      quiz: [
        {
          question: 'What does owning a stock mean?',
          options: ['You lent money to a company', 'You own part of a company', 'You work for the company', 'You owe money to the company'],
          correctAnswer: 1,
          explanation: 'When you buy a stock, you become a part-owner (shareholder) of that company.',
        },
        {
          question: 'What happens to your stock if the company does well?',
          options: ['It loses value', 'It stays the same', 'It gains value', 'Nothing happens'],
          correctAnswer: 2,
          explanation: 'When a company performs well, its stock price typically increases, making your shares worth more.',
        },
      ],
    },
  },
  {
    title: 'Why Do Stock Prices Change?',
    description: 'Understand the forces of supply and demand that move stock prices',
    category: 'basics',
    difficulty: 'beginner',
    xp_reward: 30,
    duration_minutes: 7,
    order_index: 2,
    content: {
      sections: [
        {
          type: 'story',
          title: 'Aarav Watches the Market',
          content: 'Aarav notices that the price of Reliance stock was ₹2,400 yesterday but is ₹2,450 today. "Why did it go up?" he asks his uncle.',
        },
        {
          type: 'text',
          title: 'Supply and Demand',
          content: 'Stock prices change based on supply and demand. If more people want to buy a stock (high demand), the price goes up. If more people want to sell (high supply), the price goes down.',
        },
        {
          type: 'text',
          title: 'What Affects Demand?',
          content: 'Many factors affect how much people want to buy or sell: company earnings, news events, economic conditions, industry trends, and even rumors.',
        },
        {
          type: 'interactive',
          question: 'A company announces record profits. What is likely to happen to its stock price?',
          options: ['Price will fall', 'Price will rise', 'Price will stay the same', 'The stock will be removed'],
          correctAnswer: 1,
        },
      ],
      quiz: [
        {
          question: 'What primarily determines stock prices?',
          options: ['The government', 'Supply and demand', 'The company CEO', 'Random chance'],
          correctAnswer: 1,
          explanation: 'Stock prices are determined by supply and demand - how many people want to buy vs. sell.',
        },
        {
          question: 'If more people want to sell a stock than buy it, the price will:',
          options: ['Go up', 'Go down', 'Stay the same', 'Become negative'],
          correctAnswer: 1,
          explanation: 'When there are more sellers than buyers, the price must drop to attract buyers.',
        },
      ],
    },
  },
  {
    title: 'Risk and Reward',
    description: 'Learn the fundamental relationship between risk and potential returns',
    category: 'fundamentals',
    difficulty: 'beginner',
    xp_reward: 35,
    duration_minutes: 8,
    order_index: 3,
    content: {
      sections: [
        {
          type: 'story',
          title: 'The Risk Question',
          content: 'Aarav asks his uncle: "Can I just invest all my money and become rich?" His uncle smiles and says, "Let me tell you about risk and reward."',
        },
        {
          type: 'text',
          title: 'The Golden Rule',
          content: 'Higher potential rewards come with higher risks. Safer investments typically offer lower returns. This is the fundamental trade-off in investing.',
        },
        {
          type: 'example',
          title: 'Comparing Investments',
          content: 'A bank fixed deposit might give 6% return with almost no risk. A stock might give 20% return, but could also lose 20%. The higher potential gain comes with higher potential loss.',
        },
        {
          type: 'text',
          title: 'Never Invest What You Cannot Afford to Lose',
          content: 'This is the most important rule of investing. Only invest money that you would not need in an emergency. In this simulator, we use virtual money so you can learn without real risk!',
        },
        {
          type: 'interactive',
          question: 'Which investment typically has higher risk?',
          options: ['Government bonds', 'Fixed deposits', 'Stocks', 'Savings account'],
          correctAnswer: 2,
        },
      ],
      quiz: [
        {
          question: 'What is the relationship between risk and potential reward?',
          options: ['Higher risk means lower reward', 'Higher risk means higher potential reward', 'Risk and reward are not related', 'Lower risk means higher reward'],
          correctAnswer: 1,
          explanation: 'Generally, investments with higher potential returns carry higher risks.',
        },
        {
          question: 'How much money should you invest in stocks?',
          options: ['All your savings', 'Money borrowed from friends', 'Only money you can afford to lose', 'Your emergency fund'],
          correctAnswer: 2,
          explanation: 'You should only invest money that you would not need in an emergency.',
        },
      ],
    },
  },
  {
    title: 'Diversification: Don\'t Put All Eggs in One Basket',
    description: 'Learn how spreading investments reduces risk',
    category: 'fundamentals',
    difficulty: 'beginner',
    xp_reward: 35,
    duration_minutes: 8,
    order_index: 4,
    content: {
      sections: [
        {
          type: 'story',
          title: 'Aarav\'s Dilemma',
          content: 'Aarav loves Tata Motors and wants to put all ₹10,000 into that one stock. His uncle warns him about the dangers of putting all his eggs in one basket.',
        },
        {
          type: 'text',
          title: 'What is Diversification?',
          content: 'Diversification means spreading your investments across different stocks, sectors, or asset types. If one investment performs poorly, others might perform well, balancing your overall returns.',
        },
        {
          type: 'example',
          title: 'Diversification in Action',
          content: 'Instead of investing ₹10,000 in one stock, Aarav could invest ₹2,000 each in 5 different stocks from different sectors: IT, Banking, Pharma, Auto, and Consumer Goods.',
        },
        {
          type: 'interactive',
          question: 'What is the main benefit of diversification?',
          options: ['Guaranteed profits', 'Reduced risk', 'Higher returns', 'Lower taxes'],
          correctAnswer: 1,
        },
      ],
      quiz: [
        {
          question: 'What does diversification mean?',
          options: ['Investing all money in one stock', 'Spreading investments across different assets', 'Only investing in banks', 'Changing investments daily'],
          correctAnswer: 1,
          explanation: 'Diversification is the strategy of spreading investments to reduce risk.',
        },
        {
          question: 'If you have ₹10,000 to invest, which approach is more diversified?',
          options: ['₹10,000 in TCS', '₹5,000 each in TCS and Infosys', '₹2,000 each in 5 different sector stocks', '₹1,000 in 10 IT stocks'],
          correctAnswer: 2,
          explanation: 'Investing across different sectors provides better diversification than concentrating in one sector.',
        },
      ],
    },
  },
  {
    title: 'Reading Stock Charts',
    description: 'Understand candlestick charts and what they tell us about stock movements',
    category: 'technical',
    difficulty: 'intermediate',
    xp_reward: 40,
    duration_minutes: 10,
    order_index: 5,
    content: {
      sections: [
        {
          type: 'text',
          title: 'Why Charts Matter',
          content: 'Stock charts help us visualize how a stock\'s price has moved over time. They can reveal patterns and trends that help inform trading decisions.',
        },
        {
          type: 'text',
          title: 'Candlestick Basics',
          content: 'A candlestick shows four pieces of information: Open (starting price), Close (ending price), High (highest price), and Low (lowest price) for a time period.',
        },
        {
          type: 'example',
          title: 'Green vs Red Candles',
          content: 'Green (or white) candle: Price went UP - the close is higher than the open. Red (or black) candle: Price went DOWN - the close is lower than the open.',
        },
        {
          type: 'interactive',
          question: 'A green candlestick means:',
          options: ['The stock price fell', 'The stock price rose', 'The stock price stayed the same', 'The market was closed'],
          correctAnswer: 1,
        },
      ],
      quiz: [
        {
          question: 'What information does a candlestick NOT show?',
          options: ['Open price', 'Trading volume', 'High price', 'Close price'],
          correctAnswer: 1,
          explanation: 'Candlesticks show Open, High, Low, and Close prices. Volume is typically shown separately.',
        },
        {
          question: 'A red candlestick indicates:',
          options: ['Price increased', 'Price decreased', 'High volume', 'Market holiday'],
          correctAnswer: 1,
          explanation: 'A red candlestick means the closing price was lower than the opening price.',
        },
      ],
    },
  },
];
