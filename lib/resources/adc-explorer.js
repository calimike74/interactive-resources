const adcExplorer = {
    id: 'adc-explorer',
    title: 'ADC Explorer',
    description: 'Explore how analogue sound is converted to digital data. Adjust sample rate and bit depth to see how they affect the quality of the digital representation.',
    topic: '2.4 Digital Analogue',
    relatedTopics: ['2.5 Numeracy'],
    type: 'interactive',
    icon: '',
    estimatedTime: '15-20 minutes',
    learningObjectives: [
        'Describe how the ADC samples an analogue signal at regular intervals',
        'Explain how sample rate affects the accuracy of the digital representation',
        'Apply the Nyquist theorem to determine minimum sample rates',
        'Explain how bit depth determines the number of amplitude levels available',
    ],
    prepFor: [],
    component: 'ADCExplorer',
    keywords: ['ADC', 'sampling', 'sample rate', 'bit depth', 'Nyquist', 'aliasing', 'quantisation', 'digital', 'analogue', 'conversion'],
    difficulty: 'foundation',
};

export default adcExplorer;
