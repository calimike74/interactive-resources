// The Sequence bench (1.5). Built 2026-09-16 to the Bench Standard
// (Planning-and-Admin/Interactive-Resources-Upgrade/BENCH-STANDARD.md),
// the eleventh bench, folded in from the sandbox instrument Mike walked
// after a competitor's step-sequencer mockup ("if we can design a step
// above we'll be better"). The topic's second bench, by design: the Piano
// Roll is the MIDI file the paper hands over; this is the instrument the
// part is made on, a sixteen-step sequencer driving a small synth, so the
// spec's step-time input, swing quantise and the filter are things you do.

const sequenceBench = {
    id: 'sequence-bench',
    title: 'Sequence bench',
    description: 'A sixteen-step sequencer driving a small synth: kick, snare, hi-hat, a bass note and a chord on every step you light, swing on the clock, a low-pass filter you drag across the live spectrum, a piano that lights the notes as they sound and writes what you play into the Bass row. The 2025 feel comparison, the 2024 filter report and the spec\'s two ways of putting a part in, as presets.',
    topic: '1.5 Sequencing',
    relatedTopics: ['1.3 Synthesis', '1.8 Automation', '1.11 EQ', '2.5 Numeracy'],
    type: 'interactive',
    kind: 'bench',
    icon: '',
    estimatedTime: '10-15 minutes',
    learningObjectives: [
        'Programme a bar on a step grid and say why that is non-real-time input, then play the same line in and say what quantising on entry did',
        'Hear swing quantise as every second sixteenth landing late, in milliseconds, and give the 2025 scheme\'s feel word for each side',
        'Drag a low-pass filter\'s cutoff across the spectrum and say what the harmonics above it lose, and what resonance adds at the corner',
        'Trace one note through oscillators, filter and amplifier on four screens, and name the control that belongs to each stage',
    ],
    prepFor: ['midi-binary-assessment'],
    component: 'SequenceBench',
    keywords: ['sequencer', 'step sequencer', 'sequencing', 'step time', 'real-time input', 'non-real-time input', 'swing', 'quantise', 'quantize', 'pattern', 'drum machine', 'bass line', 'low-pass filter', 'cutoff', 'resonance', 'envelope', 'decay', 'tempo', 'bpm', 'record', 'piano roll', 'midi'],
    difficulty: 'foundation',
};

export default sequenceBench;
