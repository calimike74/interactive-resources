// Digital & Analogue Course — single-chapter version (Task 6, learn-rollout-wave3).
// Mapped to Pearson Edexcel Component 4 specification 2.4 Digital and Analogue.
// Sourced exclusively from: lib/topics.js's `digital-analogue` topic
// specSummary block (read-only, not modified or staged here) — "Analogue
// (continuous) vs digital (discrete) signals and their trade-offs", "ADC and
// DAC — the conversion pipeline from mic to DAW to monitors", "Sample rate —
// 44.1/48/96 kHz and what they capture (temporal resolution)", "Nyquist
// theorem — sample rate must be >= 2x the highest frequency", "Bit depth and
// quantisation — resolution, noise floor, quantisation error" — the
// exam-vocabulary skeleton every row is anchored to;
// components/resources/ADCExplorer.jsx (its Sampling tab and Bit Depth tab
// Key Definitions — Sampling, Sample Rate, Nyquist Theorem, ADC, Analogue
// Signal, Digital Signal, Bit Depth, Dynamic Range, DAC — and its Exam
// Formula card: quantisation levels = 2^n, dynamic range ~= bit depth x 6 dB,
// 16-bit = ~96 dB, 24-bit = ~144 dB); components/resources/
// DigitalAudioAssessment.jsx (checked in full — its real question shapes are
// file-size ratio/from-scratch calculations, format ranking, ADC-location-in-
// chain (da-q9), and analogue-tape-feature identification (da-q10, crediting
// hiss, wow, flutter and tape saturation) — used for row 1's analogue-
// degradation content and row 2's ADC-placement framing. The file contains NO
// Nyquist-numeric or bit-depth-dB question of its own: confirmed by direct
// read plus a targeted grep for "alias", "Nyquist", "quantisation", "48",
// "dB" — the only hits are aliasing/quantisation named as MCQ distractor
// labels (da-q10, da-q6), never calculated. The chapter's examAnchor
// therefore borrows the file's numeric-question SHAPE — a scenario, a
// calculation, an answer, working shown, e.g. da-q1/da-q2/da-q11's file-size
// arithmetic — applied to the Nyquist/dB figures the brief's own examAnchor
// gloss names, rather than content actually present in the file. Flagged
// prominently in the task report.); components/resources/
// SignalChainEurorack.jsx (checked — a 14-line iframe wrapper around
// /signal-chain with no prose content of its own, contributes nothing usable
// beyond confirming it is not a source of chain-context prose, the same
// stub-file finding recording.js made about StereoPanning.jsx /
// stereo-recording-essay.js). Row anatomy copies lib/learn/topics/
// distortion.js / midi.js / recording.js exactly: heading, description
// (<=~70 words), animation, optional interactive, assessment.
//
// Anti-duplication (rows 3 fast-enough and 4 deep-enough vs the deployed
// sampling course's rate-depth chapter, lib/learn/topics/sampling.js): that
// chapter's sample-rate-nyquist and bit-depth-staircase rows are the full
// treatment — a worked misconception-correction on rate-vs-loudness and
// bit-depth-vs-brightness, the file-size arithmetic, and (via its own
// aliasing-foldback row) a full explanation of the fold-back mechanism. This
// chapter's rows 3 and 4 are deliberately short and reframed around the
// ADC/DAC pipeline this chapter actually teaches: sample rate as "the ADC's
// clock speed" and the spec's own phrase "temporal resolution" (distinct
// from sampling's "how many measurements" framing, and sampling's row never
// uses that phrase), bit depth as "the ADC's ruler" and the spec's own
// phrase "noise floor" (distinct from sampling's "coarse staircase" framing,
// and sampling's row never uses that phrase either). Neither row here
// re-derives the rate-vs-loudness or bit-depth-vs-brightness misconceptions
// sampling's assessments correct, neither restates the file-size
// consequence, and neither carries a dedicated row on the aliasing mechanism
// itself (this chapter only reuses the aliasing-foldback diagram and states
// the one-line consequence — "it aliases" — deferring the mechanism to
// sampling via row 3's expansion, which names "the Sampling course's From
// Sound to Numbers chapter" explicitly). Definition-level overlap (Nyquist =
// rate >= 2x highest frequency; ~6 dB per bit) is expected and unavoidable —
// both chapters teach the same exam facts — but the teaching, framing and
// depth differ throughout; see the task report for the row-by-row
// side-by-side.
//
// Row 1 (two-worlds) note: the brief's own chapter-map gloss supplies the
// trade-off framing ("warmth/degradation vs perfect copies/editing"), which
// is not a verbatim quote from any named source. It is grounded here in
// DigitalAudioAssessment.jsx's da-q10 (hiss, wow, flutter and tape saturation
// credited as analogue tape features) for the degradation half, and in
// ADCExplorer.jsx's Digital Signal definition (a series of discrete binary
// numbers) for the exact-copy half — "copy and edit perfectly" itself is a
// standard, uncontested extension of that definition (numbers copied exactly
// reproduce the same numbers), not a verbatim source claim. Flagged in the
// task report.
//
// Row 2 (the-round-trip) note: ADC and DAC are both individually named and
// defined in ADCExplorer.jsx's definitions lists, and the pipeline order is
// specSummary's own verbatim wording ("ADC and DAC — the conversion pipeline
// from mic to DAW to monitors"). Neither named source states the two
// converters as an explicit "round trip" or explains why the DAC step is
// necessary (a loudspeaker cone cannot move in response to stored numbers,
// only to a continuously varying voltage) — that reasoning is a standard,
// uncontested extension, developed further in this row's own expansion.
// Flagged in the task report.
//
// Row 4 (deep-enough) note: the interactive is the reused BitDepthSlider,
// referenced exactly as sampling.js's bit-depth-staircase row references it
// (registry key 'bit-depth', zero new code — the component starts its own
// 'ctl-bit-depth' preset internally). Per the task brief, no separate `audio`
// field is attached to this row — sampling's own row additionally carries
// one, which this chapter deliberately omits.

