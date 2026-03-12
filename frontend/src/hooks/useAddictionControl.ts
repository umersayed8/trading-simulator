import { useState, useEffect, useCallback } from 'react';

const BREAK_INTERVAL_MINUTES = 20; // remind every 20 min of active use
const STORAGE_KEY_SESSION_START = 'kate_session_start';
const STORAGE_KEY_LAST_REMINDER = 'kate_last_reminder';

export interface KateReminder {
  message: string;
  type: 'break' | 'limit_warning' | 'limit_reached';
}

const BREAK_TIPS = [
  "You've been trading for a while! Step away for a few minutes and stretch. 🌿",
  "Quick check-in: are you trading with a clear head? Take a breath! 🧘",
  "Best investors know when to pause. How about a 5-minute screen break? ☕",
  "Your eyes and brain need a rest! Step outside for fresh air. 🌤️",
  "Remember: quality over quantity. Review before you trade! 📊",
];

export function useAddictionControl(todayTrades: number) {
  const [reminder, setReminder] = useState<KateReminder | null>(null);
  const [sessionMinutes, setSessionMinutes] = useState(0);
  const DAILY_LIMIT = 30;

  // Track session time
  useEffect(() => {
    const start = parseInt(sessionStorage.getItem(STORAGE_KEY_SESSION_START) || '0') || Date.now();
    sessionStorage.setItem(STORAGE_KEY_SESSION_START, String(start));

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 60000);
      setSessionMinutes(elapsed);

      // Check if we need a break reminder
      const lastReminder = parseInt(sessionStorage.getItem(STORAGE_KEY_LAST_REMINDER) || '0') || 0;
      const minutesSinceLastReminder = Math.floor((Date.now() - lastReminder) / 60000);

      if (elapsed >= BREAK_INTERVAL_MINUTES && minutesSinceLastReminder >= BREAK_INTERVAL_MINUTES) {
        const msg = BREAK_TIPS[Math.floor(Math.random() * BREAK_TIPS.length)];
        setReminder({ message: msg, type: 'break' });
        sessionStorage.setItem(STORAGE_KEY_LAST_REMINDER, String(Date.now()));
      }
    }, 60000); // check every minute

    return () => clearInterval(interval);
  }, []);

  // Trade-count based warnings
  useEffect(() => {
    if (todayTrades >= DAILY_LIMIT) {
      setReminder({
        message: "You've reached your daily limit of 30 trades! I'm impressed by your dedication, but now it's rest time. Come back tomorrow with fresh energy! 🌙",
        type: 'limit_reached',
      });
    } else if (todayTrades === 25) {
      setReminder({
        message: "Just 5 trades left today! Make them count. Think carefully before each one! 🎯",
        type: 'limit_warning',
      });
    } else if (todayTrades === 20) {
      setReminder({
        message: "20 trades done! You're two-thirds through your daily limit. Slow down and be selective! 🐻",
        type: 'limit_warning',
      });
    } else if (todayTrades === 10) {
      setReminder({
        message: "10 trades in! Quick reminder: overtrading can hurt returns. Quality over quantity! 💡",
        type: 'limit_warning',
      });
    }
  }, [todayTrades]);

  const dismissReminder = useCallback(() => {
    setReminder(null);
  }, []);

  return { reminder, dismissReminder, sessionMinutes };
}
