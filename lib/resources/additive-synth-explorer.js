// Additive Synth Explorer Resource Configuration
// The other half of 1.3 Synthesis: build a sound up from simple tones, watching
// each harmonic draw its own circle. Pairs with subtractive-synth-explorer.

const additiveSynthExplorer = {
    id: 'additive-synth-explorer',
    title: 'Additive Synth Explorer',
    description: 'Watch a sound get built. Every harmonic is a spinning circle, and stacking them traces out the waveform: pick a timbre, see its harmonics, then mix your own.',
    topic: '1.3 Synthesis',
    relatedTopics: ['1.11 EQ'],
    type: 'interactive',
    kind: 'sandbox',
    icon: '',
    estimatedTime: '10-15 minutes',
    learningObjectives: [
        'Understand additive synthesis as simple tones stacked above a base note',
        'Connect a sound\'s timbre to the pattern of harmonics inside it',
        'Recognise why a hollow sound keeps only its odd harmonics',
        'Read a spectrum display of the kind every DAW provides',
    ],
    component: 'AdditiveSynthExplorer',
    keywords: ['additive synthesis', 'harmonics', 'harmonic series', 'timbre', 'spectrum', 'waveform', 'partials', 'fundamental', 'synthesis'],
    difficulty: 'foundation',
};

export default additiveSynthExplorer;
