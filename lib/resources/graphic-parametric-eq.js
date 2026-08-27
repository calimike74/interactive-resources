// RETIRED from the customer registry 2026-08-27: replaced by the EQ bench
// (lib/resources/eq-bench.js) built to the Bench Standard. Mike's 21 Aug walk:
// beige, exam tips not think-then-reveal, the two signal-flow diagrams
// misaligned, a quiz that logs nowhere. File kept (retire, never delete);
// the URL is a stub in app/graphic-parametric-eq/page.js.
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
