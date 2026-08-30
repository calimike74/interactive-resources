// Topic definitions for Component 4 topic-based navigation
// Each topic maps to a spec area and links to its interactive resources
//
// WO-02 (2026-08-12): a band's displayed number + name are DERIVED from
// lib/spec-topics.js, not hand-typed here. Each band below stores one
// `specTopic` string — it must be an exact entry in SPEC_TOPICS or
// NON_SPEC_TOPICS — and splitSpecLabel() is the only thing allowed to split
// it into the `specRef`/`name` fields every consumer already reads. Get the
// label wrong and the build throws immediately, instead of a cosmetic
// mismatch shipping silently (which is exactly how "1.1 Recording &
// Production" and seven mis-filed resources happened — see
// Planning-and-Admin/Interactive-Resources-Upgrade/WO-02-spec-truth-refile.md).
//
// Bands keep stable `id` strings across this refile even where the display
// name changes (marketing suffixes like "MIDI & Sequencing" die in favour of
// the bare spec wording) — URLs, MEMBER_SLUGS and the Map Room must not break.
//
// Empty bands (Mike's ruling, 2026-08-12: every C4 spec topic gets a visible
// band, including the ones with nothing in them yet) carry `status:
// 'in-build'`, a spec-anchored `specSummary`, and a `nearestLiveTopicId`
// pointer used by the in-build page state instead of a silent hole.

import { splitSpecLabel } from './spec-topics.js';

