const signalChainBuilder = {
    id: 'signal-chain-builder',
    title: 'Signal Chain Builder',
    description: 'Reconstruct the complete audio signal chain from acoustic sound through digital processing and back. Drag components into the correct order to build the path from microphone to speakers.',
    topic: '2.4 Digital Analogue',
    relatedTopics: ['2.3 Signals'],
    type: 'interactive',
    icon: '',
    estimatedTime: '10-15 minutes',
    learningObjectives: [
        'Place the components of the recording signal chain in the correct order',
        'Identify where ADC and DAC sit in the signal path',
        'Explain the role of anti-aliasing and reconstruction filters',
        'Distinguish between acoustic, analogue, and digital domains in the chain',
    ],
    prepFor: [],
    component: 'SignalChainBuilder',
    keywords: ['signal chain', 'signal flow', 'ADC', 'DAC', 'microphone', 'speakers', 'anti-aliasing', 'reconstruction filter', 'recording'],
    difficulty: 'foundation',
};

export default signalChainBuilder;
