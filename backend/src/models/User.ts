import bcrypt from 'bcryptjs';
import { query, queryOne, insert, update } from '../config/database';
import { calculateLevel, xpForNextLevel } from '../utils/helpers';

export interface User {
  id: number;
  email: string;
  password_hash: string;
  username: string;
  age: number;
  level: number;
  xp: number;
  streak: number;
  last_login: Date | null;
  onboarding_completed: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UserPublic {
  id: number;
  email: string;
  username: string;
  age: number;
  level: number;
  xp: number;
  xpToNextLevel: number;
  streak: number;
  onboardingCompleted: boolean;
  createdAt: Date;
}

export interface CreateUserInput {
  email: string;
  password: string;
  username: string;
  age: number;
}

// Convert database user to public user object
export function toPublicUser(user: User): UserPublic {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    age: user.age,
    level: user.level,
    xp: user.xp,
    xpToNextLevel: xpForNextLevel(user.xp),
    streak: user.streak,
    onboardingCompleted: user.onboarding_completed,
    createdAt: user.created_at,
  };
}

// Create a new user
export async function createUser(input: CreateUserInput): Promise<User> {
  const passwordHash = await bcrypt.hash(input.password, 10);
  
  const userId = await insert(
    `INSERT INTO users (email, password_hash, username, age) VALUES (?, ?, ?, ?)`,
    [input.email, passwordHash, input.username, input.age]
  );
  
  // Create portfolio for new user with starting capital
  await insert(
    `INSERT INTO portfolios (user_id, balance) VALUES (?, 100000.00)`,
    [userId]
  );
  
  const user = await findById(userId);
  if (!user) {
    throw new Error('Failed to create user');
  }
  
  return user;
}

// Find user by ID
export async function findById(id: number): Promise<User | null> {
  return queryOne<User>('SELECT * FROM users WHERE id = ?', [id]);
}

// Find user by email
export async function findByEmail(email: string): Promise<User | null> {
  return queryOne<User>('SELECT * FROM users WHERE email = ?', [email]);
}

// Find user by username
export async function findByUsername(username: string): Promise<User | null> {
  return queryOne<User>('SELECT * FROM users WHERE username = ?', [username]);
}

// Verify password
export async function verifyPassword(user: User, password: string): Promise<boolean> {
  return bcrypt.compare(password, user.password_hash);
}

// Update user XP and recalculate level
export async function addXp(userId: number, xpAmount: number): Promise<{ newXp: number; newLevel: number; levelUp: boolean }> {
  const user = await findById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  
  const newXp = user.xp + xpAmount;
  const oldLevel = user.level;
  const newLevel = calculateLevel(newXp);
  
  await update(
    'UPDATE users SET xp = ?, level = ? WHERE id = ?',
    [newXp, newLevel, userId]
  );
  
  return {
    newXp,
    newLevel,
    levelUp: newLevel > oldLevel,
  };
}

// Update user streak
export async function updateStreak(userId: number): Promise<number> {
  const user = await findById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  
  const now = new Date();
  const lastLogin = user.last_login ? new Date(user.last_login) : null;
  
  let newStreak = user.streak;
  
  if (lastLogin) {
    const daysDiff = Math.floor(
      (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysDiff === 1) {
      // Consecutive day - increment streak
      newStreak = user.streak + 1;
    } else if (daysDiff > 1) {
      // Streak broken - reset to 1
      newStreak = 1;
    }
    // Same day - keep current streak
  } else {
    // First login
    newStreak = 1;
  }
  
  await update(
    'UPDATE users SET streak = ?, last_login = NOW() WHERE id = ?',
    [newStreak, userId]
  );
  
  return newStreak;
}

// Mark onboarding as completed
export async function completeOnboarding(userId: number): Promise<void> {
  await update(
    'UPDATE users SET onboarding_completed = TRUE WHERE id = ?',
    [userId]
  );
}

// Update streak when user performs any learning/trading activity
// Only increments once per calendar day (IST)
export async function updateStreakForActivity(userId: number): Promise<number> {
  const user = await findById(userId);
  if (!user) return 0;

  const now = new Date();
  const lastLogin = user.last_login ? new Date(user.last_login) : null;

  if (!lastLogin) {
    await update('UPDATE users SET streak = 1, last_login = NOW() WHERE id = ?', [userId]);
    return 1;
  }

  // Compare calendar dates in IST (UTC+5:30)
  const IST = 5.5 * 60 * 60 * 1000;
  const todayDate     = new Date(now.getTime() + IST).toISOString().slice(0, 10);
  const lastLoginDate = new Date(lastLogin.getTime() + IST).toISOString().slice(0, 10);

  if (todayDate === lastLoginDate) return user.streak; // already counted today

  const daysDiff = Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));
  const newStreak = daysDiff <= 1 ? user.streak + 1 : 1;

  await update('UPDATE users SET streak = ?, last_login = NOW() WHERE id = ?', [newStreak, userId]);
  return newStreak;
}

export async function getLeaderboard(limit: number = 50): Promise<Array<{
  rank: number;
  userId: number;
  username: string;
  level: number;
  portfolioValue: number;
  pnlPercent: number;
}>> {

  // 🔐 sanitize limit (VERY IMPORTANT)
  const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 100));

  const results = await query<Array<{
    user_id: number;
    username: string;
    level: number;
    balance: string;
    holdings_value: string;
  }>>(
    `
    SELECT 
      u.id AS user_id,
      u.username,
      u.level,
      p.balance,
      COALESCE(SUM(h.quantity * h.avg_buy_price), 0) AS holdings_value
    FROM users u
    JOIN portfolios p ON u.id = p.user_id
    LEFT JOIN holdings h ON p.id = h.portfolio_id
    GROUP BY u.id, u.username, u.level, p.balance
    ORDER BY (p.balance + COALESCE(SUM(h.quantity * h.avg_buy_price), 0)) DESC
    LIMIT ${safeLimit};
    `
  );


  
  let res =  results.map((row, index) => ({
    rank: index + 1,
    userId: row.user_id,
    username: row.username,
    level: row.level,
    portfolioValue: Number.parseFloat(row.balance) + Number.parseFloat(row.holdings_value),
    pnlPercent: ((Number.parseFloat(row.balance) + Number.parseFloat(row.holdings_value)- 100000) / 100000) * 100,
  }));

  return res;
}

