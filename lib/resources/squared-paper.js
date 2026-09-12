// Squared Paper (2.5). Built 2026-09-12 to the Bench Standard
// (Planning-and-Admin/Interactive-Resources-Upgrade/BENCH-STANDARD.md),
// tenth bench and the second for 2.5 after the Oscilloscope: the written
// paper's drawing question on the paper's own grid, played back and marked
// the way each year's scheme marks it. It replaces the 2024 Waveform
// Drawing Explorer, whose id is a retired stub now
// (see app/waveform-explorer/page.js).

const squaredPaper = {
    id: 'squared-paper',
    title: 'Squared Paper',
    description: 'The exam\'s drawing question on the exam\'s own grid. The question\'s figure at the left, a blank paper at the right; draw the answer with the pointer or fill it from the chips, hear the figure, your line and the scheme\'s answer, and read the shape, the period and the height the bench measures off what you drew. The papers\' own questions as presets, marked in the scheme\'s words with its year.',
    topic: '2.5 Numeracy',
    relatedTopics: ['1.3 Synthesis'],
    type: 'interactive',
    kind: 'bench',
    icon: '',
    estimatedTime: '10-15 minutes',
    learningObjectives: [
        'Draw a named waveform at a named period on a grid marked in milliseconds',
        'Show an octave as a doubling or halving of the width of one cycle, not a change of height or position',
        'Tell amplitude from period: louder is taller, pitch is wider or narrower',
        'Spot a DC offset as the fault the examiner reports name, not as a change of loudness',
    ],
    prepFor: ['waveform-drawing-assessment'],
    component: 'SquaredPaper',
    keywords: ['drawing', 'squared paper', 'graph', 'waveform', 'period', 'octave', 'amplitude', 'dc offset', 'displacement', 'milliseconds', 'sine', 'square', 'saw', 'triangle', 'harmonics', 'numeracy', 'mark scheme'],
    difficulty: 'foundation',
};

export default squaredPaper;
