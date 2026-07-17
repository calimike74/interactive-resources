// Distortion Course — single-chapter version (Task 3, learn-rollout-wave3).
// Mapped to Pearson Edexcel Component 4 specification 1.12 Distortion.
// Sourced exclusively from: lib/topics.js's `distortion` topic specSummary
// block (type list, parameter list, clipping vocabulary, analogue/digital
// vocabulary — the exam-vocabulary skeleton every row is anchored to),
// components/resources/CombinedDistortionLab.jsx (glossary definitions of
// clipping/saturation/hard-soft-clipping, the symmetric-clipping-is-odd-
// harmonics / asymmetric-distortion-is-even-harmonics teaching in its Theory
// tab and Quick Reference card) and lib/resources/combined-distortion-lab.js
// (learning objectives). Row anatomy copies lib/learn/topics/reverb.js /
// sampling.js exactly: heading, description (<=~70 words), animation,
// optional audio/interactive, assessment.
//
// Row 3 note: the task brief's own gloss for this row ("soft/symmetric
// circuits favour even harmonics, hard clipping favours odd") does not match
// what the named lab source actually teaches — CombinedDistortionLab.jsx's
// Quick Reference card explicitly groups BOTH hard clip and soft clip under
// "Symmetrical Clipping -> Odd harmonics", and groups only tube saturation
// under "Asymmetrical Distortion -> Even harmonics" (same file's
// distortionTypes data: soft clipping's own characteristics list even says
// "Odd harmonics with faster decay"). The brief itself says to "mine the
// lab's harmonic content teaching verbatim where possible" for this row, so
// that instruction is followed over the brief's own paraphrase: this row
// teaches the symmetric/asymmetric distinction (not a soft/hard one) as the
// actual determinant of odd vs even harmonic content. Flagged in the task
// report for Mike's review.
//
// Row 4 note: the brief's cross-link instruction names the sampling course's
// "Transforms" chapter, but the bit-depth-staircase content this row reuses
// actually lives in sampling's "rate-depth" chapter, not "transforms". Per
// the self-containment law ("phrased by course name, never Chapter N or a
// chapter title"), the expansion below names only "the Sampling course" and
// omits any specific chapter name — sidestepping the mismatch rather than
// propagating a wrong pointer. Flagged in the task report.

