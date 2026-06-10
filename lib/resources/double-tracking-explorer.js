// Double Tracking Explorer Resource Configuration
// A* extension for 1.4 Sampling - addresses common examiner-flagged misconception

const doubleTrackingExplorer = {
    id: 'double-tracking-explorer',
    title: 'Double Tracking vs Copying',
    description: 'Understand why copying fails and how ADT creates the double-tracking effect - addresses persistent examiner-flagged error (2022-2024)',
    topic: '1.12 Delay',
    relatedTopics: ['1.4 Sampling', '1.3 Synthesis'],
    type: 'interactive',
    icon: '',
    estimatedTime: '15-20 minutes',
    learningObjectives: [
        'Understand why copying a track does NOT create double tracking',
        'Explain how timing and pitch variation create the thickening effect',
        'Describe ADT parameters (delay 10-40ms, pitch ±5-20 cents)',
        'Understand the Haas Effect and why it matters for ADT',
        'Distinguish A* answers from zero-marks answers on double tracking questions'
    ],
    // Links to related assessment (if available)
    prepFor: [],
    // Component to render (matches export name in components/resources/)
    component: 'DoubleTrackingExplorer',
    // Metadata for search/filtering
    keywords: ['double tracking', 'adt', 'automatic double tracking', 'copying', 'haas effect', 'vocal', 'thickening', 'layering', 'constructive interference'],
    difficulty: 'advanced',  // A* extension material
    // Additional metadata for this resource
    examinerNote: 'This error has appeared in examiner reports for three consecutive years (2022-2024)',
};

export default doubleTrackingExplorer;
