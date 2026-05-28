// Examiner hints curated from 2025 Principal Examiner's Reports
// Keyed by spec reference (topic code). Each topic has 1-3 actionable hints.
// Source: Edexcel 9MT0 Components 3 & 4, 2025

const examinerHints = {
    '1.1': [
        {
            title: 'Recording & Production',
            hint: 'Many candidates did not fully remove noise from the start of the track — zoom in and listen carefully before top-and-tailing.',
        },
    ],
    '1.2': [
        {
            title: 'Audio Capture',
            hint: 'Avoid vague descriptions like "sounds cleaner" — be specific. For example, say the DI signal had "less background noise" or "no room ambience".',
        },
        {
            title: 'Audio Capture',
            hint: 'When asked to analyse capture and EQ together, answer both parts. Candidates often wrote extensively about EQ but missed easier marks about capture methods.',
        },
    ],
    '1.3': [
        {
            title: 'Synthesis',
            hint: 'Many candidates struggle to identify specific synthesis parameters (oscillator, filter, envelope) that shape a sound. Brush up on how subtractive synthesisers work.',
        },
        {
            title: 'Synthesis',
            hint: 'When comparing quantise use across parts, avoid assumptions. A common misconception was that drums were strictly quantised and sounded mechanical.',
        },
    ],
    '1.5': [
        {
            title: 'MIDI & Sequencing',
            hint: 'Most candidates are now comfortable with decimal-to-binary conversion, but several lost marks by misidentifying velocity values. Read the piano roll carefully.',
        },
        {
            title: 'MIDI & Sequencing',
            hint: 'DAW-based tasks like drawing notes on a piano roll were answered well — confidence in using DAW software to problem-solve pays off.',
        },
    ],
    '1.7': [
        {
            title: 'Pitch Correction',
            hint: 'When asked to describe the use of pitch correction, describe what you hear (e.g. subtle tuning vs obvious effect), not just what pitch correction is.',
        },
    ],
    '1.9': [
        {
            title: 'Dynamic Processing',
            hint: 'When compressing vocals, many candidates failed to set a sufficiently low threshold or high enough ratio to make the vocal sit above the mix.',
        },
        {
            title: 'Dynamic Processing',
            hint: 'For sidechain compression questions, explain the routing clearly: the compressor goes on the affected track (e.g. chords), with the kick as the sidechain input. Include at least one parameter setting.',
        },
    ],
    '1.10': [
        {
            title: 'Stereo & Panning',
            hint: 'Double tracking continues to challenge candidates. To create a wide ADT effect, duplicate the part, apply slight timing/pitch variation, and pan hard left and right.',
        },
    ],
    '1.11': [
        {
            title: 'EQ & Filters',
            hint: 'Know how to draw filter shapes accurately — candidates who scored full marks clearly demonstrated knowledge of shelf boost and HPF curves.',
        },
        {
            title: 'EQ & Filters',
            hint: 'Many incorrect answers for calculating frequency from a waveform. Make sure you can confidently convert period (ms) → frequency (Hz) using f = 1/T.',
        },
    ],
    '1.12': [
        {
            title: 'Reverb & Delay',
            hint: 'Creating distance effects is challenging — most candidates struggled with fading the dry signal out while increasing reverb to simulate the vocal getting more distant.',
        },
        {
            title: 'Reverb & Delay',
            hint: 'When describing delay effects, go beyond "it repeats." Specify the type (slapback, tape, ping-pong), timing, and any filtering or feedback characteristics.',
        },
    ],
    '1.13': [
        {
            title: 'Mixing & Balance',
            hint: 'Most common mixing error: the synth was too loud in the chorus, masking the vocal part. Always A/B check your balance decisions.',
        },
    ],
    '2.4': [
        {
            title: 'Digital & Analogue',
            hint: 'When explaining how sample rate and bit depth improve quality, don\'t just define them — explain the effect. Higher sample rate captures more frequency content; higher bit depth gives more dynamic range.',
        },
        {
            title: 'Digital & Analogue',
            hint: 'Know where the ADC sits in the signal chain. Just over half of candidates could identify this — those who scored 0 tended not to attempt the question.',
        },
    ],
    '2.5': [
        {
            title: 'Numeracy',
            hint: 'A common error: writing 0.02s instead of 0.002s for a 2ms period. Remember there are 1000ms in 1s, not 100.',
        },
        {
            title: 'Numeracy',
            hint: 'Only 35% scored marks for frequency calculation. Practice: Period (ms) → divide by 1000 → get seconds → f = 1/T.',
        },
    ],
    // Component 3 topics (Listening & Analysing)
    '3.1': [
        {
            title: 'Identifying Sounds',
            hint: 'Be specific when identifying instruments or tracks. Saying "drum kit" is too vague — name the specific element like "hi-hats" or "snare".',
        },
    ],
    '3.2': [
        {
            title: 'Effects Recognition',
            hint: 'When describing reverb changes across a song, work chronologically through the sections and reference likely parameter settings (decay time, wet/dry mix).',
        },
    ],
    '3.4': [
        {
            title: 'Production Techniques',
            hint: 'For "how would you achieve this in a DAW" questions, include specific settings. Many candidates scored 3/4 because they described the process but omitted compressor parameters.',
        },
        {
            title: 'Production Techniques',
            hint: 'DI advantages go beyond "less noise." Discuss isolation, consistent tone, no bleed, and suitability for re-amping.',
        },
    ],
    '3.8': [
        {
            title: 'Mastering & Remastering',
            hint: 'When discussing remastering, focus on mastering processes (EQ, limiting, stereo width) not individual track mixing. AI-assisted remastering can adjust individual elements from a stereo master, but explain this clearly.',
        },
    ],
};

/**
 * Get examiner hints for a given topic code
 * @param {string} topicCode - Spec reference like '1.9', '2.4'
 * @returns {Array} Array of { title, hint } objects, or empty array
 */
export function getHintsForTopic(topicCode) {
    return examinerHints[topicCode] || [];
}

/**
 * Check if a topic code has examiner hints available
 * @param {string} topicCode - Spec reference
 * @returns {boolean}
 */
export function hasHints(topicCode) {
    return Boolean(examinerHints[topicCode]?.length);
}
