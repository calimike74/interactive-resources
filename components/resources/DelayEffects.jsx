'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import HearItAccordion from './HearItAccordion';
import { audioExamples } from '../../lib/audio-examples';

// ============================================
// Delay Effects
// A-Level Music Technology — Topic 1.12
// Adapted from Revelation Design System for interactive-resources
// ============================================

// CSS custom properties required by this component
const DESIGN_TOKENS_CSS = `
  .delay-effects-root {
    --accent: #2563EB;
    --accent-soft: rgba(37, 99, 235, 0.1);
    --secondary: #6366F1;
    --background: #FAFAFA;
    --background-raised: #FFFFFF;
    --foreground: #1A1A2E;
    --foreground-secondary: #4A4F5A;
    --foreground-tertiary: #8B909A;
    --border: #E5E7EB;
    --border-strong: #9CA3AF;
    --canvas-background: #0A0F1A;
    --canvas-surface: #111827;
    --canvas-foreground: #E8E4DF;
    --canvas-foreground-secondary: #9CA3AF;
    --canvas-foreground-tertiary: #6B7280;
    --canvas-border: #1F2937;
    --canvas-border-hover: #374151;
    --canvas-highlight: #60A5FA;
    --success: #059669;
    --success-soft: rgba(5, 150, 105, 0.1);
    --error: #DC2626;
    --error-soft: rgba(220, 38, 38, 0.1);
    --warning: #D97706;
    --annotation-info: #0891B2;
    --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
    --space-1: 0.25rem;
    --space-2: 0.5rem;
    --space-3: 0.75rem;
    --space-4: 1rem;
    --space-5: 1.25rem;
    --space-6: 1.5rem;
    --space-8: 2rem;
    --text-xs: 0.75rem;
    --text-sm: 0.875rem;
    --text-base: 1rem;
    --text-xl: 1.25rem;
    --text-3xl: 1.875rem;
    --text-4xl: 2.25rem;
    --radius-md: 0.375rem;
    --radius-lg: 0.5rem;
    --radius-xl: 0.75rem;
    --duration-fast: 150ms;
    --duration-normal: 300ms;
    --ease-out: cubic-bezier(0.4, 0, 0.2, 1);
  }
`;

const FONT_HEADING = "'Playfair Display', Georgia, serif";
const FONT_BODY = "'Inter', system-ui, sans-serif";

