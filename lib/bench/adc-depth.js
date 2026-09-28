// The ADC Explorer's three levels, as three jobs (the pattern set on the
// Delay bench, 27 Aug 2026):
//
//   Core       the bench SHOWS: the wave going in, the samples a converter
//              takes, the levels they are rounded to, the wave the DAC
//              gives back. Names what you hear and says what to try.
//   A-level    the bench JUDGES the way the paper does: half the sample rate
//              is the highest frequency kept, what is above it is lost (or,
//              unfiltered, folds down as false tones), n bits are 2^n levels
//              and about 6 dB each.
//   Extension  the bench OPENS THE MACHINE: filter, sample and hold,
//              quantiser, and each sample as the binary word that is stored.
//
// No paper's year, code or question number is printed to a pupil (Mike,
// 28 Sep 2026). Pure functions over the model; ADCExplorer renders them.

import { SOURCES, readings, fmtKhz, fmtHzKhz, fmtLevels, nyquist, filterCutoffHz } from './adc-model.js';

export const DEPTH_LINES = {
    core: 'the bench names what you hear and says what to try. Time runs across the screen and voltage up it: the blue line is the sound going in, each dot is one sample, the gold line is what the DAC gives back.',
    alevel: 'the bench judges the setting the way the paper does. Highest frequency kept = half the sample rate; with no filter, what is above it folds down as false tones. Each bit doubles the levels and adds about 6 dB.',
    extension: 'the bench opens the converter: the filter before it, sample and hold, the quantiser, and every sample stored as a binary word. Nothing here is on the paper; all of it is why the paper\'s answers are true.',
};

export const DEPTH_TEACH = {
    alevel: 'Rate runs across: frequency. Bits run up: noise.',
    extension: 'Count the bits in each word: that is the bit depth, and each extra bit doubles the codes.',
};

const seg = (ao, text) => ({ ao, text });
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const setting = (s) => `${fmtKhz(s.rate)} and ${s.bits} bit`;

// ---- Core: the hearing line and the next move --------------------------------------
const band = (r) => `the ${r.band.name} (${r.band.lo} to ${r.band.hi} kHz)`;
const khz0 = (k) => (k < 0.1 ? '0' : fmtHzKhz(k));
export function hearingLine(state) {
    const r = readings(state);
    const heard = {
        clean: 'It comes back clean.',
        dull: r.nyquist >= 8 ? `Nothing above ${fmtKhz(r.nyquist)} is kept: the shimmer on top of the ${r.band.name} has gone.` : `The top end has gone: nothing above ${fmtKhz(r.nyquist)}, so it sounds dull.`,
        hiss: 'Quiet moments hiss: the rounding is audible.',
        grit: 'Few levels: the rounding is heard as crunch, quantisation noise, worst where it is quiet.',
        swallowed: 'So few levels that most of it rounds to silence: only the loudest moments get through.',
        alias: `The filter is off: ${band(r)} are above half the rate and fold down as false, clangy tones.`,
    }[r.key];
    return `You are hearing ${SOURCES[state.source].said} at ${setting(state)}: everything up to ${fmtKhz(r.nyquist)} kept, ${fmtLevels(state.bits)} levels. ${heard}`;
}

const PRESET_MOVES = {
    cd: 'turn Sample rate down to 8 kHz and hear the hi-hats go; then back up',
    grit: 'turn Bit depth down to 2 and watch four levels; then up to 16',
    alias: 'open More and turn the filter on: the false tones go, and so do the hi-hats',
    s900low: 'press Akai S900, 40k: the top end comes back, because that is the rate',
    s900high: 'turn Bit depth up to 16: the hiss under the quiet parts goes, because that is the bits',
};
export function nextMove(state) {
    const r = readings(state);
    if (state.presetId && PRESET_MOVES[state.presetId]) return PRESET_MOVES[state.presetId];
    if (r.key === 'alias') return 'open More and turn the filter on to hear what it was stopping';
    if (state.bits > 8 && r.key === 'clean') return 'turn Sample rate down to 8 kHz and watch the dots spread; then turn Bit depth down';
    if (state.bits > 8) return 'turn Bit depth down and watch the levels appear as lines';
    return 'switch to A-level and read the two numbers the paper asks for';
}

