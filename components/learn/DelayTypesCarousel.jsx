'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// Botanical Press palette — matches globals.css tokens
const C = {
  paper:     '#F8F2E8',
  cream:     '#F2EBE0',
  ink:       '#1F2A1C',
  inkSoft:   '#5A5750',
  line:      '#D4C9B4',
  field500:  '#3A4A35',
  field600:  '#2D3A2A',
  field700:  '#1F2A1C',
  sienna500: '#B85A3F',
  sienna600: '#95421F',
  mustard500:'#C99F44',
  mustard600:'#9B7530',
};

const sans  = 'var(--font-manrope), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const serif = 'var(--font-fraunces), Georgia, serif';
const mono  = 'var(--font-jbmono), ui-monospace, "SF Mono", Menlo, monospace';

// Edexcel 1.12 Delay — six delay forms with detail content
const DELAY_TYPES = [
  {
    n: '01', name: 'Clean',
    bg: C.field700, fg: C.paper, accent: C.mustard500,
    title: 'Clean',
    desc: 'Even repeats locked to the grid. The reference delay — no colour, no slip.',
    diagram: 'clean',
    details: {
      listenFor: 'Even-spaced echoes locked to tempo. No tonal change between repeats — each one sounds identical to the last but quieter.',
      examples: [
        'Radiohead "Pyramid Song" — tempo-locked clean digital delay',
        'Travis Scott / Mike Dean — grid-locked vocal throws on ad-libs',
        'Modern pop production — clean ¼-note delay as the default vocal echo',
      ],
      settings: 'Time: ¼ note · Feedback: 35% · Mix: 25%',
      examPointer: 'Digital delay is bit-perfect playback — repeats decay only in level, never in tone. That tonal cleanliness is the exam point.',
    },
  },
  {
    n: '02', name: 'Multi-tap',
    bg: C.cream, fg: C.ink, accent: C.sienna500, border: C.line,
    title: 'Multi-tap',
    desc: 'Several taps at irregular times. Rhythm built from one source hit.',
    diagram: 'multitap',
    details: {
      listenFor: 'Several distinct echoes at fixed gaps — not a decaying chain. Often panned across the stereo field for rhythmic interest.',
      examples: [
        'Pink Floyd "Run Like Hell" — Gilmour stacks two dotted-eighth delays for a multi-tap feel',
        'Deadmau5, Skrillex EDM build-ups — multi-tap risers and fills',
        'Ableton Echo / Logic Tape Delay — multi-tap modes built into modern DAWs',
      ],
      settings: 'Tap 1: ⅛ note · Tap 2: dotted ⅛ · Tap 3: ¼ · per-tap pan + level',
      examPointer: 'Each tap has its own time, level and pan. There is no feedback loop — this is what separates multi-tap from a feedback delay.',
    },
  },
  {
    n: '03', name: 'Slapback',
    bg: C.sienna500, fg: C.paper, accent: C.paper,
    title: 'Slapback',
    desc: 'One short repeat, 10–120 ms, no feedback. The Elvis sound.',
    diagram: 'slapback',
    details: {
      listenFor: 'A single short echo close behind the original. The recording feels "doubled" rather than echoing into space.',
      examples: [
        'Elvis Presley — Sun Sessions 1954–56 (Sam Phillips, two offset tape machines)',
        'Scotty Moore — Ray Butts EchoSonic amp for live rockabilly slapback',
        'Arctic Monkeys, Tame Impala — slapback vocals across indie revival',
      ],
      settings: 'Time: 80 ms · Feedback: 0% · Mix: 30%',
      examPointer: 'Short time (50–120 ms), zero feedback, single audible repeat. The Sun Studio sound — name those three parameters in any question on slapback.',
    },
  },
  {
    n: '04', name: 'Tape delay',
    bg: C.field500, fg: C.paper, accent: C.mustard500,
    title: 'Tape echo',
    desc: 'Head spacing sets time. Each pass loses high end — repeats darken.',
    diagram: 'tape',
    details: {
      listenFor: 'Repeats progressively lose top end and pick up flutter and saturation. The echo feels warmer and darker as it decays.',
      examples: [
        'Pink Floyd "Echoes" — Binson Echorec on David Gilmour\'s guitar',
        'Dub reggae — King Tubby, Lee "Scratch" Perry on Echoplex / Roland Space Echo',
        'Hank Marvin & The Shadows — Meazzi tape echo on "Apache" (1960)',
      ],
      settings: 'Head spacing: dotted ⅛ · Feedback: 55% · Tape age: warm',
      examPointer: 'Tape character comes from playback head wear and tape saturation — each pass loses high frequencies. That tonal evolution is the signature.',
    },
  },
  {
    n: '05', name: 'Ping-pong',
    bg: C.mustard500, fg: C.field700, accent: C.field500,
    title: 'Ping-pong',
    desc: 'Two delay lines, crossed feedback. Repeats bounce L ↔ R.',
    diagram: 'pingpong',
    details: {
      listenFor: 'Repeats alternate between the left and right speakers — the dry signal sits centre while the echoes bounce side to side.',
      examples: [
        'Pink Floyd "On the Run" — VCS3 synth sequence panned with stereo delay',
        'U2 "Bad" — The Edge\'s stereo ping-pong guitar',
        'Tycho — ping-pong as a core ambient/electronic texture',
      ],
      settings: 'L Time: ¼ · R Time: ⅛ · Feedback: 55%',
      examPointer: 'Two delay lines with crossed feedback. Repeats alternate channels — stereo motion from a mono source.',
    },
  },
  {
    n: '06', name: 'Modulated',
    bg: C.field600, fg: C.paper, accent: C.mustard500,
    title: 'Modulated',
    desc: 'Delay time wavers under an LFO. Pitch shifts on each repeat — chorus territory.',
    diagram: 'modulated',
    details: {
      listenFor: 'Each repeat is slightly pitch-shifted up and down — a wobble or chorus on the wet path that the dry signal does not share.',
      examples: [
        'The Police "Walking on the Moon" — Andy Summers\' chorused/modulated delay',
        'Cocteau Twins — Robin Guthrie stacks chorus after delay (EHX Poly Chorus)',
        'Harold Budd & Brian Eno "The Plateaux of Mirror" — AMS digital + tape modulation',
      ],
      settings: 'Time: 280 ms · Feedback: 45% · LFO rate: 0.8 Hz · Depth: 20%',
      examPointer: 'At short times this overlaps with chorus and flange. At longer times it produces audible pitch-wobbling echoes — that LFO modulation is the defining feature.',
    },
  },
];

