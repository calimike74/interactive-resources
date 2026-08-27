// The Delay bench's three levels, as three jobs rather than three lengths.
// Mike, 27 Aug 2026: "the only difference in those three levels is that
// there is just more information ... a massively missed opportunity."
//
//   Core       the bench SHOWS: names what you hear and says what to try.
//   A-level    the bench JUDGES: every setting the way the paper does,
//              setting, effect, verdict, change, and tags which half of the
//              mark each part is (AO3 names it, AO4 judges it: Q6 is 5 + 15).
//   Extension  the bench OPENS THE MACHINE: what the loop is doing, and
//              where a delay stops being a delay. None of it is on the paper.
//
// Pure functions over the model's numbers; DelayBench renders them. The
// exam facts quoted here are from the 2023 Principal Examiner's report on
// 9MT0/04 Q6 (a rock-vocal chain of compressor, EQ and delay at 120 BPM),
// held in Exemplar-Work/Analysis-Documents/C4-Examiner-Report-Extracts.

import { NOTE_VALUES, delayTimeSec, repeatMarks, highCutHz } from './delay-model.js';

export const DEPTH_LINES = {
    core: 'the bench names what you are hearing and tells you what to try, one control at a time.',
    alevel: 'the bench now judges every setting the way the paper does: setting, effect, verdict, change, with the half of the mark each part earns. Move a dial.',
    extension: 'the bench opens the machine: what the loop is doing, and where a delay stops being a delay. Move a dial.',
};

// One sentence the teacher adds at each level.
export const DEPTH_TEACH = {
    alevel: 'Write it in that order in the exam. Naming the setting is AO3; what it does, whether it suits the part and what you would change are AO4, and 15 of the 20 marks are AO4.',
    extension: "None of this is asked on the paper. It is why the A-level answers are true, and where a producer's ear starts.",
};

const fmtMs = (sec) => (sec >= 1 ? sec.toFixed(2).replace(/0$/, '') + ' s' : Math.round(sec * 1000) + ' ms');
const fmtHz = (hz) => (hz >= 19000 ? 'open' : hz >= 1000 ? (hz / 1000).toFixed(1) + ' kHz' : Math.round(hz) + ' Hz');
const FRACTION = { quarter: '1 beat', eighth: '½ beat', sixteenth: '¼ beat', half: '2 beats', dottedEighth: '¾ beat', tripletEighth: '⅓ beat' };
const NOTE_NAME = { quarter: 'a crotchet', eighth: 'a quaver', sixteenth: 'a semiquaver', half: 'a minim', dottedEighth: 'a dotted quaver', tripletEighth: 'a triplet quaver' };
const LANDS = {
    quarter: 'on the next beat',
    eighth: 'on the off-beat',
    sixteenth: 'in the gaps between the beats',
    half: 'two beats later',
    dottedEighth: 'against the beat, the classic dotted pattern',
    tripletEighth: 'in threes, a swing against the straight grid',
};

// Everything the copy needs, from the state once.
export function derive(state) {
    const delaySec = delayTimeSec(state);
    const beatSec = 60 / state.bpm;
    const barSec = beatSec * 4;
    const audible = repeatMarks({ t0: 0, amp: 1, delaySec, feedback: state.feedback, windowEnd: 8, floor: 0.01 }).length;
    const tailSec = state.feedback >= 100 ? Infinity : audible * delaySec;
    const fb = state.feedback / 100;
    const dbPass = state.feedback <= 0 ? -Infinity : state.feedback >= 100 ? 0 : 20 * Math.log10(fb);
    const beats = delaySec / beatSec;
    const onGrid = Math.abs(beats - Math.round(beats * 4) / 4) < 0.02;
    return { delaySec, beatSec, barSec, audible, tailSec, dbPass, beats, onGrid, hz: highCutHz(state.highCut), zone: timeZone(delaySec) };
}

// Where a delay time sits for the ear. Under about 30 ms the repeat fuses
// with the original (the precedence, or Haas, window: doubling and ADT live
// here); up to about 120 ms it thickens with a tail (slapback); past that it
// is a separate event the ear can place in time and count.
export function timeZone(sec) {
    if (sec < 0.03) {
        return { id: 'fused', name: 'fused', line: 'under about 30 ms the ear folds the repeat into the original: one thicker sound, not an echo. This is the window doubling and ADT live in' };
    }
    if (sec < 0.12) {
        return { id: 'slapback', name: 'slapback', line: 'between about 30 and 120 ms the repeat is separate but too close to hear as a rhythm: a thickening with a tail, the slapback' };
    }
    return { id: 'echo', name: 'echo', line: 'past about 120 ms the repeat is a separate event the ear can place in time: a delay you can count, and sync' };
}

