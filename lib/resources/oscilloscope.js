// The Oscilloscope (2.5). Built 2026-08-30 to the Bench Standard
// (Planning-and-Admin/Interactive-Resources-Upgrade/BENCH-STANDARD.md),
// eighth bench after Delay, EQ, Dynamics, Edit, the Balance Desk, the
// Automation Lane and the Piano Roll: the topic flagged in every year's
// examiner report, put on a screen where the period is a length, the
// octave a halving, and the papers' own figures are presets.

const oscilloscope = {
    id: 'oscilloscope',
    title: 'Oscilloscope',
    description: 'A sound drawn against time in milliseconds, as the paper prints its figures. Real notes and the four waveforms; the period bracketed and draggable; the octave chips; the level in dB; the LFO timed to the tempo; the file as bytes. The papers\' own numeracy questions as presets, worked the way the scheme marks them.',
    topic: '2.5 Numeracy',
    relatedTopics: ['1.3 Synthesis', '2.4 Digital Analogue', '1.12 Modulation', '1.5 Sequencing'],
    type: 'interactive',
    kind: 'bench',
    icon: '',
    estimatedTime: '10-15 minutes',
    learningObjectives: [
        'Read a period off a screen in ms, write it in s, and give the frequency and the pitch',
        'Hear and see an octave as a doubling of frequency and a halving of period',
        'Tell amplitude from period: louder is height, pitch is length',
        'Work an LFO rate from a tempo, and a file size from channels, sample rate and bit depth',
    ],
    prepFor: ['waveform-drawing-assessment'],
    component: 'Oscilloscope',
    keywords: ['oscilloscope', 'waveform', 'period', 'frequency', 'hertz', 'milliseconds', 'octave', 'sine', 'square', 'saw', 'triangle', 'decibel', 'amplitude', 'lfo', 'tempo', 'sample rate', 'bit depth', 'file size', 'numeracy'],
    difficulty: 'foundation',
};

export default oscilloscope;
