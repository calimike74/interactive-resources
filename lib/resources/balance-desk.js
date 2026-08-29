// The Balance Desk (1.13). Built 2026-08-29 to the Bench Standard
// (Planning-and-Admin/Interactive-Resources-Upgrade/BENCH-STANDARD.md),
// fifth bench after Delay, EQ, Dynamics and Edit, and the first for a topic
// whose only Explore card taught the desk's signal path rather than the
// judgement the paper marks: five stems of one song arrive at the levels the
// examiner supplies them at, faders at unity, and the student balances by
// ear against a reference they can hold on the same beat.

const balanceDesk = {
    id: 'balance-desk',
    title: 'Balance Desk',
    description: 'Five stems of one song, supplied the way the exam supplies them: each file trimmed to a deliberately wrong level, every fader at unity. Balance by ear, hold the reference on the same beat, and read the mix as a plan, a spectrum and a ladder of what the examiner did to each file.',
    topic: '1.13 Balance and Blend',
    relatedTopics: ['1.10 Stereo', '1.11 EQ', '1.12 Effects', '1.8 Automation'],
    type: 'interactive',
    kind: 'bench',
    icon: '',
    estimatedTime: '10-15 minutes',
    learningObjectives: [
        'Balance five parts by ear against a reference, not by fader position',
        'Put the vocal on top of the mix with the drums equal under it, in the mark scheme\'s words',
        'Hear two parts sharing a region and resolve the masking with a fader, a pan or an EQ decision',
        'Say what a fader at unity is not, and why the supplied files are a trap',
    ],
    prepFor: [],
    component: 'BalanceDesk',
    keywords: ['balance', 'blend', 'mix', 'fader', 'pan', 'send', 'reverb', 'masking', 'hierarchy', 'foreground', 'background', 'mono-compatible', 'stems', 'reference mix', 'making space'],
    difficulty: 'foundation',
};

export default balanceDesk;
