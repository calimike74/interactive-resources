// The Dynamics bench's model (1.9): pure functions, no DOM, no Web Audio.
// The bench's sources are loops of known samples at a known tempo, so the
// level of the signal at every half-millisecond of the loop is known before
// Play is pressed. The gain computer and the attack/release smoothing run
// over that envelope here, and the SAME gain series drives the GainNode by
// automation and is drawn on the stage: what is heard is what is drawn
// (Bench Standard §3 law 6). Feed-forward design with a quadratic soft
// knee and one-pole gain smoothing in dB, the textbook shape (Giannoulis,
// Massberg and Reiss 2012; Cipriani and Giri vol. 2 ch. 7).
// Tested in tests/bench-comp-model.test.mjs.

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export const DB_FLOOR = -60; // the stage's floor: silence sits here
export const DT_MS = 0.5; // the envelope's step: fine enough for a 1 ms attack
export const GATE_RANGE = 80; // how far a closed gate turns the signal down
export const EXPANDER_RANGE = 40; // an expander never goes further down than this
export const THRESH_MIN = -60;
export const THRESH_MAX = 0;
export const RATIO_MIN = 1;
export const RATIO_MAX = 20;
export const KNEE_MAX = 12;
export const ATTACK_MIN = 0.1;
export const ATTACK_MAX = 100;
export const RELEASE_MIN = 10;
export const RELEASE_MAX = 2000;
export const MAKEUP_MAX = 24;

// The four processors the spec names, one machine each.
export const MODE_IDS = ['comp', 'limiter', 'gate', 'expander'];
export const MODES = {
    comp: { label: 'Compressor', name: 'compressor', does: 'turns the loud parts down', side: 'above' },
    limiter: { label: 'Limiter', name: 'limiter', does: 'lets nothing past the threshold', side: 'above' },
    gate: { label: 'Gate', name: 'gate', does: 'shuts off everything under the threshold', side: 'below' },
    expander: { label: 'Expander', name: 'expander', does: 'turns the quiet parts further down', side: 'below' },
};
export const isDownward = (mode) => mode === 'gate' || mode === 'expander';
export const hasRatio = (mode) => mode === 'comp' || mode === 'expander';
export const hasKnee = (mode) => mode === 'comp' || mode === 'expander';

export const DEFAULT_STATE = Object.freeze({
    presetId: 'gentle',
    source: 'drums',
    mode: 'comp',
    on: true,
    threshold: -12,
    ratio: 3,
    knee: 6,
    attack: 10,
    release: 150,
    makeup: 0,
    level: 0.8,
});

// The ratio the maths uses: a limiter is a compressor at infinity, a gate an
// expander at infinity.
export function ratioOf(state) {
    if (state.mode === 'limiter' || state.mode === 'gate') return Infinity;
    return clamp(state.ratio, RATIO_MIN, RATIO_MAX);
}

// The static gain computer: how much the processor turns this input level
// down, in dB (never positive), before make-up gain. This is the curve the
// paper asks for, minus the make-up that lifts it.
export function staticGainDb(inDb, state) {
    if (!state.on) return 0;
    const T = state.threshold;
    const R = ratioOf(state);
    const W = hasKnee(state.mode) ? clamp(state.knee, 0, KNEE_MAX) : 0;
    if (!isDownward(state.mode)) {
        const slope = R === Infinity ? 0 : 1 / R;
        const over = inDb - T;
        if (W > 0 && Math.abs(over) <= W / 2) return ((slope - 1) * (over + W / 2) * (over + W / 2)) / (2 * W);
        if (over <= 0) return 0;
        return (slope - 1) * over;
    }
    const range = state.mode === 'gate' ? GATE_RANGE : EXPANDER_RANGE;
    const under = T - inDb;
    if (R === Infinity) return under > 0 ? -range : 0;
    let g;
    if (W > 0 && Math.abs(under) <= W / 2) g = ((1 - R) * (under + W / 2) * (under + W / 2)) / (2 * W);
    else if (under <= 0) g = 0;
    else g = -(R - 1) * under;
    return Math.max(-range, g);
}

