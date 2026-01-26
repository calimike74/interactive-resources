// Graphic vs Parametric EQ Resource Configuration
// Compares graphic and parametric equalizers through interactive simulation

const graphicParametricEq = {
    id: 'graphic-parametric-eq',
    title: 'Graphic vs Parametric EQ',
    description: 'Compare graphic and parametric equalizers through interactive simulation',
    topic: '1.11 EQ',
    relatedTopics: [],
    type: 'interactive',
    icon: '📊',
    estimatedTime: '20-30 minutes',
    learningObjectives: [
        'Understand the difference between graphic and parametric equalizers',
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
