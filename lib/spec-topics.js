/**
 * The Edexcel 9MT0 topic list, as used by this site.
 *
 * Single source of truth for spec numbers and names. Mirrors the folder names
 * under Professional/Curriculum-Topics/, which is the canonical list in the
 * vault — if the two ever disagree, the vault wins and this file is wrong.
 *
 * Why this file exists: before it, topic labels were free text on each
 * resource, and they drifted. `1.11 EQ` and `1.11 Equalisation` both existed;
 * `2.5 Recording` existed while 2.5 is Numeracy; `1.8 Mixing` existed while
 * 1.8 is Automation. A spec-aligned site sold to other schools cannot have
 * mismatched spec numbers on the page — a head of department spots it at once.
 *
 * tests/spec-topics.test.mjs fails if any resource uses a label that is not
 * in this list, so the drift cannot come back silently.
 *
 * Note 1.12 legitimately covers four effects. That is the spec, not an error —
 * see SPEC_UMBRELLA_TOPICS below.
 */
export const SPEC_TOPICS = [
    '1.1 Software and Hardware',
    '1.2 Microphones',
    '1.3 Synthesis',
    '1.4 Sampling',
    '1.5 Sequencing',
    '1.6 Audio Editing',
    '1.7 Pitch and Rhythm Correction',
    '1.8 Automation',
    '1.9 Dynamic Processing',
    '1.10 Stereo',
    '1.11 EQ',
    '1.12 Delay',
    '1.12 Distortion',
    '1.12 Modulation',
    '1.12 Reverb',
    '1.13 Balance and Blend',
    '1.14 Mastering',
    '2.1 Acoustics',
    '2.2 Monitor Speakers',
    '2.3 Signals',
    '2.4 Digital Analogue',
    '2.5 Numeracy',
    '2.6 Levels',
    '3.1 Digital Recording History',
    '3.2 Analogue Recording History',
    '3.3 The Five Eras',
];

/**
 * Labels that are deliberately not spec topics. These are exam-skill and
 * cross-cutting buckets, kept separate so the test above can tell "not a spec
 * topic on purpose" from "a spec number somebody got wrong".
 */
export const NON_SPEC_TOPICS = [
    '1.0 General Skills',
    'Exam Skills',
    'Production Analysis (Section C)',
];

/**
 * Umbrella labels for a spec point that the teaching folders subdivide.
 *
 * RESOLVED by Mike 2026-07-30, and it was not the error it looked like. 1.12 is
 * a single spec point about effects; the four Curriculum-Topics folders (Delay,
 * Distortion, Modulation, Reverb) are HIS subdivision of it, made because one
 * folder holding all four would not be teachable. So a resource that cites
 * effects in general is right to say `1.12 Effects`, and time-based effects do
 * fall under 1.12 too.
 *
 * These therefore have no folder to match, by design — which is why they live
 * here and not in SPEC_TOPICS, whose test diffs it against the folders.
 *
 * All three current uses are `relatedTopics` cross-references, which is the
 * right home for an umbrella: a resource's own `topic` should name the specific
 * effect it teaches.
 */
export const SPEC_UMBRELLA_TOPICS = [
    '1.12 Effects',
    '1.12 Time-based Effects',
];

const VALID = new Set([...SPEC_TOPICS, ...NON_SPEC_TOPICS, ...SPEC_UMBRELLA_TOPICS]);

export function isValidTopic(label) {
    return VALID.has(label);
}

/** Spec number → the topic name(s) that number covers. */
export function namesForNumber(num) {
    return SPEC_TOPICS.filter((t) => t.startsWith(num + ' ')).map((t) => t.slice(num.length + 1));
}