// ---- A-level: the judge -----------------------------------------------------------------
// The two numbers the paper turns every setting into: the highest frequency
// kept (half the rate) and the dynamic range (about 6 dB a bit).
export function judge({ state, last }) {
    const r = readings(state);
    const ny = fmtKhz(nyquist(state.rate));
    if (state.presetId === 's900low' || state.presetId === 's900high') {
        const low = state.presetId === 's900low';
        return [
            seg(3, `The sampler at ${fmtKhz(state.rate)} and ${state.bits} bit: half the rate, ${ny}, is the highest frequency kept; 2¹² is ${fmtLevels(state.bits)} levels.`),
            seg(4, low
                ? 'Against CD: poorer high-frequency reproduction (the rate), and more quantisation noise, a lower signal-to-noise ratio (the bits). Grainy, lo-fi.'
                : 'The rate now keeps nearly all you hear; the 12 bits still give about 72 dB against CD\'s 96: more noise under quiet sounds.'),
        ];
    }
    const range = `${state.bits} bit is ${fmtLevels(state.bits)} levels, about ${r.dynamicRange} dB of dynamic range`;
    if (last === 'bits' || r.key === 'grit' || r.key === 'hiss' || r.key === 'swallowed') {
        if (state.bits >= 16) {
            return [
                seg(3, `${cap(range)}: each sample is rounded to the nearest level, and the error is never more than half a step.`),
                seg(4, `The rounding sits ${r.dynamicRange} dB down, under the noise of any room: no audible quantisation noise. ${state.bits === 16 ? 'CD is 16 bit; studios record at 24 for headroom.' : 'Studios record at 24 bit for headroom.'}`),
            ];
        }
        if (state.bits > 10) {
            return [
                seg(3, `${cap(range)}. Each sample is rounded to the nearest level: quantisation.`),
                seg(4, `The rounding sits about ${r.dynamicRange} dB down: a faint hiss on quiet passages, under most music. CD's 16 bit puts it at about 96 dB.`),
            ];
        }
        return [
            seg(3, `${cap(range)}. Each sample is rounded to the nearest level: quantisation.`),
            seg(4, r.key === 'swallowed'
                ? 'So few levels that everything quieter than the first step rounds to zero: the recording mostly vanishes. Each extra bit doubles the levels and adds about 6 dB.'
                : `So few levels make the rounding loud: quantisation noise, heard as ${state.bits <= 6 ? 'crunch and distortion' : 'hiss'}, and a lower signal-to-noise ratio. Each extra bit doubles the levels and adds about 6 dB.`),
        ];
    }
    const src = SOURCES[state.source];
    if (r.key === 'alias') {
        return [
            seg(3, `${cap(src.said)} at ${fmtKhz(state.rate)} with no filter: half the rate, ${ny}, is the highest frequency kept, and ${band(r)} are above it.`),
            seg(4, `They are sampled anyway, so they alias: they fold back as false, inharmonic tones${r.fold ? ` anywhere from ${khz0(r.fold.lo)} to ${fmtHzKhz(r.fold.hi)}` : ''}. A converter filters them out first.`),
        ];
    }
    if (r.key === 'dull') {
        return [
            seg(3, `${cap(src.said)} at ${fmtKhz(state.rate)}: half the rate, ${ny}, is the highest frequency kept, under the 20 kHz a person can hear.`),
            seg(4, `A lower sample rate reduces the high-frequency content: the filter cuts everything above ${ny}${r.band.hi > r.nyquist ? `, ${band(r)} included` : ''}, so it sounds duller. 44.1 kHz keeps up to 22.05 kHz.`),
        ];
    }
    return [
        seg(3, `${cap(src.said)} at ${setting(state)}: half the rate, ${ny}, is the highest frequency kept; ${range}.`),
        seg(4, `Every frequency a person can hear, and a range wider than any room: ${state.rate === 44.1 && state.bits === 16 ? 'this is CD quality, 44.1 kHz and 16 bit.' : 'a higher rate or more bits costs file size, not audible quality.'}`),
    ];
}

// ---- Extension: the machine -----------------------------------------------------------
export function open({ state, last }) {
    const filter = state.filter
        ? `The filter cuts at ${fmtHzKhz(filterCutoffHz(state.rate) / 1000)}, just under half the rate: nothing above ${fmtKhz(nyquist(state.rate))} reaches the sampler.`
        : 'Filter off: whatever is above half the rate reaches the sampler and folds down.';
    if (last === 'bits' || last === 'dither') {
        return `The quantiser rounds each held voltage to one of ${fmtLevels(state.bits)} codes, stored as a ${state.bits}-digit binary word; the first digit is the sign. ${state.dither ? 'Dither adds a whisper of noise before the rounding, so the error becomes a steady hiss instead of grit that follows the music.' : 'Turn Dither on in More: a whisper of noise before the rounding turns the grit into a steady hiss.'}`;
    }
    return `${filter} Sample and hold freezes the voltage ${Math.round(state.rate * 1000).toLocaleString('en-GB')} times a second; the quantiser rounds each to one of ${fmtLevels(state.bits)} codes, stored as a ${state.bits}-bit word.`;
}
