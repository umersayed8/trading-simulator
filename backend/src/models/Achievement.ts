import { query, queryOne, insert } from '../config/database';

export interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
  criteria_type: string;
  criteria_value: number;
}

export interface UserAchievement {
  id: number;
  user_id: number;
  achievement_id: number;
  unlocked_at: Date;
}

export interface AchievementWithStatus extends Achievement {
  unlocked: boolean;
  unlockedAt: Date | null;
  progress?: number;
}

export interface DailyChallenge {
  id: number;
  title: string;
  description: string;
  type: string;
  target: number;
  xp_reward: number;
  active: boolean;
}

export interface UserChallenge {
  id: number;
  user_id: number;
  challenge_id: number;
  date: string;
  progress: number;
  completed: boolean;
}

// Get all achievements
export async function getAllAchievements(): Promise<Achievement[]> {
  return query<Achievement[]>('SELECT * FROM achievements ORDER BY id');
}

// Get user's achievements with unlock status
export async function getUserAchievements(userId: number): Promise<AchievementWithStatus[]> {
  const achievements = await getAllAchievements();
  const userAchievements = await query<UserAchievement[]>(
    'SELECT * FROM user_achievements WHERE user_id = ?',
    [userId]
  );
  
  const unlockedMap = new Map<number, Date>();
  userAchievements.forEach(ua => {
    unlockedMap.set(ua.achievement_id, ua.unlocked_at);
  });
  
  // Get progress data for incomplete achievements
  const progressData = await getAchievementProgress(userId);
  
  return achievements.map(a => ({
    ...a,
    unlocked: unlockedMap.has(a.id),
    unlockedAt: unlockedMap.get(a.id) || null,
    progress: unlockedMap.has(a.id) ? 100 : progressData.get(a.criteria_type) || 0,
  }));
}

// Get achievement progress based on criteria type
async function getAchievementProgress(userId: number): Promise<Map<string, number>> {
  const progress = new Map<string, number>();
  
  // Count total trades
  const [tradeCount] = await query<[{ count: number }]>(
    'SELECT COUNT(*) as count FROM trades WHERE user_id = ?',
    [userId]
  );
  progress.set('trades_count', tradeCount?.count || 0);
  
  // Count profitable trades
  const [profitCount] = await query<[{ count: number }]>(
    `SELECT COUNT(*) as count FROM trades t1 
     WHERE t1.user_id = ? AND t1.type = 'SELL' 
     AND t1.price > (
       SELECT AVG(t2.price) FROM trades t2 
       WHERE t2.user_id = t1.user_id AND t2.symbol = t1.symbol AND t2.type = 'BUY'
     )`,
    [userId]
  );
  progress.set('profitable_trades', profitCount?.count || 0);
  
  // Count lessons completed
  const [lessonCount] = await query<[{ count: number }]>(
    'SELECT COUNT(*) as count FROM user_progress WHERE user_id = ? AND completed = TRUE',
    [userId]
  );
  progress.set('lessons_completed', lessonCount?.count || 0);
  
  // Get current streak
  const [userRow] = await query<[{ streak: number }]>(
    'SELECT streak FROM users WHERE id = ?',
    [userId]
  );
  progress.set('streak_days', userRow?.streak || 0);
  
  // Count unique stocks traded
  const [stockCount] = await query<[{ count: number }]>(
    'SELECT COUNT(DISTINCT symbol) as count FROM trades WHERE user_id = ?',
    [userId]
  );
  progress.set('unique_stocks', stockCount?.count || 0);
  
  return progress;
}

// Check and unlock achievements
export async function checkAndUnlockAchievements(userId: number): Promise<Achievement[]> {
  const achievements = await getAllAchievements();
  const userAchievements = await query<UserAchievement[]>(
    'SELECT achievement_id FROM user_achievements WHERE user_id = ?',
    [userId]
  );
  
  const unlockedIds = new Set(userAchievements.map(ua => ua.achievement_id));
  const progressData = await getAchievementProgress(userId);
  
  const newlyUnlocked: Achievement[] = [];
  
  for (const achievement of achievements) {
    if (unlockedIds.has(achievement.id)) continue;
    
    const currentProgress = progressData.get(achievement.criteria_type) || 0;
    
    if (currentProgress >= achievement.criteria_value) {
      // Unlock achievement
      await insert(
        'INSERT INTO user_achievements (user_id, achievement_id) VALUES (?, ?)',
        [userId, achievement.id]
      );
      newlyUnlocked.push(achievement);
    }
  }
  
  return newlyUnlocked;
}

// Get daily challenges
export async function getDailyChallenges(): Promise<DailyChallenge[]> {
  return query<DailyChallenge[]>(
    'SELECT * FROM daily_challenges WHERE active = TRUE'
  );
}

// Get user's daily challenge progress
export async function getUserChallenges(userId: number, date: string): Promise<Array<DailyChallenge & { progress: number; completed: boolean }>> {
  const challenges = await getDailyChallenges();
  
  const userChallenges = await query<UserChallenge[]>(
    'SELECT * FROM user_challenges WHERE user_id = ? AND date = ?',
    [userId, date]
  );
  
  const progressMap = new Map<number, UserChallenge>();
  userChallenges.forEach(uc => {
    progressMap.set(uc.challenge_id, uc);
  });
  
  return challenges.map(c => {
    const userProgress = progressMap.get(c.id);
    return {
      ...c,
      progress: userProgress?.progress || 0,
      completed: userProgress?.completed || false,
    };
  });
}

// Update challenge progress
export async function updateChallengeProgress(
  userId: number,
  challengeType: string,
  increment: number = 1
): Promise<{ completed: boolean; challenge?: DailyChallenge }> {
  const today = new Date().toISOString().split('T')[0];
  
  // Find matching challenge
  const [challenge] = await query<DailyChallenge[]>(
    'SELECT * FROM daily_challenges WHERE type = ? AND active = TRUE',
    [challengeType]
  );
  
  if (!challenge) {
    return { completed: false };
  }
  
  // Get or create user challenge record
  let userChallenge = await queryOne<UserChallenge>(
    'SELECT * FROM user_challenges WHERE user_id = ? AND challenge_id = ? AND date = ?',
    [userId, challenge.id, today]
  );
  
  if (!userChallenge) {
    await insert(
      'INSERT INTO user_challenges (user_id, challenge_id, date, progress, completed) VALUES (?, ?, ?, ?, FALSE)',
      [userId, challenge.id, today, increment]
    );
    userChallenge = {
      id: 0,
      user_id: userId,
      challenge_id: challenge.id,
      date: today,
      progress: increment,
      completed: false,
    };
  } else if (!userChallenge.completed) {
    const newProgress = userChallenge.progress + increment;
    const isCompleted = newProgress >= challenge.target;
    
    await query(
      'UPDATE user_challenges SET progress = ?, completed = ? WHERE user_id = ? AND challenge_id = ? AND date = ?',
      [newProgress, isCompleted, userId, challenge.id, today]
    );
    
    if (isCompleted) {
      return { completed: true, challenge };
    }
  }
  
  return { completed: false };
}
