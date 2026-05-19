// Waveform Drawing Explorer Resource Configuration
// Free-play practice tool for waveform drawing at different octaves

const waveformExplorer = {
    id: 'waveform-explorer',
    title: 'Waveform Drawing Explorer',
    description: 'Practice drawing waveforms at different octaves. See the reference waveform, draw your version, and compare instantly — no submission required.',
    topic: '2.5 Numeracy',
    relatedTopics: ['1.3 Synthesis'],
    type: 'interactive',
    icon: '',
    estimatedTime: '10-20 minutes',
    learningObjectives: [
        'Understand how octave changes affect cycle count in a waveform',
        'Practice drawing sine, square, sawtooth and triangle waveforms',
        'Visualise the relationship between pitch direction and waveform period',
        'Build confidence before attempting assessed drawing activities'
    ],
    prepFor: ['waveform-octaves'],
    component: 'WaveformExplorer',
    keywords: ['waveform', 'drawing', 'octave', 'practice', 'sine', 'square', 'sawtooth', 'triangle', 'cycles'],
    difficulty: 'foundation',
};

export default waveformExplorer;