export const DIGITAL_ANALOGUE_CHAPTERS = [
    {
        id: 'conversion',
        chapterNumber: 1,
        title: 'Crossing the Line',
        subtitle: 'Topic 2.4 — Component 4',
        description: 'How sound crosses the line between analogue and digital — continuous voltage against discrete numbers, the ADC/DAC round trip between mic and monitors, and the two numbers, sample rate and bit depth, that set a recording’s frequency range and dynamic range.',
        estimatedTime: '15–20 minutes',
        outroResourceId: 'adc-explorer',
        examAnchor: {
            question: 'A question gives a recording made at 48 kHz, 16-bit, and asks for two figures: the highest frequency it can capture, and its dynamic range in decibels. What should the answer state?',
            modelPoints: [
                'Highest capturable frequency = sample rate ÷ 2 = 48 ÷ 2 = 24 kHz — the Nyquist limit, not the sample rate itself.',
                'Dynamic range ≈ bit depth × 6 dB = 16 × 6 = 96 dB.',
                'The two figures answer two separate questions: sample rate (via Nyquist) sets frequency range, bit depth sets dynamic range — quoting 48 kHz as a dB figure, or 16 bits as a frequency ceiling, mixes up which number does which job.',
                'Showing the working (÷ 2, × 6) is what the mark scheme credits, not just a bare final number — both formulas are simple arithmetic, not memorised constants.',
            ],
            examTip: 'Two formulas carry the whole topic — write them before you write anything else.',
        },
        rows: [
            {
                id: 'two-worlds',
                heading: 'Two Worlds',
                description: "Analogue is a continuously varying electrical signal, its voltage tracking the original sound wave. Digital represents that same sound as a series of discrete numbers, each one an amplitude measurement at one instant. Analogue's continuity is also its cost: every copy through tape or cable can add hiss, wow and flutter. Digital numbers copy and edit perfectly — but need converting at both ends of the chain.",
                animation: 'continuous-vs-discrete',
                assessment: {
                    id: 'two-worlds',
                    question: 'A vinyl transfer is copied from tape to tape three times, and each generation sounds a little worse — more hiss, a little pitch wobble. Why does copying a digital file not cause the same problem?',
                    options: [
                        { text: 'A digital copy duplicates the exact same numbers every time, with no physical medium to degrade; an analogue copy passes a continuously varying voltage back through real tape or cable, and each pass can add its own hiss, wow and flutter', correct: true, feedback: 'Correct — digital storage is just numbers, and copying numbers exactly reproduces the same numbers every time; analogue signal is a physical, continuously varying voltage that degrades a little with each generation it passes through.' },
                        { text: 'Digital audio can never lose any quality under any process, including compression, so the comparison does not apply', correct: false, feedback: 'Digital data can still lose quality — through lossy compression, for example — but a straight digital copy with no compression reproduces the exact same numbers; that is different from analogue’s generation-loss problem, not a claim that digital is immune to everything.' },
                        { text: 'Tape degrades because it is a low bit depth format, the same problem digital recordings have at low bit depth', correct: false, feedback: 'Tape has no bit depth at all — that is a digital-only concept. Tape’s hiss, wow and flutter come from being a continuously varying physical medium, not from any digital rounding process.' },
                    ],
                },
            },
            {
                id: 'the-round-trip',
                heading: 'The Round Trip',
                description: 'Conversion happens twice, in opposite directions. Going in, the ADC (analogue-to-digital converter) samples a microphone’s continuous voltage into the stream of numbers the DAW stores and edits. Going out, the DAC (digital-to-analogue converter) reverses that process, turning stored numbers back into a continuous voltage the monitors can reproduce. Every recording you hear has made this full round trip: mic → ADC → DAW → DAC → monitors.',
                animation: 'adc-dac-pipeline',
                assessment: {
                    id: 'the-round-trip',
                    question: 'A student is asked to place ADC and DAC correctly in a mic-to-monitors signal chain, and to say what each one does. What is the correct order and role split?',
                    options: [
                        { text: 'mic → ADC → DAW → DAC → monitors: the ADC converts the mic’s analogue voltage into digital numbers on the way in, and the DAC converts those numbers back into an analogue voltage on the way out', correct: true, feedback: 'Correct — conversion happens twice, in opposite directions: analogue to digital going in (ADC), digital back to analogue going out (DAC).' },
                        { text: 'mic → DAC → DAW → ADC → monitors, because the signal needs to become analogue before it can be processed digitally', correct: false, feedback: 'This is backwards — the mic’s signal starts analogue and needs the ADC first to become digital numbers the DAW can store; the DAC’s job comes at the very end, turning those numbers back into an analogue signal for the monitors.' },
                        { text: 'ADC and DAC are two names for the same device, so their order in the chain does not matter', correct: false, feedback: 'They are opposite processes: ADC converts analogue to digital, DAC converts digital to analogue. Swapping their positions would leave nothing to convert at either end of the chain.' },
                    ],
                },
            },
            {
                id: 'fast-enough',
                heading: 'Fast Enough',
                description: "Sample rate is the ADC's clock speed — how many measurements it takes every second — setting the digital signal's temporal resolution, not its loudness. The Nyquist theorem sets the floor: rate must be at least twice the highest frequency you want to capture, which is why 44.1 kHz covers the roughly 20 kHz of human hearing. Break that rule and the missing detail doesn't vanish — it aliases.",
                animation: 'aliasing-foldback',
                assessment: {
                    id: 'fast-enough',
                    question: 'A recording is made at 48 kHz. What is the highest frequency it can faithfully capture, and what happens to real content above that frequency?',
                    options: [
                        { text: '24 kHz — half the sample rate, the Nyquist limit; content above that does not just disappear, it aliases, appearing back in the audible range at a false, lower pitch', correct: true, feedback: 'Correct — the Nyquist theorem sets the ceiling at half the sample rate, and content pushed above it aliases rather than vanishing cleanly.' },
                        { text: '48 kHz — the sample rate itself is the highest frequency a recording can capture', correct: false, feedback: 'This is the classic swap the topic flags: the sample rate is not the frequency ceiling itself, only double the ceiling — the true limit is half the sample rate, the Nyquist limit.' },
                        { text: '24 kHz, and any content above that frequency is simply removed from the recording with no audible side effect', correct: false, feedback: 'Content above the Nyquist limit does not vanish quietly — it aliases, folding back into the audible range at a false pitch, which is an audible distortion, not a clean removal.' },
                    ],
                },
            },
            {
                id: 'deep-enough',
                heading: 'Deep Enough',
                description: 'Bit depth is the ADC’s ruler — how many amplitude levels each measurement can round to. Round coarsely and the rounding error itself becomes audible as a noise floor under the wanted signal: quantisation noise. Each extra bit roughly halves that error, adding about 6 dB of dynamic range, so 16 bits gives 6 × 16 ≈ 96 dB — whisper to loud drum, with the floor out of earshot.',
                animation: 'bit-depth-staircase',
                interactive: 'bit-depth',
                assessment: {
                    id: 'deep-enough',
                    question: 'A recording is dropped from 16-bit down to 8-bit, with sample rate unchanged. What happens to its dynamic range, and why?',
                    options: [
                        { text: 'It falls by roughly 48 dB (6 dB per bit × 8 fewer bits) — fewer bits means each measurement is rounded more coarsely, raising the quantisation noise floor and shrinking the usable range between the quietest and loudest sound', correct: true, feedback: 'Correct — bit depth sets dynamic range at roughly 6 dB per bit; losing 8 bits costs roughly 48 dB, a much coarser noise floor.' },
                        { text: 'Nothing changes audibly — bit depth only affects file size, not sound quality', correct: false, feedback: 'Bit depth is not just a file-size setting — it directly sets the amplitude resolution of each measurement, and fewer bits raises the audible quantisation noise floor.' },
                        { text: 'Dynamic range increases, because a smaller file has less data to be corrupted by noise', correct: false, feedback: 'The opposite happens — fewer bits means coarser rounding of each measurement and a higher quantisation noise floor, which shrinks, not grows, the usable dynamic range.' },
                    ],
                },
            },
        ],
    },
];
