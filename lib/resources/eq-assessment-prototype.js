// EQ Assessment Prototype
// Interactive assessment where students click on EQ controls and explain their function

const resource = {
    id: 'eq-assessment-prototype',
    title: 'EQ Assessment (Prototype)',
    description: 'Click on parametric EQ controls and write extended responses explaining their function. Prototype for interactive visual assessments.',
    component: 'EQAssessmentPrototype',
    topic: '1.11 EQ',
    type: 'assessment', // New type for assessment resources
    kind: 'retrieval',
    relatedTopics: ['1.13 Balance and Blend', '1.9 Dynamic Processing'],
    keywords: ['eq', 'parametric', 'frequency', 'gain', 'q', 'bandwidth', 'assessment', 'interactive'],
    examBoard: 'Eduqas',
    difficulty: 'intermediate',
    estimatedTime: '10-15 minutes',
    features: [
        'Clickable visual controls',
        'Extended written responses',
        'Progress tracking',
        'Hint system',
        'Submission to database (prototype)',
    ],
    learningObjectives: [
        'Explain the function of each control on a parametric EQ',
        'Demonstrate understanding of frequency, gain, and Q',
        'Apply knowledge through written explanation',
    ],
    status: 'prototype', // Flag this as a prototype
};

export default resource;
