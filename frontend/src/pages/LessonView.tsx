import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { learningApi } from '../api/client';
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, Star, HelpCircle } from 'lucide-react';
import { MascotSVG } from '../components/mascot/Mascot';
import { XPToast, LevelUpPopup, AchievementPopup } from '../components/gamification/GamificationUI';

interface Section {
  type: 'story' | 'text' | 'interactive' | 'example';
  title?: string; content?: string;
  question?: string; options?: string[]; correctAnswer?: number;
}
interface QuizQ { question: string; options: string[]; correctAnswer: number; explanation?: string; }
interface Lesson {
  id: number; title: string; description: string; category: string;
  difficulty: string; xpReward: number; duration: string;
  content: Section[]; quiz: QuizQ[];
}

const SECTION_TIPS: Record<Section['type'], string> = {
  story:       'Let me set the scene with a story! 📖',
  text:        'Pay attention — this is core knowledge! 🧠',
  interactive: 'Time to test yourself before reading on. 💪',
  example:     'Real examples make concepts click. Study this! ✨',
};

export default function LessonView() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const [lesson, setLesson]                             = useState<Lesson | null>(null);
  const [loading, setLoading]                           = useState(true);
  const [currentSection, setCurrentSection]             = useState(0);
  const [showQuiz, setShowQuiz]                         = useState(false);
  const [quizAnswers, setQuizAnswers]                   = useState<(number|null)[]>([]);
  const [quizSubmitted, setQuizSubmitted]               = useState(false);
  const [completing, setCompleting]                     = useState(false);
  const [interactiveAnswered, setInteractiveAnswered]   = useState<Record<number, number>>({});
  const [xpToast, setXpToast]                           = useState<{ xp: number; msg: string } | null>(null);
  const [levelUpData, setLevelUpData]                   = useState<{ newLevel: number } | null>(null);
  // achievement queue: show one at a time
  const [achievementQueue, setAchievementQueue]         = useState<any[]>([]);
  const [finalResult, setFinalResult]                   = useState<{ xpEarned: number; score: number } | null>(null);

  useEffect(() => { fetchLesson(); }, [id]);

  const fetchLesson = async () => {
    try {
      const res = await learningApi.getLesson(parseInt(id!));
      const data = res.data.data;
      setLesson(data);
      setQuizAnswers(new Array(data.quiz?.length || 0).fill(null));
    } catch (err: any) {
      if (err.response?.status === 403) navigate('/learn');
    } finally { setLoading(false); }
  };

  const handleNext = () => {
    if (lesson && currentSection < lesson.content.length - 1) {
      setCurrentSection(s => s + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else { setShowQuiz(true); }
  };

  const handlePrev = () => {
    if (showQuiz) setShowQuiz(false);
    else if (currentSection > 0) setCurrentSection(s => s - 1);
  };

  const handleInteractive = (idx: number, answer: number) =>
    setInteractiveAnswered(prev => ({ ...prev, [idx]: answer }));

  const handleSubmitQuiz = async () => {
    if (!lesson) return;
    if (quizAnswers.some(a => a === null)) { alert('Please answer all questions first.'); return; }
    const correct = quizAnswers.filter((a, i) => a === lesson.quiz[i].correctAnswer).length;
    const score   = Math.round((correct / lesson.quiz.length) * 100);
    setQuizSubmitted(true);
    setFinalResult({ xpEarned: 0, score });
    try {
      setCompleting(true);
      const res    = await learningApi.completeLesson(lesson.id, score);
      const result = res.data.data;
      setFinalResult({ xpEarned: result.xpEarned || 0, score });
      if (result.xpEarned > 0) setXpToast({ xp: result.xpEarned, msg: score >= 80 ? 'Excellent quiz!' : 'Lesson complete!' });
      if (result.levelUp) setTimeout(() => setLevelUpData({ newLevel: result.newLevel }), 1500);
      if (result.newAchievements?.length > 0)
        setTimeout(() => setAchievementQueue(result.newAchievements), result.levelUp ? 4000 : 1500);
    } catch (err) { console.error(err); }
    finally { setCompleting(false); }
  };

  const dismissAchievement = () => setAchievementQueue(q => q.slice(1));

  // ── Loading skeleton ────────────────────────────────────────────────────
  if (loading) return (
    <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
      <div className="h-8 rounded-xl w-2/3" style={{ background: 'var(--bg-card)' }} />
      <div className="h-64 rounded-2xl"     style={{ background: 'var(--bg-card)' }} />
    </div>
  );
  if (!lesson) return null;

  const section       = lesson.content[currentSection];
  const totalSteps    = lesson.content.length + 1;
  const progressPct   = showQuiz ? 100 : Math.round(((currentSection + 1) / totalSteps) * 100);
  const isLastSection = currentSection === lesson.content.length - 1;

  const getMood = (t: Section['type']) =>
    t === 'story' ? 'thinking' : t === 'interactive' ? 'excited' : t === 'example' ? 'happy' : 'idle';

  const DIFF_COLOR: Record<string, string> = {
    beginner:     'bg-emerald-100 text-emerald-700',
    intermediate: 'bg-amber-100 text-amber-700',
    advanced:     'bg-red-100 text-red-700',
  };

  // ── Helpers for quiz option styling ──────────────────────────────────────
  const interactiveStyle = (oi: number) => {
    const answered = interactiveAnswered[currentSection] !== undefined;
    const chosen   = interactiveAnswered[currentSection] === oi;
    const correct  = oi === section.correctAnswer;
    if (!answered) return { border: '2px solid var(--border)', background: 'var(--bg-page)' };
    if (correct)   return { border: '2px solid #10b981', background: 'rgba(16,185,129,0.08)' };
    if (chosen)    return { border: '2px solid #ef4444', background: 'rgba(239,68,68,0.07)' };
    return { border: '2px solid var(--border)', background: 'var(--bg-page)', opacity: 0.5 };
  };

  const quizOptionStyle = (qi: number, oi: number) =>
    quizAnswers[qi] === oi
      ? { border: '2px solid #14b8a6', background: 'rgba(20,184,166,0.09)' }
      : { border: '2px solid var(--border)', background: 'var(--bg-page)' };

  const reviewCardStyle = (correct: boolean) => correct
    ? { background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.25)' }
    : { background: 'rgba(239,68,68,0.06)',  border: '1px solid rgba(239,68,68,0.2)'  };

  return (
    <div className="max-w-2xl mx-auto pb-12 animate-fade-up">

      {/* ── Toasts & Popups ── */}
      {xpToast          && <XPToast xp={xpToast.xp} message={xpToast.msg} onDone={() => setXpToast(null)} />}
      {levelUpData      && <LevelUpPopup newLevel={levelUpData.newLevel} onClose={() => setLevelUpData(null)} />}
      {achievementQueue.length > 0 && (
        <AchievementPopup
          achievement={achievementQueue[0]}
          onDone={dismissAchievement}
        />
      )}

      {/* ── Back ── */}
      <button
        onClick={() => navigate('/learn')}
        className="flex items-center gap-2 text-sm mb-6 transition-colors hover:opacity-80"
        style={{ color: 'var(--text-muted)' }}
      >
        <ChevronLeft className="w-4 h-4" /> Back to lessons
      </button>

      {/* ── Header card ── */}
      <div className="card mb-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${DIFF_COLOR[lesson.difficulty] || 'bg-gray-100 text-gray-700'}`}>
                {lesson.difficulty}
              </span>
              <span className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>{lesson.category}</span>
            </div>
            <h1 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>{lesson.title}</h1>
            <p className="text-sm mt-1"       style={{ color: 'var(--text-muted)'    }}>{lesson.description}</p>
          </div>
          <div className="flex items-center gap-1 text-primary-600 dark:text-primary-400 text-sm font-bold ml-4 shrink-0">
            <Star className="w-4 h-4 fill-current" />+{lesson.xpReward} XP
          </div>
        </div>

        {/* Progress */}
        <div>
          <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>
            <span>{showQuiz ? 'Quiz Time!' : `Section ${currentSection + 1} of ${lesson.content.length}`}</span>
            <span className="font-bold text-primary-600 dark:text-primary-400">{progressPct}%</span>
          </div>
          <div className="xp-bar h-2.5">
            <div className="xp-bar-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="flex mt-2 gap-1">
            {lesson.content.map((_, i) => (
              <div key={i} className="flex-1 h-1 rounded-full transition-all"
                   style={{ background: i <= currentSection ? '#14b8a6' : 'var(--border)' }} />
            ))}
            <div className="flex-1 h-1 rounded-full transition-all"
                 style={{ background: showQuiz ? '#14b8a6' : 'var(--border)' }} />
          </div>
        </div>
      </div>

      {!showQuiz ? (
        /* ══════════════════════════════════
           LESSON SECTION
        ══════════════════════════════════ */
        <div className="space-y-5" key={currentSection}>

          {/* Mascot tip */}
          <div className="flex items-center gap-3">
            <MascotSVG mood={getMood(section.type) as any} size={52} />
            <div className="rounded-xl px-3 py-2 text-xs font-medium"
                 style={{ background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.15)', color: 'var(--text-secondary)' }}>
              {SECTION_TIPS[section.type]}
            </div>
          </div>

          {/* Section card */}
          <div className="card" style={
            section.type === 'story'   ? { borderLeft: '4px solid #a78bfa' } :
            section.type === 'example' ? { borderLeft: '4px solid #f59e0b' } : {}
          }>
            {section.type === 'interactive' ? (
              /* ── Interactive quick-check ── */
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                       style={{ background: 'rgba(20,184,166,0.12)' }}>
                    <HelpCircle className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  </div>
                  <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Quick Check</p>
                </div>
                <p className="font-semibold mb-4 leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                  {section.question}
                </p>
                <div className="space-y-2">
                  {section.options?.map((opt, oi) => {
                    const answered = interactiveAnswered[currentSection] !== undefined;
                    const correct  = oi === section.correctAnswer;
                    const chosen   = interactiveAnswered[currentSection] === oi;
                    return (
                      <button key={oi}
                        onClick={() => !answered && handleInteractive(currentSection, oi)}
                        disabled={answered}
                        className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-between"
                        style={interactiveStyle(oi)}
                      >
                        <span>
                          <span className="font-bold mr-3" style={{ color: 'var(--text-muted)' }}>
                            {String.fromCharCode(65 + oi)}.
                          </span>
                          <span style={{ color: answered && !correct && !chosen ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                            {opt}
                          </span>
                        </span>
                        {answered && correct && <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />}
                        {answered && chosen && !correct && <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
                {interactiveAnswered[currentSection] !== undefined && (
                  <div className="mt-4 p-3 rounded-xl text-sm font-medium" style={
                    interactiveAnswered[currentSection] === section.correctAnswer
                      ? { background: 'rgba(16,185,129,0.1)', color: '#059669' }
                      : { background: 'rgba(245,158,11,0.1)', color: '#d97706' }
                  }>
                    {interactiveAnswered[currentSection] === section.correctAnswer
                      ? '✅ Correct! Great job.'
                      : `💡 The correct answer is: ${section.options?.[section.correctAnswer!]}`}
                  </div>
                )}
              </div>
            ) : (
              /* ── Text / Story / Example ── */
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                       style={{ background: section.type === 'story' ? 'rgba(167,139,250,0.15)' : section.type === 'example' ? 'rgba(245,158,11,0.12)' : 'rgba(99,102,241,0.1)' }}>
                    {section.type === 'story' ? '📖' : section.type === 'example' ? '💡' : '📝'}
                  </div>
                  {section.title && (
                    <h2 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{section.title}</h2>
                  )}
                </div>
                <p className="leading-relaxed whitespace-pre-line text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {section.content}
                </p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button onClick={handlePrev} disabled={currentSection === 0}
              className="btn-secondary flex items-center gap-2 disabled:opacity-30">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={handleNext} className="btn-primary flex items-center gap-2">
              {isLastSection ? 'Take Quiz' : 'Next'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      ) : (
        /* ══════════════════════════════════
           QUIZ
        ══════════════════════════════════ */
        <div className="space-y-5 animate-fade-up">
          {!quizSubmitted ? (
            <>
              {/* Mascot tip */}
              <div className="flex items-center gap-3">
                <MascotSVG mood="thinking" size={52} />
                <div className="rounded-xl px-3 py-2 text-xs font-medium"
                     style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#d97706' }}>
                  Quiz time! Take it slow — re-read the sections if you need to.
                </div>
              </div>

              <div className="card">
                <h2 className="font-black text-lg mb-1 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <HelpCircle className="w-5 h-5 text-primary-500" /> Quiz Time
                </h2>
                <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                  Answer all {lesson.quiz.length} questions to complete the lesson
                </p>

                <div className="space-y-7">
                  {lesson.quiz.map((q, qi) => (
                    <div key={qi}>
                      {/* Divider (except first) */}
                      {qi > 0 && <div className="h-px mb-7" style={{ background: 'var(--border)' }} />}
                      <p className="font-bold text-sm mb-3 leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                        <span className="text-primary-500 mr-2">Q{qi + 1}.</span>{q.question}
                      </p>
                      <div className="space-y-2">
                        {q.options.map((opt, oi) => (
                          <button key={oi}
                            onClick={() => { const a = [...quizAnswers]; a[qi] = oi; setQuizAnswers(a); }}
                            className="w-full text-left px-4 py-3 rounded-xl text-sm transition-all flex items-center gap-3"
                            style={quizOptionStyle(qi, oi)}
                          >
                            <span className="font-bold shrink-0 w-5 text-center" style={{
                              color: quizAnswers[qi] === oi ? '#14b8a6' : 'var(--text-muted)'
                            }}>
                              {String.fromCharCode(65 + oi)}.
                            </span>
                            <span style={{ color: 'var(--text-secondary)' }}>{opt}</span>
                            {quizAnswers[qi] === oi && (
                              <div className="ml-auto w-2 h-2 rounded-full bg-primary-500 shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={handlePrev} className="btn-secondary flex items-center gap-2">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button onClick={handleSubmitQuiz}
                  disabled={completing || quizAnswers.some(a => a === null)}
                  className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {completing
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting…</>
                    : <><CheckCircle className="w-4 h-4" />Submit Quiz</>}
                </button>
              </div>
            </>

          ) : finalResult && (
            /* ── Quiz results ── */
            <>
              <div className="flex items-center gap-3">
                <MascotSVG mood={finalResult.score >= 80 ? 'celebrating' : finalResult.score >= 50 ? 'happy' : 'thinking'} size={64} />
                <div>
                  <p className="font-black text-xl" style={{ color: 'var(--text-primary)' }}>
                    {finalResult.score >= 80 ? 'Excellent!' : finalResult.score >= 50 ? 'Good job!' : 'Keep learning!'}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {finalResult.score >= 80
                      ? 'You really understood this lesson!'
                      : 'Review the sections you missed and try again.'}
                  </p>
                </div>
              </div>

              <div className="card text-center">
                {/* Score */}
                <div className={`text-6xl font-black mb-2 ${
                  finalResult.score >= 80 ? 'text-up' : finalResult.score >= 50 ? 'text-amber-500' : 'text-down'
                }`}>{finalResult.score}%</div>
                <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                  {lesson.quiz.filter((_, i) => quizAnswers[i] === lesson.quiz[i].correctAnswer).length} of {lesson.quiz.length} correct
                </p>

                {finalResult.xpEarned > 0 && (
                  <div className="inline-flex items-center gap-2 font-bold px-4 py-2 rounded-xl mb-4 text-sm"
                       style={{ background: 'rgba(20,184,166,0.1)', color: '#0d9488', border: '1px solid rgba(20,184,166,0.2)' }}>
                    <Star className="w-4 h-4 fill-current" /> +{finalResult.xpEarned} XP earned!
                  </div>
                )}

                {/* Answer review */}
                <div className="space-y-3 mt-4 text-left">
                  {lesson.quiz.map((q, qi) => {
                    const correct = quizAnswers[qi] === q.correctAnswer;
                    return (
                      <div key={qi} className="p-4 rounded-xl" style={reviewCardStyle(correct)}>
                        <div className="flex items-start gap-2 mb-2">
                          {correct
                            ? <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                            : <XCircle    className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />}
                          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{q.question}</p>
                        </div>
                        {!correct && (
                          <p className="text-xs ml-6" style={{ color: 'var(--text-secondary)' }}>
                            ✅ Correct answer: <span className="font-bold">{q.options[q.correctAnswer]}</span>
                          </p>
                        )}
                        {q.explanation && (
                          <p className="text-xs ml-6 mt-1 italic" style={{ color: 'var(--text-muted)' }}>
                            {q.explanation}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowQuiz(false); setCurrentSection(0); setQuizSubmitted(false); setQuizAnswers(new Array(lesson.quiz.length).fill(null)); setFinalResult(null); }}
                  className="btn-secondary flex-1">↩ Review Lesson</button>
                <button onClick={() => navigate('/learn')} className="btn-primary flex-1">
                  Back to Academy
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
