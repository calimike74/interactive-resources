// EQ Filter Bridge Resource Configuration
// Connects synthesis filter concepts to EQ applications

const eqFilterBridge = {
    id: 'eq-filter-bridge',
    title: 'EQ Filter Bridge',
    description: 'Connect synthesis filter concepts to EQ applications through interactive exploration',
    topic: '1.11 EQ',
    relatedTopics: ['1.3 Synthesis'],
    type: 'interactive',
    icon: '🎛️',
    estimatedTime: '15-20 minutes',
    learningObjectives: [
        'Review synthesis filter types (LPF, HPF, BPF, Notch)',
        'Understand how cutoff, resonance, and slope work',
        'Bridge synthesis knowledge to EQ mixing applications',
        'Identify filter shapes on frequency response graphs'
    ],
    // Links to related assessment on the assessment hub
    prepFor: ['eq-filter-drawing'],
    // Component to render (matches export name in components/resources/)
    component: 'EQFilterBridge',
    // Metadata for search/filtering
    keywords: ['filter', 'eq', 'synthesis', 'cutoff', 'resonance', 'lpf', 'hpf', 'bandpass', 'notch'],
    difficulty: 'foundation',  // 'foundation' | 'intermediate' | 'advanced'
};

export default eqFilterBridge;
