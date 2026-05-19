const digitalAudioAssessment = {
    id: 'digital-audio-assessment',
    title: 'Digital Audio Assessment',
    description: 'Drill the high-frequency exam topic: file-size calculations, lossy vs lossless compression, ADC location in the signal chain, and audio artefacts. Includes a step-through file-size calculator before the from-scratch numeric question.',
    topic: '2.4 Digital and Analogue',
    relatedTopics: ['2.5 Numeracy', '2.3 Signals'],
    type: 'practice',
    icon: '',
    estimatedTime: '15-20 minutes',
    learningObjectives: [
        'Apply the file-size formula: bytes = (sample rate × bit depth × channels × duration) ÷ 8',
        'Use the ratio shortcut to compare two versions of the same audio file',
        'Distinguish between uncompressed, lossless and lossy file formats',
        'Locate the ADC in a typical recording signal chain',
        'Identify common audio artefacts (mp3 pre-echo, tape hiss, aliasing)',
    ],
    prepFor: [],
    component: 'DigitalAudioAssessment',
    keywords: [
        'digital audio', 'file size', 'sample rate', 'bit depth', 'lossy', 'lossless',
        'mp3', 'aac', 'wav', 'aiff', 'flac', 'compression', 'adc', 'dac', 'signal chain',
        'artefact', 'aliasing', 'pre-echo', 'analogue tape', 'hiss', 'numeracy', 'revision',
        'assessment', 'quiz', '2.4', '2.5', '2.3',
    ],
    difficulty: 'core',
};

export default digitalAudioAssessment;
