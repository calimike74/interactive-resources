'use client';

import { useState, useEffect, useCallback } from 'react';

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

// Edexcel 1.12 Delay — six delay forms
export const DELAY_TYPES = [
  {
    n: '01', name: 'Clean',
    bg: C.field700, fg: C.paper, accent: C.mustard500,
    title: 'Clean',
    desc: 'Even repeats locked to the grid. The reference delay — no colour, no slip.',
    diagram: 'clean',
  },
  {
    n: '02', name: 'Multi-tap',
    bg: C.cream, fg: C.ink, accent: C.sienna500, border: C.line,
    title: 'Multi-tap',
    desc: 'Several taps at irregular times. Rhythm built from one source hit.',
    diagram: 'multitap',
  },
  {
    n: '03', name: 'Slapback',
    bg: C.sienna500, fg: C.paper, accent: C.paper,
    title: 'Slapback',
    desc: 'One short repeat, 10–120 ms, no feedback. The Elvis sound.',
    diagram: 'slapback',
  },
  {
    n: '04', name: 'Tape delay',
    bg: C.field500, fg: C.paper, accent: C.mustard500,
    title: 'Tape echo',
    desc: 'Head spacing sets time. Each pass loses high end — repeats darken.',
    diagram: 'tape',
  },
  {
    n: '05', name: 'Ping-pong',
    bg: C.mustard500, fg: C.field700, accent: C.field500,
    title: 'Ping-pong',
    desc: 'Two delay lines, crossed feedback. Repeats bounce L ↔ R.',
    diagram: 'pingpong',
  },
  {
    n: '06', name: 'Modulated',
    bg: C.field600, fg: C.paper, accent: C.mustard500,
    title: 'Modulated',
    desc: 'Delay time wavers under an LFO. Pitch shifts on each repeat — chorus territory.',
    diagram: 'modulated',
  },
];

const CARD_W = 300;
const CARD_H = 380;
const RADIUS = 320;

export default function DelayTypesCarousel({ types = DELAY_TYPES, initialIndex = 0 }) {
  const [index, setIndex] = useState(initialIndex);
  const total = types.length;
  const theta = 360 / total;

  const next = useCallback(() => setIndex(i => i + 1), []);
  const prev = useCallback(() => setIndex(i => i - 1), []);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft')  prev();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev]);

  const angle  = -1 * theta * index;
  const active = types[((index % total) + total) % total];

  return (
    <div style={{ fontFamily: sans, color: C.ink }}>
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
          {types.map((t, i) => (
            <CardFace
              key={t.n}
              t={t}
              style={{ transform: `rotateY(${theta * i}deg) translateZ(${RADIUS}px)` }}
            />
          ))}
        </div>
      </div>

      {/* Controls */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 16,
      }}>
        <button onClick={prev} style={btn(false)} aria-label="Previous delay type">← Previous</button>

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

        <button onClick={next} style={btn(true)} aria-label="Next delay type">Next →</button>
      </div>
    </div>
  );
}

/* ---------- Card face ---------- */

function CardFace({ t, style }) {
  return (
    <div style={{
      position: 'absolute',
      width: CARD_W, height: CARD_H,
      borderRadius: 20,
      padding: '22px 24px 20px',
      background: t.bg,
      color: t.fg,
      border: t.border ? `1px solid ${t.border}` : 0,
      boxShadow: '0 30px 70px rgba(31, 42, 28, 0.28), 0 1px 0 rgba(255,255,255,0.05) inset',
      display: 'flex', flexDirection: 'column',
      ...style,
    }}>
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
    </div>
  );
}

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
