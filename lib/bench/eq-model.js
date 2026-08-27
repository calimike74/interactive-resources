// The EQ bench's model: pure functions, no DOM, no Web Audio. The filter
// nodes and the stage read THESE numbers, so the curve on the stage can
// never drift from the sound (Bench Standard §3 law 6). The response maths
// is the RBJ cookbook, which is also what BiquadFilterNode implements, so
// the curve drawn before Play is pressed is the curve the nodes will make.
// Tested in tests/bench-eq-model.test.mjs.

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const LN2 = Math.LN2;

export const SAMPLE_RATE = 48000;
export const GAIN_MIN = -15;
export const GAIN_MAX = 15;
export const Q_MIN = 0.3;
export const Q_MAX = 10;
export const HZ_MIN = 20;
export const HZ_MAX = 20000;
export const DB_SPAN = 18; // the stage's ± range

// The five bands of a channel-strip EQ, in the order the signal meets them.
// The exam's words: high-pass and low-pass filters (cutoff, slope), low
// and high shelves (gain), and one parametric band (frequency, gain, Q).
export const BAND_IDS = ['hpf', 'low', 'mid', 'high', 'lpf'];
export const BANDS = {
    hpf: { label: 'HPF', name: 'high-pass filter', type: 'highpass', hzMin: 20, hzMax: 1000, slopes: [12, 24, 48], colour: 'var(--gen-2)' },
    low: { label: 'Low', name: 'low shelf', type: 'lowshelf', hzMin: 40, hzMax: 500, colour: 'var(--gen-1)' },
    mid: { label: 'Mid', name: 'parametric band', type: 'peaking', hzMin: 100, hzMax: 8000, colour: 'var(--gen-5)' },
    high: { label: 'High', name: 'high shelf', type: 'highshelf', hzMin: 1500, hzMax: 16000, colour: 'var(--gen-4)' },
    lpf: { label: 'LPF', name: 'low-pass filter', type: 'lowpass', hzMin: 1000, hzMax: 20000, slopes: [12, 24, 48], colour: 'var(--gen-3)' },
};
export const hasGain = (id) => id === 'low' || id === 'mid' || id === 'high';
export const hasQ = (id) => id === 'mid';
export const hasSlope = (id) => id === 'hpf' || id === 'lpf';

// A graphic EQ is a parametric band with the frequency and the width locked:
// these are the ISO octave centres the Mid band snaps to in Graphic mode.
export const OCTAVE_CENTRES = [125, 250, 500, 1000, 2000, 4000, 8000];
export const OCTAVE_Q = 1.41;

export const DEFAULT_STATE = Object.freeze({
    presetId: 'flat',
    source: 'drums',
    band: 'mid',
    graphic: false,
    match: false,
    level: 0.8,
    hpf: { on: false, hz: 80, slope: 12 },
    low: { on: false, hz: 100, gain: 0 },
    mid: { on: true, hz: 1000, gain: 0, q: 1 },
    high: { on: false, hz: 8000, gain: 0 },
    lpf: { on: false, hz: 12000, slope: 12 },
});

// Frequencies are set on a log scale: 0..1 across the band's range.
export function hzFromPos(pos, hzMin, hzMax) {
    const x = clamp(pos, 0, 1);
    return Math.exp(Math.log(hzMin) + (Math.log(hzMax) - Math.log(hzMin)) * x);
}
export function posFromHz(hz, hzMin, hzMax) {
    return clamp((Math.log(hz) - Math.log(hzMin)) / (Math.log(hzMax) - Math.log(hzMin)), 0, 1);
}
// A frequency snapped to the nearest octave centre inside the band's range.
export function snapOctave(hz, hzMin = 100, hzMax = 8000) {
    const inRange = OCTAVE_CENTRES.filter((c) => c >= hzMin && c <= hzMax);
    return inRange.reduce((best, c) => (Math.abs(Math.log(c / hz)) < Math.abs(Math.log(best / hz)) ? c : best), inRange[0]);
}

// The Q the nodes get. Web Audio takes lowpass/highpass Q in dB, so a
// Butterworth section (Q 0.707) is written as -3.01 dB there; shelves
// ignore Q (their slope parameter is fixed at 1); peaking takes Q as Q.
export const BUTTERWORTH_Q_DB = 20 * Math.log10(Math.SQRT1_2);

