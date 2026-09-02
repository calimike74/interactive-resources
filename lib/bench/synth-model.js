// The Synth bench (1.3): the model behind the voice.
//
// One subtractive voice, the paper's own drawing of a synthesiser: a VCO
// with a source mixer (pulse, a saw, triangle or sine, sub, noise) into a filter into an
// amplifier, an envelope asking, an LFO moving something too slowly to
// hear (the 2024 Q6 figure, a monophonic synthesiser of 1982; re-cut to
// that panel 2 Sep 2026 on Mike's steer). Everything here is arithmetic over
// one state: the harmonics each waveform carries, the filter's magnitude
// at each of them (the RBJ biquad the BiquadFilterNode also runs, so the
// curve on the stage is the curve the node makes), the envelope's four
// straight lines, the LFO's shape, and the checks the papers' questions
// make. No audio node in this file; SynthBench.jsx plays it.
//
// The part the voice plays is the job the paper asks about: a synth bass
// (2024 Q6, 2023 AS Q3), a pad (2019 Q6), synth fills (2020, 2023 Q2), a
// keyboard part on two saws (2022, 2024 AS Q2). Judging a patch for a job
// is the Q6 idiom, section by section.

import { sectionResponse } from './eq-model.js';

export const BPM = 100;
export const BEATS_PER_BAR = 4;
export const SIXTEENTHS = 16;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
export const clamp01 = (v) => clamp(v, 0, 1);