const rawTopics = [
    {
        id: 'general',
        specTopic: '1.0 General Skills',
        description: 'Cross-topic skills, listening techniques, and exam preparation strategies.',
        icon: 'BookOpen',
        heroVideo: '/general-hero.mp4',
        resourceIds: ['reveal-explorer', 'essay-scaffold-practice', 'production-analysis'],
    },
    {
        id: 'software-hardware',
        specTopic: '1.1 Software and Hardware',
        description: 'DAWs, audio interfaces, MIDI controllers and the hardware that makes up a studio signal chain.',
        icon: 'HardDrive',
        resourceIds: [],
        status: 'in-build',
        nearestLiveTopicId: 'microphones',
        specSummary: [
            'DAW software and its core features: multi-track recording, MIDI sequencing, editing, mixing, plug-in hosting',
            'Audio interfaces: ADC/DAC conversion, sample rate, bit depth, inputs/outputs, preamp quality',
            'MIDI controllers and their integration with a DAW',
            'System requirements and drivers: ASIO, Core Audio, buffer size and latency',
            'The studio signal chain: microphone, DI box, interface, console, monitors, outboard',
        ],
    },
    {
        id: 'microphones',
        specTopic: '1.2 Microphones',
        description: 'Microphone types, polar patterns, gain structure, and multi-mic technique for capturing sound.',
        icon: 'Mic',
        resourceIds: ['stereo-recording-essay'],
        relatedTopics: ['1.0 General Skills'],
        specSummary: [
            'Dynamic vs condenser microphones, and phantom power',
            'Polar patterns: cardioid, omnidirectional, figure-of-eight',
            'Proximity effect and gain structure for a clean signal',
            'Multi-mic technique: the 3:1 rule and phase cancellation',
        ],
    },
    {
        id: 'synthesis',
        specTopic: '1.3 Synthesis',
        description: 'Sound design fundamentals: oscillators, filters, envelopes, and modulation.',
        icon: 'Waves',
        heroVideo: '/synthesis-hero.mp4',
        resourceIds: ['subtractive-synth-explorer', 'additive-synth-explorer', 'operator-image-explorer', 'operator-assessment'],
        specSummary: [
            'Oscillators & waveforms: sine, square, sawtooth, triangle and their harmonic content',
            'Filters: low-pass, high-pass, band-pass; cutoff and resonance',
            'ADSR envelopes: shaping amplitude and filter movement over time',
            'LFOs as modulators: rate, depth and targets (pitch, filter, amplitude)',
            'FM synthesis in Operator: carrier/modulator, algorithms, feedback',
        ],
    },
    {
        id: 'sampling',
        specTopic: '1.4 Sampling',
        description: 'Sample manipulation, time-stretching, layering, and creative sampling techniques.',
        icon: 'Scissors',
        resourceIds: [],
        status: 'in-build',
        nearestLiveTopicId: 'synthesis',
        specSummary: [
            'Sample sources: breakbeats, vocals, instruments, field recordings',
            'Cropping, pitch-shifting, time-stretching and reverse sampling',
            'Creative processing: glitching, layering, loop creation, chopping',
            'Copyright awareness and clearance when using samples',
        ],
    },
    {
        id: 'midi',
        specTopic: '1.5 Sequencing',
        description: 'MIDI messages, controllers, sequencing workflows, and automation.',
        icon: 'Piano',
        heroVideo: '/midi-hero.mp4',
        resourceIds: ['piano-roll', 'midi-binary-assessment'],
        specSummary: [
            'Real-time input via MIDI keyboard and non-real-time input via step grid / pencil',
            'Quantise: hard values, swing/percentage, snap/grid',
            'Editing: velocity, note length, piano roll and list editor, looping, duplicating',
            'MIDI data bytes: note on/off, pitch, controllers, pitch bend, LSB/MSB, tempo',
        ],
    },
    {
        id: 'audio-editing',
        specTopic: '1.6 Audio Editing',
        description: 'Destructive and non-destructive editing, comping, crossfades, and time/pitch manipulation of audio.',
        icon: 'Slice',
        resourceIds: ['edit-bench'],
        specSummary: [
            'Destructive vs non-destructive editing, and comping from multiple takes',
            'Cutting, trimming and zero-crossing edits to avoid clicks',
            'Fades and crossfades between adjacent regions',
            'Time-stretching and pitch-shifting: changing one without the other',
        ],
    },
    {
        id: 'pitch-rhythm-correction',
        specTopic: '1.7 Pitch and Rhythm Correction',
        description: 'Correcting pitch and timing in recorded audio: warp markers, transposition, and time-stretching.',
        icon: 'AudioWaveform',
        resourceIds: ['pitch-synth-monitors-assessment'],
        relatedTopics: ['1.3 Synthesis', '2.2 Monitor Speakers'],
        specSummary: [
            'Warp markers and time-stretching without affecting pitch',
            'Transposing pitch in semitones and cents',
            'Time-stretching vs pitch-shifting: two separate operations',
            'Choosing the right warp mode for the material',
        ],
    },
    {
        id: 'automation',
        specTopic: '1.8 Automation',
        description: 'Automating volume, panning and effect parameters to shape a mix over time.',
        icon: 'SlidersHorizontal',
        resourceIds: ['automation-lane'],
        status: 'live',
        specSummary: [
            'Automating volume, panning and effect parameters over time',
            'Linear, curved, step and LFO-driven automation',
            'Drawing and recording automation in a DAW',
            'Using automation to fix problems and to shape a mix creatively',
        ],
    },
    {
        id: 'dynamics',
        specTopic: '1.9 Dynamic Processing',
        description: 'Compressors, limiters, expanders, and gates: controlling dynamic range.',
        icon: 'Activity',
        heroVideo: '/compressor-hero.mp4',
        resourceIds: ['dynamics-bench', 'compressor-curve-practice', 'compressor-image-explorer', 'compressor-assessment', 'gate-image-explorer', 'gate-assessment', 'rtq-dynamic-compression'],
        specSummary: [
            'Uses of compression: dynamic range control, sustain, punch, glue',
            'Compressor parameters: threshold, ratio, attack, release, knee, make-up gain',
            'Uses of gating: noise reduction, tightening, rhythmic effects, bleed control',
            'Gate parameters: threshold, range, attack, release, hold, side-chain',
            'Related processes: limiting, expansion, de-essing, pumping',
        ],
    },
    {
        id: 'stereo',
        specTopic: '1.10 Stereo',
        description: 'Stereo miking techniques, psychoacoustic localisation, and mono compatibility.',
        icon: 'ArrowLeftRight',
        resourceIds: ['stereo-panning'],
        relatedTopics: ['1.2 Microphones'],
        specSummary: [
            'ITD and IID: how the ear locates sound in the stereo field',
            'Stereo miking: XY, spaced pair (AB), and Mid-Side',
            'Mono compatibility, and why bass is panned centre',
            'Panning conventions from the audience perspective',
        ],
    },
    {
        id: 'eq',
        specTopic: '1.11 EQ',
        description: 'Equalisation types, filter shapes, frequency manipulation, and spectral shaping.',
        icon: 'BarChart3',
        heroVideo: '/eq-hero.mp4',
        resourceIds: [
            'eq-bench',
            'eq-filter-bridge',
            'filter-rolloff-visualization',
            'essay-scaffold',
            'eq8-image-explorer',
            'eq8-assessment',
            'autofilter-image-explorer',
            'autofilter-assessment',
        ],
        specSummary: [
            'Filter types: low shelf, high shelf, band, low-pass, high-pass, band-pass',
            'EQ categories: parametric (frequency, gain, Q) vs graphic (fixed bands)',
            'Parameters: gain, cutoff, Q/bandwidth, slope, resonance',
            'Corrective uses: sibilance, rumble, resonance, hum',
            'Creative uses: tonal shaping, filter sweeps, spectral placement in a mix',
        ],
    },
    {
        id: 'delay',
        specTopic: '1.12 Delay',
        description: 'Delay time, feedback, pan and EQ on the wet signal, slapback, timed and ping-pong delay, and Automatic Double Tracking. One of the four effects grouped under spec section 1.12 (with Reverb, Distortion and Modulation).',
        icon: 'Repeat',
        heroVideo: '/delay-hero.mp4',
        resourceIds: ['delay-effects', 'bpm-delay-calculator', 'delay-image-explorer', 'delay-assessment', 'delay-flashcards', 'double-tracking-explorer'],
        specSummary: [
            'Core parameters: delay time, feedback, wet/dry; EQ and pan on the wet signal',
            'Tempo-synced delays: quarter, eighth, dotted, triplet values',
            'Delay types: slapback, timed, ping-pong',
            'Automatic Double Tracking (ADT) and its use for thickening vocals',
        ],
    },
    {
        id: 'distortion',
        specTopic: '1.12 Distortion',
        description: 'Overdrive, fuzz, saturation, and clipping: how distortion shapes waveforms and harmonic content. One of the four effects grouped under spec section 1.12 (with Reverb, Delay and Modulation).',
        icon: 'Zap',
        heroVideo: '/distortion-hero.mp4',
        resourceIds: ['combined-distortion-lab'],
        specSummary: [
            'Types: overdrive, distortion, fuzz, saturation, bitcrushing',
            'Core parameters: drive/gain, tone, output level, mix/blend',
            'Clipping: soft vs hard; odd vs even harmonic content',
            'Analogue (tube, transistor, transformer) vs digital (waveshaping, bitcrushing)',
        ],
    },
    {
        id: 'modulation',
        specTopic: '1.12 Modulation',
        description: 'Chorus, flanger, phaser, tremolo, vibrato and ring modulation: the LFO-driven effects family. One of the four effects grouped under spec section 1.12 (with Reverb, Delay and Distortion).',
        icon: 'Waypoints',
        resourceIds: [],
        status: 'in-build',
        nearestLiveTopicId: 'delay',
        specSummary: [
            'Chorus, flanger, phaser, tremolo, vibrato and ring modulation',
            'The LFO (rate, depth and waveform) as the modulator',
            'Telling tremolo (volume) apart from vibrato (pitch)',
            'How delay time and feedback separate chorus from flanger',
        ],
    },
    {
        id: 'reverb',
        specTopic: '1.12 Reverb',
        description: 'Acoustic spaces, reverb types, pre-delay, decay, diffusion, and spatial processing. One of the four effects grouped under spec section 1.12 (with Delay, Distortion and Modulation).',
        icon: 'Radius',
        heroVideo: '/reverb-hero.mp4',
        resourceIds: ['reverb-image-explorer', 'reverb-assessment'],
        specSummary: [
            'Reverb types: room, hall, chamber, plate, spring, algorithmic, convolution, hybrid',
            'Core parameters: pre-delay, decay/RT60, diffusion, damping, wet/dry, early reflections',
            'Send/return routing vs insert; pre-fader vs post-fader sends',
            'Creative vs corrective use, and integration with EQ on reverb returns',
        ],
    },
    {
        id: 'balance-and-blend',
        specTopic: '1.13 Balance and Blend',
        description: 'Setting relative levels, resolving frequency masking, and building a mix that works before any processing.',
        icon: 'Scale',
        resourceIds: ['balance-desk', 'mixing-production'],
        relatedTopics: ['1.10 Stereo', '1.11 EQ', '1.12 Effects'],
        specSummary: [
            'Balance: relative fader levels between mix elements',
            'Blend and masking: when instruments share a frequency region',
            'Making space by cutting, not by boosting everything louder',
            'The static mix: a mix that works on faders alone',
        ],
    },
    {
        id: 'mastering',
        specTopic: '1.14 Mastering',
        description: 'The final mastering chain, loudness standards, limiting and dithering before release.',
        icon: 'Disc3',
        resourceIds: [],
        status: 'in-build',
        nearestLiveTopicId: 'balance-and-blend',
        specSummary: [
            'The mastering chain: EQ, compression, multiband, stereo enhancement, limiting, dithering',
            'Loudness standards: LUFS, true peak, and streaming platform targets',
            'Limiting, dynamic range and the loudness war',
            'Dithering when reducing bit depth for the final format',
        ],
    },
    {
        id: 'acoustics',
        specTopic: '2.1 Acoustics',
        description: 'Room acoustics, reverberation, and the psychoacoustics of how we perceive loudness and space.',
        icon: 'Volume2',
        resourceIds: ['acoustics-flashcards', 'acoustics-psychoacoustics'],
        specSummary: [
            'RT60: how quickly reverb decays, and what shapes it',
            'Early reflections and the reverberant/direct sound ratio',
            'Absorption, diffusion, and standing waves in small rooms',
            'Equal-loudness contours and frequency/temporal masking',
        ],
    },
    {
        id: 'monitor-speakers',
        specTopic: '2.2 Monitor Speakers',
        description: 'Monitor types, frequency response, placement, and checking a mix across playback systems.',
        icon: 'MonitorSpeaker',
        resourceIds: [],
        status: 'in-build',
        nearestLiveTopicId: 'acoustics',
        specSummary: [
            'Nearfield, midfield and farfield monitors, active vs passive',
            'Flat frequency response, and why consumer speakers colour sound',
            'Equilateral triangle placement, ear height and room boundaries',
            'Checking a mix across multiple playback systems',
        ],
    },
    {
        id: 'leads-and-signals',
        specTopic: '2.3 Signals',
        description: 'Cables, connectors, signal flow, and effect-chain order for tracking and mixing.',
        icon: 'Cable',
        heroVideo: '/leads-and-signals-hero.mp4',
        resourceIds: ['audio-leads-flashcards', 'signal-chain-eurorack'],
        specSummary: [
            'Connector types (XLR, TRS, TS, RCA) and where each is used',
            'Balanced vs unbalanced signal paths and noise rejection',
            'DI boxes, impedance matching, and instrument level vs line level',
            'Order of effects in a mixing chain (clean → dynamics → time-based → limiting)',
            'Insert vs aux send routing: especially for reverb and parallel processing',
        ],
    },
    {
        id: 'digital-analogue',
        specTopic: '2.4 Digital Analogue',
        description: 'ADC and DAC conversion, sampling, Nyquist theorem, aliasing, bit depth, quantisation, and the complete signal chain.',
        icon: 'Binary',
        heroVideo: '/digital-analogue-hero.mp4',
        resourceIds: ['adc-explorer', 'signal-chain-builder', 'digital-analogue', 'digital-audio-assessment', 'sampling-playground'],
        specSummary: [
            'Analogue (continuous) vs digital (discrete) signals and their trade-offs',
            'ADC and DAC: the conversion pipeline from mic to DAW to monitors',
            'Sample rate: 44.1/48/96 kHz and what they capture (temporal resolution)',
            'Nyquist theorem: sample rate must be ≥ 2× the highest frequency',
            'Bit depth and quantisation: resolution, noise floor, quantisation error',
        ],
    },
    {
        id: 'numeracy',
        specTopic: '2.5 Numeracy',
        description: 'Calculations for audio: decibels, frequency ratios, sample rates, and bit depth.',
        icon: 'Calculator',
        heroVideo: '/numeracy-hero.mp4',
        resourceIds: ['octave-period-trainer', 'waveform-explorer', 'bpm-delay-calculator', 'waveform-drawing-assessment'],
        specSummary: [
            'Frequency & pitch: A4 = 440 Hz, octave doubling, harmonic series, cents',
            'Decibels: logarithmic scale, voltage/power/SPL, dynamic range',
            'Sample rate, bit depth and file size calculations',
            'BPM ↔ milliseconds for tempo-synced delay times',
        ],
    },
    {
        id: 'levels',
        specTopic: '2.6 Levels',
        description: 'Metering standards, headroom, and the difference between analogue and digital reference levels.',
        icon: 'GaugeCircle',
        resourceIds: ['levels-metering-assessment'],
        relatedTopics: ['2.5 Numeracy'],
        specSummary: [
            'dBFS vs 0 dBu: the digital ceiling vs the analogue reference level',
            'Peak vs RMS metering, and why peak prevents clipping',
            'Headroom before mastering, and professional vs consumer line level',
            'LUFS, and why the decibel scale is logarithmic',
        ],
    },
];

const topics = rawTopics.map((band) => {
    const { number, name } = splitSpecLabel(band.specTopic);
    return { ...band, specRef: number, name };
});

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

/** Presentational only — "C4 · 1.3", never stored, never used as a lookup key. */
export function withComponentPrefix(specRef) {
    return `C4 · ${specRef}`;
}
