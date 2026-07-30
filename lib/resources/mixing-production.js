// Mixing & Production Resource Configuration
// Topic 1.6 — first fully-interactive resource for the mixing spec area.

const mixingProduction = {
    id: 'mixing-production',
    title: 'Mixing & Production',
    description: 'Build a working mix from eight tracks. Set static balance with faders, place tracks across the stereo field, route effects through a reverb bus, glue the drum kit on a sub-mix bus, and gain-stage the mixdown. Scaffolded scenarios from foundation to advanced, with peak-meter feedback and synthesised Edexcel-style questions.',
    topic: '1.13 Balance and Blend',
    relatedTopics: ['1.10 Stereo', '1.11 EQ', '1.12 Effects'],
    type: 'interactive',
    kind: 'practice',
    icon: '',
    estimatedTime: '20-30 minutes',
    learningObjectives: [
        'Establish a working static balance with channel faders before applying EQ or effects',
        'Place tracks across the stereo field using pan, keeping low-frequency content centre',
        'Route effects through a reverb bus using sends, returns, and pre/post-fader options',
        'Combine related tracks on a sub-mix (group) bus for cohesive processing',
        'Gain-stage a mixdown so the master peaks safely below 0 dBFS',
    ],
    prepFor: [],
    component: 'MixingProduction',
    keywords: ['mixing', 'mixdown', 'balance', 'pan', 'send', 'return', 'bus', 'sub-mix', 'group', 'pre-fader', 'post-fader', 'master fader', 'headroom', 'gain staging', 'reverb bus', '1.6'],
    difficulty: 'intermediate',
};

export default mixingProduction;
