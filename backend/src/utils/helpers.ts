// Response helper functions

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    message,
    data,
  };
}

export function errorResponse(code: string, message: string, details?: unknown): ApiResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
  };
}

// XP and Level calculations
export function calculateLevel(xp: number): number {
  if (xp < 100) return 1;
  
  // Level formula: XP for level N = 100 + (N-2) * 50
  // Cumulative: 0, 100, 250, 450, 700, ...
  let level = 1;
  let cumulativeXp = 0;
  
  while (cumulativeXp <= xp && level < 50) {
    level++;
    const xpForLevel = 100 + (level - 2) * 50;
    cumulativeXp += xpForLevel;
  }
  
  return level - 1;
}

export function xpForNextLevel(currentXp: number): number {
  const currentLevel = calculateLevel(currentXp);
  if (currentLevel >= 50) return 0;
  
  let cumulativeXp = 0;
  for (let l = 2; l <= currentLevel + 1; l++) {
    cumulativeXp += 100 + (l - 2) * 50;
  }
  
  return cumulativeXp - currentXp;
}

export function cumulativeXpForLevel(level: number): number {
  if (level <= 1) return 0;
  
  let total = 0;
  for (let l = 2; l <= level; l++) {
    total += 100 + (l - 2) * 50;
  }
  return total;
}

// Format currency for Indian Rupees
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
}

// Calculate percentage change
export function percentChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

// Round to 2 decimal places
export function round2(num: number): number {
  return Math.round(num * 100) / 100;
}

// Check if market is open (Indian market hours)
export function isMarketOpen(): boolean {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
  const istTime = new Date(now.getTime() + istOffset);
  
  const day = istTime.getUTCDay();
  const hours = istTime.getUTCHours();
  const minutes = istTime.getUTCMinutes();
  const timeInMinutes = hours * 60 + minutes;
  
  // Market is closed on weekends
  if (day === 0 || day === 6) return false;
  
  // Market hours: 9:15 AM to 3:30 PM IST
  const marketOpen = 9 * 60 + 15; // 9:15 AM
  const marketClose = 15 * 60 + 30; // 3:30 PM
  
  return timeInMinutes >= marketOpen && timeInMinutes <= marketClose;
}

// Generate random ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate age (13-18 for teens)
export function isValidAge(age: number): boolean {
  return age >= 13 && age <= 100;
}
