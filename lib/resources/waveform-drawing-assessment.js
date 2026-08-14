// Waveform Drawing Assessment Resource Configuration
// Drills the question types from Worksheet 7 (C4 Intervention Pack):
// period/frequency calculation, octave relationships, polarity inversion,
// phase cancellation, and axis labelling.

const waveformDrawingAssessment = {
    id: 'waveform-drawing-assessment',
    title: 'Waveform Drawing Assessment',
    description: 'Revision drill on period, frequency, octave, polarity and phase cancellation: matched to the C4 worksheet question types from 2019, 2023, 2024 and 2025 papers.',
    topic: '2.5 Numeracy',
    relatedTopics: ['2.3 Signals'],
    type: 'practice',
    kind: 'retrieval',
    icon: '〰️',
    estimatedTime: '8-12 minutes',
    learningObjectives: [
        'Calculate frequency from period (and vice versa) including ms → s conversion',
        'Apply octave relationships to frequency and period',
        'Explain phase cancellation when polarity is inverted',
        'Identify multi-mic scenarios that require polarity checks',
    ],
    prepFor: [],
    component: 'WaveformDrawingAssessment',
    keywords: [
        'waveform', 'period', 'frequency', 'octave', 'polarity', 'phase',
        'phase cancellation', 'numeracy', 'assessment', 'revision', 'quiz',
        'square wave', 'saw wave', 'amplitude', 'snare', 'DI', 'mic',
    ],
    difficulty: 'foundation',
};

export default waveformDrawingAssessment;