// What one band asks of one biquad section: the parameters the RBJ maths
// and the BiquadFilterNode both take. Each section is 12 dB/oct: a 24 dB/oct
// filter is two sections in series, the paper's 48 dB/oct is four.
export function sectionsOf(state, id) {
    const b = state[id];
    const def = BANDS[id];
    if (!b || !b.on) return [];
    const hz = clamp(b.hz, def.hzMin, def.hzMax);
    if (id === 'hpf' || id === 'lpf') {
        const n = Math.max(1, Math.min(4, Math.round((b.slope || 12) / 12)));
        return Array.from({ length: n }, () => ({ type: def.type, hz, q: Math.SQRT1_2, gain: 0 }));
    }
    if (id === 'mid') {
        const q = state.graphic ? OCTAVE_Q : clamp(b.q, Q_MIN, Q_MAX);
        const f = state.graphic ? snapOctave(hz, def.hzMin, def.hzMax) : hz;
        return [{ type: 'peaking', hz: f, q, gain: clamp(b.gain, GAIN_MIN, GAIN_MAX) }];
    }
    return [{ type: def.type, hz, q: Math.SQRT1_2, gain: clamp(b.gain, GAIN_MIN, GAIN_MAX) }];
}

// RBJ Audio EQ Cookbook coefficients, as BiquadFilterNode computes them.
export function coefficients({ type, hz, q, gain = 0 }, sampleRate = SAMPLE_RATE) {
    const w0 = 2 * Math.PI * clamp(hz, 1, sampleRate / 2 - 1) / sampleRate;
    const cos = Math.cos(w0);
    const sin = Math.sin(w0);
    const A = Math.pow(10, gain / 40);
    let b0; let b1; let b2; let a0; let a1; let a2;
    switch (type) {
        case 'lowpass': {
            const alpha = sin / (2 * q);
            b0 = (1 - cos) / 2; b1 = 1 - cos; b2 = (1 - cos) / 2;
            a0 = 1 + alpha; a1 = -2 * cos; a2 = 1 - alpha;
            break;
        }
        case 'highpass': {
            const alpha = sin / (2 * q);
            b0 = (1 + cos) / 2; b1 = -(1 + cos); b2 = (1 + cos) / 2;
            a0 = 1 + alpha; a1 = -2 * cos; a2 = 1 - alpha;
            break;
        }
        case 'peaking': {
            const alpha = sin / (2 * q);
            b0 = 1 + alpha * A; b1 = -2 * cos; b2 = 1 - alpha * A;
            a0 = 1 + alpha / A; a1 = -2 * cos; a2 = 1 - alpha / A;
            break;
        }
        case 'lowshelf': {
            const S = 1;
            const alpha = (sin / 2) * Math.sqrt((A + 1 / A) * (1 / S - 1) + 2);
            const k = 2 * Math.sqrt(A) * alpha;
            b0 = A * ((A + 1) - (A - 1) * cos + k);
            b1 = 2 * A * ((A - 1) - (A + 1) * cos);
            b2 = A * ((A + 1) - (A - 1) * cos - k);
            a0 = (A + 1) + (A - 1) * cos + k;
            a1 = -2 * ((A - 1) + (A + 1) * cos);
            a2 = (A + 1) + (A - 1) * cos - k;
            break;
        }
        case 'highshelf': {
            const S = 1;
            const alpha = (sin / 2) * Math.sqrt((A + 1 / A) * (1 / S - 1) + 2);
            const k = 2 * Math.sqrt(A) * alpha;
            b0 = A * ((A + 1) + (A - 1) * cos + k);
            b1 = -2 * A * ((A - 1) + (A + 1) * cos);
            b2 = A * ((A + 1) + (A - 1) * cos - k);
            a0 = (A + 1) - (A - 1) * cos + k;
            a1 = 2 * ((A - 1) - (A + 1) * cos);
            a2 = (A + 1) - (A - 1) * cos - k;
            break;
        }
        default:
            throw new Error(`unknown filter type ${type}`);
    }
    return { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: a1 / a0, a2: a2 / a0 };
}

// Magnitude (dB) and phase (radians) of one section at one frequency.
export function sectionResponse(coef, hz, sampleRate = SAMPLE_RATE) {
    const w = 2 * Math.PI * hz / sampleRate;
    const c1 = Math.cos(w); const s1 = Math.sin(w);
    const c2 = Math.cos(2 * w); const s2 = Math.sin(2 * w);
    // H(e^jw) = (b0 + b1 e^-jw + b2 e^-2jw) / (1 + a1 e^-jw + a2 e^-2jw)
    const nr = coef.b0 + coef.b1 * c1 + coef.b2 * c2;
    const ni = -(coef.b1 * s1 + coef.b2 * s2);
    const dr = 1 + coef.a1 * c1 + coef.a2 * c2;
    const di = -(coef.a1 * s1 + coef.a2 * s2);
    const mag = Math.sqrt((nr * nr + ni * ni) / (dr * dr + di * di));
    const phase = Math.atan2(ni, nr) - Math.atan2(di, dr);
    return { db: 20 * Math.log10(Math.max(mag, 1e-9)), phase };
}

