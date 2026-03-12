import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  ChevronRight, ChevronLeft, BookOpen, TrendingUp,
  ShieldAlert, Rocket, Loader2, GraduationCap, BarChart2,
} from 'lucide-react';
import { MascotSVG } from '../components/mascot/Mascot';

type Skill = 'beginner' | 'intermediate' | null;

const STEPS = [
  {
    mood:      'excited'  as const,
    title:     "Meet Zara, your trading guide!",
    subtitle:  "Your personal companion",
    icon:      BarChart2,
    content:   "Welcome to StockSim — India's best trading simulator for young learners! Zara will be with you every step of the way.\n\nWhether you're brand new to investing or already know a thing or two, we'll make sure you become a confident, knowledgeable trader.",
    highlight: "100% virtual money. 0% real risk. Real skills.",
  },
  {
    mood:      'happy'   as const,
    title:     "What is a Stock?",
    subtitle:  "Let's start simple",
    icon:      BarChart2,
    content:   "Imagine you and 3 friends want to open a pizza shop. It costs ₹1,00,000 to start, so you split it into 1,000 equal pieces (shares) worth ₹100 each.\n\nIf each of you buys 250 shares, you each own 25% of the pizza shop. That's exactly what stocks are — tiny ownership pieces of real companies like Reliance, TCS, or Infosys!",
    highlight: "When the company grows, your shares become more valuable.",
  },
  {
    mood:      'thinking' as const,
    title:     "Your ₹1,00,000 Portfolio",
    subtitle:  "Virtual money, real lessons",
    icon:      TrendingUp,
    content:   "You're starting with ₹1,00,000 in virtual money. This isn't real money, so you can practice buying and selling stocks without any risk!\n\nUse it to:\n• Buy shares of Indian companies\n• Learn how your portfolio grows\n• Make mistakes safely\n• Compete on the leaderboard",
    highlight: "Think of it as a flight simulator for investing.",
  },
  {
    mood:      'warning'  as const,
    title:     "The Golden Rules",
    subtitle:  "Learn this before anything else",
    icon:      ShieldAlert,
    content:   "Rule 1: Never risk more than you can afford to lose. Even with virtual money, practice good habits.\n\nRule 2: Diversify — don't put all your eggs in one basket.\n\nRule 3: Learn before you earn. Complete lessons FIRST, then apply what you know.",
    highlight: "Smart investing is about discipline, not luck.",
  },
  {
    mood:      'celebrating' as const,
    title:     "Personalise Your Journey",
    subtitle:  "Pick your starting level",
    icon:      Rocket,
    content:   null,
    highlight: null,
  },
];

const PATHS: Record<NonNullable<Skill>, { title: string; desc: string; firstLesson: string; Icon: any }> = {
  beginner: {
    title:       "Complete Beginner",
    desc:        "Start from the very basics — what stocks are, how markets work, and your first trades.",
    firstLesson: "What is the Stock Market?",
    Icon:        BookOpen,
  },
  intermediate: {
    title:       "Some Knowledge",
    desc:        "Skip the basics and dive into technical analysis, chart reading, and advanced strategies.",
    firstLesson: "Support and Resistance",
    Icon:        TrendingUp,
  },
};