// The highest feedback (to the nearest 5%) whose tail still clears the bar
// at this delay time, for the A-level verdict.
export function clearsAt(delaySec, barSec) {
    for (let fb = 95; fb >= 5; fb -= 5) {
        const n = repeatMarks({ t0: 0, amp: 1, delaySec, feedback: fb, windowEnd: 8, floor: 0.01 }).length;
        if (n * delaySec <= barSec) return fb;
    }
    return 5;
}

// The nearest exam note value to a free delay time, for the A-level verdict.
export function nearestNote(delaySec, bpm) {
    let best = null;
    for (const id of ['quarter', 'eighth', 'sixteenth', 'half', 'dottedEighth', 'tripletEighth']) {
        const sec = (60 / bpm) * NOTE_VALUES[id].beats;
        const err = Math.abs(sec - delaySec);
        if (!best || err < best.err) best = { id, sec, err };
    }
    return best;
}

// A-level: judge the control the student touched last, the way the paper
// does. Returns segments; each carries the half of the mark it belongs to.
export function judge({ state, last = 'preset', part = 'the part', presetName = null }) {
    const d = derive(state);
    const { delaySec, barSec, audible, tailSec, hz, zone } = d;
    const ms = fmtMs(delaySec);
    const seg = (ao, text) => ({ ao, text });

    switch (last) {
        case 'feedback': {
            if (state.feedback <= 0) {
                return [
                    seg(3, 'Feedback 0%: one repeat and nothing more.'),
                    seg(4, `Right for a slapback; wherever ${part} needs a tail, say how many repeats you want and set feedback to get them.`),
                ];
            }
            if (state.feedback >= 100) {
                return [
                    seg(3, 'Feedback 100%: nothing decays, the loop is running away and only the limiter is holding it.'),
                    seg(4, 'On a record that is either a mistake or a deliberate build; the paper credits you for saying which, and why.'),
                ];
            }
            const name = seg(3, `Feedback ${state.feedback}%: each repeat is ${state.feedback}% of the last, so about ${audible >= 30 ? '30 or more' : audible} are audible over ${fmtMs(tailSec)}.`);
            if (tailSec > barSec) {
                return [name, seg(4, `That is longer than a bar, so the repeats run into the next phrase and blur it: too high for a lead part. At about ${clearsAt(delaySec, barSec)}% they clear inside the bar.`)];
            }
            return [name, seg(4, `The repeats clear inside the bar, so the next phrase starts clean: a setting you can defend for ${part}. Feedback sets how many repeats, never how loud or how distorted.`)];
        }
        case 'time': {
            if (zone.id !== 'echo') {
                return [
                    seg(3, `Delay time ${ms}: too short to hear as a repeat, so ${part} thickens instead (${zone.name}).`),
                    seg(4, 'That is a doubling decision, not a rhythm one: say so, keep feedback near zero, and give a time under about 120 ms.'),
                ];
            }
            const near = nearestNote(delaySec, state.bpm);
            if (d.onGrid) {
                return [
                    seg(3, `Delay time ${ms}: ${d.beats.toFixed(2)} beats at ${state.bpm} BPM, so each repeat lands on a subdivision of the beat.`),
                    seg(4, `The repeats reinforce the pulse: right for a rhythmic part. The paper expects the note value named, here ${NOTE_NAME[near.id]}, and the working from the tempo.`),
                ];
            }
            return [
                seg(3, `Delay time ${ms}: ${d.beats.toFixed(2)} beats at ${state.bpm} BPM, so the repeats fall between the subdivisions.`),
                seg(4, `They fight the pulse: right only for a wash or an ambient part. For a rhythmic part sync it, or set ${fmtMs(near.sec)} for ${NOTE_NAME[near.id]}.`),
            ];
        }
        case 'sync':
        case 'bpm': {
            if (!state.sync) return judge({ state, last: 'time', part });
            const perBeat = Math.round(60000 / state.bpm);
            return [
                seg(3, `Sync ${NOTE_VALUES[state.noteId].label} at ${state.bpm} BPM: 60,000 ÷ ${state.bpm} = ${perBeat} ms a beat, × ${FRACTION[state.noteId]} = ${ms}, ${NOTE_NAME[state.noteId]}.`),
                seg(4, `Each repeat lands ${LANDS[state.noteId]}, so the tail sounds like part of the rhythm. The paper gives the tempo and expects this working: in 2023 very few candidates could tell that a delay at 120 BPM was a quaver.`),
            ];
        }
        case 'mix': {
            if (state.mix <= 0) {
                return [seg(3, 'Mix 0%: the delay is running but none of it reaches the mix.'), seg(4, 'There is nothing to evaluate at 0%: the paper wants to hear the effect and then asks whether it suits the part.')];
            }
            if (state.mix < 50) {
                return [
                    seg(3, `Mix ${state.mix}% wet: the repeats sit ${state.mix < 30 ? 'well ' : ''}behind ${part}.`),
                    seg(4, 'That is where a delay on a lead part belongs: the repeats support the line without competing with it. In 2023 "delay behind the dry signal" was a credited point.'),
                ];
            }
            if (state.mix === 50) {
                return [seg(3, 'Mix 50%: repeats and original at equal power.'), seg(4, `On a lead part that is a lot: the echo competes with the line. Defensible only if the echo is the part; otherwise bring it under 40%.`)];
            }
            return [
                seg(3, `Mix ${state.mix}% wet: the repeats are louder than ${part} itself.`),
                seg(4, 'Wrong for a lead part unless the echo is the part, a dub throw or a build. Say which, or bring it under 40% so the part stays in front.'),
            ];
        }
        case 'highCut': {
            if (hz >= 19000) {
                return [
                    seg(3, 'High cut open: every repeat keeps the full top end of the original.'),
                    seg(4, 'Bright repeats fight the dry for the same space. Pull it to 3 to 5 kHz and the repeats sit behind the part, the way tape darkens them on every pass.'),
                ];
            }
            return [
                seg(3, `High cut at ${fmtHz(hz)}: each repeat loses top end, so the repeats are darker than the dry.`),
                seg(4, `Darker repeats sit behind ${part} and stop fighting it: a mix decision, and the tape-delay character. In 2023 "high frequencies are cut" was a credited point.`),
            ];
        }
        case 'stereo': {
            if (state.stereo === 'pingpong') {
                return [
                    seg(3, 'Ping-pong: the repeats alternate left and right.'),
                    seg(4, 'That widens the part without moving the dry. Two slightly different times per side are the point, not a mistake: in 2023 candidates who argued the offset should be "fixed" were marked wrong.'),
                ];
            }
            return [
                seg(3, 'Mono delay: the repeats sit under the dry, in the centre.'),
                seg(4, `Right when ${part} must stay focused. If the mix needs width without moving the part, ping-pong is the move.`),
            ];
        }
        case 'source': {
            return [
                seg(4, `Now ${part}. The paper judges a delay against its part: a lead vocal wants the repeats behind it and clearing before the next line; drums want the repeats on the grid or not at all; a stab can carry a long tail.`),
            ];
        }
        case 'preset':
        default: {
            const p = presetName || state.presetId;
            switch (p) {
                case 'slapback':
                    return [seg(3, 'Slapback: one repeat about 110 ms behind, near-zero feedback, darkened.'), seg(4, 'A thickening, not a rhythm: right for a 1950s vocal or a snare, wrong wherever the repeats need to keep time.')];
                case 'longtail':
                    return [seg(3, 'Long tail: crotchet repeats, 65% feedback, high cut down.'), seg(4, 'The tail outlasts the bar, so it suits a held pad or an ending and blurs a busy part. Say which you have.')];
                case 'pingpong':
                    return [seg(3, 'Ping-pong 1/8 at 50% feedback, 45% wet.'), seg(4, 'Width without moving the dry. On a lead vocal keep the wet under 40%, or the sides compete with the centre.')];
                case 'paper2023':
                    return [
                        seg(3, `The 2023 paper's vocal delay: a quaver at 120 BPM (${ms}), feedback high, 25% wet, high cut, two sides.`),
                        seg(4, 'Most candidates saw the feedback was too high; very few worked out the quaver; some called the two delay times a mistake. Judge all six, then fix it.'),
                    ];
                case 'rhythmic':
                default:
                    return [seg(3, `Rhythmic 1/8: repeats ${LANDS.eighth}, ${state.feedback}% feedback, ${state.mix}% wet.`), seg(4, 'The repeats clear inside the bar and stay behind the part: the defensible setting for a rhythmic part, and the one to start from when the paper asks you to fix a chain.')];
            }
        }
    }
}

