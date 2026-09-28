// The ADC Explorer (2.4): the model behind the converter.
//
// A sound goes in as a voltage, a converter measures it at a sample rate
// and rounds each measurement to one of 2^n levels, and a DAC draws a
// smooth wave back through what was kept. Everything the bench draws and
// plays comes from this file: the sample times, the rounding, the binary
// word each sample is stored as, the anti-alias filter's curve, where a
// band above half the rate folds down to, and the DAC's reconstruction.
//
// The converter itself is `makeConverter()`, a factory with nothing outside
// itself, so the same function runs three ways: in the AudioWorklet that
// the bench hears (its source is this function's text), in the stage's
// picture, and in the unit tests. Law 6 (the picture is the sound) holds by
// construction.
//
// The numeracy is the bench's, never the student's: the Nyquist frequency,
// the alias, the levels and the dynamic range are shown, not asked for.

// ---- the controls -------------------------------------------------------------
// Sample rates in kHz, stepped: the low end is where the lessons are
// (at 8 kHz the song's hi-hats are all above half the rate; 7.5 kHz is a
// 1980s sampler's lowest), the top end is where the formats are (44.1 CD,
// 48 video, 96 studio).
export const RATES = [2, 3, 4, 5, 6, 7.5, 8, 10, 11.025, 12, 16, 20, 22.05, 24, 32, 40, 44.1, 48, 60, 80, 96];
export const BITS_MIN = 2;
export const BITS_MAX = 24;
export const DIVS = 5; // the stage's divisions across, a millisecond each

// Three real recordings, the song first (Mike, 28 Sep 2026: "have the song
// as the main sound ... remove the tone"). Each names the band that carries
// its top end, measured from the file (28 Sep 2026): what is
// lost first when the rate falls, and what folds down when the filter is
// off. The song's hi-hats hold 4 to 12 kHz within 3 dB of each other.
export const SOURCE_IDS = ['song', 'vocal', 'guitar'];
export const SOURCES = {
    song: { label: 'Song', said: 'the song', file: '/bench-audio/adc/glass-arcade.wav', pass: 4.4, band: { lo: 6, hi: 12, name: 'hi-hats' } },
    vocal: { label: 'Vocal', said: 'the vocal', file: '/bench-audio/reverb/vocal.mp3', pass: 6.4, band: { lo: 8, hi: 12, name: 'breath and s' } },
    guitar: { label: 'Guitar', said: 'the guitar', file: '/bench-audio/reverb/guitar.mp3', pass: 8.6, band: { lo: 2, hi: 5, name: 'pick and strings' } },
};
// How wide the stage's window is for a recording: five divisions of 1 ms.
export const FILE_WINDOW_MS = 5;

