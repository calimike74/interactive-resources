// Reverb Course — 5-chapter version (Task 4, learn-rollout-wave2).
// Mapped to Pearson Edexcel Component 4 specification 1.12 Reverb, with
// chapters 1–2 grounded in 2.1 Acoustics (the reference prescribes
// 2.1-before-1.12 sequencing). Brand-new course: no legacy Learn lesson
// existed for reverb, so every row here is new. Sourced exclusively from
// _sandbox/reverb-reference/src/content/learn.tsx (prose, recap, staff.mark/
// staff.watch) and teach.ts (lesson sequence, exam anchors, model answer).
// Row anatomy copies lib/learn/topics/delay.js exactly: heading, description
// (<=~70 words), animation, optional audio/interactive, assessment. Every
// audio field is the standard single-preset `{preset, label}` shape (matches
// AudioBlock/LearnSpineLayout exactly, no invented fields). Where the source
// material implies an A/B comparison (verb-hall vs verb-predelay; the dry
// reference vs the reverb-mix interactive's own range; the small room vs
// ch1's hall), the two poles are split across adjacent rows rather than
// packed onto one row — the wave-1 pattern (see dynamics.js:51/:68,
// delay.js:37/:226) — since a row only ever plays one preset.

export const REVERB_CHAPTERS = [
    {
        id: 'one-clap',
        chapterNumber: 1,
        title: 'One Clap in a Room',
        subtitle: 'Topics 1.12 & 2.1 — Component 4',
        description: 'How a single clap arrives in three ordered stages — direct, early reflections, tail — and how the balance between direct and reverberant level tells the ear how far away a source is.',
        estimatedTime: '15–20 minutes',
        examAnchor: {
            question: 'A mix engineer pushes a lead vocal further back in a mix using only the reverb balance, without automating the dry fader. Explain what changes, naming the correct ratio and the correct figure for how the direct level falls with distance.',
            modelPoints: [
                'Direct sound level falls by 6 decibels for every doubling of the distance between listener and source.',
                'The room\'s own reverberant level barely changes with the listener\'s position, because it comes from many reflections filling the whole space rather than from the direct path alone.',
                'Because direct level falls while the reverberant level holds roughly steady, the reverberant-to-direct (R/D) ratio rises as the source moves away.',
                'A rising R/D ratio is heard as the source receding into the space — which is why raising the wet level relative to dry is really a distance control, not just a loudness balance.',
            ],
            examTip: 'Name the R/D ratio explicitly and give the 6 dB per doubling figure — a vague "it sounds further away" without the ratio and the specific figure will not earn full credit.',
        },
        rows: [
            {
                id: 'direct-early-tail',
                heading: 'Direct, Early, Tail',
                description: 'Clap once in any room and three things arrive in strict order. First the direct sound, on the straight line — it defines dry. Then early reflections: discrete bounces off floor, ceiling and walls, arriving within roughly 50 to 80 milliseconds, still separate enough to read as the room\'s size. After that comes the wash — thousands of further bounces fusing into one smooth decaying tail.',
                animation: 'clap-timeline',
                audio: { preset: 'verb-hall', label: 'Play to hear the tick strike, then the hall answer — direct sound, early reflections and tail arriving in order.' },
                assessment: {
                    id: 'direct-early-tail',
                    question: 'A student is played a single clap in a room and asked to describe what they hear, in the correct order of arrival. Which sequence is correct?',
                    options: [
                        { text: 'Direct sound first (it defines dry), then early reflections within roughly 50–80 ms (the size cue), then the wash — thousands of further bounces fusing into a smooth tail', correct: true, feedback: 'Correct — direct sound travels the shortest path and always arrives first, early reflections follow as discrete bounces, and the wash is the dense accumulation of everything after that.' },
                        { text: 'The wash arrives first because it is the loudest part, then the early reflections, then the direct sound last because it has to compete with everything already in the room', correct: false, feedback: 'Direct sound travels the shortest, most direct path from source to listener, so it always arrives first regardless of loudness — loudness has nothing to do with arrival order.' },
                        { text: 'Only two things arrive: the direct sound, then "the reverb" as a single added effect layered on top afterwards', correct: false, feedback: 'Reverb is not one added effect — it is the room\'s own response, made of many separate arrivals (early reflections, then the wash) that happen because of where the source, surfaces and listener actually are.' },
                    ],
                },
            },
            {
                id: 'pre-delay-gap',
                heading: 'Pre-Delay',
                description: 'Pre-delay is the gap between the direct sound and the reverb\'s onset — anywhere from 0 to 200 milliseconds and beyond. It is not an echo effect: nothing repeats, there is simply silence before the wash begins. A longer pre-delay keeps a vocal\'s consonants clear of the reflections that follow, before any decay starts.',
                // beyond reference text — accurate, flagged for Mike's review (see w2-task-4-report)
                animation: 'pre-delay-gap',
                audio: { preset: 'verb-predelay', label: 'Play to hear the same hall with an 80 ms gap before the room answers — pre-delay, not an echo.' },
                assessment: {
                    id: 'pre-delay-gap',
                    question: 'A student hears a vocal with a long pre-delay before the reverb blooms and describes it as "a delay that bounces before the reverb kicks in". What is pre-delay actually?',
                    options: [
                        { text: 'The gap between the direct sound and the onset of the reverb tail — silence, then the wash begins; nothing repeats during it', correct: true, feedback: 'Correct — pre-delay is a length of time with no sound of its own, not a repeat of the signal. It just postpones when the tail starts.' },
                        { text: 'An echo effect — a distinct repeat of the dry signal that plays back before the reverb starts', correct: false, feedback: 'Pre-delay produces no repeat of its own — it is the silent gap itself, before the reverb\'s wash begins. An audible repeat before the tail would be a separate delay effect, not pre-delay.' },
                        { text: 'The time it takes a reverb plugin to load before it can process any sound', correct: false, feedback: 'Pre-delay is a musical/acoustic parameter about the timing of the reverb\'s onset relative to the direct sound, not a technical loading or processing delay in the software.' },
                    ],
                },
            },
            {
                id: 'distance-rd-ratio',
                heading: 'Distance and the R/D Ratio',
                description: 'Move a listener away from a source and the direct level falls 6 decibels per doubling of distance, while the room\'s own level holds roughly steady. So the reverberant-to-direct (R/D) ratio rises, and the source seems to recede into the space. A wet/dry control is really a distance control in disguise.',
                animation: 'distance-rd-ratio',
                interactive: 'reverb-mix',
                audio: { preset: 'verb-dry', label: 'Play to hear the tick almost entirely dry — the up-close reference, before the R/D ratio rises with distance.' },
                assessment: {
                    id: 'distance-rd-ratio',
                    question: 'A mix engineer pushes a vocal further back in a mix using only reverb balance, without touching the dry fader. Which change explains the effect?',
                    options: [
                        { text: 'Raising the wet level relative to dry raises the R/D ratio, mimicking direct level falling 6 dB per doubling of distance while the room\'s level holds steady — the source reads as further away', correct: true, feedback: 'Correct — this is exactly the R/D relationship: the ear reads a rising ratio of reverberant to direct sound as increasing distance, without the dry fader itself needing to move.' },
                        { text: 'The dry signal has literally been moved further from the microphone, in a re-recorded take — reverb balance alone cannot create the illusion of distance', correct: false, feedback: 'No re-record is needed — raising the R/D ratio through the reverb balance alone is precisely the tool the exam expects you to name for this illusion.' },
                        { text: 'Adding more early reflections created the illusion, because early reflections are what tells the ear a source is receding into the distance', correct: false, feedback: 'Early reflections are the size cue, telling the ear about the room\'s dimensions — the R/D ratio (the balance of wet against dry) is what encodes distance, not the early reflections themselves.' },
                    ],
                },
            },
        ],
    },
    {
        id: 'the-tail',
        chapterNumber: 2,
        title: 'The Tail: RT60 & Damping',
        subtitle: 'Topics 1.12 & 2.1 — Component 4',
        description: 'RT60 as the one universal measure of a reverb tail\'s length, and the two different jobs absorption/damping and diffusion do to shape that tail.',
        estimatedTime: '15–20 minutes',
        examAnchor: {
            question: 'Explain how room size affects RT60, giving two separate reasons why a larger room rings longer than a smaller one.',
            modelPoints: [
                'Larger rooms have longer RT60 because sound has further to travel between bounces, so a given decay accumulates over more time before it falls by 60 dB.',
                'With fewer bounces per second in a larger room, the rate of energy loss per second is lower — a second, independent reason the decay takes longer to reach −60 dB.',
                'More absorption in a room shortens RT60, because each bounce loses more energy, so the level falls to −60 dB faster regardless of the room\'s size.',
                '"Soundproofing" is not the correct term for the acoustic treatment that shortens RT60 — soundproofing stops sound crossing a boundary, whereas absorption and damping change how sound already inside a room decays.',
            ],
            examTip: 'Give both reasons for larger rooms ringing longer — longer travel paths AND less loss per second — not just one. Never use "soundproofing" as a synonym for absorption or treatment: the 2018 AS Q6 examiner report specifically flags this as the wrong word.',
        },
        rows: [
            {
                id: 'rt60-decay',
                heading: 'RT60: Time to Fall 60 dB',
                description: 'RT60 is the time a reverb\'s decay takes to fall by 60 decibels — the one universal way to describe how long a tail lasts. A small live room manages well under a second; a concert hall runs one to two seconds; a cathedral rings far beyond that, because each bounce travels further and loses less energy.',
                animation: 'rt60-decay-curve',
                interactive: 'reverb-decay',
                audio: { preset: 'verb-room', label: 'Play to hear the small room\'s 0.4 s tail — a short RT60, the decay already gone before the next tick.' },
                assessment: {
                    id: 'rt60-decay',
                    question: 'Two identical claps are played, one in a small vocal booth and one in a cathedral. Which statement about their RT60 is correct?',
                    options: [
                        { text: 'The cathedral has a much longer RT60 — sound travels further between each bounce, and each bounce loses relatively little energy, so it takes longer to fall by 60 dB', correct: true, feedback: 'Correct — both the longer travel distance between bounces and the lower proportion of energy lost per bounce in a larger, harder space push RT60 up.' },
                        { text: 'Both rooms have the same RT60, because RT60 only depends on how loud the original clap was, not on the room', correct: false, feedback: 'RT60 depends on the room\'s size and surfaces, not on the source\'s loudness — a louder clap decays over the same RT60, just from a higher starting level.' },
                        { text: 'RT60 measures how loud the loudest reflection is, so whichever room has the louder first echo has the longer RT60', correct: false, feedback: 'RT60 is a time measurement — how long the decay takes to fall by 60 dB — not a loudness measurement of any single reflection.' },
                    ],
                },
            },
            {
                id: 'absorption-damping',
                heading: 'Absorption & Damping',
                description: 'Absorption converts acoustic energy into heat at every bounce and removes high frequencies before low ones — highs die first in every room — which is why every reverb has a damping control that darkens the tail rather than changing its level. In a real room, standing waves also pile up bass in the corners, a job for absorption, not damping.',
                animation: 'damping-darkens-tail',
                assessment: {
                    id: 'absorption-damping',
                    question: 'A student describes turning down a reverb\'s damping control as "a bit of soundproofing to control the tail". What is wrong with calling it soundproofing, and what does damping actually do?',
                    options: [
                        { text: 'Damping is not soundproofing — soundproofing stops sound crossing a boundary, whereas damping shapes the tone of a tail that is already decaying inside the room, by controlling how much high frequency survives each bounce', correct: true, feedback: 'Correct — this is exactly the distinction the 2018 AS Q6 examiner report flags: soundproofing is about sound leaving or entering a space, damping is about the tone of the decay already happening inside it.' },
                        { text: 'Nothing is wrong with the word — damping and soundproofing both describe turning the overall reverb level down, so the terms are interchangeable', correct: false, feedback: 'Damping is a tonal (high-frequency) control, not a level control, and soundproofing describes stopping sound crossing a boundary — a different concept entirely from either.' },
                        { text: '"Soundproofing" is the correct technical term the exam expects for high-frequency absorption in a reverb tail', correct: false, feedback: 'The 2018 AS Q6 examiner report specifically flags "soundproofing" as the wrong word here — the correct terms for this in-room, tonal effect are absorption and damping.' },
                    ],
                },
            },
            {
                id: 'diffusion-scatter',
                heading: 'Diffusion',
                description: 'Diffusion does a different job to absorption: instead of removing reflections, it scatters them, the way an irregular bookshelf breaks up flutter without deadening a room the way a duvet would. The decay smooths out and sounds less like a raw echo, but its overall length — the RT60 — barely changes.',
                animation: 'absorb-vs-diffuse',
                assessment: {
                    id: 'diffusion-scatter',
                    question: 'A room is fitted with diffusers, such as an irregular bookshelf, instead of absorptive foam. What is the expected effect on the reverb tail?',
                    options: [
                        { text: 'The reflections are scattered rather than removed, so the decay sounds smoother, but its overall length (RT60) barely changes — diffusion treats texture, not duration', correct: true, feedback: 'Correct — diffusion redistributes reflections in time and direction rather than absorbing their energy, so the tail smooths out without significantly shortening.' },
                        { text: 'The tail gets significantly shorter, because diffusers remove acoustic energy the same way absorptive foam does', correct: false, feedback: 'Diffusers scatter reflections rather than absorbing their energy, so RT60 length is barely affected — shortening the tail is specifically absorption\'s job.' },
                        { text: 'The tail disappears almost entirely, because scattering the reflections cancels them out through phase interference', correct: false, feedback: 'Diffusion is not designed to cancel energy through phase interference — it redirects and scatters reflections in time and direction, smoothing the decay rather than removing it.' },
                    ],
                },
            },
        ],
    },
    {
        id: 'spring-plate',
        chapterNumber: 3,
        title: 'Reverb Without a Room',
        subtitle: 'Topic 1.12 — Component 4',
        description: 'The two mechanical reverbs — spring and plate — built by making something physical vibrate instead of recreating a room, and the character each is identified by.',
        estimatedTime: '15–20 minutes',
        examAnchor: {
            question: 'A listening question plays two short reverb tails on the same drum hit and asks you to identify which is spring and which is plate, then justify your answer using the correct technical character of each.',
            modelPoints: [
                'Spring reverb is identified by its characteristic twang on transients — the smearing of a sharp attack caused by the strongly dispersive steel coil, commonly heard on guitar amplifiers.',
                'Plate reverb is identified as dense, bright and non-spatial — reflections off the tensioned steel sheet fuse almost instantly, and because there is no room geometry, it carries no sense of place.',
                'The EMT 140 is the classic plate reverb unit, and its adjustable damping plate is a mechanical control over decay time.',
                'The credited description is the character words themselves — twang on transients for spring, dense/bright/non-spatial for plate — naming the mechanism alone (coil vs sheet) is not enough on its own.',
            ],
            examTip: 'Use the spec\'s own adjectives, not a paraphrase — "twang on transients" for spring and "dense, bright, non-spatial" for plate are the credited phrases; a vague "it sounds metallic" does not reliably earn the mark.',
        },
        rows: [
            {
                id: 'transduction-chain',
                heading: 'The Transduction Chain',
                description: 'Mechanical reverb makes something physical vibrate and listens to it with a pickup, letting that vibration stand in for a room. Signal in, something vibrates, signal out — the same chain shared with microphones and loudspeakers. Spring and plate reverb are two different physical shapes built on that one shared idea.',
                animation: 'transduction-chain',
                assessment: {
                    id: 'transduction-chain',
                    question: 'A student is asked what a spring reverb and a plate reverb have in common, before being asked what makes them different. What is the shared mechanism?',
                    options: [
                        { text: 'Both are transduction devices: an electrical signal drives something physical to vibrate, a pickup senses that vibration, and it is converted back into an electrical signal — the same chain shared with microphones and loudspeakers', correct: true, feedback: 'Correct — transduction (signal in, something vibrates, signal out) is the shared principle. Spring and plate differ only in the physical shape doing the vibrating.' },
                        { text: 'Both use exactly the same physical component — a coil of steel spring — just mounted differently', correct: false, feedback: 'Plate reverb uses a tensioned steel sheet, not a coiled spring — the shared idea is transduction (signal, vibration, signal), not identical hardware.' },
                        { text: 'Both digitally model a room\'s impulse response using the same algorithm, just with different presets', correct: false, feedback: 'Spring and plate reverb are mechanical devices built on physical vibration, not digital algorithms — modelling a room\'s impulse response describes convolution reverb instead.' },
                    ],
                },
            },
            {
                id: 'spring-twang',
                heading: 'Spring Reverb',
                description: 'In a spring reverb, a transducer twists a coil of steel; waves run its length, reflect, and pass a pickup repeatedly as they die away. Springs are strongly dispersive, so a sharp transient smears into a characteristic twang — the sound built into generations of guitar amplifiers.',
                animation: 'spring-reverb-mechanism',
                assessment: {
                    id: 'spring-twang',
                    question: 'A guitarist hears a distinctive "boing" or twang whenever they hit a sharp staccato note through their amplifier\'s built-in reverb. What causes that specific character?',
                    options: [
                        { text: 'Spring reverb\'s steel coil is strongly dispersive, so a sharp transient smears out as it travels the spring\'s length and reflects back — that smearing is heard as the characteristic twang', correct: true, feedback: 'Correct — dispersion in the coil is exactly what turns a sharp attack into the smeared, twanging character spring reverb is known for.' },
                        { text: 'The amplifier\'s speaker cabinet is resonating sympathetically with the pitch of the guitar string', correct: false, feedback: 'The twang is a property of the spring transducer itself dispersing transients, not the speaker cabinet resonating with the note being played.' },
                        { text: 'The reverb is convolution-based, using an impulse response recorded from a real spring inside the amplifier', correct: false, feedback: 'Classic guitar amp reverb of this kind is a genuine mechanical spring transducer generating the sound live, not a convolution/digital recreation of one.' },
                    ],
                },
            },
            {
                id: 'plate-emt140',
                heading: 'Plate Reverb & the EMT 140',
                description: 'A plate reverb hangs a tensioned steel sheet, drives it from the centre, and listens at the edges. Reflections off the boundary fuse almost instantly into a tail that is dense, bright and non-spatial — no room geometry to imprint on it. The classic EMT 140\'s movable damping plate is a mechanical decay-time control.',
                animation: 'plate-reverb-mechanism',
                assessment: {
                    id: 'plate-emt140',
                    question: 'A recording engineer plays two reverb tails from the same drum hit and asks which is the plate. One clearly conveys a sense of a specific room size and shape; the other does not, but sounds dense and bright. Which is the plate, and why?',
                    options: [
                        { text: 'The dense, bright one with no sense of room size — plate reverb is non-spatial because a tensioned steel sheet has no room geometry to imprint on the reflections, unlike a real room', correct: true, feedback: 'Correct — plate reverb cannot carry a sense of place, because there is no room dimension or wall layout for it to encode in the first place.' },
                        { text: 'The one that conveys a specific room size and shape — plate reverb is designed to sound exactly like a well-defined room, recreated mechanically', correct: false, feedback: 'This is precisely the trap: plate reverb cannot sound like a specific room, because there is no room geometry involved at all — it is non-spatial by definition.' },
                        { text: 'Neither — both tails must be spring reverb, because plate reverb is purely a digital/convolution technology with no mechanical form', correct: false, feedback: 'The classic plate reverb, such as the EMT 140, is a genuine mechanical device — a tensioned steel sheet with a driver and edge pickups, not a digital or convolution technology.' },
                    ],
                },
            },
        ],
    },
    {
        id: 'digital-reverb',
        chapterNumber: 4,
        title: 'Digital Reverb: Algorithm & Fingerprint',
        subtitle: 'Topic 1.12 — Component 4',
        description: 'The two digital approaches to reverb — algorithmic synthesis built from filters, and convolution built from a recorded impulse response — and the hybrid that combines both.',
        estimatedTime: '15–20 minutes',
        examAnchor: {
            question: 'Explain the difference between algorithmic and convolution reverb, and name the reverb type that combines the strengths of both.',
            modelPoints: [
                'Algorithmic reverb is real-time synthesis: it builds its tail from delay lines routed through comb filters, which generate a decaying train of echoes, and allpass filters, which smear those echoes into a dense tail.',
                'Convolution reverb is impulse-response sampling of a real space or hardware unit: it captures exactly what came back from one test impulse and applies that recording to the input signal.',
                'Convolution is realistic because it reproduces a genuine acoustic space, but it is less editable than algorithmic reverb, because the captured impulse response cannot be adjusted the way an algorithm\'s parameters can.',
                'Hybrid reverb is the name for the reverb type that synthesises both approaches — for example, sampled early reflections from a convolution engine combined with an algorithmic tail for control.',
            ],
            examTip: 'Use the spec\'s own wording — "real-time synthesis using delay lines, comb and allpass filters" for algorithmic, and "impulse response sampling... realistic but less editable" for convolution — examiners credit these specific phrases over a loose paraphrase like "convolution is just better".',
        },
        rows: [
            {
                id: 'algorithmic-plumbing',
                heading: 'Algorithmic Reverb',
                description: 'Algorithmic reverb rebuilds a room\'s behaviour from plumbing rather than steel. Comb filters recirculate the signal through short delays to build a decaying train of echoes; allpass filters smear those echoes until they fuse into a dense tail. Every acoustic idea becomes a knob: pre-delay, decay time, damping, diffusion, wet/dry.',
                animation: 'comb-allpass-network',
                assessment: {
                    id: 'algorithmic-plumbing',
                    question: 'A digital reverb\'s manual describes its engine as built from "comb filters feeding into allpass filters". What is each stage actually doing?',
                    options: [
                        { text: 'Comb filters recirculate the signal through short delays to generate a decaying train of echoes; allpass filters then smear those echoes together until they fuse into a dense tail', correct: true, feedback: 'Correct — the comb stage builds the echo train, and the allpass stage is a separate job: densifying and smearing it into a smooth tail.' },
                        { text: 'Both stages do the same job — comb and allpass filters are interchangeable names for the same delay-recirculation process', correct: false, feedback: 'They are not interchangeable: the comb filter generates the echo train, while the allpass filter is a separate stage that smears and densifies it.' },
                        { text: 'Comb filters record a real room\'s impulse response, and allpass filters play that recording back over the input signal', correct: false, feedback: 'That description belongs to convolution reverb — algorithmic reverb synthesises its tail in real time from delay lines, not from a recorded impulse response.' },
                    ],
                },
            },
            {
                id: 'convolution-fingerprint',
                heading: 'Convolution Reverb',
                description: 'Convolution reverb skips the plumbing and takes a room\'s fingerprint instead: fire one impulse in a real space, record everything that returns — the impulse response — then run your signal through that recording. It is strikingly realistic and stubbornly fixed: the space captured is the only space you get.',
                animation: 'impulse-response-fingerprint',
                assessment: {
                    id: 'convolution-fingerprint',
                    question: 'A student claims "convolution reverb is just better than algorithmic reverb, so you should always use it". What is missing from this claim?',
                    options: [
                        { text: 'It ignores the trade-off: convolution is strikingly realistic because it captures a genuine impulse response, but that recording is stubbornly fixed — you cannot adjust the space\'s own character, unlike an editable algorithmic reverb', correct: true, feedback: 'Correct — realistic-but-fixed versus synthetic-but-adjustable is exactly the trade-off the spec wants evaluated, not a simple "better/worse" judgement.' },
                        { text: 'Nothing is missing — convolution reverb reproduces real spaces exactly, so it has no meaningful disadvantage compared to algorithmic reverb', correct: false, feedback: 'Convolution does have a real disadvantage: its captured impulse response is fixed and cannot be edited the way an algorithmic reverb\'s parameters can.' },
                        { text: 'The claim is backwards — algorithmic reverb is always more realistic than convolution, because it is calculated in real time rather than played back from a fixed recording', correct: false, feedback: 'Convolution is the more realistic of the two, since it reproduces an actual captured space — algorithmic reverb is the more editable one, not the more realistic one.' },
                    ],
                },
            },
            {
                id: 'hybrid-parameter-bridge',
                heading: 'Hybrid Reverb & the Parameter Bridge',
                description: 'Hybrid reverb, such as Ableton Live 12\'s, splits the job: sampled early reflections for realism, an algorithmic tail for control. Every acoustic measurement becomes a control on that algorithmic side too: RT60 becomes decay time, the pre-delay gap becomes a pre-delay knob, absorption becomes damping, scattering becomes diffusion, and distance becomes wet/dry.',
                animation: 'parameter-bridge',
                assessment: {
                    id: 'hybrid-parameter-bridge',
                    question: 'Ableton Live 12\'s Hybrid Reverb device is described as combining "sampled early reflections" with "an algorithmic tail". What does this combination actually deliver?',
                    options: [
                        { text: 'The realism of a real captured space in the early reflections, plus the full editability of an algorithm — decay, pre-delay, damping, diffusion and wet/dry — for shaping the tail that follows', correct: true, feedback: 'Correct — hybrid reverb takes the realistic part (early reflections) from a sample and keeps the adjustable part (the tail) fully algorithmic.' },
                        { text: 'It samples the entire reverb tail from a real space and only uses the algorithm to add extra pre-delay on top', correct: false, feedback: 'Only the early reflections are sampled — the tail itself is algorithmic and fully adjustable, it is not also sampled from the same real space.' },
                        { text: 'It runs two completely separate reverb engines in parallel and lets you crossfade between them, rather than combining their outputs into one signal', correct: false, feedback: 'Hybrid reverb is a single signal chain where sampled early reflections feed into an algorithmic tail — not two independent engines you blend between.' },
                    ],
                },
            },
        ],
    },
    {
        id: 'routing',
        chapterNumber: 5,
        title: 'Wiring It In: Sends, Inserts & Faders',
        subtitle: 'Topic 1.12 — Component 4',
        description: 'Where reverb sits in the mixer — send/return versus insert, and pre-fader versus post-fader — and the automated fade trick that depends on getting both decisions right.',
        estimatedTime: '15–20 minutes',
        outroResourceId: 'reverb-image-explorer',
        examAnchor: {
            question: '(a) A student routes reverb as a channel insert on a panned vocal and loses the mark. Explain why. (b) A separate task asks for a fade where the vocal "walks away into the room". Describe the routing needed and what happens to the dry and wet levels through the fade.',
            modelPoints: [
                'An insert-routed reverb becomes part of the channel it is inserted on, so when the vocal is panned, its reverb pans with it — losing the reverb\'s stereo position, which the 2023 AS Q5(d) mark scheme specifically penalised.',
                'A send/return keeps the reverb on its own return channel, so it holds its own stereo position independently of how the source is panned — the fix for the 2023-style error.',
                'The reverb-fade effect needs a pre-fader send: as the vocal fader is automated down to silence, a pre-fader send keeps feeding the reverb regardless, so the wet signal survives after the dry signal has gone.',
                'Full 2025 A Q5(d) credit requires both halves stated: the dry level falling to silence through the automation, and the wet level remaining constant — a post-fader send would let the wet level fall away with the fader and fail the task.',
            ],
            examTip: 'State both routing decisions separately — send vs insert (stereo position) and pre-fader vs post-fader (what survives a fader automated to silence) — 2023 and 2025 test each one on its own, and confusing the two loses marks in both directions.',
        },
        rows: [
            {
                id: 'send-vs-insert',
                heading: 'Send/Return vs Insert',
                description: 'Send/return is the standard home for reverb: every channel taps a little signal to one shared reverb, so the whole mix seems to stand in the same space, and the reverb holds its stereo position as a source pans. Put reverb on a channel insert instead and it pans with the source — a recurring examiner complaint.',
                animation: 'send-vs-insert-routing',
                assessment: {
                    id: 'send-vs-insert',
                    question: 'A vocal is automated to pan hard left partway through a chorus. Its reverb was set up as a channel insert. What happens to the reverb, and what should have been done instead?',
                    options: [
                        { text: 'The reverb pans hard left along with the vocal, because an insert makes the reverb part of that one channel; routing it as a send/return instead would let the reverb hold its own stereo position independently of the vocal\'s pan', correct: true, feedback: 'Correct — this is the recurring examiner complaint: an insert-routed reverb travels with the channel it sits on, including its pan, which a send/return avoids.' },
                        { text: 'Nothing changes — reverb is not affected by panning regardless of whether it is an insert or a send', correct: false, feedback: 'An insert-routed reverb is part of the channel signal path, so it does pan with whatever the channel does — this is exactly the problem a send/return solves.' },
                        { text: 'The reverb disappears completely, because panning a channel with an insert effect always mutes that effect', correct: false, feedback: 'Panning does not mute an insert effect — it simply moves the whole channel, dry signal and insert effect together, across the stereo field.' },
                    ],
                },
            },
            {
                id: 'pre-post-fader',
                heading: 'Pre-Fader vs Post-Fader',
                description: 'The fader tap point on a send is a separate decision from send versus insert. A post-fader send follows the fader: pull a source down and its reverb falls with it — the usual mix behaviour. A pre-fader send does not: it keeps receiving signal even after the fader reaches silence.',
                animation: 'pre-post-fader-tap',
                assessment: {
                    id: 'pre-post-fader',
                    question: 'A mixer wants a reverb send that keeps producing sound even after the source channel\'s fader is pulled all the way down. Which tap point achieves this?',
                    options: [
                        { text: 'A pre-fader send — it taps the signal before the fader, so it keeps feeding the reverb regardless of where the fader sits, even at silence', correct: true, feedback: 'Correct — tapping before the fader is exactly what lets the send keep working after the channel itself has been pulled to silence.' },
                        { text: 'A post-fader send — it is the standard choice and follows the fader exactly, so pulling the fader to silence also silences the reverb', correct: false, feedback: 'Post-fader does the opposite of what is wanted here — because it follows the fader, it fades away to nothing right along with it.' },
                        { text: 'An insert, because inserts are not affected by the channel fader at all', correct: false, feedback: 'An insert reverb is part of the channel signal path, so pulling the fader down silences everything on that channel, insert included — fader-independence is specifically a send-routing question, not an insert-vs-send one.' },
                    ],
                },
            },
            {
                id: 'reverb-fade-trick',
                heading: 'The Reverb-Fade Trick',
                description: 'Automate a channel\'s fader down to silence while a pre-fader send keeps feeding its reverb, and the dry voice disappears while the wet room remains — the singer seems to walk away into the space. A post-fader send cannot do this: following the fader, its reverb dies at the same moment the dry signal does.',
                animation: 'reverb-fade-automation',
                assessment: {
                    id: 'reverb-fade-trick',
                    question: 'A production task asks for a vocal to "fade away into the room" over four bars: the dry voice disappearing completely while the reverb tail keeps sounding. Which routing makes this possible?',
                    options: [
                        { text: 'A pre-fader send to the reverb, with the channel\'s own fader automated down to silence — the dry signal fades to nothing while the pre-fader send keeps feeding the reverb, so the wet signal survives', correct: true, feedback: 'Correct — this is exactly the pre-fader send trick: the dry path obeys the fader automation, but the send does not, so the reverb outlives the dry signal.' },
                        { text: 'A post-fader send, because post-fader is the standard choice for most mixing situations', correct: false, feedback: 'A post-fader send follows the fader down too, so the reverb would fade out together with the dry signal instead of surviving after it.' },
                        { text: 'An insert reverb with its own separate volume automation, timed to survive after the channel fader reaches silence', correct: false, feedback: 'An insert sits inline in the channel signal path, so once the channel fader reaches silence, no signal reaches the insert at all for it to process — no automation on the insert itself can fix that.' },
                    ],
                },
            },
        ],
    },
];