// ============================================
// COPYABLE NOTE
// ============================================
const CopyableNote = ({ title, children, color = 'var(--annotation-info)', variant = 'definition' }) => {
  const [copied, setCopied] = useState(false);
  const contentRef = useRef(null);
  const icons = { definition: '\u{1F4DD}', key: '\u2B50', exam: '\u{1F4CB}', warning: '\u26A0\uFE0F' };

  const handleCopy = async () => {
    if (contentRef.current) {
      try {
        await navigator.clipboard.writeText(contentRef.current.innerText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch { /* fallback */ }
    }
  };

  return (
    <div style={{
      background: `linear-gradient(135deg, ${color}15 0%, ${color}08 100%)`,
      border: `1px solid ${color}50`, borderLeft: `4px solid ${color}`,
      borderRadius: 'var(--radius-lg)', padding: 'var(--space-4) var(--space-5)', marginTop: 'var(--space-4)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span>{icons[variant] || icons.definition}</span>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: '600', color, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: FONT_BODY }}>{title}</span>
        </div>
        <button data-press onClick={handleCopy} style={{
          background: copied ? 'var(--success)' : 'var(--canvas-surface)', border: `1px solid ${copied ? 'var(--success)' : 'var(--canvas-border-hover)'}`,
          borderRadius: 'var(--radius-md)', padding: '0.25rem 0.75rem', cursor: 'pointer',
          color: copied ? '#fff' : 'var(--canvas-foreground-tertiary)', fontSize: 'var(--text-xs)', fontFamily: FONT_BODY
        }}>{copied ? '\u2713 Copied!' : '\u{1F4CB} Copy'}</button>
      </div>
      <div ref={contentRef} style={{ color: 'var(--canvas-foreground-secondary)', fontSize: 'var(--text-sm)', lineHeight: '1.6', fontFamily: FONT_BODY }}>{children}</div>
    </div>
  );
};

// ============================================
// STUDIO CARD (warm mode)
// ============================================
const StudioCard = ({ children, style = {} }) => (
  <div style={{
    background: 'var(--background-raised)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)',
    boxShadow: 'var(--shadow-md)', transition: 'all var(--duration-normal) var(--ease-out)', ...style
  }}>{children}</div>
);

// ============================================
// DIFFICULTY BADGE
// ============================================
const DiffBadge = ({ level }) => {
  const cfg = { foundation: { emoji: '\u{1F7E2}', label: 'Foundation' }, intermediate: { emoji: '\u{1F7E1}', label: 'Intermediate' }, advanced: { emoji: '\u{1F534}', label: 'Advanced' } };
  const c = cfg[level] || cfg.foundation;
  return <span style={{ fontSize: 'var(--text-xs)', fontFamily: FONT_BODY, fontWeight: '600' }}>{c.emoji} {c.label}</span>;
};

// ============================================
// QUIZ DATA
// ============================================
const quizQuestions = [
  { q: 'What is the primary function of a delay effect?', options: ['To change the pitch of a signal', 'To repeat a signal after a set time interval', 'To compress the dynamic range', 'To filter out specific frequencies'], correct: 1, explanation: 'A delay effect records the incoming signal and plays it back after a specified time interval. The delayed signal (wet) is mixed with the original (dry) to create echoes and rhythmic repetitions.', difficulty: 'foundation' },
  { q: 'What is the difference between using a delay as a send effect versus an insert effect?', options: ['A send allows the dry signal to pass through unaffected whilst feeding a copy to the delay', 'An insert applies delay only to the left channel', 'A send removes the original signal entirely', 'There is no practical difference'], correct: 0, explanation: 'When used as a send (auxiliary), the original dry signal passes through unchanged and a copy is routed to the delay processor. This allows independent control of the wet/dry balance. An insert places the delay directly in the signal chain, processing the entire signal.', difficulty: 'foundation' },
  { q: 'At 120 BPM, what is the delay time for a quarter note?', options: ['250 ms', '375 ms', '500 ms', '750 ms'], correct: 2, explanation: 'Using the formula: 60,000 \u00F7 BPM = quarter note in ms. So 60,000 \u00F7 120 = 500 ms. This is a fundamental calculation you must know for the exam.', difficulty: 'intermediate' },
  { q: 'Which delay type uses very short delay times (1\u201340 ms) to thicken a vocal without audible echoes?', options: ['Ping-pong delay', 'Slapback delay', 'ADT (Automatic Double Tracking)', 'Dub delay'], correct: 2, explanation: 'Automatic Double Tracking (ADT) uses very short delay times (typically 15\u201340 ms) with subtle pitch and timing variation to simulate a double-tracked vocal. It was pioneered at Abbey Road Studios. Slapback uses slightly longer times (40\u2013120 ms).', difficulty: 'intermediate' },
  { q: 'What parameter controls how many times a delayed signal repeats?', options: ['Delay time', 'Wet/dry mix', 'Feedback', 'Pan'], correct: 2, explanation: 'Feedback routes a portion of the delayed output back into the delay input. Higher feedback values create more repeats. At 100%, the delay repeats indefinitely (infinite feedback). At 0%, you hear only a single repeat.', difficulty: 'foundation' },
  { q: 'At 140 BPM, what delay time gives a dotted eighth note?', options: ['214 ms', '321 ms', '428 ms', '536 ms'], correct: 1, explanation: 'First calculate the quarter note: 60,000 \u00F7 140 = 428.6 ms. An eighth note is half: 214.3 ms. A dotted eighth note is 1.5 \u00D7 the eighth note: 214.3 \u00D7 1.5 = 321.4 ms \u2248 321 ms.', difficulty: 'intermediate' },
  { q: 'What distinguishes a flanger from a chorus effect?', options: ['A flanger uses longer delay times than a chorus', 'A chorus uses feedback; a flanger does not', 'A flanger uses shorter delay times (1\u20135 ms) with feedback, creating comb filtering; a chorus uses longer times (20\u201350 ms) without feedback', 'They are identical effects with different names'], correct: 2, explanation: 'Both are modulated delays, but flanging uses very short delay times (1\u20135 ms) with feedback, creating a distinctive comb-filtering sweep. Chorus uses longer times (20\u201350 ms) with no feedback, creating a thicker, detuned sound. The feedback in flanging is what produces the characteristic metallic, jet-like sweep.', difficulty: 'advanced' },
  { q: 'What is comb filtering in the context of delay effects?', options: ['A type of EQ applied to delayed signals', 'An interference pattern created when a very short delayed signal is mixed with the original, causing peaks and nulls at regular frequency intervals', 'A method of removing bass frequencies from echoes', 'The filtering effect of a ping-pong delay'], correct: 1, explanation: 'Comb filtering occurs when a signal is mixed with a slightly delayed copy of itself. The constructive and destructive interference creates a series of peaks and notches in the frequency spectrum that resemble the teeth of a comb. This is the fundamental principle behind flanging.', difficulty: 'advanced' },
  { q: 'What is the Haas effect?', options: ['The perception that a signal sounds louder when delayed', 'Using a short delay (1\u201340 ms) on one side of the stereo field to create a perceived spatial width, whilst the brain fuses the two signals into one perceived source', 'An effect caused by feedback exceeding 100%', 'The psychoacoustic phenomenon of hearing delay as pitch change'], correct: 1, explanation: 'The Haas effect (or precedence effect) occurs when a signal is delayed by 1\u201340 ms. The brain fuses the two signals into a single perceived source located towards the earlier signal, but the delayed copy creates a sense of stereo width and spaciousness. This is a powerful mixing technique for widening sounds.', difficulty: 'advanced' },
  { q: 'In a ping-pong delay, what happens to the delayed signal?', options: ['It repeats only once', 'It alternates between the left and right channels with each repeat', 'It gradually increases in pitch', 'It is sent to a reverb processor'], correct: 1, explanation: 'Ping-pong delay alternates each repeat between the left and right stereo channels, creating a bouncing effect across the stereo field. This creates a sense of movement and width, and is commonly used on guitars, synths, and vocal effects.', difficulty: 'intermediate' }
];

// ============================================
// LEARN CONTENT
// ============================================
const learnSections = [
  { level: 'foundation', title: 'What Is Delay?', content: 'A delay effect records an incoming audio signal and plays it back after a specified time interval. The original signal is called the "dry" signal, and the delayed repetition is the "wet" signal. The wet/dry mix controls the balance between the two. Delay is one of the most fundamental time-based effects in music production, used to create echoes, rhythmic patterns, and spatial depth.' },
  { level: 'foundation', title: 'Sends vs Inserts', content: 'Delay can be applied as a send (auxiliary) effect or an insert effect. As a send, the dry signal passes through unchanged whilst a copy is routed to the delay processor on a separate bus \u2014 this is the most common method, as it preserves the original signal and allows multiple tracks to share one delay. As an insert, the delay is placed directly in the channel\'s signal chain. Sends give better control over the wet/dry balance and are more CPU-efficient when multiple tracks need delay.' },
  { level: 'intermediate', title: 'Delay Types', content: 'Single tap delay produces one repeat at a set time. Multi-tap delay creates multiple repeats at different time intervals, each with independent level and pan. Slapback delay uses short times (40\u2013120 ms) with no feedback for a rockabilly/vocal thickening effect. Timed (sync) delay locks the delay time to the song tempo using note values. Ping-pong delay alternates repeats between left and right channels. Each type serves different musical purposes.' },
  { level: 'intermediate', title: 'Delay Parameters', content: 'Delay time (1\u20132000+ ms) sets the interval between repeats \u2014 often synced to tempo in note values (1/4, 1/8, dotted, triplet). Feedback (0\u2013100%) controls how many times the signal repeats by routing output back to input. Pan positions the delay in the stereo field. EQ on the delay allows filtering of repeats (e.g., rolling off high frequencies for a darker, more natural decay). The wet/dry mix balances the delayed signal against the original.' },
  { level: 'intermediate', title: 'Automatic Double Tracking (ADT)', content: 'ADT was developed at Abbey Road Studios in the 1960s to save artists from having to manually double-track vocal performances. It uses a very short delay (15\u201340 ms) with subtle modulation of the timing and pitch to simulate a second performance. The delay is too short to hear as a distinct echo but creates a thicker, wider vocal sound. John Lennon was famously enthusiastic about ADT and used it extensively.' },
  { level: 'intermediate', title: 'Calculating Delay from Tempo', content: 'The fundamental formula is: 60,000 \u00F7 BPM = quarter note delay in ms. From this you can derive all note values: half note = quarter \u00D7 2, eighth note = quarter \u00F7 2, sixteenth = quarter \u00F7 4. For dotted values, multiply the note value by 1.5. For triplets, multiply by 2/3. Example: at 120 BPM, quarter = 500 ms, dotted eighth = 375 ms, eighth triplet = 166.7 ms.' },
  { level: 'advanced', title: 'Modulated Delays: Flanger, Chorus, Phaser', content: 'Flanging uses very short delay times (1\u20135 ms) modulated by an LFO, with feedback creating comb filtering \u2014 the result is a metallic, sweeping, jet-like sound. Chorus uses longer modulated delays (20\u201350 ms) without feedback to create a thicker, shimmering, detuned effect. A phaser is technically different \u2014 it uses all-pass filters rather than a delay line, creating notches that sweep through the spectrum. However, the perceptual result is similar to flanging.' },
  { level: 'advanced', title: 'LFO Parameters for Modulated Delays', content: 'The Low Frequency Oscillator (LFO) controls the modulation of the delay time. Rate (0.1\u201310 Hz) sets how quickly the delay time sweeps. Depth controls how far the delay time deviates from its centre point. Feedback routes the output back to the input, intensifying the comb-filtering effect in flangers. The LFO waveform shape (sine, triangle) affects the character of the modulation sweep.' },
  { level: 'advanced', title: 'Comb Filtering and Flanging', content: 'When a signal is mixed with a very short delayed copy, constructive and destructive interference creates a series of peaks and nulls at regular frequency intervals \u2014 this pattern resembles a comb, hence "comb filtering". In a flanger, the LFO continuously varies the delay time, causing the comb filter\'s peaks and nulls to sweep up and down through the frequency spectrum. This creates the characteristic whooshing, jet-engine sound. The feedback parameter intensifies the peaks and nulls.' },
  { level: 'advanced', title: 'Haas Effect and Stereo Widening', content: 'The Haas effect (precedence effect) occurs with delays of 1\u201340 ms. The brain perceives the two signals as a single source located towards the earlier arrival, but the short delay creates a sense of width and spaciousness. Engineers use this technique by duplicating a signal, delaying one side by 10\u201330 ms, and panning the two copies left and right. Caution: this can cause phase cancellation when summed to mono, so always check mono compatibility.' }
];

// ============================================
// CHALLENGE DATA
// ============================================
const challengePool = [
  { bpm: 120, noteValue: 'quarter note', answer: 500, working: '60,000 \u00F7 120 = 500 ms' },
  { bpm: 140, noteValue: 'dotted eighth note', answer: 321, working: '60,000 \u00F7 140 = 428.6 ms (quarter). Eighth = 214.3 ms. Dotted eighth = 214.3 \u00D7 1.5 = 321.4 ms \u2248 321 ms' },
  { bpm: 100, noteValue: 'eighth note', answer: 300, working: '60,000 \u00F7 100 = 600 ms (quarter). Eighth = 600 \u00F7 2 = 300 ms' },
  { bpm: 130, noteValue: 'half note', answer: 923, working: '60,000 \u00F7 130 = 461.5 ms (quarter). Half = 461.5 \u00D7 2 = 923 ms' },
  { bpm: 90, noteValue: 'dotted quarter note', answer: 1000, working: '60,000 \u00F7 90 = 666.7 ms (quarter). Dotted quarter = 666.7 \u00D7 1.5 = 1000 ms' },
  { bpm: 150, noteValue: 'eighth triplet', answer: 133, working: '60,000 \u00F7 150 = 400 ms (quarter). Eighth = 200 ms. Triplet eighth = 200 \u00D7 2/3 = 133.3 ms \u2248 133 ms' },
  { bpm: 110, noteValue: 'sixteenth note', answer: 136, working: '60,000 \u00F7 110 = 545.5 ms (quarter). Sixteenth = 545.5 \u00F7 4 = 136.4 ms \u2248 136 ms' },
  { bpm: 160, noteValue: 'quarter note', answer: 375, working: '60,000 \u00F7 160 = 375 ms' }
];

// ============================================
// MAIN COMPONENT
// ============================================
const DelayEffects = () => {
  const [activeTab, setActiveTab] = useState('learn');
  const tabs = [
    { id: 'learn', label: 'Learn' },
    { id: 'interactive', label: 'Interactive' },
    { id: 'quiz', label: 'Quiz' },
    { id: 'reference', label: 'Reference' }
  ];

  // Learn state
  const [learnFilter, setLearnFilter] = useState('all');
  const [expandedSections, setExpandedSections] = useState({});

  // Interactive state
  const [delayTime, setDelayTime] = useState(500);
  const [feedback, setFeedback] = useState(50);
  const [wetDry, setWetDry] = useState(50);
  const [delayType, setDelayType] = useState('single');
  const [bpmInput, setBpmInput] = useState(120);
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const timeRef = useRef(0);

  // Challenge state
  const [challengeActive, setChallengeActive] = useState(false);
  const [challengeData, setChallengeData] = useState(null);
  const [userGuess, setUserGuess] = useState('');
  const [challengeSubmitted, setChallengeSubmitted] = useState(false);
  const [challengeScore, setChallengeScore] = useState({ correct: 0, total: 0 });

  // Quiz state
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);

  const toggleSection = (idx) => setExpandedSections(prev => ({ ...prev, [idx]: !prev[idx] }));

  // CSS injection for design tokens and press feedback
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = DESIGN_TOKENS_CSS + '\n[data-press]:active { transform: scale(0.97) !important; transition: transform 100ms cubic-bezier(0.34, 1.56, 0.64, 1) !important; }';
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  // ============================================
  // BPM CALCULATOR
  // ============================================
  const calcDelayTable = (bpm) => {
    const q = 60000 / bpm;
    return [
      { label: 'Whole note', ms: (q * 4).toFixed(1) },
      { label: 'Half note', ms: (q * 2).toFixed(1) },
      { label: 'Dotted quarter', ms: (q * 1.5).toFixed(1) },
      { label: 'Quarter note', ms: q.toFixed(1) },
      { label: 'Dotted eighth', ms: (q * 0.75).toFixed(1) },
      { label: 'Eighth note', ms: (q * 0.5).toFixed(1) },
      { label: 'Eighth triplet', ms: ((q * 0.5) * (2 / 3)).toFixed(1) },
      { label: 'Sixteenth note', ms: (q * 0.25).toFixed(1) }
    ];
  };

  // ============================================
  // DELAY LINE CANVAS VISUALISATION
  // ============================================
  const drawDelayVisualisation = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = 700, h = 300;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = '#060A14';
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = 'rgba(74, 127, 212, 0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const x = (i / 10) * w;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let i = 0; i <= 6; i++) {
      const y = (i / 6) * h;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Time labels
    ctx.fillStyle = 'rgba(232, 228, 223, 0.4)';
    ctx.font = "10px 'Inter', system-ui, sans-serif";
    ctx.textAlign = 'center';
    const totalDuration = 3000; // 3 seconds visible
    for (let ms = 0; ms <= totalDuration; ms += 500) {
      const x = (ms / totalDuration) * w;
      ctx.fillText(`${ms} ms`, x, h - 6);
    }

    // Centre line
    const centreY = h / 2;
    ctx.strokeStyle = 'rgba(74, 127, 212, 0.1)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(0, centreY); ctx.lineTo(w, centreY); ctx.stroke();
    ctx.setLineDash([]);

    // Labels
    ctx.fillStyle = 'rgba(232, 228, 223, 0.3)';
    ctx.font = "9px 'Inter', system-ui, sans-serif";
    ctx.textAlign = 'left';
    ctx.fillText('L', 4, 20);
    ctx.fillText('R', 4, h - 10);
    ctx.fillText('C', 4, centreY - 4);

    // Draw the original signal pulse
    const drawPulse = (x, amplitude, colour, panY) => {
      const pulseWidth = 20;
      ctx.fillStyle = colour;
      ctx.globalAlpha = Math.max(0.15, amplitude);
      ctx.beginPath();
      ctx.ellipse(x, panY, pulseWidth * amplitude, 8 * amplitude, 0, 0, Math.PI * 2);
      ctx.fill();
      // Glow
      ctx.shadowColor = colour;
      ctx.shadowBlur = 12 * amplitude;
      ctx.beginPath();
      ctx.arc(x, panY, 4 * amplitude, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    };

    // Original pulse at t=0
    const origX = (0 / totalDuration) * w + 30;
    drawPulse(origX, 1, '#FF6B35', centreY);
    ctx.fillStyle = '#FF6B35';
    ctx.font = "bold 10px 'Inter', system-ui, sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText('DRY', origX, centreY - 20);

    // Calculate repeats based on delay type
    const maxRepeats = 8;
    const feedbackRatio = feedback / 100;
    const wetLevel = wetDry / 100;

    for (let i = 1; i <= maxRepeats; i++) {
      let amplitude = wetLevel * Math.pow(feedbackRatio, i - 1);
      if (amplitude < 0.05) break;

      let timeMs, panY;

      if (delayType === 'single') {
        timeMs = delayTime * i;
        panY = centreY;
      } else if (delayType === 'multitap') {
        // Multi-tap: repeats at different intervals (factor of 0.6, 1.0, 1.4 of base time)
        const tapFactors = [0.6, 1.0, 1.4];
        const tapIndex = (i - 1) % tapFactors.length;
        const tapRound = Math.floor((i - 1) / tapFactors.length);
        timeMs = delayTime * tapFactors[tapIndex] * (tapRound + 1);
        const panOffsets = [-0.3, 0, 0.3];
        panY = centreY + panOffsets[tapIndex] * (centreY * 0.6);
        amplitude *= 0.9;
      } else if (delayType === 'pingpong') {
        timeMs = delayTime * i;
        panY = i % 2 === 1 ? centreY * 0.35 : centreY * 1.65;
      } else if (delayType === 'slapback') {
        if (i > 1) break; // Slapback = single repeat, short time
        timeMs = Math.min(delayTime, 120);
        panY = centreY;
        amplitude = wetLevel * 0.8;
      }

      if (timeMs > totalDuration) break;

      const x = (timeMs / totalDuration) * w + 30;
      const colour = delayType === 'pingpong'
        ? (i % 2 === 1 ? '#4A9EFF' : '#FF4A8E')
        : '#4A9EFF';

      drawPulse(x, amplitude, colour, panY);

      // Time label
      ctx.fillStyle = 'rgba(232, 228, 223, 0.4)';
      ctx.font = "9px 'Inter', system-ui, sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(timeMs)} ms`, x, panY + 20 + (i % 2) * 10);
    }

    // Connector lines between pulses
    ctx.strokeStyle = 'rgba(74, 159, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 5]);
    ctx.beginPath();
    ctx.moveTo(origX, centreY);
    for (let i = 1; i <= maxRepeats; i++) {
      let timeMs, panY;
      const amplitude = wetLevel * Math.pow(feedbackRatio, i - 1);
      if (amplitude < 0.05) break;

      if (delayType === 'single') { timeMs = delayTime * i; panY = centreY; }
      else if (delayType === 'pingpong') { timeMs = delayTime * i; panY = i % 2 === 1 ? centreY * 0.35 : centreY * 1.65; }
      else if (delayType === 'slapback') { if (i > 1) break; timeMs = Math.min(delayTime, 120); panY = centreY; }
      else { const tf = [0.6, 1.0, 1.4]; const ti = (i - 1) % 3; const tr = Math.floor((i - 1) / 3); timeMs = delayTime * tf[ti] * (tr + 1); const po = [-0.3, 0, 0.3]; panY = centreY + po[ti] * (centreY * 0.6); }

      if (timeMs > totalDuration) break;
      const x = (timeMs / totalDuration) * w + 30;
      ctx.lineTo(x, panY);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Type label
    ctx.fillStyle = 'rgba(232, 228, 223, 0.6)';
    ctx.font = "bold 11px 'Inter', system-ui, sans-serif";
    ctx.textAlign = 'right';
    const typeLabels = { single: 'Single Tap', multitap: 'Multi-Tap', pingpong: 'Ping-Pong', slapback: 'Slapback' };
    ctx.fillText(typeLabels[delayType], w - 10, 18);
  }, [delayTime, feedback, wetDry, delayType]);

  useEffect(() => {
    if (activeTab === 'interactive') drawDelayVisualisation();
  }, [drawDelayVisualisation, activeTab]);

  // ============================================
  // CHALLENGE MODE
  // ============================================
  const generateChallenge = () => {
    const c = challengePool[Math.floor(Math.random() * challengePool.length)];
    setChallengeData(c);
    setChallengeActive(true);
    setChallengeSubmitted(false);
    setUserGuess('');
  };

  const submitChallenge = () => {
    if (!userGuess || !challengeData) return;
    const guess = parseFloat(userGuess);
    const tolerance = challengeData.answer * 0.05; // 5% tolerance
    const correct = Math.abs(guess - challengeData.answer) <= Math.max(tolerance, 5);
    setChallengeSubmitted(true);
    setChallengeScore(prev => ({ correct: prev.correct + (correct ? 1 : 0), total: prev.total + 1 }));
  };

  const resetInteractive = () => {
    setDelayTime(500); setFeedback(50); setWetDry(50); setDelayType('single'); setBpmInput(120);
    setChallengeActive(false); setChallengeData(null); setChallengeSubmitted(false);
    setUserGuess(''); setChallengeScore({ correct: 0, total: 0 });
  };

  // Quiz handlers
  const handleAnswer = (idx) => {
    if (showFeedback) return;
    setSelectedAnswer(idx);
    setShowFeedback(true);
    if (idx === quizQuestions[quizIndex].correct) setScore(s => s + 1);
  };

  const nextQuestion = () => {
    if (quizIndex < quizQuestions.length - 1) {
      setQuizIndex(qi => qi + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else {
      setQuizComplete(true);
    }
  };

  const resetQuiz = () => {
    setQuizIndex(0); setSelectedAnswer(null); setShowFeedback(false);
    setScore(0); setQuizComplete(false);
  };

  // ============================================
  // RENDER
  // ============================================
  const isCanvasTab = activeTab === 'interactive';

  return (
    <div className="delay-effects-root" style={{
      fontFamily: FONT_BODY,
      background: isCanvasTab ? 'var(--canvas-background)' : 'var(--background)',
      color: isCanvasTab ? 'var(--canvas-foreground)' : 'var(--foreground)',
      minHeight: '100vh',
      transition: 'background var(--duration-normal) var(--ease-out), color var(--duration-normal) var(--ease-out)'
    }} data-mode={isCanvasTab ? 'canvas' : undefined}>

      {/* Header */}
      <div style={{ padding: 'var(--space-8) var(--space-6) var(--space-4)', textAlign: 'center' }}>
        <div style={{ fontSize: 'var(--text-xs)', fontWeight: '300', textTransform: 'uppercase', letterSpacing: '0.2em', color: isCanvasTab ? 'var(--canvas-highlight)' : 'var(--accent)', marginBottom: 'var(--space-2)' }}>
          Topic 1.12 &middot; Component 4
        </div>
        <h1 style={{ fontFamily: FONT_HEADING, fontWeight: 900, fontSize: 'var(--text-4xl)', margin: 0, color: isCanvasTab ? 'var(--canvas-foreground)' : 'var(--foreground)' }}>
          Delay Effects
        </h1>
      </div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${isCanvasTab ? 'var(--canvas-border)' : 'var(--border)'}`, margin: '0 var(--space-6)' }}>
        {tabs.map(tab => (
          <button data-press key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            flex: 1, padding: 'var(--space-3)', fontSize: 'var(--text-xs)', fontWeight: '600',
            fontFamily: FONT_BODY, textTransform: 'uppercase', letterSpacing: '0.05em',
            color: activeTab === tab.id ? 'var(--accent)' : (isCanvasTab ? 'var(--canvas-foreground-tertiary)' : 'var(--foreground-tertiary)'),
            background: activeTab === tab.id ? 'var(--accent-soft)' : 'transparent',
            borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
            border: 'none', cursor: 'pointer', transition: 'all var(--duration-fast) var(--ease-out)',
            ':active': { transform: 'scale(0.97)' }
          }}>{tab.label}</button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ padding: 'var(--space-6)', maxWidth: '900px', margin: '0 auto' }}>

        {/* ============ LEARN TAB ============ */}
        {activeTab === 'learn' && (
          <div>
            {/* Filter buttons */}
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)', flexWrap: 'wrap' }}>
              {[{ id: 'all', label: 'All Topics' }, { id: 'foundation', label: '\u{1F7E2} Foundation' }, { id: 'intermediate', label: '\u{1F7E1} Intermediate' }, { id: 'advanced', label: '\u{1F534} Advanced' }].map(f => (
                <button data-press key={f.id} onClick={() => setLearnFilter(f.id)} style={{
                  padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)',
                  border: `1px solid ${learnFilter === f.id ? 'var(--accent)' : 'var(--border)'}`,
                  background: learnFilter === f.id ? 'var(--accent-soft)' : 'var(--background-raised)',
                  color: learnFilter === f.id ? 'var(--accent)' : 'var(--foreground-secondary)',
                  cursor: 'pointer', fontSize: 'var(--text-sm)', fontFamily: FONT_BODY, fontWeight: '500'
                }}>{f.label}</button>
              ))}
            </div>

            {/* Content sections */}
            {learnSections.filter(s => learnFilter === 'all' || s.level === learnFilter).map((section, idx) => (
              <StudioCard key={idx} style={{ marginBottom: 'var(--space-4)' }}>
                <button data-press onClick={() => toggleSection(idx)} style={{
                  width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left'
                }}>
                  <div>
                    <DiffBadge level={section.level} />
                    <h3 style={{ fontFamily: FONT_HEADING, fontWeight: 700, fontSize: 'var(--text-xl)', margin: 'var(--space-2) 0 0', color: 'var(--foreground)' }}>{section.title}</h3>
                  </div>
                  <span style={{ fontSize: 'var(--text-xl)', color: 'var(--foreground-tertiary)', transform: expandedSections[idx] ? 'rotate(180deg)' : 'none', transition: 'transform var(--duration-fast) var(--ease-out)' }}>{'\u25BC'}</span>
                </button>
                {expandedSections[idx] && (
                  <div style={{ marginTop: 'var(--space-4)', color: 'var(--foreground-secondary)', fontSize: 'var(--text-base)', lineHeight: '1.7' }}>
                    <p style={{ margin: 0 }}>{section.content}</p>
                    <CopyableNote title="Key Point" color="#4A7FD4" variant="key">
                      <strong>{section.title}</strong>: {section.content.split('.')[0]}.
                    </CopyableNote>
                  </div>
                )}
              </StudioCard>
            ))}

            {/* Music Examples */}
            <StudioCard style={{ marginTop: 'var(--space-6)' }}>
              <h3 style={{ fontFamily: FONT_HEADING, fontWeight: 700, fontSize: 'var(--text-xl)', margin: '0 0 var(--space-4)', color: 'var(--foreground)' }}>
                {'\u{1F3B5}'} Real-World Examples
              </h3>
              {[
                { artist: 'U2 / The Edge', track: 'Where the Streets Have No Name', note: 'The Edge\'s signature sound relies on rhythmic dotted eighth note delay synced to the tempo. The delay creates the illusion of more notes being played than are actually picked, forming intricate rhythmic patterns from simple parts.' },
                { artist: 'John Lennon', track: 'Imagine', note: 'ADT (automatic double tracking) and slapback delay on the lead vocal create warmth and thickness without obvious echo. This was a signature Abbey Road technique that Lennon championed throughout his career.' },
                { artist: 'The Police', track: 'Walking on the Moon', note: 'Andy Summers\' guitar uses a long, spacious dub-style delay with high feedback. The reggae-influenced rhythmic delay creates a vast sense of space, with repeats decaying naturally over several beats.' },
                { artist: 'Tame Impala', track: 'Let It Happen', note: 'Kevin Parker layers modulated delay and phaser effects to create swirling, psychedelic textures. The modulated delays create a constantly shifting, immersive sonic landscape that blurs the line between delay and modulation.' }
              ].map((ex, i) => (
                <div key={i} style={{ padding: 'var(--space-3) 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
                  <strong style={{ color: 'var(--accent)' }}>{ex.artist}</strong> &mdash; &ldquo;{ex.track}&rdquo;
                  <p style={{ margin: 'var(--space-1) 0 0', color: 'var(--foreground-secondary)', fontSize: 'var(--text-sm)', lineHeight: '1.5' }}>{ex.note}</p>
                </div>
              ))}
            </StudioCard>

            <HearItAccordion
              title={audioExamples['delay'].title}
              tracks={audioExamples['delay'].tracks}
            />
          </div>
        )}

        {/* ============ INTERACTIVE TAB ============ */}
        {activeTab === 'interactive' && (
          <div data-mode="canvas">
            {/* Delay Type Toggle */}
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)', justifyContent: 'center', flexWrap: 'wrap' }}>
              {[
                { id: 'single', label: 'Single Tap' },
                { id: 'multitap', label: 'Multi-Tap' },
                { id: 'pingpong', label: 'Ping-Pong' },
                { id: 'slapback', label: 'Slapback' }
              ].map(m => (
                <button data-press key={m.id} onClick={() => setDelayType(m.id)} style={{
                  padding: 'var(--space-2) var(--space-5)', borderRadius: 'var(--radius-md)',
                  border: `1px solid ${delayType === m.id ? 'var(--accent)' : 'var(--canvas-border-hover)'}`,
                  background: delayType === m.id ? 'var(--accent-soft)' : 'var(--canvas-surface)',
                  color: delayType === m.id ? 'var(--accent)' : 'var(--canvas-foreground-tertiary)',
                  cursor: 'pointer', fontFamily: FONT_BODY, fontSize: 'var(--text-sm)', fontWeight: '500'
                }}>{m.label}</button>
              ))}
            </div>

            {/* Canvas Visualisation */}
            <div style={{
              background: 'var(--canvas-surface)', border: '1px solid var(--canvas-border)',
              borderRadius: 'var(--radius-xl)', padding: 'var(--space-4)', marginBottom: 'var(--space-6)',
              transition: 'all var(--duration-normal) var(--ease-out)', overflowX: 'auto'
            }}>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: '300', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--canvas-highlight)', marginBottom: 'var(--space-2)', textAlign: 'center' }}>
                Delay Line Visualisation
              </div>
              <canvas ref={canvasRef} style={{ display: 'block', borderRadius: 'var(--radius-lg)', margin: '0 auto' }} />
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
              {[
                { label: 'Delay Time', value: delayTime, set: setDelayTime, min: 1, max: 2000, step: 1, unit: 'ms' },
                { label: 'Feedback', value: feedback, set: setFeedback, min: 0, max: 100, step: 1, unit: '%' },
                { label: 'Wet/Dry Mix', value: wetDry, set: setWetDry, min: 0, max: 100, step: 1, unit: '%' }
              ].map(ctrl => (
                <div key={ctrl.label} style={{ flex: '1 1 200px', background: 'var(--canvas-surface)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-3) var(--space-4)', border: '1px solid var(--canvas-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-1)' }}>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--canvas-foreground-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{ctrl.label}</span>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: '500', color: 'var(--accent)', fontFamily: "'Geist Mono', monospace" }}>{ctrl.value}{ctrl.unit}</span>
                  </div>
                  <input type="range" min={ctrl.min} max={ctrl.max} step={ctrl.step} value={ctrl.value}
                    onChange={e => ctrl.set(parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: '#FF6B35' }} />
                </div>
              ))}
            </div>

            {/* BPM Calculator */}
            <div style={{ marginTop: 'var(--space-6)', background: 'var(--canvas-surface)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)', border: '1px solid var(--canvas-border)' }}>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: '300', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--canvas-highlight)', marginBottom: 'var(--space-2)' }}>
                BPM to Delay Time Calculator
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
                <label style={{ fontSize: 'var(--text-sm)', color: 'var(--canvas-foreground-secondary)' }}>BPM:</label>
                <input type="number" min="20" max="300" value={bpmInput} onChange={e => setBpmInput(Math.max(20, Math.min(300, parseInt(e.target.value) || 120)))}
                  style={{
                    padding: 'var(--space-2) var(--space-3)', background: 'var(--canvas-surface)',
                    border: '1px solid var(--canvas-border-hover)', borderRadius: 'var(--radius-md)',
                    color: 'var(--canvas-foreground)', fontFamily: "'Geist Mono', monospace",
                    fontSize: 'var(--text-base)', width: '100px', textAlign: 'center'
                  }} />
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--canvas-foreground-tertiary)' }}>Formula: 60,000 &divide; BPM = quarter note (ms)</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)', fontFamily: FONT_BODY }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--canvas-border-hover)' }}>
                      {['Note Value', 'Delay Time (ms)'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: 'var(--space-2) var(--space-3)', color: 'var(--canvas-foreground)', fontWeight: '600', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {calcDelayTable(bpmInput).map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--canvas-border)' }}>
                        <td style={{ padding: 'var(--space-2) var(--space-3)', color: 'var(--canvas-foreground-secondary)' }}>{row.label}</td>
                        <td style={{ padding: 'var(--space-2) var(--space-3)', color: 'var(--accent)', fontFamily: "'Geist Mono', monospace", fontWeight: '500' }}>{row.ms} ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Challenge Section */}
            <div style={{ marginTop: 'var(--space-6)', background: 'var(--canvas-surface)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)', border: '1px solid var(--canvas-border)' }}>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: '300', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--canvas-highlight)', marginBottom: 'var(--space-2)' }}>Challenge Mode</div>
              <h3 style={{ fontFamily: FONT_HEADING, fontWeight: 700, fontSize: 'var(--text-xl)', margin: '0 0 var(--space-4)', color: 'var(--canvas-foreground)' }}>Calculate the Delay Time</h3>

              {!challengeActive ? (
                <button data-press onClick={generateChallenge} style={{
                  padding: 'var(--space-3) var(--space-6)', background: 'var(--accent)',
                  border: 'none', borderRadius: 'var(--radius-md)', color: '#fff',
                  cursor: 'pointer', fontFamily: FONT_BODY, fontSize: 'var(--text-sm)', fontWeight: '600'
                }}>Generate Challenge</button>
              ) : (
                <div>
                  <p style={{ color: 'var(--canvas-foreground-secondary)', fontSize: 'var(--text-base)', lineHeight: '1.6', marginBottom: 'var(--space-4)' }}>
                    At <strong style={{ color: 'var(--accent)' }}>{challengeData?.bpm} BPM</strong>, what is the delay time for a <strong style={{ color: 'var(--accent)' }}>{challengeData?.noteValue}</strong>?
                  </p>
                  <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input type="number" step="1" value={userGuess} onChange={e => setUserGuess(e.target.value)}
                      placeholder="Your answer (ms)" disabled={challengeSubmitted}
                      style={{
                        padding: 'var(--space-2) var(--space-3)', background: 'var(--canvas-surface)',
                        border: '1px solid var(--canvas-border-hover)', borderRadius: 'var(--radius-md)',
                        color: 'var(--canvas-foreground)', fontFamily: "'Geist Mono', monospace",
                        fontSize: 'var(--text-sm)', width: '180px'
                      }} />
                    {!challengeSubmitted ? (
                      <button data-press onClick={submitChallenge} disabled={!userGuess} style={{
                        padding: 'var(--space-2) var(--space-5)', background: userGuess ? 'var(--accent)' : 'var(--canvas-surface)',
                        border: 'none', borderRadius: 'var(--radius-md)', color: '#fff',
                        cursor: userGuess ? 'pointer' : 'default', fontFamily: FONT_BODY, fontSize: 'var(--text-sm)', fontWeight: '600',
                        opacity: userGuess ? 1 : 0.5
                      }}>Submit</button>
                    ) : (
                      <button data-press onClick={generateChallenge} style={{
                        padding: 'var(--space-2) var(--space-5)', background: 'var(--canvas-surface)',
                        border: '1px solid var(--canvas-border-hover)', borderRadius: 'var(--radius-md)',
                        color: 'var(--canvas-foreground-tertiary)', cursor: 'pointer', fontFamily: FONT_BODY, fontSize: 'var(--text-sm)'
                      }}>Next Challenge</button>
                    )}
                  </div>
                  {challengeSubmitted && (() => {
                    const guess = parseFloat(userGuess);
                    const tolerance = challengeData.answer * 0.05;
                    const correct = Math.abs(guess - challengeData.answer) <= Math.max(tolerance, 5);
                    return (
                      <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', background: correct ? 'rgba(5, 150, 105, 0.15)' : 'rgba(220, 38, 38, 0.15)', border: `1px solid ${correct ? 'var(--success)' : 'var(--error)'}` }}>
                        <strong style={{ color: correct ? 'var(--success)' : 'var(--error)' }}>
                          {correct ? 'Correct!' : `Not quite. The answer is ${challengeData.answer} ms.`}
                        </strong>
                        <p style={{ color: 'var(--canvas-foreground-secondary)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-2)', lineHeight: '1.5' }}>
                          Working: {challengeData.working}
                        </p>
                      </div>
                    );
                  })()}
                  {challengeScore.total > 0 && (
                    <div style={{ marginTop: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--canvas-foreground-tertiary)' }}>
                      Score: {challengeScore.correct}/{challengeScore.total}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Reset */}
            <button data-press onClick={resetInteractive} style={{
              marginTop: 'var(--space-4)', padding: 'var(--space-2) var(--space-4)',
              background: 'var(--canvas-surface)', border: '1px solid var(--canvas-border-hover)',
              borderRadius: 'var(--radius-md)', color: 'var(--canvas-foreground-tertiary)',
              cursor: 'pointer', fontSize: 'var(--text-sm)', fontFamily: FONT_BODY, width: '100%'
            }}>Reset to Defaults</button>
          </div>
        )}

        {/* ============ QUIZ TAB ============ */}
        {activeTab === 'quiz' && (
          <div>
            {!quizComplete ? (
              <div>
                {/* Progress bar */}
                <div style={{ marginBottom: 'var(--space-6)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--foreground-secondary)' }}>Question {quizIndex + 1} of {quizQuestions.length}</span>
                    <DiffBadge level={quizQuestions[quizIndex].difficulty} />
                  </div>
                  <div style={{ height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${((quizIndex + 1) / quizQuestions.length) * 100}%`, background: 'var(--accent)', borderRadius: '3px', transition: 'width var(--duration-normal) var(--ease-out)' }} />
                  </div>
                </div>

                <StudioCard>
                  <h3 style={{ fontFamily: FONT_HEADING, fontWeight: 700, fontSize: 'var(--text-xl)', margin: '0 0 var(--space-5)', color: 'var(--foreground)' }}>{quizQuestions[quizIndex].q}</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    {quizQuestions[quizIndex].options.map((opt, i) => {
                      const isSelected = selectedAnswer === i;
                      const isCorrect = i === quizQuestions[quizIndex].correct;
                      let bg = 'var(--background-raised)';
                      let borderColor = 'var(--border)';
                      if (showFeedback && isSelected && isCorrect) { bg = 'var(--success-soft)'; borderColor = 'var(--success)'; }
                      else if (showFeedback && isSelected && !isCorrect) { bg = 'var(--error-soft)'; borderColor = 'var(--error)'; }
                      else if (showFeedback && isCorrect) { bg = 'var(--success-soft)'; borderColor = 'var(--success)'; }

                      return (
                        <button data-press key={i} onClick={() => handleAnswer(i)} style={{
                          padding: 'var(--space-3) var(--space-4)', background: bg,
                          border: `2px solid ${borderColor}`, borderRadius: 'var(--radius-md)',
                          cursor: showFeedback ? 'default' : 'pointer', textAlign: 'left',
                          fontSize: 'var(--text-base)', fontFamily: FONT_BODY, color: 'var(--foreground)',
                          transition: 'all var(--duration-fast) var(--ease-out)'
                        }}>{opt}</button>
                      );
                    })}
                  </div>

                  {showFeedback && (
                    <div style={{ marginTop: 'var(--space-5)' }}>
                      <div style={{
                        padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)',
                        background: selectedAnswer === quizQuestions[quizIndex].correct ? 'var(--success-soft)' : 'var(--error-soft)',
                        border: `1px solid ${selectedAnswer === quizQuestions[quizIndex].correct ? 'var(--success)' : 'var(--error)'}`
                      }}>
                        <strong style={{ color: selectedAnswer === quizQuestions[quizIndex].correct ? 'var(--success)' : 'var(--error)' }}>
                          {selectedAnswer === quizQuestions[quizIndex].correct ? '\u2713 Correct!' : '\u2717 Incorrect'}
                        </strong>
                        <p style={{ margin: 'var(--space-2) 0 0', fontSize: 'var(--text-sm)', color: 'var(--foreground-secondary)', lineHeight: '1.6' }}>
                          {quizQuestions[quizIndex].explanation}
                        </p>
                      </div>
                      <button data-press onClick={nextQuestion} style={{
                        marginTop: 'var(--space-4)', padding: 'var(--space-2) var(--space-5)',
                        background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-md)',
                        color: '#fff', cursor: 'pointer', fontFamily: FONT_BODY, fontSize: 'var(--text-sm)', fontWeight: '600'
                      }}>{quizIndex < quizQuestions.length - 1 ? 'Next Question' : 'See Results'}</button>
                    </div>
                  )}
                </StudioCard>
              </div>
            ) : (
              <StudioCard style={{ textAlign: 'center' }}>
                <h2 style={{ fontFamily: FONT_HEADING, fontWeight: 900, fontSize: 'var(--text-3xl)', color: 'var(--foreground)', margin: '0 0 var(--space-4)' }}>Quiz Complete</h2>
                <div style={{ fontSize: 'var(--text-4xl)', fontWeight: '700', color: score >= 7 ? 'var(--success)' : score >= 5 ? 'var(--warning)' : 'var(--error)', marginBottom: 'var(--space-4)' }}>
                  {score} / {quizQuestions.length}
                </div>
                <p style={{ color: 'var(--foreground-secondary)', fontSize: 'var(--text-base)', marginBottom: 'var(--space-6)' }}>
                  {score >= 8 ? 'Excellent understanding of delay effects!' : score >= 5 ? 'Good foundation \u2014 review the areas you found challenging.' : 'Revisit the Learn tab and try again.'}
                </p>
                <button data-press onClick={resetQuiz} style={{
                  padding: 'var(--space-3) var(--space-6)', background: 'var(--accent)',
                  border: 'none', borderRadius: 'var(--radius-md)', color: '#fff',
                  cursor: 'pointer', fontFamily: FONT_BODY, fontSize: 'var(--text-sm)', fontWeight: '600'
                }}>Retry Quiz</button>
              </StudioCard>
            )}
          </div>
        )}

        {/* ============ REFERENCE TAB ============ */}
        {activeTab === 'reference' && (
          <div>
            {/* Delay Parameters Table */}
            <StudioCard style={{ marginBottom: 'var(--space-6)' }}>
              <h3 style={{ fontFamily: FONT_HEADING, fontWeight: 700, fontSize: 'var(--text-xl)', margin: '0 0 var(--space-4)', color: 'var(--foreground)' }}>Delay Parameters</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)', fontFamily: FONT_BODY }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-strong)' }}>
                      {['Parameter', 'Range', 'Unit', 'Function'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: 'var(--space-2) var(--space-3)', color: 'var(--foreground)', fontWeight: '600', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Delay Time', '1\u20132000+', 'ms (or note value)', 'Sets the interval between repeats'],
                      ['Feedback', '0\u2013100', '%', 'Controls number of repeats (output routed back to input)'],
                      ['Wet/Dry Mix', '0\u2013100', '%', 'Balance between original and delayed signal'],
                      ['Pan', 'L100\u2013R100', 'L/R', 'Positions the delayed signal in the stereo field'],
                      ['High-Cut EQ', '1\u201320', 'kHz', 'Rolls off high frequencies on repeats for natural decay'],
                      ['Low-Cut EQ', '20\u2013500', 'Hz', 'Removes low-frequency buildup in feedback loop'],
                      ['LFO Rate', '0.1\u201310', 'Hz', 'Modulation speed (for chorus/flanger effects)'],
                      ['LFO Depth', '0\u2013100', '%', 'Amount of delay time modulation']
                    ].map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                        {row.map((cell, j) => (
                          <td key={j} style={{ padding: 'var(--space-2) var(--space-3)', color: j === 0 ? 'var(--accent)' : 'var(--foreground-secondary)' }}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </StudioCard>

            {/* Key Terms */}
            <StudioCard style={{ marginBottom: 'var(--space-6)' }}>
              <h3 style={{ fontFamily: FONT_HEADING, fontWeight: 700, fontSize: 'var(--text-xl)', margin: '0 0 var(--space-4)', color: 'var(--foreground)' }}>Key Terms</h3>
              {[
                { term: 'Delay Time', def: 'The interval in milliseconds between the original signal and its repeat. Can be set freely or synced to tempo using note values.' },
                { term: 'Feedback', def: 'The proportion of the delay output routed back to its input, controlling the number and decay of repeats. At 100%, repeats continue indefinitely.' },
                { term: 'Wet/Dry Mix', def: 'The balance between the processed (wet/delayed) signal and the original (dry) signal. 100% wet = only echoes; 0% wet = no effect.' },
                { term: 'ADT (Automatic Double Tracking)', def: 'A short delay (15\u201340 ms) with subtle modulation used to simulate a double-tracked performance. Pioneered at Abbey Road Studios.' },
                { term: 'Slapback', def: 'A single short delay (40\u2013120 ms) with no feedback, creating a quick "slap" echo. Associated with 1950s rockabilly and vocal thickening.' },
                { term: 'Ping-Pong Delay', def: 'A stereo delay that alternates repeats between left and right channels, creating a bouncing spatial effect.' },
                { term: 'Comb Filtering', def: 'An interference pattern of peaks and nulls at regular frequency intervals, created when a signal is mixed with a very short delayed copy of itself.' },
                { term: 'Haas Effect', def: 'The psychoacoustic precedence effect where delays of 1\u201340 ms create perceived spatial width whilst the brain fuses the two signals into one source.' },
                { term: 'Tempo Sync', def: 'Locking the delay time to the song\'s BPM using musical note values (quarter, eighth, dotted, triplet) for rhythmically coherent repeats.' },
                { term: 'LFO (Low Frequency Oscillator)', def: 'An oscillator below the audible range used to modulate delay time in chorus, flanger, and phaser effects, creating movement and animation.' }
              ].map((item, i) => (
                <CopyableNote key={i} title={item.term} color="var(--accent)" variant="definition">
                  {item.def}
                </CopyableNote>
              ))}
            </StudioCard>

            {/* BPM Formula Reference */}
            <StudioCard style={{ marginBottom: 'var(--space-6)' }}>
              <h3 style={{ fontFamily: FONT_HEADING, fontWeight: 700, fontSize: 'var(--text-xl)', margin: '0 0 var(--space-4)', color: 'var(--foreground)' }}>Delay Time Formulae</h3>
              <CopyableNote title="Master Formula" color="#4A7FD4" variant="key">
                <div style={{ fontFamily: "'Geist Mono', monospace", fontSize: 'var(--text-base)', lineHeight: '2' }}>
                  <div><strong>Quarter note</strong> = 60,000 &divide; BPM</div>
                  <div><strong>Half note</strong> = Quarter &times; 2</div>
                  <div><strong>Eighth note</strong> = Quarter &divide; 2</div>
                  <div><strong>Sixteenth note</strong> = Quarter &divide; 4</div>
                  <div><strong>Dotted value</strong> = Note value &times; 1.5</div>
                  <div><strong>Triplet value</strong> = Note value &times; 2/3</div>
                </div>
              </CopyableNote>
              <CopyableNote title="Worked Example" color="var(--secondary)" variant="exam">
                At 140 BPM: Quarter = 60,000 &divide; 140 = 428.6 ms. Dotted eighth = (428.6 &divide; 2) &times; 1.5 = 321.4 ms. This is the delay time The Edge uses for rhythmic guitar patterns.
              </CopyableNote>
            </StudioCard>

            {/* Music Examples Reference */}
            <StudioCard style={{ marginBottom: 'var(--space-6)' }}>
              <h3 style={{ fontFamily: FONT_HEADING, fontWeight: 700, fontSize: 'var(--text-xl)', margin: '0 0 var(--space-4)', color: 'var(--foreground)' }}>Music Examples for Exam Reference</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)', fontFamily: FONT_BODY }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-strong)' }}>
                      {['Artist', 'Track', 'Delay Technique'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: 'var(--space-2) var(--space-3)', color: 'var(--foreground)', fontWeight: '600', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['U2 / The Edge', 'Where the Streets Have No Name', 'Rhythmic dotted eighth note delay on guitar'],
                      ['John Lennon', 'Imagine', 'ADT / slapback on lead vocal'],
                      ['The Police', 'Walking on the Moon', 'Reggae-style dub delay with high feedback'],
                      ['Tame Impala', 'Let It Happen', 'Modulated delay and phaser effects']
                    ].map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: 'var(--space-2) var(--space-3)', color: 'var(--accent)', fontWeight: '500' }}>{row[0]}</td>
                        <td style={{ padding: 'var(--space-2) var(--space-3)', color: 'var(--foreground-secondary)', fontStyle: 'italic' }}>{row[1]}</td>
                        <td style={{ padding: 'var(--space-2) var(--space-3)', color: 'var(--foreground-secondary)' }}>{row[2]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </StudioCard>

            {/* Exam Tips */}
            <StudioCard>
              <h3 style={{ fontFamily: FONT_HEADING, fontWeight: 700, fontSize: 'var(--text-xl)', margin: '0 0 var(--space-4)', color: 'var(--foreground)' }}>Exam Tips</h3>
              {[
                'Always show your working when calculating delay times. Write: 60,000 \u00F7 BPM = quarter note, then derive the required note value. Examiners award method marks even if the final answer is slightly off.',
                'Know the difference between chorus, flanger, and phaser. Chorus = longer modulated delay (20\u201350 ms), no feedback. Flanger = very short modulated delay (1\u20135 ms) with feedback and comb filtering. Phaser = all-pass filters, not a true delay line.',
                'When discussing delay in a mix context, explain whether it is used as a send or insert effect, and justify why. Sends are standard for delay because they preserve the dry signal and allow shared processing.',
                'For questions about stereo imaging, remember the Haas effect: short delays (1\u201340 ms) create perceived width, but always mention the risk of phase cancellation when summed to mono.',
                'Be precise with terminology. "Feedback" controls repeats, not volume. "Wet/dry mix" controls the balance. "Delay time" is measured in milliseconds or note values. Examiners reward correct use of technical language.'
              ].map((tip, i) => (
                <CopyableNote key={i} title={`Tip ${i + 1}`} color="var(--secondary)" variant="exam">
                  {tip}
                </CopyableNote>
              ))}
            </StudioCard>
          </div>
        )}
      </div>
    </div>
  );
};

export default DelayEffects;
