// Topic definitions for Component 4 topic-based navigation
// Each topic maps to a spec area and links to its interactive resources

const topics = [
    {
        id: 'general',
        name: 'General Skills',
        specRef: '1.0',
        description: 'Cross-topic skills, listening techniques, and exam preparation strategies.',
        icon: 'BookOpen',
        heroVideo: '/general-hero.mp4',
        resourceIds: ['reveal-explorer', 'essay-scaffold-practice', 'production-analysis'],
    },
    {
        id: 'recording',
        name: 'Recording & Production',
        specRef: '1.1',
        description: 'Microphone techniques, signal flow, and recording practices for music production.',
        icon: 'Mic',
        heroVideo: '/recording-hero.mp4',
        resourceIds: ['stereo-recording-essay', 'stereo-panning', 'mixing-production'],
        specSummary: [
            'DAW software and audio interface hardware in a recording workflow',
            'Signal flow from source → mic → preamp → converter → DAW → monitors',
            'File formats, bit depth, sample rate and their production trade-offs',
            'Input monitoring, buffer size and latency when tracking',
        ],
    },
    {
        id: 'synthesis',
        name: 'Synthesis',
        specRef: '1.3',
        description: 'Sound design fundamentals — oscillators, filters, envelopes, and modulation.',
        icon: 'Waves',
        heroVideo: '/synthesis-hero.mp4',
        resourceIds: ['subtractive-synth-explorer', 'additive-synth-explorer', 'operator-image-explorer', 'operator-assessment', 'pitch-synth-monitors-assessment'],
        specSummary: [
            'Oscillators & waveforms — sine, square, sawtooth, triangle and their harmonic content',
            'Filters — low-pass, high-pass, band-pass; cutoff and resonance',
            'ADSR envelopes — shaping amplitude and filter movement over time',
            'LFOs as modulators — rate, depth and targets (pitch, filter, amplitude)',
            'FM synthesis in Operator — carrier/modulator, algorithms, feedback',
        ],
    },
    {
        id: 'sampling',
        name: 'Sampling',
        specRef: '1.4',
        description: 'Sample manipulation, time-stretching, layering, and creative sampling techniques.',
        icon: 'Scissors',
        heroVideo: '/stereo-hero.mp4',
        resourceIds: ['sampling-playground'],
        specSummary: [
            'Sample sources — breakbeats, vocals, instruments, field recordings',
            'Cropping, pitch-shifting, time-stretching and reverse sampling',
            'Creative processing — glitching, layering, loop creation, chopping',
            'Copyright awareness and clearance when using samples',
        ],
    },
    {
        id: 'midi',
        name: 'MIDI & Sequencing',
        specRef: '1.5',
        description: 'MIDI messages, controllers, sequencing workflows, and automation.',
        icon: 'Piano',
        heroVideo: '/midi-hero.mp4',
        resourceIds: ['midi-pitch-bend-controller', 'midi-binary-assessment'],
        specSummary: [
            'Real-time input via MIDI keyboard and non-real-time input via step grid / pencil',
            'Quantise — hard values, swing/percentage, snap/grid',
            'Editing — velocity, note length, piano roll and list editor, looping, duplicating',
            'MIDI data bytes — note on/off, pitch, controllers, pitch bend, LSB/MSB, tempo',
        ],
    },
    {
        id: 'dynamics',
        name: 'Dynamic Processing',
        specRef: '1.9',
        description: 'Compressors, limiters, expanders, and gates — controlling dynamic range.',
        icon: 'Activity',
        heroVideo: '/compressor-hero.mp4',
        resourceIds: ['compressor-explorer', 'compressor-curve-practice', 'compressor-image-explorer', 'compressor-assessment', 'gate-image-explorer', 'gate-assessment', 'rtq-dynamic-compression'],
        specSummary: [
            'Uses of compression — dynamic range control, sustain, punch, glue',
            'Compressor parameters — threshold, ratio, attack, release, knee, make-up gain',
            'Uses of gating — noise reduction, tightening, rhythmic effects, bleed control',
            'Gate parameters — threshold, range, attack, release, hold, side-chain',
            'Related processes — limiting, expansion, de-essing, pumping',
        ],
    },
    {
        id: 'eq',
        name: 'EQ & Filters',
        specRef: '1.11',
        description: 'Equalisation types, filter shapes, frequency manipulation, and spectral shaping.',
        icon: 'BarChart3',
        heroVideo: '/eq-hero.mp4',
        resourceIds: [
            'graphic-parametric-eq',
            'eq-filter-bridge',
            'filter-rolloff-visualization',
            'eq-assessment-prototype',
            'essay-scaffold',
            'eq8-image-explorer',
            'eq8-assessment',
            'autofilter-image-explorer',
            'autofilter-assessment',
        ],
        specSummary: [
            'Filter types — low shelf, high shelf, band, low-pass, high-pass, band-pass',
            'EQ categories — parametric (frequency, gain, Q) vs graphic (fixed bands)',
            'Parameters — gain, cutoff, Q/bandwidth, slope, resonance',
            'Corrective uses — sibilance, rumble, resonance, hum',
            'Creative uses — tonal shaping, filter sweeps, spectral placement in a mix',
        ],
    },
    {
        id: 'reverb',
        name: 'Reverb',
        specRef: '1.12',
        description: 'Acoustic spaces, reverb types, pre-delay, decay, diffusion, and spatial processing. One of the four effects grouped under spec section 1.12 (with Delay, Distortion and Modulation).',
        icon: 'Radius',
        heroVideo: '/reverb-hero.mp4',
        resourceIds: ['acoustics-flashcards', 'reverb-image-explorer', 'reverb-assessment', 'acoustics-psychoacoustics'],
        specSummary: [
            'Reverb types — room, hall, chamber, plate, spring, algorithmic, convolution, hybrid',
            'Core parameters — pre-delay, decay/RT60, diffusion, damping, wet/dry, early reflections',
            'Send/return routing vs insert; pre-fader vs post-fader sends',
            'Creative vs corrective use, and integration with EQ on reverb returns',
        ],
    },
    {
        id: 'delay',
        name: 'Delay',
        specRef: '1.12',
        description: 'Delay time, feedback, pan and EQ on the wet signal, slapback, timed and ping-pong delay, and Automatic Double Tracking. One of the four effects grouped under spec section 1.12 (with Reverb, Distortion and Modulation).',
        icon: 'Repeat',
        heroVideo: '/delay-hero.mp4',
        resourceIds: ['delay-effects', 'bpm-delay-calculator', 'delay-image-explorer', 'delay-assessment', 'delay-flashcards', 'double-tracking-explorer'],
        specSummary: [
            'Core parameters — delay time, feedback, wet/dry; EQ and pan on the wet signal',
            'Tempo-synced delays — quarter, eighth, dotted, triplet values',
            'Delay types — slapback, timed, ping-pong',
            'Automatic Double Tracking (ADT) and its use for thickening vocals',
        ],
    },
    {
        id: 'distortion',
        name: 'Distortion',
        specRef: '1.12',
        description: 'Overdrive, fuzz, saturation, and clipping — how distortion shapes waveforms and harmonic content. One of the four effects grouped under spec section 1.12 (with Reverb, Delay and Modulation).',
        icon: 'Zap',
        heroVideo: '/distortion-hero.mp4',
        resourceIds: ['combined-distortion-lab'],
        specSummary: [
            'Types — overdrive, distortion, fuzz, saturation, bitcrushing',
            'Core parameters — drive/gain, tone, output level, mix/blend',
            'Clipping — soft vs hard; odd vs even harmonic content',
            'Analogue (tube, transistor, transformer) vs digital (waveshaping, bitcrushing)',
        ],
    },
    {
        id: 'leads-and-signals',
        name: 'Leads & Signals',
        specRef: '2.3',
        description: 'Cables, connectors, signal flow, and effect-chain order for tracking and mixing.',
        icon: 'Cable',
        heroVideo: '/leads-and-signals-hero.mp4',
        resourceIds: ['audio-leads-flashcards', 'signal-chain-eurorack', 'patch-bay-simulator'],
        specSummary: [
            'Connector types — XLR, TRS, TS, RCA — and where each is used',
            'Balanced vs unbalanced signal paths and noise rejection',
            'DI boxes, impedance matching, and instrument level vs line level',
            'Order of effects in a mixing chain (clean → dynamics → time-based → limiting)',
            'Insert vs aux send routing — especially for reverb and parallel processing',
        ],
    },
    {
        id: 'digital-analogue',
        name: 'Digital & Analogue',
        specRef: '2.4',
        description: 'ADC and DAC conversion, sampling, Nyquist theorem, aliasing, bit depth, quantisation, and the complete signal chain.',
        icon: 'Binary',
        heroVideo: '/digital-analogue-hero.mp4',
        resourceIds: ['adc-explorer', 'signal-chain-builder', 'digital-analogue', 'digital-audio-assessment'],
        specSummary: [
            'Analogue (continuous) vs digital (discrete) signals and their trade-offs',
            'ADC and DAC — the conversion pipeline from mic to DAW to monitors',
            'Sample rate — 44.1/48/96 kHz and what they capture (temporal resolution)',
            'Nyquist theorem — sample rate must be ≥ 2× the highest frequency',
            'Bit depth and quantisation — resolution, noise floor, quantisation error',
        ],
    },
    {
        id: 'numeracy',
        name: 'Numeracy',
        specRef: '2.5',
        description: 'Calculations for audio — decibels, frequency ratios, sample rates, and bit depth.',
        icon: 'Calculator',
        heroVideo: '/numeracy-hero.mp4',
        resourceIds: ['octave-period-trainer', 'waveform-explorer', 'bpm-delay-calculator', 'waveform-drawing-assessment', 'levels-metering-assessment'],
        specSummary: [
            'Frequency & pitch — A4 = 440 Hz, octave doubling, harmonic series, cents',
            'Decibels — logarithmic scale, voltage/power/SPL, dynamic range',
            'Sample rate, bit depth and file size calculations',
            'BPM ↔ milliseconds for tempo-synced delay times',
        ],
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
