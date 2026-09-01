// Centralised glossary of technical terms across all interactive resources
// Used by context menu for "Define This Term" and "Quick Quiz" features

const glossary = [
    // --- Additive Synth Explorer ---
    // The vocabulary every waveform definition below already leans on. It was
    // missing from the glossary entirely, so "contains only odd harmonics" was
    // being explained with a word the glossary could not define.
    { term: 'Fundamental', definition: 'The lowest frequency in a sound, and the one you hear as its pitch. Written H1. Everything stacked above it is a harmonic.', resource: 'additive-synth-explorer', topic: '1.3' },
    { term: 'Harmonic', definition: 'A frequency sitting above the fundamental at a whole-number multiple of it: 2x, 3x, 4x and so on. Which harmonics are present, and how strong each one is, is what makes two instruments playing the same note sound different.', resource: 'additive-synth-explorer', topic: '1.3' },
    { term: 'Harmonic Series', definition: 'The whole stack of whole-number multiples above a fundamental. A note at 220 Hz has harmonics at 440, 660, 880 Hz and upwards.', resource: 'additive-synth-explorer', topic: '1.3' },
    { term: 'Additive Synthesis', definition: 'Building a sound by stacking simple sine tones, one per harmonic, and setting the strength of each. The opposite approach to subtractive synthesis, which starts with a rich waveform and filters harmonics away.', resource: 'additive-synth-explorer', topic: '1.3' },
    { term: 'Timbre', definition: 'The tone colour of a sound: what makes a clarinet and a violin playing the same note at the same volume still sound like different instruments. It is set by the pattern of harmonics inside the sound.', resource: 'additive-synth-explorer', topic: '1.3' },
    { term: 'Spectrum', definition: 'A display of which frequencies are present in a sound and how strong each one is. Every DAW has a spectrum analyser; on a sustained note the peaks line up with the harmonic series.', resource: 'additive-synth-explorer', topic: '1.3' },

    // --- Subtractive Synth Explorer ---
    { term: 'Sine Wave', definition: 'Contains only the fundamental frequency, no harmonics. Produces a pure, smooth tone. The simplest waveform.', resource: 'synth-bench', topic: '1.3' },
    { term: 'Triangle Wave', definition: 'Contains odd harmonics only (1st, 3rd, 5th...) at reduced amplitude. Sounds softer than a square wave, slightly hollow but warm.', resource: 'synth-bench', topic: '1.3' },
    { term: 'Sawtooth Wave', definition: 'Contains ALL harmonics (odd and even) at decreasing amplitude. Sounds bright and buzzy: the most common starting point for subtractive synthesis.', resource: 'synth-bench', topic: '1.3' },
    { term: 'Square Wave', definition: 'Contains only odd harmonics at higher amplitude than triangle. Sounds hollow and woody: often used for bass and pad sounds.', resource: 'synth-bench', topic: '1.3' },
    { term: 'Low-Pass Filter', definition: 'Passes frequencies below the cutoff and attenuates those above. Sweeping the cutoff down makes the sound darker and more muffled: the most common filter in subtractive synthesis.', resource: 'synth-bench', topic: '1.3' },
    { term: 'High-Pass Filter', definition: 'Passes frequencies above the cutoff and attenuates those below. Makes the sound thinner and brighter. Useful for removing low-end rumble.', resource: 'synth-bench', topic: '1.3' },
    { term: 'Band-Pass Filter', definition: 'Passes a band of frequencies around the cutoff and attenuates both sides. Creates a "nasal" or "telephone" quality at narrow bandwidth.', resource: 'synth-bench', topic: '1.3' },
    { term: 'Resonance', definition: 'Boosts frequencies at the cutoff point, creating a peak. High resonance produces a whistling or ringing quality. At extreme values, the filter self-oscillates.', resource: 'synth-bench', topic: '1.3' },
    { term: 'Attack', definition: 'The time it takes for the sound to rise from silence to full volume after the key is pressed. Short attack = instant punch. Long attack = slow swell.', resource: 'synth-bench', topic: '1.3' },
    { term: 'Decay', definition: 'The time it takes for the sound to fall from the peak to the sustain level. A short decay with low sustain creates a percussive "pluck" character.', resource: 'synth-bench', topic: '1.3' },
    { term: 'Sustain', definition: 'The level (not a time!) the sound holds at while the key remains pressed. The only ADSR parameter measured as a level, not a duration.', resource: 'synth-bench', topic: '1.3' },
    { term: 'Release', definition: 'The time it takes for the sound to fade to silence after the key is released. Long release = notes ring out. Short release = tight cutoff.', resource: 'synth-bench', topic: '1.3' },
    { term: 'ADSR', definition: 'Attack, Decay, Sustain, Release: the four stages of an envelope that shapes how a sound evolves over time. Controls amplitude, filter cutoff, or other parameters.', resource: 'synth-bench', topic: '1.3' },
    { term: 'Oscillator', definition: 'A component that generates a repeating waveform at a specified pitch. The raw sound source in subtractive synthesis before filtering and shaping.', resource: 'synth-bench', topic: '1.3' },

    // --- EQ Filter Bridge ---
    { term: 'LPF', definition: 'Low-Pass Filter: allows frequencies BELOW the cutoff to pass through. Removes high frequencies.', resource: 'eq-filter-bridge', topic: '1.11' },
    { term: 'HPF', definition: 'High-Pass Filter: allows frequencies ABOVE the cutoff to pass through. Removes low frequencies.', resource: 'eq-filter-bridge', topic: '1.11' },
    { term: 'BPF', definition: 'Band-Pass Filter: allows only frequencies AROUND the cutoff to pass. Removes both highs and lows.', resource: 'eq-filter-bridge', topic: '1.11' },
    { term: 'Notch Filter', definition: 'Removes frequencies at the cutoff point. The opposite of band-pass: cuts a narrow band while leaving everything else.', resource: 'eq-filter-bridge', topic: '1.11' },
    { term: 'Cutoff Frequency', definition: 'The frequency point where the filter begins to take effect. At this point, the signal is reduced by -3dB (half power).', resource: 'eq-filter-bridge', topic: '1.11' },
    { term: 'Q Factor', definition: 'Controls the bandwidth or sharpness of a filter or EQ band. Higher Q = narrower, more focused band. Lower Q = wider, more gentle curve.', resource: 'eq-filter-bridge', topic: '1.11' },
    { term: 'Slope', definition: 'How steeply the filter attenuates beyond the cutoff. Measured in dB per octave: common values are 6, 12, 18, or 24 dB/oct. Each 6dB/oct represents one "pole".', resource: 'eq-filter-bridge', topic: '1.11' },

    // --- Octave Period Trainer ---
    { term: 'Period', definition: 'The time for ONE complete cycle of a waveform. Measured in seconds or milliseconds. Period = 1/frequency.', resource: 'octave-period-trainer', topic: '2.5' },
    { term: 'Frequency', definition: 'The number of complete cycles per second. Measured in Hertz (Hz). Frequency = 1/period.', resource: 'octave-period-trainer', topic: '2.5' },
    { term: 'Octave', definition: 'A doubling or halving of frequency. Going up one octave = frequency × 2. Going down = frequency ÷ 2.', resource: 'octave-period-trainer', topic: '2.5' },
    { term: 'Amplitude', definition: 'The strength or magnitude of a signal, shown on the vertical (Y) axis of a waveform display. Represents air pressure displacement or voltage.', resource: 'octave-period-trainer', topic: '2.5' },

    // --- Filter Rolloff Visualization ---
    { term: 'Rolloff Rate', definition: 'How steeply a filter attenuates frequencies beyond the cutoff. Measured in dB per octave. Each 6dB/oct represents one "pole" in the filter circuit.', resource: 'filter-rolloff-visualization', topic: '1.3' },
    { term: 'Self-Oscillation', definition: 'When filter resonance is set high enough, the filter generates its own tone at the cutoff frequency. The filter becomes an oscillator.', resource: 'filter-rolloff-visualization', topic: '1.3' },

    // --- Graphic vs Parametric EQ ---
    { term: 'Graphic Equaliser', definition: 'An EQ where slider positions visually represent the EQ curve: what you see is what you get. Fixed frequency bands, fixed Q, only gain is adjustable.', resource: 'graphic-parametric-eq', topic: '1.11' },
    { term: 'Parametric EQ', definition: 'An EQ that allows control of centre frequency, gain, AND Q for each band: multiple adjustable parameters per band. More flexible than graphic EQ.', resource: 'graphic-parametric-eq', topic: '1.11' },
    { term: 'Gain', definition: 'The amount of boost or cut applied at a frequency, measured in dB. Positive gain = boost, negative gain = cut.', resource: 'graphic-parametric-eq', topic: '1.11' },

    // --- Double Tracking Explorer ---
    { term: 'ADT', definition: 'Automatic Double Tracking: invented at Abbey Road Studios in 1966. Uses short delay (10-40ms) with subtle pitch modulation to simulate a second performance.', resource: 'double-tracking-explorer', topic: '1.7' },
    { term: 'Double Tracking', definition: 'Recording the same part twice: the natural timing and pitch variations between takes create a wider, richer sound.', resource: 'double-tracking-explorer', topic: '1.7' },
    { term: 'Haas Effect', definition: 'Sounds arriving within 30-40ms of each other are perceived as one fused image, not separate echoes. The basis for ADT and stereo widening effects.', resource: 'double-tracking-explorer', topic: '1.7' },
    { term: 'Chorus Effect', definition: 'Created by mixing a signal with a delayed, pitch-modulated copy. Similar to ADT but often with longer delay times and more obvious modulation.', resource: 'double-tracking-explorer', topic: '1.7' },

    // --- Acoustics Flashcards ---
    { term: 'Reverberation', definition: 'Waveforms bouncing off surrounding surfaces that provide the brain with spatial information about the environment. Consists of direct sound, early reflections, and late reflections.', resource: 'acoustics-flashcards', topic: '1.6' },
    { term: 'Transmission', definition: 'When a sound wave hits a surface, some sound energy passes through the object to the other side.', resource: 'acoustics-flashcards', topic: '1.6' },
    { term: 'Reflection', definition: 'When a sound wave hits a surface, some sound energy bounces off, creating echoes and contributing to reverberation.', resource: 'acoustics-flashcards', topic: '1.6' },
    { term: 'Absorption', definition: 'When a sound wave hits a surface, some sound energy is trapped and converted to heat. Soft, porous materials absorb more sound.', resource: 'acoustics-flashcards', topic: '1.6' },
    { term: 'Direct Sound', definition: 'The original sound reaching the listener\'s ears first (~3.5ms). Travels the shortest path from source to listener with no reflections.', resource: 'acoustics-flashcards', topic: '1.6' },
    { term: 'Early Reflections', definition: 'The first reflections arriving ~5-25ms after direct sound. Provide the brain with information about room dimensions and shape.', resource: 'acoustics-flashcards', topic: '1.6' },
    { term: 'Late Reflections', definition: 'Dense, diffuse reflections that follow early reflections. Multiple bounces overlap until sound energy falls below the hearing threshold.', resource: 'acoustics-flashcards', topic: '1.6' },
    { term: 'RT60', definition: 'Reverberation Time 60: the time it takes for sound pressure level to fall by 60dB below the initial level. The standard measure of how reverberant a space is.', resource: 'acoustics-flashcards', topic: '1.6' },
    { term: 'SPL', definition: 'Sound Pressure Level, measured in decibels (dB). Quantifies the pressure variation caused by a sound wave relative to a reference level.', resource: 'acoustics-flashcards', topic: '1.6' },
    { term: 'Diffusion', definition: 'The scattering of sound waves in many directions by irregular surfaces. Creates a more even distribution of sound energy in a room.', resource: 'acoustics-flashcards', topic: '1.6' },
];