// The whole EQ's response at a list of frequencies: the sum of every band
// in the chain (in dB, because they are in series). `only` limits it to
// one band, for drawing that band's own curve under the total.
export function response(state, freqs, { only = null, sampleRate = SAMPLE_RATE } = {}) {
    const ids = only ? [only] : BAND_IDS;
    const coefs = ids.flatMap((id) => sectionsOf(state, id).map((sec) => coefficients(sec, sampleRate)));
    return freqs.map((hz) => {
        let db = 0;
        let phase = 0;
        for (const c of coefs) {
            const r = sectionResponse(c, hz, sampleRate);
            db += r.db;
            phase += r.phase;
        }
        // keep the phase inside ±π for drawing
        phase = Math.atan2(Math.sin(phase), Math.cos(phase));
        return { hz, db, phase };
    });
}

// Log-spaced frequencies across the stage.
export function logFreqs(n = 256, lo = HZ_MIN, hi = HZ_MAX) {
    return Array.from({ length: n }, (_, i) => hzFromPos(i / (n - 1), lo, hi));
}

// Bandwidth of a peaking band in octaves, from its Q (the two -3 dB points).
export function bandwidthOctaves(q) {
    return (2 / LN2) * Math.asinh(1 / (2 * q));
}

// The frequency where a high-pass or low-pass is 3 dB down, and how far
// down it is an octave beyond that: the two numbers a slope answer needs.
export function slopeFacts(id, state) {
    const b = state[id];
    const hz = b.hz;
    const octaveAway = id === 'hpf' ? hz / 2 : hz * 2;
    const r = response(state, [hz, octaveAway], { only: id });
    return { hz, atCutoffDb: r[0].db, octaveDb: r[1].db, slope: b.slope, order: Math.round(b.slope / 6) };
}

// The loudest and quietest points of the whole curve, for the headroom
// verdict and the level match.
export function peakOf(state, n = 128) {
    const r = response(state, logFreqs(n));
    let max = -Infinity; let min = Infinity; let maxHz = 0; let minHz = 0;
    for (const p of r) {
        if (p.db > max) { max = p.db; maxHz = p.hz; }
        if (p.db < min) { min = p.db; minHz = p.hz; }
    }
    return { maxDb: max, maxHz, minDb: min, minHz };
}

// Level match: pull the output down by the curve's biggest boost, so a
// boost cannot win the comparison just by being louder.
export function matchTrimDb(state) {
    if (!state.match) return 0;
    return -Math.max(0, peakOf(state).maxDb);
}

// Where a frequency sits for the ear, in the words a mix engineer uses.
export const REGIONS = [
    { lo: 0, hi: 60, id: 'sub', name: 'sub', line: 'felt more than heard: kick weight, 808 tails, rumble' },
    { lo: 60, hi: 250, id: 'bass', name: 'bass', line: 'the low end: kick body, bass fundamentals, the warmth of a voice' },
    { lo: 250, hi: 500, id: 'lowmid', name: 'low mids', line: 'where mud and boxiness live: most cuts on a busy mix go here' },
    { lo: 500, hi: 2000, id: 'mid', name: 'mids', line: 'the body of most instruments and the honk of a voice' },
    { lo: 2000, hi: 5000, id: 'presence', name: 'presence', line: 'attack, intelligibility, the crack of a snare; the ear is most sensitive here' },
    { lo: 5000, hi: 8000, id: 'sibilance', name: 'sibilance', line: 'the s and t of a voice, the top of a hi-hat' },
    { lo: 8000, hi: 30000, id: 'air', name: 'air', line: 'sheen and hiss: brightness, and the noise that comes with it' },
];
export function regionOf(hz) {
    return REGIONS.find((r) => hz >= r.lo && hz < r.hi) || REGIONS[REGIONS.length - 1];
}

