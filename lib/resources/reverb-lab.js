// The Reverb Lab — the reverb band's first real interactive (the band
// previously topped out at a hotspot diagram). Second build to the
// INTERACTIVE-BAR standard (2026-08-12): a live convolution reverb with
// engine-generated impulse responses, each parameter isolated, a gated-
// reverb movement, and a match-the-hidden-room ear bench marked per
// dimension.

const reverbLab = {
    id: 'reverb-lab',
    title: 'The Reverb Lab',
    description:
        'A real space you can resize while a phrase plays inside it. Decay, pre-delay and wet/dry taken one at a time, the 1980s gated snare rebuilt from first principles, then three hidden rooms to match by ear alone.',
    topic: '1.12 Reverb',
    relatedTopics: ['1.9 Dynamic Processing', '2.1 Acoustics'],
    type: 'interactive',
    kind: 'lab',
    icon: '',
    estimatedTime: '25-35 minutes',
    learningObjectives: [
        'Hear and describe what decay time (RT60), pre-delay and wet/dry each do to a real signal',
        'Explain pre-delay as the tool that keeps a source intelligible inside a long reverb',
        'Describe gated reverb as a truncated tail and identify its characteristic sound',
        'Judge reverb suitability by ear — matching decay, pre-delay and amount to a reference',
    ],
    prepFor: ['reverb-assessment'],
    component: 'ReverbLab',
    keywords: [
        'reverb',
        'reverberation',
        'decay',
        'RT60',
        'pre-delay',
        'wet/dry',
        'gated reverb',
        'convolution',
        'room',
        'hall',
        'plate',
        'spatial',
    ],
    difficulty: 'intermediate',
};

export default reverbLab;
