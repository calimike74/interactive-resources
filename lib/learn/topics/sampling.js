// Sampling Course — 5-chapter version (Task 10, learn-rollout-wave2).
// Mapped to Pearson Edexcel Component 4 specification 1.4 Sampling.
// Brand-new course: no legacy Learn lesson existed for sampling, so every
// row here is new. Sourced exclusively from
// _sandbox/sampling-reference/src/content/learn.tsx (prose, recap, staff.mark/
// staff.watch), teach.ts (lesson sequence, exam anchors, command words, model
// answer) and microcopy.ts (readout/zone wording only). Row anatomy copies
// lib/learn/topics/reverb.js exactly: heading, description (<=~70 words),
// animation, optional audio/interactive, assessment. Every audio field is the
// standard single-preset `{preset, label}` shape (matches AudioBlock/
// LearnSpineLayout exactly, no invented fields) — audio placements follow the
// wave-2 amendment: one preset per row, on the row the amended chapter map
// names, not the two-preset-per-row shape the map's prose originally implied.
// Mark-scheme fidelity is the special stake of this topic: several exam
// anchors and assessment distractors turn on a single credited/refused word
// (e.g. "velocity layering" credited, bare "velocity" refused; the
// assignment-settings list crediting volume/key/zone/root/start-end/one-shot/
// direction/pan and explicitly NOT envelope/filter/LFO) — those distinctions
// are kept byte-exact to the reference's own wording throughout.

