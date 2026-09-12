// The Acoustics bench (2.1). Built 2026-09-12 to the Bench Standard
// (Planning-and-Admin/Interactive-Resources-Upgrade/BENCH-STANDARD.md), the
// eleventh bench. It replaces the 2024 page "Acoustics & Psychoacoustics"
// (/acoustics-psychoacoustics), whose Learn, Quiz and Reference tabs are
// banned from Explore; that URL is now a stub pointing here, the WO-08
// pattern. Design record: docs/superpowers/specs/2026-09-12-acoustics-bench-design.md

const acousticsBench = {
    id: 'acoustics-bench',
    title: 'Acoustics bench',
    description: 'Three stations on one screen: the equal-loudness contours with a tone on them, a band of noise taking a tone away, and a room made of one reflection and a tail. The contours are ISO 226\'s own formula, the comb is the response the delay really has, and the tail is the impulse the convolver is holding, so the picture is the sound. The papers\' own questions as presets, judged in the schemes\' words.',
    topic: '2.1 Acoustics',
    relatedTopics: ['1.12 Reverb', '1.2 Microphones', '2.2 Monitor Speakers', '1.11 EQ'],
    type: 'interactive',
    kind: 'bench',
    icon: '',
    estimatedTime: '10-15 minutes',
    learningObjectives: [
        'Say why the same level sounds quieter at the ends of the spectrum, and why that changes with how loudly you listen',
        'Hear one sound mask another, and say why a masker below the target reaches it when one above does not',
        'Explain comb filtering as one reflection summed with the direct sound, and read the first notch off the response',
        'Set a reverberation time, and say what thin panels reach and what only a bass trap can reach',
        'Tell acoustic treatment from soundproofing, the correction three examiner reports make',
    ],
    prepFor: ['acoustics-flashcards'],
    component: 'AcousticsBench',
    keywords: ['acoustics', 'psychoacoustics', 'equal loudness', 'equal-loudness contours', 'Fletcher-Munson', 'ISO 226', 'phon', 'hearing range', 'threshold of hearing', 'masking', 'critical band', 'upward spread of masking', 'comb filtering', 'phase cancellation', 'destructive interference', 'reflection', 'early reflections', 'standing wave', 'room mode', 'RT60', 'reverberation time', 'absorption', 'diffusion', 'bass trap', 'acoustic treatment', 'soundproofing', 'isolation', 'room acoustics'],
    difficulty: 'foundation',
};

export default acousticsBench;
