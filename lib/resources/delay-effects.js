// The Delay bench (1.12). Rebuilt 2026-08-21 to the Bench Standard
// (Planning-and-Admin/Interactive-Resources-Upgrade/BENCH-STANDARD.md):
// one viewport, real sound, the repeats drawn from the same numbers that
// make them. The id stays `delay-effects` so every existing link, the
// member topic page and the sitemap keep working.

const delayEffects = {
    id: 'delay-effects',
    title: 'Delay bench',
    description: 'Real drums, a vocal phrase and stabs through a real delay. Set the time by hand or by note value, raise the feedback and count the repeats, darken them with a high cut, bounce them left and right. Every repeat you hear is drawn on the beat grid.',
    topic: '1.12 Delay',
    relatedTopics: ['2.5 Numeracy', '1.11 EQ'],
    type: 'interactive',
    kind: 'bench',
    icon: '',
    estimatedTime: '10-15 minutes',
    learningObjectives: [
        'Hear and see how delay time sets the spacing of repeats, in milliseconds or as a note value',
        'Hear and see how feedback sets the number of repeats, up to runaway at 100%',
        'Judge where the wet sits against the dry, and why the repeats usually sit below the original',
        'Recognise slapback, tempo-synced, darkened (tape) and ping-pong delays by ear and on the grid',
    ],
    prepFor: [],
    component: 'DelayBench',
    keywords: ['delay', 'echo', 'slapback', 'ping-pong', 'feedback', 'delay time', 'BPM', 'tempo sync', 'wet/dry', 'high cut', 'tape delay'],
    difficulty: 'foundation',
};

export default delayEffects;
