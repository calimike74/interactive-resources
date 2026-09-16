// The Sequence bench's three levels, as three jobs (the pattern set on the
// Delay bench, 27 Aug 2026):
//
//   Core       the bench SHOWS: names what the sixteen steps are playing
//              and says what to try.
//   A-level    the bench JUDGES the way the paper does: the feel a
//              quantise gives (the 2025 comparison), what a low-pass
//              filter does to the sound (the 2024 report), and how a part
//              was put in (the spec's two ways). Each part tagged with the
//              half of the mark it earns.
//   Extension  the bench OPENS THE MACHINE: the sequencer as a clock, the
//              milliseconds a step and a swing are, and the voice as a chain
//              of oscillators, filter and amplifier, one tap a screen.
//
// Every scheme and report line quoted here is one already on the estate,
// checked against the vault's exam PDFs when the Piano Roll and the Synth
// bench were built (lib/bench/midi-depth.js, lib/bench/synth-depth.js).
// The spec's own words for 1.5 are lib/topics.js's summary of area 1.5.
// Pure functions over the model; SequenceBench renders them.

import {
    PRESETS, presetOf, TASKS, KEY_SIG,
    counts, verdict, stepMs, swingMs, barMs, resToQdb, fmtHz, noteName, bassMidi, CHORDS, LOOKAHEAD_MS,
} from './seq-model.js';

export const DEPTH_LINES = {
    core: 'the bench names what the sixteen steps are sending and tells you what to try. Click a step to light it; on the Bass and Chord rows drag up or down to change the note; drag along a drum row to paint. The screen beside the grid is the wave after the filter, and the keys in the console play the same voice.',
    alevel: 'the bench now judges the pattern the way the paper does: the feel a quantise gives, what the low-pass filter is taking away, how the part was put in. The screen is the spectrum under the filter\'s own curve, in gold: drag the curve and the Cutoff dial follows. Each part of the line is tagged with the half of the mark it earns.',
    extension: 'the bench opens the machine: a sequencer is a clock, and a step and a swing are milliseconds it books ahead. The screen is the voice as a chain, oscillators, filter, amplifier, output, each a tap on the real signal, so the envelope and the filter are seen taking level away in order.',
};

export const DEPTH_TEACH = {
    alevel: 'Write it in that order: what the pattern holds and what the control is set to (AO3), then what that does to the sound and which of the paper\'s words fit (AO4).',
    extension: 'The 2024 report on the filter: candidates "would discuss what resonance was but didn\'t discuss its impact on the sound". The chain is the impact, screen by screen.',
};

const Q = {
    feel2025: '"Unquantised / gently quantised / groove quantise / swing quantise / percent quantise / humanise: loose / live / human / realistic feel" against "hard quantised / 1/16 / 1/8: mechanical / tight(er) / in time" (2025)',
    filter2024: '"many learners misidentified it as a boost/cut rather than an LPF and would discuss what resonance was but didn\'t discuss its impact on the sound" (2024)',
    filterEnv2019: '"only the top performing candidates noticed that the envelope parameters were routed to the filter cutoff and not the amplitude" (2019)',
    spec: 'the spec names "real-time input via MIDI keyboard and non-real-time input via step grid" and "quantise: hard values, swing/percentage"',
};

const seg = (ao, text) => ({ ao, text });
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const ms = (v) => `${Math.round(v)} ms`;
const presetName = (state) => presetOf(state.presetId)?.name.toLowerCase() || 'your pattern';

// ---- Core: the hearing line and the next move -------------------------------------
export function hearingLine(state) {
    const c = counts(state);
    if (!c.all) return `You are hearing an empty grid at ${state.tempo} bpm: nothing plays until a step is lit. Click a step, or press a preset.`;
    const drums = [c.kick && `${plural(c.kick, 'kick')}`, c.snare && `${plural(c.snare, 'snare')}`, c.hat && `${plural(c.hat, 'hat')}`].filter(Boolean).join(', ') || 'no drums';
    const synth = c.bass || c.chord
        ? `${[c.bass && `${plural(c.bass, 'bass note')}`, c.chord && `${plural(c.chord, 'chord')}`].filter(Boolean).join(' and ')} in ${KEY_SIG} through the low-pass filter at ${fmtHz(state.cutoff)}`
        : 'no synth steps';
    const swing = state.swing ? `, swing ${state.swing}% (every second sixteenth ${ms(swingMs(state.tempo, state.swing))} late)` : '';
    return `You are hearing ${presetName(state)} at ${state.tempo} bpm: ${drums}; ${synth}${swing}.`;
}

