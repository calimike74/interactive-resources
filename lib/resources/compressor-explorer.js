// RETIRED from the customer registry 2026-08-28: replaced by the Dynamics
// bench (lib/resources/dynamics-bench.js) built to the Bench Standard. The
// 27 Aug Explore ledger: threshold and ratio did not move the visual, the
// knee was wrong. File kept (retire, never delete); the URL is a stub in
// app/compressor-explorer/page.js.
// Compressor Explorer Resource Configuration
// Interactive audio tool for learning dynamics compression concepts

const compressorExplorer = {
    id: 'compressor-explorer',
    title: 'Compressor Explorer',
    description: 'Understand how compressors control dynamics: adjust threshold, ratio, attack, release, knee and makeup gain while hearing and seeing the effect in real-time.',
    topic: '1.9 Dynamic Processing',
    relatedTopics: [],
    type: 'interactive',
    kind: 'sandbox',
    icon: '',
    estimatedTime: '25-35 minutes',
    learningObjectives: [
        'Explain how threshold and ratio control the amount of gain reduction',
        'Describe how attack and release shape the compressor\'s response to transients',
        'Distinguish between hard knee and soft knee compression curves',
        'Apply makeup gain to restore perceived loudness after compression'
    ],
    prepFor: [],
    component: 'CompressorExplorer',
    keywords: ['compressor', 'dynamics', 'threshold', 'ratio', 'attack', 'release', 'knee', 'makeup gain', 'gain reduction', 'compression'],
    difficulty: 'foundation',
};

export default compressorExplorer;