// Look up a term (case-insensitive, partial match)
export function findTerm(text) {
    if (!text) return null;
    const normalised = text.toLowerCase().trim();

    // Exact match first
    const exact = glossary.find(g => g.term.toLowerCase() === normalised);
    if (exact) return exact;

    // Check common abbreviations and aliases
    const aliases = {
        'lpf': 'Low-Pass Filter',
        'hpf': 'High-Pass Filter',
        'bpf': 'Band-Pass Filter',
        'low pass filter': 'Low-Pass Filter',
        'high pass filter': 'High-Pass Filter',
        'band pass filter': 'Band-Pass Filter',
        'low-pass': 'Low-Pass Filter',
        'high-pass': 'High-Pass Filter',
        'band-pass': 'Band-Pass Filter',
        'q': 'Q Factor',
        'q factor': 'Q Factor',
        'resonance': 'Resonance',
        'envelope': 'ADSR',
        'adsr envelope': 'ADSR',
        'adt': 'ADT',
        'automatic double tracking': 'ADT',
        'rt60': 'RT60',
        'reverberation time': 'RT60',
        'spl': 'SPL',
        'sound pressure level': 'SPL',
        'graphic eq': 'Graphic Equaliser',
        'parametric eq': 'Parametric EQ',
        'rolloff': 'Rolloff Rate',
        'roll-off': 'Rolloff Rate',
        'haas': 'Haas Effect',
    };

    const aliasMatch = aliases[normalised];
    if (aliasMatch) return glossary.find(g => g.term === aliasMatch);

    // Partial match — term starts with or contains the search text
    return glossary.find(g => g.term.toLowerCase().includes(normalised))
        || glossary.find(g => normalised.includes(g.term.toLowerCase()));
}

