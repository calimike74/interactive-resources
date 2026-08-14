'use client';

import { Fragment, useState, useEffect, useRef, useCallback, useMemo } from 'react';

// ============================================
// Mixing & Production
// A-Level Music Technology — Topic 1.6
// Revelation Design System (Canvas + Studio)
// ============================================

const DESIGN_TOKENS_CSS = `
  .mixing-production-root {
    --accent: #2563EB;
    --accent-soft: rgba(37, 99, 235, 0.1);
    --background: #FAFAFA;
    --background-raised: #FFFFFF;
    --foreground: #1A1A2E;
    --foreground-secondary: #4A4F5A;
    --foreground-tertiary: #8B909A;
    --border: #E5E7EB;
    --canvas-background: #0A0F1A;
    --canvas-surface: #111827;
    --canvas-surface-2: #1A2231;
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
    --moss: #5C7A4F;
    --sienna: #9C5A3C;
    --mustard: #C9B87A;
    --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
    --space-1: 0.25rem; --space-2: 0.5rem; --space-3: 0.75rem;
    --space-4: 1rem; --space-5: 1.25rem; --space-6: 1.5rem; --space-8: 2rem;
    --text-xs: 0.75rem; --text-sm: 0.875rem; --text-base: 1rem;
    --text-lg: 1.125rem; --text-xl: 1.25rem; --text-3xl: 1.875rem; --text-4xl: 2.25rem;
    --radius-md: 0.375rem; --radius-lg: 0.5rem; --radius-xl: 0.75rem;
    --duration-fast: 150ms; --duration-normal: 300ms;
    --ease-out: cubic-bezier(0.4, 0, 0.2, 1);
  }
`;

const FONT_HEADING = "var(--font-fraunces), Georgia, serif";
const FONT_BODY = "'Inter', system-ui, sans-serif";
const FONT_MONO = "'Geist Mono', ui-monospace, monospace";

