// The Reverb bench (1.12). Built 2026-09-02 to the Bench Standard
// (Planning-and-Admin/Interactive-Resources-Upgrade/BENCH-STANDARD.md),
// tenth bench and the last of the Explore ledger of 27 Aug. The 2D
// treatment of the topic's console: Inside the Room keeps the space in 3D,
// and Inside the Plate comes off the rail when this lands (Mike, 2 Sep).
// Design record: docs/superpowers/specs/2026-09-02-reverb-bench-design.md

const reverbBench = {
    id: 'reverb-bench',
    title: 'Reverb bench',
    description: 'A vocal, a guitar and a snare through a real convolution reverb, with the paper\'s own dials on it: Type, Pre-delay, Reverb time and Wet. The tail is drawn in decibels against time from the same impulse response the convolver holds, so the picture is the sound. The practical papers\' tasks as presets, judged the way the reports judge them.',
    topic: '1.12 Reverb',
    relatedTopics: ['2.1 Acoustics', '1.12 Delay', '2.3 Signals', '1.13 Balance and Blend'],
    type: 'interactive',
    kind: 'bench',
    icon: '',
    estimatedTime: '10-15 minutes',
    learningObjectives: [
        'Describe a reverb tail in the spec\'s words: the pre-delay gap, the early reflections and the reverb time',
        'Hear and see the six types the spec names, and say what makes each one that shape',
        'Set a reverb time and a wet level the way the practical paper asks, and judge when it swamps the part',
        'Explain why a reverb belongs on a send in stereo, and what goes wrong on a channel insert',
    ],
    prepFor: ['reverb-assessment'],
    component: 'ReverbBench',
    keywords: ['reverb', 'reverberation', 'RT60', 'reverb time', 'pre-delay', 'early reflections', 'reverb tail', 'room', 'hall', 'plate', 'spring', 'gated reverb', 'reverse reverb', 'damping', 'wet', 'dry', 'send', 'return', 'aux', 'insert', 'convolution', 'impulse response', 'stereo'],
    difficulty: 'foundation',
};

export default reverbBench;
