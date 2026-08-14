const digitalAnalogue = {
    id: 'digital-analogue',
    title: 'Digital & Analogue Audio Explorer',
    description: 'Visualise how analogue-to-digital conversion works: see sampling, quantisation, and bit depth in action. Explore the relationship between sample rate, bit depth, and audio quality through interactive simulations.',
    topic: '2.4 Digital Analogue',
    relatedTopics: ['2.5 Numeracy'],
    type: 'interactive',
    kind: 'sandbox',
    icon: '',
    estimatedTime: '25-35 minutes',
    learningObjectives: [
        'Understand the analogue-to-digital conversion process (sampling and quantisation)',
        'Explain how sample rate affects frequency reproduction (Nyquist theorem)',
        'Describe how bit depth determines dynamic range and quantisation error',
        'Calculate file sizes from sample rate, bit depth, channels, and duration',
    ],
    prepFor: [],
    component: 'DigitalAnalogue',
    keywords: ['digital', 'analogue', 'sampling', 'quantisation', 'bit depth', 'sample rate', 'Nyquist', 'ADC', 'DAC', 'conversion', 'file size'],
    difficulty: 'foundation',
};

export default digitalAnalogue;
