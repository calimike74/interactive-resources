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
 * Note 1.12 legitimately covers four effects. That is the spec, not an error.
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
 * Labels that are known to be wrong but cannot be fixed without a curriculum
 * decision. 1.12 covers Delay, Distortion, Modulation and Reverb, so an
 * umbrella label could mean any of them — guessing would just move the error.
 *
 * This list exists so the test suite can pass on today's known debt while
 * still failing the moment anyone introduces a NEW bad label. It should only
 * ever shrink. Awaiting Mike:
 *   '1.12 Effects'             — mixing-production, production-analysis
 *   '1.12 Time-based Effects'  — signal-chain-eurorack
 */
export const KNOWN_UNRESOLVED = [
    '1.12 Effects',
    '1.12 Time-based Effects',
];

const VALID = new Set([...SPEC_TOPICS, ...NON_SPEC_TOPICS, ...KNOWN_UNRESOLVED]);

export function isValidTopic(label) {
    return VALID.has(label);
}

/** Spec number → the topic name(s) that number covers. */
export function namesForNumber(num) {
    return SPEC_TOPICS.filter((t) => t.startsWith(num + ' ')).map((t) => t.slice(num.length + 1));
}
