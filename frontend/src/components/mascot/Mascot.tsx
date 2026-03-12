import { useState, useEffect } from 'react';

/* ═══════════════════════════════════════════
   KATE — Plushie bear cub mascot
   Moods: idle | thinking | happy | excited | warning | celebrating
════════════════════════════════════════════ */

type Mood = 'idle' | 'thinking' | 'happy' | 'excited' | 'warning' | 'celebrating';

interface MascotProps {
  mood?: Mood;
  size?: number;
  animate?: boolean;
  className?: string;
}

export function MascotSVG({ mood = 'idle', size = 80, animate = true, className = '' }: MascotProps) {
  const [blink, setBlink] = useState(false);
  const [bob,   setBob]   = useState(false);

  useEffect(() => {
    if (!animate) return;
    // Random blink
    const blinkId = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 130);
    }, 2800 + Math.random() * 2000);
    // Gentle head bob
    const bobId = setInterval(() => {
      setBob(true);
      setTimeout(() => setBob(false), 400);
    }, 4000 + Math.random() * 3000);
    return () => { clearInterval(blinkId); clearInterval(bobId); };
  }, [animate]);

  const isFloat   = animate && (mood === 'celebrating' || mood === 'excited');
  const floatCls  = isFloat ? 'animate-float' : '';
  const bobStyle  = bob && animate ? { transform: 'rotate(-4deg)' } : {};

  // Bear colour palette — warm caramel plushie
  const fur      = '#D4956A';
  const furDark  = '#B57A52';
  const furLight = '#E8B590';
  const innerEar = '#F0A090';
  const nose     = '#3D2314';
  const pupils   = '#1a0d08';

  // Mouth per mood
  const mouthPaths: Record<Mood, string> = {
    idle:        'M 44 62 Q 50 66 56 62',
    thinking:    'M 44 63 L 56 63',
    happy:       'M 42 60 Q 50 68 58 60',
    excited:     'M 40 59 Q 50 70 60 59',
    warning:     'M 44 65 Q 50 61 56 65',
    celebrating: 'M 40 59 Q 50 71 60 59',
  };

  // Eyebrow offset per mood (y-delta from base)
  const eyebrowDelta: Record<Mood, number> = {
    idle: 0, thinking: -2, happy: -3, excited: -5, warning: 3, celebrating: -5,
  };
  const ebD = eyebrowDelta[mood];

  return (
    <div
      className={`inline-block select-none ${floatCls} ${className}`}
      style={{ width: size, height: size, transition: 'transform 0.3s' }}
    >
      <svg
        viewBox="0 0 100 110"
        width={size}
        height={size}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* ── Shadow ── */}
        <ellipse cx="50" cy="107" rx="22" ry="4" fill="rgba(0,0,0,0.1)" />

        {/* ── Body (plush rounded) ── */}
        <ellipse cx="50" cy="85" rx="26" ry="22" fill={fur} />
        {/* Tummy patch */}
        <ellipse cx="50" cy="88" rx="16" ry="14" fill={furLight} opacity="0.6" />

        {/* ── Ears (behind head) ── */}
        <circle cx="24" cy="32" r="12" fill={furDark} />
        <circle cx="24" cy="32" r="7"  fill={innerEar} />
        <circle cx="76" cy="32" r="12" fill={furDark} />
        <circle cx="76" cy="32" r="7"  fill={innerEar} />

        {/* ── Head ── */}
        <g style={bobStyle}>
          <circle cx="50" cy="50" r="30" fill={fur} />

          {/* Forehead highlight */}
          <ellipse cx="44" cy="34" rx="8" ry="5" fill={furLight} opacity="0.5" />

          {/* ── Snout ── */}
          <ellipse cx="50" cy="60" rx="12" ry="9" fill={furLight} />

          {/* ── Nose ── */}
          <ellipse cx="50" cy="56" rx="5" ry="3.5" fill={nose} />
          <ellipse cx="49" cy="55" rx="1.5" ry="1" fill="rgba(255,255,255,0.3)" />

          {/* ── Eyes ── */}
          {blink ? (
            <>
              <path d="M 36 48 Q 40 46 44 48" stroke={pupils} strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <path d="M 56 48 Q 60 46 64 48" stroke={pupils} strokeWidth="2.5" fill="none" strokeLinecap="round" />
            </>
          ) : (
            <>
              {/* Left eye */}
              <circle cx="40" cy="48" r="6.5" fill="white" />
              <circle cx="40" cy="48" r="4.5" fill={pupils} />
              <circle cx="41.5" cy="46.5" r="1.5" fill="white" />
              {/* Right eye */}
              <circle cx="60" cy="48" r="6.5" fill="white" />
              <circle cx="60" cy="48" r="4.5" fill={pupils} />
              <circle cx="61.5" cy="46.5" r="1.5" fill="white" />
            </>
          )}

          {/* ── Eyebrows ── */}
          <path
            d={`M 33 ${42 + ebD} Q 40 ${39 + ebD} 46 ${42 + ebD}`}
            stroke={furDark} strokeWidth="2.5" fill="none" strokeLinecap="round"
          />
          <path
            d={`M 54 ${42 + ebD} Q 60 ${39 + ebD} 67 ${42 + ebD}`}
            stroke={furDark} strokeWidth="2.5" fill="none" strokeLinecap="round"
          />

          {/* ── Mouth ── */}
          <path
            d={mouthPaths[mood]}
            stroke={nose} strokeWidth="2" fill="none" strokeLinecap="round"
          />

          {/* ── Cheeks (on happy moods) ── */}
          {(mood === 'happy' || mood === 'excited' || mood === 'celebrating') && (
            <>
              <circle cx="30" cy="57" r="6" fill="#e8877a" opacity="0.35" />
              <circle cx="70" cy="57" r="6" fill="#e8877a" opacity="0.35" />
            </>
          )}

          {/* ── Thinking dots ── */}
          {mood === 'thinking' && (
            <>
              <circle cx="74" cy="36" r="2.5" fill="#14b8a6" opacity="0.6" />
              <circle cx="80" cy="28" r="3.5" fill="#14b8a6" opacity="0.7" />
              <circle cx="85" cy="18" r="5"   fill="#14b8a6" opacity="0.8" />
            </>
          )}

          {/* ── Warning badge ── */}
          {mood === 'warning' && (
            <g transform="translate(68, 16)">
              <circle cx="10" cy="10" r="10" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.5" />
              <text x="7" y="15" fontSize="12" fill="#d97706" fontWeight="bold">!</text>
            </g>
          )}

          {/* ── Celebrate sparkles ── */}
          {mood === 'celebrating' && (
            <>
              {/* left sparkle */}
              <g transform="translate(14,20) rotate(20)">
                <line x1="0" y1="-7" x2="0" y2="7" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
                <line x1="-7" y1="0" x2="7" y2="0" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
                <line x1="-5" y1="-5" x2="5" y2="5" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="5" y1="-5" x2="-5" y2="5" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
              </g>
              {/* right sparkle */}
              <g transform="translate(83,18) rotate(-15)">
                <line x1="0" y1="-6" x2="0" y2="6" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" />
                <line x1="-6" y1="0" x2="6" y2="0" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" />
                <line x1="-4" y1="-4" x2="4" y2="4" stroke="#2dd4bf" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="4" y1="-4" x2="-4" y2="4" stroke="#2dd4bf" strokeWidth="1.5" strokeLinecap="round" />
              </g>
            </>
          )}
        </g>

        {/* ── Paws ── */}
        <ellipse cx="28" cy="98" rx="10" ry="7" fill={furDark} />
        <ellipse cx="28" cy="97" rx="8" ry="5.5" fill={fur} />
        <ellipse cx="72" cy="98" rx="10" ry="7" fill={furDark} />
        <ellipse cx="72" cy="97" rx="8" ry="5.5" fill={fur} />

        {/* ── Paw pads ── */}
        <circle cx="26" cy="99" r="2" fill={innerEar} opacity="0.6" />
        <circle cx="30" cy="99" r="2" fill={innerEar} opacity="0.6" />
        <circle cx="70" cy="99" r="2" fill={innerEar} opacity="0.6" />
        <circle cx="74" cy="99" r="2" fill={innerEar} opacity="0.6" />
      </svg>
    </div>
  );
}

