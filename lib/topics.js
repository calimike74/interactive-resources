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
        heroVideo: '/recording-hero.mp4',
        resourceIds: ['stereo-recording-essay'],
    },
    {
        id: 'synthesis',
        name: 'Synthesis',
        specRef: '1.3',
        description: 'Sound design fundamentals — oscillators, filters, envelopes, and modulation.',
        colour: '#3B5BDB',
        icon: 'Waves',
        heroVideo: '/synthesis-hero.mp4',
        resourceIds: ['subtractive-synth-explorer'],
    },
    {
        id: 'sampling',
        name: 'Sampling',
        specRef: '1.4',
        description: 'Sample manipulation, time-stretching, layering, and creative sampling techniques.',
        colour: '#0D9488',
        icon: 'Scissors',
        heroVideo: '/stereo-hero.mp4',
        resourceIds: ['double-tracking-explorer'],
    },
    {
        id: 'midi',
        name: 'MIDI & Sequencing',
        specRef: '1.5',
        description: 'MIDI messages, controllers, sequencing workflows, and automation.',
        colour: '#2563EB',
        icon: 'Piano',
        heroVideo: '/midi-hero.mp4',
        resourceIds: ['midi-pitch-bend-controller'],
    },
    {
        id: 'mixing',
        name: 'Mixing & Production',
        specRef: '1.6',
        description: 'Balance, panning, effects sends, and mixdown techniques.',
        colour: '#475569',
        icon: 'SlidersHorizontal',
        heroVideo: '/mixing-hero.mp4',
        resourceIds: [],
    },
    {
        id: 'dynamics',
        name: 'Dynamic Processing',
        specRef: '1.9',
        description: 'Compressors, limiters, expanders, and gates — controlling dynamic range.',
        colour: '#E8590C',
        icon: 'Activity',
        heroVideo: '/compressor-hero.mp4',
        resourceIds: ['compressor-explorer', 'compressor-curve-practice', 'compressor-assessment'],
    },
    {
        id: 'eq',
        name: 'EQ & Filters',
        specRef: '1.11',
        description: 'Equalisation types, filter shapes, frequency manipulation, and spectral shaping.',
        colour: '#2B8A3E',
        icon: 'BarChart3',
        heroVideo: '/eq-hero.mp4',
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
        name: 'Reverb',
        specRef: '1.12',
        description: 'Acoustic spaces, reverb types, pre-delay, decay, diffusion, and spatial processing.',
        colour: '#7048E8',
        icon: 'Radius',
        heroVideo: '/reverb-hero.mp4',
        resourceIds: ['acoustics-flashcards'],
    },
    {
        id: 'delay',
        name: 'Delay',
        specRef: '1.12',
        description: 'Delay time, feedback, pan and EQ on the wet signal, slapback, timed and ping-pong delay, and Automatic Double Tracking.',
        colour: '#14B8A6',
        icon: 'Repeat',
        heroVideo: '/reverb-hero.mp4',
        resourceIds: ['delay-effects'],
    },
    {
        id: 'distortion',
        name: 'Distortion',
        specRef: '1.12',
        description: 'Overdrive, fuzz, saturation, and clipping — how distortion shapes waveforms and harmonic content.',
        colour: '#DC2626',
        icon: 'Zap',
        heroVideo: '/distortion-hero.mp4',
        resourceIds: ['combined-distortion-lab'],
    },
    {
        id: 'digital-analogue',
        name: 'Digital & Analogue',
        specRef: '2.4',
        description: 'ADC and DAC conversion, sampling, Nyquist theorem, aliasing, bit depth, quantisation, and the complete signal chain.',
        colour: '#0891B2',
        icon: 'Binary',
        heroVideo: '/digital-analogue-hero.mp4',
        resourceIds: ['adc-explorer', 'signal-chain-builder', 'digital-analogue'],
    },
    {
        id: 'numeracy',
        name: 'Numeracy',
        specRef: '2.5',
        description: 'Calculations for audio — decibels, frequency ratios, sample rates, and bit depth.',
        colour: '#D6336C',
        icon: 'Calculator',
        heroVideo: '/numeracy-hero.mp4',
        resourceIds: ['octave-period-trainer'],
    },
    {
        id: 'general',
        name: 'General Skills',
        specRef: '1.0',
        description: 'Cross-topic skills, listening techniques, and exam preparation strategies.',
        colour: '#6366F1',
        icon: 'BookOpen',
        heroVideo: '/general-hero.mp4',
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
