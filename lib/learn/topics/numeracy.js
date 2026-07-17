// Numeracy Course — single-chapter version (Task 7, learn-rollout-wave3).
// Mapped to Pearson Edexcel Component 4 specification 2.5 Numeracy.
// Sourced exclusively from: lib/topics.js's `numeracy` topic specSummary
// block (read-only, not modified or staged here) — "Frequency & pitch — A4 =
// 440 Hz, octave doubling, harmonic series, cents", "Decibels — logarithmic
// scale, voltage/power/SPL, dynamic range", "Sample rate, bit depth and file
// size calculations", "BPM ↔ milliseconds for tempo-synced delay times" — the
// exam-vocabulary skeleton every row is anchored to;
// components/resources/OctavePeriodTrainer.jsx (Period = 1/Frequency,
// Frequency = 1/Period, octave up = frequency ×2 = period ÷2, octave down =
// frequency ÷2 = period ×2 — its own worked Quick Reference table); this
// chapter's outro resource;
// components/resources/WaveformDrawingAssessment.jsx (checked in full — its
// own question bank supplied the two cleanest worked numbers in row 1: wd-q4
// "An A note at 440 Hz is transposed one octave up" -> 880 Hz = 440 × 2, and
// wd-q8 "What is the period of a 1 kHz tone?" whose own explanation states
// verbatim "Useful shortcut to memorise: 1 kHz ↔ 1 ms" — used as row 1's
// expansion trigger, quoted exactly);
// components/resources/BPMDelayCalculator.jsx (checked in full — its own
// Theory-drawer text states the formula verbatim, "DELAY (ms) = 60,000 ÷ BPM
// × NOTE", and its NOTE_VALUES table gives the multipliers used in row 3:
// dotted = base note × 1.5, eighth-triplet = quarter ÷ 3 (i.e. an eighth ×
// ⅔) — the same ×1.5 / ×⅔ pattern the chapter map names);
// components/resources/LevelsMeteringAssessment.jsx (checked in full — lm-q1
// "the dB scale is logarithmic", lm-q2 "+6 dB always doubles voltage" (so −6
// dB halves it), lm-q6 "0 dBFS" as the digital ceiling — used for row 2);
// components/resources/DigitalAudioAssessment.jsx (checked in full — its own
// file-size question bank is the source for row 4: da-q1 "10 MB mono ->
// stereo" = ×2 = 20 MB, da-q2 "stereo, 88.2 kHz, 24-bit" = ×2 channels × ×2
// rate × ×1.5 depth = ×6 = 60 MB, da-q11 "60-second mono .wav at 44.1 kHz,
// 16-bit" = 44,100 × 16 × 1 × 60 ÷ 8 = 5,292,000 bytes = 5.292 MB — the
// from-scratch calculation the numeracy law places in this row's expansion,
// not the row itself, per the brief's own instruction to keep the row's
// worked example tractable and move heavy 44,100-style arithmetic to an
// expansion with steps shown).
// Row anatomy copies lib/learn/topics/distortion.js / midi.js / recording.js
// / digital-analogue.js exactly: heading, description (<=~70 words),
// animation, assessment, no audio/interactive (per this task's brief and the
// non-calculator law — every number in row text is doable in the head).
//
// WORDING FLAG — the brief's own rationale line (used verbatim in
// learnRationales.numeracy, per instruction) reads "five number families",
// but the chapter map below lists exactly four rows. Reconciled here as:
// row 1 (pitch-numbers) itself teaches two distinct number families —
// pitch/octave doubling AND period (T = 1/f) — bundled into one row because
// they share a single reused diagram (log-frequency-axis) and a single
// named-source pairing (OctavePeriodTrainer.jsx / WaveformDrawingAssessment.
// jsx). That reading gives five families (pitch, period, level, tempo, size)
// across four rows, matching the rationale without altering the chapter
// map's exact row count. Flagged for Mike's review in the task report rather
// than silently resolved.
//
// Row 1 (pitch-numbers) note: A4 = 440 Hz is specSummary's own verbatim
// figure. The 440 -> 880 Hz octave-up worked number and the "1 kHz ↔ 1 ms"
// shortcut phrase are both wd-q4/wd-q8's own exact wording from
// WaveformDrawingAssessment.jsx, not paraphrased. The row's closing 250 Hz ->
// 4 ms example is wd-q2's own worked number, included because it is the
// cleanest non-calculator division in the source bank (250 × 4 = 1000).
//
// Row 2 (level-numbers) note: "the dB scale is logarithmic" and "+6 dB
// doubles voltage" (so −6 dB halves it) are lm-q1/lm-q2's own explanations,
// both from LevelsMeteringAssessment.jsx. lm-q6's "0 dBFS as digital
// ceiling" explanation was cited here originally but is no longer used in
// the row's prose — see the TASK-7 REVIEW FIX note below.
//
// TASK-7 REVIEW FIX (2026-07-17): the row originally defined dynamic range
// as the gap between a 0 dBFS ceiling and a −60 dBFS noise floor — the
// SYSTEM sense of dynamic range. But the mandated reused diagram
// (dynamic-range-gap, see components/learn/diagrams/DynamicRangeGap.js —
// "The dB Gap" between a "Quiet" and a "Loud" bar) and the deployed
// dynamics.js course it was built for both teach the PROGRAMME sense
// instead: the dB gap between a signal's own quietest and loudest parts.
// Reworded to match (governing map amended in docs/superpowers/specs/
// 2026-07-17-learn-rollout-wave3-chapter-maps.md, level-numbers line). The
// row's worked example (a verse at −50 dBFS, a chorus at −10 dBFS, 40 dB of
// range) is a fresh, independently-invented illustrative figure — −10 −
// (−50) = 40 is a clean non-calculator subtraction — and is deliberately
// distinct from dynamics.js's own −40 dBFS / −6 dBFS / 34 dB whisper-shout
// numbers (visible in the reused diagram's fixed canvas labels), so this
// row is still not a duplicate of that course's illustration. See
// w3-task-7-report.md.
//
// Row 3 (tempo-numbers) note: the formula "60,000 ÷ BPM" is
// BPMDelayCalculator.jsx's own verbatim theory-drawer text (rendered there
// as "DELAY (ms) = 60,000 ÷ BPM × NOTE"). The dotted (×1.5) and triplet (×⅔)
// multipliers are the same relationship that source's NOTE_VALUES table
// encodes (dotted-eighth multiplier 0.75 = eighth's 0.5 × 1.5; eighth-
// triplet multiplier 1/3 = eighth's 0.5 × ⅔) and that lib/learn/topics/
// delay.js's own dotted-triplet row demonstrates directly on a quarter note
// (600 × ⅔ = 400 ms at 100 BPM). This row's own worked figure, 200 BPM ->
// 300 ms, is a NEW anchor not used anywhere in delay.js's 60/100/120/150 BPM
// family, chosen specifically so this row is not a restated clone of that
// chapter's own worked examples — see the anti-duplication note below.
//
// Row 4 (size-numbers) note: sourced directly from DigitalAudioAssessment.
// jsx's da-q1 and da-q2 (see header above) for the row's own ratio-chain
// worked example (10 -> 20 -> 40 -> 60 MB, recomputed and verified in the
// task report). da-q11's from-scratch 44.1 kHz calculation is deliberately
// NOT included in the row itself (that arithmetic is not mentally
// tractable) and is instead the row's expansion, with every step shown.
//
// Anti-duplication (row 3 vs the Delay course's own timed-delay chapter,
// lib/learn/topics/delay.js): that chapter's three rows (timed-delay, bpm-
// ms-family, dotted-triplet) are the full treatment — the 60/100/120/150
// BPM anchor family, a worked dotted-eighth example, and a worked triplet-
// quarter example, each with its own assessment. This row is deliberately
// shorter, states the formula and the two multiplier rules once, and uses a
// 200 BPM worked example that appears nowhere in that chapter, rather than
// restating any of its four anchor tempos or either of its two named note-
// value examples (dotted-eighth, triplet-quarter). The row's own expansion
// names that chapter by course + chapter title ("the Delay course's Timed
// Delay & the Maths chapter") and explicitly defers the full derivation and
// reference table to it, rather than reproducing either here.
//
// Anti-duplication (row 2 vs the Digital & Analogue course's deep-enough
// row, lib/learn/topics/digital-analogue.js): that row derives dynamic range
// FROM bit depth (quantisation levels = 2^n, ~6 dB per bit, 16-bit ≈ 96 dB).
// This row does not derive dynamic range from bit depth at all — it defines
// it generically as ceiling − noise floor in dB, illustrated with an
// invented noise-floor figure unrelated to any bit-depth arithmetic. The
// row's own expansion names that chapter by course + chapter title and
// states explicitly that the two dynamic-range figures are related but not
// duplicates, worked out from different starting points.

