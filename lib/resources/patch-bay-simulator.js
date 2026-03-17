const patchBaySimulator = {
    id: 'patch-bay-simulator',
    title: 'Patch Bay Simulator',
    description: 'Explore how our studio patch bays route microphone signals from different rooms through PB8 into the UA Volt 876 audio interfaces. Click connectors and drag cables to build signal paths.',
    topic: '2.5 Recording',
    relatedTopics: ['2.3 Signals'],
    type: 'interactive',
    icon: '🔌',
    estimatedTime: '10-15 minutes',
    learningObjectives: [
        'Understand how XLR patch bays route audio signals between rooms and the interface',
        'Identify which patch bay connects to which room in our studio',
        'Trace the full signal path from a room mic line through PB8 to the Volt 876',
        'Explain why inputs 1-2 on the Volt are dedicated studio interior connections',
    ],
    prepFor: [],
    component: 'PatchBaySimulator',
    keywords: ['patch bay', 'XLR', 'signal routing', 'Volt 876', 'audio interface', 'studio', 'recording'],
    difficulty: 'foundation',
};

export default patchBaySimulator;
