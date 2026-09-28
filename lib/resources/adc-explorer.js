// The ADC Explorer (2.4). Rebuilt 2026-09-28 to the Bench Standard
// (Planning-and-Admin/Interactive-Resources-Upgrade/BENCH-STANDARD.md) from
// the old two-tab reading page: one picture of a converter at work, the
// sample rate and the bit depth as two dials on it, heard through the same
// converter the stage draws.

const adcExplorer = {
    id: 'adc-explorer',
    title: 'ADC Explorer',
    description: 'A sound going through a converter, drawn as it is sampled: the wave in, a dot for every sample, the levels they are rounded to, and the wave the DAC gives back. Sample rate and bit depth as two dials, heard as you turn them; aliasing, Nyquist and dynamic range worked on the stage.',
    topic: '2.4 Digital Analogue',
    relatedTopics: ['2.5 Numeracy', '1.4 Sampling', '2.6 Levels'],
    type: 'interactive',
    kind: 'bench',
    icon: '',
    estimatedTime: '10-15 minutes',
    learningObjectives: [
        'Describe how an ADC samples an analogue signal at regular intervals and a DAC turns the samples back into a voltage',
        'Explain how sample rate sets the highest frequency kept: half the rate, the Nyquist frequency',
        'Explain aliasing: a frequency above half the sample rate returns as a false lower one',
        'Explain how bit depth sets the levels (2^n) and the dynamic range (about 6 dB a bit), and what quantisation noise sounds like',
    ],
    prepFor: [],
    component: 'ADCExplorer',
    keywords: ['ADC', 'DAC', 'sampling', 'sample rate', 'bit depth', 'Nyquist', 'aliasing', 'anti-alias filter', 'quantisation', 'dynamic range', 'dither', 'digital', 'analogue', 'conversion'],
    difficulty: 'foundation',
};

export default adcExplorer;