export const SAMPLING_CHAPTERS = [
    {
        id: 'the-sampler',
        chapterNumber: 1,
        title: 'A Recording You Can Play',
        subtitle: 'Topic 1.4 — Component 4',
        description: 'What a sampler actually is — a device that records, stores and plays back sound — and the four playback decisions every sampled sound has to answer, from the two-mark exam definition through to why a sampled drum kit beats a live one.',
        estimatedTime: '20–25 minutes',
        examAnchor: {
            question: 'A student asked to define a sample writes "a sample is a sound", then lists one advantage of sampling a drum kit instead of recording one live. How many marks does the exam credit here, and what is the mark scheme actually looking for?',
            modelPoints: [
                'A sample is credited as two separate halves: a digital recording (1 mark) that can be triggered using a MIDI keyboard (1 mark) — both halves are needed for full credit, and "a sample is a sound" earns nothing on its own.',
                'The advantages bank for sampling a drum kit instead of recording one live: no microphones, drums or drummers needed, no spill between mics, timing can be quantised, tempo can be changed, samples can be retuned and rebalanced per hit, every hit carries an identical timbre, and rhythms impossible for a human to play become available.',
                'The 2018 examiner noted that few candidates reached the producing-style answers — rhythms too complex to play and per-hit timbre control — worth naming explicitly rather than stopping at the obvious "no spill" point.',
                'A sampler is not a self-contained instrument the way a synthesiser is: without note messages arriving it does nothing, which is exactly why the "triggered using a MIDI keyboard" half of the definition carries its own mark.',
            ],
            examTip: 'State both halves of the definition by name — "digital recording" and "MIDI keyboard" — and reach beyond the obvious "no spill" advantage into the producing-style points (impossible rhythms, per-hit timbre control) the 2018 report flagged as under-reached.',
        },
        rows: [
            {
                id: 'two-mark-definition',
                heading: 'The Two-Mark Definition',
                description: "The exam's own definition of a sample is two marks long: a digital recording that can be triggered using a MIDI keyboard. Both halves earn a mark — without note messages arriving, a sampler does nothing, unlike a self-contained synthesiser. ‘A sample is a sound’ earns nothing on its own: the recording and the triggering are both required for credit.",
                animation: 'sampler-record-store-trigger',
                assessment: {
                    id: 'two-mark-definition',
                    question: 'A student asked to define a sample writes: "a sample is a sound." What does the mark scheme actually require, and how many marks is the full definition worth?',
                    options: [
                        { text: "Two marks: a digital recording (1) that can be triggered using a MIDI keyboard (1) — both halves are needed, and ‘a sound’ alone earns nothing", correct: true, feedback: "Correct — this is the exact two-mark definition; a recording alone or a trigger alone is not enough, both halves must be stated." },
                        { text: "One mark: ‘a sound’, because that is what the listener actually hears when the sample plays", correct: false, feedback: "‘A sound’ is explicitly refused by the mark scheme — the definition needs both that it is a recording and that it is triggered, not a description of what is heard." },
                        { text: "Two marks: that it is generated by an oscillator, and that it responds to a key being pressed — the same definition as a synthesiser voice", correct: false, feedback: "A sample is not generated by an oscillator — it is a stored recording. Confusing the sampler with the synthesiser is a common error: both share the same MIDI plumbing, but the sampler's sound originates in a recording, not synthesis." },
                    ],
                },
            },
            {
                id: 'sampler-lineage',
                heading: 'The Lineage',
                description: "The idea predates digital audio. The Mellotron of 1963 held a magnetic tape strip under every key; the Fairlight CMI of 1979, the first commercial digital sampler, was eight-bit and offered barely a second of sampling; the Akai S1000 reached CD quality within a decade; the MPC put slicing and pads in a generation's hands. Your DAW's Sampler and Simpler are direct descendants.",
                animation: 'sampler-lineage',
                assessment: {
                    id: 'sampler-lineage',
                    question: 'Put these instruments in the correct historical order, earliest to most recent: Akai S1000, MPC, Mellotron, Fairlight CMI.',
                    options: [
                        { text: 'Mellotron (1963, tape strips) → Fairlight CMI (1979, eight-bit digital) → Akai S1000 (CD quality) → MPC (slicing and pads)', correct: true, feedback: 'Correct — this is the lineage the course traces, from tape through the first commercial digital sampler to CD-quality sampling and the pad-based workflow.' },
                        { text: 'Fairlight CMI → Mellotron → MPC → Akai S1000, because tape technology came after early digital samplers', correct: false, feedback: "Backwards — the Mellotron's tape strips (1963) predate the Fairlight CMI (1979), which is credited as the first commercial digital sampler, not the other way round." },
                        { text: 'All four instruments arrived within the same few years in the early 1980s, as part of one wave of sampling technology', correct: false, feedback: "The lineage spans two decades, not a single wave — from the Mellotron's 1963 tape mechanism through to the Akai S1000 and MPC roughly two decades later." },
                    ],
                },
            },
            {
                id: 'why-sample-drums',
                heading: 'Why Sample a Drum Kit',
                description: 'Sample a drum kit instead of recording one and the mark scheme keeps a list: no microphones or spill, timing quantised, tempo changed, samples retuned per hit, identical timbre, rhythms impossible to play. One legal decision travels with the musical ones: a sample from a commercial recording needs clearance before release.',
                animation: 'why-sample-drums',
                assessment: {
                    id: 'why-sample-drums',
                    question: "Asked for the advantages of sampling a drum kit instead of recording one live, a student answers only ‘no spill between mics.’ What is the mark scheme actually looking for?",
                    options: [
                        { text: 'A wider bank: no microphones, drums or drummers needed, no spill, timing can be quantised, tempo changed, samples retuned and rebalanced per hit, an identical timbre every hit, and rhythms sequenced that no human could play', correct: true, feedback: 'Correct — the 2018 examiner specifically noted that few candidates reached beyond the obvious spill/mic points into the producing-style answers: impossible rhythms and per-hit timbre control.' },
                        { text: 'Just one point: sampling removes all copyright restrictions on using a commercial drum recording', correct: false, feedback: 'Sampling does not remove copyright — a sample taken from a commercial recording still needs clearance from the rights holders before release, because no compulsory licence exists for sound recordings.' },
                        { text: "Sampled drums always sound more ‘real’ than a live recording, because the sampler adds natural room ambience automatically", correct: false, feedback: 'The advantages bank is about control (quantising, retuning, per-hit processing, impossible rhythms), not a claim that sampled drums sound more realistic — a sampler adds no ambience on its own.' },
                    ],
                },
            },
            {
                id: 'one-shot-gated-loop',
                heading: 'One-Shot, Gated, Loop',
                description: 'Playback answers the key in three different ways. One-shot plays the whole recording however briefly you tap, ignoring key-up entirely. Gated stops the instant the key lifts, so the sample only sounds while held. A loop region cycles round and round instead, sustaining a held note for as long as the key stays down.',
                animation: 'playback-modes',
                assessment: {
                    id: 'one-shot-gated-loop',
                    question: 'A drum hit must play in full however briefly the pad is tapped, with no sustain trick needed. Which playback mode, and why?',
                    options: [
                        { text: 'One-shot — it ignores key-up entirely and plays the whole recording to its end regardless of how the note behaves', correct: true, feedback: "Correct — one-shot's whole point is that the note's length makes no difference; the recording always plays out in full once triggered." },
                        { text: 'Gated — it plays for exactly as long as the pad is held, so a brief tap gives a brief sound', correct: false, feedback: "That is gated's own defined behaviour (stopping at key-up), the opposite of what is wanted here — a mode that plays in full ‘however briefly tapped’ is one-shot, not gated." },
                        { text: 'Loop — a region cycles round and round to sustain the sound for as long as needed', correct: false, feedback: 'Loop is for sustaining a held note by cycling a region — it is the wrong tool for a hit that should simply play once in full regardless of tap length, which is exactly what one-shot does.' },
                    ],
                },
            },
        ],
    },
    {
        id: 'rate-depth',
        chapterNumber: 2,
        title: 'From Sound to Numbers',
        subtitle: 'Topic 1.4 — Component 4',
        description: "The two numbers that set every recording's quality: sample rate (frequency range, capped by Nyquist) and bit depth (dynamic range, capped by quantisation noise) — and what happens when either one is pushed too far.",
        estimatedTime: '15–20 minutes',
        examAnchor: {
            question: 'A student claims that raising the sample rate from 44.1 kHz to 96 kHz will make a recording sound louder, and that content recorded above the sample rate simply disappears. What should the correct answer state instead?',
            modelPoints: [
                'The sample rate must be at least twice the highest frequency being captured — the Nyquist limit — so raising the rate widens the frequency range a recording can capture, it does not raise its loudness.',
                'Push content above half the sample rate and it does not vanish: it folds back into the audible range at a false pitch, the distortion named aliasing.',
                'Aliasing is specifically distortion caused by an insufficient sample rate, not a symptom of low bit depth — the two figures set two separate, independent qualities of a recording.',
                '2018 AS Q1(a)(iii) credits "sample rate" by name as one of the settings assignable to a sampler.',
            ],
            examTip: 'Give the Nyquist relationship as "at least twice the highest frequency", not a vague "high enough" — and keep aliasing tied to rate, never to bit depth, when the exam asks you to identify the cause of a specific distortion.',
        },
        rows: [
            {
                id: 'sample-rate-nyquist',
                heading: 'Sample Rate & Nyquist',
                description: 'Digital recording measures a waveform thousands of times a second; the sample rate is how many measurements it takes, 44.1 kHz for CD quality, 48 kHz the production standard. A recording can only capture frequencies up to half its sample rate — the Nyquist limit — so a higher rate buys a wider frequency range, not more level.',
                animation: 'sample-rate-grid',
                audio: { preset: 'smp-full-depth', label: 'Play to hear the tone at full rate and full depth — the clean reference the crushed staircase later compares against.' },
                assessment: {
                    id: 'sample-rate-nyquist',
                    question: 'A student claims that raising the sample rate from 44.1 kHz to 96 kHz will make a recording sound louder. What does raising the sample rate actually buy?',
                    options: [
                        { text: 'Frequency range, not loudness — a recording can only capture frequencies up to half its sample rate, so a higher rate raises that ceiling rather than increasing level', correct: true, feedback: 'Correct — sample rate sets how high in frequency a recording can capture (the Nyquist limit), a completely separate quality from loudness.' },
                        { text: 'Loudness — a higher sample rate directly increases the maximum level a recording can reach', correct: false, feedback: 'This is the classic swap the course specifically flags: sample rate governs frequency range, not loudness or level — loudness and dynamic range are set by bit depth, not sample rate.' },
                        { text: 'Nothing audible below 20 kHz, since sample rate only affects ultrasonic content no listener can hear', correct: false, feedback: 'Sample rate sets the Nyquist limit for the whole audible range, not just ultrasonic content — 44.1 kHz only just clears 20 kHz (the top of hearing) with headroom, which is exactly why CD-quality audio uses that rate.' },
                    ],
                },
            },
            {
                id: 'aliasing-foldback',
                heading: 'Aliasing: The Fold-Back',
                description: 'Push content above the Nyquist limit and it does not disappear politely: it folds back into the audible range at a false pitch, the distortion called aliasing. Aliasing is caused specifically by too low a sample rate, not by too few bits — rate and depth set two separate qualities of a recording.',
                animation: 'aliasing-foldback',
                assessment: {
                    id: 'aliasing-foldback',
                    question: 'A signal contains content above half the sample rate being used to record it. What happens to that content, and why?',
                    options: [
                        { text: 'It folds back into the audible range at a false pitch — aliasing — because it does not simply disappear once it crosses the Nyquist limit', correct: true, feedback: 'Correct — this is exactly what aliasing is: content above the Nyquist limit is misrepresented as a lower, false frequency rather than being cleanly removed.' },
                        { text: 'It is simply not recorded at all, leaving a gap in the frequency content with no audible side effect', correct: false, feedback: 'Content above the limit does not vanish quietly — it folds back into the audible range at a false pitch, which is exactly the audible distortion called aliasing.' },
                        { text: 'It causes quantisation noise, the same staircase effect produced by too few bits', correct: false, feedback: 'Quantisation noise is a bit-depth problem, from too few amplitude levels — aliasing is a completely separate distortion, caused specifically by too low a sample rate, not too few bits.' },
                    ],
                },
            },
            {
                id: 'bit-depth-staircase',
                heading: 'Bit Depth & the Staircase',
                description: "Bit depth is the resolution of each measurement: how many amplitude levels are available. Sixteen bits give roughly 96 dB of dynamic range, about 6 dB per bit. Too few bits force the wave onto a coarse staircase, heard as quantisation noise — a vertical limit, not a horizontal one. Together, rate and depth also set a recording's file size.",
                animation: 'bit-depth-staircase',
                interactive: 'bit-depth',
                audio: { preset: 'smp-crushed', label: 'Play to hear the same tone quantised to roughly 4 bits — a coarse staircase, audible as gritty quantisation noise.' },
                assessment: {
                    id: 'bit-depth-staircase',
                    question: 'A student says a recording with more bits sounds brighter. What does bit depth actually control?',
                    options: [
                        { text: 'Dynamic range — roughly 6 dB of range per bit, so 16-bit gives around 96 dB; too few bits force the wave onto a coarse staircase, heard as quantisation noise', correct: true, feedback: 'Correct — bit depth is the vertical, amplitude-resolution axis: more bits means more available levels and a lower noise floor, not a brighter tone.' },
                        { text: 'Brightness — more bits directly add high-frequency content to a recording', correct: false, feedback: 'This is the classic swap the course flags: bit depth is vertical (amplitude resolution), not horizontal (frequency range) — brightness and frequency range are sample rate’s job, not bit depth’s.' },
                        { text: 'Frequency range — a higher bit depth lets a recording capture higher frequencies, the same job as sample rate', correct: false, feedback: 'Bit depth and sample rate are two independent axes: rate is horizontal (frequency range, via Nyquist), depth is vertical (dynamic range and noise floor) — they do not do the same job.' },
                    ],
                },
            },
        ],
    },
    {
        id: 'the-edit',
        chapterNumber: 3,
        title: 'The Edit: Where the Marks Live',
        subtitle: 'Topic 1.4 — Component 4',
        description: 'Why every practical sampling task comes down to editing discipline: clicks, zero crossings, truncation and crossfades, and the creative stutter technique built on the same skill.',
        estimatedTime: '15–20 minutes',
        examAnchor: {
            question: 'A practical task asks a student to isolate a vocal phrase and then recreate a rhythmic stutter from one word, three repetitions, in time. Which separate marks does the mark scheme award for each half of the task?',
            modelPoints: [
                '2019 A Q4(d) credits the sample starting truncated correctly (1 mark) and playback free of clicks or intrusive pitch bending (1 mark) as two separate marks.',
                '2022 AS Q3(b) credits the stutter in three separate parts: the word correctly copied (1), correct timing with no glitches (1), and three repetitions (1).',
                'A click is the audible result of an instantaneous jump in the waveform; cutting exactly on a zero crossing — where the wave crosses the centre line — removes the jump rather than merely hiding it.',
                '2019 A Q1(e) rewards copying, pasting and crossfading to avoid clicks, and the examiner noted very few candidates actually removed every click from their edit.',
            ],
            examTip: 'Treat truncation and click-freedom as two separate marks, not one — and remember a crossfade is the fix when a zero crossing genuinely is not available, not a substitute for finding one.',
        },
        rows: [
            {
                id: 'clicks-zero-crossings',
                heading: 'Clicks & Zero Crossings',
                description: 'A click is what a cut mid-wave sounds like: the loudspeaker jumps instantly from a value to silence, and that jump plays back as a tick. Cut instead at a zero crossing, where the wave crosses the centre line, and there is no jump to hear. Digidesign’s founders once found these by reading hex numbers, with no waveform display at all.',
                animation: 'zero-crossing-cut',
                audio: { preset: 'smp-loop-click', label: 'Play to hear a loop point sitting off a zero crossing — the phase jump ticks audibly on every repeat.' },
                assessment: {
                    id: 'clicks-zero-crossings',
                    question: 'A student cuts a sample mid-waveform and hears an audible tick on every playback. What causes the click, and what is the cure?',
                    options: [
                        { text: 'The cut forces an instantaneous jump from a value to silence, which plays back as a tick; cutting at a zero crossing, where the wave crosses the centre line, removes the jump entirely', correct: true, feedback: 'Correct — the cure is geometric, not a matter of luck: a cut placed exactly where the waveform is already at zero produces no discontinuity to hear.' },
                        { text: 'The sample was recorded too loudly, and turning down the level before the cut removes the click', correct: false, feedback: 'Loudness is not the cause — the click comes from an instantaneous jump in the waveform’s value at the cut point, which a zero-crossing cut removes regardless of level.' },
                        { text: 'Clicks are unavoidable on any digital edit and can only be reduced, never fully removed', correct: false, feedback: 'A cut placed precisely at a zero crossing removes the click entirely, because there is no jump left to hear — it is not a matter of merely reducing an unavoidable artefact.' },
                    ],
                },
            },
            {
                id: 'truncate-crossfade',
                heading: 'Truncate & Crossfade',
                description: 'Truncating trims the dead air before and after the wanted sound, so the sample starts the instant it is triggered. Where a zero crossing is not available, a short fade or crossfade spreads the unavoidable jump over a few milliseconds instead, until it vanishes — two different jobs solving two different problems.',
                animation: 'truncate-and-fade',
                assessment: {
                    id: 'truncate-crossfade',
                    question: 'A student truncates the dead air from the start of a sample, but a faint click still survives at the very edit point. What is missing?',
                    options: [
                        { text: 'A fade or crossfade at the edit point — where a zero crossing is not available, spreading the jump over a few milliseconds makes it inaudible, a separate job from truncating the silence itself', correct: true, feedback: 'Correct — truncating removes dead air so the sample triggers instantly; a fade or crossfade is the separate tool for smoothing an edit point that cannot land on a clean zero crossing.' },
                        { text: 'Nothing — truncating a sample’s silence automatically removes any clicks at its edit points as well', correct: false, feedback: 'Truncating and click removal are two different jobs — trimming dead air says nothing about whether the remaining edit point itself lands on a clean, jump-free cut.' },
                        { text: 'A longer truncation, cutting further into the wanted sound until the click disappears', correct: false, feedback: 'Cutting further into the wanted sound risks losing the sample’s actual attack — the fix for a click at an edit point is a fade or crossfade, not simply trimming more material away.' },
                    ],
                },
            },
            {
                id: 'loop-points-stutter',
                heading: 'Loop Points & the Stutter',
                description: 'Loop points obey the same discipline as any other cut: the end of the region must meet its start without a step, so both sit on zero crossings, and crossfade looping blends the join for sustained material that never sits still. Editing is creative too — copy one word and paste it in rhythm and you have a stutter.',
                animation: 'loop-point-join',
                audio: { preset: 'smp-loop-clean', label: 'Play to hear the same loop with its point fixed on a zero crossing — the join now silent.' },
                assessment: {
                    id: 'loop-points-stutter',
                    question: 'A held pad sound is looped, but a step is audible every time the loop wraps round. What is the fix, and what different technique produces a rhythmic ‘stutter’?',
                    options: [
                        { text: 'Loop points must sit on zero crossings so the end meets the start without a step; crossfade looping blends the join for sustained material. A stutter is different — copying one word and pasting it in rhythm', correct: true, feedback: 'Correct — the loop-click fix (zero crossings, or a crossfaded join for material that never sits still) is a separate skill from the stutter, which is a creative copy-paste-in-rhythm technique.' },
                        { text: 'Crossfade looping is only useful for percussive one-shot hits, never for sustained pad material', correct: false, feedback: 'The reverse is true — crossfade looping specifically blends the join for sustained material that never sits still, which is exactly the case where a hard loop-point step is most audible.' },
                        { text: 'A stutter is produced by looping the whole phrase faster and faster until the words blur together', correct: false, feedback: 'A stutter is built by copying one specific word and pasting it in rhythm, three repetitions with correct timing and no glitches — not by speeding up a loop of the whole phrase.' },
                    ],
                },
            },
        ],
    },
    {
        id: 'the-map',
        chapterNumber: 4,
        title: 'One Sample Across a Keyboard',
        subtitle: 'Topic 1.4 — Component 4',
        description: 'Why one sample can play every key in tune only if its root note is set correctly, and the multisampling and velocity-layering techniques that keep large transpositions from sounding artificial.',
        estimatedTime: '15–20 minutes',
        examAnchor: {
            question: 'A 2019 AS question asks candidates to explain how a single sampled instrument is made playable in tune across a full keyboard. Point by point, which statements does the mark scheme credit?',
            modelPoints: [
                'The 2019 AS Q4(d) pitch-mapping mark scheme credits: sampling the instrument at different pitches, assigning each recording to a key or zone, and setting the root note — the key at which a recording plays back exactly as it was recorded.',
                'Also creditable: sampling at small intervals so the transposition needed to cover a range stays small, the fact that large transpositions sound unnatural (because changing speed changes pitch at the same time), and using single-note samples rather than phrases.',
                "The exam's assignment-settings question wants the assignment list itself: volume, key and zone, root note, start and end points, one-shot or loop, direction, pan. Envelope, filter and LFO settings are explicitly not credited, because those are synthesis controls applied after the mapping, not the mapping itself.",
                'Precision matters on velocity: the 2018 examiner credited the phrase "velocity layering" but refused the bare word "velocity" on its own.',
            ],
            examTip: 'List the 2019 AS Q4(d) points individually rather than compressing them into one sentence — each is its own mark — and always say "velocity layering" in full, never the bare word alone. If asked what needs setting on assignment, give the list itself (volume, key/zone, root, start/end, one-shot, direction, pan), not synthesis controls like filter or envelope.',
        },
        rows: [
            {
                id: 'root-note',
                heading: 'The Root Note',
                description: 'Load one note and the sampler can play every key, because it transposes by changing playback speed: each semitone up plays the recording faster, each down slower. For that arithmetic to land correctly, it must know the root note — the key at which the sample plays back exactly as recorded. Get it wrong and every note transposes by the wrong interval.',
                animation: 'root-note-map',
                assessment: {
                    id: 'root-note',
                    question: 'A G3 vocal sample is loaded into a sampler, but the root note is left at its C3 default. What happens when the part is played?',
                    options: [
                        { text: 'Every key is transposed by the wrong interval, because the sampler assumes the recording was made at C3 — the whole part plays out of tune, commonly an octave out', correct: true, feedback: 'Correct — this is exactly the error the 2022 scratch-vocal task punished: leaving the root at its default rather than setting it to match the sample’s actual recorded pitch.' },
                        { text: 'Nothing changes — the root note only affects volume, not pitch, so playback stays in tune regardless', correct: false, feedback: 'The root note is specifically the pitch reference the sampler transposes from — leaving it wrong transposes every key by the wrong interval, it is not a volume control.' },
                        { text: 'The sample simply refuses to play on any key other than G3 until the root is corrected', correct: false, feedback: 'A wrong root does not block playback — every key still plays the sample, just transposed by the wrong interval, which is precisely why the error is so easy to miss by eye and only caught by ear.' },
                    ],
                },
            },
            {
                id: 'speed-pitch-timbre',
                heading: 'Speed, Pitch & Timbre',
                description: 'Speed and pitch move together in a sampler, so distance from the root costs character. A voice a few semitones out still sounds like itself; an octave away it turns chipmunk or slow motion, because the timbre shifts along with the tempo. Large transpositions sounding unnatural is not a footnote — it is its own creditable mark-scheme point.',
                animation: 'speed-pitch-link',
                interactive: 'repitch',
                assessment: {
                    id: 'speed-pitch-timbre',
                    question: 'A vocal sample is played several octaves from its root note and starts to sound like a cartoon chipmunk. Why, and is this itself a creditable exam point?',
                    options: [
                        { text: 'Speed and pitch move together in a sampler, so a large transposition drags the timbre along with the tempo; the mark scheme specifically credits recognising that large transpositions sound unnatural', correct: true, feedback: 'Correct — this is a genuine mark-scheme point, not just an aesthetic observation: naming why large transpositions sound unnatural (speed and pitch coupled together) is creditable in its own right.' },
                        { text: 'It only happens with vocal samples — instrumental samples keep their character at any transposition distance', correct: false, feedback: 'The effect applies to any sample, not just vocals — speed and pitch move together for every recording played through a sampler, which is exactly why multisampling exists to keep transpositions small.' },
                        { text: 'The chipmunk effect is a bug in cheaper samplers and does not happen on professional hardware or software', correct: false, feedback: 'This is not a bug — it is how sample playback transposition fundamentally works: changing speed always changes pitch and timbre together, on any sampler, which is why the fix is multisampling, not better hardware.' },
                    ],
                },
            },
            {
                id: 'multisampling-zones',
                heading: 'Multisampling & Velocity Layers',
                description: 'The professional cure for that drift is multisampling: record the instrument at several pitches, assign each to a key zone, so no note transposes far. The same logic stacks vertically as velocity layers — soft and hard recordings switched by how firmly the key is struck; the credited term is velocity layering, not the bare word velocity. Assigning a sample also means setting its wider list of playback settings.',
                animation: 'key-zones-velocity-layers',
                assessment: {
                    id: 'multisampling-zones',
                    question: "Asked what settings need to be made when a sample is assigned to a sampler, a student answers ‘filter cutoff and envelope release.’ What does the mark scheme actually want, and what is wrong with this answer?",
                    options: [
                        { text: 'The assignment list — volume, key and zone, root note, start and end points, one-shot or loop, direction, pan. Filter and envelope are synthesis controls applied after the mapping, explicitly not credited here', correct: true, feedback: 'Correct — the 2018 examiner specifically noted candidates offering synthesis settings (filter, envelope) or sequencing settings (tempo, BPM) where the assignment list itself was wanted.' },
                        { text: 'The answer is correct as given — filter cutoff and envelope release are exactly the settings a mark scheme rewards for assignment', correct: false, feedback: 'Filter and envelope are explicitly not credited for this question — they are synthesis controls applied after the sample is mapped, not part of the assignment itself (volume, key/zone, root, start/end, one-shot, direction, pan).' },
                        { text: "Bare ‘velocity’, because velocity is the single most important assignment setting for a multisampled instrument", correct: false, feedback: "The bare word ‘velocity’ on its own earns nothing — the credited phrase is ‘velocity layering’, naming the specific technique of switching between soft and hard recordings by how firmly the key is struck." },
                    ],
                },
            },
        ],
    },
    {
        id: 'transforms',
        chapterNumber: 5,
        title: 'Pitch Against Time',
        subtitle: 'Topic 1.4 — Component 4',
        description: 'The four transforms that reshape a sample against time — repitch, stretch, shift and reverse — and how DJs and producers turned editing decisions like chopping and layering into a musical culture.',
        estimatedTime: '15–20 minutes',
        outroResourceId: 'sampling-playground',
        examAnchor: {
            question: 'A listening question plays a phrase that has been slowed from 85 BPM to 75 BPM with its pitch unchanged, then a bar containing a cymbal that swells rather than strikes. Name the two processes used and justify each identification.',
            modelPoints: [
                'Tempo reduced from 85 to 75 BPM with the pitch unchanged is time-stretching — the transform that changes duration while holding pitch, distinct from repitching, which would have dropped the pitch as well.',
                "2022 A Q4(c)(ii)'s examiner report calls this an easy mark given the distractors offered, because time-stretch is the only transform in the option list that leaves pitch untouched.",
                'A decay that swells rather than strikes, growing into its own downbeat, identifies reversal: playing the recording backwards turns every decay into a swell — the cymbal in bar 13 of the 2020 A Q1(a) listening extract is reversed for exactly this reason.',
                'Forward and reverse playback direction is itself a creditable assignable setting (2018 AS Q1(a)(iii)), separate from the transform question of what happens to pitch and duration.',
            ],
            examTip: 'Keep the four transforms strictly separate when identifying by ear: only reversal changes the shape of the envelope itself (decay becomes swell); repitch, stretch and shift all keep the original envelope shape but disagree on what happens to pitch versus duration.',
        },
        rows: [
            {
                id: 'repitch-stretch-shift',
                heading: 'Repitch, Stretch, Shift',
                description: "Three transforms sit on one axis. Repitching moves speed, pitch and duration together — the sampler's native transposition. Time-stretching breaks the link one way: duration changes, pitch holds. Pitch-shifting breaks it the other way: pitch changes, duration holds. Push either far enough, or choose the wrong warp mode for the material, and smearing artefacts appear.",
                animation: 'pitch-time-matrix',
                audio: { preset: 'smp-forward', label: 'Play to hear a struck tone looped forward — sharp attack, decay, then silence before the next hit.' },
                assessment: {
                    id: 'repitch-stretch-shift',
                    question: 'A student is asked to explain the difference between time-stretching and pitch-shifting and writes that they are ‘basically the same process.’ What is wrong with this answer?',
                    options: [
                        { text: 'They are opposites in what they hold fixed: time-stretching changes duration while pitch holds, pitch-shifting changes pitch while duration holds — confusing the two, or treating them as identical, is a documented misconception', correct: true, feedback: 'Correct — the course specifically flags this documented confusion; the two transforms deliberately break the pitch/duration link in opposite directions.' },
                        { text: 'Nothing is wrong — both processes change pitch and duration together in the same way repitching does', correct: false, feedback: 'Repitching is the one that changes pitch and duration together; time-stretch and pitch-shift each deliberately hold one of those two fixed while changing the other, which is exactly what makes them distinct from repitching and from each other.' },
                        { text: 'Time-stretching changes pitch and pitch-shifting changes duration — the answer just has the two names swapped round', correct: false, feedback: 'This is backwards: time-stretching changes duration while holding pitch, and pitch-shifting changes pitch while holding duration — swapping the names does not fix the underlying confusion between what each transform holds fixed.' },
                    ],
                },
            },
            {
                id: 'reverse-swell',
                heading: 'Reverse: Decay Becomes Swell',
                description: 'Reversing is the simplest transform: play the recording backwards and every decay becomes a swell, growing into its own attack instead of striking and dying away. That is why a reversed cymbal is the classic build into a downbeat — and why a listening question can ask you to identify one by ear, in a specific bar of a recording.',
                animation: 'reverse-envelope',
                audio: { preset: 'smp-reversed', label: 'Play to hear the exact same samples reversed — the decay becomes a swell that grows into a sudden stop.' },
                assessment: {
                    id: 'reverse-swell',
                    question: "A student hears a build-up before a downbeat and describes it as ‘reverse reverb.’ What has actually been done to the sample?",
                    options: [
                        { text: 'The sample itself has been reversed — played backwards, so its decay becomes a swell that grows toward its own attack, the classic build into a downbeat', correct: true, feedback: "Correct — ‘reverse reverb’ is a documented misconception the course specifically warns against; what is actually reversed here is the sample's own envelope, not a reverb tail." },
                        { text: 'A reverb has been applied and then reversed on its own, leaving the dry sample untouched', correct: false, feedback: "This is exactly the ‘reverse reverb’ confusion the course flags — the sample itself is reversed, turning its own decay into a swell; no separate reverb processing is needed to create this effect." },
                        { text: 'The sample has been time-stretched to a much slower tempo, which is heard as a gradual swell', correct: false, feedback: 'Time-stretching changes duration while holding pitch — it does not turn a decay into a swell. A swell that grows into its own attack is the signature of reversal, not stretching.' },
                    ],
                },
            },
            {
                id: 'chop-layer-culture',
                heading: 'Chop, Layer & the Break Culture',
                description: "DJs in the Bronx extended drum breaks by playing two copies of the same record; samplers absorbed the technique on breaks like the Winstons' Amen break, chopping hits and resequencing patterns its drummer never played. Chopping earns its place technically too — slice a break to pads and each hit gains its own timing, tuning and processing. Layering stacks a punchy kick under a sub-heavy one.",
                animation: 'chop-resequence',
                assessment: {
                    id: 'chop-layer-culture',
                    question: 'A four-bar drum break is chopped into individual hits and resequenced into a pattern its original drummer never played. What technical advantage does chopping give, beyond the creative reordering?',
                    options: [
                        { text: 'Each hit gains its own timing, tuning and processing once separated onto individual pads — the same per-hit control that makes sampling a drum kit advantageous in the first place', correct: true, feedback: 'Correct — chopping is not just creative reordering, it is a technical move that unlocks per-hit control over timing, tuning and processing, the exact advantage sampling offers over a fixed recording.' },
                        { text: 'Chopping only changes the order of the hits — every hit still shares identical timing, tuning and processing with every other', correct: false, feedback: 'The opposite is true — once a break is chopped onto individual pads, each hit can be timed, tuned and processed completely independently, which is exactly the technical payoff of chopping.' },
                        { text: 'The technique originated with a single copy of a record played at double speed, rather than two copies played together', correct: false, feedback: "The Bronx DJs' technique used two copies of the same record to extend a break, not one copy played faster — sampling technology later absorbed and extended that two-copy idea into chopping." },
                    ],
                },
            },
        ],
    },
];
