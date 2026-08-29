// The Automation Lane (1.8). Built 2026-08-29 to the Bench Standard
// (Planning-and-Admin/Interactive-Resources-Upgrade/BENCH-STANDARD.md),
// sixth bench after Delay, EQ, Dynamics, Edit and the Balance Desk, and the
// first thing the site has ever taught for 1.8: one loop, one part, one
// automation lane drawn the way a DAW draws it, with the papers' own
// practicals as presets and the faults their reports name beside them.

const automationLane = {
    id: 'automation-lane',
    title: 'Automation Lane',
    description: 'One loop, one part, one automation lane under its clip, drawn the way your DAW draws it. Drag points into a step, a line or a curve on the volume, the pan, the filter or the send; hold the lane off to hear what the move adds; work to the papers\' own practicals and hear the faults their reports name.',
    topic: '1.8 Automation',
    relatedTopics: ['1.10 Stereo', '1.11 EQ', '1.12 Effects', '1.13 Balance and Blend'],
    type: 'interactive',
    kind: 'bench',
    icon: '',
    estimatedTime: '10-15 minutes',
    learningObjectives: [
        'Draw a step, a linear and a curved automation move and say what each one sounds like',
        'Execute the papers\' pan, filter and volume practicals: exact scope, full travel, the right direction, on the barline',
        'Hear a late step, an inverted sweep, a filter too slow to rise and a ramp that falls short, and name the mark each loses',
        'Say where in the channel a lane writes, and record a move by hand',
    ],
    prepFor: [],
    component: 'AutomationLane',
    keywords: ['automation', 'lane', 'breakpoint', 'step', 'linear', 'curved', 'pan', 'volume', 'filter', 'send', 'grid', 'touch', 'latch', 'write', 'read', 'transient'],
    difficulty: 'foundation',
};

export default automationLane;
