// The Piano Roll's three levels, as three jobs (the pattern set on the
// Delay bench, 27 Aug 2026):
//
//   Core       the bench SHOWS: names what the roll is playing and says
//              what to try.
//   A-level    the bench JUDGES the way the paper does: the list editor
//              open beside the roll, the papers' questions answered off
//              the file that is loaded, each part tagged with the half of
//              the mark it earns.
//   Extension  the bench OPENS THE MACHINE: the bytes on the wire, the
//              flag bit, the pitch bend's two data bytes and the two ways
//              a DAW displays them.
//
// Every scheme line quoted here is from the 9MT0/04 and 9MT0/41 mark
// schemes as extracted from the vault's exam PDFs (2019 Q2(a)-(c), 2021
// Q1(a)-(c) and Q2(a)-(c), 2022 Q1(b)-(c) and Q4, 2023 Q1(a), Q2(b)-(d),
// Q3(b), 2024 Q1(a)-(c), 2025 Q2(a)-(b) and Q3(d), 2026 Q2(b)-(c)). Pure
// functions over the model; PianoRoll renders them.

import {
    PARTS, KITS, SOUNDS, GRIDS, RANGES, TASKS, GM_MAP,
    placed, smallestValue, tripletBars, stacked, mapFaults, feelWord, velocityTable, drawCheck, verdict, selectedNote, placedTime,
    bendExtent, bendSemitones, intervalWord, noteName, toBinary, fmtPos, fmtBeat, velWord, bits8, hex2, noteOnBytes, bendBytes, bendUnsigned, BEND_MIN, otherMessages,
} from './midi-model.js';

export const DEPTH_LINES = {
    core: 'the bench names what the roll is playing and tells you what to try. The stage is the piano roll with the velocity lane under it, drawn the way your DAW draws it: drag a note in time or onto another row, drag its velocity bar, click an empty cell to add a note, double-click one to remove it. Hold the button in the play column to hear the paper\'s example.',
    alevel: 'the bench now reads the file the way the paper does: the list editor opens beside the roll, every note as a row with its position in bar, beat, division and tick and its velocity in decimal and in binary, the other messages present above them. The line answers the paper\'s question about what is loaded, each part tagged with the half of the mark it earns.',
    extension: 'the bench opens the machine: under the roll, what goes out on the wire as it plays, byte by byte. The first bit of every byte says what it is, 1 for a status byte and 0 for data, which is why a velocity stops at 127 and why a pitch bend needs two data bytes; and the two ways a DAW shows the same bend.',
};

export const DEPTH_TEACH = {
    alevel: 'Write it in that order: what the file holds is AO3; what the scheme asks and the fix are AO4, as is the practical mark.',
    extension: 'The 2021, 2023, 2024 and 2026 papers each asked one question from this strip: why 127, how many bytes, what the centre is.',
};

const seg = (ao, text) => ({ ao, text });
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const soundOn = (state, note) => SOUNDS[state.map[note]]?.label.toLowerCase() || 'nothing';

