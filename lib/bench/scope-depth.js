// The Oscilloscope's three levels, as three jobs (the pattern set on the
// Delay bench, 27 Aug 2026):
//
//   Core       the bench SHOWS: names what is on the screen and says what
//              to try. The period is a length, the octave a halving.
//   A-level    the bench JUDGES the way the paper does: the ladder written
//              out beside the screen (ms → s → Hz → the pitch), the
//              question's answer in the scheme's line with its year.
//   Extension  the bench OPENS THE MACHINE: the trace as samples, the file
//              as bytes a second, the 2024 file multiplied out.
//
// Every scheme line quoted here is from the 9MT0/04 and 9MT0/41 mark
// schemes as extracted from the vault's exam PDFs (2019 Q4(c)(ii), 2023
// Q2(e), 2024 Q3(b), 2025 Q3(c), 2026 Q1(d)). The 2020 LFO question has
// no scheme in the vault, so its line is the arithmetic and the stem. Pure
// functions over the model; Oscilloscope renders them.

import {
    SOURCES, OCTAVES, TIME_BASES, LFOS, TASKS, BPM,
    frequency, sourceHz, periodMs, periodS, fmtHz, fmtMs, fmtS, noteWord, levelWord, cyclesShown, lfoHz, fileMb, fmtMb, bytesPerSecond, verdict, readings,
} from './scope-model.js';

export const DEPTH_LINES = {
    core: 'the bench names what is on the screen and tells you what to try. The stage is an oscilloscope: the sound drawn against time in milliseconds, five divisions across, as the paper prints its figures. One cycle is bracketed; drag the bracket\'s end and the wave stretches or squeezes, and you hear it fall or rise. Hold the button in the play column to hear the sound as played.',
    alevel: 'the bench now works the paper\'s question beside the screen: the period read off the grid in ms, written in s, the frequency from it, the pitch that frequency sits on, each rung one mark the way the scheme awards them. Where the screen does not match the question yet, the line says what to change.',
    extension: 'the bench opens the machine: the trace as the samples a converter keeps, dots at the sample rate; and the file as bytes a second, channels times rate times depth, which is the whole of the 2024 file-size question. The More row holds the file\'s three settings.',
};

export const DEPTH_TEACH = {
    alevel: 'Write it in that order: the reading off the screen is AO3; the conversion and the answer in the scheme\'s line are AO4.',
    extension: 'The paper asks the file question with numbers only; the strip shows where the numbers come from.',
};

const seg = (ao, text) => ({ ao, text });
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const cyclesWord = (c) => (c < 1.5 ? `${c.toFixed(1)} cycles` : `${Math.round(c * 10) / 10} cycles`);

// ---- Core: the hearing line and the next move --------------------------------------
export function hearingLine(state) {
    const r = readings(state);
    const src = SOURCES[state.source];
    const what = src.kind === 'file' ? src.said : src.said;
    const pitch = `${OCTAVES[state.octave].said}${r.stretched ? `, stretched to ${fmtMs(r.ms)} a cycle` : ''}`;
    const lfo = state.lfo !== 'off' ? ` A tremolo is riding on it ${LFOS[state.lfo].said} at ${BPM} bpm, ${lfoHz(state.lfo)} times a second.` : '';
    const lvl = Math.abs(state.level) >= 0.5 ? ` The level is ${state.level > 0 ? '+' : ''}${state.level} dB: ${r.levelWord}.` : '';
    return `You are hearing ${what} ${pitch}: ${r.noteWord}, one cycle every ${fmtMs(r.ms)}, ${cyclesWord(r.cycles)} across the screen at ${TIME_BASES[state.timeBase].label} a division. The shape is ${src.shape}.${lvl}${lfo}`;
}

const PRESET_MOVES = {
    note: 'switch the source to Sine and see the same pitch as one smooth curve; then drag the bracket wider and hear the note fall',
    period: 'set the time base to 2 ms and watch the same wave show five cycles; the period has not changed, the screen has',
    octave: 'press Octave up: the trace squeezes to half its length and the note jumps an octave',
    lower: 'switch the source to Saw and press Octave down: the trace the scheme draws',
    kick: 'count the divisions in one cycle: all five, the whole screen',
    louder: 'turn Level up to +6 dB and watch the height double while the bracket stays put',
    lfo: 'press Quaver in the More row and count the swells across the screen: four in half a second',
    file: 'switch to Extension, open More, and press Stereo, then 88.2 kHz and 24 bit, reading the strip each time',
};
export function nextMove(state) {
    const v = verdict(state);
    if (v.key === 'too-long') return 'set a shorter time base until one cycle fills a division or two';
    if (v.key === 'too-short') return 'set a longer time base until a whole cycle fits on the screen';
    if (state.presetId && PRESET_MOVES[state.presetId]) return PRESET_MOVES[state.presetId];
    if (SOURCES[state.source].kind === 'osc') return 'switch to a real note and see the same period carry harmonics on it';
    return 'switch to A-level and read the ladder beside the screen';
}

