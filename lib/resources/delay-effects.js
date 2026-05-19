// Delay Effects Resource Configuration
// Comprehensive interactive tool for learning delay effect types and parameters

const delayEffects = {
    id: 'delay-effects',
    title: 'Delay Effects Explorer',
    description: 'Learn about delay types (single tap, multi-tap, slapback, ping-pong, ADT), visualise delay lines, calculate tempo-synced delay times, and test your knowledge with quizzes and challenges.',
    topic: '1.12 Delay',
    relatedTopics: ['2.5 Numeracy'],
    type: 'interactive',
    icon: '',
    estimatedTime: '25-35 minutes',
    learningObjectives: [
        'Identify and describe the characteristics of different delay types',
        'Calculate delay times from BPM for different note values including dotted and triplet',
        'Explain the function of delay parameters: time, feedback, wet/dry mix, and pan',
        'Distinguish between ADT, slapback, and longer delay effects',
        'Understand comb filtering, the Haas effect, and modulated delay concepts'
    ],
    prepFor: [],
    component: 'DelayEffects',
    keywords: ['delay', 'echo', 'slapback', 'ping-pong', 'ADT', 'feedback', 'delay time', 'BPM', 'tempo sync', 'comb filtering', 'Haas effect', 'multi-tap', 'flanging', 'chorus'],
    difficulty: 'foundation',
};

export default delayEffects;