// ---- the converter ------------------------------------------------------------
// Self-contained on purpose: the worklet's source is this function's text,
// so it may use nothing from the module around it.
export function makeConverter() {
    const K = 12; // the DAC's reconstruction kernel reaches twelve samples either side
    const TABLE_RES = 512;
    const table = new Float32Array(K * TABLE_RES + 2);
    for (let i = 0; i < table.length; i += 1) {
        const x = i / TABLE_RES;
        if (x === 0) { table[i] = 1; continue; }
        if (x >= K) { table[i] = 0; continue; }
        const px = Math.PI * x;
        table[i] = (Math.sin(px) / px) * (Math.sin(px / K) / (px / K)); // a Lanczos-windowed sinc
    }
    // The DAC's kernel: the ideal low-pass at half the sample rate, windowed.
    function kernel(x) {
        const a = Math.abs(x) * TABLE_RES;
        const i = Math.floor(a);
        if (i >= K * TABLE_RES) return 0;
        const f = a - i;
        return table[i] + (table[i + 1] - table[i]) * f;
    }
    // A sample rounded to n bits: the two's complement code a converter
    // stores, from -2^(n-1) to 2^(n-1) - 1.
    function quantise(x, bits) {
        const half = 2 ** (bits - 1);
        let c = Math.round(x * half);
        if (c > half - 1) c = half - 1;
        if (c < -half) c = -half;
        return c;
    }
    function codeValue(code, bits) { return code / 2 ** (bits - 1); }

    // The running converter: input samples at the host rate in, the DAC's
    // output at the host rate out, `delay` samples later. P is the host
    // samples per converter sample (1 or more; at or above the host rate
    // every input sample is kept).
    const IN = 8192; const IM = IN - 1;
    const SN = 1024; const SM = SN - 1;
    const inRing = new Float32Array(IN);
    const sT = new Float64Array(SN);
    const sV = new Float32Array(SN);
    let n = 0; let nextT = 0; let head = 0; let count = 0;
    let P = 1; let bits = 16; let dither = false;
    let delay = K * 24 + 4;
    function set(opts) {
        if (opts.P != null) P = Math.max(1, opts.P);
        if (opts.bits != null) bits = opts.bits;
        if (opts.dither != null) dither = opts.dither;
        if (opts.delay != null) delay = opts.delay;
    }
    function reset() { inRing.fill(0); n = 0; nextT = 0; head = 0; count = 0; }
    function readIn(t) {
        // four-point cubic between host samples (Catmull-Rom)
        const i = Math.floor(t);
        const f = t - i;
        const y0 = inRing[(i - 1) & IM]; const y1 = inRing[i & IM]; const y2 = inRing[(i + 1) & IM]; const y3 = inRing[(i + 2) & IM];
        return y1 + 0.5 * f * (y2 - y0 + f * (2 * y0 - 5 * y1 + 4 * y2 - y3 + f * (3 * (y1 - y2) + y3 - y0)));
    }
    function step(x) {
        inRing[n & IM] = x;
        while (nextT + 2 <= n) {
            let v = readIn(nextT);
            if (dither) v += (Math.random() - Math.random()) / 2 ** (bits - 1);
            sT[head] = nextT;
            sV[head] = codeValue(quantise(v, bits), bits);
            head = (head + 1) & SM;
            if (count < SN) count += 1;
            nextT += P;
        }
        const tau = n - delay;
        let y = 0;
        const reach = K * P;
        for (let j = 1; j <= count; j += 1) {
            const k = (head - j) & SM;
            const d = tau - sT[k];
            if (d > reach) break;
            if (d > -reach) y += sV[k] * kernel(d / P);
        }
        n += 1;
        return y;
    }
    function process(input, output) {
        for (let i = 0; i < input.length; i += 1) output[i] = step(input[i]);
    }
    return { K, kernel, quantise, codeValue, set, reset, step, process };
}

// The AudioWorklet's source: the converter above, word for word, in a
// processor. Loaded from a Blob, so no second copy of the maths exists.
export const WORKLET_NAME = 'adc-converter';
export function workletSource() {
    return `const makeConverter = ${makeConverter.toString()};
class AdcConverter extends AudioWorkletProcessor {
    constructor() { super(); this.c = makeConverter(); this.port.onmessage = (e) => { if (e.data && e.data.reset) this.c.reset(); else this.c.set(e.data || {}); }; }
    process(inputs, outputs) {
        const o = outputs[0] && outputs[0][0];
        if (!o) return true;
        const i = inputs[0] && inputs[0][0];
        if (i) this.c.process(i, o); else for (let k = 0; k < o.length; k += 1) o[k] = this.c.step(0);
        return true;
    }
}
registerProcessor('${WORKLET_NAME}', AdcConverter);
`;
}

const C = makeConverter();
export const KERNEL_REACH = C.K;
export const kernel = C.kernel;
export const quantise = C.quantise;
export const codeValue = C.codeValue;

// The host samples the converter lags by: the kernel's reach at the lowest
// rate, fixed so that turning the rate never jumps the sound.
export function converterDelay(hostRate) { return Math.ceil(KERNEL_REACH * (hostRate / (RATES[0] * 1000))) + 4; }
export function hostStep(hostRate, rateKhz) { return Math.max(1, hostRate / (rateKhz * 1000)); }

// ---- the numbers the paper asks for ----------------------------------------------
export const levels = (bits) => 2 ** bits;
export const dynamicRangeDb = (bits) => 6 * bits; // the paper's rule: about 6 dB a bit
export const nyquist = (rateKhz) => rateKhz / 2;
export const stepSize = (bits) => 1 / 2 ** (bits - 1); // one level, as a fraction of full scale
// The frequency a sound comes back as after sampling (kHz in, kHz out): it
// folds about every multiple of half the rate.
export function aliasOf(fKhz, rateKhz) {
    const a = Math.abs(fKhz - rateKhz * Math.round(fKhz / rateKhz));
    return Math.round(a * 1e6) / 1e6;
}
// Where a band of frequencies lands after sampling: the part above half
// the rate folds down, so a band from lo to hi comes back spread over the
// folds of every frequency in it (kHz). Null when none of it is above half.
export function foldBand(band, rateKhz) {
    const ny = rateKhz / 2;
    if (band.hi <= ny) return null;
    const a = Math.max(band.lo, ny);
    const ends = [aliasOf(a, rateKhz), aliasOf(band.hi, rateKhz)];
    let lo = Math.min(...ends); let hi = Math.max(...ends);
    // a multiple of the rate inside the band folds to 0; an odd multiple of
    // half the rate folds to half the rate
    if (Math.floor(band.hi / rateKhz) * rateKhz >= a) lo = 0;
    if (Math.floor((band.hi / ny - 1) / 2) * 2 + 1 >= a / ny) hi = ny;
    return { lo, hi };
}

