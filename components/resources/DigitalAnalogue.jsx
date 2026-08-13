import React, { useState, useRef, useCallback, useEffect } from 'react';
import { RotateCcw, ChevronDown, ChevronUp, Volume2, Zap, HardDrive, Music } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// ============================================
// Digital & Analogue Audio
// A-Level Music Technology — Topic 2.4
// Revelation Design System (Canvas + Studio)
// ============================================

const FONT_HEADING = "var(--font-fraunces), Georgia, serif";
const FONT_BODY = "'Inter', system-ui, sans-serif";

// WO-05 Batch B: this component referenced 191 CSS custom properties that
// were defined NOWHERE in the repo — every background, radius, border and
// spacing var silently resolved to nothing, so the live page rendered
// unstyled (the audit's single most severe design finding). The block
// below defines the full family it consumes, scoped to this page's root,
// at the Botanical Press house values — the same pattern and values its
// Revelation-era siblings (ProductionAnalysis, StereoPanning) use.
const DESIGN_TOKENS_CSS = `
  .digital-analogue-root {
    --accent: #3A4A35;
    --accent-soft: rgba(58, 74, 53, 0.1);
    --background: #F2EBE0;
    --background-raised: #F8F2E8;
    --foreground: #1F2A1C;
    --foreground-secondary: #4A5142;
    --foreground-tertiary: #6B6F5C;
    --border: #D4C9B4;
    --border-strong: #B3A78F;
    --canvas-background: #211C15;
    --canvas-surface: #2A241B;
    --canvas-surface-2: #332C21;
    --canvas-foreground: #F3E9D8;
    --canvas-foreground-secondary: #C6B9A2;
    --canvas-foreground-tertiary: #9A8E77;
    --canvas-border: #3B342A;
    --canvas-border-hover: #4A4136;
    --canvas-highlight: #DCC892;
    --success: #059669;
    --success-soft: rgba(5, 150, 105, 0.1);
    --error: #DC2626;
    --error-soft: rgba(220, 38, 38, 0.1);
    --warning: #D97706;
    --annotation-info: #9B7530;
    --moss: #5F7058;
    --sienna: #B85A3F;
    --mustard: #C99F44;
    --shadow-md: 0 4px 6px -1px rgba(43,36,24,0.1), 0 2px 4px -1px rgba(43,36,24,0.06);
    --space-1: 0.25rem; --space-2: 0.5rem; --space-3: 0.75rem;
    --space-4: 1rem; --space-5: 1.25rem; --space-6: 1.5rem; --space-8: 2rem;
    --text-xs: 0.75rem; --text-sm: 0.875rem; --text-base: 1rem;
    --text-lg: 1.125rem; --text-xl: 1.25rem; --text-2xl: 1.5rem; --text-3xl: 1.875rem; --text-4xl: 2.25rem;
    --radius-sm: 0.25rem; --radius-md: 0.375rem; --radius-lg: 0.5rem; --radius-xl: 0.75rem; --radius-full: 9999px;
    --duration-fast: 150ms; --duration-normal: 300ms;
    --ease-out: cubic-bezier(0.4, 0, 0.2, 1);
  }
`;

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
        <button type="button" onClick={handleCopy} style={{
          background: copied ? 'var(--success)' : 'var(--background-raised)', border: `1px solid ${copied ? 'var(--success)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-md)', padding: '0.25rem 0.75rem', cursor: 'pointer',
          color: copied ? '#fff' : 'var(--foreground-tertiary)', fontSize: 'var(--text-xs)', fontFamily: FONT_BODY
        }}>{copied ? '\u2713 Copied!' : '\u{1F4CB} Copy'}</button>
      </div>
      <div ref={contentRef} style={{ color: 'var(--foreground-secondary)', fontSize: 'var(--text-sm)', lineHeight: '1.6', fontFamily: FONT_BODY }}>{children}</div>
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
    boxShadow: 'var(--shadow-md)', transition: 'transform, opacity, background-color, color, border-color, box-shadow var(--duration-normal) var(--ease-out)', ...style
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
// PRESS BUTTON (with scale feedback)
// ============================================
const PressButton = ({ children, onClick, disabled, style = {}, 'aria-pressed': ariaPressed }) => {
  const [pressed, setPressed] = useState(false);
  return (
    <button type="button"
      onClick={onClick} disabled={disabled}
      aria-pressed={ariaPressed}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        transform: pressed && !disabled ? 'scale(0.97)' : 'scale(1)',
        transition: 'transform, opacity, background-color, color, border-color, box-shadow var(--duration-fast) var(--ease-out)',
        cursor: disabled ? 'default' : 'pointer',
        fontFamily: FONT_BODY, ...style
      }}
    >{children}</button>
  );
};

// ============================================
// QUIZ DATA
// ============================================
const quizQuestions = [
  {
    q: 'What does A/D conversion do?',
    options: ['Converts analogue signals to digital data', 'Converts digital signals to analogue waveforms', 'Amplifies an audio signal', 'Reduces background noise'],
    correct: 0,
    explanation: 'A/D (analogue-to-digital) conversion takes a continuous analogue signal and converts it into discrete digital values through sampling and quantisation. This is the essential first step in any digital recording process.',
    difficulty: 'foundation'
  },
  {
    q: 'What is the standard specification for CD-quality audio?',
    options: ['48 kHz / 24-bit', '44.1 kHz / 16-bit', '96 kHz / 24-bit', '22.05 kHz / 8-bit'],
    correct: 1,
    explanation: 'The Red Book standard for CD audio is 44.1 kHz sample rate with 16-bit depth. This provides a frequency response up to approximately 22.05 kHz (above human hearing) and a dynamic range of approximately 96 dB.',
    difficulty: 'foundation'
  },
  {
    q: 'Which of the following is a lossless audio format?',
    options: ['MP3', 'AAC', 'WAV', 'OGG Vorbis'],
    correct: 2,
    explanation: 'WAV (and AIFF) are uncompressed, lossless audio formats that preserve all original audio data as PCM (Pulse Code Modulation). MP3, AAC, and OGG Vorbis are lossy formats that discard some audio information to reduce file size.',
    difficulty: 'foundation'
  },
  {
    q: 'What is the approximate file size of a 3-minute stereo WAV file at 44.1 kHz / 16-bit?',
    options: ['5 MB', '15 MB', '30 MB', '60 MB'],
    correct: 2,
    explanation: 'Using the formula: (44,100 \u00D7 16 \u00D7 2 \u00D7 180) \u00F7 8 \u00F7 1,048,576 \u2248 30.2 MB. Three minutes = 180 seconds, stereo = 2 channels. This is a common exam calculation.',
    difficulty: 'intermediate'
  },
  {
    q: 'What is the key difference between analogue and digital clipping?',
    options: [
      'Analogue clipping is louder than digital clipping',
      'Analogue clipping produces soft saturation; digital clipping produces harsh, flat-topped distortion',
      'Digital clipping sounds warmer than analogue clipping',
      'There is no audible difference between them'
    ],
    correct: 1,
    explanation: 'Analogue clipping (e.g., through valves or tape) introduces gradual, soft saturation with harmonic distortion that can sound musically pleasing. Digital clipping occurs when the signal exceeds 0 dBFS, producing harsh, flat-topped waveforms with unpleasant artefacts.',
    difficulty: 'intermediate'
  },
  {
    q: 'Why do valves tend to produce a "warmer" sound than transistors?',
    options: [
      'Valves have a higher sample rate',
      'Valves produce even-order harmonics when driven, which sound musically pleasing',
      'Valves use digital processing internally',
      'Valves have a wider frequency response'
    ],
    correct: 1,
    explanation: 'When overdriven, valves (vacuum tubes) produce predominantly even-order harmonics (2nd, 4th, 6th), which are musically consonant and perceived as "warm". Transistors tend to produce odd-order harmonics, which can sound harsher and less musical.',
    difficulty: 'advanced'
  },
  {
    q: 'A streaming service uses 320 kbps AAC. Which statement is true?',
    options: [
      'This is a lossless format with no data loss',
      'This is a lossy format using perceptual coding to reduce file size',
      'This has a higher bit rate than CD-quality audio',
      'This format stores audio as an analogue signal'
    ],
    correct: 1,
    explanation: 'AAC at 320 kbps is a lossy, compressed format. It uses psychoacoustic models (perceptual coding) to discard audio information deemed inaudible to the human ear, significantly reducing file size compared to uncompressed WAV or AIFF. CD-quality WAV has a bit rate of approximately 1,411 kbps.',
    difficulty: 'advanced'
  }
];

// ============================================
// LEARN CONTENT
// ============================================
const learnSections = [
  {
    level: 'foundation',
    title: 'Analogue vs Digital: The Basic Difference',
    content: 'An analogue audio signal is continuous \u2014 it varies smoothly and without interruption, just like a sound wave in the air. A vinyl record stores music as a continuous groove that mirrors the original waveform. A digital audio signal, by contrast, is discrete \u2014 it represents the sound as a series of individual numerical snapshots taken at regular intervals. Think of it as the difference between a smooth ramp (analogue) and a staircase (digital). Neither is inherently better; they have different characteristics and trade-offs.'
  },
  {
    level: 'foundation',
    title: 'A/D and D/A Conversion',
    content: 'A/D (analogue-to-digital) conversion is the process of turning a continuous analogue signal into digital data. This happens every time you record audio into a computer or digital device \u2014 a microphone captures sound as an analogue electrical signal, and the A/D converter transforms it into numbers. D/A (digital-to-analogue) conversion is the reverse: it takes digital data and reconstructs it as a continuous analogue signal for playback through speakers or headphones. Every digital audio system relies on both processes.'
  },
  {
    level: 'intermediate',
    title: 'How Digital Recording Works: Sampling and Quantisation',
    content: 'Digital recording involves two key processes. Sampling measures the amplitude of the analogue signal at regular time intervals \u2014 the number of measurements per second is the sample rate (measured in Hz or kHz). Quantisation assigns each sample to the nearest available digital value \u2014 the number of possible values is determined by the bit depth. Together, sample rate controls the frequency range that can be captured, and bit depth controls the amplitude resolution (dynamic range and noise floor). Higher values in both mean more accurate digital representation of the original analogue signal.'
  },
  {
    level: 'intermediate',
    title: 'Standard Specifications',
    content: 'CD-quality audio uses 44.1 kHz sample rate and 16-bit depth, providing frequency response up to ~22.05 kHz and ~96 dB dynamic range. Professional studio recording typically uses 48 kHz / 24-bit, offering ~144 dB theoretical dynamic range and compatibility with video frame rates. Hi-res audio uses 96 kHz / 24-bit (or higher), capturing frequencies beyond human hearing and providing extra headroom for processing. The choice of specification depends on the intended use, storage capacity, and processing requirements.'
  },
  {
    level: 'intermediate',
    title: 'Frequency Response, SNR, Dynamic Range and Headroom',
    content: 'Frequency response describes the range of frequencies a system can reproduce. Analogue equipment has a natural roll-off at the extremes; digital systems have a sharp cut-off at the Nyquist frequency (half the sample rate). Signal-to-noise ratio (SNR) measures the difference between the desired signal and the background noise floor. Digital systems typically have better SNR than analogue. Dynamic range is the difference between the quietest and loudest sounds a system can handle. Headroom is the safety margin between the normal operating level and the maximum level before clipping occurs.'
  },
  {
    level: 'intermediate',
    title: 'Digital vs Analogue Clipping',
    content: 'When an analogue signal is pushed beyond a system\'s capacity (e.g., through valves or tape), it clips gradually \u2014 the waveform is gently rounded, producing soft saturation and harmonic distortion that often sounds musically pleasing ("warmth"). Digital clipping occurs when the signal exceeds 0 dBFS (the absolute maximum digital level) \u2014 the waveform is brutally chopped flat, creating harsh, unpleasant distortion with no musical character. This is why digital systems require careful gain staging and headroom management.'
  },
  {
    level: 'intermediate',
    title: 'Audio Formats: Lossy vs Lossless',
    content: 'Uncompressed lossless formats (WAV, AIFF) store every sample as PCM (Pulse Code Modulation) without any data loss, resulting in large file sizes but perfect audio fidelity. Compressed lossless formats (FLAC, ALAC) reduce file size without losing any data \u2014 the original audio can be perfectly reconstructed. Lossy formats (MP3, AAC, OGG Vorbis) use psychoacoustic models to permanently discard audio information deemed inaudible, achieving much smaller file sizes at the cost of some quality. Higher bit rates in lossy formats (e.g., 320 kbps vs 128 kbps) retain more detail.'
  },
  {
    level: 'advanced',
    title: 'Valves vs Transistors',
    content: 'Valve (vacuum tube) circuits and transistor (solid-state) circuits behave differently when processing audio. Valves introduce gentle, gradual distortion when driven hard, producing predominantly even-order harmonics (2nd, 4th, 6th) that are musically consonant and perceived as "warm" or "rich". Transistors tend to clip more abruptly, producing odd-order harmonics (3rd, 5th, 7th) that can sound harsher. Many engineers and musicians prize valve preamps, compressors, and guitar amplifiers for their sonic character. Modern recording often combines both technologies \u2014 valve warmth with digital precision.'
  },
  {
    level: 'advanced',
    title: 'Streaming Bit Rates and Perceptual Coding',
    content: 'Streaming services deliver audio at various bit rates depending on the subscription tier and platform. Typical rates include: 128 kbps (basic quality), 256 kbps (standard quality), 320 kbps (high quality), and some services now offer lossless streaming (e.g., CD-quality 1,411 kbps or hi-res). Lossy codecs like AAC and OGG Vorbis use perceptual coding \u2014 psychoacoustic models that exploit the limitations of human hearing (such as auditory masking) to discard sounds we are unlikely to notice. The effectiveness of this approach depends heavily on the bit rate and the complexity of the audio material.'
  },
];

// ============================================
// CHALLENGE SCENARIOS
// ============================================
const challengeScenarios = [
  {
    type: 'filesize',
    description: 'A band records a 4-minute stereo track at CD quality (44.1 kHz, 16-bit). What is the uncompressed file size in MB?',
    answer: ((44100 * 16 * 2 * 240) / 8 / 1048576).toFixed(2),
    working: '(44,100 \u00D7 16 \u00D7 2 \u00D7 240) \u00F7 8 \u00F7 1,048,576',
    unit: 'MB'
  },
  {
    type: 'filesize',
    description: 'A podcast records 10 minutes of mono audio at 48 kHz, 24-bit. What is the file size in MB?',
    answer: ((48000 * 24 * 1 * 600) / 8 / 1048576).toFixed(2),
    working: '(48,000 \u00D7 24 \u00D7 1 \u00D7 600) \u00F7 8 \u00F7 1,048,576',
    unit: 'MB'
  },
  {
    type: 'filesize',
    description: 'A film composer exports a 2-minute stereo cue at 96 kHz, 24-bit hi-res. How large is the file in MB?',
    answer: ((96000 * 24 * 2 * 120) / 8 / 1048576).toFixed(2),
    working: '(96,000 \u00D7 24 \u00D7 2 \u00D7 120) \u00F7 8 \u00F7 1,048,576',
    unit: 'MB'
  },
];

// ============================================
// BIT DEPTH CHART DATA
// ============================================
const bitDepthChartData = [
  { name: '4-bit', levels: 16, range: 24 },
  { name: '8-bit', levels: 256, range: 48 },
  { name: '16-bit', levels: 65536, range: 96 },
  { name: '24-bit', levels: 16777216, range: 144 }
];

// ============================================
// MAIN COMPONENT
// ============================================
const DigitalAnalogue = () => {
  const [activeTab, setActiveTab] = useState('learn');
  const tabs = [
    { id: 'learn', label: 'Learn', icon: Volume2 },
    { id: 'interactive', label: 'Interactive', icon: Zap },
    { id: 'quiz', label: 'Quiz', icon: HardDrive },
    { id: 'reference', label: 'Reference', icon: Music }
  ];

  // Learn state
  const [learnFilter, setLearnFilter] = useState('all');
  const [expandedSections, setExpandedSections] = useState({});

  // Interactive state
  const [sampleRate, setSampleRate] = useState(44100);
  const [bitDepth, setBitDepth] = useState(16);
  const [showClipping, setShowClipping] = useState(false);
  const canvasRef = useRef(null);
  const clippingCanvasRef = useRef(null);

  // File size calculator state
  const [calcDuration, setCalcDuration] = useState(180);
  const [calcSampleRate, setCalcSampleRate] = useState(44100);
  const [calcBitDepth, setCalcBitDepth] = useState(16);
  const [calcChannels, setCalcChannels] = useState(2);

  // Challenge state
  const [challengeActive, setChallengeActive] = useState(false);
  const [challengeParams, setChallengeParams] = useState(null);
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

  // File size calculation
  const calculateFileSize = (sr, bd, ch, dur) => (sr * bd * ch * dur) / 8 / 1048576;

  // ============================================
  // A/D CONVERSION CANVAS
  // ============================================
  const drawADConversion = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const container = canvas.parentElement;
    const w = Math.min(560, container ? container.clientWidth - 4 : 560);
    const h = Math.round(w * (360 / 560));
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.scale(dpr, dpr);

    // Background (Canvas API context — hex required)
    ctx.fillStyle = '#060A14';
    ctx.fillRect(0, 0, w, h);

    const padding = { top: 30, bottom: 40, left: 50, right: 20 };
    const plotW = w - padding.left - padding.right;
    const plotH = h - padding.top - padding.bottom;
    const centreY = padding.top + plotH / 2;

    // Quantisation grid lines (horizontal)
    const levels = Math.pow(2, Math.min(bitDepth, 8));
    const visibleLevels = Math.min(levels, 64);
    const stepH = plotH / visibleLevels;

    ctx.strokeStyle = 'rgba(74, 127, 212, 0.08)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= visibleLevels; i++) {
      const y = padding.top + i * stepH;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();
    }

    // Bit depth label (Canvas API — hex required)
    ctx.fillStyle = 'rgba(201, 184, 122, 0.6)';
    ctx.font = "10px 'Inter', system-ui, sans-serif";
    ctx.textAlign = 'left';
    ctx.fillText(`${bitDepth}-bit = ${Math.pow(2, bitDepth).toLocaleString()} levels`, padding.left + 4, padding.top + 14);

    // Axis labels
    ctx.fillStyle = 'rgba(232, 228, 223, 0.5)';
    ctx.font = "11px 'Inter', system-ui, sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText('Time \u2192', w / 2, h - 4);

    ctx.save();
    ctx.translate(14, h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Amplitude', 0, 0);
    ctx.restore();

    // Draw continuous analogue sine wave
    const displayCycles = 3;
    const amplitude = plotH * 0.42;

    ctx.strokeStyle = 'rgba(74, 127, 212, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let px = 0; px <= plotW; px++) {
      const t = (px / plotW) * displayCycles * 2 * Math.PI;
      const y = centreY - Math.sin(t) * amplitude;
      if (px === 0) ctx.moveTo(padding.left + px, y);
      else ctx.lineTo(padding.left + px, y);
    }
    ctx.stroke();

    // Calculate visual sample count based on sample rate
    const visualSamples = Math.round((sampleRate / 96000) * 200);
    const clampedSamples = Math.max(8, Math.min(visualSamples, 200));

    // Draw sampled/quantised version (staircase)
    const quantLevels = Math.pow(2, bitDepth);
    const halfLevels = quantLevels / 2;

    ctx.strokeStyle = '#FF6B35';
    ctx.lineWidth = 2;
    ctx.beginPath();

    let prevY = null;
    for (let i = 0; i < clampedSamples; i++) {
      const t = (i / clampedSamples) * displayCycles * 2 * Math.PI;
      const exactVal = Math.sin(t);
      const quantised = Math.round(exactVal * halfLevels) / halfLevels;
      const y = centreY - quantised * amplitude;

      const x1 = padding.left + (i / clampedSamples) * plotW;
      const x2 = padding.left + ((i + 1) / clampedSamples) * plotW;

      if (prevY !== null && prevY !== y) {
        ctx.lineTo(x1, y);
      }
      if (i === 0) ctx.moveTo(x1, y);
      ctx.lineTo(x2, y);
      prevY = y;
    }
    ctx.stroke();

    // Draw sample points (Canvas API — hex required)
    ctx.fillStyle = '#FF6B35';
    for (let i = 0; i < clampedSamples; i++) {
      const t = (i / clampedSamples) * displayCycles * 2 * Math.PI;
      const exactVal = Math.sin(t);
      const quantised = Math.round(exactVal * halfLevels) / halfLevels;
      const y = centreY - quantised * amplitude;
      const x = padding.left + (i / clampedSamples) * plotW;

      if (clampedSamples <= 60) {
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Legend (Canvas API — hex/rgba required)
    ctx.fillStyle = 'rgba(74, 127, 212, 0.7)';
    ctx.fillRect(w - 180, h - 34, 10, 3);
    ctx.fillStyle = 'rgba(232, 228, 223, 0.5)';
    ctx.font = "10px 'Inter', system-ui, sans-serif";
    ctx.textAlign = 'left';
    ctx.fillText('Analogue (continuous)', w - 166, h - 30);

    ctx.fillStyle = '#FF6B35';
    ctx.fillRect(w - 180, h - 20, 10, 3);
    ctx.fillStyle = 'rgba(232, 228, 223, 0.5)';
    ctx.fillText('Digital (sampled)', w - 166, h - 16);

    // Sample rate info (Canvas API — hex required)
    ctx.fillStyle = 'rgba(255, 107, 53, 0.6)';
    ctx.font = "10px 'Inter', system-ui, sans-serif";
    ctx.textAlign = 'right';
    ctx.fillText(`${(sampleRate / 1000).toFixed(1)} kHz \u2014 ${clampedSamples} steps shown across 3 cycles`, w - padding.right, padding.top + 14);

  }, [sampleRate, bitDepth]);

  // ============================================
  // CLIPPING COMPARISON CANVAS
  // ============================================
  const drawClipping = useCallback(() => {
    const canvas = clippingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const container = canvas.parentElement;
    const w = Math.min(560, container ? container.clientWidth - 4 : 560);
    const h = Math.round(w * (240 / 560));
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.scale(dpr, dpr);

    // Background (Canvas API — hex required)
    ctx.fillStyle = '#060A14';
    ctx.fillRect(0, 0, w, h);

    const halfW = w / 2;
    const padding = 30;
    const plotH = h - padding * 2;
    const amplitude = plotH * 0.35;
    const clipLevel = amplitude * 0.65;

    // Divider
    ctx.strokeStyle = 'rgba(74, 127, 212, 0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(halfW, 0);
    ctx.lineTo(halfW, h);
    ctx.stroke();
    ctx.setLineDash([]);

    // Labels (Canvas API — rgba required)
    ctx.fillStyle = 'rgba(232, 228, 223, 0.6)';
    ctx.font = "11px 'Inter', system-ui, sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText('Analogue Clipping (soft)', halfW / 2, 18);
    ctx.fillText('Digital Clipping (hard)', halfW + halfW / 2, 18);

    // Clip level lines
    ctx.strokeStyle = 'rgba(201, 184, 122, 0.3)';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([3, 3]);
    for (const side of [0, halfW]) {
      const cy = h / 2;
      ctx.beginPath();
      ctx.moveTo(side + 10, cy - clipLevel);
      ctx.lineTo(side + halfW - 10, cy - clipLevel);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(side + 10, cy + clipLevel);
      ctx.lineTo(side + halfW - 10, cy + clipLevel);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    const centreY = h / 2;
    const cycles = 2.5;

    // Analogue clipping (soft tanh saturation) — Canvas API hex
    ctx.strokeStyle = '#4A7FD4';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let px = 10; px < halfW - 10; px++) {
      const t = ((px - 10) / (halfW - 20)) * cycles * 2 * Math.PI;
      const raw = Math.sin(t) * 1.5;
      const clipped = Math.tanh(raw);
      const y = centreY - clipped * clipLevel;
      if (px === 10) ctx.moveTo(px, y);
      else ctx.lineTo(px, y);
    }
    ctx.stroke();

    // Digital clipping (hard clip) — Canvas API hex
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let px = halfW + 10; px < w - 10; px++) {
      const t = ((px - halfW - 10) / (halfW - 20)) * cycles * 2 * Math.PI;
      const raw = Math.sin(t) * 1.5;
      const clipped = Math.max(-1, Math.min(1, raw));
      const y = centreY - clipped * clipLevel;
      if (px === halfW + 10) ctx.moveTo(px, y);
      else ctx.lineTo(px, y);
    }
    ctx.stroke();

    // Descriptive text (Canvas API — rgba required)
    ctx.fillStyle = 'rgba(74, 127, 212, 0.5)';
    ctx.font = "9px 'Inter', system-ui, sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText('Gradual saturation, musical harmonics', halfW / 2, h - 8);
    ctx.fillStyle = 'rgba(239, 68, 68, 0.5)';
    ctx.fillText('Harsh flat-topping, unpleasant artefacts', halfW + halfW / 2, h - 8);

  }, []);

  useEffect(() => {
    if (activeTab === 'interactive') {
      drawADConversion();
      if (showClipping) drawClipping();
    }
  }, [activeTab, drawADConversion, drawClipping, showClipping]);

  // Generate challenge
  const generateChallenge = () => {
    const c = challengeScenarios[Math.floor(Math.random() * challengeScenarios.length)];
    setChallengeParams(c);
    setChallengeActive(true);
    setChallengeSubmitted(false);
    setUserGuess('');
  };

  const submitChallenge = () => {
    if (!userGuess || !challengeParams) return;
    const guess = parseFloat(userGuess);
    const answer = parseFloat(challengeParams.answer);
    const tolerance = challengeParams.type === 'filesize' ? 1.0 : answer * 0.01;
    const correct = Math.abs(guess - answer) <= tolerance;
    setChallengeSubmitted(true);
    setChallengeScore(prev => ({ correct: prev.correct + (correct ? 1 : 0), total: prev.total + 1 }));
  };

  const resetInteractive = () => {
    setSampleRate(44100);
    setBitDepth(16);
    setShowClipping(false);
    setCalcDuration(180);
    setCalcSampleRate(44100);
    setCalcBitDepth(16);
    setCalcChannels(2);
    setChallengeActive(false);
    setChallengeParams(null);
    setUserGuess('');
    setChallengeSubmitted(false);
    setChallengeScore({ correct: 0, total: 0 });
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
    <div className="digital-analogue-root" style={{
      fontFamily: FONT_BODY,
      background: isCanvasTab ? 'var(--canvas-background)' : 'var(--background)',
      color: isCanvasTab ? 'var(--canvas-foreground)' : 'var(--foreground)',
      minHeight: '100vh',
      transition: 'background var(--duration-normal) var(--ease-out), color var(--duration-normal) var(--ease-out)'
    }} data-mode={isCanvasTab ? 'canvas' : undefined}>
      <style dangerouslySetInnerHTML={{ __html: DESIGN_TOKENS_CSS }} />

      {/* Header */}
      <div style={{ padding: 'var(--space-8) var(--space-6) var(--space-4)', textAlign: 'center' }}>
        <div style={{ fontSize: 'var(--text-xs)', fontWeight: '300', textTransform: 'uppercase', letterSpacing: '0.2em', color: isCanvasTab ? 'var(--canvas-highlight)' : 'var(--accent)', marginBottom: 'var(--space-2)' }}>
          Topic 2.4 &middot; Component 4
        </div>
        <h1 style={{ fontFamily: FONT_HEADING, fontWeight: 900, fontSize: 'var(--text-4xl)', margin: 0, color: isCanvasTab ? 'var(--canvas-foreground)' : 'var(--foreground)' }}>
          Digital &amp; Analogue Audio
        </h1>
      </div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${isCanvasTab ? 'var(--canvas-border)' : 'var(--border)'}`, margin: '0 var(--space-6)' }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <PressButton key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              flex: 1, padding: 'var(--space-3)', fontSize: 'var(--text-xs)', fontWeight: '600',
              textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-1)',
              color: activeTab === tab.id ? 'var(--accent)' : (isCanvasTab ? 'var(--canvas-foreground-tertiary)' : 'var(--foreground-tertiary)'),
              background: activeTab === tab.id ? 'var(--accent-soft)' : 'transparent',
              borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
              border: 'none'
            }}>
              <Icon size={14} />
              {tab.label}
            </PressButton>
          );
        })}
      </div>

      {/* Tab Content */}
      <div style={{ padding: 'var(--space-6)', maxWidth: '900px', margin: '0 auto' }}>

        {/* ============ LEARN TAB ============ */}
        {activeTab === 'learn' && (
          <div>
            {/* Filter buttons */}
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)', flexWrap: 'wrap' }}>
              {[{ id: 'all', label: 'All Topics' }, { id: 'foundation', label: '\u{1F7E2} Foundation' }, { id: 'intermediate', label: '\u{1F7E1} Intermediate' }, { id: 'advanced', label: '\u{1F534} Advanced' }].map(f => (
                <PressButton key={f.id} onClick={() => setLearnFilter(f.id)} style={{
                  padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)',
                  border: `1px solid ${learnFilter === f.id ? 'var(--accent)' : 'var(--border)'}`,
                  background: learnFilter === f.id ? 'var(--accent-soft)' : 'var(--background-raised)',
                  color: learnFilter === f.id ? 'var(--accent)' : 'var(--foreground-secondary)',
                  fontSize: 'var(--text-sm)', fontWeight: '500'
                }}>{f.label}</PressButton>
              ))}
            </div>

            {/* Content sections */}
            {learnSections.map((section, idx) => ({ section, idx })).filter(({ section }) => learnFilter === 'all' || section.level === learnFilter).map(({ section, idx }) => (
              <StudioCard key={idx} style={{ marginBottom: 'var(--space-4)' }}>
                <button type="button" onClick={() => toggleSection(idx)} style={{
                  width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left'
                }}>
                  <div>
                    <DiffBadge level={section.level} />
                    <h3 style={{ fontFamily: FONT_HEADING, fontWeight: 700, fontSize: 'var(--text-xl)', margin: 'var(--space-2) 0 0', color: 'var(--foreground)' }}>{section.title}</h3>
                  </div>
                  {expandedSections[idx] ? <ChevronUp size={20} style={{ color: 'var(--foreground-tertiary)' }} /> : <ChevronDown size={20} style={{ color: 'var(--foreground-tertiary)' }} />}
                </button>
                {expandedSections[idx] && (
                  <div style={{ marginTop: 'var(--space-4)', color: 'var(--foreground-secondary)', fontSize: 'var(--text-base)', lineHeight: '1.7' }}>
                    <p style={{ margin: 0 }}>{section.content}</p>
                    <CopyableNote title="Key Point" color="var(--info)" variant="key">
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
                { artist: 'Vinyl vs CD', track: 'General Comparison', note: 'Vinyl records reproduce sound from a continuous groove (analogue), offering characteristic warmth and subtle harmonic colouration. CDs store audio digitally at 44.1 kHz/16-bit, providing cleaner reproduction with greater dynamic range and no surface noise.' },
                { artist: 'Daft Punk', track: 'Get Lucky', note: 'Recorded largely through analogue equipment \u2014 vintage Neve console, valve preamps, and tape machines \u2014 to achieve warmth and character before being mixed in the digital domain. A textbook example of combining analogue and digital workflows.' },
                { artist: 'Bon Iver', track: 'Woods', note: 'Uses digital vocal processing extensively, layering Auto-Tune as a deliberate creative tool rather than a corrective one. The digitally processed, heavily quantised vocal sound is central to the track\'s aesthetic.' },
                { artist: 'Jack White', track: 'Various', note: 'Deliberately records using analogue equipment and lo-fi techniques \u2014 valve amps, tape machines, limited track counts. His approach embraces the imperfections and character of analogue recording as a creative choice.' }
              ].map((ex, i) => (
                <div key={i} style={{ padding: 'var(--space-3) 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
                  <strong style={{ color: 'var(--accent)' }}>{ex.artist}</strong> &mdash; &ldquo;{ex.track}&rdquo;
                  <p style={{ margin: 'var(--space-1) 0 0', color: 'var(--foreground-secondary)', fontSize: 'var(--text-sm)', lineHeight: '1.5' }}>{ex.note}</p>
                </div>
              ))}
            </StudioCard>
          </div>
        )}

        {/* ============ INTERACTIVE TAB ============ */}
        {activeTab === 'interactive' && (
          <div data-mode="canvas">

            {/* A/D Conversion Simulator */}
            <div style={{ background: 'var(--canvas-surface)', border: '1px solid var(--canvas-border)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-5)', marginBottom: 'var(--space-6)', transition: 'border-color var(--duration-fast) var(--ease-out)' }}>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: '300', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--canvas-highlight)', marginBottom: 'var(--space-2)', textAlign: 'center' }}>
                A/D Conversion Simulator
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-4)' }}>
                <canvas ref={canvasRef} style={{ display: 'block', borderRadius: 'var(--radius-lg)', maxWidth: '100%' }} />
              </div>

              {/* Sample Rate Slider */}
              <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 250px', background: 'var(--canvas-surface)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-3) var(--space-4)', border: '1px solid var(--canvas-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-1)' }}>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--canvas-foreground-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sample Rate</span>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: '500', color: 'var(--accent)', fontFamily: "'Geist Mono', monospace" }}>{(sampleRate / 1000).toFixed(1)} kHz</span>
                  </div>
                  <input aria-label="Sample Rate" type="range" min={8000} max={96000} step={1000} value={sampleRate}
                    onChange={e => setSampleRate(parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--accent)' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--canvas-foreground-tertiary)', marginTop: 'var(--space-1)' }}>
                    <span>8 kHz</span>
                    <span>96 kHz</span>
                  </div>
                </div>

                {/* Bit Depth Slider */}
                <div style={{ flex: '1 1 250px', background: 'var(--canvas-surface)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-3) var(--space-4)', border: '1px solid var(--canvas-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-1)' }}>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--canvas-foreground-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bit Depth</span>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: '500', color: 'var(--canvas-highlight)', fontFamily: "'Geist Mono', monospace" }}>{bitDepth}-bit ({Math.pow(2, bitDepth).toLocaleString()} levels)</span>
                  </div>
                  <input aria-label="Bit Depth" type="range" min={4} max={24} step={1} value={bitDepth}
                    onChange={e => setBitDepth(parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--canvas-highlight)' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--canvas-foreground-tertiary)', marginTop: 'var(--space-1)' }}>
                    <span>4-bit</span>
                    <span>24-bit</span>
                  </div>
                </div>
              </div>

              {/* Info readout */}
              <div style={{ marginTop: 'var(--space-4)', display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                {[
                  { label: 'Bit Rate (kbps)', value: `${((sampleRate * bitDepth * 2) / 1000).toFixed(0)} kbps` },
                  { label: 'Dynamic Range', value: `~${(bitDepth * 6.02).toFixed(0)} dB` },
                  { label: 'Covers Human Hearing', value: sampleRate >= 44100 ? '\u2705 Yes' : '\u274C No' }
                ].map((info, i) => (
                  <div key={i} style={{ flex: '1 1 140px', background: 'var(--canvas-surface)', borderRadius: 'var(--radius-md)', padding: 'var(--space-2) var(--space-3)', border: '1px solid var(--canvas-border)', textAlign: 'center' }}>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--canvas-foreground-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{info.label}</div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: '600', color: 'var(--canvas-foreground)', fontFamily: "'Geist Mono', monospace", marginTop: '2px' }}>{info.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Clipping Comparison Toggle */}
            <div style={{ background: 'var(--canvas-surface)', border: '1px solid var(--canvas-border)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showClipping ? 'var(--space-4)' : 0 }}>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: '300', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--canvas-highlight)', marginBottom: 'var(--space-1)' }}>
                    Clipping Comparison
                  </div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--canvas-foreground-secondary)' }}>
                    Analogue (soft saturation) vs Digital (hard clip)
                  </div>
                </div>
                <PressButton onClick={() => setShowClipping(!showClipping)} style={{
                  padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)',
                  border: `1px solid ${showClipping ? 'var(--accent)' : 'var(--canvas-border-hover)'}`,
                  background: showClipping ? 'var(--accent-soft)' : 'var(--canvas-surface)',
                  color: showClipping ? 'var(--accent)' : 'var(--canvas-foreground-tertiary)',
                  fontSize: 'var(--text-sm)', fontWeight: '500'
                }}>{showClipping ? 'Hide' : 'Show'}</PressButton>
              </div>
              {showClipping && (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <canvas ref={clippingCanvasRef} style={{ display: 'block', borderRadius: 'var(--radius-lg)', maxWidth: '100%' }} />
                </div>
              )}
            </div>

            {/* File Size Calculator */}
            <div style={{ background: 'var(--canvas-surface)', border: '1px solid var(--canvas-border)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: '300', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--canvas-highlight)', marginBottom: 'var(--space-2)' }}>
                File Size Calculator
              </div>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--canvas-foreground-secondary)', margin: '0 0 var(--space-4)', lineHeight: '1.5' }}>
                Formula: (Sample Rate &times; Bit Depth &times; Channels &times; Duration) &divide; 8 &divide; 1,048,576 = Size in MB
              </p>

              <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
                {[
                  { label: 'Duration', value: calcDuration, set: setCalcDuration, min: 1, max: 600, step: 1, display: `${calcDuration}s (${(calcDuration / 60).toFixed(1)} min)` },
                  { label: 'Sample Rate', value: calcSampleRate, set: setCalcSampleRate, min: 8000, max: 192000, step: 1000, display: `${(calcSampleRate / 1000).toFixed(1)} kHz` },
                  { label: 'Bit Depth', value: calcBitDepth, set: setCalcBitDepth, min: 8, max: 32, step: 8, display: `${calcBitDepth}-bit` }
                ].map(ctrl => (
                  <div key={ctrl.label} style={{ flex: '1 1 160px', background: 'var(--canvas-surface)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-3) var(--space-4)', border: '1px solid var(--canvas-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-1)' }}>
                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--canvas-foreground-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{ctrl.label}</span>
                      <span style={{ fontSize: 'var(--text-sm)', fontWeight: '500', color: 'var(--accent)', fontFamily: "'Geist Mono', monospace" }}>{ctrl.display}</span>
                    </div>
                    <input aria-label={ctrl.label} type="range" min={ctrl.min} max={ctrl.max} step={ctrl.step} value={ctrl.value}
                      onChange={e => ctrl.set(parseFloat(e.target.value))}
                      style={{ width: '100%', accentColor: 'var(--accent)' }} />
                  </div>
                ))}

                {/* Channels toggle */}
                <div style={{ flex: '1 1 160px', background: 'var(--canvas-surface)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-3) var(--space-4)', border: '1px solid var(--canvas-border)' }}>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--canvas-foreground-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-2)' }}>Channels</div>
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    {[{ val: 1, label: 'Mono' }, { val: 2, label: 'Stereo' }].map(ch => (
                      <PressButton key={ch.val} onClick={() => setCalcChannels(ch.val)} style={{
                        flex: 1, padding: 'var(--space-1) var(--space-3)', borderRadius: 'var(--radius-sm)',
                        border: `1px solid ${calcChannels === ch.val ? 'var(--accent)' : 'var(--canvas-border-hover)'}`,
                        background: calcChannels === ch.val ? 'var(--accent-soft)' : 'transparent',
                        color: calcChannels === ch.val ? 'var(--accent)' : 'var(--canvas-foreground-tertiary)',
                        fontSize: 'var(--text-xs)', fontWeight: '500'
                      }}>{ch.label}</PressButton>
                    ))}
                  </div>
                </div>
              </div>

              {/* Result */}
              <div style={{ background: 'var(--canvas-surface)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', textAlign: 'center', border: '1px solid var(--canvas-border-hover)' }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--canvas-foreground-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 'var(--space-1)' }}>Uncompressed File Size</div>
                <div style={{ fontSize: 'var(--text-3xl)', fontWeight: '700', color: 'var(--accent)', fontFamily: "'Geist Mono', monospace" }}>
                  {calculateFileSize(calcSampleRate, calcBitDepth, calcChannels, calcDuration).toFixed(2)} MB
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--canvas-foreground-tertiary)', marginTop: 'var(--space-1)' }}>
                  {(calcSampleRate).toLocaleString()} &times; {calcBitDepth} &times; {calcChannels} &times; {calcDuration} &divide; 8 &divide; 1,048,576
                </div>
              </div>

              {/* Bit Depth Comparison Chart */}
              <div style={{ marginTop: 'var(--space-5)' }}>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--canvas-foreground-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-2)' }}>Dynamic Range by Bit Depth</div>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={bitDepthChartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <XAxis dataKey="name" tick={{ fill: 'var(--canvas-foreground-tertiary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'var(--canvas-foreground-tertiary)', fontSize: 10 }} axisLine={false} tickLine={false} unit=" dB" />
                    <Tooltip contentStyle={{ background: 'var(--canvas-surface)', border: '1px solid var(--canvas-border)', borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="range" radius={[4, 4, 0, 0]}>
                      {bitDepthChartData.map((entry, index) => (
                        <Cell key={index} fill={index === bitDepthChartData.length - 1 ? 'var(--accent)' : 'var(--canvas-border-hover)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Challenge Section */}
            <div style={{ background: 'var(--canvas-surface)', border: '1px solid var(--canvas-border)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: '300', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--canvas-highlight)', marginBottom: 'var(--space-2)' }}>Challenge Mode</div>
              <h3 style={{ fontFamily: FONT_HEADING, fontWeight: 700, fontSize: 'var(--text-xl)', margin: '0 0 var(--space-2)', color: 'var(--canvas-foreground)' }}>Calculate It</h3>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--canvas-foreground-tertiary)', margin: '0 0 var(--space-4)' }}>
                File size calculations using the standard formula
              </p>

              {!challengeActive ? (
                <PressButton onClick={generateChallenge} style={{
                  padding: 'var(--space-3) var(--space-6)', background: 'var(--accent)',
                  border: 'none', borderRadius: 'var(--radius-md)', color: '#fff',
                  fontSize: 'var(--text-sm)', fontWeight: '600'
                }}>Generate Challenge</PressButton>
              ) : (
                <div>
                  <div style={{ display: 'inline-block', padding: 'var(--space-1) var(--space-3)', borderRadius: 'var(--radius-sm)', background: 'var(--canvas-surface)', border: '1px solid var(--canvas-border-hover)', fontSize: 'var(--text-xs)', color: 'var(--canvas-highlight)', marginBottom: 'var(--space-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {'File Size'}
                  </div>
                  <p style={{ color: 'var(--canvas-foreground-secondary)', fontSize: 'var(--text-base)', lineHeight: '1.6', marginBottom: 'var(--space-4)' }}>{challengeParams?.description}</p>
                  <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input aria-label="Input" type="number" step="any" value={userGuess} onChange={e => setUserGuess(e.target.value)}
                      placeholder={`Your answer (${challengeParams?.unit})`} disabled={challengeSubmitted}
                      style={{
                        padding: 'var(--space-2) var(--space-3)', background: 'var(--canvas-surface)',
                        border: '1px solid var(--canvas-border-hover)', borderRadius: 'var(--radius-md)',
                        color: 'var(--canvas-foreground)', fontFamily: "'Geist Mono', monospace",
                        fontSize: 'var(--text-sm)', width: '200px'
                      }} />
                    {!challengeSubmitted ? (
                      <PressButton onClick={submitChallenge} disabled={!userGuess} style={{
                        padding: 'var(--space-2) var(--space-5)', background: userGuess ? 'var(--accent)' : 'var(--canvas-surface)',
                        border: 'none', borderRadius: 'var(--radius-md)', color: '#fff',
                        fontSize: 'var(--text-sm)', fontWeight: '600',
                        opacity: userGuess ? 1 : 0.5
                      }}>Submit</PressButton>
                    ) : (
                      <PressButton onClick={generateChallenge} style={{
                        padding: 'var(--space-2) var(--space-5)', background: 'var(--canvas-surface)',
                        border: '1px solid var(--canvas-border-hover)', borderRadius: 'var(--radius-md)',
                        color: 'var(--canvas-foreground-tertiary)', fontSize: 'var(--text-sm)'
                      }}>Next Challenge</PressButton>
                    )}
                  </div>
                  {challengeSubmitted && (() => {
                    const guess = parseFloat(userGuess);
                    const answer = parseFloat(challengeParams.answer);
                    const tolerance = challengeParams.type === 'filesize' ? 1.0 : answer * 0.01;
                    const isCorrect = Math.abs(guess - answer) <= tolerance;
                    return (
                      <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', background: isCorrect ? 'var(--success-soft)' : 'var(--error-soft)', border: `1px solid ${isCorrect ? 'var(--success)' : 'var(--error)'}` }}>
                        <strong style={{ color: isCorrect ? 'var(--success)' : 'var(--error)' }}>
                          {isCorrect ? 'Correct!' : `Not quite. The answer is ${Number(challengeParams.answer).toLocaleString()} ${challengeParams.unit}.`}
                        </strong>
                        <p style={{ color: 'var(--foreground)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-2)', lineHeight: '1.5' }}>
                          Working: {challengeParams.working} = {Number(challengeParams.answer).toLocaleString()} {challengeParams.unit}
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
            <PressButton onClick={resetInteractive} style={{
              padding: 'var(--space-2) var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)',
              background: 'var(--canvas-surface)', border: '1px solid var(--canvas-border-hover)',
              borderRadius: 'var(--radius-md)', color: 'var(--canvas-foreground-tertiary)',
              fontSize: 'var(--text-sm)', width: '100%'
            }}><RotateCcw size={14} /> Reset to Defaults</PressButton>
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
                        <PressButton key={i} onClick={() => handleAnswer(i)} disabled={showFeedback}
                          aria-pressed={isSelected}
                          style={{
                            padding: 'var(--space-3) var(--space-4)', background: bg,
                            border: `2px solid ${borderColor}`, borderRadius: 'var(--radius-md)',
                            textAlign: 'left',
                            fontSize: 'var(--text-base)', color: 'var(--foreground)',
                            transition: 'transform, opacity, background-color, color, border-color, box-shadow var(--duration-fast) var(--ease-out)'
                          }}>{opt}</PressButton>
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
                      <PressButton onClick={nextQuestion} style={{
                        marginTop: 'var(--space-4)', padding: 'var(--space-2) var(--space-5)',
                        background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-md)',
                        color: '#fff', fontSize: 'var(--text-sm)', fontWeight: '600'
                      }}>{quizIndex < quizQuestions.length - 1 ? 'Next Question' : 'See Results'}</PressButton>
                    </div>
                  )}
                </StudioCard>
              </div>
            ) : (
              <StudioCard style={{ textAlign: 'center' }}>
                <h2 style={{ fontFamily: FONT_HEADING, fontWeight: 900, fontSize: 'var(--text-3xl)', color: 'var(--foreground)', margin: '0 0 var(--space-4)' }}>Quiz Complete</h2>
                <div style={{ fontSize: 'var(--text-4xl)', fontWeight: '700', color: score >= 6 ? 'var(--success)' : score >= 4 ? 'var(--warning)' : 'var(--error)', marginBottom: 'var(--space-4)' }}>
                  {score} / {quizQuestions.length}
                </div>
                <p style={{ color: 'var(--foreground-secondary)', fontSize: 'var(--text-base)', marginBottom: 'var(--space-6)' }}>
                  {score >= 6 ? 'Excellent understanding of digital and analogue audio!' : score >= 4 ? 'Good foundation \u2014 review the areas you found challenging.' : 'Revisit the Learn tab and try again.'}
                </p>
                <PressButton onClick={resetQuiz} style={{
                  padding: 'var(--space-3) var(--space-6)', background: 'var(--accent)',
                  border: 'none', borderRadius: 'var(--radius-md)', color: '#fff',
                  fontSize: 'var(--text-sm)', fontWeight: '600'
                }}>Retry Quiz</PressButton>
              </StudioCard>
            )}
          </div>
        )}

        {/* ============ REFERENCE TAB ============ */}
        {activeTab === 'reference' && (
          <div>
            {/* Standard Specifications Table */}
            <StudioCard style={{ marginBottom: 'var(--space-6)' }}>
              <h3 style={{ fontFamily: FONT_HEADING, fontWeight: 700, fontSize: 'var(--text-xl)', margin: '0 0 var(--space-4)', color: 'var(--foreground)' }}>Digital Audio Specifications</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)', fontFamily: FONT_BODY }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-strong)' }}>
                      {['Format', 'Sample Rate', 'Bit Depth', 'Dynamic Range', 'Use Case'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: 'var(--space-2) var(--space-3)', color: 'var(--foreground)', fontWeight: '600', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['CD Audio', '44.1 kHz', '16-bit', '~96 dB', 'Consumer music distribution'],
                      ['DVD / Broadcast', '48 kHz', '16/24-bit', '~96\u2013144 dB', 'Film, television, video'],
                      ['Professional Studio', '48 kHz', '24-bit', '~144 dB', 'Recording, mixing, mastering'],
                      ['Hi-Res Audio', '96 kHz', '24-bit', '~144 dB', 'Audiophile distribution, hi-fi'],
                      ['Ultra Hi-Res', '192 kHz', '24/32-bit', '~144+ dB', 'Archival, specialist mastering']
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

            {/* Audio Formats Comparison */}
            <StudioCard style={{ marginBottom: 'var(--space-6)' }}>
              <h3 style={{ fontFamily: FONT_HEADING, fontWeight: 700, fontSize: 'var(--text-xl)', margin: '0 0 var(--space-4)', color: 'var(--foreground)' }}>Audio Formats Comparison</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)', fontFamily: FONT_BODY }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-strong)' }}>
                      {['Format', 'Type', 'Compression', 'Typical Bit Rate', 'Use Case'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: 'var(--space-2) var(--space-3)', color: 'var(--foreground)', fontWeight: '600', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['WAV', 'Lossless', 'None (PCM)', '1,411 kbps (CD)', 'Recording, editing, mastering'],
                      ['AIFF', 'Lossless', 'None (PCM)', '1,411 kbps (CD)', 'Apple ecosystem, pro audio'],
                      ['FLAC', 'Lossless', 'Compressed', '~800\u20131,000 kbps', 'Archival, audiophile streaming'],
                      ['MP3', 'Lossy', 'Compressed', '128\u2013320 kbps', 'General distribution, legacy'],
                      ['AAC', 'Lossy', 'Compressed', '128\u2013320 kbps', 'Streaming, Apple ecosystem']
                    ].map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                        {row.map((cell, j) => (
                          <td key={j} style={{ padding: 'var(--space-2) var(--space-3)', color: j === 0 ? 'var(--accent)' : j === 1 ? (cell === 'Lossless' ? 'var(--success)' : 'var(--warning)') : 'var(--foreground-secondary)' }}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </StudioCard>

            {/* File Size Formula */}
            <StudioCard style={{ marginBottom: 'var(--space-6)' }}>
              <h3 style={{ fontFamily: FONT_HEADING, fontWeight: 700, fontSize: 'var(--text-xl)', margin: '0 0 var(--space-4)', color: 'var(--foreground)' }}>File Size Formula</h3>
              <CopyableNote title="File Size Calculation" color="var(--accent)" variant="key">
                <div style={{ fontFamily: "'Geist Mono', monospace", fontSize: 'var(--text-base)', lineHeight: '2' }}>
                  (Sample Rate &times; Bit Depth &times; Channels &times; Duration) &divide; 8 &divide; 1,048,576 = <strong>Size in MB</strong>
                </div>
                <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
                  <strong>Example:</strong> 3 minutes of stereo CD audio (44.1 kHz / 16-bit):<br />
                  (44,100 &times; 16 &times; 2 &times; 180) &divide; 8 &divide; 1,048,576 = <strong>30.2 MB</strong>
                </div>
              </CopyableNote>
              <CopyableNote title="Why divide by 8?" color="var(--info)" variant="definition">
                The calculation produces a result in bits. Dividing by 8 converts to bytes. Dividing by 1,048,576 (which is 2<sup>20</sup>, or 1024 &times; 1024) converts bytes to megabytes (MB).
              </CopyableNote>
            </StudioCard>

            {/* Key Terms */}
            <StudioCard style={{ marginBottom: 'var(--space-6)' }}>
              <h3 style={{ fontFamily: FONT_HEADING, fontWeight: 700, fontSize: 'var(--text-xl)', margin: '0 0 var(--space-4)', color: 'var(--foreground)' }}>Key Terms Glossary</h3>
              {[
                { term: 'A/D Conversion', def: 'Analogue-to-digital conversion: the process of transforming a continuous analogue signal into discrete digital data through sampling and quantisation.' },
                { term: 'D/A Conversion', def: 'Digital-to-analogue conversion: the reverse process, reconstructing a continuous analogue signal from digital data for playback through speakers or headphones.' },
                { term: 'Sample Rate', def: 'The number of samples taken per second, measured in Hertz (Hz). A higher sample rate captures a wider frequency range. CD audio uses 44.1 kHz; professional studio recording typically uses 48 kHz or higher.' },
                { term: 'Bit Depth', def: 'The number of bits used to represent each sample. Determines the number of possible amplitude levels (2\u207F) and the dynamic range (~6 dB per bit).' },
                { term: 'PCM (Pulse Code Modulation)', def: 'The standard method of digitally encoding audio. Each sample is represented as a binary number. WAV and AIFF files store PCM data.' },
                { term: 'Lossy Compression', def: 'Audio compression that permanently discards data using psychoacoustic models (perceptual coding) to reduce file size. Examples: MP3, AAC, OGG Vorbis.' },
                { term: 'Lossless Compression', def: 'Audio compression that reduces file size without discarding any data \u2014 the original can be perfectly reconstructed. Examples: FLAC, ALAC.' },
                { term: 'Valve (Vacuum Tube)', def: 'An electronic component that amplifies audio signals. When overdriven, produces predominantly even-order harmonics (2nd, 4th, 6th) perceived as "warm" and musically pleasing.' },
                { term: 'Transistor (Solid-State)', def: 'An electronic component that replaced valves in most modern equipment. When overdriven, tends to produce odd-order harmonics (3rd, 5th, 7th) that can sound harsher.' },
                { term: 'Harmonic Distortion', def: 'Additional frequencies (harmonics) added to the original signal when a system is overdriven. Character depends on the type of harmonics: even-order (warm) vs odd-order (harsh).' }
              ].map((item, i) => (
                <CopyableNote key={i} title={item.term} color="var(--accent)" variant="definition">
                  {item.def}
                </CopyableNote>
              ))}
            </StudioCard>

            {/* Exam Tips */}
            <StudioCard style={{ marginBottom: 'var(--space-6)' }}>
              <h3 style={{ fontFamily: FONT_HEADING, fontWeight: 700, fontSize: 'var(--text-xl)', margin: '0 0 var(--space-4)', color: 'var(--foreground)' }}>
                Exam Tips for Component 4
              </h3>
              {[
                'For file size calculations, always show your full working: (Sample Rate \u00D7 Bit Depth \u00D7 Channels \u00D7 Duration) \u00F7 8 \u00F7 1,048,576. Convert the final answer to MB. This is a very common exam question.',
                'Know the difference between lossy and lossless formats. Be able to name examples of each and explain when you would choose one over the other \u2014 always relate your answer to the context given in the question.',
                'When comparing analogue and digital clipping, describe both the waveform shape (soft curve vs hard flat-top) AND the sonic character (warm saturation vs harsh distortion). Include the term "harmonic distortion" in your answer.',
                'If asked about valves vs transistors, explain the harmonic content: valves produce predominantly even-order harmonics (warm, musical), whilst transistors produce odd-order harmonics (harsher). Always link this to real-world examples of equipment.'
              ].map((tip, i) => (
                <CopyableNote key={i} title={`Tip ${i + 1}`} color="var(--secondary)" variant="exam">
                  {tip}
                </CopyableNote>
              ))}
            </StudioCard>

            {/* Music Examples */}
            <StudioCard>
              <h3 style={{ fontFamily: FONT_HEADING, fontWeight: 700, fontSize: 'var(--text-xl)', margin: '0 0 var(--space-4)', color: 'var(--foreground)' }}>
                {'\u{1F3B5}'} Music Examples for Exam Reference
              </h3>
              {[
                { artist: 'Daft Punk', track: 'Get Lucky', context: 'Listen for the warmth in the rhythm guitar and bass — recorded through vintage Neve console and valve preamps to tape before digital mixing. Compare the opening bars to any fully digital pop production.' },
                { artist: 'Radiohead', track: 'Everything In Its Right Place', context: 'Listen to how the heavily processed vocals sit in the mix. The digital artefacts from pitch-shifting and granular processing are deliberately exposed rather than hidden.' },
                { artist: 'Amy Winehouse', track: 'Back to Black', context: 'Recorded at Daptone Studios using analogue tape and vintage equipment. Listen for the tape saturation on the drums and the natural compression from the valve signal chain.' },
                { artist: 'Billie Eilish', track: 'Bad Guy', context: 'Recorded entirely in a bedroom using a digital setup (Logic Pro, audio interface). Compare the clean digital bass and crisp high frequencies with the analogue warmth of the Winehouse track.' }
              ].map((ex, i) => (
                <div key={i} style={{ padding: 'var(--space-3) 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
                  <strong style={{ color: 'var(--accent)' }}>{ex.artist}</strong> &mdash; &ldquo;{ex.track}&rdquo;
                  <p style={{ margin: 'var(--space-1) 0 0', color: 'var(--foreground-secondary)', fontSize: 'var(--text-sm)', lineHeight: '1.5' }}>{ex.context}</p>
                </div>
              ))}
            </StudioCard>
          </div>
        )}
      </div>
    </div>
  );
};

export default DigitalAnalogue;