// ---- pitch ----------------------------------------------------------------------
const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const midiHz = (midi) => 440 * 2 ** ((midi - 69) / 12);
export const noteName = (midi) => `${NAMES[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;
export function fmtHz(hz) { return hz >= 1000 ? `${(hz / 1000).toFixed(hz >= 10000 ? 1 : 2).replace(/\.?0+$/, '')} kHz` : `${hz < 100 ? hz.toFixed(1) : Math.round(hz)} Hz`; }
export function fmtMs(ms) { return ms >= 1000 ? `${(ms / 1000).toFixed(ms >= 10000 ? 0 : 1).replace(/\.0$/, '')} s` : `${Math.round(ms)} ms`; }
export const fmtCents = (c) => `${Math.round(c)} ct`;
export const fmtRate = (hz) => (hz >= 10 ? `${Math.round(hz)} Hz` : `${hz.toFixed(1)} Hz`);

// A dial that walks a log range: the dial's position 0..100 to the value.
export const posToLog = (pos, min, max) => min * (max / min) ** (clamp(pos, 0, 100) / 100);
export const logToPos = (v, min, max) => 100 * Math.log(clamp(v, min, max) / min) / Math.log(max / min);

// ---- the oscillator and its source mixer ---------------------------------------------
// The paper's 1982 synthesiser has one VCO and a source mixer: a pulse wave
// whose width is set by hand or moved by the LFO (PWM: the 2019 report,
// "many candidates thought that this was a square wave and did not
// appreciate that the pulse width was being modulated by the LFO"), a saw,
// a square sub-oscillator an octave or two down ("Candidates were often
// successful in discussing the sub-oscillator", 2024), and white noise,
// mixed rather than chosen. The series each carries is the spec's Waveform
// Mathematics, in the amplitude a wave of peak 1 really has, so a square
// and a saw at the same level draw and sound in the same proportion. The
// graph makes the pulse from two band-limited saws, so the bars on the
// stage are the harmonics it plays.
export const WAVE_IDS = ['square', 'pulse', 'saw', 'tri', 'sine', 'noise', 'none'];
export const WAVES = {
    square: { label: 'Square', said: 'a square wave', harmonics: 'odd harmonics only, each at 1/n', short: 'odd harmonics, 1/n', character: 'hollow, reedy', colour: 'var(--gen-3)' },
    pulse: { label: 'Pulse', said: 'a pulse wave', harmonics: 'every harmonic, the even ones growing as the width narrows', short: 'the even harmonics come in', character: 'nasal, thinner as it narrows', colour: 'var(--gen-3)' },
    saw: { label: 'Saw', said: 'a saw wave', harmonics: 'every harmonic, each at 1/n', short: 'every harmonic, 1/n', character: 'bright, buzzy', colour: 'var(--gen-4)' },
    tri: { label: 'Tri', said: 'a triangle wave', harmonics: 'odd harmonics only, falling fast at 1/n²', short: 'odd harmonics, 1/n²', character: 'soft, rounded', colour: 'var(--gen-4)' },
    sine: { label: 'Sine', said: 'a sine wave', harmonics: 'the fundamental alone', short: 'the fundamental alone', character: 'pure, dull', colour: 'var(--gen-4)' },
    noise: { label: 'Noise', said: 'white noise', harmonics: 'every frequency at once, no harmonics', short: 'every frequency, no harmonics', character: 'a hiss with no pitch', colour: 'var(--gen-7)' },
    none: { label: 'None', said: 'no source', harmonics: 'nothing reaches the filter', short: 'nothing', character: 'silence', colour: 'var(--ink-3)' },
};
export const SOURCE_IDS = ['pulse', 'saw', 'sub', 'noise'];
export const SOURCES = {
    pulse: { label: 'Pulse', said: 'the pulse wave', does: 'a square when the width is 50 %; narrower, the even harmonics come in and it thins' },
    saw: { label: 'Saw', said: 'the saw wave', does: 'every harmonic at 1/n: the brightest source, the usual start for subtractive synthesis' },
    sub: { label: 'Sub', said: 'the sub-oscillator', does: 'a square wave an octave or two below the VCO, for weight' },
    noise: { label: 'Noise', said: 'white noise', does: 'every frequency at once, no pitch: breath, wind, the start of a drum' },
};
// The wave slider's shape. The paper's 1982 panel has a saw and a pulse
// only; the spec asks for "selecting and mixing sine, triangle, pulse,
// square and saw", and the DAW synths students meet (Analog, Retro Synth,
// Serum) put a shape switch on the oscillator. So the slider's name is that
// switch (Mike, 2 Sep 2026: "the visual of that was quite cool ... can we
// get that back again"). The triangle's series alternates in sign, which
// the WAVE screen needs to draw it; the bars only need the size.
export const SHAPE_IDS = ['saw', 'tri', 'sine'];
export const SHAPES = {
    saw: { label: 'Saw', said: 'a saw wave', wave: 'saw', node: 'sawtooth', short: 'saw: every harmonic, 1/n', does: 'every harmonic at 1/n: the brightest source, the usual start for subtractive synthesis' },
    tri: { label: 'Tri', said: 'a triangle wave', wave: 'triangle', node: 'triangle', short: 'tri: odd harmonics, 1/n²', does: 'odd harmonics only, falling fast: soft and rounded, little for the filter to take' },
    sine: { label: 'Sine', said: 'a sine wave', wave: 'sine', node: 'sine', short: 'sine: the fundamental alone', does: 'the fundamental alone: nothing for a filter to remove, the sound the Oscilloscope draws first' },
};
export const triCoef = (n) => (n % 2 === 0 ? 0 : (8 / (Math.PI * Math.PI * n * n)) * (((n - 1) / 2) % 2 === 0 ? 1 : -1));
// The signed coefficient of harmonic n for a sine series that draws the shape.
export const shapeCoef = (wave, n) => (wave === 'triangle' ? triCoef(n) : harmonicAmp(wave, n));
export const waveGain = (s) => SOURCE_GAIN[s.shape === 'saw' ? 'saw' : s.shape];
// The level each source has at 100 %, the gains the graph runs (measured
// 2 Sep 2026, scripts/measure-synth.mjs, a held C2 with the filter open:
// pulse, saw, sub and noise within 2.5 dB RMS; noise is broadband, so its
// RMS sits a little under the others; tri and sine are the wave slider's
// other shapes, at the saw's level). The same numbers scale the bars on
// the stage.
export const SOURCE_GAIN = { pulse: 0.28, saw: 0.55, tri: 0.55, sine: 0.45, sub: 0.25, noise: 0.3 };
export const LEVEL_MIN = 0;
export const LEVEL_MAX = 100;
export const WIDTH_MIN = 5;
export const WIDTH_MAX = 50;
export const PWM_IDS = ['man', 'lfo'];
export const PWMS = { man: { label: 'man', said: 'set by hand' }, lfo: { label: 'LFO', said: 'moved by the LFO between the width and its mirror' } };
export const SUB_OCT_IDS = [1, 2];
export const SUB_OCTS = { 1: { label: '1 oct', said: 'an octave down' }, 2: { label: '2 oct', said: 'two octaves down' } };
// The pulse's harmonic n at width w (0..1), signed, for a wave of peak 1.
export const pulseCoef = (n, width) => (4 / (Math.PI * n)) * Math.sin(n * Math.PI * width);
export function harmonicAmp(wave, n, width = 0.5) {
    if (wave === 'sine') return n === 1 ? 1 : 0;
    if (wave === 'saw') return 2 / (Math.PI * n);
    if (wave === 'pulse') return Math.abs(pulseCoef(n, width));
    if (n % 2 === 0) return 0;
    if (wave === 'square') return 4 / (Math.PI * n);
    return 8 / (Math.PI * Math.PI * n * n); // triangle
}
export const pwmOn = (s) => s.pwm === 'lfo' && s.pulse > 0 && s.width < WIDTH_MAX;
// The pulse's width now: by hand, or swung by the LFO between the width and 100 minus it.
export const widthAt = (s, lfo = 0) => (pwmOn(s) ? 0.5 + lfo * (0.5 - s.width / 100) : s.width / 100);
export const isSquare = (s) => s.width >= 45 && !pwmOn(s);
// The sources above zero, loudest first, each with its sentence.
export function sources(s) {
    const out = [];
    if (s.pulse > 0) out.push({ id: 'pulse', level: s.pulse, said: isSquare(s) ? 'a square wave' : pwmOn(s) ? 'a pulse wave, its width moved by the LFO' : `a pulse wave ${s.width} % wide` });
    if (s.saw > 0) out.push({ id: 'saw', level: s.saw, said: SHAPES[s.shape].said });
    if (s.sub > 0) out.push({ id: 'sub', level: s.sub, said: `a square sub-oscillator ${SUB_OCTS[s.subOct].said}` });
    if (s.noise > 0) out.push({ id: 'noise', level: s.noise, said: 'white noise' });
    return out.sort((a, b) => b.level - a.level);
}
// The wave the papers would name for this mix: the louder of the pulse and the saw.
export function waveOf(s) {
    if (s.pulse === 0 && s.saw === 0) return s.sub > 0 ? 'square' : s.noise > 0 ? 'noise' : 'none';
    if (s.pulse >= s.saw) return isSquare(s) ? 'square' : 'pulse';
    return s.shape;
}
export function sourceSaid(s) {
    const list = sources(s);
    if (!list.length) return 'no source at all';
    const main = list.filter((x) => x.id === 'pulse' || x.id === 'saw').map((x) => x.said);
    const sub = list.find((x) => x.id === 'sub');
    const noise = list.find((x) => x.id === 'noise');
    if (!main.length) return sub ? `the sub-oscillator alone, a square ${SUB_OCTS[s.subOct].said}${noise ? ', with white noise' : ''}` : 'white noise alone';
    let t = main.join(' and ');
    if (sub) t += ` with ${sub.said}`;
    if (noise) t += `${sub ? ' and' : ' with'} ${s.noise < 30 ? 'a little ' : ''}white noise`;
    return t;
}
// The console's and the setting line's word: "square + sub".
export function sourcesShort(s) {
    const list = sources(s);
    if (!list.length) return 'nothing';
    return list.map((x) => (x.id === 'pulse' ? (isSquare(s) ? 'square' : 'pulse') : x.id === 'saw' ? s.shape : x.id)).join(' + ');
}
export function harmonicsSaid(s) {
    const bits = [];
    if (s.pulse > 0) bits.push(isSquare(s) ? 'square: odd harmonics, 1/n' : pwmOn(s) ? 'pulse: the even harmonics come and go' : `pulse ${s.width} %: even harmonics in`);
    if (s.saw > 0) bits.push(SHAPES[s.shape].short);
    if (s.sub > 0) bits.push(`sub: a square ${SUB_OCTS[s.subOct].said}`);
    if (s.noise > 0) bits.push('noise: every frequency, no harmonics');
    return bits.length ? bits.join(' · ') : 'no source: nothing reaches the filter';
}
export const N_HARMONICS = 40;

export const OCTAVE_IDS = [-1, 0, 1];
export const octaveSaid = (o) => (o === 0 ? 'at the part\'s own octave' : o < 0 ? 'an octave down' : 'an octave up');
export const DETUNE_MIN = 0;
export const DETUNE_MAX = 50;
export const OSC2_IDS = ['pair', 'fifth', 'off'];
export const OSC2 = {
    pair: { label: 'Pair', said: 'a second VCO with the same mix, detuned against the first (fine tuning)' },
    fifth: { label: 'Fifth', said: 'a second VCO with the same mix a fifth above, seven semitones (coarse tuning)' },
    off: { label: 'Off', said: 'one VCO' },
};
// The second oscillator's frequency against the first's.
export const osc2Ratio = (state) => (state.osc2 === 'fifth' ? 2 ** (7 / 12) : 1);
// The VCA: the envelope shapes the note, or the key alone does (the 2019
// report: candidates confused "the VCA gate (disabling the envelope) with a
// noise gate designed to cut out background noise").
export const VCA_IDS = ['env', 'gate'];
export const VCAS = {
    env: { label: 'Env', said: 'the envelope shapes the note' },
    gate: { label: 'Gate', said: 'the key alone: full while it is down, off when it lifts, the envelope disabled on the amplifier' },
};
// The arpeggiator: a held chord's notes stepped through in sixteenths (the spec names it; the pad and keys have chords).
export const ARP_IDS = ['off', 'up'];
export const ARPS = { off: { label: 'Off', said: 'chords sound together' }, up: { label: 'Up', said: 'the arpeggiator steps up through each chord in sixteenths' } };

// ---- the filter ---------------------------------------------------------------------
export const FILTER_IDS = ['lpf', 'hpf', 'bpf'];
export const FILTERS = {
    lpf: { label: 'LPF', name: 'low-pass filter', type: 'lowpass', does: 'passes what is below the cutoff and removes what is above: darker' },
    hpf: { label: 'HPF', name: 'high-pass filter', type: 'highpass', does: 'passes what is above the cutoff and removes what is below: thinner' },
    bpf: { label: 'BPF', name: 'band-pass filter', type: 'bandpass', does: 'passes a band around the cutoff and removes both sides: nasal' },
};
export const CUTOFF_MIN = 40;
export const CUTOFF_MAX = 16000;
export const RES_MIN = 0;
export const RES_MAX = 100;
export const ENV_AMT_MIN = 0;
export const ENV_AMT_MAX = 100;
export const ENV_OCTAVES_MAX = 4; // Env at 100 % lifts the cutoff four octaves at the envelope's peak
export const SAMPLE_RATE = 48000;

// Resonance as the node takes it. Web Audio's lowpass and highpass take Q
// in dB (a Butterworth section is -3.01 dB there); bandpass takes Q as Q.
// 0 % is the flat Butterworth corner, 100 % a peak of 24 dB, near the
// ringing the vault's filter note calls self-oscillation.
export const RES_DB_MIN = -3;
export const RES_DB_MAX = 24;
export const resDb = (res) => RES_DB_MIN + (clamp(res, RES_MIN, RES_MAX) / 100) * (RES_DB_MAX - RES_DB_MIN);
export const resQ = (res) => 10 ** (resDb(res) / 20);
export const nodeQ = (state) => (state.filter === 'bpf' ? resQ(state.res) : resDb(state.res));
export const envOctaves = (state) => (clamp(state.envAmt, ENV_AMT_MIN, ENV_AMT_MAX) / 100) * ENV_OCTAVES_MAX;

// RBJ Audio EQ Cookbook coefficients for the three synth filters, as
// BiquadFilterNode computes them (the EQ bench holds lowpass and highpass
// too; bandpass is the constant-0-dB-peak form).
export function filterCoefficients(type, hz, q, sampleRate = SAMPLE_RATE) {
    const w0 = (2 * Math.PI * clamp(hz, 1, sampleRate / 2 - 1)) / sampleRate;
    const cos = Math.cos(w0);
    const sin = Math.sin(w0);
    const alpha = sin / (2 * q);
    let b0; let b1; let b2;
    if (type === 'lowpass') { b0 = (1 - cos) / 2; b1 = 1 - cos; b2 = (1 - cos) / 2; }
    else if (type === 'highpass') { b0 = (1 + cos) / 2; b1 = -(1 + cos); b2 = (1 + cos) / 2; }
    else if (type === 'bandpass') { b0 = alpha; b1 = 0; b2 = -alpha; }
    else throw new Error(`unknown filter type ${type}`);
    const a0 = 1 + alpha; const a1 = -2 * cos; const a2 = 1 - alpha;
    return { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: a1 / a0, a2: a2 / a0 };
}
export const filterCoef = (state, cutoff = state.cutoff) => filterCoefficients(FILTERS[state.filter].type, cutoff, resQ(state.res));
// |H| in dB at one frequency for the filter as set.
export function filterDb(state, hz, coef = filterCoef(state)) { return sectionResponse(coef, hz, SAMPLE_RATE).db; }
export const filterMag = (state, hz, coef) => 10 ** (filterDb(state, hz, coef) / 20);
// The curve across the stage's axis.
export function filterCurve(state, freqs) { const c = filterCoef(state); return freqs.map((hz) => ({ hz, db: filterDb(state, hz, c) })); }
export const HZ_LO = 30;
export const HZ_HI = 12000;
export const posOfHz = (hz, lo = HZ_LO, hi = HZ_HI) => Math.log(clamp(hz, lo, hi) / lo) / Math.log(hi / lo);
export const hzOfPos = (pos, lo = HZ_LO, hi = HZ_HI) => lo * (hi / lo) ** clamp01(pos);
export const logFreqs = (n = 200, lo = HZ_LO, hi = HZ_HI) => Array.from({ length: n }, (_, i) => hzOfPos(i / (n - 1), lo, hi));

// ---- the envelope -------------------------------------------------------------------
// Attack, decay and release are times; sustain is a level (the vault's ADSR
// note: "CRITICAL DISTINCTION"). Straight lines, the drawing the 2021
// paper marks.
export const ATTACK_MIN = 1; export const ATTACK_MAX = 2000;
export const DECAY_MIN = 10; export const DECAY_MAX = 2000;
export const SUSTAIN_MIN = 0; export const SUSTAIN_MAX = 100;
export const RELEASE_MIN = 10; export const RELEASE_MAX = 3000;
// The envelope's value 0..1 at t ms after key-down, the key held for gateMs.
export function adsrAt(state, tMs, gateMs) {
    const A = state.attack; const D = state.decay; const S = state.sustain / 100; const R = state.release;
    const gate = (t) => {
        if (t <= 0) return 0;
        if (t < A) return t / A;
        const td = t - A;
        if (td < D) return 1 - (1 - S) * (td / D);
        return S;
    };
    if (tMs <= gateMs) return gate(tMs);
    const atOff = gate(gateMs);
    const tr = tMs - gateMs;
    return tr >= R ? 0 : atOff * (1 - tr / R);
}
export function envelopeWord(state) {
    if (state.vca === 'gate') return 'gated';
    if (state.attack >= 200) return 'swelling';
    if (state.sustain <= 20 && state.decay <= 500) return 'plucked';
    if (state.release >= 800) return 'ringing';
    return 'held';
}

// ---- the LFO ------------------------------------------------------------------------
export const LFO_TARGET_IDS = ['pitch', 'cutoff', 'amp'];
export const LFO_TARGETS = {
    pitch: { label: 'Pitch', said: 'the pitch', effect: 'vibrato', full: 200, unit: 'cents' },
    cutoff: { label: 'Cutoff', said: 'the cutoff', effect: 'a filter wobble', full: 2400, unit: 'cents' },
    amp: { label: 'Amp', said: 'the level', effect: 'tremolo', full: 1, unit: '' },
};
export const LFO_RATE_MIN = 0.1;
export const LFO_RATE_MAX = 20;
export const LFO_DEPTH_MIN = 0;
export const LFO_DEPTH_MAX = 100;
export const LFO_SHAPE_IDS = ['triangle', 'sine', 'square'];
export const LFO_SHAPES = { triangle: { label: 'Triangle', said: 'a triangle' }, sine: { label: 'Sine', said: 'a sine' }, square: { label: 'Square', said: 'a square' } };
export function lfoValue(shape, rateHz, tSec) {
    const p = ((tSec * rateHz) % 1 + 1) % 1;
    if (shape === 'sine') return Math.sin(p * Math.PI * 2);
    if (shape === 'square') return p < 0.5 ? 1 : -1;
    return p < 0.25 ? p * 4 : p < 0.75 ? 2 - p * 4 : p * 4 - 4;
}
// How far the LFO moves its target at this depth: cents for pitch and cutoff, a fraction of the level for amp.
export const lfoSwing = (state) => (clamp(state.lfoDepth, LFO_DEPTH_MIN, LFO_DEPTH_MAX) / 100) * LFO_TARGETS[state.lfoTarget].full;
export const lfoOn = (state) => state.lfoDepth > 0;
// The short word for a console readout.
export function lfoShort(state) {
    if (!lfoOn(state)) return 'off';
    const t = state.lfoTarget;
    if (t === 'pitch') return state.lfoDepth > 40 ? 'wide wobble' : 'vibrato';
    if (t === 'cutoff') return state.lfoRate < 2 ? 'filter sweep' : state.lfoRate < 8 ? 'filter wobble' : 'growl';
    return 'tremolo';
}
export function lfoWord(state) {
    if (!lfoOn(state)) return 'off';
    const t = state.lfoTarget;
    if (t === 'pitch') return state.lfoRate >= 3 && state.lfoRate <= 8 && state.lfoDepth <= 30 ? 'vibrato' : state.lfoDepth > 40 ? 'a wide pitch wobble' : 'a pitch wobble';
    if (t === 'cutoff') return state.lfoRate < 2 ? 'a slow filter sweep' : state.lfoRate < 8 ? 'a filter wobble' : 'a filter growl';
    return state.lfoRate < 8 ? 'tremolo' : 'a fast tremolo';
}

// ---- voices and glide -----------------------------------------------------------------
export const VOICES_IDS = ['poly', 'mono'];
export const VOICES = { poly: { label: 'Poly', said: 'polyphonic: every note of a chord sounds' }, mono: { label: 'Mono', said: 'monophonic: one note at a time, each new note cutting the last' } };
export const GLIDE_IDS = ['off', 'subtle', 'long'];
export const GLIDES = { off: { label: 'Off', ms: 0, said: 'no portamento' }, subtle: { label: 'Subtle', ms: 60, said: 'a subtle portamento' }, long: { label: 'Long', ms: 300, said: 'a long portamento' } };

// ---- the parts: what the voice plays, at 100 bpm in A minor -----------------------------
// Steps are sixteenths over two bars; len in sixteenths; the gate is a
// fraction of the len. A chord is several events on one step, lowest first,
// so Mono keeps the top note (the 2022 report: a monophonic patch "did not
// play the complete chords").
const ev = (s, midi, len) => ({ s, midi, len });
const chord = (s, midis, len) => midis.map((m) => ev(s, m, len));
export const PART_IDS = ['bass', 'pad', 'lead', 'keys'];
export const PARTS = {
    bass: {
        label: 'Bass', said: 'the bass part', job: 'a synth bass', keyC: 36, gate: 0.8, bars: 2,
        notes: [ev(0, 33, 2), ev(2, 33, 2), ev(4, 45, 2), ev(6, 33, 2), ev(8, 31, 2), ev(10, 31, 2), ev(12, 33, 2), ev(14, 36, 2), ev(16, 29, 2), ev(18, 29, 2), ev(20, 41, 2), ev(22, 29, 2), ev(24, 31, 2), ev(26, 31, 2), ev(28, 43, 2), ev(30, 31, 2)],
    },
    pad: {
        label: 'Pad', said: 'the pad', job: 'a synth pad', keyC: 48, gate: 0.94, bars: 2,
        notes: [...chord(0, [45, 48, 52, 57], 16), ...chord(16, [41, 45, 48, 53], 16)],
    },
    lead: {
        label: 'Lead', said: 'the lead line', job: 'a synth lead', keyC: 60, gate: 0.85, bars: 2,
        notes: [ev(0, 69, 4), ev(4, 72, 2), ev(6, 71, 2), ev(8, 69, 4), ev(12, 64, 4), ev(16, 67, 4), ev(20, 69, 4), ev(24, 72, 6), ev(30, 71, 2)],
    },
    keys: {
        label: 'Keys', said: 'the keyboard part', job: 'a keyboard part', keyC: 48, gate: 0.9, bars: 2,
        notes: [...chord(0, [57, 60, 64], 3), ...chord(6, [57, 60, 64], 3), ...chord(10, [57, 60, 64], 4), ...chord(16, [53, 57, 60], 3), ...chord(22, [53, 57, 60], 3), ...chord(26, [53, 57, 60], 4)],
    },
};
export const KEYBOARD_KEYS = 'awsedftgyhujk'; // C to C, a computer keyboard's octave
export const stepSec = (bpm = BPM) => 60 / bpm / 4;
// The length of a typical note of the part, for the timeline: its first event's gate.
export function gateMs(state, bpm = BPM) {
    const p = PARTS[state.part];
    const first = p.notes[0];
    const chord = p.notes.filter((e) => e.s === first.s).length > 1;
    const len = state.arp === 'up' && chord ? 1 : first.len;
    return Math.round(len * stepSec(bpm) * p.gate * 1000);
}
// The events a bar plays: the arpeggiator spreads a chord over its own length, one note a sixteenth, lowest first.
export function arpeggiate(events, state) {
    if (state.arp !== 'up') return events;
    const byStep = new Map();
    for (const e of events) { if (!byStep.has(e.s)) byStep.set(e.s, []); byStep.get(e.s).push(e); }
    const out = [];
    for (const [s, group] of byStep) {
        if (group.length < 2) { out.push(...group); continue; }
        const notes = [...group].sort((a, b) => a.midi - b.midi);
        for (let i = 0; i < group[0].len; i += 1) out.push({ s: s + i, midi: notes[i % notes.length].midi, len: 1 });
    }
    return out.sort((a, b) => a.s - b.s);
}
export function homeMidi(state) { return PARTS[state.part].notes[0].midi + 12 * state.octave; }

// ---- state --------------------------------------------------------------------------------
function baseState() {
    return {
        part: 'bass',
        pulse: 100, saw: 0, shape: 'saw', sub: 0, noise: 0, width: 50, pwm: 'man', subOct: 1,
        octave: 0, detune: 8, osc2: 'pair', vca: 'env',
        filter: 'lpf', cutoff: 900, res: 15, envAmt: 30,
        attack: 5, decay: 200, sustain: 60, release: 80,
        lfoTarget: 'pitch', lfoRate: 5, lfoDepth: 0, lfoShape: 'triangle',
        voices: 'poly', glide: 'off', arp: 'off',
        task: null, presetId: null, volume: 0.8,
    };
}

// ---- the papers' questions ---------------------------------------------------------------
// Sources: the 9MT0/04 and 9MT0/41 question papers and mark schemes as
// extracted from the vault's exam PDFs, 2019 to 2025. Each scheme task
// names the settings it marks; the Judge tasks are the Q6 idiom, a patch
// made for one job set to another.
export const TASKS = {
    as2023: { id: 'as2023', name: '2023 paper', part: 'bass', stem: 'Create a synth bass sound that is similar to the example. Use two square wave oscillators. Ensure the detuning between the oscillators matches the example. Ensure the filter setting matches the example. Ensure that the octave matches the example.', scheme: '"Square wave (1); Detune added, suitable amount (1); Correct filter setting (1); Correct octave (both oscillators) (1)"', source: '2023 AS Q3(a)' },
    as2024: { id: 'as2024', name: '2024 paper', part: 'keys', stem: 'Create a keyboard sound that matches the example. Use two sawtooth oscillators with no effects. Ensure that the octave matches the example. Copy the detune in the example. Copy the filtering in the example.', scheme: '"Two sawtooth oscillators (1)"; "Both in same octave and transposed to correct octave (1)"; "Slight detune applied (1)"; "LPF matches example / equal or duller (1)"', source: '2024 AS Q2(c)' },
    a2025: { id: 'a2025', name: '2025 paper', part: 'lead', stem: 'Create a synth sound that matches the example in octave, waveform, polyphony, portamento, amplitude envelope, filter and LFO, with no effects.', scheme: '"Square wave (1). Allow saw, pulse or triangle. Not sine"; "Monophonic without note overlaps (1)"; "Subtle portamento (1)"; "A=soft, D=max, S=max, R=short (1)"; "Muted sound from low cut off frequency ... resonance isn\'t a feature (1)"; "LFO giving subtle Fc wobble (1)"', source: '2025 Q3(a)' },
    fills2023: { id: 'fills2023', name: 'Fills', part: 'lead', stem: 'Create a synth sound that matches the timbre of the synth fills example.', scheme: '"Square wave (1). Allow saw or pulse"; "A=0, D=max, S=max, R=enough release so that the drop in octave is heard in the release phase"; "Matching LPF with no resonance"', source: '2023 Q2(d); the same fills in 2020 Q2(b): "A=0, D=max, S=max, R=0"' },
    judge: { id: 'judge', name: 'Judge', stem: 'Evaluate the suitability of the settings to produce the part.', scheme: 'AO3 for naming the sections and their settings; AO4 for the impact of each on the sound and its suitability for the job, section by section', source: '2019 Q6 (a synth pad) and 2024 Q6 (a synth bass), a 1982 synthesiser in the figure' },
};

// Four sounds first, each a patch that suits its part (the judge says so,
// section by section), the envelope the difference you see on the ENV
// sliders: a pad and a stab play the same chords with opposite envelopes
// (Mike, 2 Sep 2026: "the students recognise the differences in the ADSR").
// These are the Core presets; the papers and the Judge patches are the
// A-level and Extension presets, where the paper's job lives.
export const PRESETS = [
    { id: 'bass', name: 'Synth bass', level: 'core', task: null, blurb: 'A synth bass: a saw with a sub-oscillator beneath, doubled and detuned, a low-pass the envelope opens on each note, an instant attack and a short release, one note at a time', set: { part: 'bass', pulse: 0, saw: 100, shape: 'saw', sub: 50, noise: 0, width: 50, pwm: 'man', subOct: 1, octave: 0, detune: 10, osc2: 'pair', vca: 'env', filter: 'lpf', cutoff: 600, res: 15, envAmt: 40, attack: 3, decay: 180, sustain: 40, release: 90, lfoDepth: 0, voices: 'mono', glide: 'off' } },
    { id: 'pad', name: 'Synth pad', level: 'core', task: null, blurb: 'A synth pad: a saw and a pulse the LFO breathes, doubled 12 cents apart, a soft low-pass, a slow attack, full sustain and a long release, polyphonic so the whole chord sounds', set: { part: 'pad', pulse: 40, saw: 100, shape: 'saw', sub: 0, noise: 0, width: 30, pwm: 'lfo', octave: 0, detune: 12, osc2: 'pair', vca: 'env', filter: 'lpf', cutoff: 1200, res: 10, envAmt: 0, attack: 600, decay: 400, sustain: 85, release: 1200, lfoTarget: 'cutoff', lfoRate: 0.4, lfoDepth: 0, lfoShape: 'triangle', voices: 'poly', glide: 'off' } },
    { id: 'stab', name: 'Synth stab', level: 'core', task: null, blurb: 'A synth stab: the same chords as the pad on two saws, but an instant attack, a short decay to no sustain and a short release, the envelope opening the filter on every hit', set: { part: 'keys', pulse: 0, saw: 100, shape: 'saw', sub: 0, noise: 0, width: 50, pwm: 'man', octave: 0, detune: 8, osc2: 'pair', vca: 'env', filter: 'lpf', cutoff: 2200, res: 10, envAmt: 50, attack: 2, decay: 160, sustain: 0, release: 150, lfoDepth: 0, voices: 'poly', glide: 'off' } },
    { id: 'lead', name: 'Synth lead', level: 'core', task: null, blurb: 'A synth lead: one square wave, monophonic with a subtle glide, a quick attack and a medium release, vibrato from the LFO on the pitch', set: { part: 'lead', pulse: 100, saw: 0, shape: 'saw', sub: 0, noise: 0, width: 50, pwm: 'man', octave: 0, detune: 0, osc2: 'off', vca: 'env', filter: 'lpf', cutoff: 1800, res: 20, envAmt: 20, attack: 15, decay: 300, sustain: 70, release: 200, lfoTarget: 'pitch', lfoRate: 5, lfoDepth: 12, lfoShape: 'triangle', voices: 'mono', glide: 'subtle' } },
    { id: 'as2023', name: '2023 paper', task: 'as2023', blurb: 'The 2023 AS bass: two square waves, detuned, a low-pass filter, the right octave. Four marks, one a setting', set: { part: 'bass', pulse: 100, saw: 0, sub: 0, noise: 0, width: 50, pwm: 'man', octave: 0, detune: 12, osc2: 'pair', filter: 'lpf', cutoff: 700, res: 10, envAmt: 20, attack: 5, decay: 250, sustain: 50, release: 90, lfoDepth: 0, voices: 'mono', glide: 'off' } },
    { id: 'as2024', name: '2024 paper', task: 'as2024', blurb: 'The 2024 AS keyboard part: two saws, slightly detuned, the same octave, a low-pass filter no brighter than the example', set: { part: 'keys', pulse: 0, saw: 100, sub: 0, noise: 0, width: 50, pwm: 'man', octave: 0, detune: 7, osc2: 'pair', filter: 'lpf', cutoff: 2500, res: 5, envAmt: 0, attack: 10, decay: 300, sustain: 70, release: 200, lfoDepth: 0, voices: 'poly', glide: 'off' } },
    { id: 'a2025', name: '2025 paper', task: 'a2025', blurb: 'The 2025 lead: a square wave, mono, a subtle portamento, a soft attack, a muted low cutoff with no resonance and no filter envelope, and an LFO wobbling the cutoff', set: { part: 'lead', pulse: 100, saw: 0, sub: 0, noise: 0, width: 50, pwm: 'man', octave: 0, detune: 0, osc2: 'off', filter: 'lpf', cutoff: 500, res: 0, envAmt: 0, attack: 40, decay: 2000, sustain: 100, release: 60, lfoTarget: 'cutoff', lfoRate: 4, lfoDepth: 15, lfoShape: 'triangle', voices: 'mono', glide: 'subtle' } },
    { id: 'fills2023', name: 'Fills', task: 'fills2023', blurb: 'The synth fills of 2020 and 2023: a square wave with an instant attack, full sustain and a release long enough to hear, through a low-pass filter with no resonance', set: { part: 'lead', pulse: 100, saw: 0, sub: 0, noise: 0, width: 50, pwm: 'man', octave: 0, detune: 0, osc2: 'off', filter: 'lpf', cutoff: 1200, res: 0, envAmt: 0, attack: 1, decay: 2000, sustain: 100, release: 300, lfoDepth: 0, voices: 'poly', glide: 'off' } },
    { id: 'judgeBass', name: 'Judge: a bass', task: 'judge', blurb: 'A patch made for a pad, playing the bass part: a saw and a pulse the LFO widens, doubled and detuned, a slow envelope. Judge it section by section, the way the 2024 paper asked of a 1982 synthesiser', set: { part: 'bass', pulse: 60, saw: 100, sub: 0, noise: 0, width: 25, pwm: 'lfo', octave: 0, detune: 14, osc2: 'pair', filter: 'lpf', cutoff: 1500, res: 20, envAmt: 10, attack: 600, decay: 400, sustain: 80, release: 900, lfoTarget: 'cutoff', lfoRate: 0.5, lfoDepth: 30, lfoShape: 'triangle', voices: 'poly', glide: 'off' } },
    { id: 'judgePad', name: 'Judge: a pad', task: 'judge', blurb: 'A patch made for a bass, playing the pad: a square with a sub, a fast envelope, mono, the VCA on Gate. Judge it section by section, the way the 2019 paper asked', set: { part: 'pad', pulse: 100, saw: 0, sub: 70, noise: 0, width: 50, pwm: 'man', subOct: 1, octave: 0, detune: 0, osc2: 'off', vca: 'gate', filter: 'lpf', cutoff: 500, res: 10, envAmt: 40, attack: 2, decay: 200, sustain: 30, release: 60, lfoDepth: 0, voices: 'mono', glide: 'off' } },
];
export function applyPreset(state, id) {
    const p = PRESETS.find((x) => x.id === id);
    if (!p) return state;
    return { ...baseState(), volume: state.volume, ...p.set, task: p.task, presetId: id };
}
// Core shows the sounds; A-level and Extension the papers and the Judge patches.
export const presetsFor = (depth) => PRESETS.filter((p) => (p.level === 'core') === (depth === 'core'));
export const DEFAULT_STATE = applyPreset(baseState(), 'bass');

// ---- edits ----------------------------------------------------------------------------------
const drop = (state) => ({ ...state, presetId: null });
const one = (key, ids) => (state, v) => (ids.includes(v) && v !== state[key] ? { ...drop(state), [key]: v } : state);
const num = (key, lo, hi, round = (x) => Math.round(x)) => (state, v) => { const n = clamp(round(v), lo, hi); return n === state[key] ? state : { ...drop(state), [key]: n }; };
// A log dial's value keeps three significant figures, so one keyboard step
// (half a position) moves it even at the bottom of its range.
const sig3 = (x) => Number(Number(x).toPrecision(3));
export const setPart = (state, part) => (PARTS[part] && part !== state.part ? { ...state, part, presetId: state.task === 'judge' ? state.presetId : null } : state);
export const setPulse = num('pulse', LEVEL_MIN, LEVEL_MAX);
export const setSaw = num('saw', LEVEL_MIN, LEVEL_MAX);
export const setShape = one('shape', SHAPE_IDS);
export const setSub = num('sub', LEVEL_MIN, LEVEL_MAX);
export const setNoise = num('noise', LEVEL_MIN, LEVEL_MAX);
export const setWidth = num('width', WIDTH_MIN, WIDTH_MAX);
export const setPwm = one('pwm', PWM_IDS);
export const setSubOct = one('subOct', SUB_OCT_IDS);
export const setVca = one('vca', VCA_IDS);
export const setOctave = one('octave', OCTAVE_IDS);
export const setDetune = num('detune', DETUNE_MIN, DETUNE_MAX);
export const setOsc2 = one('osc2', OSC2_IDS);
export const setFilter = one('filter', FILTER_IDS);
export const setCutoff = num('cutoff', CUTOFF_MIN, CUTOFF_MAX, sig3);
export const setRes = num('res', RES_MIN, RES_MAX);
export const setEnvAmt = num('envAmt', ENV_AMT_MIN, ENV_AMT_MAX);
export const setAttack = num('attack', ATTACK_MIN, ATTACK_MAX, sig3);
export const setDecay = num('decay', DECAY_MIN, DECAY_MAX, sig3);
export const setSustain = num('sustain', SUSTAIN_MIN, SUSTAIN_MAX);
export const setRelease = num('release', RELEASE_MIN, RELEASE_MAX, sig3);
export const setLfoTarget = one('lfoTarget', LFO_TARGET_IDS);
export const setLfoRate = num('lfoRate', LFO_RATE_MIN, LFO_RATE_MAX, sig3);
export const setLfoDepth = num('lfoDepth', LFO_DEPTH_MIN, LFO_DEPTH_MAX);
export const setLfoShape = one('lfoShape', LFO_SHAPE_IDS);
export const setVoices = one('voices', VOICES_IDS);
export const setGlide = one('glide', GLIDE_IDS);
export const setArp = one('arp', ARP_IDS);
export function setVolume(state, volume) { return { ...state, volume: clamp01(volume) }; }
// The dot on the harmonics screen: across is the cutoff, up is the resonance
// (its height is the peak the filter makes at the cutoff, in dB).
export function dragDot(state, hz, db) {
    const next = setCutoff(state, hz);
    if (db == null) return next;
    return setRes(next, ((clamp(db, RES_DB_MIN, RES_DB_MAX) - RES_DB_MIN) / (RES_DB_MAX - RES_DB_MIN)) * 100);
}

// What plays while the button in the play column is held: the sources
// alone, the filter open, the envelope a switch, no LFO (so no PWM either).
export function rawOf(state) {
    return { ...state, bypass: true, attack: 2, decay: 10, sustain: 100, release: 20, envAmt: 0, lfoDepth: 0, pwm: 'man', vca: 'env' };
}

// ---- reading the voice --------------------------------------------------------------------
// The harmonics the sources put into the filter, and what comes out, for
// one fundamental: amp is level times gain times the series (the numbers
// the graph runs), out is amp times the filter's magnitude. `width` lets
// the stage draw the pulse at the width the LFO has it this frame.
export function spectrum(state, f0 = midiHz(homeMidi(state)), { hi = HZ_HI, n = N_HARMONICS, width = null } = {}) {
    const coef = filterCoef(state);
    const w = width ?? widthAt(state);
    const lines = [];
    const put = (hz, amp, osc, src) => { if (hz <= hi && amp > 0.0015) lines.push({ hz, amp, osc, src, out: amp * (state.bypass ? 1 : filterMag(state, hz, coef)) }); };
    const cents = state.osc2 === 'pair' ? state.detune / 2 : 0;
    const pair = state.osc2 !== 'off' ? 0.62 : 1;
    const gP = (state.pulse / 100) * SOURCE_GAIN.pulse * pair;
    const gS = (state.saw / 100) * waveGain(state) * pair;
    const shapeWave = SHAPES[state.shape].wave;
    const series = (f, osc) => {
        for (let k = 1; k <= n; k += 1) {
            const ap = gP * harmonicAmp('pulse', k, w); const as = gS * harmonicAmp(shapeWave, k);
            if (ap + as > 0) put(f * k, ap + as, osc, ap >= as ? 'pulse' : 'saw');
        }
    };
    series(f0 * 2 ** (-cents / 1200), 1);
    if (state.osc2 === 'pair') series(f0 * 2 ** (cents / 1200), 2);
    if (state.osc2 === 'fifth') series(f0 * osc2Ratio(state), 2);
    if (state.sub > 0) { const gSub = (state.sub / 100) * SOURCE_GAIN.sub; const fs = f0 / 2 ** state.subOct; for (let k = 1; k <= n * 2; k += 1) put(fs * k, gSub * harmonicAmp('square', k), 1, 'sub'); }
    lines.sort((a, b) => a.hz - b.hz);
    return lines;
}
// The noise against the harmonics: its level (RMS for a uniform ±1 source),
// drawn as a floor across the screen that the filter shapes.
export const noiseLevel = (state) => (state.noise / 100) * SOURCE_GAIN.noise * 0.577;
// The wave the voice makes at this setting: the sources' series summed,
// before and after the filter, over `cycles` of the fundamental. Detune is
// left out here (a slow beat is not a shape); the sub is in, and the noise
// is 48 random-phase tones between the harmonics so the filter shapes it.
export function waveShape(state, { n = 256, cycles = 2, harmonics = N_HARMONICS, width = null } = {}) {
    const raw = new Float32Array(n);
    const out = new Float32Array(n);
    const f0 = midiHz(homeMidi(state));
    const coef = filterCoef(state);
    const w = width ?? widthAt(state);
    const pair = state.osc2 !== 'off' ? 0.62 : 1;
    const mag = (hz) => (state.bypass ? 1 : filterMag(state, hz, coef));
    const tone = (f, k, a, ph0, cos) => {
        const hz = f0 * f * k;
        if (!a || hz > HZ_HI * 2) return;
        const m = mag(hz);
        for (let i = 0; i < n; i += 1) {
            const ph = (i / n) * cycles * Math.PI * 2 * f * k + ph0;
            const sv = cos ? Math.cos(ph) : -Math.sin(ph);
            raw[i] += a * sv; out[i] += a * m * sv;
        }
    };
    const vco = (f) => {
        const gP = (state.pulse / 100) * SOURCE_GAIN.pulse * pair; const gS = (state.saw / 100) * waveGain(state) * pair;
        for (let k = 1; k <= harmonics; k += 1) { if (gP) tone(f, k, gP * pulseCoef(k, w), 0, true); if (gS) tone(f, k, gS * shapeCoef(SHAPES[state.shape].wave, k), 0, false); }
    };
    vco(1);
    if (state.osc2 === 'pair') vco(1);
    if (state.osc2 === 'fifth') vco(osc2Ratio(state));
    const gSub = (state.sub / 100) * SOURCE_GAIN.sub;
    if (gSub) for (let k = 1; k <= harmonics; k += 1) tone(1 / 2 ** state.subOct, k, gSub * harmonicAmp('square', k), 0, false);
    const gN = (state.noise / 100) * SOURCE_GAIN.noise;
    if (gN) {
        let seed = 7;
        const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
        for (let k = 0; k < 48; k += 1) tone(0.37 + k * 0.83 + rnd() * 0.4, 1, gN * 0.22, rnd() * Math.PI * 2, false);
    }
    let peak = 0;
    for (let i = 0; i < n; i += 1) peak = Math.max(peak, Math.abs(raw[i]), Math.abs(out[i]));
    if (peak > 0) for (let i = 0; i < n; i += 1) { raw[i] /= peak; out[i] /= peak; }
    return { raw, out, f0 };
}
// One note in time, sampled every `stepMs`: the gate, the envelope, what
// the amplifier does (the envelope times the tremolo, or the gate alone
// when the VCA is on Gate), what the cutoff does (the envelope's lift plus
// the LFO's wobble), and the LFO itself.
export function timeline(state, { stepMs = 2, tailMs = 120 } = {}) {
    const gate = gateMs(state);
    const span = gate + state.release + tailMs;
    const n = Math.ceil(span / stepMs) + 1;
    const t = new Float32Array(n); const env = new Float32Array(n); const amp = new Float32Array(n); const cutoff = new Float32Array(n); const lfo = new Float32Array(n);
    const swing = lfoSwing(state);
    const oct = envOctaves(state);
    for (let i = 0; i < n; i += 1) {
        const ms = i * stepMs;
        t[i] = ms;
        const e = adsrAt(state, ms, gate);
        const l = lfoOn(state) || pwmOn(state) ? lfoValue(state.lfoShape, state.lfoRate, ms / 1000) : 0;
        env[i] = e;
        lfo[i] = l;
        const a = state.vca === 'gate' ? (ms <= gate ? 1 : 0) : e;
        amp[i] = a * (state.lfoTarget === 'amp' ? 1 - (swing / 2) * (1 - l) : 1);
        cutoff[i] = state.cutoff * 2 ** (oct * e + (state.lfoTarget === 'cutoff' ? (swing * l) / 1200 : 0));
    }
    return { t, env, amp, cutoff, lfo, gateMs: gate, spanMs: span, stepMs };
}
export function brightnessWord(state) {
    if (state.bypass) return 'open';
    const c = state.cutoff;
    if (state.filter === 'hpf') return c < 200 ? 'full' : c < 1000 ? 'thin' : 'a whisper';
    if (state.filter === 'bpf') return c < 500 ? 'boxy' : c < 2000 ? 'nasal' : 'piercing';
    return c < 300 ? 'dark' : c < 1000 ? 'warm' : c < 4000 ? 'bright' : 'open';
}
export function readings(state) {
    const midi = homeMidi(state);
    return {
        midi, note: noteName(midi), hz: midiHz(midi), brightness: brightnessWord(state), envelope: envelopeWord(state), lfo: lfoWord(state), lfoShort: lfoShort(state), gateMs: gateMs(state), job: PARTS[state.part].job,
        wave: waveOf(state), sources: sourcesShort(state), sourceCount: sources(state).length,
    };
}

// ---- the judge: a patch for a job, section by section ---------------------------------------
// The Q6 idiom (2019: a pad; 2024: a bass), applied to the four parts. The
// grounds are the schemes and reports in the vault: a bass wants a fast
// attack and release (2024 report: "the most common AO4 marks were for
// describing the fast attack and release"), harmonics for the filter to
// work on, the right octave (2023 AS report: "one octave too high"); a pad
// wants a slow attack, a long release, polyphony (2020 scheme: "with
// polyphony"; 2022 report: a mono patch "did not play the complete chords")
// and movement (2019 report: chorus and PWM credited); a lead is one note
// at a time (2025: "monophonic without note overlaps"); the 2022 and 2024
// keyboard parts are two saws, bright. The vault's ADSR note gives the
// typical times (bass attack 0 to 20 ms; pad attack 500 to 3000 ms).
const V = (grade, why) => ({ grade, why });
export const SECTION_IDS = ['osc', 'filter', 'env', 'lfo', 'voices'];
export const SECTIONS = {
    osc: { label: 'VCO', name: 'oscillator and mixer' },
    filter: { label: 'VCF', name: 'filter' },
    env: { label: 'ENV', name: 'envelope' },
    lfo: { label: 'LFO', name: 'LFO' },
    voices: { label: 'VCA', name: 'amplifier and voices' },
};
export function judgeSection(state, section, part = state.part) {
    const s = state;
    const w = waveOf(s);
    if (section === 'osc') {
        const said = sourceSaid(s);
        if (w === 'none') return V('poor', 'no source: every slider in the mixer is at zero, so nothing reaches the filter');
        if (w === 'noise') return V('poor', 'white noise alone has no pitch: nothing for the filter to tune, and no note for the part');
        if (w === 'sine') return V('partly', `${said}: one harmonic, so the filter has nothing to take away; subtractive synthesis starts from a richer wave`);
        if (part === 'bass') {
            if (w === 'tri') return V('partly', `${said}: faint odd harmonics, so the filter has little to shape and the bass stays soft`);
            if (s.octave > 0) return V('poor', 'an octave up: the bass sits where the keyboard part lives, the 2023 report\'s most common fault');
            if (s.sub > 0) return V('good', `${said}: harmonics to filter and weight beneath, the sub the 2024 report says candidates discussed well`);
            if (s.osc2 === 'fifth') return V('partly', `${said} with a second a fifth above: thicker, but the fifth blurs the root of a bass line`);
            return V('good', `${said}${s.osc2 === 'pair' && s.detune > 0 ? ' in a detuned pair' : ''}: harmonics for the filter to shape`);
        }
        if (part === 'pad') {
            if (s.osc2 === 'off' && !pwmOn(s)) return V('partly', 'one VCO standing still; a detuned pair, or the LFO on the pulse width, gives a pad its movement');
            if (s.osc2 === 'pair' && s.detune < 4 && !pwmOn(s)) return V('partly', 'the pair is barely detuned, so the two waves sit on top of each other with no movement');
            return V('good', `${said}${s.osc2 === 'pair' ? `, doubled ${s.detune} cents apart: width and slow movement` : s.osc2 === 'fifth' ? ' with a second a fifth above: the chord grows a voice' : ': the width moving is the movement the 2019 report says very few candidates identified'}`);
        }
        if (part === 'lead') {
            if (s.octave < 0) return V('partly', 'an octave down the lead sits in the keyboard part\'s register');
            if (s.osc2 === 'fifth') return V('partly', 'a fifth above every note: a melody in parallel fifths, thick but not the single line the 2025 scheme marks');
            return V('good', `${said}${s.osc2 === 'pair' && s.detune > 0 ? ', detuned' : ''}: the shape the 2025 and 2023 schemes name`);
        }
        if (w === 'saw') return V(s.osc2 === 'fifth' ? 'partly' : 'good', `${said}${s.osc2 === 'pair' ? `, doubled ${s.detune} cents apart` : s.osc2 === 'fifth' ? ' with a fifth above, which thickens the chords past the two saws the schemes name' : ''}: the 2022 and 2024 keyboard parts are two saws`);
        return V('partly', `${said}: hollow where the 2022 and 2024 keyboard parts are saw-bright`);
    }
    if (section === 'filter') {
        const c = s.cutoff;
        if (part === 'bass') {
            if (s.filter === 'hpf') return V('poor', 'a high-pass filter on a bass removes the bass');
            if (s.filter === 'bpf') return V('partly', 'a band-pass leaves a nasal band and thins the low end');
            if (c > 4000) return V('partly', 'the cutoff is so high the low-pass barely touches the harmonics: bright for a bass');
            if (c < 120) return V('partly', 'the cutoff is below the bass\'s own harmonics: only the fundamental gets through');
            if (s.res > 70) return V('partly', 'a ringing peak at the cutoff; the 2024 report wanted resonance\'s impact on the sound, and here it whistles');
            return V('good', `a low-pass at ${fmtHz(c)}: the top removed, the weight kept${s.envAmt > 0 ? ', the envelope opening it on each note' : ''}`);
        }
        if (part === 'pad') {
            if (s.filter === 'hpf') return V('partly', 'a high-pass thins a pad; it can sit under a vocal that way, but it loses its warmth');
            if (s.filter === 'bpf') return V('partly', 'a band-pass makes a pad nasal');
            if (c < 250) return V('partly', 'the cutoff is so low the pad is a murmur');
            if (s.res > 70) return V('partly', 'a ringing peak on a pad draws the ear to the cutoff instead of the chord');
            return V('good', `a low-pass at ${fmtHz(c)}: soft on top, the chord kept`);
        }
        if (part === 'lead') {
            if (s.filter === 'hpf') return V('partly', 'a high-pass on a lead removes its body');
            if (s.res > 80) return V('partly', 'the peak at the cutoff whistles over the melody');
            if (c < 300) return V('partly', 'the cutoff is so low the lead is muffled');
            return V('good', `a ${FILTERS[s.filter].name} at ${fmtHz(c)}: ${c < 1000 ? 'muted, the 2025 scheme\'s word' : 'clear'}`);
        }
        if (s.filter !== 'lpf') return V('partly', `a ${FILTERS[s.filter].name} on a keyboard part: the 2024 scheme marks a low-pass`);
        if (c < 1000) return V('partly', `a low-pass at ${fmtHz(c)} is duller than the bright saws the 2022 scheme credits`);
        return V('good', `a low-pass at ${fmtHz(c)}, high cutoff: "bright timbre with high cutoff on LPF and no/little resonance" (2022)`);
    }
    if (section === 'env') {
        const { attack: a, release: r, sustain: su } = s;
        if (part === 'bass') {
            if (a > 150) return V('poor', `a ${fmtMs(a)} attack: the note swells in after the beat; a bass wants a fast attack (2024 report)`);
            if (r > 1000) return V('poor', `a ${fmtMs(r)} release: each note rings into the next and the line smears`);
            if (a > 30) return V('partly', `a ${fmtMs(a)} attack softens the front of every note`);
            if (r > 400) return V('partly', `a ${fmtMs(r)} release lets notes overlap on the quavers`);
            return V('good', `a fast attack (${fmtMs(a)}) and a short release (${fmtMs(r)}): the 2024 report's most common AO4 credit`);
        }
        if (part === 'pad') {
            if (a < 60) return V('poor', `a ${fmtMs(a)} attack: the chord arrives like a stab; a pad swells in over hundreds of milliseconds`);
            if (r < 150) return V('poor', `a ${fmtMs(r)} release: the chord stops dead; a pad fades`);
            if (su < 50) return V('partly', `sustain at ${su} %: the chord dies away under the hand`);
            if (a < 200) return V('partly', `a ${fmtMs(a)} attack is on the quick side for a pad`);
            if (r < 400) return V('partly', `a ${fmtMs(r)} release is short for a pad`);
            return V('good', `a slow attack (${fmtMs(a)}), full sustain and a long release (${fmtMs(r)}): the shape a pad wants`);
        }
        if (part === 'lead') {
            if (a > 200) return V('poor', `a ${fmtMs(a)} attack: the melody arrives late on every note`);
            if (r > 1500) return V('poor', `a ${fmtMs(r)} release: notes pile up under the melody`);
            if (a > 60) return V('partly', `a ${fmtMs(a)} attack softens the melody`);
            if (r > 500) return V('partly', `a ${fmtMs(r)} release blurs the line`);
            return V('good', `attack ${fmtMs(a)}, release ${fmtMs(r)}: each note speaks and stops`);
        }
        if (a > 80) return V('partly', `a ${fmtMs(a)} attack softens the stabs`);
        if (r > 600) return V('partly', `a ${fmtMs(r)} release lets the stabs overlap`);
        return V('good', `attack ${fmtMs(a)}, release ${fmtMs(r)}: the stabs stay stabs`);
    }
    if (section === 'lfo') {
        if (!lfoOn(s)) {
            if (pwmOn(s)) return V('good', `the LFO points at no dial, but it moves the pulse width at ${fmtRate(s.lfoRate)}: the modulation the 2024 report says it was "very rare" to see understood`);
            return part === 'pad' ? V('partly', 'no LFO: the pad stands still; the 2019 report credited chorus and pulse-width movement') : V('good', 'no LFO: nothing needed');
        }
        const deep = s.lfoDepth > 40;
        if (s.lfoTarget === 'pitch') {
            if (deep) return V('poor', `the pitch swings ${Math.round(lfoSwing(s))} cents: out of tune, not vibrato`);
            if (s.lfoRate > 9) return V('partly', `${fmtRate(s.lfoRate)} is too fast for vibrato: a warble`);
            if (s.lfoRate < 3) return V('partly', `${fmtRate(s.lfoRate)} is too slow for vibrato: a slow drift`);
            return V('good', `vibrato: the pitch moved ${Math.round(lfoSwing(s))} cents either way at ${fmtRate(s.lfoRate)}, a control signal, never heard as a note`);
        }
        if (s.lfoTarget === 'cutoff') {
            if (deep && s.lfoRate > 4) return V('poor', `the cutoff swings ${(lfoSwing(s) / 1200).toFixed(1)} octaves at ${fmtRate(s.lfoRate)}: a growl over the part`);
            if (s.lfoRate > 8) return V('partly', `${fmtRate(s.lfoRate)} on the cutoff is a growl`);
            return V('good', `the cutoff wobbles ${(lfoSwing(s) / 1200).toFixed(1)} octaves at ${fmtRate(s.lfoRate)}: ${part === 'pad' ? 'movement, which a pad wants' : 'the 2025 scheme\'s "subtle Fc wobble"'}`);
        }
        if (deep) return V('poor', `the level drops to ${Math.round((1 - lfoSwing(s)) * 100)} % on every cycle: a stutter`);
        return V(part === 'bass' ? 'partly' : 'good', `tremolo at ${fmtRate(s.lfoRate)}${part === 'bass' ? ': the bass\'s level pumps under the mix' : ''}`);
    }
    // the VCA and the voices
    const gate = s.vca === 'gate';
    if (part === 'pad' || part === 'keys') {
        if (s.voices === 'mono') return V('poor', `monophonic: one note of each chord sounds; the 2022 report found a mono patch "did not play the complete chords"${gate ? ', and the VCA is on Gate, so each note starts and stops dead' : ''}`);
        if (gate) return V('poor', `the VCA is on Gate: the amplifier follows the key, full then nothing, and the envelope is disabled, so ${part === 'pad' ? 'the chord cannot swell or fade' : 'every stab is a switch'}; the 2019 report found candidates confusing this gate with a noise gate`);
        return V('good', 'polyphonic, the VCA on Env: every note of the chord sounds and the envelope shapes it');
    }
    if (part === 'lead') {
        if (gate) return V('partly', 'the VCA is on Gate: each note is a switch, on then off, so the soft attack the 2025 scheme marks cannot happen');
        return s.voices === 'mono' ? V('good', `monophonic${s.glide !== 'off' ? ` with ${GLIDES[s.glide].said}` : ''}: one note at a time, the 2025 scheme's "without note overlaps"`) : V('partly', 'polyphonic: held notes overlap the next, which the 2025 scheme marks down');
    }
    if (gate) return V(s.envAmt > 0 ? 'good' : 'partly', `the VCA is on Gate: the note is full while the key is down and stops with it, which a bass can take${s.envAmt > 0 ? '; the envelope still shapes the cutoff' : ', but with Env at zero the envelope now reaches nothing'}`);
    return s.voices === 'mono' ? V('good', `monophonic${s.glide !== 'off' ? ` with ${GLIDES[s.glide].said}` : ''}: a bass is one note at a time`) : V('partly', 'polyphonic: a bass line is one note at a time, and overlaps blur it');
}
export function judgeAll(state, part = state.part) {
    const out = {};
    for (const id of SECTION_IDS) out[id] = judgeSection(state, id, part);
    return out;
}
export const GRADE_WORD = { good: 'suits', partly: 'partly', poor: 'does not suit' };

