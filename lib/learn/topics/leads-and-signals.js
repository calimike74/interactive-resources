// Leads & Signals Course — single-chapter version (Task 8, learn-rollout-wave3).
// Mapped to Pearson Edexcel Component 4 specification 2.3 Leads & Signals.
// Sourced exclusively from: lib/topics.js's `leads-and-signals` topic
// specSummary block (read-only, not modified or staged here) — "Connector
// types — XLR, TRS, TS, RCA — and where each is used", "Balanced vs
// unbalanced signal paths and noise rejection", "DI boxes, impedance
// matching, and instrument level vs line level", "Order of effects in a
// mixing chain (clean -> dynamics -> time-based -> limiting)", "Insert vs
// aux send routing — especially for reverb and parallel processing" — the
// exam-vocabulary skeleton every row is anchored to;
// components/resources/AudioLeadsFlashcards.jsx (the PRIMARY source, mined
// verbatim where possible — its basic-tier cards b1 XLR, b2 TS/TRS, b3
// balanced signal, b4 RCA, and intermediate-tier cards i1 XLR pinout/locking,
// i2 TS cable length, a2 impedance/DI); components/resources/
// PatchBaySimulator.jsx (checked in full — its own prose is entirely about
// dragging room-mic feeds to PB8 patch-bay inputs; it contains no insert/
// send or DI-box prose of its own, confirmed by direct read plus a targeted
// grep for "insert", "send", "aux", "DI", "impedance" — the only hits are UI
// strings like "patch cables" and aria-labels for the drag interaction.
// Contributes routing CONTEXT only — "patching" as the general concept of
// wiring one thing to another — not usable prose for any row); components/
// resources/SignalChainEurorack.jsx (checked — a 14-line iframe wrapper
// around /signal-chain with no prose content of its own, the same stub-file
// finding digital-analogue.js and recording.js made about their own thin
// sources); the deployed lib/learn/topics/reverb.js's routing chapter
// ('Wiring It In: Sends, Inserts & Faders') — CROSS-REFERENCE ONLY, read in
// full for its own send-vs-insert row, NOT duplicated here (see the
// anti-duplication note below). Row anatomy copies lib/learn/topics/
// distortion.js / midi.js / recording.js / digital-analogue.js / numeracy.js
// exactly: heading, description (<=~70 words), animation, assessment, no
// audio/interactive (per this task's brief).
//
// UK-ENGLISH SPELLING NORMALISATION — AudioLeadsFlashcards.jsx itself is
// spelling-inconsistent ("analogue" in b1's answer text, "analogue" elsewhere
// in the same file). Per this project's UK-English law, every row below
// normalises to "analogue"/"balanced" UK spelling regardless of which
// variant the source card used at that exact spot — a trivial spelling
// normalisation, not a content change. Flagged here rather than silently
// applied.
//
// Row 1 (the-connectors) note: XLR ("a 3-pin balanced connector that locks
// in place... used for microphones... and balanced line-level connections")
// is b1's own wording, condensed. TS/TRS ("2-conductor unbalanced 1/4" jack
// for instruments" / "3-conductor jack... balanced mono... or unbalanced
// stereo") is b2's own wording, condensed. RCA ("unbalanced... usually in
// red/white stereo pairs... consumer and DJ equipment") is b4's own wording,
// condensed. All three are verbatim-where-possible per the brief; no claim
// in this row goes beyond what b1/b2/b4 state.
//
// Row 2 (balanced-vs-unbalanced) note: "hot, cold and ground" and "the cold
// wire carries an inverted copy of the signal, allowing noise to be
// cancelled at the receiving end" are b3's own wording. The mechanics of
// WHY flipping and summing cancels noise while doubling the wanted signal —
// noise arrives identically on both conductors, so subtracting cold from hot
// (equivalently, flipping cold's polarity and adding) removes the shared
// noise term while the wanted (oppositely-phased) signal reinforces — is a
// standard, uncontested extension of b3's own "cancel out interference"
// claim, not a verbatim quote from any named source. Flagged in the task
// report. TS-stays-unbalanced ("carries only tip and sleeve... picking up
// noise on long runs") draws on i2's own wording ("TS cables are unbalanced
// and susceptible to noise... over long runs").
//
// Row 3 (levels-and-di) note: SOURCING FLAG — the brief's own chapter-map
// gloss names a three-way "mic level vs instrument level vs line level"
// split, but specSummary's own vocabulary line only names two ("instrument
// level vs line level"); no named source defines "mic level" as a third,
// distinct tier. The three-way framing is kept (per the brief's explicit
// instruction) as a flagged claim: standard, uncontested audio-engineering
// vocabulary, not itself sourced from a named source passage. SOURCE-WINS
// FLAG — a2's own answer text reads "Microphone inputs (high Z) versus line
// inputs (low Z)", which is confusing/atypical audio-engineering phrasing
// (real mic preamp inputs are commonly described as high-Z RELATIVE TO a
// mic's own low output impedance, not high-Z in absolute terms next to line
// inputs) and is NOT used in this row. Instead the row follows a2's own
// clearer furtherLearning text on the same card — "DI boxes convert high-
// impedance instrument signals to low-impedance balanced signals suitable
// for mixing desks" — condensed to "high-impedance instrument signal into a
// low-impedance, balanced... signal". Per this task's global rule 4 (source
// wins over brief-gloss conflicts, disclosed prominently), and because even
// a2's own two statements conflict with each other, the row states the DI's
// output as MIC level specifically (standard audio-engineering fact: a
// passive DI's job is to present a low-impedance, BALANCED, MIC-level
// signal to a mic preamp input — matching a2's practicalExample, "plugging a
// guitar directly into a mixing desk's LINE input sounds weak... a DI box
// solves this", which only makes sense if the DI's own output is meant for
// a MIC input, not a line input) rather than "line level", which a2's
// answer field never actually claims the DI produces. Flagged prominently
// in the task report as the row with the most editorial judgement calls in
// this chapter.
//
// Row 4 (order-and-routing) note: the chain order "clean-up (EQ, gating)...
// dynamics (compression)... time-based effects (delay, reverb)... limiting
// last" is specSummary's own verbatim order ("clean -> dynamics -> time-
// based -> limiting"), expanded with each stage's standard named technique
// (EQ/gating for clean-up, compression for dynamics, delay/reverb for time-
// based) as a standard, uncontested extension — flagged in the task report.
// The insert-vs-send half of the row ("an insert sits an effect directly in
// one channel's path; a send taps a copy to a shared effect") restates only
// the ONE-LINE distinction specSummary itself names ("Insert vs aux send
// routing"), not reverb.js's fuller treatment (which additionally covers
// pre-fader vs post-fader taps and the reverb-fade automation trick — none
// of that appears here). See the anti-duplication note below.
//
// Anti-duplication (row 4 vs the Reverb course's own routing chapter,
// lib/learn/topics/reverb.js's 'routing' chapter, "Wiring It In: Sends,
// Inserts & Faders"): that chapter's three rows (send-vs-insert, pre-post-
// fader, reverb-fade-trick) are the full treatment — the stereo-pan
// consequence of routing reverb as an insert, the pre-fader/post-fader tap-
// point distinction, and the automated fade-to-silence trick that depends on
// getting both decisions right, each with its own assessment and its own
// reused/new diagrams (send-vs-insert-routing, pre-post-fader-tap, reverb-
// fade-automation). This row is deliberately narrower: it states the chain
// ORDER (which reverb.js's own routing chapter does not cover at all — that
// chapter starts from "where does reverb sit", not "what order do effects
// run in") and states only the ONE-LINE insert-vs-send distinction — an
// effect sits inside one channel's path (insert) versus a shared effect fed
// by a tap (send) — without touching pre-fader/post-fader taps or the fade
// trick at all. The row's own expansion names the Reverb course's chapter by
// course + chapter title ("the Reverb course's Wiring It In: Sends, Inserts
// & Faders chapter") and explicitly defers the deeper treatment to it,
// rather than reproducing any of it here. The REUSED diagram
// (send-vs-insert-routing) is referenced by registry id only — the
// component file itself (components/learn/diagrams/SendVsInsertRouting.js)
// is untouched by this task.

