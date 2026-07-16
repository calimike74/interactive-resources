// Delay Topic — Row-based content for inline animated explanations
// Mapped to Pearson Edexcel Component 4 specification 1.12 Delay
// Covers: delay time, feedback, number of repeats, delay pan and EQ,
// single/multi-tap, slapback, timed, ping-pong, and ADT.

export const DELAY_TOPIC = {
    id: 'delay',
    title: 'Delay',
    subtitle: 'Topic 1.12 — Component 4',
    description: 'How delay effects repeat a signal in time — the core parameters, the main delay types, and how they are used creatively and correctively in a mix.',

    rows: [
        {
            id: 'what-delay-does',
            heading: 'What Delay Does',
            description: 'A delay records the incoming (dry) signal and plays it back a short time later as a repeat (the wet signal). The dry sound is not replaced — the repeat sits alongside it. Wet/dry controls how loud the repeats are against the original, and bypass turns the effect off entirely so you can A/B the difference.',
            animation: 'delay-basics',
            assessment: {
                id: 'what-delay-does',
                question: 'A student turns a delay\'s wet/dry control fully wet and complains that the original vocal has disappeared. What has actually happened?',
                options: [
                    { text: 'The dry signal has been erased by the delay effect', correct: false, feedback: 'Delay does not erase the dry signal — fully wet just means you hear only the repeats, not the original passing through the plug-in.' },
                    { text: 'At 100% wet, only the delayed repeats are heard through the plug-in — the original vocal is still there on the track, just not passing through this effect', correct: true, feedback: 'Wet/dry controls the mix of repeats versus original within the plug-in. On an insert, fully wet removes the dry — that is why delay is often used on a send instead.' },
                    { text: 'The feedback is too high and is cancelling the signal', correct: false, feedback: 'Feedback controls how many repeats there are, not whether the dry signal is audible.' },
                ],
            },
        },
        {
            id: 'delay-time',
            heading: 'Delay Time',
            description: 'Delay time is the gap (in milliseconds) between the dry signal and the first repeat. Under about 30 ms the repeat fuses with the dry and thickens it. Between roughly 30 and 120 ms it is heard as a single distinct slap. Above around 120 ms repeats are clearly heard as separate echoes.',
            animation: 'delay-time',
            assessment: {
                id: 'delay-time',
                question: 'A producer sets a delay to 15 ms on a lead vocal expecting a slapback. They hear a thicker, slightly phasey vocal instead of a clear echo. Why?',
                options: [
                    { text: 'The delay time is too short — the repeat fuses with the dry signal and is heard as thickening rather than a separate echo', correct: true, feedback: 'Under about 30 ms the ear cannot separate the repeat from the original, so it is perceived as timbral change (comb filtering / doubling) rather than an echo.' },
                    { text: 'The feedback is set too low to produce an audible repeat', correct: false, feedback: 'Feedback controls the number of repeats, not whether the first repeat is audible.' },
                    { text: 'Slapback only works on drums, not vocals', correct: false, feedback: 'Slapback is famously associated with 1950s vocals (Elvis, Sun Records) — but it needs a longer delay time of 50–120 ms.' },
                ],
            },
        },
        {
            id: 'feedback-repeats',
            heading: 'Feedback & Number of Repeats',
            description: 'Feedback routes the output of the delay back into its input so each repeat feeds the next, creating a decaying chain of echoes. Higher feedback = more repeats before the signal dies away. Multi-tap delays work differently — instead of one feedback loop, they generate several fixed "taps" at independent times. Single-tap with zero feedback produces exactly one repeat.',
            animation: 'feedback-repeats',
            assessment: {
                id: 'feedback-repeats',
                question: 'A student wants three evenly-spaced repeats of a snare at 1/4, 1/2, and 3/4 of a bar. They set one delay with high feedback. The result is a decaying stream of repeats, not three clean hits. Why?',
                options: [
                    { text: 'Feedback creates a chain of decreasing-volume repeats on the same feedback loop — they need a multi-tap delay where each tap has an independent time and level', correct: true, feedback: 'Single-tap + feedback gives an exponentially decaying train. Multi-tap lets you place each repeat independently with its own time, level and pan.' },
                    { text: 'The delay time is set too short', correct: false, feedback: 'Delay time affects the gap between repeats — the problem here is the structure of the repeats, not the timing of the first one.' },
                    { text: 'They need more feedback to get more repeats', correct: false, feedback: 'More feedback would give more decaying repeats, not three evenly-spaced, same-level hits.' },
                ],
            },
        },
        {
            id: 'delay-pan-eq',
            heading: 'Delay Pan & EQ',
            description: 'Delay returns are often shaped so they sit behind the dry signal rather than competing with it. Panning the wet to the opposite side of a centred vocal widens the image. High-cut EQ on the repeats makes them sound more distant and stops sibilance stacking up on every repeat. Low-cut keeps the bass end clean.',
            animation: 'pan-eq',
            assessment: {
                id: 'pan-eq',
                question: 'A mixer adds a 1/4-note delay to a lead vocal but every "s" piles up into an unpleasant hiss on each repeat. What is the most appropriate fix without reducing the delay level?',
                options: [
                    { text: 'Apply a high-cut (low-pass) EQ to the delay return so high frequencies, including sibilance, are rolled off on the repeats', correct: true, feedback: 'Filtering high frequencies out of the wet path keeps the repeats audible but stops sibilance and brightness from compounding on every echo.' },
                    { text: 'Turn the delay feedback up so the repeats decay faster', correct: false, feedback: 'Higher feedback creates more repeats, which would make the sibilance problem worse.' },
                    { text: 'Move the delay pan hard left to hide the sibilance', correct: false, feedback: 'Panning moves the repeats in the stereo field but does not change their frequency content.' },
                ],
            },
        },
        {
            id: 'slapback',
            heading: 'Slapback',
            description: 'Slapback is a single short repeat, typically 50–120 ms, with no feedback. It was the signature sound of 1950s rockabilly — Elvis Presley\'s Sun Records vocals, Scotty Moore\'s guitar — originally made with tape echo machines. In modern mixes it is used to thicken a vocal or guitar without creating an obvious echo.',
            animation: 'slapback',
            assessment: {
                id: 'slapback',
                question: 'Which combination of parameters most accurately describes a classic slapback delay?',
                options: [
                    { text: 'Delay time 80 ms, feedback 0%, wet/dry around 30% — a single audible repeat, no chain of echoes', correct: true, feedback: 'Slapback is defined by a short delay time, no feedback (one repeat only), and moderate wet level. Tape flutter and saturation give it its characteristic warmth.' },
                    { text: 'Delay time 400 ms, feedback 50%, wet/dry 50% — a long cascading echo', correct: false, feedback: 'This describes a general creative delay. Slapback is specifically a single short repeat with no feedback.' },
                    { text: 'Delay time 15 ms, feedback 80%, wet/dry 100% — thickening with many fast repeats', correct: false, feedback: 'At 15 ms the repeat fuses with the dry signal (chorus-like thickening), not slapback. And high feedback produces many repeats, not one.' },
                ],
            },
        },
        {
            id: 'timed-delay',
            heading: 'Timed Delay',
            description: 'A timed (tempo-synced) delay locks the repeat to the song\'s tempo. A quarter-note delay in milliseconds = 60,000 ÷ BPM. A dotted-eighth is a quarter note × 0.75 — the syncopated pattern made famous by The Edge on U2\'s "Where the Streets Have No Name". DAWs usually offer note-value sync (1/4, 1/8D, 1/16) as well as straight milliseconds.',
            animation: 'timed-delay',
            assessment: {
                id: 'timed-delay',
                question: 'At 120 BPM, what is the delay time in milliseconds for a dotted-eighth note?',
                options: [
                    { text: '500 ms — that is the quarter-note value', correct: false, feedback: '60,000 ÷ 120 = 500 ms is the quarter-note. A dotted-eighth is 0.75 of that.' },
                    { text: '375 ms — quarter note (500 ms) × 0.75 = 375 ms', correct: true, feedback: 'Quarter note = 60,000 ÷ BPM = 500 ms at 120 BPM. Dotted-eighth is three-quarters of a quarter note: 500 × 0.75 = 375 ms.' },
                    { text: '250 ms — that is the eighth-note value', correct: false, feedback: 'A straight eighth is 250 ms, but a dotted eighth is longer — an eighth plus half its value, or equivalently a quarter × 0.75 = 375 ms.' },
                ],
            },
        },
        {
            id: 'ping-pong',
            heading: 'Ping-Pong',
            description: 'A ping-pong delay sends successive repeats alternately to the left and right channels. The first repeat lands in one speaker, the next in the other, and so on — creating wide stereo movement from a mono source. Combined with tempo sync and moderate feedback, it is a staple of ambient guitar, dub reggae, and electronic production.',
            animation: 'ping-pong',
            assessment: {
                id: 'ping-pong',
                question: 'A guitarist records a mono riff. Using only a ping-pong delay (no other stereo effects), what will they hear on playback in the monitors?',
                options: [
                    { text: 'The dry riff stays central while repeats bounce between left and right channels', correct: true, feedback: 'Ping-pong routes successive repeats to alternating channels, so the dry signal stays where it is panned and the wet signal creates stereo movement.' },
                    { text: 'The entire signal — dry and wet — alternates between speakers', correct: false, feedback: 'Only the repeats alternate. The dry signal stays on whichever channel (or centre) it is panned to.' },
                    { text: 'Nothing changes because delay does not affect stereo width', correct: false, feedback: 'Standard delays keep repeats on the same channel as the source, but ping-pong specifically alternates them between channels.' },
                ],
            },
        },
        {
            id: 'adt',
            heading: 'Automatic Double Tracking',
            description: 'ADT (Automatic Double Tracking) was invented at Abbey Road in 1966 by Ken Townsend to save the Beatles from re-recording every vocal twice. The original technique used two tape machines running at slightly different speeds. Modern DAW emulations achieve the same effect with a short delay of around 50–100 ms and a subtle LFO on pitch or timing to imitate the small variations of a real double-tracked performance. The result: a thicker, wider lead vocal from a single take.',
            animation: 'adt',
            assessment: {
                id: 'adt',
                question: 'A student has a thin-sounding lead vocal from a single take. Which approach uses ADT correctly to thicken it?',
                options: [
                    { text: 'A short delay (~60 ms) with no feedback and a small amount of LFO pitch modulation, mixed in behind the dry vocal', correct: true, feedback: 'This is the classic ADT recipe: short delay + slight pitch modulation simulates the small timing and tuning differences of a real double-tracked performance.' },
                    { text: 'A quarter-note tempo-synced delay with 50% feedback', correct: false, feedback: 'This is a creative rhythmic delay — it produces audible echoes rather than a thickened single voice.' },
                    { text: 'A ping-pong delay at 400 ms to spread the vocal across the stereo field', correct: false, feedback: 'Ping-pong creates stereo movement with audible repeats. ADT creates a thicker, single-voice impression by sitting the delayed copy very close to the dry.' },
                ],
            },
        },
    ],
};

