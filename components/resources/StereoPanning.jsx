'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

// ============================================
// Stereo & Panning
// A-Level Music Technology — Topics 1.10, 1.2
// Revelation Design System (Canvas + Studio)
// ============================================

const DESIGN_TOKENS_CSS = `
  .stereo-panning-root {
    --accent: #2563EB;
    --accent-soft: rgba(37, 99, 235, 0.1);
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
    --space-1: 0.25rem; --space-2: 0.5rem; --space-3: 0.75rem;
    --space-4: 1rem; --space-5: 1.25rem; --space-6: 1.5rem; --space-8: 2rem;
    --text-xs: 0.75rem; --text-sm: 0.875rem; --text-base: 1rem;
    --text-xl: 1.25rem; --text-3xl: 1.875rem; --text-4xl: 2.25rem;
    --radius-md: 0.375rem; --radius-lg: 0.5rem; --radius-xl: 0.75rem;
    --duration-fast: 150ms; --duration-normal: 300ms;
    --ease-out: cubic-bezier(0.4, 0, 0.2, 1);
  }
`;

const FONT_HEADING = "var(--font-fraunces), Georgia, serif";
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
        <button type="button" data-press onClick={handleCopy} style={{
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
// QUIZ DATA
// ============================================
const quizQuestions = [
  { q: 'Where should a kick drum typically be panned in a standard mix?', options: ['Hard left', 'Centre', 'Slightly right', 'Hard right'], correct: 1, explanation: 'The kick drum is almost always panned dead centre. Low-frequency instruments need equal energy in both speakers for a solid, powerful foundation. Off-centre bass causes an unbalanced, lopsided mix.', difficulty: 'foundation' },
  { q: 'What does the term "stereo field" refer to?', options: ['The frequency range of a recording', 'The perceived left-to-right spread of sound between two speakers', 'The distance between microphones', 'The dynamic range of a mix'], correct: 1, explanation: 'The stereo field (or stereo image) is the perceived spatial spread of sound between the left and right speakers. Panning places instruments across this field to create width and separation.', difficulty: 'foundation' },
  { q: 'In an X-Y (coincident) stereo microphone technique, how are the capsules arranged?', options: ['Spaced apart by at least 30 cm', 'Angled apart with capsules as close as possible, at the same point', 'Facing the same direction side by side', 'One behind the other'], correct: 1, explanation: 'X-Y uses two directional microphones angled apart (typically 90\u2013135\u00B0) with their capsules positioned as close together as possible at the same point. This ensures excellent mono compatibility because both capsules capture sound at virtually the same time.', difficulty: 'intermediate' },
  { q: 'What is the main advantage of the A-B (spaced pair) technique over X-Y?', options: ['Better mono compatibility', 'Wider, more natural stereo image', 'Less phase cancellation', 'Lower noise floor'], correct: 1, explanation: 'A-B spaced pairs create a wider, more natural-sounding stereo image because the distance between capsules introduces time-of-arrival differences. However, this spacing can cause phase issues when summed to mono.', difficulty: 'intermediate' },
  { q: 'What happens when a stereo signal with phase differences is collapsed to mono?', options: ['The signal becomes louder', 'Nothing changes', 'Some frequencies may cancel out, causing a thin or hollow sound', 'The stereo width increases'], correct: 2, explanation: 'When stereo is summed to mono, any out-of-phase content between left and right channels cancels. This can make elements sound thin, hollow, or disappear entirely. Mono compatibility checking is essential because many real-world playback systems (phones, PA systems, Bluetooth speakers) sum to mono.', difficulty: 'advanced' },
  { q: 'What is the LCR panning approach?', options: ['Panning instruments only to Left, Centre, or Right \u2014 avoiding in-between positions', 'Using three speakers instead of two', 'A surround sound technique', 'Panning in a circular motion'], correct: 0, explanation: 'LCR (Left, Centre, Right) is a mixing strategy where instruments are panned hard left, dead centre, or hard right \u2014 with minimal use of in-between positions. This creates a bold, wide mix with clear separation, famously used in classic recordings.', difficulty: 'intermediate' },
  { q: 'In Mid-Side (M-S) processing, what does the "Side" signal contain?', options: ['The mono centre information', 'The difference between left and right channels (stereo width)', 'Only the bass frequencies', 'The reverb signal'], correct: 1, explanation: 'The Side signal is derived by subtracting right from left (L\u2013R), capturing only the difference information \u2014 the stereo width content. The Mid signal (L+R) captures the centre/mono content. Adjusting the Side level controls stereo width independently.', difficulty: 'advanced' },
  { q: 'Which stereo mic technique has the best mono compatibility?', options: ['A-B (spaced pair)', 'X-Y (coincident pair)', 'Decca Tree', 'Room microphones'], correct: 1, explanation: 'X-Y has the best mono compatibility of common stereo techniques because the capsules are at essentially the same point in space. This means there are no significant time-of-arrival differences between channels, so minimal phase cancellation occurs when summed to mono.', difficulty: 'intermediate' },
  { q: 'What is the Haas effect and how does it relate to stereo?', options: ['A type of distortion in stereo recordings', 'A short delay (1\u201335 ms) applied to one channel creating a perceived shift in stereo position without obvious echo', 'A reverb technique for widening stereo', 'The effect of panning on perceived loudness'], correct: 1, explanation: 'The Haas effect (precedence effect) uses a short delay (1\u201335 ms) between left and right channels. The brain perceives the sound as coming from the earlier (undelayed) side, creating apparent stereo width from a mono source. Care is needed as it can cause phase issues in mono.', difficulty: 'advanced' },
  { q: 'A mix engineer pans the hi-hat to 40% right and the ride cymbal to 40% left. What mixing principle does this demonstrate?', options: ['Frequency masking', 'Stereo balance through complementary panning', 'Mid-Side processing', 'The proximity effect'], correct: 1, explanation: 'Placing similar-sounding instruments on opposite sides of the stereo field creates balance and separation. This complementary panning approach prevents frequency masking and gives each element its own space, making the mix wider and clearer.', difficulty: 'foundation' }
];

// ============================================
// LEARN CONTENT
// ============================================
const learnSections = [
  { level: 'foundation', title: 'What Is Stereo?', content: 'Stereo audio uses two channels (left and right) to create a sense of width and spatial positioning. Unlike mono, which plays the same signal through all speakers, stereo allows the listener to perceive sounds as coming from different positions between the speakers. This mimics how we naturally hear \u2014 with two ears detecting subtle differences in timing and level.' },
  { level: 'foundation', title: 'Mono vs Stereo', content: 'A mono signal is a single channel played equally through both speakers \u2014 the sound appears to come from the centre. A stereo signal has independent left and right channels, enabling sounds to be placed across the stereo field. Mono is still important: bass instruments are typically kept in mono for power, and many playback systems (phone speakers, PA systems) sum to mono.' },
  { level: 'foundation', title: 'Basic Panning Positions', content: 'Pan (panorama) controls place a signal anywhere from hard left to hard right, with centre in the middle. Standard positions: kick drum, bass, lead vocal, and snare are typically panned centre. Hi-hats, guitars, keyboards, and backing vocals are panned off-centre to create width. Overhead drum microphones are panned left and right to capture the kit\'s stereo spread.' },
  { level: 'intermediate', title: 'Creating Width: Panning Strategy', content: 'Effective panning creates a balanced, wide mix. The LCR approach pans instruments only to hard left, centre, or hard right for bold separation. Complementary panning places similar instruments on opposite sides (e.g., two guitars, one left, one right). Consider frequency balance across the stereo field \u2014 avoid clustering all bright instruments on one side.' },
  { level: 'intermediate', title: 'Stereo Microphone Techniques', content: 'X-Y (coincident pair): Two directional mics angled at 90\u2013135\u00B0, capsules at the same point. Excellent mono compatibility, moderate width. A-B (spaced pair): Two mics spaced 30\u2013300 cm apart. Wider, more natural image but potential phase issues in mono. Both techniques are fundamental to capturing acoustic instruments and ensembles in stereo.' },
  { level: 'intermediate', title: 'Stereo and the Perception of Space', content: 'Stereo panning affects perceived depth and width. Wider-panned instruments feel further to the side; centre-panned elements feel closer and more intimate. Reverb and delay further enhance spatial perception \u2014 a dry, centre-panned vocal feels intimate, whilst a reverb-heavy, wide-panned pad feels distant. The interaction of panning, level, and effects creates the three-dimensional soundstage.' },
  { level: 'intermediate', title: 'Mid-Side Concept', content: 'Mid-Side (M-S) separates a stereo signal into Mid (centre/mono content, L+R) and Side (stereo width content, L\u2013R). By adjusting the balance between Mid and Side, you can control stereo width independently. Boosting Side increases width; reducing Side narrows the image towards mono. M-S is used in both recording (with dedicated M-S mic setups) and mixing/mastering.' },
  { level: 'advanced', title: 'Phase Issues with Stereo Techniques', content: 'Spaced microphone techniques (A-B) introduce time-of-arrival differences that create phase cancellation at specific frequencies when summed to mono. The affected frequencies depend on the spacing: f = speed of sound / (2 \u00D7 distance). This gives the lowest affected frequency; comb filtering then repeats at every integer multiple, creating a series of peaks and dips across the spectrum. Coincident techniques (X-Y) avoid this because both capsules are at the same point. Always check stereo recordings in mono to identify phase problems.' },
  { level: 'advanced', title: 'Mono Compatibility', content: 'Many real-world playback systems are mono or near-mono: phone speakers, Bluetooth speakers, club PA systems, and AM radio. When stereo is collapsed to mono, any out-of-phase content cancels. Mix engineers must regularly check mixes in mono. Instruments that disappear or become thin in mono indicate phase issues that need addressing \u2014 often by narrowing the stereo width or adjusting timing.' },
  { level: 'advanced', title: 'Stereo Automation and Movement', content: 'Pan automation moves instruments across the stereo field over time, creating dynamic spatial interest. Examples include auto-panning effects on guitars, gradual widening during a chorus, or dramatic left-to-right sweeps. Automation must be purposeful \u2014 excessive movement is distracting. Subtle automation (e.g., slightly widening backing vocals in the chorus) is more effective than extreme panning changes.' },
  { level: 'advanced', title: 'Haas Effect for Stereo Widening', content: 'The Haas effect (precedence effect) uses a short delay (1\u201335 ms) on one channel of a duplicated mono signal. The brain perceives the sound as coming from the undelayed side, creating apparent stereo width without an obvious echo. This widens mono sources effectively but requires careful mono compatibility checking, as the delayed signal will partially cancel when summed.' }
];

// ============================================
// INSTRUMENT PRESETS
// ============================================
const INSTRUMENT_PRESETS = {
  rock: { name: 'Rock Band', instruments: [
    { id: 'kick', label: 'Kick', pan: 0, emoji: '\u{1F941}' },
    { id: 'snare', label: 'Snare', pan: 0, emoji: '\u{1FA98}' },
    { id: 'hihat', label: 'Hi-Hat', pan: 35, emoji: '\u{1F514}' },
    { id: 'oh_l', label: 'OH L', pan: -60, emoji: '\u{1F3A4}' },
    { id: 'oh_r', label: 'OH R', pan: 60, emoji: '\u{1F3A4}' },
    { id: 'bass', label: 'Bass', pan: 0, emoji: '\u{1F3B8}' },
    { id: 'gtr_l', label: 'Guitar L', pan: -70, emoji: '\u{1F3B8}' },
    { id: 'gtr_r', label: 'Guitar R', pan: 70, emoji: '\u{1F3B8}' },
    { id: 'vocal', label: 'Lead Vocal', pan: 0, emoji: '\u{1F399}\uFE0F' },
    { id: 'bvox_l', label: 'BV L', pan: -40, emoji: '\u{1F3A4}' },
    { id: 'bvox_r', label: 'BV R', pan: 40, emoji: '\u{1F3A4}' },
  ]},
  orchestra: { name: 'Orchestra', instruments: [
    { id: 'violin1', label: 'Violin I', pan: -60, emoji: '\u{1F3BB}' },
    { id: 'violin2', label: 'Violin II', pan: -30, emoji: '\u{1F3BB}' },
    { id: 'viola', label: 'Viola', pan: 20, emoji: '\u{1F3BB}' },
    { id: 'cello', label: 'Cello', pan: 50, emoji: '\u{1F3BB}' },
    { id: 'dbass', label: 'D. Bass', pan: 70, emoji: '\u{1F3BB}' },
    { id: 'flute', label: 'Flute', pan: -45, emoji: '\u{1F3B5}' },
    { id: 'oboe', label: 'Oboe', pan: -15, emoji: '\u{1F3B5}' },
    { id: 'horn', label: 'Horn', pan: 40, emoji: '\u{1F4EF}' },
    { id: 'timpani', label: 'Timpani', pan: 0, emoji: '\u{1F941}' },
  ]},
  electronic: { name: 'Electronic', instruments: [
    { id: 'kick', label: 'Kick', pan: 0, emoji: '\u{1F941}' },
    { id: 'snare', label: 'Snare/Clap', pan: 0, emoji: '\u{1FA98}' },
    { id: 'hihat', label: 'Hi-Hat', pan: 25, emoji: '\u{1F514}' },
    { id: 'bass', label: 'Sub Bass', pan: 0, emoji: '\u{1F50A}' },
    { id: 'lead', label: 'Lead Synth', pan: 0, emoji: '\u{1F3B9}' },
    { id: 'pad_l', label: 'Pad L', pan: -80, emoji: '\u{1F3B9}' },
    { id: 'pad_r', label: 'Pad R', pan: 80, emoji: '\u{1F3B9}' },
    { id: 'perc', label: 'Perc', pan: -45, emoji: '\u{1F514}' },
    { id: 'fx', label: 'FX', pan: 55, emoji: '\u2728' },
    { id: 'vocal', label: 'Vocal', pan: 0, emoji: '\u{1F399}\uFE0F' },
  ]},
  singer: { name: 'Singer-Songwriter', instruments: [
    { id: 'vocal', label: 'Vocal', pan: 0, emoji: '\u{1F399}\uFE0F' },
    { id: 'acoustic', label: 'Acoustic Gtr', pan: -30, emoji: '\u{1F3B8}' },
    { id: 'piano_l', label: 'Piano L', pan: -50, emoji: '\u{1F3B9}' },
    { id: 'piano_r', label: 'Piano R', pan: 50, emoji: '\u{1F3B9}' },
    { id: 'bass', label: 'Bass', pan: 0, emoji: '\u{1F3B8}' },
    { id: 'strings_l', label: 'Strings L', pan: -65, emoji: '\u{1F3BB}' },
    { id: 'strings_r', label: 'Strings R', pan: 65, emoji: '\u{1F3BB}' },
  ]}
};

// ============================================
// CHALLENGE TARGETS (correct pan positions)
// ============================================
const challengeTargets = [
  { id: 'kick', label: 'Kick Drum', correctPan: 0, tolerance: 10 },
  { id: 'bass', label: 'Bass Guitar', correctPan: 0, tolerance: 10 },
  { id: 'vocal', label: 'Lead Vocal', correctPan: 0, tolerance: 10 },
  { id: 'hihat', label: 'Hi-Hat', correctPan: 35, tolerance: 20 },
  { id: 'gtr_l', label: 'Rhythm Guitar L', correctPan: -70, tolerance: 20 },
  { id: 'gtr_r', label: 'Rhythm Guitar R', correctPan: 70, tolerance: 20 },
];

// ============================================
// MAIN COMPONENT
// ============================================
const StereoPanning = () => {
  const [activeTab, setActiveTab] = useState('learn');
  const tabs = [
    { id: 'learn', label: 'Learn' },
    { id: 'interactive', label: 'Interactive' },
    { id: 'quiz', label: 'Quiz' },
    { id: 'reference', label: 'Reference' }
  ];

  // Design token injection
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = DESIGN_TOKENS_CSS;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Learn state
  const [learnFilter, setLearnFilter] = useState('all');
  const [expandedSections, setExpandedSections] = useState({});

  // Interactive state
  const [activePreset, setActivePreset] = useState('rock');
  const [instruments, setInstruments] = useState(INSTRUMENT_PRESETS.rock.instruments);
  const [dragging, setDragging] = useState(null);
  const [micMode, setMicMode] = useState('xy');
  const [micAngle, setMicAngle] = useState(110);
  const [micSpacing, setMicSpacing] = useState(60);
  const [monoCheck, setMonoCheck] = useState(false);
  const [challengeActive, setChallengeActive] = useState(false);
  const [challengeScore, setChallengeScore] = useState({ correct: 0, total: 0 });
  const [challengeSubmitted, setChallengeSubmitted] = useState(false);
  const [challengeInstruments, setChallengeInstruments] = useState([]);
  const stageRef = useRef(null);
  const micCanvasRef = useRef(null);

  // Quiz state
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);

  // CSS injection for press feedback
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = '[data-press]:active { transform: scale(0.97) !important; transition: transform 100ms cubic-bezier(0.34, 1.56, 0.64, 1) !important; }';
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  const toggleSection = (idx) => setExpandedSections(prev => ({ ...prev, [idx]: !prev[idx] }));

  // Load preset
  const loadPreset = (key) => {
    setActivePreset(key);
    setInstruments(INSTRUMENT_PRESETS[key].instruments.map(i => ({ ...i })));
    setChallengeActive(false);
  };

  // ============================================
  // STAGE CANVAS (stereo field visualisation)
  // ============================================
  const drawStage = useCallback(() => {
    const canvas = stageRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = 500, h = 340;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = '#060A14';
    ctx.fillRect(0, 0, w, h);

    // Centre line
    ctx.strokeStyle = 'rgba(201, 184, 122, 0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h); ctx.stroke();
    ctx.setLineDash([]);

    // Grid lines at 25% intervals
    [0.25, 0.75].forEach(frac => {
      ctx.strokeStyle = 'rgba(74, 127, 212, 0.06)';
      ctx.beginPath(); ctx.moveTo(w * frac, 0); ctx.lineTo(w * frac, h); ctx.stroke();
    });

    // Speaker labels
    ctx.fillStyle = '#C9B87A';
    ctx.font = "10px 'Inter', system-ui, sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText('L', 20, 20);
    ctx.fillText('R', w - 20, 20);
    ctx.fillText('C', w / 2, 20);

    // Pan scale
    ctx.fillStyle = 'rgba(232, 228, 223, 0.3)';
    ctx.font = "9px 'Geist Mono', monospace";
    for (let p = -100; p <= 100; p += 25) {
      const x = ((p + 100) / 200) * (w - 40) + 20;
      ctx.fillText(p === 0 ? 'C' : `${p}`, x, h - 8);
    }

    // Mono overlay
    if (monoCheck) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.08)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#EF4444';
      ctx.font = "bold 12px 'Inter', system-ui, sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText('MONO CHECK \u2014 All sources collapse to centre', w / 2, h - 24);
    }

    // Draw instruments
    const list = challengeActive ? challengeInstruments : instruments;
    list.forEach((inst, i) => {
      const pan = monoCheck ? 0 : inst.pan;
      const x = ((pan + 100) / 200) * (w - 40) + 20;
      const y = 50 + (i % 6) * 45 + (i >= 6 ? 20 : 0);

      // Circle
      ctx.fillStyle = dragging === i ? '#FF6B35' : 'rgba(74, 127, 212, 0.25)';
      ctx.beginPath(); ctx.arc(x, y, 18, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = dragging === i ? '#FF6B35' : 'rgba(201, 184, 122, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Emoji
      ctx.font = '14px serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#F0EDE8';
      ctx.fillText(inst.emoji, x, y + 5);

      // Label
      ctx.font = "9px 'Inter', system-ui, sans-serif";
      ctx.fillStyle = dragging === i ? '#FF6B35' : 'rgba(232, 228, 223, 0.7)';
      ctx.fillText(inst.label, x, y + 32);

      // Pan value
      ctx.font = "8px 'Geist Mono', monospace";
      ctx.fillStyle = 'rgba(201, 184, 122, 0.6)';
      const panLabel = inst.pan === 0 ? 'C' : (inst.pan < 0 ? `L${Math.abs(inst.pan)}` : `R${inst.pan}`);
      ctx.fillText(panLabel, x, y - 22);
    });
  }, [instruments, challengeInstruments, challengeActive, dragging, monoCheck]);

  // The canvas is mounted by its tab, which happens after an effect on mount
  // would have run — and switching tabs changes none of drawStage's deps, so
  // the effect never fired again and the stage stayed blank. Drawing from the
  // ref callback covers both: React invokes it when the node attaches, and
  // again whenever drawStage changes identity.
  const attachStage = useCallback((node) => {
    stageRef.current = node;
    if (node) drawStage();
  }, [drawStage]);

  // ============================================
  // MIC TECHNIQUE CANVAS
  // ============================================
  const drawMicDiagram = useCallback(() => {
    const canvas = micCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = 300, h = 220;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#060A14';
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2, cy = h * 0.65;

    if (micMode === 'xy') {
      const halfAngle = (micAngle / 2) * (Math.PI / 180);
      const micLen = 50;
      // Left mic
      ctx.strokeStyle = '#FF6B35';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx - Math.sin(halfAngle) * micLen, cy - Math.cos(halfAngle) * micLen);
      ctx.stroke();
      // Right mic
      ctx.strokeStyle = '#4A7FD4';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.sin(halfAngle) * micLen, cy - Math.cos(halfAngle) * micLen);
      ctx.stroke();
      // Capsule point
      ctx.fillStyle = '#C9B87A';
      ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill();
      // Pickup arcs
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = '#FF6B35';
      ctx.beginPath(); ctx.arc(cx, cy, 70, -Math.PI / 2 - halfAngle - 0.5, -Math.PI / 2 - halfAngle + 0.5); ctx.lineTo(cx, cy); ctx.fill();
      ctx.fillStyle = '#4A7FD4';
      ctx.beginPath(); ctx.arc(cx, cy, 70, -Math.PI / 2 + halfAngle - 0.5, -Math.PI / 2 + halfAngle + 0.5); ctx.lineTo(cx, cy); ctx.fill();
      ctx.globalAlpha = 1;
      // Labels
      ctx.fillStyle = '#C9B87A';
      ctx.font = "10px 'Inter', system-ui, sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText(`X-Y Coincident \u2014 ${micAngle}\u00B0`, cx, 20);
      ctx.fillStyle = 'rgba(232, 228, 223, 0.5)';
      ctx.font = "9px 'Inter', system-ui, sans-serif";
      ctx.fillText('Capsules at same point', cx, 36);
      ctx.fillText('Mono compatible \u2713', cx, h - 10);
    } else {
      const spacing = micSpacing * 1.2;
      const micLen = 40;
      // Left mic
      ctx.strokeStyle = '#FF6B35';
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(cx - spacing / 2, cy); ctx.lineTo(cx - spacing / 2, cy - micLen); ctx.stroke();
      ctx.fillStyle = '#FF6B35';
      ctx.beginPath(); ctx.arc(cx - spacing / 2, cy - micLen, 4, 0, Math.PI * 2); ctx.fill();
      // Right mic
      ctx.strokeStyle = '#4A7FD4';
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(cx + spacing / 2, cy); ctx.lineTo(cx + spacing / 2, cy - micLen); ctx.stroke();
      ctx.fillStyle = '#4A7FD4';
      ctx.beginPath(); ctx.arc(cx + spacing / 2, cy - micLen, 4, 0, Math.PI * 2); ctx.fill();
      // Spacing indicator
      ctx.strokeStyle = 'rgba(201, 184, 122, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(cx - spacing / 2, cy + 15); ctx.lineTo(cx + spacing / 2, cy + 15); ctx.stroke();
      ctx.setLineDash([]);
      // Labels
      ctx.fillStyle = '#C9B87A';
      ctx.font = "10px 'Inter', system-ui, sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText(`A-B Spaced \u2014 ${micSpacing} cm`, cx, 20);
      ctx.fillStyle = 'rgba(232, 228, 223, 0.5)';
      ctx.font = "9px 'Inter', system-ui, sans-serif";
      ctx.fillText('Capsules spaced apart', cx, 36);
      ctx.fillText('Phase risk in mono \u26A0', cx, h - 10);
    }
  }, [micMode, micAngle, micSpacing]);

  // same tab-mount problem as the stage canvas above
  const attachMicCanvas = useCallback((node) => {
    micCanvasRef.current = node;
    if (node) drawMicDiagram();
  }, [drawMicDiagram]);

  // ============================================
  // DRAG HANDLING
  // ============================================
  const handleStageMouseDown = (e) => {
    const canvas = stageRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const w = 500;
    const list = challengeActive ? challengeInstruments : instruments;
    for (let i = 0; i < list.length; i++) {
      const pan = monoCheck ? 0 : list[i].pan;
      const x = ((pan + 100) / 200) * (w - 40) + 20;
      const y = 50 + (i % 6) * 45 + (i >= 6 ? 20 : 0);
      if (Math.hypot(mx - x, my - y) < 22) {
        setDragging(i);
        return;
      }
    }
  };

  const handleStageMouseMove = (e) => {
    if (dragging === null) return;
    const canvas = stageRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const w = 500;
    const newPan = Math.round(Math.min(100, Math.max(-100, ((mx - 20) / (w - 40)) * 200 - 100)));
    if (challengeActive) {
      setChallengeInstruments(prev => prev.map((inst, i) => i === dragging ? { ...inst, pan: newPan } : inst));
    } else {
      setInstruments(prev => prev.map((inst, i) => i === dragging ? { ...inst, pan: newPan } : inst));
    }
  };

  const handleStageMouseUp = () => setDragging(null);

  // Challenge mode
  const startChallenge = () => {
    setChallengeInstruments(challengeTargets.map(t => ({ ...t, pan: 0, emoji: '\u{1F3B5}' })));
    setChallengeActive(true);
    setChallengeSubmitted(false);
    setChallengeScore({ correct: 0, total: 0 });
  };

  const submitChallenge = () => {
    let correct = 0;
    challengeInstruments.forEach((inst, i) => {
      if (Math.abs(inst.pan - challengeTargets[i].correctPan) <= challengeTargets[i].tolerance) correct++;
    });
    setChallengeScore({ correct, total: challengeTargets.length });
    setChallengeSubmitted(true);
  };

  const resetInteractive = () => {
    loadPreset('rock');
    setMonoCheck(false);
    setChallengeActive(false);
    setMicMode('xy');
    setMicAngle(110);
    setMicSpacing(60);
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
    <div className="stereo-panning-root" style={{
      fontFamily: FONT_BODY,
      background: isCanvasTab ? 'var(--canvas-background)' : 'var(--background)',
      color: isCanvasTab ? 'var(--canvas-foreground)' : 'var(--foreground)',
      minHeight: '100vh',
      transition: 'background var(--duration-normal) var(--ease-out), color var(--duration-normal) var(--ease-out)'
    }} data-mode={isCanvasTab ? 'canvas' : undefined}>

      {/* Header */}
      <div style={{ padding: 'var(--space-8) var(--space-6) var(--space-4)', textAlign: 'center' }}>
        <div style={{ fontSize: 'var(--text-xs)', fontWeight: '300', textTransform: 'uppercase', letterSpacing: '0.2em', color: isCanvasTab ? 'var(--canvas-highlight)' : 'var(--accent)', marginBottom: 'var(--space-2)' }}>
          Topics 1.10, 1.2 &middot; Component 4
        </div>
        <h1 style={{ fontFamily: FONT_HEADING, fontWeight: 900, fontSize: 'var(--text-4xl)', margin: 0, color: isCanvasTab ? 'var(--canvas-foreground)' : 'var(--foreground)' }}>
          Stereo &amp; Panning
        </h1>
      </div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${isCanvasTab ? 'var(--canvas-border)' : 'var(--border)'}`, margin: '0 var(--space-6)' }}>
        {tabs.map(tab => (
          <button type="button" data-press key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            flex: 1, padding: 'var(--space-3)', fontSize: 'var(--text-xs)', fontWeight: '600',
            fontFamily: FONT_BODY, textTransform: 'uppercase', letterSpacing: '0.05em',
            color: activeTab === tab.id ? 'var(--accent)' : (isCanvasTab ? 'var(--canvas-foreground-tertiary)' : 'var(--foreground-tertiary)'),
            background: activeTab === tab.id ? 'var(--accent-soft)' : 'transparent',
            borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
            border: 'none', cursor: 'pointer', transition: 'transform, opacity, background-color, color, border-color, box-shadow var(--duration-fast) var(--ease-out)'
          }}>{tab.label}</button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ padding: 'var(--space-6)', maxWidth: '900px', margin: '0 auto' }}>

        {/* ============ LEARN TAB ============ */}
        {activeTab === 'learn' && (
          <div>
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)', flexWrap: 'wrap' }}>
              {[{ id: 'all', label: 'All Topics' }, { id: 'foundation', label: '\u{1F7E2} Foundation' }, { id: 'intermediate', label: '\u{1F7E1} Intermediate' }, { id: 'advanced', label: '\u{1F534} Advanced' }].map(f => (
                <button type="button" data-press key={f.id} onClick={() => setLearnFilter(f.id)} style={{
                  padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)',
                  border: `1px solid ${learnFilter === f.id ? 'var(--accent)' : 'var(--border)'}`,
                  background: learnFilter === f.id ? 'var(--accent-soft)' : 'var(--background-raised)',
                  color: learnFilter === f.id ? 'var(--accent)' : 'var(--foreground-secondary)',
                  cursor: 'pointer', fontSize: 'var(--text-sm)', fontFamily: FONT_BODY, fontWeight: '500'
                }}>{f.label}</button>
              ))}
            </div>

            {learnSections.filter(s => learnFilter === 'all' || s.level === learnFilter).map((section, idx) => (
              <StudioCard key={idx} style={{ marginBottom: 'var(--space-4)' }}>
                <button type="button" data-press onClick={() => toggleSection(idx)} style={{
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
                { artist: 'The Beatles', track: 'A Day in the Life', note: 'Early stereo experimentation with extreme panning \u2014 instruments hard left or right with little centre content, showcasing 1960s stereo mixing conventions.' },
                { artist: 'Pink Floyd', track: 'Money', note: 'Creative stereo movement and automation \u2014 sounds pan across the stereo field dynamically, demonstrating how spatial effects can serve the musical arrangement.' },
                { artist: 'Billie Eilish', track: 'Everything I Wanted', note: 'An intimate, narrow stereo field keeps the vocal close and centred, using subtle width for atmosphere whilst maintaining a modern, focused mix.' },
                { artist: 'Fleetwood Mac', track: 'Dreams', note: 'Classic rock stereo drum panning with overheads spread wide, hi-hat and ride placed off-centre, and kick/snare anchored in the middle.' }
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
            {/* Preset selector */}
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', flexWrap: 'wrap', justifyContent: 'center' }}>
              {Object.entries(INSTRUMENT_PRESETS).map(([key, preset]) => (
                <button type="button" data-press key={key} onClick={() => loadPreset(key)} style={{
                  padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)',
                  border: `1px solid ${activePreset === key && !challengeActive ? 'var(--accent)' : 'var(--canvas-border-hover)'}`,
                  background: activePreset === key && !challengeActive ? 'var(--accent-soft)' : 'var(--canvas-surface)',
                  color: activePreset === key && !challengeActive ? 'var(--accent)' : 'var(--canvas-foreground-tertiary)',
                  cursor: 'pointer', fontFamily: FONT_BODY, fontSize: 'var(--text-sm)', fontWeight: '500'
                }}>{preset.name}</button>
              ))}
            </div>

            {/* Stage Canvas */}
            <div style={{
              background: 'var(--canvas-surface)', border: '1px solid var(--canvas-border)',
              borderRadius: 'var(--radius-xl)', padding: 'var(--space-4)', marginBottom: 'var(--space-4)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: '300', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--canvas-highlight)' }}>
                  Stereo Field {challengeActive ? '\u2014 Challenge Mode' : `\u2014 ${INSTRUMENT_PRESETS[activePreset].name}`}
                </div>
                <button type="button" data-press onClick={() => setMonoCheck(m => !m)} style={{
                  padding: 'var(--space-1) var(--space-3)', borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${monoCheck ? '#EF4444' : 'var(--canvas-border-hover)'}`,
                  background: monoCheck ? 'rgba(239, 68, 68, 0.15)' : 'var(--canvas-surface)',
                  color: monoCheck ? '#EF4444' : 'var(--canvas-foreground-tertiary)',
                  cursor: 'pointer', fontSize: 'var(--text-xs)', fontFamily: FONT_BODY, fontWeight: '600'
                }} title="Simulates how your mix sounds when collapsed to mono — your pan positions are not changed.">{monoCheck ? '\u{1F50A} Mono Check: ON' : '\u{1F50A} Mono Check: OFF'}</button>
              </div>
              <canvas
                ref={attachStage}
                role="img"
                aria-label={`Stereo field showing ${(challengeActive ? challengeInstruments : instruments).map(i => `${i.label} at ${i.pan === 0 ? 'centre' : (i.pan < 0 ? `L${Math.abs(i.pan)}` : `R${i.pan}`)}`).join(', ')}`}
                style={{ display: 'block', borderRadius: 'var(--radius-lg)', cursor: dragging !== null ? 'grabbing' : 'grab', width: '100%', maxWidth: '500px', margin: '0 auto' }}
                onMouseDown={handleStageMouseDown}
                onMouseMove={handleStageMouseMove}
                onMouseUp={handleStageMouseUp}
                onMouseLeave={handleStageMouseUp}
              />
              {/* Keyboard fallback sliders — visible in challenge mode for accessible pan control */}
              {challengeActive && !challengeSubmitted && (
                <div style={{ marginTop: 'var(--space-3)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 'var(--space-2)' }}>
                  {challengeInstruments.map((inst, i) => (
                    <div key={inst.id}>
                      <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--canvas-foreground-tertiary)', fontFamily: FONT_BODY, marginBottom: 2 }}>
                        {inst.emoji} {inst.label}: {inst.pan === 0 ? 'C' : (inst.pan < 0 ? `L${Math.abs(inst.pan)}` : `R${inst.pan}`)}
                      </label>
                      <input
                        type="range" min={-100} max={100} value={inst.pan}
                        aria-label={`${inst.label} pan position`}
                        onChange={e => setChallengeInstruments(prev => prev.map((ci, idx) => idx === i ? { ...ci, pan: Number(e.target.value) } : ci))}
                        style={{ width: '100%', accentColor: '#FF6B35' }}
                      />
                    </div>
                  ))}
                </div>
              )}
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--canvas-foreground-tertiary)', textAlign: 'center', marginTop: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                Drag instruments left/right to change pan position
              </p>
              {/* Canvas colour legend */}
              <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'rgba(74, 127, 212, 0.25)', border: '1.5px solid rgba(201, 184, 122, 0.4)', flexShrink: 0 }} />
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--canvas-foreground-tertiary)', fontFamily: FONT_BODY }}>Instrument at rest</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#FF6B35', border: '1.5px solid #FF6B35', flexShrink: 0 }} />
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--canvas-foreground-tertiary)', fontFamily: FONT_BODY }}>Currently dragging</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'rgba(201, 184, 122, 0.9)', fontFamily: "'Geist Mono', monospace", fontWeight: 600 }}>R35</span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--canvas-foreground-tertiary)', fontFamily: FONT_BODY }}>Pan position value</span>
                </div>
              </div>
            </div>

            {/* Mic Technique Comparison */}
            <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
              <div style={{
                flex: '1 1 300px', background: 'var(--canvas-surface)', border: '1px solid var(--canvas-border)',
                borderRadius: 'var(--radius-xl)', padding: 'var(--space-4)'
              }}>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: '300', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--canvas-highlight)', marginBottom: 'var(--space-3)' }}>
                  Stereo Mic Techniques
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                  {[{ id: 'xy', label: 'X-Y Coincident' }, { id: 'ab', label: 'A-B Spaced' }].map(m => (
                    <button type="button" data-press key={m.id} onClick={() => setMicMode(m.id)} style={{
                      flex: 1, padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)',
                      border: `1px solid ${micMode === m.id ? 'var(--accent)' : 'var(--canvas-border-hover)'}`,
                      background: micMode === m.id ? 'var(--accent-soft)' : 'transparent',
                      color: micMode === m.id ? 'var(--accent)' : 'var(--canvas-foreground-tertiary)',
                      cursor: 'pointer', fontSize: 'var(--text-xs)', fontFamily: FONT_BODY, fontWeight: '500'
                    }}>{m.label}</button>
                  ))}
                </div>
                <canvas ref={attachMicCanvas} style={{ display: 'block', borderRadius: 'var(--radius-lg)', margin: '0 auto' }} />
                {micMode === 'xy' ? (
                  <div style={{ marginTop: 'var(--space-3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-1)' }}>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--canvas-foreground-tertiary)' }}>Angle</span>
                      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--accent)', fontFamily: "'Geist Mono', monospace" }}>{micAngle}&deg;</span>
                    </div>
                    <input aria-label={`X-Y microphone angle, ${micAngle} degrees`} type="range" min={60} max={180} value={micAngle} onChange={e => setMicAngle(parseInt(e.target.value))}
                      style={{ width: '100%', accentColor: '#FF6B35' }} />
                  </div>
                ) : (
                  <div style={{ marginTop: 'var(--space-3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-1)' }}>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--canvas-foreground-tertiary)' }}>Spacing</span>
                      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--accent)', fontFamily: "'Geist Mono', monospace" }}>{micSpacing} cm</span>
                    </div>
                    <input aria-label={`A-B microphone spacing, ${micSpacing} centimetres`} type="range" min={30} max={300} step={5} value={micSpacing} onChange={e => setMicSpacing(parseInt(e.target.value))}
                      style={{ width: '100%', accentColor: '#FF6B35' }} />
                  </div>
                )}
              </div>

              {/* Pan Readout */}
              <div style={{
                flex: '1 1 240px', background: 'var(--canvas-surface)', border: '1px solid var(--canvas-border)',
                borderRadius: 'var(--radius-xl)', padding: 'var(--space-4)'
              }}>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: '300', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--canvas-highlight)', marginBottom: 'var(--space-3)' }}>
                  Pan Positions
                </div>
                <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                  {(challengeActive ? challengeInstruments : instruments).map((inst, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-1) 0', borderBottom: '1px solid rgba(74, 127, 212, 0.06)' }}>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--canvas-foreground-secondary)' }}>{inst.emoji} {inst.label}</span>
                      <span style={{ fontSize: 'var(--text-xs)', fontFamily: "'Geist Mono', monospace", color: inst.pan === 0 ? '#10B981' : 'var(--canvas-highlight)' }}>
                        {inst.pan === 0 ? 'C' : (inst.pan < 0 ? `L${Math.abs(inst.pan)}` : `R${inst.pan}`)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Challenge Section */}
            <div style={{ background: 'var(--canvas-surface)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)', border: '1px solid var(--canvas-border)' }}>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: '300', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--canvas-highlight)', marginBottom: 'var(--space-2)' }}>Challenge Mode</div>
              <h3 style={{ fontFamily: FONT_HEADING, fontWeight: 700, fontSize: 'var(--text-xl)', margin: '0 0 var(--space-4)', color: 'var(--canvas-foreground)' }}>Place the Instruments</h3>
              <p style={{ color: 'var(--canvas-foreground-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)', lineHeight: '1.5' }}>
                Drag each instrument to its correct pan position in a standard rock mix. Kick, bass, and lead vocal should be centre; hi-hat off-centre to the right (audience perspective); guitars panned wide.
              </p>
              {!challengeActive ? (
                <button type="button" data-press onClick={startChallenge} style={{
                  padding: 'var(--space-3) var(--space-6)', background: 'var(--accent)',
                  border: 'none', borderRadius: 'var(--radius-md)', color: '#fff',
                  cursor: 'pointer', fontFamily: FONT_BODY, fontSize: 'var(--text-sm)', fontWeight: '600'
                }}>Start Challenge</button>
              ) : !challengeSubmitted ? (
                <button type="button" data-press onClick={submitChallenge} style={{
                  padding: 'var(--space-3) var(--space-6)', background: 'var(--accent)',
                  border: 'none', borderRadius: 'var(--radius-md)', color: '#fff',
                  cursor: 'pointer', fontFamily: FONT_BODY, fontSize: 'var(--text-sm)', fontWeight: '600'
                }}>Check Positions</button>
              ) : (
                <div>
                  <div style={{
                    padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-4)',
                    background: challengeScore.correct === challengeScore.total ? 'rgba(5, 150, 105, 0.15)' : 'rgba(74, 127, 212, 0.1)',
                    border: `1px solid ${challengeScore.correct === challengeScore.total ? 'var(--success)' : 'var(--canvas-border-hover)'}`
                  }}>
                    <strong style={{ color: challengeScore.correct === challengeScore.total ? 'var(--success)' : 'var(--canvas-foreground)' }}>
                      {challengeScore.correct}/{challengeScore.total} correct
                    </strong>
                    <div style={{ marginTop: 'var(--space-2)' }}>
                      {challengeInstruments.map((inst, i) => {
                        const target = challengeTargets[i];
                        const isCorrect = Math.abs(inst.pan - target.correctPan) <= target.tolerance;
                        const reason = target.id === 'hihat' && !isCorrect
                          ? ' \u2014 Hi-hat is conventionally placed right from the audience\'s perspective, mirroring the drummer\'s right hand.'
                          : '';
                        return (
                          <div key={i} style={{ fontSize: 'var(--text-xs)', color: isCorrect ? 'var(--success)' : '#EF4444', marginTop: 'var(--space-1)' }}>
                            {isCorrect ? '\u2713' : '\u2717'} {target.label}: you placed {inst.pan === 0 ? 'C' : (inst.pan < 0 ? `L${Math.abs(inst.pan)}` : `R${inst.pan}`)} (target: {target.correctPan === 0 ? 'C' : (target.correctPan < 0 ? `L${Math.abs(target.correctPan)}` : `R${target.correctPan}`)}){reason}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <button type="button" data-press onClick={startChallenge} style={{
                    padding: 'var(--space-2) var(--space-5)', background: 'var(--canvas-surface)',
                    border: '1px solid var(--canvas-border-hover)', borderRadius: 'var(--radius-md)',
                    color: 'var(--canvas-foreground-tertiary)', cursor: 'pointer', fontFamily: FONT_BODY, fontSize: 'var(--text-sm)'
                  }}>Try Again</button>
                </div>
              )}
            </div>

            {/* Reset */}
            <button type="button" data-press onClick={resetInteractive} style={{
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

                      const prefix = showFeedback && isCorrect ? '✓ ' : showFeedback && isSelected && !isCorrect ? '✗ ' : '';
                      return (
                        <button type="button" data-press key={i} onClick={() => handleAnswer(i)} style={{
                          padding: 'var(--space-3) var(--space-4)', background: bg,
                          border: `2px solid ${borderColor}`, borderRadius: 'var(--radius-md)',
                          cursor: showFeedback ? 'default' : 'pointer', textAlign: 'left',
                          fontSize: 'var(--text-base)', fontFamily: FONT_BODY, color: 'var(--foreground)',
                          transition: 'transform, opacity, background-color, color, border-color, box-shadow var(--duration-fast) var(--ease-out)'
                        }}>{prefix}{opt}</button>
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
                      <button type="button" data-press onClick={nextQuestion} style={{
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
                <div style={{ fontSize: 'var(--text-4xl)', fontWeight: '700', color: score >= 8 ? 'var(--success)' : score >= 5 ? 'var(--warning)' : 'var(--error)', marginBottom: 'var(--space-4)' }}>
                  {score} / {quizQuestions.length}
                </div>
                <p style={{ color: 'var(--foreground-secondary)', fontSize: 'var(--text-base)', marginBottom: 'var(--space-6)' }}>
                  {score >= 8 ? 'Excellent understanding of stereo and panning!' : score >= 5 ? 'Good foundation \u2014 review stereo mic techniques and phase concepts.' : 'Revisit the Learn tab and try again.'}
                </p>
                <button type="button" data-press onClick={resetQuiz} style={{
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
            {/* Pan Position Table */}
            <StudioCard style={{ marginBottom: 'var(--space-6)' }}>
              <h3 style={{ fontFamily: FONT_HEADING, fontWeight: 700, fontSize: 'var(--text-xl)', margin: '0 0 var(--space-4)', color: 'var(--foreground)' }}>Pan Positions for Common Instruments</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)', fontFamily: FONT_BODY }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-strong)' }}>
                      {['Instrument', 'Typical Pan', 'Reason'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: 'var(--space-2) var(--space-3)', color: 'var(--foreground)', fontWeight: '600', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Kick Drum', 'Centre', 'Low-frequency foundation; needs equal energy in both speakers'],
                      ['Snare Drum', 'Centre (or slight offset)', 'Core rhythmic element; centre keeps it powerful and present'],
                      ['Hi-Hat', '30\u201345% Right', 'Off-centre to create separation from snare; audience perspective'],
                      ['Overheads (L/R)', '60\u201380% L/R', 'Wide stereo spread to capture the full drum kit image'],
                      ['Bass Guitar / Sub', 'Centre', 'Low frequencies need mono for power and speaker coherence'],
                      ['Lead Vocal', 'Centre', 'Focal point of the mix; centre gives maximum presence'],
                      ['Electric Guitars', '50\u201380% L or R', 'Panned wide for separation; double-tracked guitars spread L/R'],
                      ['Acoustic Guitar', '20\u201340% L or R', 'Slightly off-centre to leave room for vocals'],
                      ['Keyboards/Pads', '30\u201360% L/R', 'Spread for width; stereo pads often hard L/R'],
                      ['Backing Vocals', '30\u201360% L/R', 'Symmetric pairs create width whilst supporting centre vocal']
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

            {/* Stereo Mic Techniques Comparison */}
            <StudioCard style={{ marginBottom: 'var(--space-6)' }}>
              <h3 style={{ fontFamily: FONT_HEADING, fontWeight: 700, fontSize: 'var(--text-xl)', margin: '0 0 var(--space-4)', color: 'var(--foreground)' }}>Stereo Microphone Techniques Comparison</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)', fontFamily: FONT_BODY }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-strong)' }}>
                      {['Characteristic', 'X-Y (Coincident Pair)', 'A-B (Spaced Pair)'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: 'var(--space-2) var(--space-3)', color: 'var(--foreground)', fontWeight: '600', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Capsule Placement', 'Angled apart, capsules at the same point (coincident)', 'Spaced apart, typically 30\u2013300 cm'],
                      ['Typical Angle / Spacing', '90\u2013135\u00B0 between capsules', '30\u2013300 cm spacing (commonly 40\u201360 cm)'],
                      ['Stereo Width', 'Moderate \u2014 controlled by angle between microphones', 'Wide \u2014 natural-sounding spatial image'],
                      ['Mono Compatibility', 'Excellent \u2014 no time-of-arrival differences', 'Poor to moderate \u2014 phase cancellation risk when summed'],
                      ['Phase Issues', 'Minimal \u2014 capsules at same point eliminates timing differences', 'Possible \u2014 spacing introduces time-of-arrival differences'],
                      ['Best Used For', 'Ensembles, choirs, acoustic instruments where mono compatibility matters', 'Orchestras, ambient recordings, situations where width is priority'],
                      ['Advantages', 'Reliable mono compatibility; easy to set up; consistent imaging', 'Wide, natural stereo image; sense of space and depth; immersive sound'],
                      ['Disadvantages', 'Narrower stereo image; less sense of natural space', 'Phase cancellation in mono; less precise imaging; requires careful placement']
                    ].map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                        {row.map((cell, j) => (
                          <td key={j} style={{ padding: 'var(--space-2) var(--space-3)', color: j === 0 ? 'var(--accent)' : 'var(--foreground-secondary)', lineHeight: '1.5' }}>{cell}</td>
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
                { term: 'Stereo Field', def: 'The perceived left-to-right spatial spread of sound between two speakers (or headphones). Also called the stereo image.' },
                { term: 'Panning (Pan)', def: 'The distribution of a mono signal across the left and right channels. A pan pot (panoramic potentiometer) controls the position from hard left through centre to hard right.' },
                { term: 'Mono Compatibility', def: 'How well a stereo mix translates when summed to a single channel. Good mono compatibility means minimal phase cancellation when L+R are combined.' },
                { term: 'X-Y (Coincident Pair)', def: 'A stereo microphone technique using two directional microphones angled apart with capsules at the same point. Excellent mono compatibility, moderate stereo width.' },
                { term: 'A-B (Spaced Pair)', def: 'A stereo microphone technique with two microphones spaced apart (typically 30\u2013300 cm). Creates a wide, natural stereo image but may have phase issues in mono.' },
                { term: 'Mid-Side (M-S)', def: 'A stereo technique that separates audio into Mid (centre, L+R) and Side (width, L\u2013R) components. Allows independent control of stereo width.' },
                { term: 'LCR Panning', def: 'A mixing approach where instruments are panned only to hard Left, Centre, or hard Right, avoiding intermediate positions. Creates bold, clearly defined stereo separation.' },
                { term: 'Haas Effect', def: 'Also called the precedence effect. A short delay (1\u201335 ms) between left and right channels causes the brain to perceive the sound as coming from the earlier side, creating apparent stereo width.' },
                { term: 'Phase Cancellation', def: 'When two versions of a signal are combined with timing differences, certain frequencies cancel (destructive interference), causing a thin or hollow sound.' }
              ].map((item, i) => (
                <CopyableNote key={i} title={item.term} color="var(--accent)" variant="definition">
                  {item.def}
                </CopyableNote>
              ))}
            </StudioCard>

            {/* Exam Tips */}
            <StudioCard style={{ marginBottom: 'var(--space-6)' }}>
              <h3 style={{ fontFamily: FONT_HEADING, fontWeight: 700, fontSize: 'var(--text-xl)', margin: '0 0 var(--space-4)', color: 'var(--foreground)' }}>Exam Tips</h3>
              {[
                'When describing a stereo mix, always specify the pan position AND the reason \u2014 e.g., "The bass is panned centre to maintain a solid low-frequency foundation." Examiners want both the observation and the justification.',
                'Know the difference between X-Y and A-B stereo techniques. For comparison questions, mention: capsule placement (coincident vs spaced), stereo width (moderate vs wide), and mono compatibility (good vs problematic).',
                'If asked about mono compatibility, explain WHAT happens (phase cancellation when L+R are summed) and WHY it matters (phone speakers, PA systems, Bluetooth speakers sum to mono). Give real-world examples.',
                'For questions about stereo panning in a mix, always consider frequency balance across the stereo field. Avoid clustering all high-frequency instruments on one side \u2014 maintain a balanced spectral image.',
                'The Haas effect is a common extended-response topic. Explain the mechanism (short delay, 1\u201335 ms), the perceptual result (sound shifts to the undelayed side), AND the limitation (phase cancellation in mono).'
              ].map((tip, i) => (
                <CopyableNote key={i} title={`Tip ${i + 1}`} color="var(--secondary)" variant="exam">
                  {tip}
                </CopyableNote>
              ))}
            </StudioCard>

            {/* Real-World Examples */}
            <StudioCard>
              <h3 style={{ fontFamily: FONT_HEADING, fontWeight: 700, fontSize: 'var(--text-xl)', margin: '0 0 var(--space-4)', color: 'var(--foreground)' }}>
                {'\u{1F3B5}'} Real-World Examples
              </h3>
              {[
                { artist: 'The Beatles', track: 'A Day in the Life', note: 'Extreme stereo panning typical of 1960s mixes \u2014 instruments placed hard left or hard right with minimal centre content. Demonstrates early experimentation with stereo as a creative tool.' },
                { artist: 'Pink Floyd', track: 'Money', note: 'Dynamic stereo automation moves sound effects and instruments across the stereo field, using panning as an integral part of the artistic arrangement.' },
                { artist: 'Billie Eilish', track: 'Everything I Wanted', note: 'A deliberately narrow stereo field creates intimacy. The vocal sits close and central whilst subtle width is used sparingly for atmospheric elements.' },
                { artist: 'Fleetwood Mac', track: 'Dreams', note: 'Classic rock stereo panning: drum overheads spread wide, hi-hat and ride off-centre, kick and snare anchored centre. A template for balanced drum imaging.' }
              ].map((ex, i) => (
                <div key={i} style={{ padding: 'var(--space-3) 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
                  <strong style={{ color: 'var(--accent)' }}>{ex.artist}</strong> &mdash; &ldquo;{ex.track}&rdquo;
                  <p style={{ margin: 'var(--space-1) 0 0', color: 'var(--foreground-secondary)', fontSize: 'var(--text-sm)', lineHeight: '1.5' }}>{ex.note}</p>
                </div>
              ))}
            </StudioCard>
          </div>
        )}
      </div>
    </div>
  );
};

export default StereoPanning;
