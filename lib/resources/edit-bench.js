// The Edit bench (1.6). Built 2026-08-28 to the Bench Standard
// (Planning-and-Admin/Interactive-Resources-Upgrade/BENCH-STANDARD.md),
// fourth bench after Delay, EQ and Dynamics, and the first for a topic that
// had nothing: one viewport, a real take, a cut you drag, the join drawn at
// cycle zoom from the same samples that play. The click you hear is the
// step it measures; the fade you hear is the curve it draws.

const editBench = {
    id: 'edit-bench',
    title: 'Edit bench',
    description: 'A real vocal take and a cymbal, cut by hand. Drag the cut, hear the click a mid-cycle join makes, snap it to a zero crossing, then fade it: linear, equal power or S-curve, from a 10 ms repair to a half-second transition. The join is drawn at cycle zoom from the samples that play.',
    topic: '1.6 Audio Editing',
    relatedTopics: ['1.3 Synthesis', '1.4 Sampling', '1.7 Pitch and Rhythm Correction'],
    type: 'interactive',
    kind: 'bench',
    icon: '',
    estimatedTime: '10-15 minutes',
    learningObjectives: [
        'Hear and see the click a cut makes when the two sides of the join meet at different values',
        'Snap a cut to a zero crossing and explain why the click goes, in the mark scheme\'s words',
        'Choose a crossfade length and shape for a repair, and say what a linear fade does to the level through the join',
        'Find where a tail really ends, and fade to the silence rather than cut where the waveform looks finished',
    ],
    prepFor: [],
    component: 'EditBench',
    keywords: ['audio editing', 'edit point', 'zero crossing', 'click', 'discontinuity', 'fade', 'fade out', 'crossfade', 'equal power', 'linear fade', 'S-curve', 'truncation', 'region', 'clip', 'trim'],
    difficulty: 'foundation',
};

export default editBench;
