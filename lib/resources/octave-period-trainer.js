// Octave Period Trainer Resource Configuration
// Interactive tool for understanding waveform periods and octave relationships

const octavePeriodTrainer = {
    id: 'octave-period-trainer',
    title: 'Octave Period Trainer',
    description: 'Learn how octaves affect waveform period through interactive visualisation and drawing practice',
    topic: '2.5 Numeracy',
    relatedTopics: ['1.3 Synthesis'],
    type: 'interactive',
    kind: 'sandbox',
    icon: '',
    estimatedTime: '20-25 minutes',
    learningObjectives: [
        'Understand the relationship between frequency and period',
        'Recognise how octave changes affect waveform appearance',
        'Calculate period from frequency (T = 1/f)',
        'Draw waveforms at different octaves with correct cycle counts'
    ],
    // Links to related assessment
    prepFor: ['waveform-drawing-assessment'],
    // Component to render
    component: 'OctavePeriodTrainer',
    // Metadata for search/filtering
    keywords: ['octave', 'period', 'frequency', 'waveform', 'cycles', 'numeracy', 'pitch'],
    difficulty: 'foundation',
};

export default octavePeriodTrainer;