// Get a random quiz question for a given term
export function getQuizForTerm(entry) {
    if (!entry) return null;

    // Pick 3 random wrong answers from same topic first, then any
    const sameTopic = glossary.filter(g => g.topic === entry.topic && g.term !== entry.term);
    const others = glossary.filter(g => g.topic !== entry.topic && g.term !== entry.term);
    const pool = [...sameTopic, ...others];

    // Shuffle and pick 3
    const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, 3);
    const options = [...shuffled.map(g => ({ term: g.term, definition: g.definition, correct: false })),
        { term: entry.term, definition: entry.definition, correct: true }]
        .sort(() => Math.random() - 0.5);

    return {
        question: `What is "${entry.term}"?`,
        options,
        correctDefinition: entry.definition,
    };
}

// Get a random term for open retrieval practice
export function getRandomTerm(excludeTerm) {
    const filtered = excludeTerm ? glossary.filter(g => g.term !== excludeTerm) : glossary;
    return filtered[Math.floor(Math.random() * filtered.length)];
}

// Get all terms for a specific topic
function getTermsByTopic(topic) {
    return glossary.filter(g => g.topic === topic);
}

// Get all terms for a specific resource
function getTermsByResource(resourceId) {
    return glossary.filter(g => g.resource === resourceId);
}
