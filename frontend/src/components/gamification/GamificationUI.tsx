import { useState, useEffect } from 'react';
import { Star, Zap, Award, TrendingUp } from 'lucide-react';

/* ─── XP Progress Bar ─────────────────────────────────────────────────────── */

interface XPBarProps {
  xp: number;
  level: number;
  xpProgress: number;
  xpToNextLevel: number;
  compact?: boolean;
}

export function XPProgressBar({ xp, level, xpProgress, xpToNextLevel, compact = false }: XPBarProps) {
  const pct = Math.min(xpProgress, 100);

  if (compact) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span style={{ color: 'var(--text-muted)' }}>Lv.{level}</span>
          <span style={{ color: 'var(--text-muted)' }}>{xp} XP</span>
        </div>
        <div className="xp-bar">
          <div className="xp-bar-fill" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{xpToNextLevel} XP to next level</p>
      </div>
    );
  }

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center">
            <Star className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Level</p>
            <p className="font-bold text-lg leading-none" style={{ color: 'var(--text-primary)' }}>{level}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Total XP</p>
          <p className="font-bold text-primary-600 dark:text-primary-400">{xp.toLocaleString()}</p>
        </div>
      </div>
      <div className="xp-bar">
        <div className="xp-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        {xpToNextLevel} XP to reach Level {level + 1}
      </p>
    </div>
  );
}

/* ─── Streak Display ──────────────────────────────────────────────────────── */

interface StreakProps {
  streak: number;
  compact?: boolean;
}

export function StreakDisplay({ streak, compact = false }: StreakProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
           style={{ background: 'rgba(245,158,11,0.1)' }}>
        <FlameIcon size={14} />
        <span className="text-xs font-bold text-accent-600 dark:text-accent-400">{streak}d</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
         style={{ background: 'rgba(245,158,11,0.1)' }}>
      <FlameIcon size={18} />
      <span className="font-bold text-accent-600 dark:text-accent-400">{streak}</span>
      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>day streak</span>
    </div>
  );
}

/* ─── Flame icon (SVG, no emoji) ─────────────────────────────────────────── */

export function FlameIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 2C12 2 8 7 8 12C8 14.2 9.8 16 12 16C14.2 16 16 14.2 16 12C16 10 15 8 15 8C15 8 14 11 12 11C11 11 10 10 10 8.5C10 6 12 2 12 2Z"
        fill="#f59e0b"
      />
      <path
        d="M12 16C9.8 16 8 14.2 8 12C8 14 7 17 7 19C7 21.2 9.2 22 12 22C14.8 22 17 21.2 17 19C17 17 16 14 16 12C16 14.2 14.2 16 12 16Z"
        fill="#ef4444"
        opacity="0.8"
      />
    </svg>
  );
}

/* ─── XP Toast ────────────────────────────────────────────────────────────── */

interface XPToastProps {
  xp: number;
  message?: string;
  onDone?: () => void;
}

export function XPToast({ xp, message, onDone }: XPToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => { setVisible(false); setTimeout(() => onDone?.(), 350); }, 2500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      className="fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-card-lg animate-fade-up"
      style={{
        background: 'var(--bg-card)',
        border: '1.5px solid rgba(20,184,166,0.3)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(-8px)',
        transition: 'opacity 0.35s ease, transform 0.35s ease',
      }}
    >
      <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center">
        <Zap className="w-4 h-4 text-white" />
      </div>
      <div>
        <p className="text-sm font-bold text-primary-600 dark:text-primary-400">+{xp} XP</p>
        {message && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{message}</p>}
      </div>
    </div>
  );
}

/* ─── Level Up Popup ─────────────────────────────────────────────────────── */

interface LevelUpProps {
  newLevel: number;
  onDone?: () => void;
}

export function LevelUpPopup({ newLevel, onDone }: LevelUpProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={onDone}
    >
      <div
        className="text-center px-10 py-10 rounded-3xl shadow-card-lg animate-pop"
        style={{ background: 'var(--bg-card)', maxWidth: 340 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-20 h-20 rounded-full bg-brand-gradient flex items-center justify-center mx-auto mb-4 shadow-glow-teal">
          <TrendingUp className="w-10 h-10 text-white" />
        </div>
        <p className="text-2xl font-display font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Level Up!</p>
        <p className="text-4xl font-display font-extrabold text-brand mb-3">Level {newLevel}</p>
        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
          You've reached Level {newLevel}. Keep trading and learning!
        </p>
        <button onClick={onDone} className="btn-primary px-6 py-2.5">Continue</button>
      </div>
    </div>
  );
}

/* ─── Achievement Popup ──────────────────────────────────────────────────── */

interface AchievementPopupProps {
  achievement: { name: string; description: string; icon: string; xpReward: number };
  onDone?: () => void;
}

export function AchievementPopup({ achievement, onDone }: AchievementPopupProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={onDone}
    >
      <div
        className="text-center px-10 py-8 rounded-3xl shadow-card-lg animate-pop"
        style={{ background: 'var(--bg-card)', maxWidth: 320 }}
        onClick={e => e.stopPropagation()}
      >
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-3 text-4xl"
          style={{ background: 'linear-gradient(135deg,#fef3c7,#fde68a)', border: '3px solid #f59e0b' }}
        >
          {achievement.icon}
        </div>
        <p className="text-xs font-bold text-accent-500 uppercase tracking-widest mb-1">Badge Unlocked</p>
        <p className="text-xl font-display font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          {achievement.name}
        </p>
        <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>{achievement.description}</p>
        <p className="text-primary-600 dark:text-primary-400 font-bold mb-5">+{achievement.xpReward} XP</p>
        <button onClick={onDone} className="btn-primary px-6 py-2.5">Awesome!</button>
      </div>
    </div>
  );
}

/* ─── Dark Mode Toggle ───────────────────────────────────────────────────── */

interface DarkModeToggleProps {
  isDark: boolean;
  onToggle: () => void;
}

export function DarkModeToggle({ isDark, onToggle }: DarkModeToggleProps) {
  return (
    <button
      onClick={onToggle}
      aria-label="Toggle dark mode"
      className="relative w-10 h-5.5 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
      style={{
        background: isDark
          ? 'linear-gradient(90deg, #0d9488, #14b8a6)'
          : 'rgba(148,163,184,0.3)',
        width: 42,
        height: 24,
      }}
    >
      <span
        className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full shadow-sm transition-transform duration-300 flex items-center justify-center text-xs"
        style={{
          background: 'white',
          transform: isDark ? 'translateX(18px)' : 'translateX(0)',
        }}
      >
        {isDark
          ? <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{color:'#6366f1'}}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          : <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{color:'#f59e0b'}}><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="1" y1="12" x2="3" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="21" y1="12" x2="23" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>}
      </span>
    </button>
  );
}
