// Graphic vs Parametric EQ Resource Configuration
// Compares graphic and parametric equalisers through interactive simulation

const graphicParametricEq = {
    id: 'graphic-parametric-eq',
    title: 'Graphic vs Parametric EQ',
    description: 'Compare graphic and parametric equalisers through interactive simulation',
    topic: '1.11 EQ',
    relatedTopics: [],
    type: 'interactive',
    kind: 'sandbox',
    icon: '',
    estimatedTime: '20-30 minutes',
    learningObjectives: [
        'Understand the difference between graphic and parametric equalisers',
        'Identify parallel vs series filter routing',
        'Know when to use each EQ type in practice',
        'Recognize the tradeoffs between precision and speed',
    ],
    prepFor: [],
    component: 'GraphicParametricEQ',
    keywords: ['graphic eq', 'parametric eq', 'filter bank', 'parallel', 'series', 'routing', 'bands'],
    difficulty: 'intermediate',
};

export default graphicParametricEq;
