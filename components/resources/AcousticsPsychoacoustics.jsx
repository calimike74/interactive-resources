'use client';

import { useState, useEffect, useRef, useMemo } from 'react';

// ============================================
// Acoustics & Psychoacoustics
// A-Level Music Technology — Topics 2.1 + 2.2
// Revelation Design System (Canvas + Studio)
// ============================================

const DESIGN_TOKENS_CSS = `
  .acoustics-root {
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
    boxShadow: 'var(--shadow-md)', ...style
  }}>{children}</div>
);

const DiffBadge = ({ level }) => {
  const cfg = { foundation: { emoji: '\u{1F7E2}', label: 'Foundation' }, intermediate: { emoji: '\u{1F7E1}', label: 'Intermediate' }, advanced: { emoji: '\u{1F534}', label: 'Advanced' } };
  const c = cfg[level] || cfg.foundation;
  return <span style={{ fontSize: 'var(--text-xs)', fontFamily: FONT_BODY, fontWeight: 600 }}>{c.emoji} {c.label}</span>;
};

// ============================================
// LEARN CONTENT (spec-aligned)
// ============================================
const learnSections = [
  { level: 'foundation', title: 'The ear as a transducer',
    content: 'Sound waves enter the outer ear and push the eardrum back and forth. Three tiny bones (the ossicles) lever those movements into the cochlea, a fluid-filled spiral. Inside the cochlea, the basilar membrane vibrates in different places for different frequencies, and hair cells convert those vibrations into nerve impulses. The ear is a mechanical-to-electrical transducer, the inverse of a loudspeaker.' },
  { level: 'foundation', title: 'Human hearing range',
    content: 'A young, healthy listener hears roughly 20 Hz to 20 kHz. The lower end is felt as much as heard; the upper end fades with age and exposure to loud sound. Most musical content sits between 50 Hz and 8 kHz: bass weight, presence, air. The two octaves around 1–4 kHz are where the ear is most sensitive and where speech intelligibility lives.' },
  { level: 'foundation', title: 'Threshold of hearing & threshold of pain',
    content: 'At 1 kHz, the quietest sound a young ear can detect is around 0 dB SPL. The threshold of pain sits around 120 dB SPL. Sustained exposure above 85 dB SPL causes permanent damage. The decibel scale is logarithmic: each 6 dB doubles the sound pressure, and each 10 dB roughly doubles perceived loudness.' },
  { level: 'intermediate', title: 'Equal-loudness contours (Fletcher–Munson)',
    content: 'The ear is not equally sensitive across frequencies. At low listening levels we need much more energy at the extremes (20 Hz, 16 kHz) to perceive them as equally loud as a 1 kHz tone. As volume rises, the contours flatten: mixes feel more balanced loud than quiet. This is why engineers reference at a consistent monitoring level: a mix balanced quietly will feel bass-heavy when played loud, and vice versa.' },
  { level: 'intermediate', title: 'Frequency masking',
    content: 'A louder sound at one frequency hides quieter sounds at nearby frequencies. A loud kick around 60 Hz masks a quieter bass guitar fundamental at 80 Hz; a bright cymbal at 8 kHz masks a vocal sibilant at 7 kHz. Mixing is, in large part, an exercise in unmasking: carving frequency space so each instrument is heard. EQ subtractions and panning both relieve masking.' },
  { level: 'intermediate', title: 'Temporal masking',
    content: 'A loud sound masks quieter sounds immediately before and after it. Pre-masking is about 20 ms; post-masking can last 100–200 ms. This is why a snare hit can hide a quiet hi-hat ghost note that follows it, and why MP3 encoders aggressively discard data hidden behind transients without listeners noticing.' },
  { level: 'advanced', title: 'Reflection, absorption, diffusion',
    content: 'Sound striking a surface can be reflected (bounced back), absorbed (converted to heat in porous material), or diffused (scattered in many directions). A hard, parallel-walled room has loud reflections that comb-filter the direct sound. Soft furnishings and porous absorbers (mineral wool, foam) cut reflections, especially at higher frequencies. Diffusers (geometric panels, bookshelves) preserve liveliness while breaking up flutter.' },
  { level: 'advanced', title: 'Bass trapping and modal problems',
    content: 'Low frequencies have long wavelengths (a 60 Hz wave is about 5.7 m). Inside a small room they set up resonances called modes, where some frequencies pile up at the walls and corners while others cancel in the middle. Thick porous bass traps in corners (where pressure is highest) absorb low-frequency energy and tame the modal peaks that otherwise make a control room dishonest.' },
  { level: 'advanced', title: 'Reverb time (RT60)',
    content: 'RT60 is the time it takes a sound to decay by 60 dB once the source stops. A bedroom typically has RT60 below 0.3 s; a concert hall sits around 1.8–2.2 s. The optimum for mixing varies, but anechoic chambers (very short RT60) feel oppressive, and untreated bedrooms have ragged uneven decay. Acoustic treatment is about getting an even, predictable decay across frequencies, not about deadening the room.' },
];

// ============================================
// QUIZ
// ============================================
const quizQuestions = [
  { q: 'A young, healthy human ear typically responds to which frequency range?',
    options: ['100 Hz to 10 kHz', '20 Hz to 20 kHz', '40 Hz to 30 kHz', '5 Hz to 60 kHz'],
    correct: 1, difficulty: 'foundation',
    explanation: 'The accepted range for human hearing is approximately 20 Hz to 20 kHz, though both ends typically narrow with age and exposure.' },
  { q: 'The two octaves where the ear is MOST sensitive are roughly:',
    options: ['50–200 Hz', '1–4 kHz', '8–16 kHz', '12–48 kHz'],
    correct: 1, difficulty: 'foundation',
    explanation: 'The equal-loudness contours dip lowest around 1–4 kHz: this is where the ear needs the least sound energy to perceive a sound, and the band that carries speech intelligibility and vocal presence.' },
  { q: 'At low listening levels, what change in perceived spectral balance do the Fletcher–Munson contours predict?',
    options: ['Bass and treble appear louder than midrange', 'Bass and treble appear quieter relative to midrange', 'The whole frequency range appears flat', 'High frequencies become inaudible'],
    correct: 1, difficulty: 'intermediate',
    explanation: 'Quiet listening levels need more energy at the extremes to be perceived equally loud as the midrange. A mix balanced quietly will sound bass-heavy when turned up; conversely, a mix balanced at high SPL can feel thin when played quietly.' },
  { q: 'A quiet bass guitar at 80 Hz is hidden by a loud kick drum at 60 Hz. This effect is called:',
    options: ['Phase cancellation', 'Frequency masking', 'Comb filtering', 'Doppler shift'],
    correct: 1, difficulty: 'foundation',
    explanation: 'Frequency masking occurs when a louder sound hides quieter sounds at nearby frequencies. Solving low-end masking is often a question of carving space with EQ or sidechain compression.' },
  { q: 'Roughly how long does post-masking last after a loud sound stops?',
    options: ['About 2–5 ms', 'About 20 ms', 'About 100–200 ms', 'About 2 seconds'],
    correct: 2, difficulty: 'intermediate',
    explanation: 'Post-masking can last around 100–200 ms; pre-masking is much shorter (around 20 ms). MP3 and other lossy codecs exploit this by discarding masked detail without listeners noticing.' },
  { q: 'A small bedroom with parallel walls has standing waves at low frequencies. The best treatment for this problem is:',
    options: ['Thin foam panels on the ceiling', 'Thick porous bass traps in the corners', 'A small rug under the desk', 'Cardboard pyramids on one wall'],
    correct: 1, difficulty: 'advanced',
    explanation: 'Low-frequency modes pile up at boundaries and especially in corners, where sound pressure is highest. Thick, porous bass traps placed in corners are the most effective remedy. Thin foam panels are useful for high-frequency reflections but cannot absorb long bass wavelengths.' },
  { q: 'What does RT60 measure?',
    options: ['The time it takes a sound to decay by 60 dB',
              'The reverb wet/dry ratio at 60% mix',
              'The roll-off slope at 60 Hz',
              'The 60 Hz mains hum component'],
    correct: 0, difficulty: 'intermediate',
    explanation: 'RT60 (reverberation time) is the time it takes the sound pressure to drop by 60 dB after the source stops. Concert halls run 1.8–2.2 s; mixing rooms aim for a much shorter, even decay (often 0.2–0.4 s).' },
  { q: 'A reflecting surface, an absorbing surface, and a diffusing surface affect sound differently. Which best describes a diffuser?',
    options: ['It converts sound energy entirely into heat',
              'It scatters sound in many directions while preserving energy',
              'It blocks sound from passing through the wall',
              'It cancels reflections through destructive interference'],
    correct: 1, difficulty: 'intermediate',
    explanation: 'Diffusers scatter incident sound in many directions, breaking up flutter echoes and harsh specular reflections without deadening the room. Absorbers (porous materials) turn sound energy into heat; reflectors send it back.' },
  { q: 'A guitar amp at 100 dB SPL is played in a control room next to a 30 dB SPL drum hi-hat playing through monitors. Why might the hi-hat appear inaudible?',
    options: ['Phase cancellation between the two',
              'Frequency masking only',
              'Both frequency and temporal masking',
              'The hi-hat is below the threshold of hearing'],
    correct: 2, difficulty: 'advanced',
    explanation: 'A 70 dB difference in level, combined with overlapping frequency content and continuous overlap in time, produces both frequency and temporal masking. The hi-hat is well above the absolute threshold but is masked by the louder guitar.' },
  { q: 'A producer claims the mix sounds bass-heavy in their car but bass-light in their bedroom. The most likely cause is:',
    options: ['Mastering loudness mismatch',
              'The bedroom has untreated low-frequency room modes',
              'The car has poor speakers',
              'The mix bus is clipping'],
    correct: 1, difficulty: 'advanced',
    explanation: 'Untreated small rooms have strong modal behaviour: at the listening position, certain low frequencies cancel (or peak) by many decibels. The bedroom is misleading the producer about what is in the mix; the car is closer to a neutral playback.' },
];

// ============================================
// FLETCHER–MUNSON CONTOUR (approximation)
// Returns SPL needed at frequency f to feel as loud as phon-level
// ============================================
const equalLoudnessSpl = (freq, phon) => {
  // Smooth two-bump piecewise approximation centred near 1 kHz
  const logF = Math.log10(freq);
  const logRef = 3; // 1000 Hz
  const d = logF - logRef;
  const lowBoost = 25 * Math.max(0, (1.5 - logF)); // strong below ~30 Hz
  const lowSoft = 12 * Math.max(0, (2 - logF));   // softer below ~100 Hz
  const highDip = -6 * Math.max(0, 0.7 - Math.abs(logF - 3.5)); // 3 kHz dip
  const highBoost = 8 * Math.max(0, (logF - 3.7));
  const spl = phon + lowBoost * (1 - phon / 120) + lowSoft * (1 - phon / 130) + highDip + highBoost;
  return spl;
};

// ============================================
// MAIN COMPONENT
// ============================================
const AcousticsPsychoacoustics = () => {
  const [activeTab, setActiveTab] = useState('learn');
  const tabs = [
    { id: 'learn', label: 'Learn' },
    { id: 'hearing', label: 'Hearing Curve' },
    { id: 'masking', label: 'Masking Lab' },
    { id: 'room', label: 'Room Treatment' },
    { id: 'quiz', label: 'Quiz' },
    { id: 'reference', label: 'Reference' },
  ];

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = DESIGN_TOKENS_CSS + '\n[data-press]:active { transform: scale(0.97); transition: transform 100ms cubic-bezier(0.34,1.56,0.64,1); }';
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  // Learn
  const [learnFilter, setLearnFilter] = useState('all');
  const filteredLearn = learnSections.filter(s => learnFilter === 'all' || s.level === learnFilter);

  // Hearing curve
  const [phon, setPhon] = useState(60);
  const curvePath = useMemo(() => {
    const points = [];
    for (let i = 0; i <= 60; i++) {
      const f = 20 * Math.pow(1000, i / 60); // 20 Hz → 20 kHz log
      const spl = equalLoudnessSpl(f, phon);
      points.push({ f, spl });
    }
    const w = 600, h = 280;
    const xOf = (f) => (Math.log10(f / 20) / Math.log10(20000 / 20)) * (w - 40) + 20;
    const yOf = (spl) => h - 30 - ((spl + 10) / 130) * (h - 50);
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xOf(p.f).toFixed(1)} ${yOf(p.spl).toFixed(1)}`).join(' ');
  }, [phon]);

  // Masking lab
  const [maskerFreq, setMaskerFreq] = useState(1000);
  const [maskerLevel, setMaskerLevel] = useState(70);
  const [targetFreq, setTargetFreq] = useState(1200);
  const [targetLevel, setTargetLevel] = useState(45);

  const maskingThreshold = (mf, ml, tf) => {
    // Very rough: masker raises threshold around its frequency by ~ml-30 dB,
    // falling off with octave distance from mf (asymmetric — slower above)
    const octaves = Math.abs(Math.log2(tf / mf));
    const upperSide = tf > mf;
    const slopePerOct = upperSide ? 15 : 30;
    const peak = Math.max(0, ml - 25);
    const elevated = peak - octaves * slopePerOct;
    return Math.max(0, elevated);
  };

  const targetMasked = useMemo(() => {
    const threshold = maskingThreshold(maskerFreq, maskerLevel, targetFreq);
    return targetLevel < threshold;
  }, [maskerFreq, maskerLevel, targetFreq, targetLevel]);

  // Room treatment
  const [absorbers, setAbsorbers] = useState(0);
  const [bassTraps, setBassTraps] = useState(0);
  const [diffusers, setDiffusers] = useState(0);
  const roomScore = useMemo(() => {
    const treatments = absorbers + bassTraps + diffusers;
    if (treatments === 0) return { rt60: 0.95, lowEvenness: 25, balance: 'Untreated: long ragged decay; bass piles up in corners.' };
    const baseRt = Math.max(0.18, 0.95 - absorbers * 0.07 - bassTraps * 0.04 - diffusers * 0.02);
    const lowEven = Math.min(95, 25 + bassTraps * 12 + absorbers * 3);
    let balance;
    if (bassTraps === 0 && absorbers > 4) balance = 'Mid/high deadened, bass still wild: over-absorbed.';
    else if (bassTraps >= 2 && absorbers >= 2 && diffusers >= 1) balance = 'Balanced: even decay, modal energy tamed, liveliness retained.';
    else if (absorbers === 0 && bassTraps > 0) balance = 'Bass under control but flutter still rings on the highs.';
    else balance = 'Improving: keep adding absorbers and consider diffusion to avoid a dead room.';
    return { rt60: baseRt, lowEvenness: lowEven, balance };
  }, [absorbers, bassTraps, diffusers]);

  // Quiz
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);

  const handleAnswer = (idx) => {
    if (showFeedback) return;
    setSelectedAnswer(idx);
    setShowFeedback(true);
    if (idx === quizQuestions[quizIndex].correct) setScore(s => s + 1);
  };
  const nextQuestion = () => {
    if (quizIndex + 1 >= quizQuestions.length) { setQuizComplete(true); return; }
    setQuizIndex(i => i + 1); setSelectedAnswer(null); setShowFeedback(false);
  };
  const resetQuiz = () => { setQuizIndex(0); setSelectedAnswer(null); setShowFeedback(false); setScore(0); setQuizComplete(false); };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="acoustics-root" style={{
      fontFamily: FONT_BODY, background: 'var(--background)', color: 'var(--foreground)',
      minHeight: '100vh', padding: 'var(--space-6)'
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <header style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
            <h1 style={{ fontFamily: FONT_HEADING, fontSize: 'var(--text-4xl)', fontWeight: 700 }}>Acoustics &amp; Psychoacoustics</h1>
            <span style={{
              fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.1em',
              color: 'var(--moss)', fontWeight: 700, fontFamily: FONT_BODY
            }}>Topics 2.1 + 2.2</span>
          </div>
          <p style={{ color: 'var(--foreground-secondary)', fontSize: 'var(--text-lg)' }}>
            Hear the contours, feel the masking, treat the room. The studio depends on knowing how the ear works and how sound behaves indoors.
          </p>
        </header>

        {/* Tabs */}
        <nav style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
          {tabs.map(tab => (
            <button type="button" key={tab.id} data-press onClick={() => setActiveTab(tab.id)}
              style={{
                padding: 'var(--space-3) var(--space-5)', background: 'transparent',
                border: 'none', borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
                color: activeTab === tab.id ? 'var(--accent)' : 'var(--foreground-secondary)',
                fontFamily: FONT_BODY, fontSize: 'var(--text-sm)', fontWeight: 600, cursor: 'pointer'
              }}>{tab.label}</button>
          ))}
        </nav>

        {/* LEARN */}
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
                  <div style={{ marginBottom: 'var(--space-2)' }}><DiffBadge level={section.level} /></div>
                  <h3 style={{ fontFamily: FONT_HEADING, fontSize: 'var(--text-xl)', marginBottom: 'var(--space-2)' }}>{section.title}</h3>
                  <p style={{ color: 'var(--foreground-secondary)', lineHeight: 1.6 }}>{section.content}</p>
                </StudioCard>
              ))}
            </div>
            <CopyableNote title="Spec checklist 2.1 + 2.2" variant="exam" color="var(--moss)">
              Hearing system &amp; range &middot; threshold of hearing / threshold of pain &middot; equal-loudness contours &middot; frequency and temporal masking &middot; reflection / absorption / diffusion &middot; bass trapping and room modes &middot; reverberation time (RT60).
            </CopyableNote>
          </div>
        )}

        {/* HEARING CURVE */}
        {activeTab === 'hearing' && (
          <div style={{ background: 'var(--canvas-background)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--space-4)' }}>
              <h3 style={{ fontFamily: FONT_HEADING, color: 'var(--canvas-foreground)', fontSize: 'var(--text-xl)' }}>Equal-loudness contour</h3>
              <span style={{ color: 'var(--canvas-foreground-tertiary)', fontSize: 'var(--text-xs)', fontFamily: FONT_MONO }}>
                {phon} phon · perceived loudness
              </span>
            </div>
            <svg viewBox="0 0 600 280" style={{ width: '100%', maxWidth: 720, background: 'var(--canvas-surface)', borderRadius: 'var(--radius-md)' }}>
              {/* Grid */}
              {[20, 100, 1000, 10000, 20000].map(f => {
                const x = (Math.log10(f / 20) / Math.log10(20000 / 20)) * (600 - 40) + 20;
                return (
                  <g key={f}>
                    <line x1={x} y1={20} x2={x} y2={250} stroke="rgba(255,255,255,0.06)" />
                    <text x={x} y={266} fontSize="9" fill="rgba(255,255,255,0.4)" fontFamily="monospace" textAnchor="middle">
                      {f >= 1000 ? `${f / 1000}k` : f}
                    </text>
                  </g>
                );
              })}
              {[0, 40, 80, 120].map(spl => {
                const y = 280 - 30 - ((spl + 10) / 130) * (280 - 50);
                return (
                  <g key={spl}>
                    <line x1={20} y1={y} x2={580} y2={y} stroke="rgba(255,255,255,0.04)" />
                    <text x={4} y={y + 3} fontSize="9" fill="rgba(255,255,255,0.4)" fontFamily="monospace">{spl}</text>
                  </g>
                );
              })}
              {/* Curve */}
              <path d={curvePath} fill="none" stroke="var(--mustard)" strokeWidth="2" />
              {/* Reference at 1 kHz */}
              <circle cx={(Math.log10(1000 / 20) / Math.log10(20000 / 20)) * 560 + 20}
                cy={280 - 30 - ((phon + 10) / 130) * 230} r={5} fill="var(--sienna)" />
              <text x="568" y="14" fontSize="10" fill="rgba(255,255,255,0.5)" fontFamily="monospace" textAnchor="end">SPL (dB)</text>
              <text x="300" y="278" fontSize="10" fill="rgba(255,255,255,0.5)" fontFamily="monospace" textAnchor="middle">Frequency (Hz, log)</text>
            </svg>

            <div style={{ marginTop: 'var(--space-4)', display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
              <span style={{ color: 'var(--canvas-foreground-tertiary)', fontSize: 'var(--text-xs)' }}>Listening level</span>
              <input aria-label="Listening level (phon)" type="range" min={10} max={100} step={10} value={phon} onChange={e => setPhon(Number(e.target.value))}
                style={{ flex: 1, accentColor: 'var(--mustard)' }} />
              <span style={{ color: 'var(--canvas-foreground)', fontFamily: FONT_MONO, fontSize: 12, minWidth: 60, textAlign: 'right' }}>{phon} phon</span>
            </div>

            <CopyableNote title="Watch the contour flatten" variant="key" color="var(--canvas-highlight)">
              At <strong>20 phon</strong> the curve bows enormously at the extremes: quiet mixes feel bass-light and dull. As you push to <strong>80–100 phon</strong>, the contour straightens; the same instruments now feel balanced. <em>Mix at a consistent monitoring level.</em>
            </CopyableNote>
          </div>
        )}

        {/* MASKING LAB */}
        {activeTab === 'masking' && (
          <div style={{ background: 'var(--canvas-background)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-5)' }}>
            <h3 style={{ fontFamily: FONT_HEADING, color: 'var(--canvas-foreground)', fontSize: 'var(--text-xl)', marginBottom: 'var(--space-3)' }}>Frequency masking</h3>
            <p style={{ color: 'var(--canvas-foreground-tertiary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
              Drag the masker tone and target tone. The masker raises the threshold of audibility around its frequency: a target sitting below the threshold disappears.
            </p>

            <svg viewBox="0 0 600 220" style={{ width: '100%', maxWidth: 720, background: 'var(--canvas-surface)', borderRadius: 'var(--radius-md)' }}>
              {/* Threshold envelope */}
              {(() => {
                const points = [];
                for (let i = 0; i <= 60; i++) {
                  const f = 20 * Math.pow(1000, i / 60);
                  const thresh = maskingThreshold(maskerFreq, maskerLevel, f);
                  points.push({ f, thresh });
                }
                const xOf = (f) => (Math.log10(f / 20) / Math.log10(20000 / 20)) * 560 + 20;
                const yOf = (db) => 200 - (db / 100) * 180;
                const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xOf(p.f).toFixed(1)} ${yOf(p.thresh).toFixed(1)}`).join(' ');
                return <path d={`${d} L 580 200 L 20 200 Z`} fill="rgba(220,38,38,0.15)" stroke="var(--error)" strokeWidth="1.2" />;
              })()}
              {/* Grid */}
              {[20, 100, 1000, 10000, 20000].map(f => {
                const x = (Math.log10(f / 20) / Math.log10(20000 / 20)) * 560 + 20;
                return <text key={f} x={x} y={216} fontSize="9" fill="rgba(255,255,255,0.4)" fontFamily="monospace" textAnchor="middle">{f >= 1000 ? `${f / 1000}k` : f}</text>;
              })}
              {/* Masker bar */}
              {(() => {
                const x = (Math.log10(maskerFreq / 20) / Math.log10(20000 / 20)) * 560 + 20;
                const y = 200 - (maskerLevel / 100) * 180;
                return (
                  <g>
                    <line x1={x} y1={y} x2={x} y2={200} stroke="var(--sienna)" strokeWidth="3" />
                    <circle cx={x} cy={y} r={5} fill="var(--sienna)" />
                    <text x={x + 8} y={y - 4} fontSize="10" fill="var(--sienna)" fontFamily="monospace">M {maskerLevel} dB</text>
                  </g>
                );
              })()}
              {/* Target bar */}
              {(() => {
                const x = (Math.log10(targetFreq / 20) / Math.log10(20000 / 20)) * 560 + 20;
                const y = 200 - (targetLevel / 100) * 180;
                const color = targetMasked ? 'var(--canvas-foreground-tertiary)' : 'var(--mustard)';
                return (
                  <g>
                    <line x1={x} y1={y} x2={x} y2={200} stroke={color} strokeWidth="3" strokeDasharray={targetMasked ? '4 3' : ''} />
                    <circle cx={x} cy={y} r={5} fill={color} />
                    <text x={x + 8} y={y - 4} fontSize="10" fill={color} fontFamily="monospace">T {targetLevel} dB</text>
                  </g>
                );
              })()}
            </svg>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
              <div>
                <div style={{ color: 'var(--sienna)', fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 'var(--space-2)' }}>Masker (the loud sound)</div>
                <label style={{ color: 'var(--canvas-foreground-tertiary)', fontSize: 11, fontFamily: FONT_MONO }}>Frequency {maskerFreq} Hz</label>
                <input aria-label="Masker frequency (Hz)" type="range" min={50} max={10000} value={maskerFreq} onChange={e => setMaskerFreq(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--sienna)' }} />
                <label style={{ color: 'var(--canvas-foreground-tertiary)', fontSize: 11, fontFamily: FONT_MONO }}>Level {maskerLevel} dB</label>
                <input aria-label="Masker level (dB)" type="range" min={20} max={95} value={maskerLevel} onChange={e => setMaskerLevel(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--sienna)' }} />
              </div>
              <div>
                <div style={{ color: 'var(--mustard)', fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 'var(--space-2)' }}>Target (the quieter sound)</div>
                <label style={{ color: 'var(--canvas-foreground-tertiary)', fontSize: 11, fontFamily: FONT_MONO }}>Frequency {targetFreq} Hz</label>
                <input aria-label="Target frequency (Hz)" type="range" min={50} max={10000} value={targetFreq} onChange={e => setTargetFreq(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--mustard)' }} />
                <label style={{ color: 'var(--canvas-foreground-tertiary)', fontSize: 11, fontFamily: FONT_MONO }}>Level {targetLevel} dB</label>
                <input aria-label="Target level (dB)" type="range" min={0} max={95} value={targetLevel} onChange={e => setTargetLevel(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--mustard)' }} />
              </div>
            </div>

            <CopyableNote title={targetMasked ? 'Target is MASKED: listener hears the masker only.' : 'Target is AUDIBLE: sits above the threshold.'}
              variant={targetMasked ? 'warning' : 'key'}
              color={targetMasked ? 'var(--error)' : 'var(--success)'}>
              Notice the threshold-bend is asymmetric: a masker raises the threshold less for frequencies <em>below</em> it (about 30 dB/octave roll-off downwards) and more for frequencies <em>above</em> (about 15 dB/octave upwards). That asymmetry is why <strong>upward masking</strong> (loud lows hiding mids and highs) is the dominant problem in mixing.
            </CopyableNote>
          </div>
        )}

        {/* ROOM TREATMENT */}
        {activeTab === 'room' && (
          <div style={{ background: 'var(--canvas-background)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-5)' }}>
            <h3 style={{ fontFamily: FONT_HEADING, color: 'var(--canvas-foreground)', fontSize: 'var(--text-xl)', marginBottom: 'var(--space-3)' }}>Treat a small mixing room</h3>
            <p style={{ color: 'var(--canvas-foreground-tertiary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
              Each element changes the room differently. Add elements until you get an even decay across frequencies without killing the liveliness.
            </p>

            {/* Room visualization */}
            <div style={{ position: 'relative', height: 260, background: 'var(--canvas-surface)', borderRadius: 'var(--radius-md)', border: `1px solid var(--canvas-border-hover)`, overflow: 'hidden' }}>
              {/* Floor lines (perspective) */}
              <svg viewBox="0 0 400 260" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                <polygon points="40,40 360,40 360,220 40,220" fill="rgba(201,184,122,0.04)" stroke="rgba(201,184,122,0.2)" strokeWidth="1" />
                <text x="200" y="32" fill="rgba(232,228,223,0.4)" fontSize="11" textAnchor="middle" fontFamily="monospace">FRONT WALL</text>
                <text x="200" y="232" fill="rgba(232,228,223,0.4)" fontSize="11" textAnchor="middle" fontFamily="monospace">BACK WALL</text>
                <text x="32" y="130" fill="rgba(232,228,223,0.4)" fontSize="11" textAnchor="end" fontFamily="monospace">L</text>
                <text x="368" y="130" fill="rgba(232,228,223,0.4)" fontSize="11" fontFamily="monospace">R</text>
                {/* Listening position */}
                <circle cx="200" cy="170" r="10" fill="var(--accent)" />
                <text x="200" y="190" fill="var(--canvas-foreground)" fontSize="10" textAnchor="middle" fontFamily="monospace">listener</text>
                {/* Bass traps in corners */}
                {[
                  [44, 44], [356, 44], [44, 216], [356, 216]
                ].slice(0, bassTraps).map(([x, y], i) => (
                  <rect key={i} x={x - 12} y={y - 12} width={24} height={24} fill="var(--sienna)" opacity="0.8" />
                ))}
                {/* Absorbers along walls */}
                {Array.from({ length: absorbers }).map((_, i) => {
                  const positions = [
                    [110, 38], [200, 38], [290, 38],
                    [110, 222], [200, 222], [290, 222],
                    [38, 110], [38, 170],
                    [362, 110], [362, 170],
                  ];
                  const [x, y] = positions[i] || [0, 0];
                  return <rect key={`abs-${i}`} x={x - 14} y={y - 6} width={28} height={12} fill="var(--moss)" opacity="0.85" />;
                })}
                {/* Diffusers */}
                {Array.from({ length: diffusers }).map((_, i) => {
                  const positions = [
                    [200, 100], [200, 140],
                    [150, 220], [250, 220],
                    [38, 130], [362, 130]
                  ];
                  const [x, y] = positions[i] || [0, 0];
                  return (
                    <g key={`diff-${i}`}>
                      <rect x={x - 12} y={y - 8} width={24} height={16} fill="var(--mustard)" opacity="0.7" />
                      {[0, 5, 10, 15].map(dx => <line key={dx} x1={x - 10 + dx * 2} y1={y - 8} x2={x - 10 + dx * 2 + 3} y2={y + 8} stroke="rgba(0,0,0,0.3)" strokeWidth="0.5" />)}
                    </g>
                  );
                })}
              </svg>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
              {[
                { id: 'absorbers', label: 'Wall absorbers', color: 'var(--moss)', value: absorbers, set: setAbsorbers, max: 10 },
                { id: 'bassTraps', label: 'Corner bass traps', color: 'var(--sienna)', value: bassTraps, set: setBassTraps, max: 4 },
                { id: 'diffusers', label: 'Diffusers', color: 'var(--mustard)', value: diffusers, set: setDiffusers, max: 6 },
              ].map(item => (
                <div key={item.id} style={{
                  background: 'var(--canvas-surface)', border: `1px solid var(--canvas-border-hover)`,
                  borderRadius: 'var(--radius-md)', padding: 'var(--space-3)'
                }}>
                  <div style={{ color: item.color, fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 'var(--space-2)' }}>{item.label}</div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button type="button" data-press onClick={() => item.set(Math.max(0, item.value - 1))}
                      style={{ flex: 1, padding: 6, background: 'var(--canvas-surface-2)', color: 'var(--canvas-foreground)', border: 'none', borderRadius: 4, cursor: 'pointer', fontFamily: FONT_BODY }}>−</button>
                    <div style={{ flex: 2, textAlign: 'center', color: 'var(--canvas-foreground)', fontFamily: FONT_MONO, padding: 6 }}>{item.value} / {item.max}</div>
                    <button type="button" data-press onClick={() => item.set(Math.min(item.max, item.value + 1))}
                      style={{ flex: 1, padding: 6, background: 'var(--canvas-surface-2)', color: 'var(--canvas-foreground)', border: 'none', borderRadius: 4, cursor: 'pointer', fontFamily: FONT_BODY }}>+</button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              marginTop: 'var(--space-4)',
              background: 'var(--canvas-surface)', border: `1px solid var(--canvas-border-hover)`,
              borderRadius: 'var(--radius-md)', padding: 'var(--space-4)',
              display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 'var(--space-3)'
            }}>
              <div>
                <div style={{ color: 'var(--canvas-foreground-tertiary)', fontSize: 'var(--text-xs)', fontFamily: FONT_BODY }}>RT60</div>
                <div style={{ color: 'var(--canvas-foreground)', fontFamily: FONT_MONO, fontSize: 'var(--text-xl)' }}>{roomScore.rt60.toFixed(2)} s</div>
              </div>
              <div>
                <div style={{ color: 'var(--canvas-foreground-tertiary)', fontSize: 'var(--text-xs)', fontFamily: FONT_BODY }}>Low-freq evenness</div>
                <div style={{ color: 'var(--canvas-foreground)', fontFamily: FONT_MONO, fontSize: 'var(--text-xl)' }}>{Math.round(roomScore.lowEvenness)}%</div>
              </div>
              <div>
                <div style={{ color: 'var(--canvas-foreground-tertiary)', fontSize: 'var(--text-xs)', fontFamily: FONT_BODY }}>Verdict</div>
                <div style={{ color: 'var(--canvas-foreground-secondary)', fontFamily: FONT_BODY, fontSize: 'var(--text-sm)', lineHeight: 1.4 }}>{roomScore.balance}</div>
              </div>
            </div>

            <CopyableNote title="Dual-coding cue" variant="key" color="var(--canvas-highlight)">
              The visual placement is dual-coded with the verbal verdict. Bass traps belong in <strong>corners</strong>, where the modal pressure piles up. Wall absorbers belong at the <strong>first reflection points</strong> on the side walls and ceiling. Diffusers belong on the <strong>back wall</strong> behind the listener and on the rear ceiling to preserve liveliness.
            </CopyableNote>
          </div>
        )}

        {/* QUIZ */}
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
                  border: 'none', borderRadius: 'var(--radius-md)', fontFamily: FONT_BODY, fontWeight: 600, cursor: 'pointer'
                }}>Try again</button>
              </StudioCard>
            ) : (
              <StudioCard>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                  <span style={{ color: 'var(--foreground-tertiary)', fontSize: 'var(--text-sm)' }}>Question {quizIndex + 1} of {quizQuestions.length}</span>
                  <DiffBadge level={quizQuestions[quizIndex].difficulty} />
                </div>
                <h3 style={{ fontFamily: FONT_HEADING, fontSize: 'var(--text-xl)', marginBottom: 'var(--space-4)' }}>{quizQuestions[quizIndex].q}</h3>
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
                          textAlign: 'left', padding: 'var(--space-4)', background: bg, border, color,
                          borderRadius: 'var(--radius-md)', cursor: showFeedback ? 'default' : 'pointer',
                          fontFamily: FONT_BODY, fontSize: 'var(--text-base)'
                        }}>{opt}</button>
                    );
                  })}
                </div>
                {showFeedback && (
                  <div style={{ marginTop: 'var(--space-4)' }}>
                    <CopyableNote title={selectedAnswer === quizQuestions[quizIndex].correct ? 'Correct' : 'Explanation'}
                      color={selectedAnswer === quizQuestions[quizIndex].correct ? 'var(--success)' : 'var(--annotation-info)'} variant="key">
                      {quizQuestions[quizIndex].explanation}
                    </CopyableNote>
                    <button type="button" data-press onClick={nextQuestion} style={{
                      marginTop: 'var(--space-4)', padding: 'var(--space-3) var(--space-5)', background: 'var(--accent)',
                      color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontFamily: FONT_BODY, fontWeight: 600, cursor: 'pointer'
                    }}>{quizIndex + 1 >= quizQuestions.length ? 'Finish' : 'Next question'}</button>
                  </div>
                )}
              </StudioCard>
            )}
          </div>
        )}

        {/* REFERENCE */}
        {activeTab === 'reference' && (
          <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
            <StudioCard>
              <h3 style={{ fontFamily: FONT_HEADING, fontSize: 'var(--text-xl)', marginBottom: 'var(--space-3)' }}>Acoustic &amp; psychoacoustic vocabulary</h3>
              <dl style={{ display: 'grid', gap: 'var(--space-3)', color: 'var(--foreground-secondary)', fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>
                <div><dt style={{ fontWeight: 700, color: 'var(--foreground)' }}>SPL (sound pressure level)</dt><dd>The pressure of a sound wave, in dB, referenced to 20 µPa.</dd></div>
                <div><dt style={{ fontWeight: 700, color: 'var(--foreground)' }}>Threshold of hearing</dt><dd>The quietest sound an average young ear can detect; ~0 dB SPL at 1 kHz.</dd></div>
                <div><dt style={{ fontWeight: 700, color: 'var(--foreground)' }}>Threshold of pain</dt><dd>~120 dB SPL; sustained exposure above 85 dB SPL damages hearing.</dd></div>
                <div><dt style={{ fontWeight: 700, color: 'var(--foreground)' }}>Equal-loudness contour</dt><dd>The SPL required at each frequency to feel equally loud as a 1 kHz reference (the &ldquo;phon&rdquo;).</dd></div>
                <div><dt style={{ fontWeight: 700, color: 'var(--foreground)' }}>Frequency masking</dt><dd>A loud sound at one frequency hides quieter sounds at nearby frequencies.</dd></div>
                <div><dt style={{ fontWeight: 700, color: 'var(--foreground)' }}>Temporal masking</dt><dd>A loud sound masks quieter sounds shortly before (pre-masking) and after (post-masking) it.</dd></div>
                <div><dt style={{ fontWeight: 700, color: 'var(--foreground)' }}>Absorption</dt><dd>Sound energy converted into heat inside porous material.</dd></div>
                <div><dt style={{ fontWeight: 700, color: 'var(--foreground)' }}>Diffusion</dt><dd>Incident sound scattered in many directions, breaking up flutter without deadening.</dd></div>
                <div><dt style={{ fontWeight: 700, color: 'var(--foreground)' }}>Bass trap</dt><dd>Thick porous absorber placed at corners where low-frequency pressure piles up.</dd></div>
                <div><dt style={{ fontWeight: 700, color: 'var(--foreground)' }}>Room mode</dt><dd>A resonance set up by parallel surfaces; some frequencies pile up, others cancel.</dd></div>
                <div><dt style={{ fontWeight: 700, color: 'var(--foreground)' }}>RT60</dt><dd>Time for a sound to decay by 60 dB after the source stops.</dd></div>
              </dl>
            </StudioCard>

            <StudioCard>
              <h3 style={{ fontFamily: FONT_HEADING, fontSize: 'var(--text-xl)', marginBottom: 'var(--space-3)' }}>Past-paper themes (Section B)</h3>
              <p style={{ color: 'var(--foreground-secondary)', lineHeight: 1.7 }}>
                The 2.1 / 2.2 specification turns up most often as: explain why a mix sounds different in a car vs. a bedroom (modal behaviour); identify a likely treatment for excessive bass build-up; explain why a quiet sound is inaudible behind a louder one (frequency masking); describe a feature of equal-loudness contours and a mixing implication.
              </p>
              <CopyableNote title="Examiner cue" variant="exam" color="var(--moss)">
                When asked &ldquo;why does this happen&rdquo;, name <strong>both</strong> the mechanism (e.g. modal resonance) and the listener experience (e.g. bass appears boomy in one position and absent in another). Single-mechanism answers seldom score the upper marks.
              </CopyableNote>
            </StudioCard>
          </div>
        )}
      </div>
    </div>
  );
};

export default AcousticsPsychoacoustics;
