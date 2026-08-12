// The Compression Lab — the dynamics band's flagship interactive.
// First build to the INTERACTIVE-BAR standard (2026-08-12): one live
// compressor on a synthesised drum groove, each parameter isolated then
// combined, a draggable transfer curve, and a draw-the-curve exam bench
// marked feature-by-feature against real past-paper demands.

const compressionLab = {
    id: 'compression-lab',
    title: 'The Compression Lab',
    description:
        'One real compressor on a live drum groove. Take threshold, ratio, attack and release one at a time, drag the transfer curve itself, then draw the curve the way the written paper asks — marked feature by feature.',
    topic: '1.9 Dynamic Processing',
    relatedTopics: [],
    type: 'interactive',
    kind: 'lab',
    icon: '',
    estimatedTime: '30-40 minutes',
    learningObjectives: [
        'Hear and describe what threshold, ratio, attack and release each do to a real signal',
        'Explain make-up gain as level restoration that leaves gain reduction unchanged',
        'Sketch a compressor transfer curve with the unity line, threshold kink and ratio slope placed correctly',
        'Distinguish a compressor’s transfer curve from a noise gate’s',
    ],
    prepFor: ['rtq-dynamic-compression'],
    component: 'CompressionLab',
    keywords: [
        'compressor',
        'compression',
        'dynamics',
        'threshold',
        'ratio',
        'attack',
        'release',
        'knee',
        'make-up gain',
        'gain reduction',
        'transfer curve',
        'limiting',
        'pumping',
    ],
    difficulty: 'intermediate',
};

export default compressionLab;