export const LEADS_AND_SIGNALS_CHAPTERS = [
    {
        id: 'connections',
        chapterNumber: 1,
        title: 'Plugs, Paths & Order',
        subtitle: 'Topic 2.3 — Component 4',
        description: 'How leads and levels fit together: the four connectors and where each lives, why balanced cables reject noise on long runs, the three signal levels a DI box bridges, and the conventional order effects sit in along a mixing chain — plus the one-line distinction between an insert and a send.',
        estimatedTime: '15–20 minutes',
        // patch-bay-simulator retired 2026-08-12 (WO-08) — repointed to the
        // other resource in this band.
        outroResourceId: 'signal-chain-eurorack',
        examAnchor: {
            question: 'A question describes a specific studio connection — for example, a condenser microphone run 20 metres to a front-of-house desk — and asks which lead to use and why. What should the answer cover?',
            modelPoints: [
                'Name the connector: XLR for a microphone run — a locking, 3-pin connector built for professional audio equipment.',
                'State balanced or unbalanced: XLR and TRS carry a balanced hot/cold/ground signal that rejects noise picked up over a long run; TS carries only hot and ground, so it stays unbalanced.',
                'State the level: a microphone\'s own output is mic level, the smallest of the three signal levels, needing a preamp\'s gain before it reaches line level.',
                'Connector, balance and level are three separate marking points — naming only the connector, without justifying balanced/unbalanced or level, leaves marks unclaimed.',
            ],
            examTip: 'Connector, balance, level — answer all three even when the question only asks one.',
        },
        rows: [
            {
                id: 'the-connectors',
                heading: 'The Four Connectors',
                description: "XLR is a 3-pin balanced connector that locks in place — used for microphones and balanced line-level connections between pro-audio equipment. TS (Tip-Sleeve) is a 2-conductor unbalanced 1/4″ jack for instruments; TRS (Tip-Ring-Sleeve) adds a third conductor, carrying a balanced mono signal or unbalanced stereo. RCA (phono) connectors are unbalanced, usually in red/white stereo pairs, common on consumer and DJ gear.",
                animation: 'connector-lineup',
                assessment: {
                    id: 'the-connectors',
                    question: 'A recording setup needs a cable for a condenser microphone into a mixing desk, and a separate cable for an electric guitar into an amp. Which connector suits each?',
                    options: [
                        { text: 'XLR for the microphone — a locking, balanced 3-pin connector; TS for the guitar — an unbalanced 2-conductor 1/4″ jack built for instruments', correct: true, feedback: 'Correct — XLR is the standard locking, balanced connector for microphones; TS is the standard unbalanced connector for guitars and other instruments.' },
                        { text: 'TS for the microphone and XLR for the guitar — the two are interchangeable, so either order works', correct: false, feedback: 'This is reversed. XLR is built for microphones (balanced, locking); TS is built for instruments like guitars (unbalanced, 2-conductor) — they are not interchangeable roles.' },
                        { text: 'RCA for both, since RCA is the universal connector for any audio source', correct: false, feedback: 'RCA is an unbalanced consumer/DJ connector, not the universal choice — neither a professional microphone nor a guitar amp input is built around RCA.' },
                    ],
                },
            },
            {
                id: 'balanced-vs-unbalanced',
                heading: 'Balanced vs Unbalanced',
                description: "A balanced cable uses three conductors: hot, cold and ground. The cold wire carries an inverted copy of the hot signal, so shared noise picked up on both cancels when they're flipped and summed, while the wanted signal doubles. XLR and TRS carry this balanced path; TS carries only tip and sleeve — hot and ground — so it stays unbalanced, picking up noise on long runs.",
                animation: 'balanced-noise-rejection',
                assessment: {
                    id: 'balanced-vs-unbalanced',
                    question: 'A 15-metre cable run between a stage mic and the front-of-house desk needs to reject noise picked up along its length. Which connector type should be used, and why?',
                    options: [
                        { text: 'A balanced connector such as XLR — its hot and cold conductors pick up the same noise, so flipping cold and summing it with hot at the receiver cancels the noise while the wanted signal doubles', correct: true, feedback: 'Correct — balanced cabling is exactly this flip-and-sum trick: identical noise on both conductors cancels, and the oppositely-phased wanted signal reinforces instead.' },
                        { text: 'A TS connector, because unbalanced cables carry less current and so pick up less noise', correct: false, feedback: 'TS is the connector MORE prone to noise on long runs, not less — it has no cold conductor to carry an inverted copy of the signal, so there is nothing for the noise to cancel against.' },
                        { text: 'Any connector works the same over any distance, since noise rejection depends only on the mixing desk, not the cable', correct: false, feedback: 'Noise rejection is a property of the CABLE\'S wiring (balanced vs unbalanced), not the desk it plugs into — a balanced cable rejects noise picked up along its own run regardless of what it connects to.' },
                    ],
                },
            },
            {
                id: 'levels-and-di',
                heading: 'Mic, Instrument, Line',
                description: "Three levels travel around a studio: mic level is tiny, needing a preamp's gain before anything else can use it; instrument level (a guitar or bass pickup) is stronger but high-impedance and unbalanced; line level is the standardised, balanced level equipment expects between its inputs and outputs. A DI box bridges the gap, converting a high-impedance instrument signal into a low-impedance, balanced mic-level signal a preamp can use.",
                animation: 'signal-levels-ladder',
                assessment: {
                    id: 'levels-and-di',
                    question: "A guitar plugged directly into a mixing desk's line input sounds thin and weak. What is the cause, and what fixes it?",
                    options: [
                        { text: "Impedance mismatch — a guitar pickup is a high-impedance, unbalanced, instrument-level source, and a DI box converts it into a low-impedance, balanced, mic-level signal a preamp can use properly", correct: true, feedback: 'Correct — a DI box exists specifically to solve this mismatch, converting a high-impedance instrument signal into a low-impedance, balanced signal suitable for a mic preamp input.' },
                        { text: "The guitar's cable is too short; using a longer cable would fix the weak signal", correct: false, feedback: 'Cable length is not the cause here — a longer unbalanced cable would make high-frequency loss and noise pickup WORSE, not fix a level/impedance mismatch.' },
                        { text: 'The desk\'s line input is faulty; the fix is to use a different mixing desk', correct: false, feedback: 'The desk is working as designed — a line input expects a line-level signal, and an instrument-level, high-impedance guitar signal is simply the wrong type of signal for it without a DI box in between.' },
                    ],
                },
            },
            {
                id: 'order-and-routing',
                heading: 'Chain Order & Routing',
                description: "A mixing chain has a conventional order: clean-up (EQ, gating) first, then dynamics (compression), then time-based effects (delay, reverb), then limiting last to catch final peaks — each stage assumes the last already ran. Routing is a separate choice: an insert sits an effect directly in one channel's path; a send taps a copy to a shared effect, keeping the source separate from it.",
                animation: 'send-vs-insert-routing',
                assessment: {
                    id: 'order-and-routing',
                    question: 'A student places a limiter first in their mixing chain, before EQ and compression. What is wrong with this, and what is the correct order?',
                    options: [
                        { text: 'The limiter should come last — the conventional order is clean-up (EQ) first, then dynamics (compression), then time-based effects, then limiting, so each stage works on an already-processed signal rather than catching peaks before they have been shaped', correct: true, feedback: 'Correct — clean-up, then dynamics, then time-based effects, then limiting last: each stage in that order is working on the most useful version of the signal for its own job.' },
                        { text: 'Nothing is wrong — chain order makes no difference to the final sound, only the individual settings matter', correct: false, feedback: 'Order matters: a limiter placed first catches peaks before EQ or compression have shaped the signal, and later stages (especially time-based effects) then act on an already-limited, less flexible signal.' },
                        { text: 'The limiter should sit right after EQ, before any compression, because limiting and compression do the same job', correct: false, feedback: 'Limiting and compression are related but not the same job — a limiter is a hard ceiling for final peaks, which is why it belongs LAST in the chain, after dynamics and time-based processing, not straight after EQ.' },
                    ],
                },
            },
        ],
    },
];