// ─── Mascot tip box ──────────────────────────────────────────────────────────

interface MascotTipProps {
  message: string;
  mood?: Mood;
  title?: string;
  className?: string;
}

export function MascotTip({ message, mood = 'idle', title, className = '' }: MascotTipProps) {
  return (
    <div className={`flex items-start gap-4 ${className}`}>
      <MascotSVG mood={mood} size={56} animate />
      <div className="mascot-tip flex-1">
        {title && (
          <p className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wide mb-1">
            {title}
          </p>
        )}
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {message}
        </p>
      </div>
    </div>
  );
}

// ─── Mascot speech bubble ────────────────────────────────────────────────────

interface MascotSpeechProps {
  message: string;
  mood?: Mood;
  name?: string;
  size?: number;
}

export function MascotSpeech({ message, mood = 'idle', name = 'Kate', size = 90 }: MascotSpeechProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <MascotSVG mood={mood} size={size} animate />
      <div
        className="relative rounded-2xl px-4 py-3 shadow-sm max-w-xs"
        style={{ background: 'var(--bg-card)', border: '1.5px solid rgba(20,184,166,0.25)' }}
      >
        <div
          className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45"
          style={{ background: 'var(--bg-card)', borderTop: '1.5px solid rgba(20,184,166,0.25)', borderLeft: '1.5px solid rgba(20,184,166,0.25)' }}
        />
        <p className="text-xs font-bold text-primary-600 dark:text-primary-400 mb-1">{name}</p>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{message}</p>
      </div>
    </div>
  );
}

// ─── Empty-state mascot (large, centered) ───────────────────────────────────

interface MascotEmptyProps {
  title: string;
  subtitle?: string;
  mood?: Mood;
  size?: number;
  action?: React.ReactNode;
}

export function MascotEmpty({ title, subtitle, mood = 'thinking', size = 110, action }: MascotEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center gap-4 animate-fade-up">
      <MascotSVG mood={mood} size={size} animate />
      <div>
        <p className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>{title}</p>
        {subtitle && <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export default MascotSVG;