const CARD_W = 300;
const CARD_H = 380;
const RADIUS = 320;

export default function DelayTypesCarousel({ types = DELAY_TYPES, initialIndex = 0 }) {
  const [index, setIndex] = useState(initialIndex);
  const [openIndex, setOpenIndex] = useState(null);
  const total = types.length;
  const theta = 360 / total;

  const next = useCallback(() => setIndex(i => i + 1), []);
  const prev = useCallback(() => setIndex(i => i - 1), []);

  const isOpen = openIndex !== null;

  useEffect(() => {
    function onKey(e) {
      if (isOpen) {
        if (e.key === 'Escape')     { setOpenIndex(null); }
        if (e.key === 'ArrowRight') { setIndex(i => i + 1); setOpenIndex(i => (i + 1) % total); }
        if (e.key === 'ArrowLeft')  { setIndex(i => i - 1); setOpenIndex(i => (i - 1 + total) % total); }
      } else {
        if (e.key === 'ArrowRight') next();
        if (e.key === 'ArrowLeft')  prev();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, total, next, prev]);

  // Lock scroll when overlay is open
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [isOpen]);

  const angle  = -1 * theta * index;
  const active = types[((index % total) + total) % total];

  const handleCardClick = (i) => {
    // bring the clicked card to the front, then open
    const delta = ((i - ((index % total) + total) % total + total) % total);
    const stepped = delta > total / 2 ? delta - total : delta;
    setIndex(idx => idx + stepped);
    setOpenIndex(i);
  };

  return (
    <div style={{ fontFamily: sans, color: C.ink, position: 'relative' }}>
      {/* 3D scene */}
      <div style={{
        perspective: 1500,
        width: '100%', height: CARD_H + 80,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 24,
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'relative',
          width: CARD_W, height: CARD_H,
          transformStyle: 'preserve-3d',
          transition: 'transform 0.9s cubic-bezier(.22,.9,.32,1)',
          transform: `translateZ(-${RADIUS}px) rotateY(${angle}deg)`,
        }}>
          {types.map((t, i) => {
            const isFront = i === ((index % total) + total) % total;
            return (
              <CardFace
                key={t.n}
                t={t}
                isFront={isFront}
                onClick={() => handleCardClick(i)}
                style={{ transform: `rotateY(${theta * i}deg) translateZ(${RADIUS}px)` }}
              />
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 16,
      }}>
        <button type="button" onClick={prev} style={btn(false)} aria-label="Previous delay type">← Previous</button>

        <div style={{
          fontFamily: mono, fontSize: 12, color: C.inkSoft,
          minWidth: 200, textAlign: 'center', letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>
          Type <span style={{ color: C.ink, fontWeight: 600 }}>{active.n}</span>
          <span style={{ opacity: 0.5 }}> · </span>
          {String(total).padStart(2, '0')}
          <span style={{ opacity: 0.5 }}> · </span>
          <span style={{ color: C.ink }}>{active.name}</span>
        </div>

        <button type="button" onClick={next} style={btn(true)} aria-label="Next delay type">Next →</button>
      </div>

      <p style={{
        marginTop: 16, textAlign: 'center',
        fontFamily: mono, fontSize: 11, letterSpacing: '0.1em',
        color: C.inkSoft, opacity: 0.7,
      }}>
        Click a card for details · ←/→ to browse · ESC to close
      </p>

      {/* Detail overlay */}
      <AnimatePresence>
        {isOpen && (
          <DetailOverlay
            t={types[openIndex]}
            onClose={() => setOpenIndex(null)}
            onPrev={() => { setIndex(i => i - 1); setOpenIndex(i => (i - 1 + total) % total); }}
            onNext={() => { setIndex(i => i + 1); setOpenIndex(i => (i + 1) % total); }}
            position={`${(openIndex ?? 0) + 1} / ${total}`}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- Card face (carousel) ---------- */

function CardFace({ t, style, onClick, isFront }) {
  // Outer div owns the 3D transform (rotateY + translateZ).
  // Inner motion.div owns the morph (layoutId). Separating them is what
  // keeps motion's layout engine from clobbering the 3D positioning.
  return (
    <div style={{
      position: 'absolute',
      width: CARD_W, height: CARD_H,
      transformStyle: 'preserve-3d',
      ...style,
    }}>
      <motion.div
        layoutId={`delay-card-${t.n}`}
        onClick={onClick}
        role="button"
        tabIndex={isFront ? 0 : -1}
        aria-label={`Open details for ${t.title}`}
        transition={{ layout: { duration: 0.85, ease: [0.22, 0.9, 0.32, 1] } }}
        style={{
          width: '100%', height: '100%',
          borderRadius: 20,
          padding: '22px 24px 20px',
          background: t.bg,
          color: t.fg,
          border: t.border ? `1px solid ${t.border}` : 0,
          boxShadow: '0 30px 70px rgba(31, 42, 28, 0.28), 0 1px 0 rgba(255,255,255,0.05) inset',
          display: 'flex', flexDirection: 'column',
          cursor: isFront ? 'pointer' : 'default',
          boxSizing: 'border-box',
        }}
      >
        <p style={{
          fontFamily: mono, fontSize: 10.5, letterSpacing: '0.16em',
          textTransform: 'uppercase', opacity: 0.72, margin: 0,
        }}>
          Type {t.n} <span style={{ opacity: 0.55 }}>·</span> 06 <span style={{ opacity: 0.55 }}>·</span> {t.name}
        </p>

        <h2 style={{
          fontFamily: serif, fontSize: 42, lineHeight: 1.0,
          margin: '14px 0 10px', fontWeight: 500, letterSpacing: '-0.015em',
        }}>{t.title}</h2>

        <p style={{
          fontSize: 13.5, lineHeight: 1.45, margin: 0, opacity: 0.92,
          maxWidth: '24ch',
        }}>{t.desc}</p>

        <div style={{ flex: 1 }} />

        <div style={{ marginTop: 8 }}>
          <Diagram kind={t.diagram} fg={t.fg} accent={t.accent} />
        </div>
      </motion.div>
    </div>
  );
}

/* ---------- Detail overlay ---------- */

function DetailOverlay({ t, onClose, onPrev, onNext, position }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(15, 18, 14, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'clamp(16px, 4vw, 48px)',
        overflow: 'auto',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 1080,
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 360px) 1fr',
          gap: 'clamp(16px, 3vw, 32px)',
          alignItems: 'start',
        }}
        className="delay-detail-grid"
      >
        {/* Morphed card */}
        <motion.div
          layoutId={`delay-card-${t.n}`}
          transition={{ layout: { duration: 0.85, ease: [0.22, 0.9, 0.32, 1] } }}
          style={{
            width: '100%', aspectRatio: `${CARD_W} / ${CARD_H}`,
            borderRadius: 24,
            padding: '24px 26px 22px',
            background: t.bg,
            color: t.fg,
            border: t.border ? `1px solid ${t.border}` : 0,
            boxShadow: '0 40px 80px rgba(0, 0, 0, 0.45)',
            display: 'flex', flexDirection: 'column',
          }}
        >
          <p style={{
            fontFamily: mono, fontSize: 11, letterSpacing: '0.16em',
            textTransform: 'uppercase', opacity: 0.72, margin: 0,
          }}>
            Type {t.n} <span style={{ opacity: 0.55 }}>·</span> 06 <span style={{ opacity: 0.55 }}>·</span> {t.name}
          </p>

          <h2 style={{
            fontFamily: serif, fontSize: 'clamp(36px, 4vw, 46px)', lineHeight: 1.0,
            margin: '14px 0 10px', fontWeight: 500, letterSpacing: '-0.015em',
          }}>{t.title}</h2>

          <p style={{
            fontSize: 14, lineHeight: 1.45, margin: 0, opacity: 0.92,
            maxWidth: '28ch',
          }}>{t.desc}</p>

          <div style={{ flex: 1 }} />

          <div style={{ marginTop: 8 }}>
            <Diagram kind={t.diagram} fg={t.fg} accent={t.accent} />
          </div>
        </motion.div>

        {/* Detail panel */}
        <motion.div
          initial={{ opacity: 0, x: 36 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 36 }}
          transition={{ duration: 0.55, delay: 0.35, ease: [0.22, 0.9, 0.32, 1] }}
          style={{
            background: C.paper,
            color: C.ink,
            borderRadius: 24,
            padding: 'clamp(24px, 3vw, 36px) clamp(24px, 3vw, 40px)',
            boxShadow: '0 40px 80px rgba(0, 0, 0, 0.25)',
            position: 'relative',
          }}
        >
          {/* Header row */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 18,
          }}>
            <span style={{
              fontFamily: mono, fontSize: 11, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: C.inkSoft,
            }}>
              Position {position}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button type="button" onClick={onPrev} style={iconBtn} aria-label="Previous type">←</button>
              <button type="button" onClick={onNext} style={iconBtn} aria-label="Next type">→</button>
              <button type="button" onClick={onClose} style={{ ...iconBtn, marginLeft: 6 }} aria-label="Close">×</button>
            </div>
          </div>

          <Section label="Listen for">
            <p style={pBody}>{t.details.listenFor}</p>
          </Section>

          <Section label="Where you hear it">
            <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none' }}>
              {t.details.examples.map((ex, i) => (
                <li key={i} style={{
                  ...pBody, padding: '6px 0',
                  borderTop: i === 0 ? 'none' : `1px solid ${C.line}`,
                }}>
                  <span style={{
                    fontFamily: mono, fontSize: 10, color: C.inkSoft,
                    marginRight: 10, letterSpacing: '0.08em',
                  }}>{String(i + 1).padStart(2, '0')}</span>
                  {ex}
                </li>
              ))}
            </ul>
          </Section>

          <Section label="Settings to try">
            <p style={{ ...pBody, fontFamily: mono, fontSize: 13 }}>{t.details.settings}</p>
          </Section>

          <Section label="Exam pointer" last>
            <p style={pBody}>{t.details.examPointer}</p>
          </Section>
        </motion.div>
      </div>

      <style>{`
        @media (max-width: 720px) {
          .delay-detail-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </motion.div>
  );
}

function Section({ label, last, children }) {
  return (
    <div style={{ marginBottom: last ? 0 : 20 }}>
      <p style={{
        fontFamily: mono, fontSize: 10.5, letterSpacing: '0.16em',
        textTransform: 'uppercase', color: C.field500, margin: '0 0 8px',
      }}>{label}</p>
      {children}
    </div>
  );
}

const pBody = {
  fontFamily: sans, fontSize: 15, lineHeight: 1.55,
  color: C.ink, margin: 0,
};

const iconBtn = {
  appearance: 'none',
  background: 'transparent',
  color: C.ink,
  border: `1px solid ${C.line}`,
  borderRadius: 999,
  width: 32, height: 32,
  fontSize: 14,
  cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  lineHeight: 1,
};

/* ---------- Diagram registry ---------- */

function Diagram({ kind, fg, accent }) {
  if (kind === 'slapback')  return <DiagramSlapback  fg={fg} accent={accent} />;
  if (kind === 'tape')      return <DiagramTape      fg={fg} accent={accent} />;
  if (kind === 'pingpong')  return <DiagramPingPong  fg={fg} accent={accent} />;
  if (kind === 'clean')     return <DiagramClean     fg={fg} accent={accent} />;
  if (kind === 'multitap')  return <DiagramMultiTap  fg={fg} accent={accent} />;
  if (kind === 'modulated') return <DiagramModulated fg={fg} accent={accent} />;
  return null;
}

function DiagramSlapback({ fg }) {
  const x0 = 16, xMax = 252;
  const axisY = 102;
  const x = ms => x0 + (ms / 200) * (xMax - x0);
  const dryX = x(0), wetX = x(80);
  return (
    <svg viewBox="0 0 252 140" width="100%" style={{ display: 'block' }}>
      <line x1={x0} y1={axisY} x2={xMax} y2={axisY} stroke={fg} strokeOpacity="0.4" />

      <line x1={dryX} y1={axisY} x2={dryX} y2={28} stroke={fg} strokeWidth="1.25" />
      <circle cx={dryX} cy={28} r="5" fill={fg} />
      <text x={dryX} y={20} fontSize="9" fontFamily={mono} fill={fg} textAnchor="middle" letterSpacing="0.14em">DRY</text>

      <line x1={wetX} y1={axisY} x2={wetX} y2={36} stroke={fg} strokeWidth="1.25" strokeDasharray="1,3" />
      <circle cx={wetX} cy={36} r="5" fill={fg} fillOpacity="0.92" />
      <text x={wetX} y={28} fontSize="9" fontFamily={mono} fill={fg} textAnchor="middle" letterSpacing="0.14em">WET</text>

      <line x1={dryX} y1={62} x2={wetX} y2={62} stroke={fg} strokeOpacity="0.7" />
      <text x={(dryX + wetX) / 2} y={56} fontSize="9" fontFamily={mono} fill={fg} textAnchor="middle" letterSpacing="0.14em">80 MS</text>

      {[0, 40, 80, 120, 160, 200].map(t => (
        <g key={t}>
          <line x1={x(t)} y1={axisY} x2={x(t)} y2={axisY + 3} stroke={fg} strokeOpacity="0.5" />
          <text x={x(t)} y={axisY + 14} fontSize="9" fontFamily={mono} fill={fg} fillOpacity="0.7" textAnchor="middle">{t}</text>
        </g>
      ))}
      <text x={xMax} y={axisY + 28} fontSize="9" fontFamily={mono} fill={fg} fillOpacity="0.7" textAnchor="end" letterSpacing="0.16em">TIME →</text>
    </svg>
  );
}

function DiagramTape({ fg, accent }) {
  const bars = [
    { label: 'DRY', h: 80, color: fg, dry: true },
    { label: '×1', h: 60, color: accent },
    { label: '×2', h: 42, color: accent },
    { label: '×3', h: 28, color: accent },
    { label: '×4', h: 18, color: accent },
    { label: '×5', h: 11, color: accent },
  ];
  const startX = 18;
  const barW = 18;
  const gap = 22;
  const axisY = 112;
  return (
    <svg viewBox="0 0 252 140" width="100%" style={{ display: 'block' }}>
      <line x1="10" y1={axisY} x2="245" y2={axisY} stroke={fg} strokeOpacity="0.35" />

      <text x="220" y="24" fontSize="10" fontFamily={mono} fill={fg} fillOpacity="0.75" textAnchor="middle" letterSpacing="0.04em" fontStyle="italic">darker →</text>

      <path
        d={bars.map((b, i) => {
          const cx = startX + i * (barW + gap) + barW / 2;
          const cy = axisY - b.h;
          return `${i === 0 ? 'M' : 'L'} ${cx} ${cy}`;
        }).join(' ')}
        fill="none" stroke={fg} strokeOpacity="0.45" strokeDasharray="2,3"
      />

      {bars.map((b, i) => {
        const x = startX + i * (barW + gap);
        return (
          <g key={b.label}>
            <rect x={x} y={axisY - b.h} width={barW} height={b.h} fill={b.color} opacity={b.dry ? 1 : 0.95} />
            <text x={x + barW / 2} y={axisY + 14} fontSize="9" fontFamily={mono} fill={fg} fillOpacity="0.8" textAnchor="middle" letterSpacing="0.06em">{b.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

function DiagramPingPong({ fg, accent }) {
  const dials = [
    { cx: 50,  frac: 0.25,  value: '¼',   label: 'L TIME' },
    { cx: 126, frac: 0.125, value: '⅛',   label: 'R TIME' },
    { cx: 202, frac: 0.55,  value: '55%', label: 'FEEDBACK' },
  ];
  return (
    <svg viewBox="0 0 252 220" width="100%" style={{ display: 'block' }}>
      {dials.map(d => (
        <Dial key={d.label} cx={d.cx} cy={42} r={24} frac={d.frac} value={d.value} label={d.label} fg={fg} accent={accent} />
      ))}

      <text x="12" y="158" fontSize="10" fontFamily={mono} fill={fg} fillOpacity="0.75">L</text>
      <text x="12" y="186" fontSize="10" fontFamily={mono} fill={fg} fillOpacity="0.75">R</text>
      <line x1="26" y1="154" x2="244" y2="154" stroke={fg} strokeOpacity="0.35" />
      <line x1="26" y1="182" x2="244" y2="182" stroke={fg} strokeOpacity="0.35" />

      <path d="M 60 154 L 100 182 L 140 154 L 180 182 L 220 154"
            fill="none" stroke={fg} strokeOpacity="0.4" strokeDasharray="2,3" />

      {[
        { x: 60,  y: 154, r: 6,   op: 1    },
        { x: 100, y: 182, r: 5.2, op: 0.78 },
        { x: 140, y: 154, r: 4.5, op: 0.58 },
        { x: 180, y: 182, r: 3.8, op: 0.40 },
        { x: 220, y: 154, r: 3.2, op: 0.28 },
      ].map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={accent} opacity={d.op} />
      ))}
    </svg>
  );
}

function Dial({ cx, cy, r, frac, value, label, fg, accent }) {
  const stroke = 4;
  const circ = 2 * Math.PI * r;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={fg} strokeOpacity="0.28" strokeWidth={stroke} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={accent} strokeWidth={stroke}
              strokeDasharray={`${frac * circ} ${circ}`}
              strokeLinecap="round"
              transform={`rotate(-90 ${cx} ${cy})`} />
      <text x={cx} y={cy + 6} fontFamily={serif} fontSize="18" fontWeight="500" fill={fg} textAnchor="middle">{value}</text>
      <text x={cx} y={cy + r + 18} fontFamily={mono} fontSize="9" fill={fg} fillOpacity="0.75" textAnchor="middle" letterSpacing="0.12em">{label}</text>
    </g>
  );
}

function DiagramClean({ fg, accent }) {
  const impulses = [
    { x: 22,  h: 78, dry: true, label: 'DRY' },
    { x: 68,  h: 58, label: '¼' },
    { x: 114, h: 42, label: '½' },
    { x: 160, h: 30, label: '¾' },
    { x: 206, h: 20, label: '1' },
  ];
  const axisY = 112;
  return (
    <svg viewBox="0 0 252 140" width="100%" style={{ display: 'block' }}>
      <line x1="14" y1={axisY} x2="245" y2={axisY} stroke={fg} strokeOpacity="0.35" />

      <path
        d={impulses.map((b, i) => {
          const cx = b.x + 3;
          const cy = axisY - b.h;
          return `${i === 0 ? 'M' : 'L'} ${cx} ${cy}`;
        }).join(' ')}
        fill="none" stroke={fg} strokeOpacity="0.35" strokeDasharray="2,3"
      />

      {impulses.map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={axisY - b.h} width="6" height={b.h} fill={b.dry ? fg : accent} />
          <text x={b.x + 3} y={axisY + 14} fontSize="9" fontFamily={mono} fill={fg} fillOpacity="0.8" textAnchor="middle" letterSpacing="0.06em">{b.label}</text>
        </g>
      ))}

      <text x="245" y="135" fontSize="9" fontFamily={mono} fill={fg} fillOpacity="0.7" textAnchor="end" letterSpacing="0.16em">BEATS →</text>
    </svg>
  );
}

function DiagramMultiTap({ fg, accent }) {
  const taps = [
    { x: 22,  h: 78, dry: true, label: 'DRY' },
    { x: 70,  h: 50, label: 'T1' },
    { x: 122, h: 64, label: 'T2' },
    { x: 174, h: 38, label: 'T3' },
    { x: 222, h: 56, label: 'T4' },
  ];
  const axisY = 112;
  return (
    <svg viewBox="0 0 252 140" width="100%" style={{ display: 'block' }}>
      <line x1="10" y1={axisY} x2="245" y2={axisY} stroke={fg} strokeOpacity="0.35" />
      {taps.map((t, i) => (
        <g key={i}>
          <line x1={t.x} y1={axisY} x2={t.x} y2={axisY - t.h + 5}
                stroke={t.dry ? fg : accent}
                strokeOpacity={t.dry ? 0.9 : 0.75} strokeWidth="1.25" />
          <circle cx={t.x} cy={axisY - t.h} r={t.dry ? 5 : 4.5} fill={t.dry ? fg : accent} />
          <text x={t.x} y={axisY + 14} fontSize="9" fontFamily={mono} fill={fg} fillOpacity="0.8" textAnchor="middle" letterSpacing="0.08em">{t.label}</text>
        </g>
      ))}
      <text x="245" y="135" fontSize="9" fontFamily={mono} fill={fg} fillOpacity="0.6" textAnchor="end" letterSpacing="0.16em">TIME →</text>
    </svg>
  );
}

function DiagramModulated({ fg, accent }) {
  const pts = [];
  const steps = 60;
  for (let i = 0; i <= steps; i++) {
    const x = 14 + (i / steps) * 230;
    const y = 70 + Math.sin((i / steps) * Math.PI * 3) * 22;
    pts.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  const dots = [0.12, 0.27, 0.42, 0.57, 0.72, 0.87];
  return (
    <svg viewBox="0 0 252 140" width="100%" style={{ display: 'block' }}>
      <line x1="14" y1="70" x2="244" y2="70" stroke={fg} strokeOpacity="0.25" strokeDasharray="2,4" />
      <path d={pts.join(' ')} fill="none" stroke={accent} strokeWidth="1.5" />

      {dots.map((p, i) => {
        const x = 14 + p * 230;
        const y = 70 + Math.sin(p * Math.PI * 3) * 22;
        return <circle key={i} cx={x} cy={y} r="4.2" fill={accent} opacity={1 - i * 0.13} />;
      })}

      <text x="14"  y="24"  fontSize="9" fontFamily={mono} fill={fg} fillOpacity="0.75" letterSpacing="0.14em">LFO RATE</text>
      <text x="244" y="135" fontSize="9" fontFamily={mono} fill={fg} fillOpacity="0.65" textAnchor="end" letterSpacing="0.16em">TIME →</text>
    </svg>
  );
}

function btn(primary) {
  return {
    appearance: 'none',
    background: primary ? C.ink : 'transparent',
    color: primary ? C.paper : C.ink,
    fontFamily: sans,
    fontSize: 13,
    padding: '10px 18px',
    border: primary ? 0 : `1px solid ${C.line}`,
    borderRadius: 999,
    cursor: 'pointer',
    letterSpacing: '0.02em',
    transition: 'opacity 0.15s ease',
  };
}
