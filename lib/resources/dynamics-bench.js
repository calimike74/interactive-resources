// The Dynamics bench (1.9). Built 2026-08-28 to the Bench Standard
// (Planning-and-Admin/Interactive-Resources-Upgrade/BENCH-STANDARD.md),
// third bench after Delay and EQ: one viewport, real sound, the processor's
// gain drawn against the beat from the same numbers that make it, and the
// transfer curve the paper asks for, live. Replaces compressor-explorer on
// the paying surface (that id is a retired stub now; see
// app/compressor-explorer/page.js).

const dynamicsBench = {
    id: 'dynamics-bench',
    title: 'Dynamics bench',
    description: 'Real drums, an 808, a vocal phrase and stabs through a compressor, a limiter, a gate or an expander. Threshold, ratio, knee, attack, release and make-up, with the gain reduction drawn against the beat and the transfer curve drawn live. What is drawn is what you hear.',
    topic: '1.9 Dynamic Processing',
    relatedTopics: ['1.11 EQ', '1.3 Synthesis', '1.13 Balance and Blend'],
    type: 'interactive',
    kind: 'bench',
    icon: '',
    estimatedTime: '10-15 minutes',
    learningObjectives: [
        'Hear and see what a threshold and a ratio do to a part, and read gain reduction against the beat',
        'Hear attack and release as the front of a hit getting through and the level swinging back',
        'Tell a compressor from a limiter, a gate and an expander on the transfer curve, and name which line is limiting',
        'Judge a setting against the part it is on, the way the paper does, and say what you would change',
    ],
    prepFor: [],
    component: 'DynamicsBench',
    keywords: ['compressor', 'compression', 'limiter', 'gate', 'noise gate', 'expander', 'threshold', 'ratio', 'attack', 'release', 'knee', 'make-up gain', 'gain reduction', 'dynamic range', 'transfer curve'],
    difficulty: 'foundation',
};

export default dynamicsBench;