const PRESET_MOVES = {
    bass: 'turn Cutoff down to 300 Hz and watch the wave lose its corners; then Resonance up, and hear the edge ring',
    swing: 'take Swing to 0 and hear the hats stand up straight; then back to 45, and every second sixteenth leans late again',
    sweep: 'watch the Cutoff dial climb over four bars and the harmonics arrive low first; drag the gold curve and the sweep stops',
    played: 'arm Record, press Play, and play a key on the piano: your note lands on the nearest step, quantised on entry',
    straight: 'raise Swing to 40 and name the feel word that changes; the hats move, the kick and snare hold the grid',
};
export function nextMove(state) {
    if (state.presetId && PRESET_MOVES[state.presetId]) return PRESET_MOVES[state.presetId];
    const c = counts(state);
    if (!c.all) return 'light a kick on steps 01, 05, 09 and 13, then a bass note on 01, and the pattern starts';
    if (!c.bass && !c.chord) return 'light a Bass step and drag it up or down: the note name changes with the pitch';
    if (state.record) return 'press Play and play a key: each one is written to the Bass row at the playhead';
    return 'switch to A-level and drag the gold curve across the spectrum';
}

// ---- A-level: the judge -----------------------------------------------------------
export function judge({ state, last }) {
    const task = state.task ? TASKS[state.task] : null;
    const v = verdict(state);
    const c = counts(state);
    if (task?.id === 'feel') {
        const late = ms(swingMs(state.tempo, state.swing));
        if (v.key === 'straight') {
            return [
                seg(3, `Straight: sixteenth hats hard quantised to the grid at ${state.tempo} bpm, every hit on its step, Swing at 0. Mechanical, tight, in time.`),
                seg(4, `The 2025 comparison: ${Q.feel2025}. This is the second answer. Raise Swing and every second sixteenth lands late: that is the first.`),
            ];
        }
        if (v.key === 'gentle') {
            return [
                seg(3, `Gently swung: Swing at ${state.swing}%, every second sixteenth ${late} late, the hats lean without shuffling; the kick and snare hold the grid.`),
                seg(4, `${Q.feel2025}. A small swing sits with "gently quantised" on the loose side; the scheme wants the type and a feel word, one mark each.`),
            ];
        }
        return [
            seg(3, `Swing quantise at ${state.swing}%: every second sixteenth ${late} late at ${state.tempo} bpm, so the hats lilt while the kick and snare stay on the beat.`),
            seg(4, `${Q.feel2025}. Swing quantise earns the loose, live word; hard quantise the tight one. Take Swing to 0 to hear the other answer.`),
        ];
    }
    if (task?.id === 'filter') {
        const q = resToQdb(state.res).toFixed(1);
        if (v.key === 'sweep') {
            return [
                seg(3, `Filter sweep: the cutoff climbs from 260 Hz to 6 kHz over four bars with Resonance at ${state.res}% (a ${q} dB peak at the corner), on a bass line in ${KEY_SIG}.`),
                seg(4, `The 2024 report: ${Q.filter2024}. Say the impact: as the cutoff rises the upper harmonics pass and the bass brightens, and the peak rides the edge as it goes.`),
            ];
        }
        const where = v.key === 'closed' ? 'below the bass line\'s harmonics, so only the fundamental and the first few pass' : v.key === 'open' ? 'above most of the saw\'s harmonics, so nearly all of them pass' : 'inside the harmonics, so the top of the saw is cut and the low ones pass';
        return [
            seg(3, `Low-pass filter: Cutoff at ${fmtHz(state.cutoff)}, Resonance ${state.res}% (${q} dB at the corner). The cutoff sits ${where}.`),
            seg(4, `${Q.filter2024}. The impact is what the blue spectrum lost against the grey: ${v.key === 'closed' ? 'a dull, rounded bass' : v.key === 'open' ? 'a bright, buzzing saw' : 'a bass with its edge taken off'}. Drag the gold curve and say what changes.`),
        ];
    }
    if (task?.id === 'input') {
        if (v.key === 'empty') {
            return [
                seg(3, 'The way in: the Bass row is empty, so there is nothing to say how it was entered.'),
                seg(4, `${Q.spec}. Click a step for the grid, or arm Record and play a key for the keyboard.`),
            ];
        }
        if (v.key === 'played') {
            return [
                seg(3, `Played in: ${plural(c.played, 'bass note')} came from the keys in real time and ${c.played === 1 ? 'was' : 'were'} quantised to the sixteenth on entry${c.stepped ? `; ${plural(c.stepped, 'note')} ${c.stepped === 1 ? 'was' : 'were'} stepped in on the grid` : ''}.`),
                seg(4, `${Q.spec}. Both land on a step, so the roll cannot tell them apart; the way in is the difference, and quantising on entry is what makes a played line sit as tight as a stepped one.`),
            ];
        }
        return [
            seg(3, `Stepped in: ${plural(c.bass, 'bass note')} placed on the grid one step at a time, none played from the keys.`),
            seg(4, `${Q.spec}. Step input is the non-real-time way: exact, and mechanical unless a swing is added. Arm Record and play the same line to hear the other way in.`),
        ];
    }
    // no task: describe the pattern
    const parts = [];
    if (c.bass) parts.push(plural(c.bass, 'bass note'));
    if (c.chord) parts.push(plural(c.chord, 'chord'));
    const drums = c.kick + c.snare + c.hat;
    return [
        seg(3, `${presetName(state).charAt(0).toUpperCase() + presetName(state).slice(1)}: ${plural(drums, 'drum hit')}, ${parts.join(' and ') || 'no synth steps'}, at ${state.tempo} bpm, Cutoff ${fmtHz(state.cutoff)}, Resonance ${state.res}%, Swing ${state.swing}%.`),
        seg(4, `No question set: press Hats and swing for the 2025 feel comparison, Filter sweep for the 2024 report's filter, or Played in for the spec's two ways of putting a part in.${last === 'cell' ? ' The step you changed is in the grid.' : ''}`),
    ];
}