// ---- the schemes' checks --------------------------------------------------------------------
// One point per mark the scheme names; ok when every point lands.
// The mix as one wave, for the schemes that name one: 'square' or 'saw'
// when that source plays alone (a sub beneath is allowed, it is a square
// too), else what is in the way.
function pure(s) {
    if (s.noise > 0) return 'noise';
    if (s.pulse > 0 && s.saw > 0) return 'mixed';
    if (s.pulse > 0) return isSquare(s) ? 'square' : 'pulse';
    if (s.saw > 0) return s.shape;
    return s.sub > 0 ? 'sub' : 'none';
}
function impure(s, want) {
    const p = pure(s);
    if (p === 'noise') return `noise in the mix, which the example has none of`;
    if (p === 'mixed') return `a pulse and a saw mixed, not the ${want} the question sets`;
    if (p === 'none') return 'no source in the mixer';
    if (p === 'sub') return 'the sub-oscillator alone';
    if (p === 'pulse') return pwmOn(s) ? 'a pulse the LFO is widening, not a plain square' : `a ${s.width} % pulse, not a square`;
    return `${WAVES[p].said}, not the ${want} the question sets`;
}
export function schemePoints(state) {
    const t = state.task;
    const s = state;
    const w = waveOf(s);
    const P = (id, name, ok, said) => ({ id, name, ok, said });
    if (t === 'as2023') {
        return [
            P('wave', 'square wave', pure(s) === 'square', pure(s) === 'square' ? 'square waves' : impure(s, 'square')),
            P('detune', 'detune, a suitable amount', s.osc2 === 'pair' && s.detune >= 4 && s.detune <= 30, s.osc2 !== 'pair' ? 'the second oscillator is not a detuned pair' : s.detune < 4 ? 'no detune to speak of' : s.detune > 30 ? `${s.detune} cents apart, past detune into out of tune` : `${s.detune} cents apart`),
            P('filter', 'the filter setting', s.filter === 'lpf' && s.cutoff >= 250 && s.cutoff <= 2000, s.filter !== 'lpf' ? `a ${FILTERS[s.filter].name}, not the low-pass of the example` : s.cutoff > 2000 ? `the cutoff at ${fmtHz(s.cutoff)}, brighter than the example` : s.cutoff < 250 ? `the cutoff at ${fmtHz(s.cutoff)}, duller than the example` : `a low-pass at ${fmtHz(s.cutoff)}`),
            P('octave', 'the octave, both oscillators', s.octave === 0 && s.part === 'bass', s.part !== 'bass' ? 'not the bass part' : s.octave > 0 ? 'an octave too high' : s.octave < 0 ? 'an octave too low' : 'the example\'s octave'),
            P('vca', 'the envelope on the amplifier', s.vca === 'env', s.vca === 'env' ? 'the VCA on Env' : 'the VCA on Gate, so the example\'s envelope cannot be matched'),
        ];
    }
    if (t === 'as2024') {
        return [
            P('wave', 'two sawtooth oscillators', pure(s) === 'saw' && s.osc2 === 'pair', pure(s) !== 'saw' ? impure(s, 'saw') : s.osc2 !== 'pair' ? 'one saw, not two' : 'two saws'),
            P('octave', 'the same octave, transposed to the example', s.octave === 0 && s.part === 'keys', s.part !== 'keys' ? 'not the keyboard part' : s.octave === 0 ? 'the example\'s octave' : `an octave ${s.octave > 0 ? 'up' : 'down'}`),
            P('detune', 'slight detune', s.osc2 === 'pair' && s.detune >= 3 && s.detune <= 15, s.osc2 !== 'pair' ? 'the second oscillator is not a detuned pair' : s.detune < 3 ? 'no detune' : s.detune > 15 ? `${s.detune} cents is more than slight` : `${s.detune} cents, slight`),
            P('filter', 'LPF equal or duller', s.filter === 'lpf' && s.cutoff <= 4000, s.filter !== 'lpf' ? `a ${FILTERS[s.filter].name}` : s.cutoff > 4000 ? `the cutoff at ${fmtHz(s.cutoff)}, brighter than the example` : `a low-pass at ${fmtHz(s.cutoff)}`),
        ];
    }
    if (t === 'a2025') {
        return [
            P('wave', 'square (allow saw, pulse, triangle; not sine)', w !== 'none' && w !== 'noise' && w !== 'sine', w === 'none' ? 'no source in the mixer' : w === 'noise' ? 'noise alone, which has no pitch' : w === 'sine' ? 'a sine wave, which the scheme rules out' : sourceSaid(s)),
            P('mono', 'monophonic, no overlaps', s.voices === 'mono', s.voices === 'mono' ? 'monophonic' : 'polyphonic, so notes overlap'),
            P('glide', 'subtle portamento', s.glide === 'subtle', s.glide === 'off' ? 'no portamento' : s.glide === 'long' ? 'a long glide, more than subtle' : 'a subtle portamento'),
            P('env', 'A soft, D max, S max, R short', s.vca === 'env' && s.attack >= 15 && s.attack <= 150 && s.sustain >= 90 && s.release <= 150, s.vca !== 'env' ? 'the VCA is on Gate, so the envelope never reaches the amplifier' : s.attack < 15 ? 'the attack is instant, not soft' : s.attack > 150 ? 'the attack is slow, past soft' : s.sustain < 90 ? 'the sustain is below max' : s.release > 150 ? `a ${fmtMs(s.release)} release, not short` : 'soft attack, full sustain, short release'),
            P('filter', 'muted, low cutoff, no filter envelope, no resonance', s.filter === 'lpf' && s.cutoff <= 800 && s.envAmt <= 10 && s.res <= 15, s.filter !== 'lpf' ? `a ${FILTERS[s.filter].name}` : s.cutoff > 800 ? `the cutoff at ${fmtHz(s.cutoff)}, not muted` : s.envAmt > 10 ? 'the envelope is opening the filter' : s.res > 15 ? 'resonance is a feature here' : `a low-pass at ${fmtHz(s.cutoff)}, muted`),
            P('lfo', 'a subtle LFO wobble on the cutoff', s.lfoTarget === 'cutoff' && s.lfoDepth >= 5 && s.lfoDepth <= 40 && s.lfoRate >= 1 && s.lfoRate <= 10, !lfoOn(s) ? 'no LFO' : s.lfoTarget !== 'cutoff' ? `the LFO is on ${LFO_TARGETS[s.lfoTarget].said}, not the cutoff` : s.lfoDepth > 40 ? 'the wobble is deep, not subtle' : s.lfoRate > 10 || s.lfoRate < 1 ? `${fmtRate(s.lfoRate)} is not a similar speed` : `a wobble at ${fmtRate(s.lfoRate)}`),
        ];
    }
    if (t === 'fills2023') {
        return [
            P('wave', 'square (allow saw or pulse)', w === 'square' || w === 'saw' || w === 'pulse', w === 'square' || w === 'saw' || w === 'pulse' ? sourceSaid(s) : `${WAVES[w].said}, which the scheme does not allow`),
            P('env', 'A = 0, D = max, S = max, R enough to hear', s.vca === 'env' && s.attack <= 10 && s.decay >= 1500 && s.sustain >= 90 && s.release >= 150 && s.release <= 600, s.vca !== 'env' ? 'the VCA is on Gate, so the release the report listened for cannot happen' : s.attack > 10 ? `a ${fmtMs(s.attack)} attack, not instant` : s.sustain < 90 ? 'the sustain is below max' : s.decay < 1500 ? 'the decay is short, so the note falls to the sustain early' : s.release < 150 ? 'the release is too short to hear' : s.release > 600 ? 'the release rings past the next fill' : 'instant attack, full sustain, a release you can hear'),
            P('filter', 'a matching LPF, no resonance', s.filter === 'lpf' && s.res <= 10, s.filter !== 'lpf' ? `a ${FILTERS[s.filter].name}` : s.res > 10 ? `resonance at ${s.res} %` : 'a low-pass with no resonance'),
        ];
    }
    return [];
}
// The task's key state: for the gate and the stage.
export function verdict(state) {
    if (!state.task) return { key: 'free', ok: null };
    if (state.task === 'judge') {
        const all = judgeAll(state);
        const poor = SECTION_IDS.filter((id) => all[id].grade === 'poor');
        const partly = SECTION_IDS.filter((id) => all[id].grade === 'partly');
        return { key: poor.length ? `poor-${poor.join('-')}` : partly.length ? `partly-${partly.join('-')}` : 'suits', ok: null, sections: all, poor, partly };
    }
    const points = schemePoints(state);
    const missed = points.filter((p) => !p.ok);
    return { key: missed.length ? `missed-${missed.map((p) => p.id).join('-')}` : 'directed', ok: missed.length === 0, points, missed };
}
