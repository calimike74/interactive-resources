'use client';

import { useState, useEffect, useRef, useMemo } from 'react';

// ============================================
// Production Analysis (Section C scaffold)
// A-Level Music Technology — Component 4 Section C
// Revelation Design System (Canvas + Studio)
// ============================================

const DESIGN_TOKENS_CSS = `
  .production-analysis-root {
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

const FONT_HEADING = "'Playfair Display', Georgia, serif";
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
        <button data-press onClick={handleCopy} style={{
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
// LEARN: how Section C works
// ============================================
const learnSections = [
  { level: 'foundation', title: 'What Section C asks',
    content: 'Section C of Component 4 plays you a short unfamiliar production extract and asks you to analyse what you hear. Typical question stems include: identify the production processes used; describe how a particular element changes between two sections of the extract; explain why a producer might have made a particular creative decision. The extract is usually played three times.' },
  { level: 'foundation', title: 'The Section C habit: listen, label, explain',
    content: 'On every play, you do one job. First play — write down what you hear (instruments, broad sections, anything striking). Second play — focus on production: reverb, delay, distortion, panning, EQ moves, dynamics. Third play — verify, fill gaps, and look for things that change between sections. The third pass is the one most students waste; treat it as evidence-gathering, not relistening.' },
  { level: 'intermediate', title: 'The evidence → technique → effect framework',
    content: 'Every analytical sentence has three parts. The evidence is what the listener can hear (a precise moment or section). The technique is the production process you identify (e.g. reverb send, hard panning, ducking, distortion). The effect is what it does for the music (creates space, glues the kit, suggests a chorus arrival). Drop any one of the three and the sentence loses marks: pure description is unrewarded, technique without effect is incomplete.' },
  { level: 'intermediate', title: 'Comparing sections (verse vs. chorus)',
    content: 'Many Section C questions compare two sections — usually the verse and the chorus, the intro and the drop, or the bridge with the rest. The producer almost always changes something deliberate: the drum kit gets bigger, the vocal gets doubled or widened, the bass becomes more saturated, the reverb opens up. Your job is to name the change precisely and explain its effect on the arrangement.' },
  { level: 'advanced', title: 'Linking choices to genre conventions',
    content: 'Top-band answers locate a production decision in genre context. A heavily side-chain-compressed bass is a marker of EDM and house; a slap-back delay on the lead vocal is a marker of rockabilly and surf; mid/side widening on a synth pad is a marker of trance and stadium pop. You do not need to name the artist — but if you can name the convention, the examiner sees that you understand the choice rather than guessing.' },
  { level: 'advanced', title: 'What examiners reward (and what they don\'t)',
    content: 'Reward: specific timestamps or section labels (&ldquo;in the chorus from 0:42&rdquo;), correct technical vocabulary (compression ratio, dotted-eighth delay, side-chain, parallel compression), and a clear effect statement. No reward: emotional adjectives without technical anchor (&ldquo;it sounds cool&rdquo;), guessed effect names (&ldquo;some kind of reverb&rdquo;), or descriptions of the song lyrics. The examiner is listening with you; they want your technical reading, not your reaction.' },
];

// ============================================
// WORKED EXAMPLES — synthesised extracts (zero copyright risk)
// ============================================
const workedExamples = [
  {
    id: 'extract-a',
    title: 'Extract A — pop ballad, verse into chorus',
    scenario: 'A pop ballad opens with a single piano and a close-miked lead vocal. At 0:48 the chorus enters: the drum kit comes in, two guitar parts arrive, and the vocal sound changes noticeably.',
    questions: [
      {
        q: 'Identify ONE production process applied to the lead vocal in the chorus and explain its effect on the arrangement.',
        marks: 4,
        modelAnswer: 'A short hall reverb is sent to the lead vocal in the chorus (evidence: at 0:50 the vocal tail extends visibly after each phrase). The technique is a post-fader reverb send on a return channel; the effect is to push the vocal back into a shared space with the drums and guitars, creating arrival impact while keeping the vocal intelligible.',
        rubricCheck: ['Names the process precisely (short hall reverb on a send)', 'Anchors it in evidence (the vocal tail extending at 0:50)', 'Explains the effect in arrangement terms (shared space + arrival impact)'],
      },
      {
        q: 'Describe how the drum sound changes from verse to chorus.',
        marks: 3,
        modelAnswer: 'In the verse the drum kit is absent. At 0:48 the chorus introduces a kick, snare, and overhead pair. The kit sounds tight and centred, with the snare bus likely compressed (the snare envelope shortens and feels controlled) and the overheads panned wide to give the kit stereo spread.',
        rubricCheck: ['States both states (absent in verse, present in chorus)', 'Names at least one production process (compression / panning)', 'Connects the process to a listener experience'],
      },
    ],
  },
  {
    id: 'extract-b',
    title: 'Extract B — synth-led indie, build into drop',
    scenario: 'A synth-led indie track builds for eight bars over a low-pass-filtered drum loop and a wide synth pad. At 1:04 the filter opens, the drums become full-band, and a side-chain effect on the bass is audible.',
    questions: [
      {
        q: 'Identify TWO production techniques used in the eight-bar build (1:00 to 1:04).',
        marks: 4,
        modelAnswer: 'First, a low-pass filter automation on the drum bus — across the eight bars the cutoff opens from around 1 kHz to fully open, removing then restoring the high-frequency content of the kit. Second, a stereo widening on the synth pad (sounds Mid/Side processed or chorused), which creates a sense of expanding space as the build progresses.',
        rubricCheck: ['Names two distinct techniques', 'Names each technique with a precise term', 'Anchors each technique to evidence in the extract'],
      },
      {
        q: 'Explain why a producer would side-chain the bass to the kick at the drop (1:04 onwards).',
        marks: 3,
        modelAnswer: 'Side-chain compression keys a compressor on the bass channel from the kick — every kick hit ducks the bass momentarily. The effect is to keep the low end audible on small speakers (only one bass element occupies the sub frequencies at any moment) and to give the drop a pulsing groove that locks the bass to the kick rhythm.',
        rubricCheck: ['Names side-chain compression as the process', 'Describes the technical action (duck the bass on each kick hit)', 'Explains the musical effect (low-end clarity + pulsing groove)'],
      },
    ],
  },
  {
    id: 'extract-c',
    title: 'Extract C — alt-rock, bridge and outro',
    scenario: 'An alt-rock song reaches a bridge at 2:10. The dense full-band texture drops away to a single distorted electric guitar with a long pre-delayed reverb. The outro at 2:35 brings the full band back, this time with heavy parallel compression on the drums.',
    questions: [
      {
        q: 'Comment on the effect used on the bridge guitar.',
        marks: 3,
        modelAnswer: 'The guitar is heavily overdriven (medium-saturation distortion, audible even-harmonic content) and runs into a long-tail plate or hall reverb with noticeable pre-delay (roughly 80–120 ms — the dry attack is audible before the reverb arrives). The effect is dramatic isolation: the bridge feels suspended in a much bigger room than the verse and chorus did.',
        rubricCheck: ['Names the distortion type/character', 'Names the reverb type and a parameter (pre-delay)', 'Connects to arrangement effect (isolation/space)'],
      },
      {
        q: 'How would parallel compression contribute to the outro?',
        marks: 3,
        modelAnswer: 'A heavily compressed copy of the drums is summed back against the original. The result is a fatter, more sustained kit that retains its transient attack: the compressor pulls up the tail of each hit on the parallel send while the dry channel keeps the punch. In the outro the drums feel bigger and louder without needing the fader pushed.',
        rubricCheck: ['Defines parallel compression accurately', 'States the technical action (transients + sustained tail)', 'Connects to outro impact (bigger drums without loss of punch)'],
      },
    ],
  },
];

// ============================================
// PROCESS LIBRARY for practice mode
// ============================================
const PROCESS_LIBRARY = [
  { id: 'reverb', label: 'Reverb', cues: ['tail audible after phrase ends', 'wash / shimmer behind the dry signal', 'sense of a room or hall around the source'] },
  { id: 'delay', label: 'Delay', cues: ['discrete repeats', 'rhythmic echo locked to tempo', 'slap-back single repeat'] },
  { id: 'compression', label: 'Compression', cues: ['transient peaks levelled', 'sustain extended', 'pumping / breathing'] },
  { id: 'side-chain', label: 'Side-chain compression', cues: ['ducking on every kick', 'pulsing or four-on-the-floor groove in the bass'] },
  { id: 'distortion', label: 'Distortion / saturation', cues: ['added harmonics', 'gritty / fuzzy / warm character', 'soft-knee saturation'] },
  { id: 'eq', label: 'EQ', cues: ['brightness lifted', 'low rumble removed', 'midrange cut to clear a vocal'] },
  { id: 'panning', label: 'Pan / stereo placement', cues: ['element clearly left or right', 'wide stereo guitars'] },
  { id: 'widening', label: 'Stereo widening / Mid/Side', cues: ['mono-incompatible width', 'pad / synth feels bigger than the speakers'] },
  { id: 'automation', label: 'Automation', cues: ['filter sweep over time', 'volume rise into chorus', 'pan moves across a phrase'] },
  { id: 'layering', label: 'Layering / doubling', cues: ['vocal feels thickened', 'two distinct guitars playing the same part'] },
  { id: 'gating', label: 'Gating', cues: ['silence between hits', 'noise removed below threshold'] },
  { id: 'modulation', label: 'Modulation (chorus/flanger/phaser)', cues: ['cycling movement', 'jet-plane sweep', 'shimmer that moves'] },
];

// ============================================
// MAIN COMPONENT
// ============================================
const ProductionAnalysis = () => {
  const [activeTab, setActiveTab] = useState('learn');
  const tabs = [
    { id: 'learn', label: 'Learn' },
    { id: 'framework', label: 'Framework' },
    { id: 'worked', label: 'Worked Examples' },
    { id: 'practice', label: 'Practice' },
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

  // Worked examples
  const [activeExample, setActiveExample] = useState(workedExamples[0].id);
  const [showModel, setShowModel] = useState({});
  const example = workedExamples.find(e => e.id === activeExample);
  const toggleModel = (qi) => setShowModel(prev => ({ ...prev, [`${activeExample}-${qi}`]: !prev[`${activeExample}-${qi}`] }));

  // Practice
  const [practiceEvidence, setPracticeEvidence] = useState('');
  const [practiceTechniques, setPracticeTechniques] = useState([]);
  const [practiceEffect, setPracticeEffect] = useState('');
  const [generatedAnswer, setGeneratedAnswer] = useState('');

  const toggleTechnique = (id) => {
    setPracticeTechniques(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const buildAnswer = () => {
    if (!practiceEvidence.trim() || practiceTechniques.length === 0 || !practiceEffect.trim()) {
      setGeneratedAnswer('Fill in evidence, at least one technique, and the effect first.');
      return;
    }
    const techNames = practiceTechniques.map(id => PROCESS_LIBRARY.find(p => p.id === id)?.label).filter(Boolean);
    const techPhrase = techNames.length === 1 ? techNames[0] : techNames.slice(0, -1).join(', ') + ' and ' + techNames.slice(-1);
    setGeneratedAnswer(
      `${practiceEvidence.trim().replace(/\.$/, '')} — the technique is ${techPhrase.toLowerCase()}. The effect is ${practiceEffect.trim().replace(/\.$/, '').toLowerCase()}.`
    );
  };

  const resetPractice = () => {
    setPracticeEvidence(''); setPracticeTechniques([]); setPracticeEffect(''); setGeneratedAnswer('');
  };

  // Quality score (very rough)
  const quality = useMemo(() => {
    let s = 0;
    if (practiceEvidence.trim().length > 20) s += 1;
    if (practiceEvidence.match(/\d/) || /verse|chorus|bridge|intro|outro|drop|build/i.test(practiceEvidence)) s += 1;
    if (practiceTechniques.length >= 1) s += 1;
    if (practiceTechniques.length >= 2) s += 1;
    if (practiceEffect.trim().length > 30) s += 1;
    if (/arrangement|space|texture|impact|cohesion|clarity|groove|drive|width|depth|contrast/i.test(practiceEffect)) s += 1;
    return s;
  }, [practiceEvidence, practiceTechniques, practiceEffect]);

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="production-analysis-root" style={{
      fontFamily: FONT_BODY, background: 'var(--background)', color: 'var(--foreground)',
      minHeight: '100vh', padding: 'var(--space-6)'
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <header style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
            <h1 style={{ fontFamily: FONT_HEADING, fontSize: 'var(--text-4xl)', fontWeight: 700 }}>Production Analysis</h1>
            <span style={{
              fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.1em',
              color: 'var(--moss)', fontWeight: 700, fontFamily: FONT_BODY
            }}>Component 4 · Section C</span>
          </div>
          <p style={{ color: 'var(--foreground-secondary)', fontSize: 'var(--text-lg)' }}>
            A scaffold for analysing unfamiliar production extracts. Listen, label, explain — backed by the evidence/technique/effect framework.
          </p>
        </header>

        {/* Tabs */}
        <nav style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
          {tabs.map(tab => (
            <button key={tab.id} data-press onClick={() => setActiveTab(tab.id)}
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
                <button key={f.v} data-press onClick={() => setLearnFilter(f.v)}
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
          </div>
        )}

        {/* FRAMEWORK */}
        {activeTab === 'framework' && (
          <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
            <StudioCard>
              <h3 style={{ fontFamily: FONT_HEADING, fontSize: 'var(--text-xl)', marginBottom: 'var(--space-4)' }}>The three-part sentence</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)' }}>
                {[
                  { label: 'EVIDENCE', color: 'var(--accent)', body: 'A specific moment in the extract: a section, a timestamp, a phrase, an element you can point at.', stem: '“In the chorus at around 0:48…”' },
                  { label: 'TECHNIQUE', color: 'var(--sienna)', body: 'The production process you identify — named precisely with the correct technical vocabulary.', stem: '“…the vocal is sent post-fader to a short hall reverb…”' },
                  { label: 'EFFECT', color: 'var(--moss)', body: 'What it does for the music: arrangement, listener experience, genre convention. Connect process to outcome.', stem: '“…creating arrival impact while keeping the vocal intelligible.”' },
                ].map(card => (
                  <div key={card.label} style={{
                    background: `${card.color}10`, border: `1px solid ${card.color}50`, borderLeft: `4px solid ${card.color}`,
                    borderRadius: 'var(--radius-md)', padding: 'var(--space-4)'
                  }}>
                    <div style={{ color: card.color, fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 'var(--space-2)' }}>{card.label}</div>
                    <p style={{ color: 'var(--foreground-secondary)', fontSize: 'var(--text-sm)', lineHeight: 1.5, marginBottom: 'var(--space-3)' }}>{card.body}</p>
                    <p style={{ color: 'var(--foreground)', fontFamily: FONT_HEADING, fontStyle: 'italic', fontSize: 'var(--text-sm)' }}>{card.stem}</p>
                  </div>
                ))}
              </div>
            </StudioCard>

            <StudioCard>
              <h3 style={{ fontFamily: FONT_HEADING, fontSize: 'var(--text-xl)', marginBottom: 'var(--space-3)' }}>Sentence stems by question type</h3>
              <ul style={{ paddingLeft: 22, color: 'var(--foreground-secondary)', lineHeight: 2, fontSize: 'var(--text-sm)' }}>
                <li><strong>Identify a process:</strong> &ldquo;<em>In the [section] at [time], a [process] is applied to the [instrument], creating [effect].</em>&rdquo;</li>
                <li><strong>Describe a change:</strong> &ldquo;<em>The [instrument] changes from [verse state] to [chorus state]; this is achieved through [technique].</em>&rdquo;</li>
                <li><strong>Explain a creative decision:</strong> &ldquo;<em>The producer has chosen [technique] in order to [effect on arrangement / listener / genre convention].</em>&rdquo;</li>
                <li><strong>Compare two sections:</strong> &ldquo;<em>Whereas the [section A] uses [technique A] to [effect A], the [section B] uses [technique B] to [effect B].</em>&rdquo;</li>
              </ul>
            </StudioCard>

            <CopyableNote title="What gets you the upper marks" variant="exam" color="var(--moss)">
              Specificity (timestamp or section label) &middot; precise technical vocabulary (parameter names where you can) &middot; explicit effect-on-arrangement statement &middot; (top band) one comment that places the choice in a genre or production-history context.
            </CopyableNote>
          </div>
        )}

        {/* WORKED EXAMPLES */}
        {activeTab === 'worked' && (
          <div>
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
              {workedExamples.map(ex => (
                <button key={ex.id} data-press onClick={() => setActiveExample(ex.id)}
                  style={{
                    padding: 'var(--space-2) var(--space-4)',
                    background: activeExample === ex.id ? 'var(--accent)' : 'var(--background-raised)',
                    color: activeExample === ex.id ? '#fff' : 'var(--foreground-secondary)',
                    border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                    cursor: 'pointer', fontFamily: FONT_BODY, fontSize: 'var(--text-sm)', fontWeight: 600
                  }}>{ex.title.split(' — ')[0]}</button>
              ))}
            </div>

            <StudioCard>
              <h3 style={{ fontFamily: FONT_HEADING, fontSize: 'var(--text-xl)', marginBottom: 'var(--space-2)' }}>{example.title}</h3>
              <p style={{ color: 'var(--foreground-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-5)', fontStyle: 'italic' }}>{example.scenario}</p>

              <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                {example.questions.map((q, qi) => {
                  const key = `${activeExample}-${qi}`;
                  const visible = showModel[key];
                  return (
                    <div key={qi} style={{
                      background: 'var(--background)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)', padding: 'var(--space-4)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                        <div style={{ flex: 1 }}>
                          <span style={{ color: 'var(--sienna)', fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Question {qi + 1} · {q.marks} marks</span>
                          <p style={{ marginTop: 'var(--space-2)', fontWeight: 600 }}>{q.q}</p>
                        </div>
                        <button data-press onClick={() => toggleModel(qi)} style={{
                          padding: 'var(--space-2) var(--space-3)', background: visible ? 'var(--canvas-foreground-tertiary)' : 'var(--accent)',
                          color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                          fontFamily: FONT_BODY, fontSize: 'var(--text-xs)', fontWeight: 600, whiteSpace: 'nowrap'
                        }}>
                          {visible ? 'Hide model' : 'Reveal model'}
                        </button>
                      </div>
                      {visible && (
                        <>
                          <CopyableNote title="Model answer" variant="key" color="var(--success)">
                            {q.modelAnswer}
                          </CopyableNote>
                          <div style={{ marginTop: 'var(--space-3)' }}>
                            <div style={{ color: 'var(--foreground-tertiary)', fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 'var(--space-2)' }}>Mark-scheme checks</div>
                            <ul style={{ paddingLeft: 22, color: 'var(--foreground-secondary)', fontSize: 'var(--text-sm)', lineHeight: 1.7 }}>
                              {q.rubricCheck.map((r, i) => <li key={i}>✓ {r}</li>)}
                            </ul>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </StudioCard>
          </div>
        )}

        {/* PRACTICE */}
        {activeTab === 'practice' && (
          <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
            <StudioCard>
              <h3 style={{ fontFamily: FONT_HEADING, fontSize: 'var(--text-xl)', marginBottom: 'var(--space-3)' }}>Build a Section C sentence</h3>
              <p style={{ color: 'var(--foreground-secondary)', marginBottom: 'var(--space-4)', lineHeight: 1.6 }}>
                Take any extract — a Section C clip, a song you know, the latest single you produced. Fill in the three boxes; the tool stitches them into a sentence and grades the structure.
              </p>

              <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, color: 'var(--accent)', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 'var(--space-2)' }}>1. Evidence — what you can hear, with a section or timestamp</label>
                  <textarea value={practiceEvidence} onChange={e => setPracticeEvidence(e.target.value)}
                    placeholder="e.g. In the chorus from 0:48, the lead vocal sits in a wider, more reverberant space than in the verse…"
                    style={{
                      width: '100%', minHeight: 80, padding: 'var(--space-3)',
                      background: 'var(--background)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)', fontFamily: FONT_BODY, fontSize: 'var(--text-sm)',
                      color: 'var(--foreground)', resize: 'vertical'
                    }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, color: 'var(--sienna)', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 'var(--space-2)' }}>2. Technique(s) — name the production processes</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                    {PROCESS_LIBRARY.map(p => {
                      const active = practiceTechniques.includes(p.id);
                      return (
                        <button key={p.id} data-press onClick={() => toggleTechnique(p.id)}
                          style={{
                            padding: 'var(--space-2) var(--space-3)',
                            background: active ? 'var(--sienna)' : 'var(--background)',
                            color: active ? '#fff' : 'var(--foreground-secondary)',
                            border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                            cursor: 'pointer', fontFamily: FONT_BODY, fontSize: 'var(--text-xs)', fontWeight: 600
                          }}>{p.label}</button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, color: 'var(--moss)', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 'var(--space-2)' }}>3. Effect — what the technique does for the music</label>
                  <textarea value={practiceEffect} onChange={e => setPracticeEffect(e.target.value)}
                    placeholder="e.g. it pushes the vocal into a shared space with the rest of the band, signalling the chorus arrival without losing intelligibility…"
                    style={{
                      width: '100%', minHeight: 80, padding: 'var(--space-3)',
                      background: 'var(--background)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)', fontFamily: FONT_BODY, fontSize: 'var(--text-sm)',
                      color: 'var(--foreground)', resize: 'vertical'
                    }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                <button data-press onClick={buildAnswer} style={{
                  padding: 'var(--space-3) var(--space-5)', background: 'var(--accent)', color: '#fff',
                  border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                  fontFamily: FONT_BODY, fontWeight: 600
                }}>Build sentence</button>
                <button data-press onClick={resetPractice} style={{
                  padding: 'var(--space-3) var(--space-5)', background: 'transparent',
                  color: 'var(--foreground-secondary)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)', cursor: 'pointer', fontFamily: FONT_BODY
                }}>Reset</button>
              </div>

              {generatedAnswer && (
                <>
                  <CopyableNote title="Your stitched sentence" variant="key" color="var(--annotation-info)">
                    {generatedAnswer}
                  </CopyableNote>
                  <div style={{
                    marginTop: 'var(--space-3)',
                    background: 'var(--background)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)', padding: 'var(--space-4)'
                  }}>
                    <div style={{ color: 'var(--foreground-tertiary)', fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 'var(--space-2)' }}>Structure score: {quality} / 6</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4 }}>
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} style={{
                          height: 8, borderRadius: 4,
                          background: i < quality ? 'var(--success)' : 'var(--border)'
                        }} />
                      ))}
                    </div>
                    <ul style={{ marginTop: 'var(--space-3)', paddingLeft: 22, color: 'var(--foreground-secondary)', fontSize: 'var(--text-xs)', lineHeight: 1.8 }}>
                      <li>Evidence has detail ({practiceEvidence.trim().length > 20 ? '✓' : '·'}) and a section/timestamp ({(practiceEvidence.match(/\d/) || /verse|chorus|bridge|intro|outro|drop|build/i.test(practiceEvidence)) ? '✓' : '·'}).</li>
                      <li>At least one technique named ({practiceTechniques.length >= 1 ? '✓' : '·'}); two or more compared ({practiceTechniques.length >= 2 ? '✓' : '·'}).</li>
                      <li>Effect statement is substantive ({practiceEffect.trim().length > 30 ? '✓' : '·'}) and uses an arrangement word ({/arrangement|space|texture|impact|cohesion|clarity|groove|drive|width|depth|contrast/i.test(practiceEffect) ? '✓' : '·'}).</li>
                    </ul>
                  </div>
                </>
              )}
            </StudioCard>
          </div>
        )}

        {/* REFERENCE */}
        {activeTab === 'reference' && (
          <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
            <StudioCard>
              <h3 style={{ fontFamily: FONT_HEADING, fontSize: 'var(--text-xl)', marginBottom: 'var(--space-3)' }}>Process cues — what to listen for</h3>
              <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
                {PROCESS_LIBRARY.map(p => (
                  <div key={p.id} style={{
                    background: 'var(--background)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)', padding: 'var(--space-3)'
                  }}>
                    <div style={{ fontWeight: 700, color: 'var(--foreground)', marginBottom: 4 }}>{p.label}</div>
                    <ul style={{ paddingLeft: 22, color: 'var(--foreground-secondary)', fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>
                      {p.cues.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </StudioCard>

            <StudioCard>
              <h3 style={{ fontFamily: FONT_HEADING, fontSize: 'var(--text-xl)', marginBottom: 'var(--space-3)' }}>Sentence-stem bank</h3>
              <ul style={{ paddingLeft: 22, color: 'var(--foreground-secondary)', lineHeight: 1.8, fontSize: 'var(--text-sm)' }}>
                <li>In the [section] at around [time], the producer has applied [process] to the [element], creating [effect].</li>
                <li>The [element] changes between the [section A] and [section B]; this is achieved through [process], producing [effect].</li>
                <li>The use of [process] reflects a convention of [genre / production tradition], suggesting [stylistic implication].</li>
                <li>Whereas the [section A] is characterised by [process A], the [section B] introduces [process B] to drive [arrangement function].</li>
                <li>The [parameter] of the [process] (e.g. long pre-delay; aggressive ratio; dotted-eighth time) is the choice that gives the [section] its [perceived quality].</li>
              </ul>
            </StudioCard>

            <CopyableNote title="Section C pacing on exam day" variant="exam" color="var(--moss)">
              Play 1: write a one-line description and the section structure. Play 2: identify production processes (annotate down the page). Play 3: verify, fill gaps, look specifically at what changes between sections. Now write your answer, working evidence → technique → effect for each marked point.
            </CopyableNote>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductionAnalysis;