// ---- Core: the hearing line and the next move -------------------------------------
export function hearingLine(state) {
    const notes = placed(state);
    const part = PARTS[state.part];
    const v = verdict(state);
    if (!notes.length) return `You are hearing ${part.said} with an empty roll: nothing plays. Click a cell to add a note, or hold the example.`;
    if (state.part === 'drums') {
        const kit = KITS[state.kit].said;
        const f = mapFaults(state);
        const feel = feelWord(state);
        if (f.length) return `You are hearing the drum file on ${kit} with ${plural(f.length, 'lane')} on the wrong sound: the row at ${noteName(f[0].note)} plays ${soundOn(state, f[0].note)} where ${SOUNDS[f[0].want].said} should be. The rhythm is right; the kit is not.`;
        if (v.key === 'stacked') return `You are hearing the drum file quantised to ${GRIDS[state.grid].label}: ${plural(v.stacked, 'hit')} moved onto a step another hit already holds, so the roll has collapsed. The smallest note value in the part is ${GRIDS[smallestValue(state.notes.drums)]?.label || 'finer than the grid'}.`;
        const t = velocityTable(notes, 2);
        const table = t ? ` In bar 2 the loudest hit is ${t.hi.vel} (${velWord(t.hi.vel)} on ${soundOn(state, t.hi.note)}) and the quietest ${t.lo.vel} (${velWord(t.lo.vel)} on ${soundOn(state, t.lo.note)}).` : '';
        return `You are hearing the drum file on ${kit}, ${feel.word}: ${feel.feel}.${table}`;
    }
    const range = RANGES[state.bendRange];
    const ext = bendExtent(state.bends);
    const bendLine = ext.lo < 0 ? ` The bend in bar 4 falls ${intervalWord(bendSemitones(ext.lo, state.bendRange))} at a range of ${range.word}.` : '';
    if (state.task === 'draw') {
        const d = drawCheck(state);
        if (!d.drawn) return `You are hearing bar 1 of the bass on the square-wave synth; bar 2 is empty for you to draw. Hold the example to hear what goes there.`;
        return `You are hearing the bass with your bar 2: ${plural(d.drawn, 'note')} drawn, ${d.pitches} of ${d.wanted} on the right pitch at the right time${d.extra ? `, ${plural(d.extra, 'extra note')}` : ''}.${bendLine}`;
    }
    const trip = tripletBars(state.notes.bass);
    if (v.key === 'broken') return `You are hearing the bass quantised to ${GRIDS[state.grid].label}: ${plural(v.moved, 'note')} of the triplets in bar ${trip[0] || 2} have been pushed onto the sixteenth grid, so the three-to-a-beat has become a limp. That is the rhythm changed.`;
    if (trip.length) return `You are hearing the bass on the square-wave synth with bar ${trip.join(' and ')} in eighth-note triplets, three to the beat, while the other bars sit in eighths.${bendLine}`;
    return `You are hearing the bass on the square-wave synth, ${plural(notes.length, 'note')} over four bars, louder notes brighter (velocity into the filter).${bendLine}`;
}

const PRESET_MOVES = {
    velocity: 'drag the quietest hat in bar 2 up to the top of the velocity lane and hear the ghost note become an accent',
    wrong: 'select the row that plays the crash on every beat and give it the kick; do not move a note',
    roll: 'set Quantise to 1/16 at full strength and hear the roll collapse; then 1/32, and it is back',
    played: 'turn Strength up to 100 and hear the feel go; back to 50 keeps some of it',
    triplets: 'set Quantise to 1/16 and listen to bar 2 stumble; then 1/12, and the triplets are back',
    bend: 'set the range to 12 and hear the same bend become the octave the example plays; hold the example to compare',
    draw: 'hold the example and listen to bar 2; then click the cells to draw it, pitch up the side, time along the bottom',
};
export function nextMove(state) {
    if (state.presetId && PRESET_MOVES[state.presetId]) return PRESET_MOVES[state.presetId];
    const v = verdict(state);
    if (state.part === 'drums' && mapFaults(state).length) return 'give each row its own sound; the rhythm stays where it is';
    if (v.key === 'stacked' || v.key === 'broken') return `set Quantise to ${GRIDS[smallestValue(state.notes[state.part])]?.label || 'Off'} and the rhythm is whole again`;
    if (state.part === 'bass') return 'switch the lower lane to Bend and watch the data while the range dial changes the sound';
    return 'switch to A-level and read the list editor beside the roll';
}

// ---- A-level: the judge -----------------------------------------------------------
const Q = {
    table: '"1 mark for decimal, 1 for binary; allow preceding 0s" (2024, 2025)',
    why127: '"Byte is 8 bits but first bit is used / always 0 (1); (to indicate) data byte (1); velocity is 7 bits (1); 2^7 (1)" (2026)',
    map2019: '"1 mark for each correctly assigned drum sound that plays the correct rhythm, in sync throughout" (2019)',
    crash2019: '"the crash more crash-like than the ride" (2019)',
    notAcoustic: '"Max 4 if the drum kit is not acoustic" (2019); "Max 5 if the kit is not acoustic" (2024)',
    smallest2023: '"A, B, D are incorrect because the smallest note value is 1/16" (2023)',
    smallest2022: '"B, C, D are incorrect because the smallest note value is 1/64 in the hi-hats" (2022)',
    feel2025: '"Unquantised / gently quantised / groove quantise / swing quantise / percent quantise / humanise: loose / live / human / realistic feel" against "hard quantised / 1/16 / 1/8: mechanical / tight(er) / in time" (2025)',
    trap2020: '"Identify a bar where quantising to 1/16 would incorrectly change the rhythm" (2020)',
    bend2023: '"Pitch bend range is 12 semitones (1)" (2023)',
    bend2022: '"MIDI pitch bend changes vox pitch in some small way, i.e. 2 semitones" is 1 mark of 3; "matches" is 3 (2022)',
    bend2026: '"Pitch bend range is one octave (1)" (2026)',
};

