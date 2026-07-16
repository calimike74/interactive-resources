// Dynamics Course — 4-chapter version (Task 6, learn-rollout-wave1).
// Legacy rows below (what-compression-solves, threshold-ratio, knee, makeup-gain,
// attack-release, before-after) are copied verbatim from the original single-lesson
// COMPRESSION_TOPIC in compression.js: same heading/description/animation/assessment.
// New rows are marked in comments and sourced from
// _sandbox/compression-reference/src/content/learn.tsx + teach.ts.
// NOTE: this file is NOT yet wired into lib/learn/topics/index.js (Task 8 does that
// and deletes compression.js) — see task-6-report.md for the sequencing rationale.

export const DYNAMICS_CHAPTERS = [
    {
        id: 'dynamic-range',
        chapterNumber: 1,
        title: 'Dynamic Range',
        subtitle: 'Topic 1.9 — Component 4',
        description: 'The gap between a signal\'s loudest and quietest moments, why it needs controlling, and what a compressor is actually doing when it "squeezes".',
        estimatedTime: '15–20 minutes',
        examAnchor: {
            question: 'A vocal recording swings from a quiet verse to a loud, belted chorus. Define dynamic range in this context, and explain why simply raising the fader for the whole track does not fix the problem the way compression does.',
            modelPoints: [
                'Dynamic range is the gap, in decibels, between the loudest and quietest moments of a signal — here, the gap between the quiet verse and the loud chorus.',
                'Raising the fader for the whole track lifts the quiet verse and the loud chorus by the same fixed amount, so the gap between them — the dynamic range — stays exactly the same.',
                'A compressor instead behaves like an automatic fader: it turns the signal down only once it crosses a chosen level, so only the loud chorus is pulled down and the gap narrows.',
                'Credit any two of the compressor\'s benefits: it controls peaks, keeps the volume consistent, raises the average (RMS) level, or helps the vocal sit in the mix.',
            ],
            examTip: '2022 A Q4(a)(i) credits four distinct reasons — control peaks; consistent volume; raise average/RMS level; sit in the mix — state at least two clearly different ones rather than four phrasings of the same idea.',
        },

        rows: [
            {
                id: 'what-compression-solves',
                heading: 'What Compression Solves',
                description: 'Audio signals have a dynamic range — the gap between the quietest and loudest moments. In a mix, if a vocal is too dynamic, quiet words get lost and loud ones overpower everything. A compressor reduces this gap, making the signal more consistent and controlled.',
                animation: 'dynamic-range',
                assessment: {
                    id: 'what-compression-solves',
                    question: 'A podcast host speaks quietly then laughs loudly into the mic. Without compression, a listener constantly adjusts their volume. What specifically is the compressor solving here?',
                    options: [
                        { text: 'Making the quiet parts louder by boosting the entire signal', correct: false, feedback: 'That\'s just turning up the volume — it would make the loud laughs even louder too.' },
                        { text: 'Reducing the dynamic range — bringing the loud laughs closer in level to the quiet speech', correct: true, feedback: 'The compressor tames the peaks so the gap between quiet and loud is smaller, removing the need for manual volume adjustment.' },
                        { text: 'Removing the low frequencies from the laughter', correct: false, feedback: 'EQ removes frequencies — compression controls dynamics regardless of frequency content.' },
                    ],
                },
            },
            // --- new row ---
            {
                id: 'defining-dynamic-range',
                heading: 'Defining Dynamic Range',
                description: 'Dynamic range is the gap, in decibels, between a signal\'s loudest and quietest moments — a whispered line might sit at −40 dBFS, a shouted one at −6 dBFS, a 34 dB span. Every source that swings this widely fights the same problem: too wide a gap and a listener reaches for the volume knob constantly, or loses the quiet parts altogether.',
                animation: 'dynamic-range-gap',
                audio: { preset: 'comp-drums-raw', label: 'Hold to hear the raw drum loop — kick and snare swinging freely between quiet and loud.' },
                assessment: {
                    id: 'defining-dynamic-range',
                    question: 'A location recording has a whispered line at −38 dBFS and a shouted line at −4 dBFS. What is the dynamic range of this recording?',
                    options: [
                        { text: '34 dB — the difference between the loudest and quietest levels present in the recording', correct: true, feedback: '−4 − (−38) = 34 dB. Dynamic range is always the gap between the two extremes, not either level on its own.' },
                        { text: '−42 dB — add the two levels together to find the total range', correct: false, feedback: 'Dynamic range is a difference, not a sum — adding the two dB values together doesn\'t describe a gap between anything.' },
                        { text: '4 dB — dynamic range is set by the loudest level alone', correct: false, feedback: 'The loudest level on its own tells you nothing about the gap — dynamic range needs both the loudest AND quietest moments compared.' },
                    ],
                },
            },
            // --- new row ---
            {
                id: 'automatic-fader',
                heading: 'The Automatic Fader',
                description: 'A compressor is an automatic fader: build the reflex of riding a volume knob by hand into a circuit, and it turns the signal down the moment it crosses a chosen level, then leaves it alone below that. The mark schemes credit four reasons for reaching for one: control the peaks, keep the volume consistent, raise the average (RMS) level, and help a part sit in the mix.',
                animation: 'automatic-fader-concept',
                audio: { preset: 'comp-drums-squashed', label: 'Hold to hear the same loop compressed — peaks tamed, level lifted, one consistent groove.' },
                assessment: {
                    id: 'automatic-fader',
                    question: 'A student describes compression as "basically the same as turning up the volume knob." Using the automatic-fader idea, what\'s the key difference?',
                    options: [
                        { text: 'Raising the volume knob boosts everything, loud and quiet alike, by the same amount; a compressor only turns down the parts that cross a chosen level, the way a hand riding the fader would', correct: true, feedback: 'That\'s the automatic-fader idea exactly: selective action above a chosen level, not a blanket boost or cut across the whole signal.' },
                        { text: 'Nothing — compression and turning up the volume knob produce an identical result, compression is just automated', correct: false, feedback: 'A volume knob changes everything equally. A compressor is selective — it only acts on the parts that cross its chosen level, which is the whole point of the automatic-fader comparison.' },
                        { text: 'Compression removes frequencies that a volume knob can\'t reach', correct: false, feedback: 'That describes EQ or filtering, not compression — a compressor works on level (loudness), not on which frequencies are present.' },
                    ],
                },
            },
        ],
    },
    {
        id: 'compressor-controls',
        chapterNumber: 2,
        title: 'The Compressor\'s Controls',
        subtitle: 'Topic 1.9 — Component 4',
        description: 'Threshold, ratio, knee and makeup gain — the controls that shape the transfer curve, and the graph an exam question may ask you to draw.',
        estimatedTime: '15–20 minutes',
        examAnchor: {
            question: 'A snare hit peaks at −5 dBFS. The compressor\'s threshold is set to −20 dBFS with a ratio of 5:1. Calculate the gain reduction applied to that peak, showing your working.',
            modelPoints: [
                'The peak sits 15 dB above the threshold (−5 − (−20) = 15 dB).',
                'At a ratio of 5:1, only 1 dB of output is produced for every 5 dB of input above threshold, so 15 ÷ 5 = 3 dB of output above threshold.',
                'Gain reduction is the difference between what went in above threshold and what came out above threshold: 15 − 3 = 12 dB.',
                'The compressed peak level is therefore −17 dBFS (−20 + 3).',
            ],
            examTip: 'Show every step of the arithmetic — dB above threshold, division by the ratio, subtraction for the reduction — mark schemes award marks for the working, not just a final number pulled from nowhere.',
        },

        rows: [
            {
                id: 'threshold-ratio',
                heading: 'Threshold & Ratio',
                description: 'The threshold sets the level where compression begins — signals below it pass through untouched. The ratio determines how much compression is applied above the threshold. A 4:1 ratio means for every 4 dB the input goes above threshold, only 1 dB comes out. Higher ratios mean more aggressive compression.',
                animation: 'threshold-ratio',
                interactive: 'threshold',
                assessment: {
                    id: 'threshold-ratio',
                    question: 'A vocal peaks at -6 dBFS. You set the threshold at -18 dBFS with a 3:1 ratio. How much gain reduction is applied to the loudest peak?',
                    options: [
                        { text: '4 dB — divide the signal above threshold by the ratio', correct: false, feedback: '12 ÷ 3 = 4 dB is the output above threshold, not the gain reduction. Gain reduction is 12 - 4 = 8 dB.' },
                        { text: '8 dB — the peak is 12 dB above threshold, and at 3:1 only 4 dB passes through (12 - 4 = 8 dB reduction)', correct: true, feedback: '12 dB above threshold ÷ 3 = 4 dB output above threshold, so 12 - 4 = 8 dB of gain reduction.' },
                        { text: '12 dB — everything above the threshold is compressed', correct: false, feedback: 'At 3:1 the signal isn\'t eliminated, it\'s reduced. Only an infinity:1 ratio (limiter) would reduce all 12 dB.' },
                    ],
                },
            },
            // --- new row ---
            {
                id: 'transfer-curve',
                heading: 'The Transfer Curve',
                description: 'Every compressor\'s behaviour can be drawn as one picture, its transfer curve: input level along the bottom, output level up the side, both in dB. With no compression the line is the 1:1 diagonal — whatever goes in comes out unchanged. Above the threshold the line bends shallower; the ratio sets how much, at 4:1 four decibels in becomes one decibel out.',
                animation: 'compressor-transfer-curve',
                assessment: {
                    id: 'transfer-curve',
                    question: 'On a compressor\'s transfer curve (input dB along the bottom, output dB up the side), what does the section of the line BELOW the threshold look like, and why?',
                    options: [
                        { text: 'A straight 1:1 diagonal — every dB of input passes straight through as the same dB of output, because compression hasn\'t engaged yet', correct: true, feedback: 'Exactly — below the threshold the compressor is doing nothing at all, so the line is the plain 45-degree 1:1 diagonal, unchanged from an uncompressed signal.' },
                        { text: 'A flat horizontal line — output stays at zero until the threshold is reached', correct: false, feedback: 'A compressor doesn\'t silence anything below the threshold — it passes the signal through completely untouched, which is a rising diagonal, not a flat silent line.' },
                        { text: 'A line with the same shallow slope as above the threshold — the ratio applies everywhere on the graph', correct: false, feedback: 'The ratio only bends the line above the threshold. Below it, nothing is compressed at all, so the slope is the full, uncompressed 1:1 diagonal.' },
                    ],
                },
            },
            {
                id: 'knee',
                heading: 'Hard Knee vs Soft Knee',
                description: 'The knee determines how the compressor transitions into compression around the threshold. Hard knee applies the full ratio instantly at the threshold — precise but can sound obvious. Soft knee gradually increases the ratio as the signal approaches the threshold — more transparent and musical sounding.',
                animation: 'knee-types',
                assessment: {
                    id: 'knee',
                    question: 'You\'re compressing a lead vocal in a ballad and want the compression to be as invisible as possible. Would you choose hard or soft knee?',
                    options: [
                        { text: 'Hard knee — precise control is always better for vocals', correct: false, feedback: 'Hard knee applies the full ratio instantly at threshold, which can sound abrupt on exposed vocals.' },
                        { text: 'Soft knee — it gradually increases the ratio as the signal approaches the threshold, making the onset of compression smoother', correct: true, feedback: 'The gradual transition makes compression less audible, which is ideal for exposed vocals in a ballad.' },
                        { text: 'It doesn\'t matter — knee only affects loud signals', correct: false, feedback: 'Knee affects how compression transitions around the threshold, which is exactly where a vocal sits most of the time.' },
                    ],
                },
            },
            {
                id: 'makeup-gain',
                heading: 'Make-Up Gain',
                description: 'Compression reduces the level of loud peaks, which lowers the overall signal level. Make-up gain boosts the entire signal back up after compression. The result: the peaks are controlled but the quiet parts are now louder relative to them. This is how compression makes things sound "louder" without actually increasing peak levels.',
                animation: 'makeup-gain',
                assessment: {
                    id: 'makeup-gain',
                    question: 'After compressing a vocal, the peaks are controlled but the track sounds quieter in the mix. What do you do, and why does this make the vocal seem \'louder\' overall?',
                    options: [
                        { text: 'Remove the compressor — it\'s making the vocal too quiet', correct: false, feedback: 'The compressor is doing its job reducing peaks — removing it brings back the dynamic range problem.' },
                        { text: 'Apply make-up gain — peaks are now controlled, so boosting the level raises the quiet parts closer to the peaks, increasing average loudness', correct: true, feedback: 'With peaks tamed, make-up gain lifts everything including the quiet parts, making the overall signal feel louder and more present.' },
                        { text: 'Increase the ratio to compress more — this will make it louder', correct: false, feedback: 'Higher ratio means more gain reduction, which would make it even quieter without make-up gain.' },
                    ],
                },
            },
        ],
    },
    {
        id: 'attack-release',
        chapterNumber: 3,
        title: 'Attack, Release & Punch',
        subtitle: 'Topic 1.9 — Component 4',
        description: 'How attack and release set a compressor\'s timing, the punch that timing choice controls, and the pumping artefact — or effect — that timing mistakes create.',
        estimatedTime: '15–20 minutes',
        examAnchor: {
            question: 'A producer compresses a drum bus and finds the kick and snare have lost their punch — every hit now sounds soft and rounded instead of sharp. Explain what\'s causing this, and state what should change to fix it.',
            modelPoints: [
                'Punch comes from the transient — the first few milliseconds of a hit — reaching the listener at full, unprocessed level.',
                'A fast attack clamps down on the signal the instant it crosses the threshold, catching and rounding off that transient, which is what has removed the punch here.',
                'The fix is to slow the attack time down, so the compressor lets the transient through untouched and only squeezes the sustained body of the hit that follows.',
                'A slow attack paired with a fast release is the standard recipe for preserving punch while still controlling the overall level.',
            ],
            examTip: 'State the direction of change explicitly — "adjust the attack" alone earns nothing; the 2025 A Q5(b) practical scheme docked a mark for attack set too long in the opposite scenario, so examiners expect attack chosen deliberately for the job and named as slower or faster.',
        },

        rows: [
            {
                id: 'attack-release',
                heading: 'Attack & Release',
                description: 'Attack controls how quickly the compressor responds once the signal crosses the threshold. A fast attack clamps down immediately (good for controlling transients). A slow attack lets the initial transient through (preserves punch). Release controls how quickly compression stops after the signal drops below threshold.',
                animation: 'attack-release',
                assessment: {
                    id: 'attack-release',
                    question: 'A drum bus compressor is set with a very fast attack. The drums sound controlled but have lost their punch. What would you change?',
                    options: [
                        { text: 'Increase the ratio for more compression', correct: false, feedback: 'More compression would reduce punch even further — the issue is timing, not amount.' },
                        { text: 'Slow down the attack — let the initial transient pass through before compression engages', correct: true, feedback: 'The transient is the \'hit\' — fast attack clamps it down, slow attack preserves the punch while still controlling sustain.' },
                        { text: 'Speed up the release to recover faster', correct: false, feedback: 'Release affects recovery after compression, not whether the initial transient passes through.' },
                    ],
                },
            },
            // --- new row ---
            {
                id: 'pumping',
                heading: 'Pumping: Artefact or Effect',
                description: 'Set the release too slow and the gain never recovers between hits; time it badly against the tempo and the compressor audibly breathes out of step with the track — pumping. Left unchecked, it\'s a fault: an obvious, distracting swell after every loud hit. Tuned deliberately to the tempo instead, especially with a side-chain trigger, it becomes the pumping groove that defines EDM.',
                animation: 'pumping-envelope',
                assessment: {
                    id: 'pumping',
                    question: 'A mix engineer notices their drum bus compressor audibly "breathes" — the level visibly swells up and down out of time with the track, distracting from the groove. What\'s most likely causing this, and how would they fix it?',
                    options: [
                        { text: 'The release time is mismatched to the tempo, so the gain reduction hasn\'t recovered before the next hit arrives — adjusting the release to match the track\'s rhythm removes the audible pumping', correct: true, feedback: 'Pumping is a timing fault: the compressor\'s recovery is out of step with the music, so retiming the release — not changing how hard it compresses — is the fix.' },
                        { text: 'The attack is too slow, letting every transient straight through unprocessed', correct: false, feedback: 'A slow attack preserves transients — it doesn\'t create the audible swelling described here. That\'s a release-timing problem, not an attack one.' },
                        { text: 'The compressor isn\'t compressing hard enough and needs more gain reduction overall', correct: false, feedback: 'Pumping is about WHEN the gain recovers, not how much reduction is applied — compressing harder would make an out-of-time pump more obvious, not fix it.' },
                    ],
                },
            },
            {
                id: 'before-after',
                heading: 'Before & After',
                description: 'The full picture: an uncompressed signal with wide dynamic range goes through the compressor. Peaks above the threshold are reduced by the ratio. Attack and release shape the timing. Make-up gain restores the overall level. The output is more consistent, sits better in a mix, and feels more polished.',
                animation: 'before-after-compression',
                assessment: {
                    id: 'before-after',
                    question: 'A mix engineer A/B compares their compressed drum bus with the uncompressed version. The compressed version sounds louder and \'better\'. How can they make a fair comparison?',
                    options: [
                        { text: 'Turn up the uncompressed version to match', correct: false, feedback: 'Turning up the uncompressed version would just make the peaks louder and potentially clip — the point is to match average loudness, which means turning the compressed version down.' },
                        { text: 'Match the perceived loudness by turning down the compressed version before comparing', correct: true, feedback: 'Compression + make-up gain increases average level, so our ears perceive it as better simply because it\'s louder — level-matching reveals the actual tonal and dynamic changes.' },
                        { text: 'The comparison is already fair — the compressor made it genuinely louder', correct: false, feedback: 'Louder always sounds \'better\' to our ears — this is a well-known psychoacoustic bias. Fair comparison requires level-matching to judge the actual processing, not just the volume difference.' },
                    ],
                },
            },
        ],
    },
    {
        id: 'dynamics-family',
        chapterNumber: 4,
        title: 'Limiters, Gates & the Side-chain',
        subtitle: 'Topic 1.9 — Component 4',
        description: 'Push the same numbers to their extremes and a compressor becomes a limiter, an expander or a gate — plus the side-chain trick that lets one track trigger another.',
        estimatedTime: '15–20 minutes',
        outroResourceId: 'compressor-image-explorer',
        examAnchor: {
            question: 'For each job below, name the correct dynamics processor from this chapter — limiter, expander or gate — and justify the choice: (a) stopping a mastered track\'s peaks from ever exceeding 0 dBFS; (b) removing constant hiss between a drummer\'s phrases without affecting the hits themselves.',
            modelPoints: [
                '(a) A limiter — a ratio around ∞:1 creates a hard ceiling that nothing crosses, which is exactly what a hard peak limit at 0 dBFS requires.',
                '(a) A standard compressor with a finite ratio would still let some signal through above the threshold, risking an overshoot past 0 dBFS.',
                '(b) A gate — it acts below its threshold, cutting the quiet hiss between phrases by its range while leaving the loud hits above threshold untouched.',
                '(b) An expander would only reduce the hiss proportionally; a gate\'s fixed, extreme cut is the more complete fix for constant background noise.',
            ],
            examTip: 'Naming the processor alone is not enough — link the mechanism (which side of the threshold it acts on, and how hard) to the specific job; "use a gate because it removes noise" without saying it acts below threshold drops marks.',
        },

        // All four rows below are new.
        rows: [
            {
                id: 'limiter',
                heading: 'The Limiter: ∞:1',
                description: 'Push a compressor\'s ratio to ∞:1 and the line above the threshold goes completely flat: nothing crosses it. That\'s a limiter — a hard ceiling used to stop clipping and to squeeze the loudest possible average level out of a track. In practice, anything from around 10:1 upward starts to behave as limiting, well before the ratio reaches true infinity.',
                animation: 'limiter-ceiling',
                assessment: {
                    id: 'limiter',
                    question: 'A mastering engineer sets a limiter\'s ratio to ∞:1 with the threshold at −1 dBFS. A transient peaks at what would otherwise be +6 dBFS. What happens to it?',
                    options: [
                        { text: 'It\'s held at exactly −1 dBFS — an infinity:1 ratio means nothing is allowed to cross the threshold at all, so the peak is clamped flat to the ceiling', correct: true, feedback: 'That\'s the defining behaviour of a limiter: past the threshold the line goes completely flat, so no input above it changes the output at all.' },
                        { text: 'It\'s reduced proportionally, coming out somewhere between −1 and +6 dBFS', correct: false, feedback: 'That\'s how a finite ratio like 4:1 behaves — an infinity:1 ratio allows nothing through above the threshold at all, not a partial reduction.' },
                        { text: 'It\'s untouched, because limiters only affect frequencies, not levels', correct: false, feedback: 'A limiter is a level (dynamics) processor, not a frequency one — it acts on how loud the peak is, exactly like a compressor with an extreme ratio.' },
                    ],
                },
            },
            // --- new row ---
            {
                id: 'gate-and-expander',
                heading: 'Gate & Expander',
                description: 'Flip compression\'s logic below the threshold and quiet parts get pushed further down instead of up — an expander, which increases dynamic range rather than reducing it. Push that to its extreme and you have a gate: below the threshold the signal is cut by a fixed amount, its range, silencing hum, hiss and spill between phrases. A gate acts below its threshold; a compressor acts above.',
                animation: 'gate-expander-family',
                assessment: {
                    id: 'gate-and-expander',
                    question: 'A student writes: "A gate cuts all sound above the threshold, the same way a compressor does." Which part of this is wrong, and what\'s the correct rule?',
                    options: [
                        { text: 'The direction is backwards — a gate acts below its threshold, cutting quiet signal like hum and hiss, while a compressor acts above its threshold, reducing loud signal; mixing up this direction is a well-documented exam trap', correct: true, feedback: 'Exactly — "the gate cuts everything above the threshold" is the specific wrong-direction answer examiners flag as scoring zero. A gate\'s whole job happens below its threshold.' },
                        { text: 'Nothing is wrong — gate and compressor really do work identically', correct: false, feedback: 'They work in opposite directions relative to the threshold: a compressor acts above it, a gate acts below it. That difference is the entire point of a gate.' },
                        { text: 'The error is that gates work on frequency ranges, not levels', correct: false, feedback: 'A gate cuts LEVEL below the threshold, not frequencies — that\'s a different, also commonly confused, misconception (mixing up dynamics processing with EQ/filtering).' },
                    ],
                },
            },
            // --- new row ---
            {
                id: 'sidechain-basics',
                heading: 'The Side-chain: Trigger & Target',
                description: 'Every compressor has two paths: the audio waiting to be turned down, and the side-chain — the detector reading the level and deciding how much. Normally the detector listens to the same signal it controls. Feed it a different signal instead — the key input — and the trigger and the target separate: a kick drum can key a compressor on the bass, ducking it out of the kick\'s way.',
                animation: 'sidechain-trigger-target',
                assessment: {
                    id: 'sidechain-basics',
                    question: 'In a classic "kick ducks bass" side-chain setup, the compressor on the bass track is keyed by the kick drum. A student is asked to name the trigger and the target. Which is correct?',
                    options: [
                        { text: 'The kick drum is the trigger — what the compressor listens to; the bass track is the target — what the compressor acts on and turns down', correct: true, feedback: 'Right — the detector listens to the trigger (kick) but the gain reduction is applied to the target (bass). Naming both roles is what the mark scheme credits.' },
                        { text: 'The bass track is the trigger, because that\'s the track being compressed', correct: false, feedback: 'The track being compressed is the target, not the trigger — the trigger is whatever signal the detector is listening to, which here is the kick.' },
                        { text: 'Both the kick and bass are triggers, since they\'re linked together', correct: false, feedback: 'Describing side-chain as just "two tracks linked together" without naming which one triggers and which one is acted on is a documented way to lose the marks entirely.' },
                    ],
                },
            },
            // --- new row ---
            {
                id: 'ducking-in-practice',
                heading: 'Ducking & Pumping in Practice',
                description: 'Push a side-chain duck hard enough and a sustained pad audibly pumps in time with the kick — the EDM signature, its character set almost entirely by the release time. A short release snaps back fast for a tight, rhythmic pump; a long release barely recovers before the next kick, holding the pad low almost permanently. Same trigger, same target — the release dial writes the groove.',
                animation: 'sidechain-pumping-release',
                assessment: {
                    id: 'ducking-in-practice',
                    question: 'A producer wants the classic EDM "pumping" pad effect — the pad audibly ducking in time with the kick, then recovering just before the next hit. Which side-chain compressor parameter shapes this most directly, and how should it be set?',
                    options: [
                        { text: 'Release time — set it so the gain reduction recovers just before the next kick arrives, giving the rhythmic pump; too long and the pad never recovers, too short and there\'s no audible pump at all', correct: true, feedback: 'Right — the trigger and target stay the same (kick and pad); it\'s the release time that decides whether the duck reads as a rhythmic pump or something else entirely.' },
                        { text: 'Threshold — set it as low as possible for maximum ducking', correct: false, feedback: 'A very low threshold just means everything ducks, not that it ducks rhythmically — the pumping character specifically comes from how fast the gain recovers, which is release, not threshold.' },
                        { text: 'Ratio — set it to exactly 1:1 for the clearest pump', correct: false, feedback: 'A 1:1 ratio means no compression is happening at all — there\'d be no ducking, and therefore no pump, whatsoever.' },
                    ],
                },
            },
        ],
    },
];
