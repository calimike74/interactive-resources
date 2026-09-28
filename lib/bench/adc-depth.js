// The ADC Explorer's three levels, as three jobs (the pattern set on the
// Delay bench, 27 Aug 2026):
//
//   Core       the bench SHOWS: the wave going in, the samples a converter
//              takes, the levels they are rounded to, the wave the DAC
//              gives back. Names what you hear and says what to try.
//   A-level    the bench JUDGES the way the paper does: half the sample rate
//              is the highest frequency kept, a tone above it comes back as
//              a false lower one, n bits are 2^n levels and about 6 dB each.
//   Extension  the bench OPENS THE MACHINE: filter, sample and hold,
//              quantiser, and each sample as the binary word that is stored.
//
// No paper's year, code or question number is printed to a pupil (Mike,
// 28 Sep 2026). Pure functions over the model; ADCExplorer renders them.

import { SOURCES, readings, fmtKhz, fmtHzKhz, fmtLevels, nyquist, filterCutoffHz } from './adc-model.js';

export const DEPTH_LINES = {
    core: 'the bench names what you hear and says what to try. Time runs across the screen and voltage up it: the blue line is the sound going in, each dot is one sample, the gold line is what the DAC gives back.',
    alevel: 'the bench judges the setting the way the paper does. Half the sample rate is the highest frequency kept; above it a tone returns as a false, lower one. Each bit doubles the levels and adds about 6 dB.',
    extension: 'the bench opens the converter: the filter before it, sample and hold, the quantiser, and every sample stored as a binary word. Nothing here is on the paper; all of it is why the paper\'s answers are true.',
};

export const DEPTH_TEACH = {
    alevel: 'AO3 names the setting and its number; AO4 says what it does to the sound, and why.',
    extension: 'Count the bits in each word: that is the bit depth, and each extra bit doubles the codes.',
};

const seg = (ao, text) => ({ ao, text });
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const perCycle = (spc) => (Number.isInteger(spc) ? `${spc}` : spc.toFixed(1));
const setting = (s) => `${fmtKhz(s.rate)} and ${s.bits} bit`;

// ---- Core: the hearing line and the next move --------------------------------------
export function hearingLine(state) {
    const r = readings(state);
    const src = SOURCES[state.source];
    const what = r.isTone ? `a ${fmtHzKhz(state.tone)} test tone` : src.said;
    const rate = r.isTone
        ? `${perCycle(r.spc)} samples a cycle`
        : `everything up to ${fmtKhz(r.nyquist)} kept`;
    const heard = {
        clean: 'It comes back clean.',
        dull: 'The top end has gone: it sounds dull, like a phone.',
        hiss: 'Quiet moments hiss: the rounding is audible.',
        grit: 'Few levels: the rounding is heard as crunch, quantisation noise, worst where it is quiet.',
        swallowed: 'So few levels that most of it rounds to silence: only the loudest moments get through.',
        alias: r.isTone ? `It comes back as a false ${fmtHzKhz(r.alias)} tone: aliasing.` : 'The filter is off: high sounds fold down into false, metallic ones.',
        filtered: 'The filter before the converter took it out: nothing comes back.',
        edge: 'Exactly two a cycle: the samples can miss the wave, as they do here, so almost nothing comes back.',
    }[r.key];
    return `You are hearing ${what} at ${setting(state)}: ${rate}, ${fmtLevels(state.bits)} levels. ${heard}`;
}

const PRESET_MOVES = {
    cd: 'turn Sample rate down to 8 kHz and hear the cymbals go; then back up',
    two: 'turn Sample rate up to 20 kHz and count the dots in one division',
    crusher: 'turn Bit depth up to 16: the crunch goes, the dull, clangy top stays, because that is the rate',
    grit: 'turn Bit depth down to 2 and watch four levels; then up to 16',
    alias: 'turn Sample rate up past 6 kHz and hear the false tone rise into the real one',
    judge: 'open More and turn the filter on: the false tone goes, and so does the real one',
};
export function nextMove(state) {
    const r = readings(state);
    if (state.presetId && PRESET_MOVES[state.presetId]) return PRESET_MOVES[state.presetId];
    if (r.key === 'alias' && r.isTone) return 'turn Sample rate up until the gold line follows the blue one';
    if (r.key === 'edge') return 'turn Sample rate up one step: more than two a cycle and the tone comes back';
    if (r.key === 'filtered') return 'open More and turn the filter off to hear what it was stopping';
    if (state.bits > 8) return 'turn Bit depth down and watch the levels appear as lines';
    if (r.isTone) return 'switch the source to Vocal and hear the same setting on a voice';
    return 'switch to A-level and read the two numbers the paper asks for';
}

