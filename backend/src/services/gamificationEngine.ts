import * as Achievement from '../models/Achievement';
import * as User from '../models/User';
import { query } from '../config/database';
import { xpForNextLevel as xpForNextFunction, cumulativeXpForLevel } from '../utils/helpers';

export interface GamificationProfile {
  level: number;
  xp: number;
  xpToNextLevel: number;
  xpProgress: number;
  streak: number;
  totalBadges: number;
  rank: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: number;
  username: string;
  level: number;
  portfolioValue: number;
  pnlPercent: number;
}

export async function getProfile(userId: number): Promise<GamificationProfile | null> {
  const user = await User.findById(userId);
  if (!user) return null;

  const [badgeCount] = await query<[{ count: number }]>(
    'SELECT COUNT(*) as count FROM user_achievements WHERE user_id = ?',
    [userId]
  );

  const leaderboard = await User.getLeaderboard(1000);
  const userRank = leaderboard.find(e => e.userId === userId)?.rank || 0;

  const xpForCurrentLevel = cumulativeXpForLevel(user.level);
  const xpForNextLevel    = cumulativeXpForLevel(user.level + 1);
  const xpToNext          = xpForNextFunction(user.xp);
  const xpInCurrentLevel  = user.xp - xpForCurrentLevel;
  const xpNeededForLevel  = xpForNextLevel - xpForCurrentLevel;
  const xpProgress        = xpNeededForLevel > 0
    ? Math.round((xpInCurrentLevel / xpNeededForLevel) * 100)
    : 100;

  return {
    level:        user.level,
    xp:           user.xp,
    xpToNextLevel: xpToNext,
    xpProgress,
    streak:       user.streak,
    totalBadges:  Number(badgeCount?.count) || 0,
    rank:         userRank,
  };
}

export async function getLeaderboard(
  period: 'weekly' | 'monthly' | 'alltime' = 'weekly',
  limit: number = 50
): Promise<{ rankings: LeaderboardEntry[]; period: string }> {
  const rankings = await User.getLeaderboard(limit);
  return { rankings, period };
}

// ── Core event processor ──────────────────────────────────────────────────────
export async function processEvent(
  userId: number,
  eventType: 'trade' | 'lesson' | 'quiz' | 'challenge' | 'login' | 'onboarding' | 'simulation'
): Promise<{
  xpEarned: number;
  newAchievements: Achievement.Achievement[];
  levelUp: boolean;
  newLevel: number;
  challengeCompleted?: Achievement.DailyChallenge;
}> {
  const xpRewards: Record<string, number> = {
    trade:       10,
    lesson:      25,
    quiz:        15,
    challenge:   50,
    login:        5,
    onboarding: 100,
    simulation:  20,
  };

  const challengeTypes: Record<string, string> = {
    trade:      'make_trade',
    lesson:     'complete_lesson',
    login:      'daily_login',
    simulation: 'make_trade',
  };

  let xpEarned = xpRewards[eventType] || 0;
  let challengeCompleted: Achievement.DailyChallenge | undefined;

  // Update daily challenge progress
  const challengeType = challengeTypes[eventType];
  if (challengeType) {
    const result = await Achievement.updateChallengeProgress(userId, challengeType);
    if (result.completed && result.challenge) {
      xpEarned += result.challenge.xp_reward;
      challengeCompleted = result.challenge;
    }
  }

  // Award XP and check level-up
  const user = await User.findById(userId);
  const oldLevel = user?.level || 1;

  if (xpEarned > 0) {
    await User.addXp(userId, xpEarned);
  }

  // Update streak for activity events
  if (['lesson', 'trade', 'simulation', 'quiz'].includes(eventType)) {
    await User.updateStreakForActivity(userId);
  }

  // Check achievements
  const newAchievements = await Achievement.checkAndUnlockAchievements(userId);
  for (const ach of newAchievements) {
    await User.addXp(userId, ach.xp_reward);
    xpEarned += ach.xp_reward;
  }

  const updatedUser = await User.findById(userId);
  const newLevel    = updatedUser?.level || oldLevel;

  return {
    xpEarned,
    newAchievements,
    levelUp: newLevel > oldLevel,
    newLevel,
    challengeCompleted,
  };
}

export function getStreakMultiplier(streak: number): number {
  if (streak >= 30) return 2.0;
  if (streak >= 14) return 1.5;
  if (streak >= 7)  return 1.25;
  if (streak >= 3)  return 1.1;
  return 1.0;
}

export function getChallengeResetTime(): Date {
  const reset = new Date();
  reset.setHours(24, 0, 0, 0);
  return reset;
}
