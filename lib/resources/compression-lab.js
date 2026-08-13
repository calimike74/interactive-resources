// The Compression Lab — the dynamics band's flagship interactive.
// Re-formed 2026-08-13 to the Explore standard (seeing, not reading):
// one viewport, no scroll — the transfer curve IS the control surface,
// a live drum groove rides it, and a draw-it mode marks the curve
// feature-by-feature the way the written paper does. fullBleed gives it
// the slim page shell so the instrument owns the screen.

const compressionLab = {
    id: 'compression-lab',
    title: 'The Compression Lab',
    description:
        'A compressor you play, not read about. The transfer curve is the control surface, a live drum groove rides it, and a draw-it mode marks your curve feature by feature, the way the written paper does.',
    topic: '1.9 Dynamic Processing',
    relatedTopics: [],
    type: 'interactive',
    kind: 'lab',
    fullBleed: true,
    icon: '',
    estimatedTime: '10-20 minutes',
    learningObjectives: [
        'Hear and describe what threshold, ratio, attack and release each do to a real signal',
        'Explain make-up gain as level restoration that leaves gain reduction unchanged',
        'Sketch a compressor transfer curve with the unity line, threshold kink and ratio slope placed correctly',
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
