const samplingPlayground = {
    id: 'sampling-playground',
    title: 'Sampling Playground',
    description: 'Explore how digital audio captures analogue sound. Play with sample rate, bit depth, and file sizes: then apply your knowledge with an AO3/AO4 extended response.',
    topic: '2.4 Digital Analogue',
    relatedTopics: ['2.5 Numeracy'],
    type: 'interactive',
    kind: 'sandbox',
    icon: '',
    estimatedTime: '30-40 minutes',
    learningObjectives: [
        'Visualise how sample rate affects the accuracy of digital audio capture',
        'Understand aliasing and the Nyquist theorem through interactive exploration',
        'See how bit depth determines quantisation accuracy and dynamic range',
        'Calculate uncompressed audio file sizes from sample rate, bit depth, channels, and duration',
        'Apply digital audio knowledge in an AO3/AO4 extended response',
    ],
    prepFor: [],
    component: 'SamplingPlayground',
    keywords: ['sampling', 'sample rate', 'Nyquist', 'aliasing', 'bit depth', 'quantisation', 'file size', 'ADC', 'digital', 'analogue', 'dynamic range'],
    difficulty: 'intermediate',
};

export default samplingPlayground;
