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
            description: 'ADT (Automatic Double Tracking) was invented at Abbey Road in 1966 by Ken Townsend to save the Beatles from re-recording every vocal twice. It uses a very short delay of around 50–100 ms with small LFO pitch modulation to imitate the timing and tuning variation of a human double-track. The result: a thicker, wider lead vocal from a single take.',
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
