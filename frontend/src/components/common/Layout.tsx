import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useDarkMode } from '../../hooks/useDarkMode';
import { useState, useEffect } from 'react';
import { gamificationApi } from '../../api/client';
import {
  LayoutDashboard, TrendingUp, Wallet, Trophy, Bot,
  GraduationCap, LogOut, Menu, X, Award, BarChart2,
} from 'lucide-react';
import { MascotSVG } from '../mascot/Mascot';
import { XPProgressBar, DarkModeToggle, FlameIcon } from '../gamification/GamificationUI';

const NAV = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard'    },
  { to: '/trade',        icon: TrendingUp,      label: 'Trade'        },
  { to: '/portfolio',    icon: Wallet,          label: 'Portfolio'    },
  { to: '/leaderboard',  icon: Trophy,          label: 'Leaderboard'  },
  { to: '/algo',         icon: Bot,             label: 'Algo Trading' },
  { to: '/learn',        icon: GraduationCap,   label: 'Learn'        },
  { to: '/achievements', icon: Award,           label: 'Achievements' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggle: toggleDark } = useDarkMode();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [gamProfile, setGamProfile]  = useState<any>(null);

  useEffect(() => {
    gamificationApi.getProfile().then(r => setGamProfile(r.data.data)).catch(() => {});
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="min-h-screen transition-colors duration-200" style={{ background: 'var(--bg-page)' }}>

      {/* ─── Mobile Header ──────────────────────────────────────────────── */}
      <header
        className="lg:hidden fixed top-0 left-0 right-0 h-14 z-50 px-4 flex items-center justify-between"
        style={{ background: 'var(--bg-sidebar)', borderBottom: '1px solid var(--border)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center">
            <BarChart2 className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
            StockSim
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Streak badge */}
          {gamProfile?.streak > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: 'rgba(245,158,11,0.1)' }}>
              <FlameIcon size={13} />
              <span className="text-xs font-bold text-accent-600 dark:text-accent-400">{gamProfile.streak}</span>
            </div>
          )}
          {/* Level badge */}
          {gamProfile && (
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold text-white bg-brand-gradient"
            >
              {gamProfile.level}
            </div>
          )}
          <DarkModeToggle isDark={isDark} onToggle={toggleDark} />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* ─── Mobile Drawer ──────────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="absolute top-14 right-0 w-72 h-[calc(100%-3.5rem)] overflow-y-auto animate-slide-right"
            style={{ background: 'var(--bg-sidebar)', borderLeft: '1px solid var(--border)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* User section */}
            <div className="p-5 bg-brand-gradient">
              <div className="flex items-center gap-3 mb-4">
                <MascotSVG mood="happy" size={46} animate={false} />
                <div>
                  <p className="font-semibold text-white">{user?.username}</p>
                  <p className="text-white/70 text-xs">Level {gamProfile?.level ?? user?.level}</p>
                </div>
              </div>
              {gamProfile && (
                <div className="bg-white/15 rounded-xl p-2.5">
                  <div className="flex justify-between text-xs text-white/80 mb-1.5">
                    <span>XP Progress</span>
                    <span>{gamProfile.xpProgress}%</span>
                  </div>
                  <div className="h-1.5 bg-white/20 rounded-full">
                    <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${gamProfile.xpProgress}%` }} />
                  </div>
                </div>
              )}
            </div>

            <nav className="p-3 space-y-0.5">
              {NAV.map(item => (
                <NavLink key={item.to} to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm font-medium ${
                      isActive
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-sm font-medium mt-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* ─── Desktop Sidebar ────────────────────────────────────────────── */}
      <aside
        className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-60"
        style={{ background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border)' }}
      >
        {/* Logo */}
        <div className="h-15 flex items-center justify-between px-5 py-4"
             style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center shadow-sm">
              <BarChart2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-display font-bold text-sm leading-none" style={{ color: 'var(--text-primary)' }}>
                StockSim
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Trading Academy</p>
            </div>
          </div>
          <DarkModeToggle isDark={isDark} onToggle={toggleDark} />
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV.map(item => (
            <NavLink key={item.to} to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${
                  isActive
                    ? 'text-primary-700 dark:text-primary-400 font-semibold'
                    : ''
                }`
              }
              style={({ isActive }) => ({
                background: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
                color: isActive ? 'var(--sidebar-active-text)' : 'var(--text-secondary)',
              })}
            >
              {({ isActive }) => (
                <>
                  <item.icon className="w-4 h-4 shrink-0" style={{ opacity: isActive ? 1 : 0.7 }} />
                  <span>{item.label}</span>
                  {isActive && (
                    <div
                      className="ml-auto w-1.5 h-1.5 rounded-full"
                      style={{ background: 'var(--sidebar-active-text)' }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom: user + XP */}
        <div className="p-4 space-y-3" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <MascotSVG mood="idle" size={36} animate={false} />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                {user?.username}
              </p>
              {gamProfile && (
                <div className="flex items-center gap-2 mt-0.5">
                  <FlameIcon size={12} />
                  <span className="text-xs font-bold text-accent-500">{gamProfile.streak}</span>
                  <span style={{ color: 'var(--border)' }}>·</span>
                  <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                    Lv.{gamProfile.level}
                  </span>
                </div>
              )}
            </div>
          </div>

          {gamProfile && (
            <XPProgressBar
              xp={gamProfile.xp}
              level={gamProfile.level}
              xpProgress={gamProfile.xpProgress}
              xpToNextLevel={gamProfile.xpToNextLevel}
              compact
            />
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#ef4444'; (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.06)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* ─── Main content ───────────────────────────────────────────────── */}
      <main className="lg:pl-60 pt-14 lg:pt-0">
        <div className="min-h-screen p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          <div className="page-enter">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
