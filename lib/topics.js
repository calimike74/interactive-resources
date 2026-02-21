// Topic definitions for Component 4 topic-based navigation
// Each topic maps to a spec area and links to its interactive resources

const topics = [
    {
        id: 'recording',
        name: 'Recording & Production',
        specRef: '1.1',
        description: 'Microphone techniques, signal flow, and recording practices for music production.',
        colour: '#64748B',
        icon: 'Mic',
        resourceIds: ['stereo-recording-essay'],
    },
    {
        id: 'synthesis',
        name: 'Synthesis',
        specRef: '1.3',
        description: 'Sound design fundamentals — oscillators, filters, envelopes, and modulation.',
        colour: '#3B5BDB',
        icon: 'Waves',
        resourceIds: ['subtractive-synth-explorer'],
    },
    {
        id: 'sampling',
        name: 'Sampling',
        specRef: '1.4',
        description: 'Sample manipulation, time-stretching, layering, and creative sampling techniques.',
        colour: '#0D9488',
        icon: 'Scissors',
        resourceIds: ['double-tracking-explorer'],
    },
    {
        id: 'midi',
        name: 'MIDI & Sequencing',
        specRef: '1.5',
        description: 'MIDI messages, controllers, sequencing workflows, and automation.',
        colour: '#2563EB',
        icon: 'Piano',
        resourceIds: ['midi-pitch-bend-controller'],
    },
    {
        id: 'mixing',
        name: 'Mixing & Production',
        specRef: '1.6',
        description: 'Balance, panning, effects sends, and mixdown techniques.',
        colour: '#475569',
        icon: 'SlidersHorizontal',
        resourceIds: [],
    },
    {
        id: 'dynamics',
        name: 'Dynamics',
        specRef: '1.10',
        description: 'Compressors, limiters, expanders, and gates — controlling dynamic range.',
        colour: '#E8590C',
        icon: 'Activity',
        resourceIds: ['compressor-explorer'],
    },
    {
        id: 'eq',
        name: 'EQ & Filters',
        specRef: '1.11',
        description: 'Equalisation types, filter shapes, frequency manipulation, and spectral shaping.',
        colour: '#2B8A3E',
        icon: 'BarChart3',
        resourceIds: [
            'graphic-parametric-eq',
            'eq-filter-bridge',
            'filter-rolloff-visualization',
            'eq-assessment-prototype',
            'essay-scaffold',
        ],
    },
    {
        id: 'reverb',
        name: 'Reverb & Delay',
        specRef: '1.12',
        description: 'Acoustic spaces, reverb types, delay-based effects, and spatial processing.',
        colour: '#7048E8',
        icon: 'Radius',
        resourceIds: ['acoustics-flashcards'],
    },
    {
        id: 'numeracy',
        name: 'Numeracy',
        specRef: '2.5',
        description: 'Calculations for audio — decibels, frequency ratios, sample rates, and bit depth.',
        colour: '#D6336C',
        icon: 'Calculator',
        resourceIds: ['octave-period-trainer'],
    },
    {
        id: 'general',
        name: 'General Skills',
        specRef: '1.0',
        description: 'Cross-topic skills, listening techniques, and exam preparation strategies.',
        colour: '#6366F1',
        icon: 'BookOpen',
        resourceIds: ['reveal-explorer', 'essay-scaffold-practice'],
    },
];

/**
 * Get all topics
 */
export function getAllTopicDefs() {
    return topics;
}

/**
 * Get a topic by ID
 */
export function getTopic(id) {
    return topics.find(t => t.id === id);
}

/**
 * Get all topic IDs (for generateStaticParams)
 */
export function getAllTopicIds() {
    return topics.map(t => t.id);
}

/**
 * Find the parent topic for a given resource ID
 */
export function getTopicForResource(resourceId) {
    return topics.find(t => t.resourceIds.includes(resourceId));
}

export default topics;