// Delay Course — 4-chapter version (Task 9, learn-rollout-wave1).
// DELAY_TOPIC above is kept byte-identical — Task 11 wires DELAY_CHAPTERS into
// lib/learn/topics/index.js and removes DELAY_TOPIC then, the same pattern Task 3
// used for EQ_TOPIC/EQ_CHAPTERS. Legacy rows below (what-delay-does, delay-time,
// feedback-repeats, slapback, timed-delay, ping-pong, delay-pan-eq, adt) are
// copied verbatim from DELAY_TOPIC above: same heading/description/animation/
// assessment. New rows are marked in comments and sourced from
// _sandbox/delay-reference/src/content/learn.tsx + teach.ts.

export const DELAY_CHAPTERS = [
    {
        id: 'delay-line',
        chapterNumber: 1,
        title: 'The Delay Line',
        subtitle: 'Topic 1.12 — Component 4',
        description: 'How a delay splits a signal into a dry original and a wet repeat, and why the size of the gap between them decides whether you hear thickening, a slap, or a distinct echo.',
        estimatedTime: '15–20 minutes',
        examAnchor: {
            question: 'A student is played three short clips of the same guitar riff with delay, feedback at 0% in all three so each has exactly one repeat: Clip A has a delay time of 10 ms, Clip B has 70 ms, Clip C has 200 ms. Describe how the repeat is heard in each clip, naming the correct perceptual range, and explain why identical settings otherwise produce three different impressions.',
            modelPoints: [
                'Clip A (10 ms) falls in the fusing range, below about 30 ms — the repeat is too close to the dry signal to be heard separately, so it is perceived as thickening the original tone rather than as an echo.',
                'Clip B (70 ms) falls in the slap range, roughly 30–120 ms — the repeat is heard as a single, distinct slap alongside the dry signal, not fused but not fully separated either.',
                'Clip C (200 ms) falls above the slap range, above about 120 ms — the repeat is heard as a clearly separate echo, distinct in time from the dry signal.',
                'Feedback and repeat count are identical across all three clips; the difference is caused entirely by delay time crossing the fusing/slap/echo boundaries.',
            ],
            examTip: 'Name the correct perceptual zone (fusing, slap, echo) for each delay time given, and tie the explanation to the specific ms value and the ~30 ms / ~120 ms boundaries — a vague "they sound different" without naming the zones and boundary values earns little credit.',
        },

        rows: [
            {
                id: 'what-delay-does',
                heading: 'What Delay Does',
                description: 'A delay records the incoming (dry) signal and plays it back a short time later as a repeat (the wet signal). The dry sound is not replaced — the repeat sits alongside it. Wet/dry controls how loud the repeats are against the original, and bypass turns the effect off entirely so you can A/B the difference.',
                animation: 'delay-basics',
                audio: { preset: 'delay-single', label: 'Hold to hear one clean repeat sit quietly behind the dry pluck — no feedback, just one echo.' },
                assessment: {
                    id: 'what-delay-does',
                    question: 'A student turns a delay\'s wet/dry control fully wet and complains that the original vocal has disappeared. What has actually happened?',
                    options: [
                        { text: 'The dry signal has been erased by the delay effect', correct: false, feedback: 'Delay does not erase the dry signal — fully wet just means you hear only the repeats, not the original passing through the plug-in.' },
                        { text: 'At 100% wet, only the delayed repeats are heard through the plug-in — the original vocal is still there on the track, just not passing through this effect', correct: true, feedback: 'Wet/dry controls the mix of repeats versus original within the plug-in. On an insert, fully wet removes the dry — that is why delay is often used on a send instead.' },
                        { text: 'The feedback is too high and is cancelling the signal', correct: false, feedback: 'Feedback controls how many repeats there are, not whether the dry signal is audible.' },
                    ],
                },
            },
            {
                id: 'delay-time',
                heading: 'Delay Time',
                description: 'Delay time is the gap (in milliseconds) between the dry signal and the first repeat. Under about 30 ms the repeat fuses with the dry and thickens it. Between roughly 30 and 120 ms it is heard as a single distinct slap. Above around 120 ms repeats are clearly heard as separate echoes.',
                animation: 'delay-time',
                interactive: 'delay-time',
                assessment: {
                    id: 'delay-time',
                    question: 'A producer sets a delay to 15 ms on a lead vocal expecting a slapback. They hear a thicker, slightly phasey vocal instead of a clear echo. Why?',
                    options: [
                        { text: 'The delay time is too short — the repeat fuses with the dry signal and is heard as thickening rather than a separate echo', correct: true, feedback: 'Under about 30 ms the ear cannot separate the repeat from the original, so it is perceived as timbral change (comb filtering / doubling) rather than an echo.' },
                        { text: 'The feedback is set too low to produce an audible repeat', correct: false, feedback: 'Feedback controls the number of repeats, not whether the first repeat is audible.' },
                        { text: 'Slapback only works on drums, not vocals', correct: false, feedback: 'Slapback is famously associated with 1950s vocals (Elvis, Sun Records) — but it needs a longer delay time of 50–120 ms.' },
                    ],
                },
            },
        ],
    },
    {
        id: 'feedback-types',
        chapterNumber: 2,
        title: 'Feedback, Slapback & Tape',
        subtitle: 'Topic 1.12 — Component 4',
        description: 'How feedback turns one repeat into a decaying chain, the parameter recipe for a classic slapback, and why old tape echoes darken with every pass.',
        estimatedTime: '15–20 minutes',
        examAnchor: {
            question: 'A student is asked to set up a classic slapback delay on a guitar part, then asked to explain what would happen if they changed the feedback to 40% instead of the standard slapback setting. Give the standard slapback parameter recipe, and explain the audible consequence of the 40% feedback change.',
            modelPoints: [
                'The standard slapback recipe is a single delay time in the 50–120 ms range, feedback at 0%, and a moderate wet/dry level around 30% — a single audible repeat, not a chain of echoes.',
                'Feedback at 0% means the delay\'s output does not feed back into its input, so there is exactly one repeat, not a decaying train.',
                'Setting feedback to 40% instead means the delay\'s output is fed back into its input on every pass, producing a decaying chain of multiple repeats — no longer slapback but a general repeating echo effect.',
                'The delay time does not need to change for this shift to happen — feedback alone is what turns one repeat into a decaying chain.',
            ],
            examTip: 'Slapback is defined by zero feedback, not by a specific delay time alone — a student who names only the delay time and skips "feedback = 0%, one repeat" misses the parameter that actually defines the effect.',
        },

        rows: [
            {
                id: 'feedback-repeats',
                heading: 'Feedback & Number of Repeats',
                description: 'Feedback routes the output of the delay back into its input so each repeat feeds the next, creating a decaying chain of echoes. Higher feedback = more repeats before the signal dies away. Multi-tap delays work differently — instead of one feedback loop, they generate several fixed "taps" at independent times. Single-tap with zero feedback produces exactly one repeat.',
                animation: 'feedback-repeats',
                interactive: 'feedback',
                assessment: {
                    id: 'feedback-repeats',
                    question: 'A student wants three evenly-spaced repeats of a snare at 1/4, 1/2, and 3/4 of a bar. They set one delay with high feedback. The result is a decaying stream of repeats, not three clean hits. Why?',
                    options: [
                        { text: 'Feedback creates a chain of decreasing-volume repeats on the same feedback loop — they need a multi-tap delay where each tap has an independent time and level', correct: true, feedback: 'Single-tap + feedback gives an exponentially decaying train. Multi-tap lets you place each repeat independently with its own time, level and pan.' },
                        { text: 'The delay time is set too short', correct: false, feedback: 'Delay time affects the gap between repeats — the problem here is the structure of the repeats, not the timing of the first one.' },
                        { text: 'They need more feedback to get more repeats', correct: false, feedback: 'More feedback would give more decaying repeats, not three evenly-spaced, same-level hits.' },
                    ],
                },
            },
            {
                id: 'slapback',
                heading: 'Slapback',
                description: 'Slapback is a single short repeat, typically 50–120 ms, with no feedback. It was the signature sound of 1950s rockabilly — Elvis Presley\'s Sun Records vocals, Scotty Moore\'s guitar — originally made with tape echo machines. In modern mixes it is used to thicken a vocal or guitar without creating an obvious echo.',
                animation: 'slapback',
                assessment: {
                    id: 'slapback',
                    question: 'Which combination of parameters most accurately describes a classic slapback delay?',
                    options: [
                        { text: 'Delay time 80 ms, feedback 0%, wet/dry around 30% — a single audible repeat, no chain of echoes', correct: true, feedback: 'Slapback is defined by a short delay time, no feedback (one repeat only), and moderate wet level. Tape flutter and saturation give it its characteristic warmth.' },
                        { text: 'Delay time 400 ms, feedback 50%, wet/dry 50% — a long cascading echo', correct: false, feedback: 'This describes a general creative delay. Slapback is specifically a single short repeat with no feedback.' },
                        { text: 'Delay time 15 ms, feedback 80%, wet/dry 100% — thickening with many fast repeats', correct: false, feedback: 'At 15 ms the repeat fuses with the dry signal (chorus-like thickening), not slapback. And high feedback produces many repeats, not one.' },
                    ],
                },
            },
            // --- new row ---
            {
                id: 'tape-echo',
                heading: 'Tape Echo: Why Old Repeats Get Darker',
                description: 'The first delay machines were tape loops: a record head writes the signal, a playback head reads it back, and feedback re-records the output through that same analogue loop. Every pass loses a little high end, so tape repeats get quieter AND darker together — the single clearest clue a delay was made on tape rather than a clean digital line.',
                animation: 'tape-echo-darkening',
                assessment: {
                    id: 'tape-echo',
                    question: 'A student is played an unfamiliar delay effect and asked whether it was likely made with a tape machine or a clean digital delay. The repeats grow progressively duller as well as quieter. What is the best-supported answer?',
                    options: [
                        { text: 'Tape — analogue feedback re-records each repeat through the loop, so every pass loses high-frequency content; repeats getting duller as well as quieter is the signature clue', correct: true, feedback: 'Correct — that darkening-and-quietening-together trail is exactly what analogue tape re-recording produces, and is the clue examiners point to when identifying tape delay by ear.' },
                        { text: 'Digital — digital delays always darken their repeats to sound more natural', correct: false, feedback: 'A clean digital delay repeats the signal identically each pass, save for the feedback level. Nothing about digital delay inherently darkens repeats — that is specifically an analogue-tape behaviour.' },
                        { text: 'Neither can be determined — repeats always just get quieter, regardless of how the delay was made', correct: false, feedback: 'Repeats getting quieter alone does not distinguish tape from digital, but the combination of quieter AND darker together is what tape-style feedback specifically produces.' },
                    ],
                },
            },
        ],
    },
    {
        id: 'timed-delay',
        chapterNumber: 3,
        title: 'Timed Delay & the Maths',
        subtitle: 'Topic 1.12 — Component 4',
        description: 'The 60,000 ÷ BPM formula that locks a delay\'s repeats to the song\'s tempo, and the dotted and triplet multipliers that shift a note value off the beat.',
        estimatedTime: '15–20 minutes',
        examAnchor: {
            question: 'A delay is set to a tempo-synced dotted-eighth note in a track running at 100 BPM. Calculate the delay time in milliseconds, showing your working — no calculator is allowed.',
            modelPoints: [
                'Quarter-note ms = 60,000 ÷ BPM = 60,000 ÷ 100 = 600 ms.',
                'A dotted-eighth is a quarter note × 0.75 (an eighth is half a quarter, and dotted means × 1.5 of that half): 600 × 0.75 = 450 ms.',
                '600 × 0.75 can be done without a calculator as 600 − (600 ÷ 4) = 600 − 150 = 450, or as 600 × 3 ÷ 4 = 1800 ÷ 4 = 450.',
                'No credited BPM value in this bank requires a calculator: every family value (60, 100, 120, 150...) is chosen so the division comes out clean.',
            ],
            examTip: 'Show every step — the BPM-to-ms conversion, then the ×0.75 (or ×1.5/×⅔ for other dotted/triplet values) — mark schemes credit the working. The 2023 A Q6 examiner report notes very few candidates worked out that a pictured delay was a tempo-synced quaver at 120 BPM (250 ms by the formula): show the working, don\'t just state a final figure.',
        },

        rows: [
            {
                id: 'timed-delay',
                heading: 'Timed Delay',
                description: 'A timed (tempo-synced) delay locks the repeat to the song\'s tempo. A quarter-note delay in milliseconds = 60,000 ÷ BPM. A dotted-eighth is a quarter note × 0.75 — the syncopated pattern made famous by The Edge on U2\'s "Where the Streets Have No Name". DAWs usually offer note-value sync (1/4, 1/8D, 1/16) as well as straight milliseconds.',
                animation: 'timed-delay',
                assessment: {
                    id: 'timed-delay',
                    question: 'At 120 BPM, what is the delay time in milliseconds for a dotted-eighth note?',
                    options: [
                        { text: '500 ms — that is the quarter-note value', correct: false, feedback: '60,000 ÷ 120 = 500 ms is the quarter-note. A dotted-eighth is 0.75 of that.' },
                        { text: '375 ms — quarter note (500 ms) × 0.75 = 375 ms', correct: true, feedback: 'Quarter note = 60,000 ÷ BPM = 500 ms at 120 BPM. Dotted-eighth is three-quarters of a quarter note: 500 × 0.75 = 375 ms.' },
                        { text: '250 ms — that is the eighth-note value', correct: false, feedback: 'A straight eighth is 250 ms, but a dotted eighth is longer — an eighth plus half its value, or equivalently a quarter × 0.75 = 375 ms.' },
                    ],
                },
            },
            // --- new row ---
            {
                id: 'bpm-ms-family',
                heading: 'The 60,000 ÷ BPM Family',
                description: 'Every timed delay starts from one formula: quarter-note ms = 60,000 ÷ BPM. The values form a tractable family worth memorising: 60 BPM → 1000 ms, 100 BPM → 600 ms, 120 BPM → 500 ms, 150 BPM → 400 ms. No calculator is allowed in the exam — these divide cleanly, and the exam tests whether you know the relationship, not whether you can do long division.',
                animation: 'bpm-to-ms-family',
                assessment: {
                    id: 'bpm-ms-family',
                    question: 'A track runs at 60 BPM — the slowest of the anchor tempos. Without a calculator, what is the quarter-note delay time in milliseconds?',
                    options: [
                        { text: '1000 ms — 60,000 ÷ 60 = 1000', correct: true, feedback: 'Correct — dividing 60,000 by 60 just removes a zero: 1000 ms. This is the anchor case the whole family is built from.' },
                        { text: '600 ms — that is the value for 100 BPM, not 60 BPM', correct: false, feedback: '600 ms is the answer for 100 BPM. Mixing up adjacent values in the family is the easiest way to lose this mark — always redo the division for the BPM actually given.' },
                        { text: '60 ms — the BPM number can be read directly as milliseconds', correct: false, feedback: 'BPM measures tempo (beats per minute), not a delay time directly — it has to be run through the 60,000 ÷ BPM formula first, or the answer comes out far too short.' },
                    ],
                },
            },
            // --- new row ---
            {
                id: 'dotted-triplet',
                heading: 'Dotted & Triplet Multipliers',
                description: 'Any note value can be dotted (×1.5 of itself) or played as a triplet (×⅔). At 100 BPM the quarter note is a friendly 600 ms, since 600 divides cleanly by three: a dotted quarter is 600 × 1.5 = 900 ms, a triplet quarter is 600 × ⅔ = 400 ms — both checkable by hand, no calculator needed.',
                animation: 'dotted-triplet-multipliers',
                assessment: {
                    id: 'dotted-triplet',
                    question: 'At 100 BPM, what is the triplet-quarter-note delay time in milliseconds?',
                    options: [
                        { text: '400 ms — the quarter note is 600 ms, and 600 × ⅔ = 400 ms', correct: true, feedback: 'Correct — 600 ÷ 3 = 200, and two of those thirds is 400 ms. The same ×1.5/×⅔ pattern is what turns a quarter note into the dotted-eighth shortcut used earlier: an eighth is half a quarter, so dotted-eighth = quarter × 0.75.' },
                        { text: '900 ms — that is the dotted quarter note, not the triplet', correct: false, feedback: '900 ms comes from ×1.5 (dotted), the opposite adjustment. Triplet is ×⅔, which shortens the note rather than lengthening it.' },
                        { text: '200 ms — that is one third of the quarter note, not two thirds', correct: false, feedback: '200 ms is 600 × ⅓. A triplet note takes ⅔ of the plain value (two of the three equal parts), not ⅓.' },
                    ],
                },
            },
        ],
    },
    {
        id: 'stereo-adt',
        chapterNumber: 4,
        title: 'Stereo Delay & ADT',
        subtitle: 'Topic 1.12 — Component 4',
        description: 'How a ping-pong delay bounces repeats across the stereo field, how pan and EQ shape where repeats sit in a mix, and the short-delay recipe behind Automatic Double Tracking.',
        estimatedTime: '15–20 minutes',
        examAnchor: {
            question: 'A recreate task asks you to (a) explain what structurally distinguishes a ping-pong delay from a single repeat panned to one side, and (b) describe the ADT technique for thickening a single vocal take without creating an audible echo, including at least three specific details.',
            modelPoints: [
                'Ping-pong uses two delay lines with their feedback paths crossed — the left line\'s output feeds the right line\'s input and vice versa — so each successive repeat alternates automatically between channels.',
                'A single delay panned hard to one side only ever produces a repeat on that one side; it does not alternate, so it is not the same architecture as true ping-pong.',
                'ADT uses a short delay of 15–30 ms (up to about 40 ms for vocals), with zero feedback — a single repeat that stays inside the fusion window rather than separating into a slap — mixed in behind the dry vocal.',
                'A subtle amount of pitch or timing modulation (originally from two tape machines running at slightly different speeds) is what makes the copy read as a second human performance rather than a static doubled copy.',
            ],
            examTip: 'State the mechanism, not just the effect — "two delay lines with crossed feedback" earns the ping-pong mark that "bounces left and right" alone does not, and for ADT naming the delay time, the absence of feedback, and the modulation together is worth more than any one detail alone.',
        },

        rows: [
            {
                id: 'ping-pong',
                heading: 'Ping-Pong',
                description: 'A ping-pong delay sends successive repeats alternately to the left and right channels. The first repeat lands in one speaker, the next in the other, and so on — creating wide stereo movement from a mono source. Combined with tempo sync and moderate feedback, it is a staple of ambient guitar, dub reggae, and electronic production.',
                animation: 'ping-pong',
                audio: { preset: 'delay-pingpong', label: 'Hold to hear repeats bounce hard left then right as feedback keeps the pattern alive.' },
                assessment: {
                    id: 'ping-pong',
                    question: 'A guitarist records a mono riff. Using only a ping-pong delay (no other stereo effects), what will they hear on playback in the monitors?',
                    options: [
                        { text: 'The dry riff stays central while repeats bounce between left and right channels', correct: true, feedback: 'Ping-pong routes successive repeats to alternating channels, so the dry signal stays where it is panned and the wet signal creates stereo movement.' },
                        { text: 'The entire signal — dry and wet — alternates between speakers', correct: false, feedback: 'Only the repeats alternate. The dry signal stays on whichever channel (or centre) it is panned to.' },
                        { text: 'Nothing changes because delay does not affect stereo width', correct: false, feedback: 'Standard delays keep repeats on the same channel as the source, but ping-pong specifically alternates them between channels.' },
                    ],
                },
            },
            // --- new row ---
            {
                id: 'pingpong-architecture',
                heading: 'Ping-Pong: The Real Architecture',
                description: 'Ping-pong is not just a wet signal panned to one side. It uses two delay lines with crossed feedback: the left line\'s output feeds the right line\'s input, and the right line\'s output feeds the left line\'s input, so each repeat alternates channels automatically. Simple stereo dry/wet routing with no crossed feedback path is not ping-pong, even if it sounds vaguely similar panned wide.',
                animation: 'pingpong-crossed-feedback',
                assessment: {
                    id: 'pingpong-architecture',
                    question: 'A student pans a single delay\'s wet return hard to one side and calls it "ping-pong". What is missing from a true ping-pong delay?',
                    options: [
                        { text: 'Nothing — panning the wet signal to one side is exactly what ping-pong means', correct: false, feedback: 'A single panned repeat only ever lands on one side. True ping-pong needs the alternating, bouncing pattern a single panned delay cannot produce.' },
                        { text: 'Two delay lines with feedback paths crossed between them, so each successive repeat alternates automatically between left and right — a single panned repeat only ever lands on one side', correct: true, feedback: 'Exactly — that is the credited definition. Simple panning without a crossed feedback loop between two delay lines is not the same architecture, even if it sounds superficially wide.' },
                        { text: 'A single delay line with feedback set above 100%', correct: false, feedback: 'That would create a runaway, self-oscillating drone, not stereo alternation — it has nothing to do with panning or crossed feedback at all.' },
                    ],
                },
            },
            {
                id: 'delay-pan-eq',
                heading: 'Delay Pan & EQ',
                description: 'Delay returns are often shaped so they sit behind the dry signal rather than competing with it. Panning the wet to the opposite side of a centred vocal widens the image. High-cut EQ on the repeats makes them sound more distant and stops sibilance stacking up on every repeat. Low-cut keeps the bass end clean.',
                animation: 'pan-eq',
                assessment: {
                    id: 'pan-eq',
                    question: 'A mixer adds a 1/4-note delay to a lead vocal but every "s" piles up into an unpleasant hiss on each repeat. What is the most appropriate fix without reducing the delay level?',
                    options: [
                        { text: 'Apply a high-cut (low-pass) EQ to the delay return so high frequencies, including sibilance, are rolled off on the repeats', correct: true, feedback: 'Filtering high frequencies out of the wet path keeps the repeats audible but stops sibilance and brightness from compounding on every echo.' },
                        { text: 'Turn the delay feedback up so the repeats decay faster', correct: false, feedback: 'Higher feedback creates more repeats, which would make the sibilance problem worse.' },
                        { text: 'Move the delay pan hard left to hide the sibilance', correct: false, feedback: 'Panning moves the repeats in the stereo field but does not change their frequency content.' },
                    ],
                },
            },
            {
                id: 'adt',
                heading: 'Automatic Double Tracking',
                description: 'ADT (Automatic Double Tracking) was invented at Abbey Road in 1966 by Ken Townsend to save the Beatles from re-recording every vocal, using two tape machines running at slightly different speeds. Modern DAW emulations use a short delay of 15–30 ms (up to ~40 ms for vocals), zero feedback, and subtle LFO pitch/timing modulation to imitate a real double-tracked performance. The result: a thicker, wider lead vocal from a single take.',
                animation: 'adt',
                assessment: {
                    id: 'adt',
                    question: 'A student has a thin-sounding lead vocal from a single take. Which approach uses ADT correctly to thicken it?',
                    options: [
                        { text: 'A short delay (~20 ms, within the 15–30 ms range) with zero feedback and a small amount of LFO pitch modulation, mixed in behind the dry vocal', correct: true, feedback: 'This is the credited ADT recipe: a delay short enough to stay inside the fusion window from Chapter 1, zero feedback, plus slight pitch modulation to simulate the small timing and tuning differences of a real double-tracked performance.' },
                        { text: 'A delay of around 100 ms with no feedback, matching the figure given in older textbooks', correct: false, feedback: 'Older sources, including some textbook extracts, quote ADT at around 100 ms — but current mark schemes penalise that figure. At 100 ms the repeat is well past the sub-30 ms fusion threshold from Chapter 1, so it separates into an audible slap instead of fusing into one thickened voice.' },
                        { text: 'A ping-pong delay at 400 ms to spread the vocal across the stereo field', correct: false, feedback: 'Ping-pong creates stereo movement with audible repeats. ADT creates a thicker, single-voice impression by sitting the delayed copy very close to the dry.' },
                    ],
                },
            },
        ],
    },
];