// ---- A-level: the judge -----------------------------------------------------------------
const Q = {
    octave2019: '"294 × 2 / 294 + 294 (1); 588 (Hz) (2). Award 2 for 588 with no working" (2019)',
    lower2023: '"Saw wave (1); period of 2 ms (1)" (2023)',
    lower2025: '"a square wave with same amplitude as figure 1 and period of 4 ms and no DC offset (1)" (2025)',
    louder2025: '"a louder square wave with period of 2 ms and no DC offset (1)" (2025)',
    kick2026: '"1/200 (1); 0.005 / 5 × 10⁻³ (1). Award 2 marks for 0.005 with no working"; then "5 (1)" (2026)',
    pitch2025: '"award 1 mark for the correct pitch derived from the frequency ... allow description of the pitch if the candidate identifies that it is between two notes (e.g. between B and C)" (2025)',
    file2024: '"20 (1)" then "60 (1)"; "ignore working out" (2024)',
};
const ladder = (hz) => `T = ${fmtMs(periodMs(hz))} = ${fmtS(periodS(hz))}; f = 1 ÷ T = ${fmtHz(hz)}`;

export function judge({ state, last }) {
    const task = state.task ? TASKS[state.task] : null;
    const v = verdict(state);
    const r = readings(state);
    const src = SOURCES[state.source];
    if (task?.id === 'note' || task?.id === 'period' || task?.id === 'kick') {
        if (!v.ok) {
            return [
                seg(3, `${cap(src.said)} at ${fmtHz(r.hz)}: ${v.key === 'too-long' ? `${cyclesWord(r.cycles)} across the screen, too many to bracket one` : `only ${cyclesWord(r.cycles)} on the screen, so no whole cycle to read`}.`),
                seg(4, `The paper prints five divisions with one to three cycles on them. Set the time base to ${v.key === 'too-long' ? 'a shorter' : 'a longer'} value: the wave has not changed, the screen has.`),
            ];
        }
        if (task.id === 'kick') {
            return [
                seg(3, `200 Hz: one cycle every 5 ms, the whole screen at 1 ms a division; ${cyclesWord(r.cycles)} on it.`),
                seg(4, `${Q.kick2026}. The working is the ladder: T = 1 ÷ f = 1 ÷ 200 = 0.005 s, which is 5 ms; the mark for ms is only there if the seconds are right.`),
            ];
        }
        const pitchLine = task.id === 'period' ? ` The pitch: ${r.noteWord}, ${Q.pitch2025}.` : ` The pitch: ${r.noteWord}.`;
        return [
            seg(3, `${task.id === 'period' ? 'The figure' : cap(src.said)}: ${src.kind === 'osc' ? `a ${SOURCES[state.source].label.toLowerCase()} wave` : 'a repeating wave with harmonics on it'}, one cycle bracketed at ${fmtMs(r.ms)} on a ${TIME_BASES[state.timeBase].label} grid; ${cyclesWord(r.cycles)} across the screen.`),
            seg(4, `The ladder, one mark a rung: ${ladder(r.hz)}.${pitchLine}${task.id === 'period' ? ' The slip the reports name is ms written as s.' : ''}`),
        ];
    }
    if (task?.id === 'octave') {
        if (v.ok) {
            return [
                seg(3, `Octave up: the sine at 294 Hz is now at ${fmtHz(r.hz)}; the bracket is half the length it was, ${fmtMs(r.ms)} against ${fmtMs(periodMs(294))}.`),
                seg(4, `As directed: ${Q.octave2019}. An octave is a doubling of frequency and a halving of period; the working is the multiplication, and the answer alone earns both marks.`),
            ];
        }
        return [
            seg(3, `${cap(OCTAVES[state.octave].said)}: the sine sits at ${fmtHz(r.hz)}, one cycle every ${fmtMs(r.ms)}${v.key === 'wrong-way' ? ', which is the octave below, not above' : ''}.`),
            seg(4, `Not yet: the paper wants the note an octave higher, 588 Hz. ${Q.octave2019}. Press Octave up and read it off the bracket.`),
        ];
    }
    if (task?.id === 'lower') {
        if (v.ok) {
            return [
                seg(3, `An octave lower: a saw wave with a period of ${fmtMs(r.ms)}, twice the 1 ms of the square in the figure; ${cyclesWord(r.cycles)} across the screen.`),
                seg(4, `As directed: ${Q.lower2023}; the same move on the 2025 square: ${Q.lower2025}. The shape is one mark, the period the other; the amplitude does not matter, a DC offset does.`),
            ];
        }
        const why = v.key === 'wrong-shape' ? `the source is still a ${src.label.toLowerCase()} wave, and the question asks for a saw` : v.key === 'wrong-octave' ? `the saw is ${OCTAVES[state.octave].said}, ${fmtMs(r.ms)} a cycle, not the 2 ms an octave lower gives` : `the bracket has been dragged to ${fmtMs(r.ms)}; an octave lower is exactly 2 ms`;
        return [
            seg(3, `${cap(src.said)} at ${fmtHz(r.hz)}: ${why}.`),
            seg(4, `Not yet: ${Q.lower2023}. Switch the source to Saw, press Octave down, and the trace is the drawing the scheme wants.`),
        ];
    }
    if (task?.id === 'louder') {
        if (v.ok) {
            return [
                seg(3, `Louder: +6 dB, the trace ${r.levelWord}; the period is still ${fmtMs(r.ms)}, the bracket has not moved.`),
                seg(4, `As directed: ${Q.louder2025}. Louder is amplitude, the height of the wave; the period, and so the pitch, is untouched. 6 dB is a doubling of amplitude.`),
            ];
        }
        const why = v.key === 'period-moved' ? 'the period moved: louder is height, not length' : v.key === 'too-loud' ? `${state.level > 0 ? '+' : ''}${state.level} dB is ${r.levelWord}, more than the doubling the figure shows` : 'the level is unchanged, so the trace is the figure itself';
        return [
            seg(3, `The square at ${fmtHz(r.hz)}, period ${fmtMs(r.ms)}, level ${state.level > 0 ? '+' : ''}${state.level} dB: ${why}.`),
            seg(4, `Not yet: ${Q.louder2025}. Turn Level to +6 dB, and nothing else.`),
        ];
    }
    if (task?.id === 'lfo') {
        const hz = lfoHz(state.lfo);
        if (v.ok) {
            return [
                seg(3, `The LFO once a quaver at 120 bpm: a crotchet is 0.5 s, a quaver 0.25 s, so the tremolo swells ${hz} times a second; at ${TIME_BASES[state.timeBase].label} a division the screen holds ${(TIME_BASES[state.timeBase].span / 1000 * hz).toFixed(1)} of them.`),
                seg(4, `As directed: 1 ÷ 0.25 s = 4 Hz (2020). The stem gives the crotchet as 0.5 s, so the working is halving the time and inverting it. An LFO is a wave slow enough to count.`),
            ];
        }
        return [
            seg(3, state.lfo === 'off' ? `No LFO: the trace is ${src.said} with a steady height.` : `The LFO ${LFOS[state.lfo].said}: ${hz} swells a second, ${hz === 2 ? 'the crotchet rate the stem gives' : 'twice the quaver rate the question asks for'}.`),
            seg(4, `Not yet: the question asks for the LFO timed in quavers at 120 bpm: 0.25 s a cycle, 4 Hz (2020). Press Quaver in the More row and count the swells.`),
        ];
    }
    if (task?.id === 'file') {
        const mb = fileMb(state);
        if (v.ok) {
            return [
                seg(3, `The file, stereo at 88.2 kHz and 24 bit: ${fmtMb(mb)}. Twice the channels, twice the rate, one and a half times the depth: 10 × 2 × 2 × 1.5.`),
                seg(4, `As directed: ${Q.file2024}. Each of the three settings scales the size on its own; the paper wants the number, and the strip in Extension shows the multiplication.`),
            ];
        }
        return [
            seg(3, `The file as set: ${state.channels === 1 ? 'mono' : 'stereo'}, ${state.rate} kHz, ${state.depth} bit: ${fmtMb(mb)}${v.key === 'stereo' ? ', the first answer' : v.key === 'base' ? ', the paper\'s starting file' : ''}.`),
            seg(4, `${v.key === 'stereo' ? 'Half way' : 'Not yet'}: ${Q.file2024}. Stereo doubles it to 20 MB; 88.2 kHz doubles again and 24 bit adds half: 60 MB. The chips are in the More row.`),
        ];
    }
    // no stem: describe the screen
    return [
        seg(3, `${cap(src.said)} ${OCTAVES[state.octave].said}${r.stretched ? ', stretched' : ''}: one cycle every ${fmtMs(r.ms)}, ${cyclesWord(r.cycles)} across the screen at ${TIME_BASES[state.timeBase].label} a division${state.lfo !== 'off' ? `, a tremolo at ${lfoHz(state.lfo)} Hz on it` : ''}.`),
        seg(4, `No stem set: ${ladder(r.hz)}; the pitch ${r.noteWord}. Press a preset for one of the papers' questions.`),
    ];
}

// ---- Extension: the machine -----------------------------------------------------------
export function open({ state, last }) {
    const r = readings(state);
    const bps = bytesPerSecond(state);
    const perMs = state.rate;
    const samplesPerCycle = Math.round(r.ms * perMs);
    const fileLine = `The file as set is ${state.channels === 1 ? 'mono' : 'stereo'} at ${state.rate} kHz and ${state.depth} bit: ${state.channels} × ${(state.rate * 1000).toLocaleString('en-GB')} × ${state.depth} bits a second, ${Math.round(bps / 1000).toLocaleString('en-GB')} kB a second, ${fmtMb(fileMb(state))} for the 2024 paper's minute-long file that was 10 MB in mono.`;
    if (last === 'file') return `${fileLine} Each setting multiplies on its own: channels double it, the rate scales it, the depth scales it; nothing here changes the sound you hear, only the size of what is stored.`;
    return `The trace is what a converter keeps: ${state.rate} kHz is ${perMs.toLocaleString('en-GB')} samples every millisecond, so one cycle of this ${fmtHz(r.hz)} wave is ${samplesPerCycle.toLocaleString('en-GB')} dots; each dot is a ${state.depth}-bit number. ${fileLine}`;
}
