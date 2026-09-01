// The Synth bench (1.3). Built 2026-09-01 to the Bench Standard
// (Planning-and-Admin/Interactive-Resources-Upgrade/BENCH-STANDARD.md),
// ninth bench and the 2D treatment of Inside the Synthesiser (the 31 Aug
// estate verdict: a panel of controls fails the internal / spatial rule).
// Replaces subtractive-synth-explorer on the paying surface (that id is a
// retired stub now; see app/subtractive-synth-explorer/page.js).

const synthBench = {
    id: 'synth-bench',
    title: 'Synth bench',
    description: 'A subtractive synthesiser as the paper draws it: two oscillators, a filter, an envelope and an LFO, every dial a drag target, the wave and its harmonics drawn from the same numbers that sound. The papers\' own synth tasks as presets, judged section by section the way Q6 does, and one note opened up as control signals in time.',
    topic: '1.3 Synthesis',
    relatedTopics: ['2.5 Numeracy', '1.11 EQ', '1.9 Dynamic Processing', '1.12 Modulation', '1.5 Sequencing'],
    type: 'interactive',
    kind: 'bench',
    icon: '',
    estimatedTime: '10-15 minutes',
    learningObjectives: [
        'Hear and see what a waveform, a detuned pair and a sub-oscillator give a filter to work on',
        'Hear a low-pass cutoff and resonance as harmonics removed and a peak at the corner, and drag the curve to set them',
        'Set an ADSR for a bass, a pad, a lead and a keyboard part, and say which stage is a level',
        'Judge a patch for a job section by section, the way the paper does, and treat the LFO as a control signal',
    ],
    prepFor: ['operator-assessment', 'pitch-synth-monitors-assessment'],
    component: 'SynthBench',
    keywords: ['synthesis', 'subtractive', 'synthesiser', 'oscillator', 'waveform', 'square', 'saw', 'triangle', 'sine', 'detune', 'sub-oscillator', 'filter', 'low-pass', 'cutoff', 'resonance', 'ADSR', 'envelope', 'attack', 'decay', 'sustain', 'release', 'LFO', 'vibrato', 'tremolo', 'portamento', 'monophonic', 'polyphonic'],
    difficulty: 'foundation',
};

export default synthBench;