export function outputDb(inDb, state) {
    return inDb + staticGainDb(inDb, state) + (state.on ? clamp(state.makeup, 0, MAKEUP_MAX) : 0);
}

// The transfer curve for drawing: input against output, floor to full scale.
export function transferCurve(state, n = 97) {
    return Array.from({ length: n }, (_, i) => {
        const inDb = DB_FLOOR + ((0 - DB_FLOOR) * i) / (n - 1);
        return { inDb, outDb: outputDb(inDb, state) };
    });
}

// Attack and release as one-pole time constants on the gain, in dB: one
// attack time in, the gain is 63% of the way to where it is going. A
// compressor attacks when it is asked for MORE reduction; a gate attacks
// when it OPENS (less reduction), which is the other way round. The loop
// is run twice and the second pass kept, so the start of the loop is the
// steady state the end of the loop leaves it in.
export function smoothGain(target, state, dtMs = DT_MS) {
    const n = target.length;
    const out = new Float32Array(n);
    const aA = Math.exp(-dtMs / clamp(state.attack, ATTACK_MIN, ATTACK_MAX));
    const aR = Math.exp(-dtMs / clamp(state.release, RELEASE_MIN, RELEASE_MAX));
    const down = isDownward(state.mode);
    let g = target[0] || 0;
    for (let pass = 0; pass < 2; pass += 1) {
        for (let i = 0; i < n; i += 1) {
            const t = target[i];
            const more = t < g; // asked for more reduction
            const coef = down ? (more ? aR : aA) : (more ? aA : aR);
            g = coef * g + (1 - coef) * t;
            if (pass === 1) out[i] = g;
        }
    }
    return out;
}

// The loop's peak level in dB at every step.
export function envelopeDb(mix, sampleRate, stepMs = DT_MS) {
    const per = Math.max(1, Math.round((sampleRate * stepMs) / 1000));
    const n = Math.floor(mix.length / per);
    const env = new Float32Array(n);
    for (let i = 0; i < n; i += 1) {
        let m = 0;
        const s = i * per;
        const e = Math.min(mix.length, s + per);
        for (let j = s; j < e; j += 1) { const a = Math.abs(mix[j]); if (a > m) m = a; }
        env[i] = m > 0 ? Math.max(DB_FLOOR, 20 * Math.log10(m)) : DB_FLOOR;
    }
    return env;
}

// The loop, mixed from the pattern exactly where the scheduler books it
// (lib/bench/sources.js scheduleBar): steps in 16ths, gains as booked.
export function mixPattern(pattern, buffers, bpm, sampleRate) {
    const barLen = Math.round((4 * 60 * sampleRate) / bpm);
    const mix = new Float32Array(barLen * pattern.bars);
    for (const step of pattern.steps) {
        const buf = buffers[step.name];
        if (!buf) continue;
        const data = buf.getChannelData(0);
        const start = Math.floor(step.s / 16) * barLen + Math.round(((step.s % 16) * barLen) / 16);
        const g = step.g;
        for (let j = 0; j < data.length && start + j < mix.length; j += 1) mix[start + j] += data[j] * g;
    }
    return mix;
}

// The loop's envelope from the decoded buffers: computed once per source
// and tempo, then every setting is judged against it.
export function loopOf(pattern, buffers, bpm) {
    const first = pattern.steps.map((s) => buffers[s.name]).find(Boolean);
    if (!first) return null;
    const sampleRate = first.sampleRate;
    const mix = mixPattern(pattern, buffers, bpm, sampleRate);
    const envDb = envelopeDb(mix, sampleRate, DT_MS);
    return { envDb, dtMs: DT_MS, seconds: mix.length / sampleRate, sampleRate };
}

