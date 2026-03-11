import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { learningApi, gamificationApi } from '../api/client';
import { Lock, CheckCircle, Clock, Star, ChevronRight, BookOpen, Zap, BookMarked } from 'lucide-react';
import { MascotTip } from '../components/mascot/Mascot';
import { XPProgressBar } from '../components/gamification/GamificationUI';

interface Lesson {
  id: number; title: string; description: string; category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  xpReward: number; duration: string; completed: boolean; locked: boolean;
}
interface Progress {
  lessonsCompleted: number; totalLessons: number; percentComplete: number;
  categories: Record<string, { completed: number; total: number }>;
}

const CATEGORY_META: Record<string, { icon: string; color: string; bg: string; label: string }> = {
  basics:       { icon: 'basics', color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-100',       label: 'Basics'       },
  algo:         { icon: 'algo',   color: 'text-primary-700', bg: 'bg-primary-50 border-primary-100', label: 'Algo Trading' },
  fundamentals: { icon: 'fundamentals', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100', label: 'Fundamentals' },
  technical:    { icon: 'technical', color: 'text-primary-700',  bg: 'bg-primary-50 border-primary-100',   label: 'Technical'    },
  advanced:     { icon: 'advanced', color: 'text-red-700',     bg: 'bg-red-50 border-red-100',         label: 'Advanced'     },
};
const DIFF_META = {
  beginner:     { label: 'Beginner',     color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-400' },
  intermediate: { label: 'Intermediate', color: 'bg-amber-100 text-amber-700',     dot: 'bg-amber-400'   },
  advanced:     { label: 'Advanced',     color: 'bg-red-100 text-red-700',         dot: 'bg-red-400'     },
};
const MASCOT_TIPS: Record<string, string> = {
  all:          "Start from the basics and work your way up. Each lesson builds on the last.",
  basics:       "These foundations are everything. Without them, advanced techniques won't make sense.",
  fundamentals: "Understanding risk and reward is the #1 skill that separates winners from losers.",
  technical:    "Charts are the language of markets. Practice reading them on the Trade page!",
  advanced:     "You've made it far! These skills are what the top 10% of traders actually use.",
  algo:         "Algorithms remove emotion from trading. Master these strategies, then test them on the Algo page!",
};

export default function Learn() {
  const [lessons, setLessons]         = useState<Lesson[]>([]);
  const [progress, setProgress]       = useState<Progress | null>(null);
  const [profile, setProfile]         = useState<any>(null);
  const [selectedCat, setSelectedCat] = useState('all');
  const [loading, setLoading]         = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [lRes, pRes, gRes] = await Promise.all([
        learningApi.getLessons(), learningApi.getProgress(), gamificationApi.getProfile(),
      ]);
      setLessons(lRes.data.data || []);
      setProgress(pRes.data.data);
      setProfile(gRes.data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const categories    = ['all', ...Array.from(new Set(lessons.map(l => l.category)))];
  const filtered      = selectedCat === 'all' ? lessons : lessons.filter(l => l.category === selectedCat);
  const completedCount = lessons.filter(l => l.completed).length;
  const nextLesson    = lessons.find(l => !l.completed && !l.locked);

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-32 bg-gray-100 rounded-2xl" />
      <div className="grid grid-cols-3 gap-3">{[1,2,3].map(i=><div key={i} className="h-24 bg-gray-100 rounded-2xl"/>)}</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{[1,2,3,4,5,6].map(i=><div key={i} className="h-52 bg-gray-100 rounded-2xl"/>)}</div>
    </div>
  );

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Learning Academy</h1>
          <p className="text-gray-500 mt-1">Master trading from beginner to pro</p>
        </div>
        {profile && (
          <div className="card w-72">
            <XPProgressBar xp={profile.xp} level={profile.level} xpProgress={profile.xpProgress} xpToNextLevel={profile.xpToNextLevel} />
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { v: completedCount, l: 'Completed', color: 'text-primary-600' },
          { v: progress?.totalLessons || 0, l: 'Total Lessons', color: 'text-gray-900' },
          { v: `${progress?.percentComplete || 0}%`, l: 'Progress', color: 'text-emerald-600' },
          { v: profile?.streak || 0, l: 'Day Streak', color: 'text-orange-500' },
        ].map((s, i) => (
          <div key={i} className="card text-center py-4">
            <p className={`text-3xl font-black ${s.color}`}>{s.v}</p>
            <p className="text-xs text-gray-500 font-medium mt-1">{s.l}</p>
          </div>
        ))}
      </div>

      {/* Progress overview */}
      {progress && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(20,184,166,0.12)' }}>
                <BookOpen className="w-4 h-4 text-primary-600" />
              </div>
              <p className="font-bold text-gray-900">{completedCount}/{progress.totalLessons} lessons completed</p>
            </div>
            <span className="text-sm font-bold text-primary-600">{progress.percentComplete}%</span>
          </div>
          <div className="xp-bar h-3"><div className="xp-bar-fill" style={{ width: `${progress.percentComplete}%` }} /></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            {Object.entries(progress.categories).map(([cat, data]) => {
              const m = CATEGORY_META[cat] || { emoji:'📁', color:'text-gray-700', bg:'bg-gray-50 border-gray-100', label: cat };
              const pct = data.total>0 ? Math.round((data.completed/data.total)*100) : 0;
              return (
                <button key={cat} onClick={() => setSelectedCat(cat)}
                  className={`p-3 rounded-xl border text-left transition-all ${m.bg} ${selectedCat===cat?'ring-2 ring-indigo-400':''}`}>
                  <div className="flex items-center gap-1.5 mb-1"><span>{m.emoji}</span><span className={`text-xs font-bold ${m.color}`}>{m.label}</span></div>
                  <p className="text-xs text-gray-500">{data.completed}/{data.total}</p>
                  <div className="mt-1.5 h-1 bg-white/60 rounded-full"><div className={`h-full rounded-full transition-all ${m.color.replace('text','bg')}`} style={{width:`${pct}%`}} /></div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Mascot */}
      <MascotTip mood="happy" message={MASCOT_TIPS[selectedCat] || MASCOT_TIPS.all} title="Zara's Tip" className="card" />

      {/* Continue CTA */}
      {nextLesson && selectedCat === 'all' && (
        <Link to={`/learn/${nextLesson.id}`}>
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl p-5 flex items-center justify-between hover:shadow-lg hover:shadow-indigo-500/25 transition-all active:scale-[0.99]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-yellow-300" />
              </div>
              <div>
                <p className="text-xs font-bold text-white/70 uppercase tracking-wide">Continue Learning</p>
                <p className="font-bold">{nextLesson.title}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/70" />
          </div>
        </Link>
      )}

      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => {
          const ICONS: Record<string, string> = { all: '📋', basics: '📖', fundamentals: '💡', technical: '📊', advanced: '🎓', algo: '🤖' };
          const m = cat==='all' ? {emoji:'📋',label:'All'} : {emoji: ICONS[cat] || '📁', label:CATEGORY_META[cat]?.label||cat};
          const count = cat==='all' ? lessons.length : lessons.filter(l=>l.category===cat).length;
          return (
            <button key={cat} onClick={() => setSelectedCat(cat)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                selectedCat===cat
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-500/25'
                  : 'border hover:border-primary-300'
              }`}
              style={selectedCat!==cat ? { background: 'var(--bg-card)', color: 'var(--text-secondary)', borderColor: 'var(--border)' } : {}}>
              <span>{m.emoji}</span><span>{m.label}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${selectedCat===cat?'bg-white/20':''}`}
                    style={selectedCat!==cat ? { background: 'var(--bg-page)', color: 'var(--text-muted)' } : {}}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Lessons grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((lesson, idx) => {
          const diff = DIFF_META[lesson.difficulty];
          const catM = CATEGORY_META[lesson.category];
          return (
            <div key={lesson.id} className={`animate-slide-up ${lesson.completed?'lesson-card-completed':lesson.locked?'lesson-card-locked':'lesson-card-available'}`}
              style={{ animationDelay: `${idx*40}ms` }}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${diff.color}`}>
                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${diff.dot} mr-1.5`} />{diff.label}
                  </span>
                  {catM && <span className="text-xs text-gray-400">{catM.emoji} {catM.label}</span>}
                </div>
                {lesson.completed ? <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  : lesson.locked ? <Lock className="w-5 h-5 text-gray-300 flex-shrink-0" /> : null}
              </div>
              <h3 className="font-bold text-gray-900 mb-1 leading-tight">{lesson.title}</h3>
              <p className="text-sm text-gray-500 mb-4 line-clamp-2">{lesson.description}</p>
              <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{lesson.duration}</span>
                <span className="flex items-center gap-1 text-primary-600 font-semibold"><Star className="w-3 h-3 fill-indigo-600" />+{lesson.xpReward} XP</span>
              </div>
              {lesson.locked ? (
                <div className="flex items-center gap-2 text-xs text-gray-400 py-2 px-3 bg-gray-50 rounded-xl">
                  <Lock className="w-3.5 h-3.5" />Complete previous lesson first
                </div>
              ) : (
                <Link to={`/learn/${lesson.id}`}
                  className={`flex items-center justify-between w-full py-2.5 px-4 rounded-xl font-semibold text-sm transition-all ${
                    lesson.completed ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-primary-600 text-white hover:bg-primary-700 shadow-md shadow-indigo-500/20'
                  }`}>
                  <span>{lesson.completed ? '↩ Review' : 'Start Lesson'}</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="card text-center py-16">
          <BookMarked className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No lessons in this category yet</p>
        </div>
      )}
    </div>
  );
}