export function judge({ state, last }) {
    const task = state.task && TASKS[state.task].part === state.part ? TASKS[state.task] : null;
    const v = verdict(state);
    const notes = placed(state);
    if (task?.id === 'velocity') {
        const t = velocityTable(notes, 2);
        if (!t) return [seg(3, 'Velocity table: bar 2 is empty, so there is nothing to read.'), seg(4, 'Add a hit to bar 2, or press the preset again.')];
        return [
            seg(3, `Velocity table: the highest velocity in bar 2 is ${t.hi.vel}, in binary ${toBinary(t.hi.vel)}, on ${soundOn(state, t.hi.note)}; the lowest is ${t.lo.vel}, ${toBinary(t.lo.vel)}, on ${soundOn(state, t.lo.note)}. ${plural(t.distinct, 'different value')} in the bar.`),
            seg(4, `${Q.table}. Seven digits because a data byte keeps its first bit at 0: ${Q.why127}.`),
        ];
    }
    if (task?.id === 'map') {
        const f = mapFaults(state);
        if (!f.length) {
            return [
                seg(3, `Wrong sounds, fixed: every row plays its own sound on ${KITS[state.kit].said}, the rhythm untouched, the crash distinct from the ride.`),
                seg(4, `As directed: ${Q.map2019}; ${Q.crash2019}. ${state.kit === 'acoustic' ? 'An acoustic kit, as the stem says.' : `The stem said an acoustic kit: ${Q.notAcoustic}.`}`),
            ];
        }
        const first = f[0];
        return [
            seg(3, `Wrong sounds: ${plural(f.length, 'row')} on the wrong sound. ${noteName(first.note)} plays ${soundOn(state, first.note)} where ${SOUNDS[first.want].said} should be${f[1] ? `; ${noteName(f[1].note)} plays ${soundOn(state, f[1].note)} for ${SOUNDS[f[1].want].said}` : ''}. The rhythm is the file's and must stay so.`),
            seg(4, `Not yet: ${Q.map2019}. Change the sound on each row, never the notes; ${Q.crash2019}.`),
        ];
    }
    if (task?.id === 'quantise') {
        const ans = GRIDS[task.answer].label;
        if (v.key === 'stacked') {
            return [
                seg(3, `Hi-hat roll, quantised to ${GRIDS[state.grid].label} at ${state.strength}%: ${plural(v.stacked, 'hit')} moved onto a step another hit already holds; the roll in bars 2 and 4 is gone.`),
                seg(4, `Not as directed: the most appropriate value is ${ans}, the smallest note value present. ${Q.smallest2023}; ${Q.smallest2022}. Set ${ans} and every hit keeps its step.`),
            ];
        }
        return [
            seg(3, `Hi-hat roll: the hat runs in thirty-seconds through beats 3 and 4 of bars 2 and 4, rising from ${velWord(52)} to ${velWord(100)}; the rest of the part sits on sixteenths. The smallest note value present is ${ans}.`),
            seg(4, `The most appropriate quantise value is ${ans}: ${Q.smallest2022}; ${Q.smallest2023}. Any coarser value moves hits onto steps already taken.`),
        ];
    }
    if (task?.id === 'feel') {
        const f = feelWord(state);
        const raw = state.notes.drums;
        const off = Math.round(raw.reduce((a, n) => a + Math.abs(n.t - Math.round(n.t * 4) / 4), 0) / raw.length * (60000 / 96));
        if (f.key === 'loose') {
            return [
                seg(3, `Played: the hits sit up to about 28 ms off the sixteenth grid, ${off} ms on average, and the velocities breathe; unquantised, a loose, live feel.`),
                seg(4, `The 2025 comparison: ${Q.feel2025}. One mark a type, one a feel word. Turn Strength up and name what changes.`),
            ];
        }
        if (f.key === 'hard') {
            return [
                seg(3, `Played, then hard quantised to ${GRIDS[state.grid].label}: every hit exactly on its step, the velocities still varied; mechanical, tight, in time.`),
                seg(4, `${Q.feel2025}. Hard quantise is the synth's side of that answer; the drums' side is what you heard at 0%.`),
            ];
        }
        return [
            seg(3, `Played, ${state.strength}% quantise to ${GRIDS[state.grid].label}: each hit moved ${state.strength}% of the way to its step, so the pushes and drags are smaller but still there.`),
            seg(4, `Percent quantise: ${Q.feel2025}. Between the two answers the paper gives, and the one a producer usually picks.`),
        ];
    }
    if (task?.id === 'triplets') {
        const bars = tripletBars(state.notes.bass);
        if (v.key === 'broken') {
            return [
                seg(3, `Triplet trap, quantised to ${GRIDS[state.grid].label}: ${plural(v.moved, 'note')} of the three-to-a-beat in bar ${bars[0] || task.bar} have been pushed onto sixteenths, and the bar limps where it rolled.`),
                seg(4, `Not as directed: ${Q.trap2020}: bar ${task.bar}. The grid that holds a triplet is 1/12, three to the beat (offered in 2021 Q1(a)). Set 1/12 and the bar is whole.`),
            ];
        }
        return [
            seg(3, `Triplet trap: bar ${bars.join(' and ') || task.bar} runs in eighth-note triplets, three to the beat, while bars ${[1, 3, 4].join(', ')} sit in eighths. Every triplet note lands on the 1/12 grid and misses the 1/16 grid.`),
            seg(4, `${Q.trap2020}: bar ${task.bar}. The most appropriate value for the part is 1/12, as the 2021 paper offered for its bass. Set 1/16 at full strength and hear what the question means.`),
        ];
    }
    if (task?.id === 'bend') {
        const ext = bendExtent(state.bends);
        const semis = bendSemitones(ext.lo, state.bendRange);
        const word = intervalWord(semis);
        if (v.ok) {
            return [
                seg(3, `Bend range: the lane in bar 4 runs from centre (0) to full downward (${BEND_MIN}) and back over two beats; at a range of ${RANGES[state.bendRange].word} the long A falls an octave, as the example does.`),
                seg(4, `As directed: ${Q.bend2023}; ${Q.bend2026}. The data never changed; the synth's range did. That is what "match the pitch bend range" means.`),
            ];
        }
        return [
            seg(3, `Bend range: the lane in bar 4 runs from centre to full downward (${BEND_MIN}) and back, the same data as the example; at a range of ${RANGES[state.bendRange].word} the long A falls only ${word}.`),
            seg(4, `Not as directed: ${Q.bend2022}. ${Q.bend2023}. Set the range to 12 and the same lane plays the octave.`),
        ];
    }
    if (task?.id === 'draw') {
        const d = drawCheck(state);
        if (!d.drawn) {
            return [
                seg(3, `Draw the part: bar 1 is given, ${plural(d.wanted, 'note')} in eighths from A0 up to A1; bar 2 is empty.`),
                seg(4, 'The paper marks the pitches and the rhythm separately. Hold the example, then click the cells: the row is the pitch, the column the beat.'),
            ];
        }
        if (v.ok) {
            return [
                seg(3, `Draw the part: bar 2 drawn, ${plural(d.drawn, 'note')}, every onset on its eighth and every pitch as the example plays it.`),
                seg(4, 'As directed: pitches right, rhythm right, nothing extra. In the paper the roll is on the page and the example is in your headphones; the method is the same.'),
            ];
        }
        return [
            seg(3, `Draw the part: ${plural(d.drawn, 'note')} in bar 2; ${d.onsets} of ${d.wanted} onsets right, ${d.pitches} of ${d.wanted} pitches right${d.extra ? `, ${plural(d.extra, 'note')} where the example has none` : ''}.`),
            seg(4, `Not yet: ${d.rhythm ? 'the rhythm is right, so the marks left are pitch: move the wrong rows' : 'the rhythm is off, and a pitch on the wrong beat earns neither mark'}. Hold the example and match it one beat at a time.`),
        ];
    }
    // no stem: describe the file
    const sel = selectedNote(state);
    if (state.part === 'drums') {
        const f = mapFaults(state);
        const t = velocityTable(notes, 2);
        return [
            seg(3, `The drum file on ${KITS[state.kit].said}: ${plural(notes.length, 'note')} over four bars, ${feelWord(state).word}${f.length ? `, ${plural(f.length, 'row')} on the wrong sound` : ''}${t ? `; bar 2 runs from velocity ${t.lo.vel} (${toBinary(t.lo.vel)}) to ${t.hi.vel} (${toBinary(t.hi.vel)})` : ''}.`),
            seg(4, `No stem set: press a preset for one of the papers' questions. ${sel ? `The selected note is ${noteName(sel.note)}, ${soundOn(state, sel.note)}, at ${fmtPos(placedTime(sel.t, state.grid, state.strength))}, velocity ${sel.vel}.` : 'Select a note to read its row.'}`),
        ];
    }
    const ext = bendExtent(state.bends);
    return [
        seg(3, `The bass file on the square-wave synth: ${plural(notes.length, 'note')} over four bars, smallest note value ${GRIDS[smallestValue(state.notes.bass)]?.label || 'unquantised'}; the bend in bar 4 reaches ${ext.lo}, ${intervalWord(bendSemitones(ext.lo, state.bendRange))} at a range of ${RANGES[state.bendRange].word}.`),
        seg(4, `No stem set: press a preset for one of the papers' questions. ${sel ? `The selected note is ${noteName(sel.note)} at ${fmtPos(placedTime(sel.t, state.grid, state.strength))}, velocity ${sel.vel} (${toBinary(sel.vel)}).` : 'Select a note to read its row.'}`),
    ];
}

