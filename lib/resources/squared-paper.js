// Squared Paper (2.5). Built 2026-09-12: the written paper's drawing
// question on the paper's own grid, marked the way the schemes mark it. Not
// a bench, an exam page (see docs/superpowers/specs). It replaces the 2024
// Waveform Drawing Explorer, whose id is a retired stub now
// (see app/waveform-explorer/page.js).
//
// The card says nothing about which papers the questions come from: that
// record lives on each question in lib/bench/paper-model.js and never
// reaches a student.

const squaredPaper = {
    id: 'squared-paper',
    title: 'Squared Paper',
    description: 'The exam\'s drawing question on the exam\'s own grid. Sixteen questions, one sheet at a time: draw a named waveform at a named period, take a printed wave an octave higher or lower, make it louder, turn its polarity over, label the axes. Draw the answer with the pointer and press Check, and the page marks what you drew the way a script comes back, in the mark scheme\'s own words, with the examiner\'s line under a mark that is lost.',
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
