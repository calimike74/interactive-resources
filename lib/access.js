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
    { spec: '2.5', name: 'Numeracy', why: 'Flagged every year of the last seven: the single biggest source of lost marks.' },
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
    // ─── The ceiling ruling, 2026-08-14 (Mike, Notes/C3-site.md) ───────────
    // Paid is THE CEILING ONLY: the 3D explorers and workshop instruments on
    // the workshops site, and the Map Room here. Every 2D tool, quiz,
    // assessment, flashcard deck and narrative on this site is the free shop
    // window — it proves the teaching; the ceiling plus the memory layer
    // carry the membership. Nothing weak or limited may ever sit behind the
    // paywall. The only gated surface on this site is /map-room.

    // 2.5 Numeracy
    'octave-period-trainer',
    'waveform-explorer',
    'waveform-drawing-assessment',
    'bpm-delay-calculator',
    // 1.5 Sequencing / MIDI
    'piano-roll',
    'midi-binary-assessment',
    'sampling-playground',
    // 1.3 Synthesis
    'subtractive-synth-explorer',
    'additive-synth-explorer',
    'operator-image-explorer',
    'operator-assessment',
    'pitch-synth-monitors-assessment',
    // Recording & narrative. (story-of-the-studio, story-of-synthesis and
    // recording-history are standalone routes outside the resource registry —
    // nothing gates them, so they are free without an entry here.)
    'reveal-explorer',
    'essay-scaffold-practice',
    'production-analysis',
    'stereo-recording-essay',
    'stereo-panning',
    'mixing-production',
    // 1.6 Audio Editing
    'edit-bench',
    // 1.13 Balance and Blend
    'balance-desk',
    // 1.8 Automation
    'automation-lane',
    // 1.9 Dynamics
    'dynamics-bench',
    'compressor-curve-practice',
    'compressor-image-explorer',
    'compressor-assessment',
    'gate-image-explorer',
    'gate-assessment',
    'rtq-dynamic-compression',
    // 1.11 EQ
    'eq-bench',
    'eq-filter-bridge',
    'filter-rolloff-visualization',
    'essay-scaffold',
    'eq8-image-explorer',
    'eq8-assessment',
    'autofilter-image-explorer',
    'autofilter-assessment',
    // Reverb & acoustics
    'acoustics-flashcards',
    'reverb-image-explorer',
    'reverb-assessment',
    'acoustics-psychoacoustics',
    // 1.12 Delay & distortion
    'delay-effects',
    'delay-image-explorer',
    'delay-assessment',
    'delay-flashcards',
    'double-tracking-explorer',
    'combined-distortion-lab',
    // Leads & signals
    'audio-leads-flashcards',
    'signal-chain-eurorack',
    // 2.4 Digital & analogue
    'adc-explorer',
    'signal-chain-builder',
    'digital-analogue',
    // Sits across 2.4 Digital & Analogue, 2.5 Numeracy and 2.3 Signals.
    'digital-audio-assessment',
    // 2.6 Levels
    'levels-metering-assessment',
];

/** Topic pages (Learn · Explore · Revise) open without an account.
 *  All of them, since the 2026-08-14 ceiling ruling: the written Learn layer
 *  is the teaching, and the teaching is free. The list stays explicit
 *  (mirroring FREE_RESOURCES) so a new band is a deliberate addition, not a
 *  default. */
export const FREE_TOPIC_PAGES = [
    'general',
    'software-hardware',
    'microphones',
    'synthesis',
    'sampling',
    'midi',
    'audio-editing',
    'pitch-rhythm-correction',
    'automation',
    'dynamics',
    'stereo',
    'eq',
    'delay',
    'distortion',
    'modulation',
    'reverb',
    'balance-and-blend',
    'mastering',
    'acoustics',
    'monitor-speakers',
    'leads-and-signals',
    'digital-analogue',
    'numeracy',
    'levels',
];

/**
 * Essay note, updated for the 2026-08-14 ceiling ruling: this repo's essay
 * scaffolds (essay-scaffold, essay-scaffold-practice, stereo-recording-essay)
 * are 2D practice furniture and sit in FREE_RESOURCES above with the rest of
 * the shop window. The PAID essay experience is the workshops site's two
 * 20-mark benches (workshops.musictechstudio.co.uk/the-essay/ c3-q6 + c4-q6,
 * a different codebase) — that July + 08-08 ruling stands; C3 Q5 there stays
 * the free essay door.
 */

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
 * GATING IS WIRED — SOFT, AND OFF UNTIL MIKE FLIPS IT
 *
 * This site was never a hidden site being revealed. Every page still returns
 * `index, follow`, and resource URLs still sit in the live sitemap. Gating the
 * non-free topics is a RETRACTION from a live, crawlable site, not a launch,
 * which is why the two decisions below shaped how it was built:
 *
 *  1. It's a SOFT gate. A resource page's title, its topic, and why it matters
 *     in the exam stay public and indexable — only the interactive itself
 *     locks (components/GateKeeper.jsx wrapping ResourcePageClient). A
 *     non-free Learn topic's header — title, subtitle, description, section
 *     count — stays public the same way; only the lesson body locks
 *     (components/learn/LearnTopicPage.js wrapping LearnSpineLayout in the
 *     same GateKeeper, keyed off isTopicFree() above rather than a resource
 *     id). /topic/* hubs are never wrapped at all: they are the shop window
 *     index, and stay open by design even for non-free topics.
 *
 *  2. It's a classroom courtesy lock, not real auth (lib/gate.js explains why
 *     a static export can't do better) — the grades-dashboard shared passcode
 *     idea, reused. It engages only when Mike sets BOTH
 *     NEXT_PUBLIC_GATE_ENABLED=true and NEXT_PUBLIC_GATE_DIGEST in Vercel and
 *     redeploys; with neither set, every page behaves exactly as it did
 *     before any of this was wired.
 */