// ============================================
// PRIMITIVES
// ============================================
const CopyableNote = ({ title, children, color = 'var(--annotation-info)', variant = 'definition' }) => {
  const [copied, setCopied] = useState(false);
  const contentRef = useRef(null);
  const icons = { definition: '\u{1F4DD}', key: '', exam: '\u{1F4CB}', warning: '' };
  const handleCopy = async () => {
    if (contentRef.current) {
      try {
        await navigator.clipboard.writeText(contentRef.current.innerText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch { /* no-op */ }
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
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: FONT_BODY }}>{title}</span>
        </div>
        <button type="button" data-press onClick={handleCopy} style={{
          background: copied ? 'var(--success)' : 'var(--canvas-surface)',
          border: `1px solid ${copied ? 'var(--success)' : 'var(--canvas-border-hover)'}`,
          borderRadius: 'var(--radius-md)', padding: '0.25rem 0.75rem', cursor: 'pointer',
          color: copied ? '#fff' : 'var(--canvas-foreground-tertiary)', fontSize: 'var(--text-xs)', fontFamily: FONT_BODY
        }}>{copied ? '✓ Copied!' : '\u{1F4CB} Copy'}</button>
      </div>
      <div ref={contentRef} style={{ color: 'var(--canvas-foreground-secondary)', fontSize: 'var(--text-sm)', lineHeight: 1.6, fontFamily: FONT_BODY }}>{children}</div>
    </div>
  );
};

const StudioCard = ({ children, style = {} }) => (
  <div style={{
    background: 'var(--background-raised)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)',
    boxShadow: 'var(--shadow-md)', transition: `all var(--duration-normal) var(--ease-out)`, ...style
  }}>{children}</div>
);

const DiffBadge = ({ level }) => {
  const cfg = { foundation: { emoji: '\u{1F7E2}', label: 'Foundation' }, intermediate: { emoji: '\u{1F7E1}', label: 'Intermediate' }, advanced: { emoji: '\u{1F534}', label: 'Advanced' } };
  const c = cfg[level] || cfg.foundation;
  return <span style={{ fontSize: 'var(--text-xs)', fontFamily: FONT_BODY, fontWeight: 600 }}>{c.emoji} {c.label}</span>;
};

// ============================================
// LEARN CONTENT — spec-aligned, dual-coded
// ============================================
const learnSections = [
  { level: 'foundation', title: 'What is a Mix?',
    content: 'A mix is the process of combining many recorded tracks into a coherent stereo (or mono) master. Every track must earn its place: it needs the right volume, the right pan position, the right tone, and the right effects. A great mix is one where every important element can be heard clearly without anything fighting for attention.' },
  { level: 'foundation', title: 'Balance: the volume relationships',
    content: 'Balance is the relative level of each track. The lead vocal must sit above everything else; the kick and bass form the foundation; supporting parts sit underneath. Engineers set rough balance with faders before doing anything else: if the balance is wrong, no amount of EQ or effects will fix the mix.' },
  { level: 'foundation', title: 'Panning: placing instruments left to right',
    content: 'Pan positions sound across the stereo field. Low-frequency instruments (kick, bass, low vocal) are kept centre because bass needs equal energy in both speakers to feel solid. Hi-hats, guitars, keys, and supporting elements are panned off-centre to create width and prevent masking.' },
  { level: 'intermediate', title: 'Sends, returns, and busses',
    content: 'A bus is a routing destination that several tracks can be sent to. The classic example is a reverb send: instead of putting a reverb plugin on every track, each track sends a copy of its signal to a single reverb bus. The reverb processes the summed signal once, and its output returns to the mix on a return channel. This saves CPU, glues elements together, and lets you adjust reverb amount per track using the send knob.' },
  { level: 'intermediate', title: 'Pre-fader vs post-fader sends',
    content: 'A post-fader send follows the channel fader: turn the fader down, the send signal drops too. This is normal for effects: you want the reverb to disappear when the channel does. A pre-fader send is independent of the channel fader, used for headphone mixes or parallel processing where the wet signal must be heard even when the dry channel is muted.' },
  { level: 'intermediate', title: 'Group bussing for sub-mixes',
    content: 'A group (sub-mix) bus combines related tracks under one fader. Drum kit tracks route to a Drums bus; backing vocals route to a BV bus. Now one fader controls the whole group, you can apply compression or EQ across the sub-mix (gluing it), and the main mix becomes simpler to balance.' },
  { level: 'advanced', title: 'Mixdown: the final stereo master',
    content: 'Mixdown is the moment the multitrack session is rendered to a stereo file. The master fader must never clip (peak red on the meters); peaks typically sit around −6 dBFS to leave headroom for mastering. Bounce as a high-resolution WAV (24-bit, the session sample rate). The mixdown is what gets handed to mastering or distributed.' },
  { level: 'advanced', title: 'Headroom and gain staging',
    content: 'Headroom is the space between the loudest peak and digital 0 dBFS. Modern mixing keeps individual channel peaks around −18 to −12 dBFS and the master around −6 dBFS, leaving room for the mastering engineer to add loudness without distortion. Good gain staging (setting sensible levels at every stage) keeps the noise floor low and the signal clean.' },
  { level: 'advanced', title: 'Reference tracks and translation',
    content: 'Professionals compare their mix to commercially-released reference tracks in the same genre. They listen on multiple systems (studio monitors, headphones, laptop speakers, in a car) to check the mix translates. A mix that sounds good only on one system has a problem; a mix that translates everywhere is a finished mix.' },
];

// ============================================
// QUIZ — synthesized in the Edexcel idiom (zero copyright risk)
// ============================================
const quizQuestions = [
  { q: 'In a typical pop mix, which combination of instruments would you most likely pan to the centre?',
    options: ['Kick, bass, lead vocal', 'Hi-hat, ride, shaker', 'Two rhythm guitars', 'Backing vocals only'],
    correct: 0, difficulty: 'foundation',
    explanation: 'Low-frequency instruments (kick, bass) and the lead vocal sit centre because they form the foundation and focal point of the mix. Bass-heavy material in particular needs equal energy in both speakers to feel solid and translate to mono.' },
  { q: 'What is the primary purpose of a send to a reverb bus, rather than putting a reverb on every channel?',
    options: ['It makes the reverb louder', 'It saves CPU and glues elements with a shared space', 'It removes the dry signal', 'It increases the sample rate'],
    correct: 1, difficulty: 'foundation',
    explanation: 'A single reverb processes the summed signal from many sends, which (a) uses one instance of the plugin instead of many, saving CPU, and (b) places multiple instruments in a shared acoustic space, gluing them together in the mix.' },
  { q: 'A vocalist hears the reverb disappear from their headphones every time their channel fader is pulled down. The send is set to:',
    options: ['Pre-fader', 'Post-fader', 'Pre-send', 'Mono-summed'],
    correct: 1, difficulty: 'intermediate',
    explanation: 'A post-fader send is dependent on the channel fader: lower the fader and the send signal drops with it, which is exactly what the vocalist is hearing. A pre-fader send is the opposite: it is independent of the fader, so the reverb would stay audible even with the dry channel pulled down (the setup you would choose for a dedicated headphone mix), but that is not what is happening here.' },
  { q: 'You route every drum track to a single "Drums" channel and put a compressor on it. What is this called?',
    options: ['Send and return', 'Group bus / sub-mix', 'Parallel chain', 'Master strip'],
    correct: 1, difficulty: 'intermediate',
    explanation: 'Combining related tracks (drum kit, backing vocals, strings) into a single bus is sub-mixing or group bussing. Processing the whole sub-mix glues the parts together and lets you control the whole group with one fader.' },
  { q: 'During mixdown, your master meter peaks at −0.2 dBFS. What is the most likely consequence?',
    options: ['Better translation on streaming services', 'Inter-sample peaks and clipping after conversion', 'A wider stereo image', 'A reduced noise floor'],
    correct: 1, difficulty: 'advanced',
    explanation: 'Peaks that touch close to 0 dBFS can produce inter-sample peaks once converted to lossy formats (MP3, AAC). Mixdown peaks should typically sit around −6 dBFS to leave mastering headroom and avoid distortion in playback.' },
  { q: 'A common reason to pan two rhythm guitars hard left and hard right is to:',
    options: ['Create a wider, more impactful guitar sound', 'Reduce the file size of the export', 'Eliminate the need for a reverb send', 'Bypass the master fader'],
    correct: 0, difficulty: 'foundation',
    explanation: 'Hard-panned duplicate or layered guitar parts spread the stereo image, create the sense of a "wall of guitars" and prevent the two parts from masking each other in the centre.' },
  { q: 'You apply a compressor across your full drum bus to make the kit feel more cohesive. This technique is sometimes called:',
    options: ['Side-chain compression', 'Bus / glue compression', 'Multiband compression', 'Look-ahead compression'],
    correct: 1, difficulty: 'advanced',
    explanation: 'Bus compression (also called glue compression when used gently on a drum or mix bus) processes the summed signal of a group, smoothing the dynamic relationship between parts so they feel like one performance rather than separate tracks.' },
  { q: 'An engineer has built a mix where the vocal is buried behind the snare and the bass. What should they address FIRST?',
    options: ['Add a stereo widener to the vocal', 'Re-set the static balance with faders before reaching for EQ or compression', 'Insert a multiband compressor on the master', 'Mute the bass and rebuild from the kick'],
    correct: 1, difficulty: 'intermediate',
    explanation: 'Static balance with the faders is the first job in any mix. If the level relationships are wrong, no amount of EQ, compression, or effects will resolve the masking: those tools refine a working balance, they do not replace one.' },
  { q: 'Which export format and resolution is appropriate for handing a final mixdown to a mastering engineer?',
    options: ['128 kbps MP3, mono', '24-bit WAV at the session sample rate', '16-bit FLAC down-sampled to 22.05 kHz', '8-bit raw PCM'],
    correct: 1, difficulty: 'foundation',
    explanation: 'Mixdowns delivered for mastering should be high-resolution, uncompressed: 24-bit WAV at the session sample rate (typically 44.1 or 48 kHz) preserves the full dynamic range and avoids lossy artefacts the mastering engineer would otherwise have to work around.' },
  { q: 'Why might an engineer regularly listen to their in-progress mix on laptop speakers, headphones, and in a car?',
    options: ['It gradually increases the master loudness', 'It checks the mix translates across the systems audiences actually use', 'It compresses the dynamic range', 'It widens the stereo field'],
    correct: 1, difficulty: 'intermediate',
    explanation: 'A mix must translate: sound balanced on the wide range of systems listeners actually use. Cross-system checking exposes problems (boomy bass on small speakers, harsh vocals in a car) early, before mastering, when they are still easy to fix.' },
];

// ============================================
// MIXER PRESET — eight tracks of an indie pop song
// ============================================
const TRACKS = [
  { id: 'kick',   label: 'Kick',         color: '#9C5A3C', defaultPan: 0,   defaultGain: 0.85, defaultSend: 0.00, role: 'foundation' },
  { id: 'snare',  label: 'Snare',        color: '#C9B87A', defaultPan: 0,   defaultGain: 0.78, defaultSend: 0.40, role: 'foundation' },
  { id: 'hat',    label: 'Hi-Hat',       color: '#5C7A4F', defaultPan: 30,  defaultGain: 0.55, defaultSend: 0.15, role: 'detail' },
  { id: 'bass',   label: 'Bass',         color: '#5C4A7A', defaultPan: 0,   defaultGain: 0.80, defaultSend: 0.00, role: 'foundation' },
  { id: 'gtrL',   label: 'Guitar L',     color: '#7A5C4F', defaultPan: -65, defaultGain: 0.60, defaultSend: 0.25, role: 'rhythm' },
  { id: 'gtrR',   label: 'Guitar R',     color: '#7A5C4F', defaultPan: 65,  defaultGain: 0.60, defaultSend: 0.25, role: 'rhythm' },
  { id: 'keys',   label: 'Keys',         color: '#4F6E7A', defaultPan: -25, defaultGain: 0.55, defaultSend: 0.35, role: 'pad' },
  { id: 'vocal',  label: 'Vocal',        color: '#B5523A', defaultPan: 0,   defaultGain: 0.90, defaultSend: 0.30, role: 'lead' },
];

const TARGET_BALANCE = {
  vocal: { gain: 0.90, tol: 0.10 },
  kick:  { gain: 0.85, tol: 0.10 },
  bass:  { gain: 0.80, tol: 0.10 },
  snare: { gain: 0.78, tol: 0.10 },
  hat:   { gain: 0.55, tol: 0.15 },
  gtrL:  { gain: 0.60, tol: 0.15 },
  gtrR:  { gain: 0.60, tol: 0.15 },
  keys:  { gain: 0.55, tol: 0.15 },
};

// ============================================
// MAIN COMPONENT
// ============================================
const MixingProduction = () => {
  const [activeTab, setActiveTab] = useState('learn');
  const tabs = [
    { id: 'learn', label: 'Learn' },
    { id: 'mixer', label: 'Mixer' },
    { id: 'quiz',  label: 'Quiz' },
    { id: 'reference', label: 'Reference' },
  ];

  // Inject design tokens once
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = DESIGN_TOKENS_CSS + '\n[data-press]:active { transform: scale(0.97); transition: transform 100ms cubic-bezier(0.34,1.56,0.64,1); }';
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  // Learn state
  const [learnFilter, setLearnFilter] = useState('all');
  const [expanded, setExpanded] = useState({});
  const filteredLearn = learnSections.filter(s => learnFilter === 'all' || s.level === learnFilter);

  // Mixer state
  const [trackState, setTrackState] = useState(TRACKS.map(t => ({ id: t.id, pan: t.defaultPan, gain: t.defaultGain, send: t.defaultSend, mute: false, solo: false })));
  const [reverbReturn, setReverbReturn] = useState(0.55);
  const [reverbPreFader, setReverbPreFader] = useState(false);
  const [drumBusEnabled, setDrumBusEnabled] = useState(false);
  const [drumBusComp, setDrumBusComp] = useState(0.3);
  const [masterFader, setMasterFader] = useState(0.85);
  const [scenarioStep, setScenarioStep] = useState(0);
  const [showSignalFlow, setShowSignalFlow] = useState(true);

  // Quiz state
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);

  // Derived values
  const soloed = trackState.some(t => t.solo);
  const trackInfo = (id) => {
    const def = TRACKS.find(t => t.id === id);
    const st = trackState.find(t => t.id === id);
    return { ...def, ...st };
  };

  const isAudible = (t) => {
    if (t.mute) return false;
    if (soloed && !t.solo) return false;
    return true;
  };

  const masterPeakDb = useMemo(() => {
    let sumSq = 0;
    trackState.forEach(t => {
      const audible = isAudible(t);
      if (!audible) return;
      const g = t.gain * masterFader;
      sumSq += g * g;
      // Add reverb contribution per send (pre-fader: independent of masterFader and mute; post-fader: follows masterFader)
      const rev = reverbPreFader
        ? t.send * reverbReturn * 0.6
        : (audible ? t.send * reverbReturn * masterFader * 0.6 : 0);
      sumSq += rev * rev;
    });
    // Normalise: all tracks at unity gain sum to 0 dBFS, making the Healthy zone reachable
    const peak = Math.sqrt(sumSq) / Math.sqrt(TRACKS.length);
    const db = peak > 0.0001 ? 20 * Math.log10(peak) : -60;
    return Math.min(db, 6);
  }, [trackState, masterFader, reverbReturn, reverbPreFader, soloed]);

  const masterPeakColor = masterPeakDb > -1 ? '#DC2626' : masterPeakDb > -6 ? '#D97706' : '#059669';
  const masterPeakLabel = masterPeakDb > -1 ? 'CLIPPING: pull master down' : masterPeakDb > -6 ? 'Hot: leave headroom' : 'Healthy headroom';

  // Balance comparison
  const balanceFeedback = useMemo(() => {
    const issues = [];
    trackState.forEach(t => {
      const target = TARGET_BALANCE[t.id];
      if (!target) return;
      const diff = Math.abs(t.gain - target.gain);
      if (diff > target.tol) {
        issues.push({
          id: t.id,
          label: TRACKS.find(tr => tr.id === t.id).label,
          tooLoud: t.gain > target.gain + target.tol,
          tooQuiet: t.gain < target.gain - target.tol,
        });
      }
    });
    return issues;
  }, [trackState]);

  // Mute/solo/fader/pan/send setters
  const setProp = (id, key, value) => {
    setTrackState(prev => prev.map(t => t.id === id ? { ...t, [key]: value } : t));
  };

  const loadDefaults = () => {
    setTrackState(TRACKS.map(t => ({ id: t.id, pan: t.defaultPan, gain: t.defaultGain, send: t.defaultSend, mute: false, solo: false })));
    setReverbReturn(0.55);
    setReverbPreFader(false);
    setDrumBusEnabled(false);
    setDrumBusComp(0.3);
    setMasterFader(0.85);
  };

  const startScenario = (n) => {
    setScenarioStep(n);
    if (n === 1) {
      // Foundation scenario: all faders at unity, no pans, no sends — fix balance
      setTrackState(TRACKS.map(t => ({ id: t.id, pan: 0, gain: 0.7, send: 0, mute: false, solo: false })));
      setMasterFader(0.85);
      setReverbReturn(0);
      setDrumBusEnabled(false);
    } else if (n === 2) {
      // Intermediate: balance set, now place pans and reverb sends
      setTrackState(TRACKS.map(t => ({ id: t.id, pan: 0, gain: t.defaultGain, send: 0, mute: false, solo: false })));
      setMasterFader(0.85);
      setReverbReturn(0.55);
      setDrumBusEnabled(false);
    } else if (n === 3) {
      // Advanced: mixdown — gain stage so master peaks healthy
      setTrackState(TRACKS.map(t => ({ id: t.id, pan: t.defaultPan, gain: 0.95, send: t.defaultSend, mute: false, solo: false })));
      setMasterFader(1.0);
      setReverbReturn(0.75);
      setDrumBusEnabled(true);
    }
  };

  // Quiz handlers
  const handleAnswer = (idx) => {
    if (showFeedback) return;
    setSelectedAnswer(idx);
    setShowFeedback(true);
    if (idx === quizQuestions[quizIndex].correct) setScore(s => s + 1);
  };

  const nextQuestion = () => {
    if (quizIndex + 1 >= quizQuestions.length) {
      setQuizComplete(true);
      return;
    }
    setQuizIndex(i => i + 1);
    setSelectedAnswer(null);
    setShowFeedback(false);
  };

  const resetQuiz = () => {
    setQuizIndex(0); setSelectedAnswer(null); setShowFeedback(false); setScore(0); setQuizComplete(false);
  };

  // ============================================
  // RENDER HELPERS
  // ============================================
  const renderChannelStrip = ({ id }) => {
    const t = trackInfo(id);
    const audible = isAudible(t);
    return (
      <div style={{
        background: 'var(--canvas-surface)', border: `1px solid var(--canvas-border)`,
        borderRadius: 'var(--radius-md)', padding: 'var(--space-2)',
        display: 'flex', flexDirection: 'column', alignItems: 'stretch',
        gap: 'var(--space-2)', minWidth: 84, opacity: audible ? 1 : 0.4
      }}>
        {/* Label */}
        <div style={{ textAlign: 'center', fontSize: 'var(--text-xs)', color: t.color, fontFamily: FONT_BODY, fontWeight: 600, letterSpacing: '0.05em' }}>
          {t.label.toUpperCase()}
        </div>
        {/* Pan */}
        <div>
          <div style={{ fontSize: 10, color: 'var(--canvas-foreground-tertiary)', textAlign: 'center', fontFamily: FONT_MONO, marginBottom: 2 }}>
            PAN {t.pan === 0 ? 'C' : (t.pan < 0 ? `L${Math.abs(t.pan)}` : `R${t.pan}`)}
          </div>
          <input aria-label={`${t.label} pan, ${t.pan === 0 ? 'centre' : (t.pan < 0 ? `L${Math.abs(t.pan)}` : `R${t.pan}`)}`} type="range" min={-100} max={100} value={t.pan}
            onChange={e => setProp(id, 'pan', Number(e.target.value))}
            style={{ width: '100%', accentColor: t.color }} />
        </div>
        {/* Send */}
        <div>
          <div style={{ fontSize: 10, color: 'var(--canvas-foreground-tertiary)', textAlign: 'center', fontFamily: FONT_MONO, marginBottom: 2 }}>
            SEND {Math.round(t.send * 100)}
          </div>
          <input aria-label={`${t.label} reverb send, ${Math.round(t.send * 100)}`} type="range" min={0} max={100} value={Math.round(t.send * 100)}
            onChange={e => setProp(id, 'send', Number(e.target.value) / 100)}
            style={{ width: '100%', accentColor: 'var(--moss)' }} />
        </div>
        {/* Fader — rotated range input (cross-browser vertical, Chrome 121+ compatible) */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-2) 0', height: 120, alignItems: 'center' }}>
          <input aria-label={`${t.label} fader, ${Math.round(t.gain * 100)}`} type="range" min={0} max={100} value={Math.round(t.gain * 100)}
            onChange={e => setProp(id, 'gain', Number(e.target.value) / 100)}
            style={{
              width: 110, height: 24,
              transform: 'rotate(-90deg)',
              accentColor: t.color,
              cursor: 'pointer',
            }} />
        </div>
        <div style={{ fontSize: 10, color: 'var(--canvas-foreground)', textAlign: 'center', fontFamily: FONT_MONO }}>
          {Math.round(t.gain * 100)}
        </div>
        {/* M/S buttons */}
        <div style={{ display: 'flex', gap: 4 }}>
          <button type="button" data-press onClick={() => setProp(id, 'mute', !t.mute)}
            style={{
              flex: 1, padding: '4px 0', fontSize: 10, fontFamily: FONT_BODY, fontWeight: 700,
              background: t.mute ? 'var(--error)' : 'var(--canvas-surface-2)',
              color: t.mute ? '#fff' : 'var(--canvas-foreground-tertiary)',
              border: `1px solid var(--canvas-border-hover)`, borderRadius: 4, cursor: 'pointer'
            }}>M</button>
          <button type="button" data-press onClick={() => setProp(id, 'solo', !t.solo)}
            style={{
              flex: 1, padding: '4px 0', fontSize: 10, fontFamily: FONT_BODY, fontWeight: 700,
              background: t.solo ? 'var(--warning)' : 'var(--canvas-surface-2)',
              color: t.solo ? '#fff' : 'var(--canvas-foreground-tertiary)',
              border: `1px solid var(--canvas-border-hover)`, borderRadius: 4, cursor: 'pointer'
            }}>S</button>
        </div>
      </div>
    );
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="mixing-production-root" style={{
      fontFamily: FONT_BODY, background: 'var(--background)', color: 'var(--foreground)',
      minHeight: '100vh', padding: 'var(--space-6)'
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <header style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
            <h1 style={{ fontFamily: FONT_HEADING, fontSize: 'var(--text-4xl)', fontWeight: 700 }}>Mixing &amp; Production</h1>
            <span style={{
              fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.1em',
              color: 'var(--moss)', fontWeight: 700, fontFamily: FONT_BODY
            }}>Topic 1.6</span>
          </div>
          <p style={{ color: 'var(--foreground-secondary)', fontSize: 'var(--text-lg)' }}>
            Build a working mix. Set balance, place pans, route sends to busses, gain-stage the mixdown.
          </p>
        </header>

        {/* Tab navigation */}
        <nav style={{
          display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)',
          borderBottom: '1px solid var(--border)'
        }}>
          {tabs.map(tab => (
            <button type="button" key={tab.id} data-press onClick={() => setActiveTab(tab.id)}
              style={{
                padding: 'var(--space-3) var(--space-5)', background: 'transparent',
                border: 'none', borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
                color: activeTab === tab.id ? 'var(--accent)' : 'var(--foreground-secondary)',
                fontFamily: FONT_BODY, fontSize: 'var(--text-sm)', fontWeight: 600,
                cursor: 'pointer', transition: `all var(--duration-fast) var(--ease-out)`
              }}>
              {tab.label}
            </button>
          ))}
        </nav>

        {/* LEARN TAB */}
        {activeTab === 'learn' && (
          <div>
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-5)', flexWrap: 'wrap' }}>
              {[
                { v: 'all', label: 'All' }, { v: 'foundation', label: '\u{1F7E2} Foundation' },
                { v: 'intermediate', label: '\u{1F7E1} Intermediate' }, { v: 'advanced', label: '\u{1F534} Advanced' },
              ].map(f => (
                <button type="button" key={f.v} data-press onClick={() => setLearnFilter(f.v)}
                  style={{
                    padding: 'var(--space-2) var(--space-4)',
                    background: learnFilter === f.v ? 'var(--accent)' : 'var(--background-raised)',
                    color: learnFilter === f.v ? '#fff' : 'var(--foreground-secondary)',
                    border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                    cursor: 'pointer', fontFamily: FONT_BODY, fontSize: 'var(--text-sm)', fontWeight: 600
                  }}>{f.label}</button>
              ))}
            </div>
            <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
              {filteredLearn.map((section, i) => (
                <StudioCard key={`${section.title}-${i}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-4)' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                        <DiffBadge level={section.level} />
                      </div>
                      <h3 style={{ fontFamily: FONT_HEADING, fontSize: 'var(--text-xl)', marginBottom: 'var(--space-2)' }}>{section.title}</h3>
                      <p style={{ color: 'var(--foreground-secondary)', lineHeight: 1.6 }}>{section.content}</p>
                    </div>
                  </div>
                </StudioCard>
              ))}
            </div>
            <CopyableNote title="Spec checklist 1.6" variant="exam" color="var(--moss)">
              Balance and relative level &middot; panning and stereo placement &middot; sends, returns, and bussing for effects routing &middot; mixdown to a stereo master from a multitrack project.
            </CopyableNote>
          </div>
        )}

        {/* MIXER TAB */}
        {activeTab === 'mixer' && (
          <div style={{ background: 'var(--canvas-background)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-5)' }}>
            {/* Scenario chooser */}
            <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-5)', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ color: 'var(--canvas-foreground-tertiary)', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>Scaffolded scenarios:</span>
              {[
                { n: 0, label: 'Free play' },
                { n: 1, label: '1 · Set balance' },
                { n: 2, label: '2 · Place pans + sends' },
                { n: 3, label: '3 · Mixdown' },
              ].map(s => (
                <button type="button" key={s.n} data-press onClick={() => startScenario(s.n)}
                  style={{
                    padding: 'var(--space-2) var(--space-3)',
                    background: scenarioStep === s.n ? 'var(--mustard)' : 'var(--canvas-surface)',
                    color: scenarioStep === s.n ? 'var(--canvas-background)' : 'var(--canvas-foreground-secondary)',
                    border: `1px solid var(--canvas-border-hover)`, borderRadius: 'var(--radius-md)',
                    cursor: 'pointer', fontFamily: FONT_BODY, fontSize: 'var(--text-xs)', fontWeight: 600
                  }}>{s.label}</button>
              ))}
              <button type="button" data-press onClick={loadDefaults}
                style={{
                  marginLeft: 'auto', padding: 'var(--space-2) var(--space-3)',
                  background: 'var(--canvas-surface)', color: 'var(--canvas-foreground-tertiary)',
                  border: `1px solid var(--canvas-border-hover)`, borderRadius: 'var(--radius-md)',
                  cursor: 'pointer', fontFamily: FONT_BODY, fontSize: 'var(--text-xs)'
                }}>Reset to defaults</button>
            </div>

            {/* Scenario 3 task instruction */}
            {scenarioStep === 3 && (
              <div style={{
                background: 'rgba(220, 38, 38, 0.08)', border: '1px solid var(--error)',
                borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', marginBottom: 'var(--space-4)',
                color: 'var(--canvas-foreground)', fontSize: 'var(--text-sm)', fontFamily: FONT_BODY, lineHeight: 1.5
              }}>
                <strong style={{ color: 'var(--error)' }}>Task:</strong> Your session is too loud for mixdown. Pull the master fader down until the meter reads &ldquo;Healthy headroom&rdquo; (aim for around &minus;6 dBFS). Watch the peak meter. Avoid the red.
              </div>
            )}

            {/* Channel strips */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(84px, 1fr))',
              gap: 'var(--space-2)', marginBottom: 'var(--space-5)'
            }}>
              {TRACKS.map(t => <Fragment key={t.id}>{renderChannelStrip({ id: t.id })}</Fragment>)}
            </div>

            {/* Reverb bus + master */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
              <div style={{
                background: 'var(--canvas-surface)', border: `1px dashed var(--moss)`,
                borderRadius: 'var(--radius-md)', padding: 'var(--space-3)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                  <span style={{ color: 'var(--moss)', fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Reverb bus (return)</span>
                  <label style={{ fontSize: 10, color: 'var(--canvas-foreground-tertiary)', display: 'flex', gap: 4, alignItems: 'center' }}>
                    <input type="checkbox" checked={reverbPreFader} onChange={e => setReverbPreFader(e.target.checked)} />
                    pre-fader
                  </label>
                </div>
                <input aria-label={`Reverb return level, ${Math.round(reverbReturn * 100)}`} type="range" min={0} max={100} value={Math.round(reverbReturn * 100)}
                  onChange={e => setReverbReturn(Number(e.target.value) / 100)}
                  style={{ width: '100%', accentColor: 'var(--moss)' }} />
                <div style={{ fontSize: 10, color: 'var(--canvas-foreground-tertiary)', fontFamily: FONT_MONO, textAlign: 'center', marginTop: 4 }}>
                  Return level {Math.round(reverbReturn * 100)}
                </div>
              </div>
              <div style={{
                background: 'var(--canvas-surface)', border: `1px dashed var(--sienna)`,
                borderRadius: 'var(--radius-md)', padding: 'var(--space-3)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                  <span style={{ color: 'var(--sienna)', fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Drums sub-mix bus</span>
                  <label style={{ fontSize: 10, color: 'var(--canvas-foreground-tertiary)', display: 'flex', gap: 4, alignItems: 'center' }}>
                    <input type="checkbox" checked={drumBusEnabled} onChange={e => setDrumBusEnabled(e.target.checked)} />
                    glue comp on
                  </label>
                </div>
                <input aria-label={`Drums glue compression amount, ${Math.round(drumBusComp * 100)}`} type="range" min={0} max={100} value={Math.round(drumBusComp * 100)}
                  onChange={e => setDrumBusComp(Number(e.target.value) / 100)}
                  disabled={!drumBusEnabled}
                  style={{ width: '100%', accentColor: 'var(--sienna)', opacity: drumBusEnabled ? 1 : 0.4 }} />
                <div style={{ fontSize: 10, color: 'var(--canvas-foreground-tertiary)', fontFamily: FONT_MONO, textAlign: 'center', marginTop: 4 }}>
                  Glue compression {drumBusEnabled ? Math.round(drumBusComp * 100) : 'off'}
                </div>
              </div>
            </div>

            {/* Master + meters */}
            <div style={{
              background: 'var(--canvas-surface-2)', border: `1px solid var(--canvas-border-hover)`,
              borderRadius: 'var(--radius-md)', padding: 'var(--space-4)',
              display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-4)', alignItems: 'center'
            }}>
              <div>
                <div style={{ color: 'var(--mustard)', fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 'var(--space-2)' }}>Master fader</div>
                <input aria-label={`Master fader, ${Math.round(masterFader * 100)}`} type="range" min={0} max={100} value={Math.round(masterFader * 100)}
                  onChange={e => setMasterFader(Number(e.target.value) / 100)}
                  style={{ width: '100%', accentColor: 'var(--mustard)' }} />
                <div style={{ fontSize: 10, color: 'var(--canvas-foreground-tertiary)', fontFamily: FONT_MONO, textAlign: 'center', marginTop: 4 }}>
                  {Math.round(masterFader * 100)}
                </div>
              </div>
              <div>
                <div style={{
                  height: 24, background: 'var(--canvas-background)', borderRadius: 'var(--radius-md)',
                  position: 'relative', overflow: 'hidden', border: `1px solid var(--canvas-border-hover)`
                }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min(100, Math.max(0, ((masterPeakDb + 30) / 36) * 100))}%`,
                    background: `linear-gradient(90deg, var(--success), var(--warning) 75%, var(--error) 95%)`,
                    transition: 'width 100ms'
                  }} />
                  {/* -6 dBFS marker */}
                  <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${((-6 + 30) / 36) * 100}%`, width: 1, background: 'rgba(255,255,255,0.4)' }} />
                </div>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', marginTop: 4,
                  fontFamily: FONT_MONO, fontSize: 10, color: 'var(--canvas-foreground-tertiary)'
                }}>
                  <span>{masterPeakDb.toFixed(1)} dBFS</span>
                  <span style={{ color: masterPeakColor, fontWeight: 700 }}>{masterPeakLabel}</span>
                </div>
              </div>
            </div>

            {/* Signal flow + balance feedback */}
            <div style={{ marginTop: 'var(--space-4)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <div style={{
                background: 'var(--canvas-surface)', border: `1px solid var(--canvas-border)`,
                borderRadius: 'var(--radius-md)', padding: 'var(--space-3)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                  <span style={{ color: 'var(--canvas-foreground-secondary)', fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Signal flow</span>
                  <button type="button" data-press onClick={() => setShowSignalFlow(s => !s)}
                    style={{ background: 'none', border: 'none', color: 'var(--canvas-highlight)', cursor: 'pointer', fontSize: 11 }}>
                    {showSignalFlow ? 'hide' : 'show'}
                  </button>
                </div>
                {showSignalFlow && (
                  <pre style={{
                    fontFamily: FONT_MONO, fontSize: 11, color: 'var(--canvas-foreground-secondary)',
                    lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0
                  }}>{`Track → Pan → Fader → Master
   ↘ Send ${reverbPreFader ? '(pre)' : '(post)'} → Reverb Bus → Return → Master
${drumBusEnabled ? '\nDrum tracks → Drums Bus → Glue Comp → Master' : ''}`}</pre>
                )}
              </div>
              <div style={{
                background: 'var(--canvas-surface)', border: `1px solid var(--canvas-border)`,
                borderRadius: 'var(--radius-md)', padding: 'var(--space-3)'
              }}>
                <div style={{ color: 'var(--canvas-foreground-secondary)', fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 'var(--space-2)' }}>Balance feedback</div>
                {balanceFeedback.length === 0 ? (
                  <div style={{ color: 'var(--success)', fontSize: 'var(--text-sm)' }}>✓ Static balance is in the target band.</div>
                ) : (
                  <ul style={{ paddingLeft: 18, color: 'var(--canvas-foreground-tertiary)', fontSize: 'var(--text-xs)', lineHeight: 1.7 }}>
                    {balanceFeedback.map(issue => (
                      <li key={issue.id}>{issue.label} is {issue.tooLoud ? 'too loud' : 'too quiet'} relative to the lead vocal.</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <CopyableNote title="Dual-coding cue" color="var(--canvas-highlight)" variant="key">
              You are hearing what mixing engineers do. Faders set <strong>balance</strong>, pans place tracks in the <strong>stereo field</strong>, sends feed the <strong>reverb bus</strong>, and the master fader controls the final <strong>mixdown</strong> level. The signal-flow panel and the metering panel describe the same routing in two channels: a verbal description and a visual peak meter.
            </CopyableNote>
          </div>
        )}

        {/* QUIZ TAB */}
        {activeTab === 'quiz' && (
          <div>
            {quizComplete ? (
              <StudioCard>
                <h2 style={{ fontFamily: FONT_HEADING, fontSize: 'var(--text-3xl)', marginBottom: 'var(--space-3)' }}>Quiz complete</h2>
                <p style={{ color: 'var(--foreground-secondary)', fontSize: 'var(--text-lg)', marginBottom: 'var(--space-4)' }}>
                  You scored <strong style={{ color: 'var(--accent)' }}>{score}</strong> / {quizQuestions.length}.
                </p>
                <button type="button" data-press onClick={resetQuiz} style={{
                  padding: 'var(--space-3) var(--space-5)', background: 'var(--accent)', color: '#fff',
                  border: 'none', borderRadius: 'var(--radius-md)', fontFamily: FONT_BODY, fontWeight: 600,
                  cursor: 'pointer'
                }}>Try again</button>
              </StudioCard>
            ) : (
              <StudioCard>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                  <span style={{ color: 'var(--foreground-tertiary)', fontSize: 'var(--text-sm)', fontFamily: FONT_BODY }}>
                    Question {quizIndex + 1} of {quizQuestions.length}
                  </span>
                  <DiffBadge level={quizQuestions[quizIndex].difficulty} />
                </div>
                <h3 style={{ fontFamily: FONT_HEADING, fontSize: 'var(--text-xl)', marginBottom: 'var(--space-4)' }}>
                  {quizQuestions[quizIndex].q}
                </h3>
                <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
                  {quizQuestions[quizIndex].options.map((opt, i) => {
                    const isCorrect = i === quizQuestions[quizIndex].correct;
                    const isSelected = i === selectedAnswer;
                    let bg = 'var(--background-raised)', border = '1px solid var(--border)', color = 'var(--foreground)';
                    if (showFeedback && isCorrect) { bg = 'var(--success-soft)'; border = `2px solid var(--success)`; color = 'var(--success)'; }
                    else if (showFeedback && isSelected && !isCorrect) { bg = 'var(--error-soft)'; border = `2px solid var(--error)`; color = 'var(--error)'; }
                    return (
                      <button type="button" key={i} data-press onClick={() => handleAnswer(i)} disabled={showFeedback}
                        style={{
                          textAlign: 'left', padding: 'var(--space-4)',
                          background: bg, border, color,
                          borderRadius: 'var(--radius-md)', cursor: showFeedback ? 'default' : 'pointer',
                          fontFamily: FONT_BODY, fontSize: 'var(--text-base)',
                          transition: `all var(--duration-fast) var(--ease-out)`
                        }}>{opt}</button>
                    );
                  })}
                </div>
                {showFeedback && (
                  <div style={{ marginTop: 'var(--space-4)' }}>
                    <CopyableNote title={selectedAnswer === quizQuestions[quizIndex].correct ? 'Correct' : 'Explanation'}
                      color={selectedAnswer === quizQuestions[quizIndex].correct ? 'var(--success)' : 'var(--annotation-info)'}
                      variant="key">
                      {quizQuestions[quizIndex].explanation}
                    </CopyableNote>
                    <button type="button" data-press onClick={nextQuestion} style={{
                      marginTop: 'var(--space-4)',
                      padding: 'var(--space-3) var(--space-5)', background: 'var(--accent)', color: '#fff',
                      border: 'none', borderRadius: 'var(--radius-md)', fontFamily: FONT_BODY, fontWeight: 600, cursor: 'pointer'
                    }}>
                      {quizIndex + 1 >= quizQuestions.length ? 'Finish' : 'Next question'}
                    </button>
                  </div>
                )}
              </StudioCard>
            )}
          </div>
        )}

        {/* REFERENCE TAB */}
        {activeTab === 'reference' && (
          <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
            <StudioCard>
              <h3 style={{ fontFamily: FONT_HEADING, fontSize: 'var(--text-xl)', marginBottom: 'var(--space-3)' }}>Mixing vocabulary (Edexcel 1.6)</h3>
              <dl style={{ display: 'grid', gap: 'var(--space-3)', color: 'var(--foreground-secondary)', fontFamily: FONT_BODY, fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>
                <div><dt style={{ fontWeight: 700, color: 'var(--foreground)' }}>Balance</dt><dd>The relative volume of each track in the mix.</dd></div>
                <div><dt style={{ fontWeight: 700, color: 'var(--foreground)' }}>Pan</dt><dd>The left-to-right position of a sound in the stereo field.</dd></div>
                <div><dt style={{ fontWeight: 700, color: 'var(--foreground)' }}>Send</dt><dd>A copy of a channel signal routed to another destination (usually an effects bus). Send level controls how much.</dd></div>
                <div><dt style={{ fontWeight: 700, color: 'var(--foreground)' }}>Return</dt><dd>The channel that brings the bus output back into the mix.</dd></div>
                <div><dt style={{ fontWeight: 700, color: 'var(--foreground)' }}>Bus</dt><dd>A routing destination several channels can be combined into. Effects bus (e.g., reverb) or group bus (e.g., drums).</dd></div>
                <div><dt style={{ fontWeight: 700, color: 'var(--foreground)' }}>Group / Sub-mix</dt><dd>Related tracks combined under one fader and (optionally) one set of processing.</dd></div>
                <div><dt style={{ fontWeight: 700, color: 'var(--foreground)' }}>Pre-fader send</dt><dd>Send level independent of the channel fader. Used for headphone mixes.</dd></div>
                <div><dt style={{ fontWeight: 700, color: 'var(--foreground)' }}>Post-fader send</dt><dd>Send follows the channel fader. Normal for effects.</dd></div>
                <div><dt style={{ fontWeight: 700, color: 'var(--foreground)' }}>Mixdown</dt><dd>Rendering the multitrack session to a final stereo file.</dd></div>
                <div><dt style={{ fontWeight: 700, color: 'var(--foreground)' }}>Headroom</dt><dd>The dB margin between the loudest peak and 0 dBFS.</dd></div>
                <div><dt style={{ fontWeight: 700, color: 'var(--foreground)' }}>Gain staging</dt><dd>Setting sensible levels at every stage of the signal path.</dd></div>
                <div><dt style={{ fontWeight: 700, color: 'var(--foreground)' }}>Translation</dt><dd>How well a mix sounds across different playback systems.</dd></div>
              </dl>
            </StudioCard>

            <StudioCard>
              <h3 style={{ fontFamily: FONT_HEADING, fontSize: 'var(--text-xl)', marginBottom: 'var(--space-3)' }}>How this maps to Ableton Live 12</h3>
              <ul style={{ paddingLeft: 22, color: 'var(--foreground-secondary)', lineHeight: 1.8 }}>
                <li><strong>Sends:</strong> create a Return track (Cmd+Alt+T). Each audio track gains a Send knob (A, B, C…) routing to that Return.</li>
                <li><strong>Pre / post fader:</strong> right-click the Send knob &rarr; <em>Pre / Post</em>. Default is post.</li>
                <li><strong>Group bus:</strong> select tracks &rarr; Cmd+G to wrap in a Group track. Insert compression on the group track.</li>
                <li><strong>Master fader:</strong> Master track on the right. Watch the peak meter; aim for around −6 dBFS.</li>
                <li><strong>Mixdown:</strong> File &rarr; Export Audio/Video &rarr; 24-bit WAV at session sample rate.</li>
              </ul>
            </StudioCard>

            <StudioCard>
              <h3 style={{ fontFamily: FONT_HEADING, fontSize: 'var(--text-xl)', marginBottom: 'var(--space-3)' }}>Past-paper themes to revise (Section B)</h3>
              <p style={{ color: 'var(--foreground-secondary)', lineHeight: 1.7 }}>
                The 1.6 specification is examined in Section B of Component 4. Recent themes include: explaining why a vocal is sent to reverb rather than having one inserted on the channel; describing how pre-fader vs post-fader sends behave when a fader moves; identifying a sensible mixdown peak level; suggesting a routing strategy when the drum kit needs cohesive processing.
              </p>
              <CopyableNote title="Examiner cue" variant="exam" color="var(--moss)">
                When you describe a routing decision, name the signal path and the reason. Example: <em>&ldquo;Both rhythm guitars send post-fader to a reverb bus so the channel fader controls both the dry guitar and the amount of guitar in the reverb. This glues them into the same space and saves CPU.&rdquo;</em>
              </CopyableNote>
            </StudioCard>
          </div>
        )}
      </div>
    </div>
  );
};

export default MixingProduction;