// The whole loop through the processor: the gain series the GainNode plays
// and the stage draws, the output envelope, and the numbers the console
// reads. `overPct` is how much of the loop is on the working side of the
// threshold; `softIn` is the loop's quiet level while it is sounding (its
// tenth percentile above the floor), so rangeIn is loud to soft.
export function runLoop(state, envDb, dtMs = DT_MS) {
    const n = envDb.length;
    const target = new Float32Array(n);
    for (let i = 0; i < n; i += 1) target[i] = staticGainDb(envDb[i], state);
    const gainDb = smoothGain(target, state, dtMs);
    const makeup = state.on ? clamp(state.makeup, 0, MAKEUP_MAX) : 0;
    const outDb = new Float32Array(n);
    let maxGr = 0; let sumGr = 0; let over = 0; let peakIn = DB_FLOOR; let peakOut = DB_FLOOR;
    const sounding = [];
    const soundingOut = [];
    for (let i = 0; i < n; i += 1) {
        const g = gainDb[i];
        outDb[i] = envDb[i] + g + makeup;
        if (-g > maxGr) maxGr = -g;
        sumGr -= g;
        if (envDb[i] > peakIn) peakIn = envDb[i];
        if (outDb[i] > peakOut) peakOut = outDb[i];
        const working = isDownward(state.mode) ? envDb[i] < state.threshold : envDb[i] > state.threshold;
        if (working) over += 1;
        if (envDb[i] > DB_FLOOR + 10) { sounding.push(envDb[i]); soundingOut.push(outDb[i]); }
    }
    const pct = (arr, p) => { if (!arr.length) return DB_FLOOR; const s = Float32Array.from(arr).sort(); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
    const softIn = pct(sounding, 0.1);
    const softOut = pct(soundingOut, 0.1);
    return {
        gainDb,
        outDb,
        stats: {
            maxGr,
            meanGr: n ? sumGr / n : 0,
            overPct: n ? (100 * over) / n : 0,
            peakIn,
            peakOut,
            softIn,
            softOut,
            rangeIn: peakIn - softIn,
            rangeOut: peakOut - softOut,
        },
    };
}

// Linear gain for the GainNode, from the dB series.
export function gainCurve(gainDb) {
    const out = new Float32Array(gainDb.length);
    for (let i = 0; i < gainDb.length; i += 1) out[i] = Math.pow(10, gainDb[i] / 20);
    return out;
}

// Dials on a log scale: 0..1 across a range.
export function fromPos(pos, lo, hi) { return Math.exp(Math.log(lo) + (Math.log(hi) - Math.log(lo)) * clamp(pos, 0, 1)); }
export function toPos(v, lo, hi) { return clamp((Math.log(v) - Math.log(lo)) / (Math.log(hi) - Math.log(lo)), 0, 1); }

export const fmtDb = (raw) => { const db = Math.abs(raw) < 0.05 ? 0 : raw; return `${db > 0 ? '+' : db < 0 ? '−' : ''}${Math.abs(db).toFixed(1).replace(/\.0$/, '')} dB`; };
export const fmtMs = (ms) => (ms < 1 ? `${ms.toFixed(1)} ms` : ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(1).replace(/\.0$/, '')} s`);
export const fmtRatio = (r) => (r === Infinity ? '∞:1' : `${Number(r.toFixed(1)).toString()}:1`);
export const fmtExpansion = (r) => (r === Infinity ? '1:∞' : `1:${Number(r.toFixed(1)).toString()}`);
// The ratio as the console shows it for the chosen processor.
export function ratioLabel(state) {
    const r = ratioOf(state);
    return isDownward(state.mode) ? fmtExpansion(r) : fmtRatio(r);
}

// Attack and release in words: what a student writes on the paper.
export function attackWord(ms) { return ms < 5 ? 'fast' : ms <= 30 ? 'medium' : 'slow'; }
export function releaseWord(ms) { return ms < 60 ? 'fast' : ms <= 500 ? 'medium' : 'slow'; }

export const PRESETS = [
    {
        id: 'gentle',
        name: 'Gentle',
        blurb: 'A little: 3:1 at −12 dB, a soft knee, 10 ms in and 150 ms out. The starting point on almost anything.',
        state: { mode: 'comp', on: true, source: 'drums', threshold: -12, ratio: 3, knee: 6, attack: 10, release: 150, makeup: 0 },
    },
    {
        id: 'vocal',
        name: 'Vocal level',
        blurb: 'Even the phrase out: the loud words down, the quiet words made up. What the practical papers mark.',
        state: { mode: 'comp', on: true, source: 'vocal', threshold: -18, ratio: 3, knee: 6, attack: 10, release: 150, makeup: 4 },
    },
    {
        id: 'punch',
        name: 'Drum punch',
        blurb: 'A slow attack lets the hit through, a fast release brings the ring up behind it.',
        state: { mode: 'comp', on: true, source: 'drums', threshold: -10, ratio: 4, knee: 0, attack: 30, release: 80, makeup: 3 },
    },
    {
        id: 'sustain',
        name: 'Sustain',
        blurb: 'A fast attack squashes the front of the stab and make-up lifts its tail: longer, not louder.',
        state: { mode: 'comp', on: true, source: 'stab', threshold: -24, ratio: 6, knee: 6, attack: 1, release: 300, makeup: 8 },
    },
    {
        id: 'limiter',
        name: 'Limiter',
        blurb: 'Ratio at infinity: nothing gets past the threshold. The line the 2023 AS paper asked you to draw.',
        state: { mode: 'limiter', on: true, source: 'electronic', threshold: -8, ratio: 20, knee: 0, attack: 0.1, release: 100, makeup: 4 },
    },
    {
        id: 'gatehats',
        name: 'Gate the hats',
        blurb: 'A gate with its threshold between the hats and the snare: only the kick and snare get through.',
        state: { mode: 'gate', on: true, source: 'drums', threshold: -8, ratio: 20, knee: 0, attack: 0.5, release: 60, makeup: 0 },
    },
    // The 2022 paper's Q4(a)(iii), drawn from its mark scheme: threshold at
    // -30 dB, 10:1, hard knee, and make-up so that -30 in comes out at -20.
    // On the vocal, because the question was a rap vocal.
    {
        id: 'paper2022',
        name: '2022 paper',
        blurb: "The paper's curve: −30 dB, 10:1, hard knee, +10 dB make-up, on the vocal. Read it off the stage, then draw it.",
        state: { mode: 'comp', on: true, source: 'vocal', threshold: -30, ratio: 10, knee: 0, attack: 10, release: 150, makeup: 10 },
    },
    // The 2023 paper's Q6 vocal compressor, as the report describes it: a
    // very high ratio, a heavily compressed vocal, and make-up gain that
    // candidates misunderstood. The report gives no numbers; this is the
    // shape.
    {
        id: 'paper2023',
        name: '2023 paper',
        blurb: "The paper's vocal compressor as the report describes it: a very high ratio, heavily compressed. Judge it.",
        state: { mode: 'comp', on: true, source: 'vocal', threshold: -24, ratio: 20, knee: 0, attack: 5, release: 100, makeup: 10 },
    },
];

export function applyPreset(state, presetId) {
    const preset = PRESETS.find((p) => p.id === presetId);
    if (!preset) return { ...state };
    return { ...state, ...preset.state, presetId };
}

const round = (v, places) => { const m = Math.pow(10, places); return Math.round(v * m) / m; };

// Set one or more parameters; returns a new state with the preset cleared.
export function setParam(state, patch) {
    const next = { ...state, ...patch, presetId: null };
    if ('threshold' in patch) next.threshold = round(clamp(patch.threshold, THRESH_MIN, THRESH_MAX), 1);
    if ('ratio' in patch) next.ratio = round(clamp(patch.ratio, RATIO_MIN, RATIO_MAX), 1);
    if ('knee' in patch) next.knee = round(clamp(patch.knee, 0, KNEE_MAX), 1);
    if ('attack' in patch) next.attack = round(clamp(patch.attack, ATTACK_MIN, ATTACK_MAX), patch.attack < 1 ? 2 : 1);
    if ('release' in patch) next.release = round(clamp(patch.release, RELEASE_MIN, RELEASE_MAX), 0);
    if ('makeup' in patch) next.makeup = round(clamp(patch.makeup, 0, MAKEUP_MAX), 1);
    return next;
}
