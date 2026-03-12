import { useState, useEffect } from 'react';
import { gamificationApi } from '../api/client';
import { Trophy, Star, Flame, Lock } from 'lucide-react';
import { XPProgressBar, StreakDisplay } from '../components/gamification/GamificationUI';
import { MascotTip } from '../components/mascot/Mascot';

const ICON_MAP: Record<string, string> = {
  trophy: '🏆', 'trending-up': '📈', award: '🎖️', crown: '👑',
  'dollar-sign': '💰', brain: '🧠', 'book-open': '📖', 'graduation-cap': '🎓',
  library: '📚', star: '⭐', flame: '🔥', fire: '🔥', zap: '⚡',
  'pie-chart': '📊', briefcase: '💼', shield: '🛡️',
};

interface Achievement {
  id: number; name: string; description: string; icon: string;
  xp_reward: number; criteria_type: string; criteria_value: number;
  unlocked: boolean; unlockedAt: string|null; progress?: number;
}

const MASCOT_MESSAGES = [
  "Keep completing lessons and making trades to unlock more badges! 🏅",
  "Every badge you earn means you're growing as a trader!",
  "Your streak badge is within reach — just show up every day!",
];

export default function Achievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [profile, setProfile]           = useState<any>(null);
  const [challenges, setChallenges]     = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [filter, setFilter]             = useState<'all'|'unlocked'|'locked'>('all');

  useEffect(() => {
    (async () => {
      try {
        const [aRes, pRes, cRes] = await Promise.all([
          gamificationApi.getAchievements(), gamificationApi.getProfile(), gamificationApi.getChallenges(),
        ]);
        setAchievements(aRes.data.data || []);
        setProfile(pRes.data.data);
        setChallenges(cRes.data.data?.daily || []);
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const filtered = filter === 'all' ? achievements : filter === 'unlocked' ? achievements.filter(a=>a.unlocked) : achievements.filter(a=>!a.unlocked);
  const unlocked = achievements.filter(a=>a.unlocked).length;

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-32 bg-gray-100 rounded-2xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1,2,3,4,5,6,7,8].map(i=><div key={i} className="h-32 bg-gray-100 rounded-2xl"/>)}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900">Achievements</h1>
        <p className="text-gray-500 mt-1">Your badges and daily challenges</p>
      </div>

      {/* Profile bar */}
      {profile && (
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <XPProgressBar xp={profile.xp} level={profile.level} xpProgress={profile.xpProgress} xpToNextLevel={profile.xpToNextLevel} />
            <div className="flex items-center gap-4">
              <StreakDisplay streak={profile.streak} />
              <div className="flex-1 text-right">
                <p className="text-2xl font-black text-amber-500">{unlocked}</p>
                <p className="text-xs text-gray-500">of {achievements.length} badges</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mascot tip */}
      <MascotTip
        mood={unlocked > 5 ? 'celebrating' : 'happy'}
        message={MASCOT_MESSAGES[unlocked % MASCOT_MESSAGES.length]}
        title="Kate's Message"
        className="card"
      />

      {/* Daily Challenges */}
      {challenges.length > 0 && (
        <div className="card">
          <h2 className="font-black text-gray-900 mb-4 flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" /> Daily Challenges
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {challenges.map((c:any) => (
              <div key={c.id} className={`rounded-xl border-2 p-4 transition-all ${c.completed ? 'border-emerald-300 bg-emerald-50' : 'border-gray-100 bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-sm text-gray-900">{c.title}</p>
                  {c.completed ? <span className="text-emerald-500 text-lg">✅</span> : <span className="text-gray-300 text-lg">⭕</span>}
                </div>
                <p className="text-xs text-gray-500 mb-3">{c.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-3">
                    <div className="h-1.5 bg-gray-200 rounded-full">
                      <div className="h-full bg-primary-50 dark:bg-primary-950/200 rounded-full transition-all" style={{width:`${Math.min((c.progress/c.target)*100,100)}%`}} />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{c.progress}/{c.target}</p>
                  </div>
                  <span className="text-xs font-bold text-primary-600">+{c.xp_reward} XP</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Achievement gallery */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-black text-gray-900 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" /> Badge Gallery
            <span className="text-sm font-medium text-gray-400">({unlocked}/{achievements.length})</span>
          </h2>
          <div className="flex gap-1">
            {(['all','unlocked','locked'] as const).map(f => (
              <button key={f} onClick={()=>setFilter(f)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${filter===f?'bg-primary-600 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filtered.map(a => (
            <div key={a.id} className={a.unlocked ? 'achievement-unlocked' : 'achievement-card-locked'}>
              <div className={`text-4xl mb-2 ${a.unlocked ? '' : 'achievement-locked'}`}>
                {a.unlocked ? (ICON_MAP[a.icon] || '🏅') : '🔒'}
              </div>
              <p className={`text-xs font-bold mb-1 leading-tight ${a.unlocked ? 'text-gray-900' : 'text-gray-400'}`}>
                {a.name}
              </p>
              <p className={`text-xs leading-tight ${a.unlocked ? 'text-gray-500' : 'text-gray-300'}`}>
                {a.description}
              </p>
              {a.unlocked ? (
                <div className="mt-2 flex items-center justify-center gap-1 text-xs font-bold text-amber-600">
                  <Star className="w-3 h-3 fill-amber-500" /> +{a.xp_reward} XP
                </div>
              ) : (
                <div className="mt-2 w-full">
                  <div className="h-1 bg-gray-200 rounded-full">
                    <div className="h-full bg-gray-300 rounded-full" style={{width:`${Math.min(((a.progress||0)/a.criteria_value)*100,100)}%`}} />
                  </div>
                  <p className="text-xs text-gray-300 mt-1">{a.progress||0}/{a.criteria_value}</p>
                </div>
              )}
              {a.unlocked && a.unlockedAt && (
                <p className="text-xs text-gray-300 mt-1">{new Date(a.unlockedAt).toLocaleDateString()}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