// ---- Extension: the machine -----------------------------------------------------------
export function open({ state, last }) {
    const part = PARTS[state.part];
    const sel = selectedNote(state);
    if (sel) {
        const b = noteOnBytes(part.channel, sel.note, sel.vel);
        const on = `${noteName(sel.note)} at velocity ${sel.vel} goes out as three bytes: ${bits8(b[0])} (status: Note On, channel ${part.channel}), ${bits8(b[1])} (note ${sel.note}), ${bits8(b[2])} (velocity ${sel.vel}).`;
        if (state.part === 'bass' && (state.lane === 'bend' || last === 'range' || last === 'lane')) {
            const ext = bendExtent(state.bends);
            const lo = bendBytes(part.channel, ext.lo);
            return `The pitch bend is three bytes too: ${bits8(lo[0])} (status: Pitch Bend, channel ${part.channel}) then two data bytes, ${bits8(lo[1])} and ${bits8(lo[2])}, 7 bits each, 14 together: 16,384 values instead of 128. At the bottom of this bend the pair reads ${bendUnsigned(ext.lo)}, shown as ${ext.lo} by a DAW that counts from the centre and 0 by one that counts from the bottom; the centre is 0 in one and 8192 in the other. The range is the synth's, not the file's.`;
        }
        return `${on} The first bit of each byte is the flag: 1 for a status byte, 0 for data, which leaves 7 bits, 128 values, 0 to 127; that is the 2021 and 2026 question. Two Note Ons a moment apart need two messages each; a pitch bend needs two data bytes for its 14 bits.`;
    }
    return `Nothing selected. Every message on the wire is a status byte (first bit 1) followed by data bytes (first bit 0): Note On, Note Off, a controller, a pitch bend. Select a note and the strip shows its bytes as they go out.`;
}

// The other messages, as one line for the list editor's head.
export const othersLine = (state) => otherMessages(state).join(' · ');
export { fmtBeat, hex2 };