// ---- A-level: the judge -----------------------------------------------------------------
// The two numbers the paper turns every setting into: the highest frequency
// kept (half the rate) and the dynamic range (about 6 dB a bit).
export function judge({ state, last }) {
    const r = readings(state);
    const ny = fmtKhz(nyquist(state.rate));
    if (state.presetId === 'crusher') {
        return [
            seg(3, `A bit crusher: sample rate down to ${fmtKhz(state.rate)} with no filter, bit depth down to ${state.bits} bit, ${fmtLevels(state.bits)} levels.`),
            seg(4, 'Lo-fi: less high-frequency content and aliasing from the rate; quantisation noise, crunch and a lower signal-to-noise ratio from the bits. Name both dials.'),
        ];
    }
    const range = `${state.bits} bit is ${fmtLevels(state.bits)} levels, about ${r.dynamicRange} dB of dynamic range`;
    if (last === 'bits' || (!r.isTone && (r.key === 'grit' || r.key === 'hiss' || r.key === 'swallowed'))) {
        if (state.bits >= 16) {
            return [
                seg(3, `${cap(range)}: each sample is rounded to the nearest level, and the error is never more than half a step.`),
                seg(4, `At ${state.bits} bit the rounding sits ${r.dynamicRange} dB under full scale, below the noise of any room: no audible quantisation noise. ${state.bits === 16 ? 'CD is 16 bit; studios record at 24 for the headroom.' : 'Studios record at 24 bit so quiet takes keep their detail.'}`),
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
    if (r.isTone) {
        const f = fmtHzKhz(state.tone);
        if (r.key === 'alias') {
            return [
                seg(3, `Sample rate ${fmtKhz(state.rate)}: half of it, ${ny}, is the highest frequency kept. The ${f} tone is above it.`),
                seg(4, `So it aliases: the dots fit a false ${fmtHzKhz(r.alias)} tone, the gold line. To keep it, sample at more than twice ${f}, over ${fmtKhz(state.tone * 2)}; or filter it out first.`),
            ];
        }
        if (r.key === 'edge') {
            return [
                seg(3, `Sample rate ${fmtKhz(state.rate)}: exactly twice the ${f} tone, two samples a cycle.`),
                seg(4, 'Not enough: where the samples land is luck, and here all of them sit on the centre line. The rule is more than twice the highest frequency: CD samples at 44.1 kHz for sounds up to 20 kHz.'),
            ];
        }
        if (r.key === 'filtered') {
            return [
                seg(3, `Sample rate ${fmtKhz(state.rate)}, highest frequency kept ${ny}. The anti-alias filter stops the ${f} tone before it is sampled.`),
                seg(4, 'Nothing aliases: the tone is lost, not turned into a false one. A lower sample rate loses high frequencies.'),
            ];
        }
        return [
            seg(3, `Sample rate ${fmtKhz(state.rate)}: half is ${ny}, above the ${f} tone; ${perCycle(r.spc)} samples a cycle.`),
            seg(4, `More than two a cycle, so the DAC draws the same tone back: the gold line lies on the blue. ${state.rate >= 44.1 ? 'Every frequency a person can hear is kept.' : `Anything above ${ny} would be lost or would alias.`}`),
        ];
    }
    const src = SOURCES[state.source];
    if (r.key === 'alias') {
        return [
            seg(3, `${cap(src.said)} at ${fmtKhz(state.rate)} with no filter: everything above ${ny} is sampled anyway.`),
            seg(4, 'It aliases: those high frequencies fold back under half the rate as false, inharmonic tones, heard as a metallic, clangy edge. A converter filters them out first, for exactly this reason.'),
        ];
    }
    if (r.key === 'dull') {
        return [
            seg(3, `${cap(src.said)} at ${fmtKhz(state.rate)}: the highest frequency kept is ${ny}, under the 20 kHz a person can hear.`),
            seg(4, `A lower sample rate reduces the high-frequency content: the cymbals, breath and air above ${ny} are gone, so it sounds dull. 44.1 kHz keeps up to 22.05 kHz, just over the top of hearing.`),
        ];
    }
    return [
        seg(3, `${cap(src.said)} at ${setting(state)}: up to ${ny} kept; ${range}.`),
        seg(4, `Every frequency a person can hear, and a range wider than any room: ${state.rate === 44.1 && state.bits === 16 ? 'this is CD quality, 44.1 kHz and 16 bit.' : 'a higher rate or more bits costs file size, not audible quality.'}`),
    ];
}

// ---- Extension: the machine -----------------------------------------------------------
export function open({ state, last }) {
    const r = readings(state);
    const bitsPerSecond = Math.round(state.rate * 1000 * state.bits).toLocaleString('en-GB');
    const filter = state.filter
        ? `The filter cuts at ${fmtHzKhz(filterCutoffHz(state.rate) / 1000)}, just under half the rate: nothing above ${fmtKhz(nyquist(state.rate))} reaches the sampler.`
        : 'Filter off: whatever is above half the rate reaches the sampler and folds down.';
    if (last === 'bits' || last === 'dither') {
        return `The quantiser rounds each held voltage to one of ${fmtLevels(state.bits)} codes, stored as a ${state.bits}-digit binary word; the first digit is the sign. ${state.dither ? 'Dither adds a whisper of noise before the rounding, so the error becomes a steady hiss instead of grit that follows the music.' : 'Turn Dither on in More: a whisper of noise before the rounding turns the grit into a steady hiss.'}`;
    }
    return `${filter} Sample and hold freezes the voltage ${Math.round(state.rate * 1000).toLocaleString('en-GB')} times a second; each is rounded to a ${state.bits}-bit word: ${bitsPerSecond} bits a second.`;
}