export const DISTORTION_CHAPTERS = [
    {
        id: 'drive',
        chapterNumber: 1,
        title: 'Drive, Clipping & Colour',
        subtitle: 'Topic 1.12 — Component 4',
        description: 'The distortion family from gentle saturation to extreme fuzz, the drive/tone/level/mix parameters that shape it, why clipping creates odd or even harmonics, and how analogue circuit colour differs from digital waveshaping and bitcrushing.',
        estimatedTime: '15–20 minutes',
        outroResourceId: 'combined-distortion-lab',
        examAnchor: {
            question: 'A listening question describes a guitar tone as "gently warmed, barely touched, no harshness at all" and asks you to name the distortion type, then explain which single parameter you would reach for to push that same tone one stage further towards outright fuzz. What should the answer state?',
            modelPoints: [
                'Saturation is the correct identification: the subtlest, gentlest end of the distortion family, adding warmth without audibly reshaping the wave.',
                'Drive (or gain) is the parameter that pushes the signal harder into clipping — raising drive is what moves a sound along the family, from saturation through overdrive and distortion towards fuzz.',
                'Naming the family in order — saturation as the gentlest, then overdrive, then distortion, then fuzz as the most extreme — is itself creditable; jumping straight to "distortion" for every example loses this graded distinction.',
                'Tone and mix are separate controls from drive: tone shapes which frequencies survive the clipped edge, and mix blends the distorted signal back against the clean original — neither of them increases how hard the signal is clipped.',
            ],
            examTip: 'Name the type first, then the parameter that gets you there.',
        },
        rows: [
            {
                id: 'what-distortion-is',
                heading: 'The Distortion Family',
                description: "Distortion happens when a signal is pushed past what a circuit can carry cleanly, and the peaks get reshaped rather than passing through untouched — the mechanism the spec calls clipping. The family runs from gentle to extreme: overdrive, then distortion, then fuzz at its most extreme. Saturation sits apart as the subtlest warmth of all, barely reshaping anything.",
                animation: 'clipping-shapes',
                assessment: {
                    id: 'what-distortion-is',
                    question: 'A student is asked to order overdrive, distortion, fuzz and saturation from gentlest to most extreme. Which order is correct?',
                    options: [
                        { text: 'Saturation (the subtlest warmth) → overdrive (gentle) → distortion → fuzz (the most extreme) — the family runs from barely reshaping the wave to clipping it almost to a square', correct: true, feedback: 'Correct — this is the graded family the spec names: saturation is the gentlest end, fuzz the most extreme, with overdrive and distortion sitting between them.' },
                        { text: 'Fuzz → distortion → overdrive → saturation, because fuzz is the most commonly used effect and so the mildest starting point', correct: false, feedback: 'This is backwards — fuzz is explicitly the most extreme member of the family, clipping the wave almost to a square, not the mildest.' },
                        { text: 'All four are simply different names for the same effect, so there is no meaningful order between them', correct: false, feedback: 'They are a real gentle-to-extreme family, not interchangeable names for one effect — each sits at a different point on the same clipping continuum.' },
                    ],
                },
            },
            {
                id: 'drive-tone-level',
                heading: 'The Core Parameters',
                description: 'Every distortion effect boils down to a handful of controls. Drive (or gain) pushes the signal harder into the circuit — more drive means more clipping. Tone shapes the edge of that clipped sound, usually a filter cutting or keeping the harshest highs. Output level compensates for any volume gained by driving harder. Mix (or blend) balances the distorted signal against the clean original, for a parallel effect.',
                animation: 'drive-tone-level-chain',
                interactive: 'drive',
                audio: { preset: 'dist-drive', label: 'Hold to hear a rich tone through a fixed drive — soft-clip warmth, sitting at the top of the "warm" zone before things turn harsh.' },
                assessment: {
                    id: 'drive-tone-level',
                    question: "A student turns up a distortion plug-in's drive control and the tone becomes noticeably harsher and louder at the same time. Which single control should they reach for to tame the extra loudness without undoing the added harshness?",
                    options: [
                        { text: "Output level — it compensates for volume gained by driving harder, without touching how hard the signal is clipped (drive's job) or which frequencies survive the clipped edge (tone's job)", correct: true, feedback: 'Correct — output level is specifically the compensating control; turning it down leaves the clipping (and its harshness) untouched while bringing the loudness back under control.' },
                        { text: "Drive — turning drive back down would tame the loudness", correct: false, feedback: 'Turning drive back down would also undo the very clipping that created the harshness they want to keep — that is the opposite of what is being asked for.' },
                        { text: 'Mix — blending in more of the clean signal reduces how loud the distorted signal itself is', correct: false, feedback: "Mix balances the distorted signal against the clean original — it does not reduce the distorted signal's own level, which is output level's job." },
                    ],
                },
            },
            {
                id: 'harmonic-colour',
                heading: 'Odd vs Even Harmonics',
                description: "Clipping doesn't just flatten peaks — it adds new harmonics on top. Symmetric circuits, which treat the wave's positive and negative halves identically, add only odd harmonics: hard clipping's are harsh, soft clipping's fade faster and sound gentler. Asymmetric circuits, such as tube saturation, treat the two halves differently and add even harmonics too — the character usually described as warm.",
                animation: 'odd-even-harmonics',
                assessment: {
                    id: 'harmonic-colour',
                    question: 'A listening test compares two distorted guitar tones made from the same clean signal — one thin and buzzy, the other thick and warm. The buzzy tone comes from a symmetric circuit, the warm one from an asymmetric (tube) circuit. Which harmonic content explains the difference?',
                    options: [
                        { text: 'The buzzy tone has only odd harmonics, because a symmetric circuit treats both halves of the wave identically; the warm tone has even harmonics added on top, because an asymmetric circuit like tube saturation treats the two halves differently', correct: true, feedback: 'Correct — symmetry (or its absence) is the determining factor: symmetric clipping produces odd harmonics only, asymmetric distortion adds even harmonics as well.' },
                        { text: 'The warm tone has no harmonics added at all — it is simply the clean signal turned down', correct: false, feedback: 'Distortion by definition adds harmonics; the warm tone gets extra even harmonics from the circuit\'s asymmetry, it is not harmonic-free.' },
                        { text: 'Both tones have identical harmonic content — the difference is purely down to output level', correct: false, feedback: "It is the symmetric/asymmetric distinction that determines whether even harmonics appear, not the output level the two tones happen to be played at." },
                    ],
                },
            },
            {
                id: 'analogue-vs-digital-dirt',
                heading: 'Analogue vs Digital Dirt',
                description: 'Analogue distortion gets its colour from real components pushed hard: tubes, transistors and transformers each add their own character as they are overdriven. Digital distortion reshapes the numbers directly instead — waveshaping applies a curve to every sample, and bitcrushing throws bits away. Bitcrushing is quantisation as an effect: deliberately fewer bits, a coarser staircase, grittier noise.',
                animation: 'bit-depth-staircase',
                assessment: {
                    id: 'analogue-vs-digital-dirt',
                    question: 'A student says bitcrushing and tube saturation are "basically the same effect, just from different eras." What is wrong with this, and what does bitcrushing actually do?',
                    options: [
                        { text: 'They work on completely different principles: tube saturation is analogue circuit colour from an overdriven component, while bitcrushing is a digital effect — deliberately reducing bit depth, applying quantisation on purpose rather than avoiding it', correct: true, feedback: 'Correct — one is a real component (tube, transistor or transformer) being driven hard; the other is a digital process that turns the coarse staircase of low bit depth into a deliberate, gritty effect.' },
                        { text: 'Nothing is wrong — both effects work by reducing the sample rate of a digital recording', correct: false, feedback: 'Neither works by changing sample rate: tube saturation is not digital at all, and bitcrushing specifically targets bit depth and quantisation, not sample rate.' },
                        { text: 'Bitcrushing is simply the digital name for what a transformer does when overdriven', correct: false, feedback: "A transformer's colour is an analogue phenomenon from a real magnetic component being pushed hard; bitcrushing is a wholly digital, quantisation-based effect with no analogue equivalent." },
                    ],
                },
            },
        ],
    },
];