// Two's complement, grouped in fours from the right.
export function binaryWord(code, bits) {
    const u = code < 0 ? 2 ** bits + code : code;
    const s = u.toString(2).padStart(bits, '0');
    let out = '';
    for (let i = 0; i < s.length; i += 1) {
        if (i && (s.length - i) % 4 === 0) out += ' ';
        out += s[i];
    }
    return out;
}

// ---- the anti-alias filter -----------------------------------------------------------
// A sixteenth-order Butterworth low-pass (eight biquads) just under half the
// sample rate, capped under the host's own half. The nodes run the same
// eight sections; the model draws and judges with the ideal curve.
export const FILTER_ORDER = 16;
export const FILTER_QS = Array.from({ length: FILTER_ORDER / 2 }, (_, k) => 1 / (2 * Math.cos((Math.PI * (2 * k + 1)) / (2 * FILTER_ORDER))));
export function filterCutoffHz(rateKhz, hostRate = 48000) { return Math.min(0.44 * rateKhz * 1000, 0.45 * hostRate); }
export function filterGain(fKhz, rateKhz, hostRate = 48000) {
    const fc = filterCutoffHz(rateKhz, hostRate);
    return 1 / Math.sqrt(1 + (fKhz * 1000 / fc) ** (2 * FILTER_ORDER));
}
// Web Audio reads a low-pass Q in dB of resonance, not as a plain Q.
export const qToDb = (q) => 20 * Math.log10(q);
// RBJ low-pass coefficients, for filtering a recording's window in the
// picture the way the nodes filter it in the graph.
export function lowpassCoefs(fcHz, q, sr) {
    const w0 = (2 * Math.PI * Math.min(fcHz, 0.49 * sr)) / sr;
    const alpha = Math.sin(w0) / (2 * q);
    const cw = Math.cos(w0);
    const a0 = 1 + alpha;
    return { b0: (1 - cw) / 2 / a0, b1: (1 - cw) / a0, b2: (1 - cw) / 2 / a0, a1: (-2 * cw) / a0, a2: (1 - alpha) / a0 };
}
export function filterRun(x, fcHz, sr) {
    let y = Float32Array.from(x);
    for (const q of FILTER_QS) {
        const { b0, b1, b2, a1, a2 } = lowpassCoefs(fcHz, q, sr);
        const out = new Float32Array(y.length);
        let x1 = 0; let x2 = 0; let y1 = 0; let y2 = 0;
        for (let i = 0; i < y.length; i += 1) {
            const v = b0 * y[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
            x2 = x1; x1 = y[i]; y2 = y1; y1 = v; out[i] = v;
        }
        y = out;
    }
    return y;
}

// ---- the picture ---------------------------------------------------------------------
// What the stage draws, from one state and a window of the signal: the
// voltage going in (before and after the filter), the samples at their
// times with the true value and the stored level, and the DAC's wave back.
// `signal(tMs)` gives the voltage in at a time in ms from the window's
// start; `raw(tMs)` the same before the filter. Times are in ms.
export function picture({ signal, raw, windowMs, rateKhz, bits, points = 480 }) {
    const T = 1 / rateKhz; // ms per sample
    const reach = KERNEL_REACH + 1;
    const k0 = -reach;
    const k1 = Math.ceil(windowMs / T) + reach;
    const samples = [];
    for (let k = k0; k <= k1; k += 1) {
        const t = k * T;
        const v = signal(t);
        const code = quantise(v, bits);
        samples.push({ k, t, v, code, q: codeValue(code, bits), inside: t >= -1e-9 && t <= windowMs + 1e-9 });
    }
    const line = [];
    const back = [];
    const before = [];
    for (let i = 0; i <= points; i += 1) {
        const t = (i / points) * windowMs;
        line.push(signal(t));
        before.push(raw ? raw(t) : null);
        let y = 0;
        const kc = t / T;
        for (const s of samples) {
            const d = kc - s.k;
            if (d > KERNEL_REACH || d < -KERNEL_REACH) continue;
            y += s.q * kernel(d);
        }
        back.push(y);
    }
    return { samples, inside: samples.filter((s) => s.inside), line, back, before: raw ? before : null, windowMs };
}

// ---- state ------------------------------------------------------------------------------
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
export const clamp01 = (v) => clamp(v, 0, 1);
export const rateIndex = (r) => { const i = RATES.indexOf(r); return i < 0 ? RATES.indexOf(44.1) : i; };
export const fmtKhz = (k) => `${Number.isInteger(k) ? k : k.toString()} kHz`;
export function fmtHzKhz(khz) { return khz >= 1 ? `${Math.round(khz * 1000) / 1000} kHz` : `${Math.round(khz * 1000)} Hz`; }
export const fmtLevels = (bits) => levels(bits).toLocaleString('en-GB');

export const PRESETS = [
    { id: 'cd', name: 'CD', blurb: 'The song at 44.1 kHz and 16 bit: every frequency you can hear kept, 65,536 levels', set: { source: 'song', rate: 44.1, bits: 16 } },
    { id: 's900low', name: 'Akai S900, 7.5k', blurb: 'A 1980s sampler at its lowest rate: 7.5 kHz and 12 bit. Nothing above 3.75 kHz, and 4,096 levels', set: { source: 'song', rate: 7.5, bits: 12 } },
    { id: 's900high', name: 'Akai S900, 40k', blurb: 'The same sampler at its highest rate: 40 kHz and 12 bit. The top end is back; the 12 bits still hiss more than 16', set: { source: 'song', rate: 40, bits: 12 } },
    { id: 'grit', name: '4-bit file', blurb: 'The vocal at 44.1 kHz and 4 bit: sixteen levels, and the crunch is loudest where the voice is quietest', set: { source: 'vocal', rate: 44.1, bits: 4 } },
    { id: 'alias', name: 'Aliasing', blurb: 'The song at 8 kHz with the filter off: the hi-hats above 4 kHz fold down as false, clangy tones', set: { source: 'song', rate: 8, bits: 16, filter: false } },
];

function baseState() {
    return { source: 'song', rate: 20, bits: 16, filter: true, dither: false, presetId: null, volume: 0.5 };
}
// The first screen is the song at 20 kHz, 16 bit: a hundred dots across
// five milliseconds, clean, everything up to 10 kHz kept. One idea
// (samples) before the second (levels).
export const DEFAULT_STATE = baseState();
export function applyPreset(state, id) {
    const p = PRESETS.find((x) => x.id === id);
    if (!p) return state;
    return { ...baseState(), volume: state.volume, ...p.set, presetId: id };
}
const drop = (state) => ({ ...state, presetId: null });
export function setSource(state, source) { return SOURCES[source] && source !== state.source ? { ...drop(state), source } : state; }
export function setRate(state, rate) { return RATES.includes(rate) && rate !== state.rate ? { ...drop(state), rate } : state; }
export function setRateIndex(state, i) { return setRate(state, RATES[clamp(Math.round(i), 0, RATES.length - 1)]); }
export function setBits(state, bits) { const b = clamp(Math.round(bits), BITS_MIN, BITS_MAX); return b === state.bits ? state : { ...drop(state), bits: b }; }
export function setFilter(state, on) { return on === state.filter ? state : { ...drop(state), filter: Boolean(on) }; }
export function setDither(state, on) { return on === state.dither ? state : { ...drop(state), dither: Boolean(on) }; }
export function setVolume(state, volume) { return { ...state, volume: clamp01(volume) }; }
// The sample-period bracket on the stage dragged to a new length (ms): the
// nearest rate on the dial's steps.
export function rateFromPeriod(ms) {
    const want = 1 / Math.max(ms, 1e-6);
    let best = RATES[0];
    for (const r of RATES) if (Math.abs(Math.log(r / want)) < Math.abs(Math.log(best / want))) best = r;
    return best;
}

// ---- reading the state -----------------------------------------------------------------
// What happens to the sound, in one key the stage, the line and the gate share.
export function readings(state) {
    const ny = nyquist(state.rate);
    const band = SOURCES[state.source].band;
    const above = band.hi > ny;
    let key;
    if (state.bits <= 3) key = 'swallowed';
    else if (state.bits <= 6) key = 'grit';
    else if (state.bits <= 10) key = 'hiss';
    else if (!state.filter && above) key = 'alias';
    else if (ny < 20) key = 'dull';
    else key = 'clean';
    return {
        nyquist: ny, band, above, fold: state.filter ? null : foldBand(band, state.rate), key,
        levels: levels(state.bits), dynamicRange: dynamicRangeDb(state.bits), step: stepSize(state.bits),
        hearing: ny >= 20,
    };
}