export const PRESETS = [
    {
        id: 'flat',
        name: 'Flat',
        blurb: 'Every band at zero: the source as it is.',
        state: { graphic: false, hpf: { on: false, hz: 80, slope: 12 }, low: { on: false, hz: 100, gain: 0 }, mid: { on: true, hz: 1000, gain: 0, q: 1 }, high: { on: false, hz: 8000, gain: 0 }, lpf: { on: false, hz: 12000, slope: 12 } },
    },
    {
        id: 'vocal',
        name: 'Vocal clean-up',
        blurb: 'High-pass under the voice, a cut in the mud, a little presence.',
        state: { graphic: false, source: 'vocal', band: 'mid', hpf: { on: true, hz: 100, slope: 12 }, low: { on: false, hz: 100, gain: 0 }, mid: { on: true, hz: 350, gain: -4, q: 1.5 }, high: { on: true, hz: 8000, gain: 2 }, lpf: { on: false, hz: 12000, slope: 12 } },
    },
    {
        id: 'drums',
        name: 'Drum weight',
        blurb: 'Shelf up the kick, cut the boxiness, open the top.',
        state: { graphic: false, source: 'drums', band: 'low', hpf: { on: true, hz: 35, slope: 12 }, low: { on: true, hz: 80, gain: 3 }, mid: { on: true, hz: 400, gain: -3, q: 1.2 }, high: { on: true, hz: 8000, gain: 2 }, lpf: { on: false, hz: 12000, slope: 12 } },
    },
    {
        id: 'telephone',
        name: 'Telephone',
        blurb: 'A high-pass and a low-pass together: the band-pass every breakdown uses.',
        state: { graphic: false, band: 'hpf', hpf: { on: true, hz: 500, slope: 24 }, low: { on: false, hz: 100, gain: 0 }, mid: { on: true, hz: 1500, gain: 3, q: 1 }, high: { on: false, hz: 8000, gain: 0 }, lpf: { on: true, hz: 3000, slope: 24 } },
    },
    {
        id: 'toomuch',
        name: 'Too much',
        blurb: 'A big narrow boost where the ear is most sensitive. Judge it.',
        state: { graphic: false, source: 'vocal', band: 'mid', hpf: { on: false, hz: 80, slope: 12 }, low: { on: false, hz: 100, gain: 0 }, mid: { on: true, hz: 3000, gain: 12, q: 4 }, high: { on: false, hz: 8000, gain: 0 }, lpf: { on: false, hz: 12000, slope: 12 } },
    },
    // The 2023 paper's Q6 vocal EQ (9MT0/04), as the Principal Examiner's
    // report describes it: the mids and highs boosted for brightness, the
    // lows boosted too, "all of the frequencies were boosted". The report
    // gives no numbers; these are the shape. On the vocal, to judge.
    {
        id: 'paper2023',
        name: '2023 paper',
        blurb: "The paper's vocal EQ as the report describes it: every band boosted. Judge it.",
        state: { graphic: false, source: 'vocal', band: 'low', hpf: { on: false, hz: 80, slope: 12 }, low: { on: true, hz: 120, gain: 4 }, mid: { on: true, hz: 3000, gain: 4, q: 1 }, high: { on: true, hz: 8000, gain: 4 }, lpf: { on: false, hz: 12000, slope: 12 } },
    },
    // The 2024 paper's Q3(a): a 48 dB/octave high-pass on the bass, which
    // the student had to explain and then draw (cutoff between 200 Hz and
    // 1 kHz, steeper than 45 degrees, reaching -20 dB). On the 808, the
    // nearest thing on the bench to a bass part.
    {
        id: 'paper2024',
        name: '2024 paper',
        blurb: "The paper's 48 dB/oct high-pass, drawn for you. Hear what it does to a bass part.",
        state: { graphic: false, source: 'electronic', band: 'hpf', hpf: { on: true, hz: 400, slope: 48 }, low: { on: false, hz: 100, gain: 0 }, mid: { on: false, hz: 1000, gain: 0, q: 1 }, high: { on: false, hz: 8000, gain: 0 }, lpf: { on: false, hz: 12000, slope: 12 } },
    },
];

export function applyPreset(state, presetId) {
    const preset = PRESETS.find((p) => p.id === presetId);
    if (!preset) return { ...state };
    return { ...state, ...preset.state, presetId };
}

// Set one field of one band; returns a new state with the preset cleared.
export function setBand(state, id, patch) {
    const def = BANDS[id];
    const next = { ...state[id], ...patch };
    if ('hz' in patch) next.hz = Math.round(clamp(patch.hz, def.hzMin, def.hzMax));
    if ('gain' in patch) next.gain = Math.round(clamp(patch.gain, GAIN_MIN, GAIN_MAX) * 2) / 2;
    if ('q' in patch) next.q = Math.round(clamp(patch.q, Q_MIN, Q_MAX) * 100) / 100;
    return { ...state, [id]: next, presetId: null };
}

export const fmtHz = (hz) => (hz >= 1000 ? `${(hz / 1000).toFixed(hz >= 10000 ? 0 : 1).replace(/\.0$/, '')} kHz` : `${Math.round(hz)} Hz`);
export const fmtDb = (raw) => { const db = Math.abs(raw) < 0.05 ? 0 : raw; return `${db > 0 ? '+' : db < 0 ? '−' : ''}${Math.abs(db).toFixed(1).replace(/\.0$/, '')} dB`; };

// Phase for drawing: a chain of sections can turn more than ±π, and a
// wrapped phase draws as false vertical jumps. Unwrapped, it is one line.
export function unwrapPhase(points) {
    let offset = 0;
    let prev = null;
    return points.map((p) => {
        let ph = p.phase;
        if (prev != null) {
            const d = ph - prev;
            if (d > Math.PI) offset -= 2 * Math.PI;
            else if (d < -Math.PI) offset += 2 * Math.PI;
        }
        prev = ph;
        return { ...p, phase: ph + offset };
    });
}