export default function Onboarding() {
  const [step, setStep]   = useState(0);
  const [skill, setSkill] = useState<Skill>(null);
  const { completeOnboarding, isLoading } = useAuth();
  const navigate = useNavigate();

  const current = STEPS[step];
  const isLast  = step === STEPS.length - 1;

  const handleNext = async () => {
    if (isLast) {
      if (!skill) return;
      await completeOnboarding();
      navigate('/dashboard');
    } else {
      setStep(s => s + 1);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #0d9488 0%, #0f172a 100%)' }}
    >
      {/* Decorative background circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-10 bg-white" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full opacity-5 bg-white" />
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-white opacity-20 animate-pulse-soft"
            style={{ left: `${15 + i * 15}%`, top: `${10 + (i % 3) * 30}%`, animationDelay: `${i * 0.4}s` }}
          />
        ))}
      </div>

      <div className="relative w-full max-w-md z-10">
        {/* Step dots */}
        <div className="flex justify-center gap-2 mb-6">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width:   i === step ? 24 : 8,
                height:  8,
                background: i === step ? 'white' : i < step ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.25)',
              }}
            />
          ))}
        </div>

        <div
          className="rounded-3xl p-8 shadow-card-lg animate-fade-up"
          style={{ background: 'var(--bg-card, #ffffff)' }}
        >
          {/* Mascot */}
          <div className="flex justify-center mb-5">
            <MascotSVG mood={current.mood} size={100} animate />
          </div>

          <div className="text-center mb-6">
            <p className="text-xs font-bold text-primary-600 uppercase tracking-widest mb-1">
              {current.subtitle}
            </p>
            <h2 className="text-2xl font-display font-bold" style={{ color: 'var(--text-primary, #0f172a)' }}>
              {current.title}
            </h2>
          </div>

          {/* Skill selection step */}
          {step === STEPS.length - 1 ? (
            <div className="space-y-3">
              <p className="text-sm text-center mb-4" style={{ color: 'var(--text-muted, #64748b)' }}>
                What best describes your current knowledge?
              </p>
              {(['beginner', 'intermediate'] as const).map(s => {
                const path = PATHS[s];
                const isActive = skill === s;
                return (
                  <button
                    key={s}
                    onClick={() => setSkill(s)}
                    className="w-full p-4 rounded-2xl text-left transition-all"
                    style={{
                      border: `2px solid ${isActive ? '#14b8a6' : 'var(--border, #e2e8f0)'}`,
                      background: isActive ? 'rgba(20,184,166,0.06)' : 'transparent',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: isActive ? 'rgba(20,184,166,0.15)' : 'var(--bg-page, #f8fafc)' }}
                      >
                        <path.Icon className="w-5 h-5" style={{ color: isActive ? '#0d9488' : 'var(--text-muted, #64748b)' }} />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm" style={{ color: 'var(--text-primary, #0f172a)' }}>
                          {path.title}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted, #64748b)' }}>
                          {path.desc}
                        </p>
                      </div>
                      <div
                        className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                        style={{ borderColor: isActive ? '#14b8a6' : 'var(--border, #e2e8f0)', background: isActive ? '#14b8a6' : 'transparent' }}
                      >
                        {isActive && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                    </div>
                    {isActive && (
                      <div
                        className="mt-3 pt-3 text-xs font-medium text-primary-600 flex items-center gap-1.5"
                        style={{ borderTop: '1px solid rgba(20,184,166,0.2)' }}
                      >
                        <GraduationCap className="w-3.5 h-3.5" />
                        You'll start with: "{path.firstLesson}"
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {current.content && (
                <p
                  className="text-sm leading-relaxed whitespace-pre-line"
                  style={{ color: 'var(--text-secondary, #475569)' }}
                >
                  {current.content}
                </p>
              )}
              {current.highlight && (
                <div
                  className="px-4 py-3 rounded-xl text-sm font-semibold text-center"
                  style={{ background: 'rgba(20,184,166,0.08)', color: '#0d9488', border: '1px solid rgba(20,184,166,0.2)' }}
                >
                  {current.highlight}
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-7">
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="px-4 py-2.5 rounded-xl border text-sm font-medium transition-all"
                style={{ border: '1px solid var(--border, #e2e8f0)', color: 'var(--text-secondary, #475569)' }}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={isLoading || (isLast && !skill)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white bg-brand-gradient transition-all disabled:opacity-50 active:scale-98"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLast ? "Start My Journey" : "Next"}
              {!isLast && !isLoading && <ChevronRight className="w-4 h-4" />}
              {isLast && !isLoading && <Rocket className="w-4 h-4" />}
            </button>
          </div>

          <p className="text-center text-xs mt-4" style={{ color: 'var(--text-muted, #94a3b8)' }}>
            Step {step + 1} of {STEPS.length}
          </p>
        </div>
      </div>
    </div>
  );
}