export const NUMERACY_CHAPTERS = [
    {
        id: 'the-numbers',
        chapterNumber: 1,
        title: 'The Numbers That Come Up',
        subtitle: 'Topic 2.5 — Component 4',
        description: 'Five number families the exam tests without a calculator: pitch and period (A4 = 440 Hz, octave doubling), decibels and dynamic range, tempo in milliseconds, and file size. Every value on this page is chosen to be doable in your head — the exam bans calculators here, so quick, correct arithmetic is itself part of what earns the marks.',
        estimatedTime: '15–20 minutes',
        outroResourceId: 'octave-period-trainer',
        examAnchor: {
            question: 'A question states: a 10 MB mono recording at 44.1 kHz, 16-bit is converted to stereo at 88.2 kHz, 24-bit, with nothing else changed. What is the new file size, and what method should the answer show?',
            modelPoints: [
                'Three properties changed, each a clean multiplier: channels ×2 (mono → stereo), sample rate ×2 (44.1 → 88.2 kHz), bit depth ×1.5 (16 → 24-bit).',
                'Combine the three ratios first, before touching the original file size: ×2 × ×2 × ×1.5 = ×6.',
                'Apply the combined multiplier to the starting size: 10 MB × 6 = 60 MB.',
                'Showing each multiplier separately, then the combined ×6, then the final multiplication is what earns method marks — a bare "60 MB" with no working shown risks losing marks even when the final number is correct.',
            ],
            examTip: 'Write the formula, substitute the numbers, then simplify in steps — method marks survive arithmetic slips.',
        },
        rows: [
            {
                id: 'pitch-numbers',
                heading: 'Pitch & Period',
                description: "A4 is tuned to 440 Hz; an octave up doubles frequency (440 → 880 Hz), an octave down halves it (440 → 220 Hz). Period is the flip side of frequency — T = 1/f — so a handy shortcut is worth memorising: 1 kHz ⇄ 1 ms. A 250 Hz tone's period follows the same rule: 1/250 = 0.004 s = 4 ms.",
                animation: 'log-frequency-axis',
                assessment: {
                    id: 'pitch-numbers',
                    question: 'An A note at 440 Hz is transposed one octave up. What is the new frequency?',
                    options: [
                        { text: '880 Hz — one octave up doubles frequency: 440 × 2 = 880', correct: true, feedback: 'Correct — an octave up always doubles frequency, and an octave down always halves it (440 ÷ 2 = 220 Hz).' },
                        { text: '220 Hz — that is one octave down (440 ÷ 2), the opposite direction from the one asked for', correct: false, feedback: 'This is the halved value, which is one octave DOWN. The question asks for one octave up, which doubles the frequency instead: 440 × 2 = 880 Hz.' },
                        { text: '440 Hz — transposing by an octave does not change the frequency, only how the note is written', correct: false, feedback: 'An octave is specifically a doubling (or halving) of frequency — it is one of the few interval names tied to an exact numeric ratio, so the frequency does change: 440 × 2 = 880 Hz.' },
                    ],
                },
            },
            {
                id: 'level-numbers',
                heading: 'Decibels & Dynamic Range',
                description: "The dB scale is logarithmic, not linear: equal steps are equal ratios, not equal jumps. +6 dB doubles voltage; −6 dB halves it — just doubling or halving, no calculator needed. Dynamic range is the dB gap between a signal's quietest and loudest parts — a verse at −50 dBFS and a chorus at −10 dBFS give 40 dB of range: simple subtraction.",
                animation: 'dynamic-range-gap',
                assessment: {
                    id: 'level-numbers',
                    question: "A signal's level is reduced by 6 dB. What happens to its voltage?",
                    options: [
                        { text: 'It halves — −6 dB is the shortcut for halving voltage, because the dB scale is logarithmic, not linear', correct: true, feedback: 'Correct — +6 dB doubles voltage and −6 dB halves it. This works in either direction because equal dB steps are equal ratios, not equal amounts.' },
                        { text: 'It drops by 6%, because dB values behave like percentages', correct: false, feedback: 'dB is a logarithmic ratio, not a percentage. A 6 dB change is always a doubling or halving of voltage, whatever the starting level — a 6% change would be a much smaller, and linear, adjustment.' },
                        { text: 'Nothing changes in the actual signal — dB only describes how loud something sounds, not its real level', correct: false, feedback: 'dB measures the real signal level (voltage, power or SPL, depending on context), not just perceived loudness — a −6 dB change is a real, measurable halving of voltage.' },
                    ],
                },
            },
            {
                id: 'tempo-numbers',
                heading: 'Tempo in Milliseconds',
                description: "Every timed effect starts from one formula: one beat in milliseconds = 60,000 ÷ BPM. At 200 BPM, that's 60,000 ÷ 200 = 300 ms — divide, don't guess. From there, dotted = ×1.5 and triplet = ×⅔ of any note value, whatever the tempo. Numeracy only needs the formula and the two multipliers; the full derivation lives elsewhere.",
                animation: 'bpm-to-ms-family',
                assessment: {
                    id: 'tempo-numbers',
                    question: 'At 200 BPM, what is the value of one beat in milliseconds, and what is a dotted version of that value?',
                    options: [
                        { text: '300 ms for the plain beat (60,000 ÷ 200), and 450 ms dotted (300 × 1.5)', correct: true, feedback: 'Correct — 60,000 ÷ 200 = 300 ms, and dotted always means ×1.5 of the plain value: 300 × 1.5 = 450 ms.' },
                        { text: '200 ms for the plain beat, since the BPM number can be read directly as a millisecond value', correct: false, feedback: 'BPM measures tempo (beats per minute), not milliseconds directly — it must be run through the 60,000 ÷ BPM formula first: 60,000 ÷ 200 = 300 ms, not 200 ms.' },
                        { text: '300 ms for the plain beat, but 200 ms dotted, since dotted notes are shorter', correct: false, feedback: 'A dotted note is always LONGER than its plain version — dotted means ×1.5, not a reduction. 300 × 1.5 = 450 ms, not 200 ms.' },
                    ],
                },
            },
            {
                id: 'size-numbers',
                heading: 'File Size',
                description: 'File size scales with four things multiplied together: sample rate × bit depth × channels × time. Converting a 10 MB mono file to stereo doubles the channel count alone — 10 MB → 20 MB. Stack more changes and the multipliers combine: double the sample rate too, lift 16-bit to 24-bit (×1.5), and ×2 × ×2 × ×1.5 = ×6, so 10 MB → 60 MB.',
                animation: 'file-size-arithmetic',
                assessment: {
                    id: 'size-numbers',
                    question: 'A 10 MB mono recording is converted to stereo, with sample rate and bit depth unchanged. What is the new file size?',
                    options: [
                        { text: '20 MB — only the channel count doubled (mono → stereo), so the file size doubles too: 10 × 2 = 20', correct: true, feedback: 'Correct — each of the four properties (rate, depth, channels, time) scales the file size by the same ratio it changes by; doubling channels doubles the size.' },
                        { text: '10 MB — stereo just plays the same file through two speakers, so the file itself does not change', correct: false, feedback: 'Stereo stores two independent channels of data, not one channel played through two speakers — that doubles the amount of data stored, and so doubles the file size.' },
                        { text: '5 MB — stereo splits the original data between two channels, halving the size of each', correct: false, feedback: 'Stereo does not split existing data — it adds a second, independent channel of new data alongside the first, which doubles the total file size rather than halving anything.' },
                    ],
                },
            },
        ],
    },
];
