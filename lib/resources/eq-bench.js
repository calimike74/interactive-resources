// The EQ bench (1.11). Built 2026-08-27 to the Bench Standard
// (Planning-and-Admin/Interactive-Resources-Upgrade/BENCH-STANDARD.md),
// second bench after the Delay bench: one viewport, real sound, the EQ's
// curve drawn from the same numbers that make it, over the live spectrum
// of the source. Replaces graphic-parametric-eq on the paying surface
// (that id is a retired stub now; see app/graphic-parametric-eq/page.js).

const eqBench = {
    id: 'eq-bench',
    title: 'EQ bench',
    description: 'Real drums, an 808, a vocal phrase and stabs through a real five-band EQ. High-pass and low-pass with their slopes, two shelves, one parametric band with frequency, gain and Q. The curve you draw is the curve you hear, over the sound’s own spectrum.',
    topic: '1.11 EQ',
    relatedTopics: ['1.3 Synthesis', '1.12 Delay', '1.13 Balance and Blend'],
    type: 'interactive',
    kind: 'bench',
    icon: '',
    estimatedTime: '10-15 minutes',
    learningObjectives: [
        'Hear and see what a high-pass or low-pass filter does at a cutoff, and what its slope in dB per octave means',
        'Hear and see a shelf against a bell, and read Q as a width in octaves',
        'Judge a boost or a cut against the part it is on: where a voice, a kit and an 808 keep their weight',
        'Say what a parametric EQ can do that a graphic EQ cannot, having tried both',
    ],
    prepFor: [],
    component: 'EqBench',
    keywords: ['EQ', 'equaliser', 'filter', 'high-pass', 'low-pass', 'shelf', 'parametric', 'graphic', 'Q', 'bandwidth', 'cutoff', 'slope', 'dB per octave'],
    difficulty: 'foundation',
};

export default eqBench;
