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
