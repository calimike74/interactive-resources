const signalChainEurorack = {
    id: 'signal-chain-eurorack',
    title: 'Signal Chain Builder',
    description: 'Build mixing chains from 19 effects rendered as branded Eurorack hardware. Seven preset chains (vocal, bass, drums, orchestral, electronic, hip-hop, acoustic) and seven broken-chain diagnose scenarios anchored to 2019–2025 Edexcel examiner reports.',
    topic: '2.3 Signals',
    relatedTopics: ['1.9 Dynamic Processing', '1.11 EQ', '1.12 Time-based Effects'],
    type: 'interactive',
    icon: '🎛️',
    estimatedTime: '20-30 minutes',
    learningObjectives: [
        'Order effects in the conventional signal chain (clean → dynamics → time-based → limiting)',
        'Reason about insert vs aux send placement (especially for reverb on orchestral material)',
        'Use examiner-language vocabulary to describe each position',
        'Diagnose broken chains and identify the fault using PEF terminology',
    ],
    prepFor: [],
    component: 'SignalChainEurorack',
    keywords: ['signal chain', 'effects chain', 'mixing', 'EQ', 'compression', 'reverb', 'delay', 'eurorack', 'examiner language', 'PEF', 'aux send'],
    difficulty: 'intermediate',
};

export default signalChainEurorack;
