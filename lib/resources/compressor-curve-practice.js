// Compressor Curve Practice Resource Configuration
// Practice tool for drawing and analysing compressor transfer curves

const compressorCurvePractice = {
    id: 'compressor-curve-practice',
    title: 'Compressor Curve Practice',
    description: 'Practice drawing and reading compressor transfer curves: given settings, sketch the response curve freehand, or analyse a curve to identify threshold, ratio, and makeup gain.',
    topic: '1.9 Dynamic Processing',
    relatedTopics: [],
    type: 'interactive',
    kind: 'practice',
    icon: '',
    estimatedTime: '15-25 minutes',
    learningObjectives: [
        'Draw an accurate compressor transfer curve from given threshold, ratio, and makeup gain values',
        'Identify threshold, ratio, and makeup gain by reading a compressor transfer curve',
        'Explain how makeup gain shifts the entire transfer curve upward',
        'Recognise the change in slope at the threshold point on a hard-knee curve'
    ],
    prepFor: [],
    component: 'CompressorCurvePractice',
    keywords: ['compressor', 'dynamics', 'threshold', 'ratio', 'makeup gain', 'transfer curve', 'hard knee', 'drawing', 'analysis', 'practice'],
    difficulty: 'foundation',
};

export default compressorCurvePractice;
