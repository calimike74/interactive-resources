// Subtractive Synthesis Explorer Resource Configuration
// Interactive audio tool for learning subtractive synthesis concepts

const subtractiveSynthExplorer = {
    id: 'subtractive-synth-explorer',
    title: 'Subtractive Synthesis Explorer',
    description: 'Build sounds from scratch — choose waveforms, shape them with filters, and sculpt dynamics with ADSR envelopes. Hear every parameter change in real-time.',
    topic: '1.3 Synthesis',
    relatedTopics: ['1.11 EQ'],
    type: 'interactive',
    kind: 'sandbox',
    icon: '',
    estimatedTime: '25-35 minutes',
    learningObjectives: [
        'Identify and distinguish the four basic waveform shapes by sound and appearance',
        'Explain how a low-pass filter removes harmonics from a waveform',
        'Describe the function of each ADSR envelope stage',
        'Combine oscillator, filter, and envelope settings to create a synthesised patch'
    ],
    prepFor: [],
    component: 'SubtractiveSynthExplorer',
    keywords: ['synthesis', 'subtractive', 'oscillator', 'waveform', 'filter', 'ADSR', 'envelope', 'cutoff', 'resonance'],
    difficulty: 'foundation',
};

export default subtractiveSynthExplorer;