// ---- Extension: the machine -----------------------------------------------------------
export function open({ state, last }) {
    const step = stepMs(state.tempo);
    const bar = barMs(state.tempo);
    const swing = state.swing ? ` Swing holds every second step back by ${ms(swingMs(state.tempo, state.swing))}, which the clock adds to that step's time and nothing else.` : '';
    const chain = `Each note is two sawtooth oscillators nine cents apart into its own low-pass filter, set from one shared cutoff (${fmtHz(state.cutoff)}, ${resToQdb(state.res).toFixed(1)} dB at the corner), into an amplifier the envelope closes over ${state.decay} ms.`;
    if (last === 'cutoff' || last === 'res' || last === 'decay') {
        return `${chain} The four screens are taps on that chain: the oscillators run whether or not the amplifier is open, the filter takes the top off, the envelope takes the level away, and the output is what the master sends on at true scale.`;
    }
    return `A sequencer is a clock. At ${state.tempo} bpm a sixteenth is ${ms(step)} and a bar ${ms(bar)}; the bench books each step ${LOOKAHEAD_MS} ms before it sounds, so nothing waits on the screen.${swing} ${chain}`;
}

// The chord and note names for the reference tab's table.
export const chordTable = () => CHORDS.map((c) => ({ name: c.name, notes: c.notes.map(noteName).join(' ') }));
export const bassRange = () => `${noteName(bassMidi(0))} to ${noteName(bassMidi(11))}`;
export { PRESETS };
