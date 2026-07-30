/**
 * Free / paid manifest — the single source of truth for what a visitor with no
 * account may use on this site.
 *
 * The rule, decided 2026-07-30: FREE IS THE TEACHING, PAID IS THE MEMORY.
 * Anyone may learn anything in the free set, at full interactive depth. What a
 * subscription buys is that the work is remembered — progress, the
 * I-know-this tick, spaced revision, readiness, and the teacher's view.
 *
 * Two things follow from that, and both are deliberate:
 *
 *  1. Free tools are NOT cut-down versions. A watered-down free tier was
 *     considered and rejected: the ceiling is protected by breadth (how many
 *     topics you get), never by crippling the ones you get.
 *
 *  2. This file GATES NOTHING on its own. It is data. Nothing reads it to
 *     hide a page yet, and that is on purpose — see the note at the bottom on
 *     why gating is a bigger step here than it looks.
 *
 * Topic choice is evidence-led, not taste-led. Source:
 * Professional/Exemplar-Work/Analysis-Documents/C4-Difficulties-Topic-Mapping-and-Patterns.md
 * — 52 flagged questions across seven years of 9MT0/04 papers.
 *
 *     2.5 Numeracy    flagged in 7 of 7 years (18 questions)
 *     2.4 Digital     flagged in 6 of 7 years (12 questions)
 *     1.5 Sequencing  flagged in 6 of 7 years (11 questions)
 *     1.3 Synthesis   flagged in 3 of 7 years, and a Section B essay topic
 *     1.11 EQ         flagged in 2 of 7 years — low-medium
 *     delay / reverb  listed under what students do NOT struggle with
 *
 * So the free set is the two topics that cost the most marks plus the one
 * every student must learn and which sells the subject to a newcomer.
 */

/** Canonical spec numbers in the free set. Names per Professional/Curriculum-Topics/. */
export const FREE_TOPICS = [
    { spec: '2.5', name: 'Numeracy', why: 'Flagged every year of the last seven — the single biggest source of lost marks.' },
    { spec: '1.5', name: 'Sequencing', why: 'Flagged in six years of seven. MIDI data, binary and controllers.' },
    { spec: '1.3', name: 'Synthesis', why: 'A Section B essay topic, and the thing that makes a newcomer want to do this subject.' },
];

/**
 * Explicit allow-list of resource ids, NOT derived from each resource's `topic`
 * field.
 *
 * The original reason was a safety one: `patch-bay-simulator` was labelled
 * "2.5 Recording" while 2.5 is Numeracy, so a number-prefix match would have
 * quietly made a recording tool free. That hazard is gone — the spec labels
 * have since been corrected against Professional/Curriculum-Topics/ and
 * tests/spec-topics.test.mjs now keeps them honest.
 *
 * The list stays explicit anyway, for a better reason: what a stranger can use
 * for free is a commercial decision, and it should be a line someone can read
 * and argue with, not an emergent property of curriculum tagging. A tool
 * getting retagged should never silently change what is free.
 */
export const FREE_RESOURCES = [
    // 2.5 Numeracy
    'octave-period-trainer',
    'waveform-explorer',
    'waveform-drawing-assessment',
    'bpm-delay-calculator',
    // 1.5 Sequencing / MIDI
    'midi-binary-assessment',
    'midi-pitch-bend-controller',
    // 1.3 Synthesis
    'subtractive-synth-explorer',
    'operator-image-explorer',
    'operator-assessment',
    // Sits across 2.4 Digital & Analogue, 2.5 Numeracy and 2.3 Signals. Included
    // because the numeracy half is squarely in the free set and splitting a
    // single assessment down the middle would teach half a topic.
    'digital-audio-assessment',
];

/** Topic pages (Learn · Explore · Revise) open without an account. */
export const FREE_TOPIC_PAGES = ['numeracy', 'midi', 'synthesis'];

/**
 * The essay area. C3 Q5 is the 15-mark question and is free; both 20-mark
 * questions stay paid, because extended writing under exam conditions is the
 * part a member is really buying help with.
 */
export const FREE_ESSAY_QUESTIONS = ['c3-q5'];
export const PAID_ESSAY_QUESTIONS = ['c3-q6', 'c4-q6'];

const FREE_SET = new Set(FREE_RESOURCES);

/** Is this resource in the free set? */
export function isResourceFree(id) {
    return FREE_SET.has(id);
}

/** Is this topic page in the free set? */
export function isTopicFree(topicId) {
    return FREE_TOPIC_PAGES.includes(topicId);
}

/**
 * RESOLVED 2026-07-30. Sixteen labels across fifteen files were corrected
 * against Professional/Curriculum-Topics/ — see lib/spec-topics.js, which is
 * now the single source of truth, and tests/spec-topics.test.mjs, which fails
 * if a resource uses a label that is not on the list.
 *
 * The ones that mattered: `2.5 Recording` (2.5 is Numeracy), `1.8 Mixing`
 * (1.8 is Automation), `1.12 Dynamics` and `1.10 Dynamics` (dynamics is 1.9),
 * `1.1 Sound & Signals` (1.1 is Software and Hardware), `2.2 Hearing &
 * Perception` (2.2 is Monitor Speakers), and `1.11 Equalisation` in four files
 * where the rest of the site said `1.11 EQ`.
 *
 * The two 1.12 labels I had flagged as errors were not errors. Mike confirmed
 * 2026-07-30 that 1.12 is one spec point about effects and the four folders
 * under it are his own teaching subdivision, so `1.12 Effects` and `1.12
 * Time-based Effects` are correct cross-references. They now live in
 * SPEC_UMBRELLA_TOPICS with their own guards. Nothing is outstanding.
 */
export const TOPIC_LABEL_MISMATCHES = [];

/**
 * WHY NOTHING IS GATED YET
 *
 * This site is not a hidden site being revealed. Every page already returns
 * `index, follow`, and 51 resource URLs sit in the live sitemap. So turning the
 * other topics off is a RETRACTION from a live, crawlable site, not a launch.
 *
 * That has two consequences worth deciding before any gate is wired:
 *
 *  1. Do it as a SOFT gate. The page, its title, what the topic covers and why
 *     it matters in the exam should stay public and indexable; only the
 *     interactive itself needs an account. A hard 404 or redirect throws away
 *     search equity that already exists and turns a shop window into a wall.
 *
 *  2. The site began as a link out of Sherborne lessons and has no auth at all.
 *     Gating it locks Mike's own Upper Sixth out of their classwork. He has
 *     accepted that and wants it locked down; the open question is the
 *     mechanism, with the grades-dashboard shared passcode as the candidate.
 *     Not urgent — teaching resumes in September.
 */
export const GATING_WIRED = false;
