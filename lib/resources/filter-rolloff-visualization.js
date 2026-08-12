// Filter Rolloff Visualization Resource Configuration
// Interactive tool for understanding filter response, rolloff rates, and resonance

const filterRolloffVisualization = {
    id: 'filter-rolloff-visualization',
    title: 'Filter Rolloff Visualization',
    description: 'Explore how cutoff frequency, rolloff rate (poles), filter type, and resonance affect filter response curves',
    topic: '1.11 EQ',
    relatedTopics: ['1.3 Synthesis'],
    type: 'interactive',
    kind: 'sandbox',
    icon: '',
    estimatedTime: '15-25 minutes',
    learningObjectives: [
        'Understand how rolloff rate (dB/oct) affects filter steepness',
        'Learn the relationship between poles and rolloff (6dB per pole)',
        'Visualize the -3dB point at the cutoff frequency',
        'Compare different filter types (LPF, HPF, BPF, Notch)',
        'Explore how resonance creates a peak at the cutoff frequency'
    ],
    // Links to related assessments
    prepFor: ['eq8-assessment'],
    // Component to render (matches export name in components/resources/)
    component: 'FilterRolloffVisualization',
    // Metadata for search/filtering
    keywords: ['filter', 'rolloff', 'slope', 'poles', 'cutoff', 'resonance', 'eq', 'lpf', 'hpf', 'bandpass', 'notch', 'db/octave'],
    difficulty: 'intermediate',
};

export default filterRolloffVisualization;