// Extension: open the machine behind the control the student touched last.
export function open({ state, last = 'preset', part = 'the part' }) {
    const d = derive(state);
    const { delaySec, audible, dbPass, hz, zone } = d;
    const ms = fmtMs(delaySec);
    switch (last) {
        case 'time':
            return `${ms}: ${zone.line}. Drag Time while it plays and the repeats bend in pitch: a delay line is a buffer read at a moving distance behind where it is written, and a moving read is a pitch change. Put an LFO on that and you have chorus (1.14).`;
        case 'sync':
        case 'bpm':
            if (!state.sync) return open({ state, last: 'time', part });
            return `Synced, the loop time is a fraction of the bar, so every repeat lands on a subdivision the ear already tracks and the tail sounds like rhythm. Off by 15 ms, the repeats drift a whole semiquaver in about ten passes at 100 BPM, which is why the paper asks for the working, not a guess.`;
        case 'feedback':
            if (state.feedback >= 100) return 'Feedback 100%: the loop gains nothing and loses nothing, so every pass comes back at the level it left. A hair over and it grows on every pass: the loop is unstable, and only the limiter after it stops the level running away.';
            if (state.feedback <= 0) return 'Feedback 0%: the loop is open, one pass and out. The same machine with the feedback path cut is a single tap; multitap delays are several of these in parallel, each with its own time and level.';
            return `Feedback ${state.feedback}%: ${dbPass.toFixed(1)} dB a pass, so the tail is a straight line on a dB scale, ${audible} passes to fall 40 dB. A held sound feeds its own repeats back on themselves: at short times that is a comb filter, heard as tone rather than as repeats.`;
        case 'mix':
            return `Mix ${state.mix}%: an equal-power crossfade, so at 50% each side is 3 dB down and the sum never dips as you turn. A straight-line crossfade would drop 6 dB in the middle, which is why a dry/wet control is built this way.`;
        case 'highCut':
            return hz >= 19000
                ? 'High cut open: the loop passes everything, so repeat ten has the same top end as repeat one. Tape and analogue delays cannot do that: each pass loses top end, which is why their tails go dull long before they go quiet.'
                : `High cut at ${fmtHz(hz)}, inside the loop, so repeat n has been through the filter n times: the darkening compounds. Put the same filter after the loop and every repeat would be equally dark; put it inside and the tail dulls as it fades, the way tape does.`;
        case 'stereo':
            return state.stereo === 'pingpong'
                ? 'Ping-pong is two delay lines with the feedback crossed: the left line feeds the right and the right feeds the left, so each repeat crosses the field once. With the two times matched it bounces; offset them by a few milliseconds and the pattern walks.'
                : 'Mono is one line feeding itself. Cross two lines instead and you have ping-pong; give the second a different time and the repeats stop being a ladder.';
        case 'source':
            return `${part[0].toUpperCase()}${part.slice(1)}: a short hit shows the loop as a ladder of separate repeats; a held phrase overlaps its own repeats, and at short times that overlap is a comb filter, the same delay heard as tone rather than rhythm.`;
        case 'preset':
        default:
            if (state.presetId === 'paper2023') return `The paper's delay: 250 ms is a quaver at 120 BPM, and its two sides sat a few milliseconds apart, enough to walk the repeats across the field, not enough to hear as a rhythm. At 80% feedback the tail is ${fmtMs(derive(state).tailSec)}, so the repeats overlap the next line and comb against it.`;
            if (state.presetId === 'slapback') return 'Slapback: 110 ms sits at the top of the slapback zone, just past where the ear would fuse it. Its feedback is near zero, so this is the loop open: one pass and out, the delay as a doubling rather than a rhythm.';
            return 'A preset is not an effect: every one of these is the same loop with four numbers changed. What separates slapback from a long tail is 110 ms against 545 ms and 5% against 65%, and nothing else in the machine.';
    }
}
