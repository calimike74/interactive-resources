// The Reverb bench (1.12): the model behind the space.
//
// A reverb is a space's answer to one clap. This file makes that answer:
// `impulse()` returns the two channels a ConvolverNode holds, the envelope
// the stage draws and the early reflections it marks, so the picture and
// the sound come from one set of numbers (BENCH-STANDARD law 6). Nothing
// here touches the DOM or Web Audio.
//
// The console is the paper's own answer sheet. 2019 C3 Q3(a) drew Type,
// Pre-delay (ms) and Reverb time (s) as three dials; 2021 C3 Q1(d) tabled
// Type, Reverb time and Wet level %. The More row adds what the practical
// paper marks: Damping, Stereo / Mono, Send / Insert, Pan and Dry.
//
// Every credited number the schemes state is in A3 of the research file:
// pre-delay is given a range once in nine years (200 to 400 ms, for a
// hall), wet level once (10 to 30 per cent), and reverb time clusters
// between 1.5 s and 4 s. There is no mark-scheme number for diffusion,
// damping or early-reflection level, so this bench sets no target for any
// of them. Design record: docs/superpowers/specs/2026-09-02-reverb-bench-design.md

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
export const clamp01 = (v) => clamp(v, 0, 1);
// Three significant figures, so a log dial's step still moves at the
// bottom of its range and 1.5, 2, 3 and 5 land exactly (law 25).
export const sig3 = (x) => Number(Number(x).toPrecision(3));
export const round4 = (x) => Math.round(x * 1e4) / 1e4;

// ln(1000): the constant that makes exp(-K t / T) exactly -60 dB at t = T,
// which is the definition of RT60.
export const RT60_LN = Math.log(1000);
export const MODEL_RATE = 48000;

export const BPM = 100;
export const BEATS_PER_BAR = 4;

// ---- ranges -------------------------------------------------------------------------
export const TIME_MIN = 0.2;
export const TIME_MAX = 8;
export const PREDELAY_MIN = 0;
export const PREDELAY_MAX = 400;
export const WET_MIN = 0;
export const WET_MAX = 100;
export const DRY_MIN = 0;
export const DRY_MAX = 100;
export const DAMPING_MIN = 0;
export const DAMPING_MAX = 100;
export const PAN_MIN = -100;
export const PAN_MAX = 100;

export const posToLog = (pos, min, max) => min * (max / min) ** (clamp(pos, 0, 100) / 100);
export const logToPos = (v, min, max) => 100 * Math.log(clamp(v, min, max) / min) / Math.log(max / min);

export function fmtSec(t) {
    if (t >= 10) return `${Math.round(t)} s`;
    const s = t >= 1 ? t.toFixed(2) : t.toFixed(3);
    return `${s.replace(/0+$/, '').replace(/\.$/, '')} s`;
}
export const fmtMs = (ms) => `${Math.round(ms)} ms`;
export const fmtPct = (p) => `${Math.round(p)} %`;
export const dbOfAmp = (a) => (a <= 1e-6 ? -120 : 20 * Math.log10(a));
export const ampOfDb = (db) => 10 ** (db / 20);

// ---- the six types the spec names, in the spec's order --------------------------------
// "Reverb: Room; hall; plate; spring; gated; reversed. Reverb time."
// (9MT0 specification, Issue 3, Component 3 Area of Study 1.)
//
// A type is the shape of the answer: where its first reflections fall, how
// dense it starts, and how it ends. `t0` and `rise` say when the noise tail
// arrives and how quickly it builds; `hiGain` is what the type does to the
// band above 2 kHz before damping is asked for; `tail` is how much of the
// answer is diffuse noise as against discrete reflections.
export const TYPE_IDS = ['room', 'hall', 'plate', 'spring', 'gated', 'reversed'];
export const TYPES = {
    room: {
        label: 'Room', said: 'a room', t0: 0.002, rise: 0.006, hiGain: 1, tail: 1, taps: 'room',
        mech: 'A small space answers at once: the walls are close, so the first reflections arrive within a few milliseconds and the tail is short.',
        job: 'a short, close space that puts a part in a room without moving it back',
    },
    hall: {
        label: 'Hall', said: 'a hall', t0: 0.02, rise: 0.045, hiGain: 0.85, tail: 1, taps: 'hall',
        mech: 'A large space answers late: the first reflections are spread out and quiet, and the diffuse tail arrives after them and runs on.',
        job: 'a large space, the type the 2019 and 2021 schemes credit on a lead vocal',
    },
    plate: {
        label: 'Plate', said: 'a plate', t0: 0, rise: 0.0015, hiGain: 1.3, tail: 1, taps: 'plate',
        mech: 'A sheet of steel under tension has no walls, so no first reflections. The answer is dense and bright from the first sample.',
        job: 'a dense bright answer with no room in it, the classic vocal and snare plate',
    },
    spring: {
        label: 'Spring', said: 'a spring', t0: 0.001, rise: 0.004, hiGain: 0.45, tail: 0.28, taps: 'spring',
        mech: 'A spring sends the signal back as a train of pulses. Here each pulse glides from high to low, and that is the twang.',
        job: 'the guitar amplifier\'s own reverb, mid-range and twangy',
    },
    gated: {
        label: 'Gated', said: 'a gated reverb', t0: 0.002, rise: 0.006, hiGain: 1, tail: 1, taps: 'room',
        mech: 'A room\'s answer with a gate across it: the tail is held wide open and then shut, so it stops rather than fades.',
        job: 'the 1980s drum sound, a big answer cut off before it can decay',
    },
    reversed: {
        label: 'Reversed', said: 'a reversed reverb', t0: 0.02, rise: 0.045, hiGain: 0.85, tail: 1, taps: 'hall',
        mech: 'The hall\'s answer played backwards: the quietest part arrives first, so the sound swells into its own reverb instead of decaying out of it.',
        job: 'a swell into a phrase, the effect the 2019 scheme credits at phrase starts',
    },
};

// The gate is a hold and a close, not a decay: 120 ms open, 10 ms shut.
// This is why the Reverb time dial changes the density of a gated answer
// but not its length, which is the whole point of a gate.
export const GATE_HOLD = 0.12;
export const GATE_CLOSE = 0.01;
export const gateAt = (t) => (t <= GATE_HOLD ? 1 : t >= GATE_HOLD + GATE_CLOSE ? 0 : 1 - (t - GATE_HOLD) / GATE_CLOSE);

// Damping splits the noise at 2 kHz and lets the high band decay faster:
// time × (1 − 0.75 × damping). At full damping the top end is gone in a
// quarter of the time, which is what an absorbent room does.
export const DAMP_HZ = 2000;
export const DAMP_DEEP = 0.75;
export const dampedTime = (time, damping) => Math.max(0.02, time * (1 - DAMP_DEEP * clamp(damping, 0, 100) / 100));

// Set from scripts/measure-reverb.mjs so every type sits within 3 dB of
// the others at Wet 100 with the same source (BENCH-STANDARD, 29 Aug 2026:
// "a bench balance is measured, not inherited").
export const TYPE_GAIN = {
    room: 1.19,
    hall: 1.1,
    plate: 1.74,
    spring: 2.75,
    gated: 0.9,
    reversed: 0.99,
};

// How long the answer runs. -72 dB is 1.2 × the reverb time, which is where
// a tail stops being audible under anything. A gated answer ends when the
// gate shuts; a reversed one ends at the reverb time, its swell peaking there.
export function impulseLength(type, time) {
    const T = clamp(sig3(time), TIME_MIN, TIME_MAX);
    if (type === 'gated') return GATE_HOLD + GATE_CLOSE;
    if (type === 'reversed') return Math.min(TIME_MAX, T);
    return Math.min(TIME_MAX, 1.2 * T);
}

// The envelope the noise is multiplied by: the build, the -60 dB decay, and
// the gate or the reversal. The stage draws this line, so the picture is
// the number the graph runs (law 6).
export function envelopeAt(type, time, t) {
    const T = clamp(sig3(time), TIME_MIN, TIME_MAX);
    const kind = TYPES[type] ? type : 'hall';
    if (t < 0) return 0;
    if (kind === 'reversed') {
        const len = impulseLength('reversed', T);
        if (t > len) return 0;
        return envelopeAt('hall', T, len - t);
    }
    const shape = TYPES[kind];
    const rise = clamp01((t - shape.t0) / shape.rise);
    const a = rise * Math.exp(-RT60_LN * t / T);
    return kind === 'gated' ? a * gateAt(t) : a;
}
export const envelopeDbAt = (type, time, t) => dbOfAmp(envelopeAt(type, time, t));

// ---- the early reflections ------------------------------------------------------------
// Fixed tables rather than random draws, so the picture is the same every
// time the bench is opened and a test can assert the pattern.
const TAP_TIMES = {
    room: [0.003, 0.0072, 0.0111, 0.0157, 0.0196, 0.0243, 0.0298, 0.035],
    hall: [0.015, 0.0264, 0.0381, 0.0503, 0.0662, 0.08],
    plate: [],
};
const TAP_GAIN = { room: { g0: 0.9, fall: 0.86 }, hall: { g0: 0.45, fall: 0.9 }, plate: { g0: 0, fall: 1 } };
// Which side each reflection comes from, so the early field is wide.
const TAP_SIDE = [-0.7, 0.62, -0.35, 0.8, -0.85, 0.3, -0.55, 0.72];

export const SPRING_PULSE = 0.055;
export const SPRING_CHIRP = 0.006;
export const SPRING_HZ = [2500, 500];

// Every discrete reflection in the answer: its time in seconds, its gain
// before the decay, and its place across the stereo field.
export function earlyTaps(type, time) {
    const T = clamp(sig3(time), TIME_MIN, TIME_MAX);
    const kind = TYPES[type] ? type : 'hall';
    if (kind === 'spring') {
        const len = impulseLength('spring', T);
        const out = [];
        for (let k = 0; k * SPRING_PULSE < len; k += 1) {
            const t = k * SPRING_PULSE;
            out.push({ t: round4(t), gain: round4(0.85 * Math.exp(-RT60_LN * t / T)), l: k % 2 === 0 ? 1 : 0.7, r: k % 2 === 0 ? 0.7 : 1, chirp: true });
        }
        return out;
    }
    if (kind === 'reversed') {
        const len = impulseLength('reversed', T);
        return earlyTaps('hall', T)
            .filter((tap) => tap.t <= len)
            .map((tap) => ({ ...tap, t: round4(len - tap.t) }))
            .sort((a, b) => a.t - b.t);
    }
    const key = TYPES[kind].taps;
    const table = TAP_TIMES[key] || [];
    const { g0, fall } = TAP_GAIN[key] || TAP_GAIN.hall;
    return table.map((t, i) => ({
        t: round4(t),
        gain: round4(g0 * fall ** i),
        l: round4(1 - Math.max(0, TAP_SIDE[i % TAP_SIDE.length]) * 0.55),
        r: round4(1 + Math.min(0, TAP_SIDE[i % TAP_SIDE.length]) * 0.55),
        chirp: false,
    }));
}

// ---- the impulse response IS the model --------------------------------------------------
// Deterministic noise, so the same setting gives the same answer in Node and
// in the browser and a test can measure it.
function xorshift(seed) {
    let x = (seed >>> 0) || 0x9e3779b9;
    return () => {
        x ^= x << 13; x >>>= 0;
        x ^= x >>> 17;
        x ^= x << 5; x >>>= 0;
        return (x / 0x100000000) * 2 - 1;
    };
}
const SEED = { room: 0x1f2e3d4c, hall: 0x2b7c5a91, plate: 0x51ab3e07, spring: 0x77c0de11, gated: 0x1f2e3d4c, reversed: 0x2b7c5a91 };

function fillTail(kind, T, damping, stereo, sr, n) {
    const L = new Float32Array(n);
    const R = new Float32Array(n);
    const shape = TYPES[kind];
    const mono = stereo === 'mono';
    const rndL = xorshift(SEED[kind] || 0x9e3779b9);
    const rndR = xorshift((SEED[kind] || 0x9e3779b9) ^ 0x5bf03635);
    const Thi = dampedTime(T, damping);
    const a = 1 - Math.exp((-2 * Math.PI * DAMP_HZ) / sr);
    let lpL = 0;
    let lpR = 0;
    for (let i = 0; i < n; i += 1) {
        const t = i / sr;
        const rise = clamp01((t - shape.t0) / shape.rise);
        const g = kind === 'gated' ? gateAt(t) : 1;
        const eLo = rise * Math.exp((-RT60_LN * t) / T) * g * shape.tail;
        const eHi = rise * Math.exp((-RT60_LN * t) / Thi) * g * shape.tail * shape.hiGain;
        const xl = rndL();
        lpL += a * (xl - lpL);
        L[i] = lpL * eLo + (xl - lpL) * eHi;
        if (mono) { R[i] = L[i]; continue; }
        const xr = rndR();
        lpR += a * (xr - lpR);
        R[i] = lpR * eLo + (xr - lpR) * eHi;
    }
    return { L, R };
}

// A spring's pulse: a short glide from 2.5 kHz down to 500 Hz, which is the
// coil's dispersion and the reason a spring twangs.
function addChirp(ch, start, sr, amp) {
    const n = Math.round(SPRING_CHIRP * sr);
    const [f0, f1] = SPRING_HZ;
    let phase = 0;
    for (let j = 0; j < n; j += 1) {
        const i = start + j;
        if (i >= ch.length) return;
        const u = j / n;
        const f = f0 * (f1 / f0) ** u;
        phase += (2 * Math.PI * f) / sr;
        const win = 0.5 - 0.5 * Math.cos(2 * Math.PI * (j + 0.5) / n);
        ch[i] += Math.sin(phase) * win * amp;
    }
}

// One-pole high-pass, used to take the weight out of a spring.
function highPass(ch, hz, sr) {
    const rc = 1 / (2 * Math.PI * hz);
    const k = rc / (rc + 1 / sr);
    let prevIn = 0;
    let prevOut = 0;
    for (let i = 0; i < ch.length; i += 1) {
        const x = ch[i];
        prevOut = k * (prevOut + x - prevIn);
        prevIn = x;
        ch[i] = prevOut;
    }
}

/**
 * The answer the convolver holds.
 *
 * Returns the two channels, the envelope the stage draws, the discrete
 * reflections it marks, and the length in seconds. Every response is
 * normalised to unit energy across both channels, then trimmed by
 * TYPE_GAIN so Wet at 100 sits with Dry at 100 within 3 dB.
 */
export function impulse({ type = 'hall', time = 2, damping = 0, stereo = 'stereo' } = {}, sampleRate = MODEL_RATE) {
    const kind = TYPES[type] ? type : 'hall';
    const T = clamp(sig3(time), TIME_MIN, TIME_MAX);
    const sr = sampleRate > 0 ? sampleRate : MODEL_RATE;
    const len = impulseLength(kind, T);
    const n = Math.max(2, Math.round(len * sr));

    let L;
    let R;
    if (kind === 'reversed') {
        // The hall's answer, backwards: build it forwards over the reverb
        // time, then read it from the end.
        const fwd = fillTail('hall', T, damping, stereo, sr, n);
        L = new Float32Array(n);
        R = new Float32Array(n);
        for (const tap of earlyTaps('hall', T)) {
            const i = Math.round(tap.t * sr);
            if (i >= n) continue;
            const e = Math.exp((-RT60_LN * tap.t) / T);
            fwd.L[i] += tap.gain * e * (stereo === 'mono' ? 1 : tap.l);
            fwd.R[i] += tap.gain * e * (stereo === 'mono' ? 1 : tap.r);
        }
        for (let i = 0; i < n; i += 1) { L[i] = fwd.L[n - 1 - i]; R[i] = fwd.R[n - 1 - i]; }
    } else {
        const built = fillTail(kind, T, damping, stereo, sr, n);
        L = built.L;
        R = built.R;
        for (const tap of earlyTaps(kind, T)) {
            const i = Math.round(tap.t * sr);
            if (i >= n) continue;
            if (tap.chirp) {
                addChirp(L, i, sr, tap.gain * (stereo === 'mono' ? 1 : tap.l));
                addChirp(R, i, sr, tap.gain * (stereo === 'mono' ? 1 : tap.r));
                if (stereo === 'mono') for (let j = 0; j < Math.round(SPRING_CHIRP * sr) && i + j < n; j += 1) R[i + j] = L[i + j];
            } else {
                // three samples, so a reflection reads as a spike rather than a tick
                for (let j = 0; j < 3 && i + j < n; j += 1) {
                    const w = j === 1 ? 1 : 0.5;
                    L[i + j] += tap.gain * Math.exp((-RT60_LN * tap.t) / T) * w * (stereo === 'mono' ? 1 : tap.l);
                    R[i + j] += tap.gain * Math.exp((-RT60_LN * tap.t) / T) * w * (stereo === 'mono' ? 1 : tap.r);
                }
            }
        }
        if (kind === 'spring') {
            highPass(L, 300, sr);
            if (stereo === 'mono') R.set(L); else highPass(R, 300, sr);
        }
    }

    // unit energy across both channels, then the type's measured trim
    let e = 0;
    for (let i = 0; i < n; i += 1) e += L[i] * L[i] + R[i] * R[i];
    const k = e > 0 ? (TYPE_GAIN[kind] ?? 1) / Math.sqrt(e) : 0;
    for (let i = 0; i < n; i += 1) { L[i] *= k; R[i] *= k; }

    const bins = 240;
    const envelope = new Float32Array(bins);
    for (let i = 0; i < bins; i += 1) envelope[i] = envelopeAt(kind, T, (i / (bins - 1)) * len);

    return { left: L, right: R, envelope, earlyTaps: earlyTaps(kind, T), length: len, sampleRate: sr, time: T, bins };
}

// The energy in an answer, for the normalisation test.
export function impulseEnergy(imp) {
    let e = 0;
    for (let i = 0; i < imp.left.length; i += 1) e += imp.left[i] * imp.left[i] + imp.right[i] * imp.right[i];
    return e;
}

// ---- the sources ------------------------------------------------------------------------
// A phrase and then silence, so the tail is heard on its own. The vocal is
// the paper's subject in ten of the twelve practical tasks; the guitar is
// the spring's; the snare is the plate's and the gate's.
export const SOURCE_IDS = ['vocal', 'guitar', 'snare'];
export const SOURCES = {
    vocal: { label: 'Vocal', said: 'the vocal', job: 'a lead vocal', file: 'vocal', bars: 3, beats: [0], gain: 1, seconds: 6.4, note: 'a phrase, then three seconds of silence' },
    guitar: { label: 'Guitar', said: 'the guitar', job: 'an electric guitar', file: 'guitar', bars: 4, beats: [0], gain: 0.9, seconds: 8, note: 'a phrase, then two seconds of silence' },
    snare: { label: 'Snare', said: 'the snare', job: 'a snare', file: 'snare', bars: 1, beats: [1, 3], gain: 0.72, seconds: 0.8, oneShot: true, note: 'one hit on beats two and four, every 1.2 seconds' },
};

// ---- state ------------------------------------------------------------------------------
export function baseState() {
    return {
        source: 'vocal',
        type: 'hall',
        predelay: 40,
        time: 2.6,
        wet: 25,
        dry: 100,
        damping: 30,
        stereo: 'stereo',
        routing: 'send',
        pan: 0,
        task: null,
        presetId: null,
        level: 0.8,
    };
}

// ---- the papers' tasks -------------------------------------------------------------------
// Every stem and every scheme line below is verbatim from the 9MT0/04,
// 9MT0/41 and 9MT0/03 papers and mark schemes as held in the vault.
export const TASKS = {
    as2019: {
        id: 'as2019', name: '2019 AS paper', source: 'vocal',
        stem: 'Apply reverb to the vocals. Use a 2 second reverb. The reverb must be clearly audible but not swamp the vocals.',
        scheme: '"2 second reverb used on entire vocal (1). Suitable send level/similar to \'MS q5 mixed.wav\' (1). Bass and keyboard parts not affected (1)"',
        cite: '2019 AS Q5(a)',
        want: 2,
    },
    a2019: {
        id: 'a2019', name: '2019 paper', source: 'vocal',
        stem: 'Apply reverb to the vocal and backing vocals. Use a 3 second reverb. The reverb should blend the vocal with the electric guitar.',
        scheme: '"Vocal reverb is similar to audio file exam board provided."',
        cite: '2019 A Q5(a)',
        want: 3,
    },
    a2020: {
        id: 'a2020', name: '2020 paper', source: 'snare',
        stem: 'Listen to the rhythmic reverb effect in bars 6-7 on the vocal. Recreate the same effect in bars 8-33. The dry signal should remain unaffected. The gate on the reverb is side-chained to the drums.',
        scheme: '"Reverb time is very long at approximately 5 seconds (1)"; "The reverb is gated (1)"',
        cite: '2020 A Q5(e)',
        want: 5,
    },
    dials2019: {
        id: 'dials2019', name: '2019 dials', source: 'vocal',
        stem: 'Using the dials below, draw the settings that would recreate the reverb heard on the lead vocal between 0:02-0:16.',
        scheme: '"Type: Hall. Pre-delay: accept any value between 200ms-400ms. Reverb time: accept any value between 2.5s-4s."',
        cite: '2019 C3 Q3(a)',
        want: 3.2,
    },
    judge: {
        id: 'judge', name: 'Judge', source: 'vocal',
        stem: 'Evaluate the suitability of the reverb settings and the routing for the part.',
        scheme: 'AO3 for naming the setting; AO4 for its effect on the sound and whether it suits the job, section by section',
        cite: '2020 A Q6, a routing and plug-in figure',
    },
};

// ---- presets ------------------------------------------------------------------------------
// Core shows the six types a student can hear the difference between; A-level
// and Extension show the papers' tasks and the Judge patches (the Bench
// Standard's 2 Sep 2026 rule). State carries across the levels.
export const PRESETS = [
    { id: 'room', name: 'Small room', level: 'core', task: null, blurb: 'A short close space on the vocal: eight first reflections inside 35 ms and a half-second tail, so the voice is in a room without moving back', set: { source: 'vocal', type: 'room', time: 0.5, predelay: 5, wet: 20, dry: 100, damping: 25, stereo: 'stereo', routing: 'send', pan: 0 } },
    { id: 'hall', name: 'Hall', level: 'core', task: null, blurb: 'The type the 2019 and 2021 schemes credit on a lead vocal: first reflections spread to 80 ms, a 2.6 second tail behind them, a 40 ms gap in front', set: { source: 'vocal', type: 'hall', time: 2.6, predelay: 40, wet: 25, dry: 100, damping: 30, stereo: 'stereo', routing: 'send', pan: 0 } },
    { id: 'plate', name: 'Plate', level: 'core', task: null, blurb: 'A sheet of steel on the snare: no first reflections at all, dense and bright from the first sample, which is what a plate has instead of a room', set: { source: 'snare', type: 'plate', time: 1.6, predelay: 0, wet: 35, dry: 100, damping: 15, stereo: 'stereo', routing: 'send', pan: 0 } },
    { id: 'spring', name: 'Spring', level: 'core', task: null, blurb: 'The guitar amplifier\'s own reverb: a pulse every 55 ms, each one smeared from high to low by the coil, mid-range and twangy', set: { source: 'guitar', type: 'spring', time: 1.8, predelay: 0, wet: 30, dry: 100, damping: 20, stereo: 'stereo', routing: 'send', pan: 0 } },
    { id: 'gated', name: 'Gated', level: 'core', task: null, blurb: 'The 1980s snare: a four second room held wide open for 120 ms and then shut in 10, so the answer stops rather than fades', set: { source: 'snare', type: 'gated', time: 4, predelay: 0, wet: 45, dry: 100, damping: 20, stereo: 'stereo', routing: 'send', pan: 0 } },
    { id: 'reverse', name: 'Reverse', level: 'core', task: null, blurb: 'The hall\'s answer backwards on the vocal: the quiet end arrives first, so the voice swells into its reverb instead of decaying out of it', set: { source: 'vocal', type: 'reversed', time: 2, predelay: 0, wet: 40, dry: 100, damping: 25, stereo: 'stereo', routing: 'send', pan: 0 } },

    { id: 'as2019', name: '2019 AS paper', level: 'alevel', task: 'as2019', blurb: 'A 2 second reverb on the vocal, clearly audible but not swamping it, on a send so nothing else is affected', set: { source: 'vocal', type: 'hall', time: 2, predelay: 20, wet: 25, dry: 100, damping: 30, stereo: 'stereo', routing: 'send', pan: 0 } },
    { id: 'a2019', name: '2019 paper', level: 'alevel', task: 'a2019', blurb: 'A 3 second reverb on the vocal, set to blend it with a very reverberant electric guitar', set: { source: 'vocal', type: 'hall', time: 3, predelay: 30, wet: 30, dry: 100, damping: 30, stereo: 'stereo', routing: 'send', pan: 0 } },
    { id: 'a2020', name: '2020 paper', level: 'alevel', task: 'a2020', blurb: 'The rhythmic gate of 2020: a reverb time very long at approximately five seconds, gated, on a send so the dry signal is untouched; played here on the snare, since the gate keys from a hit', set: { source: 'snare', type: 'gated', time: 5, predelay: 0, wet: 50, dry: 100, damping: 20, stereo: 'stereo', routing: 'send', pan: 0 } },
    { id: 'dials2019', name: '2019 dials', level: 'alevel', task: 'dials2019', blurb: 'The answer to the three dials of 2019: Hall, a pre-delay inside 200 to 400 ms, a reverb time inside 2.5 to 4 seconds', set: { source: 'vocal', type: 'hall', time: 3.2, predelay: 300, wet: 25, dry: 100, damping: 30, stereo: 'stereo', routing: 'send', pan: 0 } },
    { id: 'judgeWet', name: 'Judge: swamped', level: 'alevel', task: 'judge', blurb: 'The fault the 2018 report names most: a four second hall at 70 per cent wet, so the vocal is swamped by its own reverb', set: { source: 'vocal', type: 'hall', time: 4, predelay: 40, wet: 70, dry: 100, damping: 30, stereo: 'stereo', routing: 'send', pan: 0 } },
    { id: 'judgeInsert', name: 'Judge: an insert', level: 'alevel', task: 'judge', blurb: 'The 2023 fault: the reverb on a channel insert with the vocal panned hard left, so the reverb goes left with it instead of staying stereo', set: { source: 'vocal', type: 'room', time: 1, predelay: 10, wet: 30, dry: 100, damping: 25, stereo: 'stereo', routing: 'insert', pan: -100 } },
    { id: 'judgeMono', name: 'Judge: mono', level: 'alevel', task: 'judge', blurb: 'The 2025 fault: a good hall on the vocal, in mono, and the scheme awards 0 for its stereo mark whatever else is right', set: { source: 'vocal', type: 'hall', time: 2, predelay: 20, wet: 25, dry: 100, damping: 30, stereo: 'mono', routing: 'send', pan: 0 } },
];

export function applyPreset(state, id) {
    const p = PRESETS.find((x) => x.id === id);
    if (!p) return state;
    return { ...baseState(), level: state.level, ...p.set, task: p.task, presetId: id };
}
export const presetsFor = (depth) => PRESETS.filter((p) => (p.level === 'core') === (depth === 'core'));
export const DEFAULT_STATE = applyPreset(baseState(), 'hall');

// ---- edits ---------------------------------------------------------------------------------
const drop = (state) => ({ ...state, presetId: null });
const one = (key, ids) => (state, v) => (ids.includes(v) && v !== state[key] ? { ...drop(state), [key]: v } : state);
const num = (key, lo, hi, round = Math.round) => (state, v) => {
    const n = clamp(round(v), lo, hi);
    return n === state[key] ? state : { ...drop(state), [key]: n };
};
export const setSource = (state, id) => (SOURCES[id] && id !== state.source ? { ...state, source: id, presetId: state.task === 'judge' ? state.presetId : null } : state);
export const setType = one('type', TYPE_IDS);
export const setPredelay = num('predelay', PREDELAY_MIN, PREDELAY_MAX);
export const setTime = num('time', TIME_MIN, TIME_MAX, sig3);
export const setWet = num('wet', WET_MIN, WET_MAX);
export const setDry = num('dry', DRY_MIN, DRY_MAX);
export const setDamping = num('damping', DAMPING_MIN, DAMPING_MAX);
export const setStereo = one('stereo', ['stereo', 'mono']);
export const setRouting = one('routing', ['send', 'insert']);
export const setPan = num('pan', PAN_MIN, PAN_MAX);
export function setLevel(state, level) { return { ...state, level: clamp01(level) }; }

// ---- what the graph plays ---------------------------------------------------------------
// The wet path's own level, and where it sits. On a send the return is its
// own channel, so the Pan does not reach it; on an insert the reverb sits in
// the part's channel and goes where the part goes, which is the 2023 fault.
export const wetGain = (state) => clamp(state.wet, 0, 100) / 100;
export const dryGain = (state) => clamp(state.dry, 0, 100) / 100;
export const dryPan = (state) => clamp(state.pan, PAN_MIN, PAN_MAX) / 100;
export const wetPan = (state) => (state.routing === 'insert' ? dryPan(state) : 0);
export const predelaySec = (state) => clamp(state.predelay, PREDELAY_MIN, PREDELAY_MAX) / 1000;

// ---- reading the space ---------------------------------------------------------------------
export function tailWord(state) {
    if (state.type === 'gated') return 'gated';
    if (state.type === 'reversed') return 'reversed';
    const t = state.time;
    if (t < 0.8) return 'short';
    if (t < 1.5) return 'medium';
    if (t <= 4) return 'long';
    return 'very long';
}
export function wetWord(state) {
    const w = state.wet;
    if (state.dry === 0) return 'wet only';
    if (w < 8) return 'dry';
    if (w < 12) return 'nearly dry';
    if (w <= 40) return 'clearly audible';
    if (w <= 50) return 'wet';
    return 'swamped';
}
export function gapWord(state) {
    const p = state.predelay;
    if (p === 0) return 'no gap: the answer starts with the sound';
    if (p < 20) return 'a gap too short to hear on its own';
    if (p < 200) return 'a gap you can hear in front of the tail';
    return 'a long gap, the front of the space pushed back';
}
const firstTap = (state) => {
    const taps = earlyTaps(state.type === 'reversed' ? 'hall' : state.type, state.time);
    return taps[0] ? Math.round(taps[0].t * 1000) : null;
};
export function readings(state) {
    const len = impulseLength(state.type, state.time);
    return {
        type: state.type,
        typeName: TYPES[state.type].label,
        rt60: sig3(state.time),
        rt60Text: fmtSec(sig3(state.time)),
        predelay: Math.round(state.predelay),
        wet: Math.round(state.wet),
        dry: Math.round(state.dry),
        damping: Math.round(state.damping),
        tail: tailWord(state),
        amount: wetWord(state),
        gap: gapWord(state),
        job: SOURCES[state.source].job,
        said: SOURCES[state.source].said,
        length: round4(len),
        lengthText: fmtSec(len),
        taps: earlyTaps(state.type, state.time).length,
        firstTapMs: firstTap(state),
        reversed: state.type === 'reversed',
        hiTime: round4(dampedTime(state.time, state.damping)),
        stereo: state.stereo === 'stereo',
        send: state.routing === 'send',
    };
}

// ---- the judge: a setting for a job, section by section --------------------------------------
// The 2020 C4 Q6 idiom ("Evaluate the suitability of the routing and plug-in
// settings"), applied to the five things this console sets. The grounds are
// the schemes and reports quoted in the design record: a vocal reverb is
// judged on its type, its length, its amount and its routing, and every
// band below either comes from a scheme or is named as the bench's own.
const V = (grade, why, cite = '') => ({ grade, why, cite });
export const SECTION_IDS = ['type', 'time', 'predelay', 'mix', 'routing'];
export const SECTIONS = {
    type: { label: 'TYPE', name: 'reverb type' },
    time: { label: 'TIME', name: 'reverb time' },
    predelay: { label: 'PRE-DELAY', name: 'pre-delay' },
    mix: { label: 'WET', name: 'wet and dry balance' },
    routing: { label: 'ROUTING', name: 'routing and stereo width' },
};
export const GRADE_WORD = { good: 'suits', partly: 'partly', poor: 'does not suit' };

// The reports, cut to the words that name the fault. Each carries its year.
export const REPORTS = {
    swamped: 'The 2018 AS report: "vocals being too wet or even completely swamped".',
    smallRoom: 'The 2023 AS report: "quite a lot of small room reverbs, this is ok stylistically".',
    dry: 'The 2018 AS report: "Short reverbs occurred but only occasionally. No reverb at all was rare".',
    insert: 'The 2023 AS report: "they used reverb on a channel insert so it panned with vocals".',
    aux: 'The 2019 A report: "the reverb was gated as well as the vocal, proving that the candidate hadn\'t used an aux for the reverb in 5(a)".',
    mono: 'The 2025 A scheme: "award 0 if reverb is mono".',
    routing: 'The 2020 C4 report: "Very few candidates commented on the routing, e.g. insert order, reverb as inserts".',
    wet2021: 'The 2021 C3 scheme accepts "any value between 10-30" on a verse vocal.',
    dials: 'The 2019 C3 scheme: "Pre-delay: accept any value between 200ms-400ms".',
    time2024: 'The 2024 C3 scheme credits "long reverb time (1.5-4 secs)/large size".',
    gate2022: 'The 2022 AS scheme, for the clap in bar 33: "Gated reverb".',
    spring2020: 'The 2020 C3 paper asks candidates to "Describe how spring reverb works".',
    dryMute: 'The 2023 C3 report: many heard the dry disappear, but "a significant number incorrectly stated the wet signal had got louder".',
    vague: 'The 2024 C3 report: "Some candidates were too vague with responses such as \'the reverb was a bit shorter\'".',
};

// The bands, said as the bench's own where no scheme gives one.
export const WET_DRY = 8;
export const WET_LOW = 12;
export const WET_HIGH = 40;
export const WET_SWAMPED = 50;
export const TIME_BAND = [1.5, 4];
export const PREDELAY_BAND = [200, 400];
export const TIME_TOLERANCE = 0.15;

export function judgeSection(state, section) {
    const s = state;
    const src = s.source;
    if (section === 'type') {
        if (src === 'vocal') {
            if (s.type === 'spring') return V('partly', 'a spring is the guitar amplifier\'s reverb, and no scheme credits one on a lead vocal', REPORTS.spring2020);
            if (s.type === 'gated') return V('partly', 'a gate shuts the tail before it can sit behind a voice, so this is an effect, not a vocal space');
            if (s.type === 'reversed') return V(s.wet >= 25 ? 'good' : 'partly', s.wet >= 25 ? 'a swell into the phrase, the effect the 2019 paper credits at phrase starts' : 'too quiet to read as a swell: a reversed reverb only works with the wet up');
            if (s.type === 'room' && s.time > 1.2) return V('partly', 'a room this long is a hall with a room\'s close first reflections fighting the length');
            if (s.type === 'room') return V('good', 'a room: a small space on the voice, close and short', REPORTS.smallRoom);
            return V('good', `${TYPES[s.type].said}, one of the types the 2021 scheme credits on a vocal`, 'The 2021 C3 scheme: "hall/plate/cathedral/church".');
        }
        if (src === 'guitar') {
            if (s.type === 'spring') return V('good', 'the reverb the amplifier itself has, and the one the paper asks candidates to explain', REPORTS.spring2020);
            if (s.type === 'plate' || s.type === 'room') return V('good', `${TYPES[s.type].said}: a clean answer with no coil in it, which suits a modern part`);
            if (s.type === 'gated') return V('partly', 'the gate shuts while the note is still sounding, so the answer is cut off mid-phrase');
            return V('partly', `${TYPES[s.type].said} works, but the spring is the type the papers attach to a guitar`);
        }
        if (s.type === 'gated') return V('good', 'the 1980s drum sound, and the answer to a one-mark question on this exact part', REPORTS.gate2022);
        if (s.type === 'plate') return V('good', 'dense and bright from the first sample, with no room in front of it');
        if (s.type === 'room') return V('good', 'close first reflections put the kit in a space without moving it back');
        if (s.type === 'spring') return V('partly', 'the pulse train reads as a twang rather than a space behind the hit');
        return V('partly', `${TYPES[s.type].said} works, but the plate and the gate are the two the papers name on a snare`);
    }
    if (section === 'time') {
        const t = s.time;
        if (s.type === 'gated') return V(t >= 2 ? 'good' : 'partly', t >= 2 ? `${fmtSec(t)} behind a gate that shuts at 120 ms: the time sets how dense the answer is, not how long` : `${fmtSec(t)} is a thin answer to gate`, t >= 2 ? '' : 'The 2020 scheme wanted it "very long at approximately 5 seconds".');
        if (t < TIME_BAND[0]) return V('good', src === 'vocal' ? `${fmtSec(t)}: shorter than the schemes' 1.5 to 4 second band, a close voice rather than a fault` : `${fmtSec(t)} keeps the part tight and in front`, src === 'vocal' ? REPORTS.smallRoom : '');
        if (t <= TIME_BAND[1]) return V('good', `${fmtSec(t)}, inside the 1.5 to 4 second band the 2024 scheme credits`, REPORTS.time2024);
        if (t <= 6) return V('partly', `${fmtSec(t)} runs past the schemes: the tail is still sounding when the next phrase starts`);
        return V('poor', `${fmtSec(t)} never clears before the next phrase, so the mix fills up with tail`);
    }
    if (section === 'predelay') {
        const p = s.predelay;
        if (s.type === 'reversed' || s.type === 'gated') return V('good', `${fmtMs(p)} moves ${TYPES[s.type].said} later without changing its shape`);
        if (p === 0) return V('good', src === 'vocal' ? 'no gap: the space starts with the word, close on the voice' : 'no gap: the answer starts with the hit, which keeps a percussive part tight');
        if (p >= PREDELAY_BAND[0] && p <= PREDELAY_BAND[1]) return V('good', `${fmtMs(p)}: the voice is heard clear before the space answers`, REPORTS.dials);
        if (p < 20) return V('good', `${fmtMs(p)}: a gap too short to hear on its own, so the space sits close`);
        return V('good', `${fmtMs(p)} of clear space in front of the tail, a medium pre-delay`);
    }
    if (section === 'mix') {
        const w = s.wet;
        if (s.dry === 0) return V('partly', 'the dry muted, leaving the wet on its own: a move to make and undo, the 2023 change on Funkytown\'s cowbells, not a place to leave the part', REPORTS.dryMute);
        if (w < WET_DRY) return V('poor', `${w} per cent wet is dry: the reverb runs but almost none reaches the mix`, REPORTS.dry);
        if (w < WET_LOW) return V('partly', `${w} per cent wet is audible if you listen for it, not audible in the mix`);
        if (s.type === 'gated' && w <= 55) return V('good', `${w} per cent wet: a gated answer is the effect itself, so it is meant to be heard`, REPORTS.gate2022);
        if (w <= WET_HIGH) return V('good', `${w} per cent wet: clearly audible but not swamping the part`, REPORTS.wet2021);
        if (w <= WET_SWAMPED) return V('partly', `${w} per cent wet: the answer is starting to compete with the part that caused it`);
        return V('poor', `${w} per cent wet swamps the part`, REPORTS.swamped);
    }
    if (s.stereo === 'mono' && src === 'vocal') return V('poor', 'the reverb is in mono, and the stereo mark is 0 whatever else is right', REPORTS.mono);
    if (s.routing === 'insert' && s.pan !== 0) return V('poor', `on an insert with the part panned ${s.pan < 0 ? 'left' : 'right'}, so the reverb goes left or right with it`, REPORTS.insert);
    if (s.routing === 'insert' && s.type === 'gated') return V('poor', 'a gate on an insert gates the part as well as its reverb', REPORTS.aux);
    if (s.stereo === 'mono') return V('partly', 'in mono it sits in the centre with the part rather than spreading around it', REPORTS.mono);
    if (s.routing === 'insert') return V('partly', 'on an insert the reverb belongs to that channel and goes wherever the part goes', REPORTS.routing);
    return V('good', 'stereo, on a send: the return is its own channel, so the part can move and the reverb stays put');
}
export function judgeAll(state) {
    const out = {};
    for (const id of SECTION_IDS) out[id] = judgeSection(state, id);
    return out;
}

// ---- each box of the path, judged on its own ----
// A section's grade painted on every box in it blamed a centred pan and a
// full fader for a mono return or a swamped send (2 Sep 2026 critique). A box
// is faulted only for what it holds.
export function boxGrade(state, id, all = judgeAll(state)) {
    const s = state;
    if (id === 'insert') return s.routing === 'insert' ? all.routing.grade : 'good';
    if (id === 'pan') return s.routing === 'insert' && s.pan !== 0 ? 'partly' : 'good';
    if (id === 'mix') return s.stereo === 'mono' ? all.routing.grade : 'good';
    if (id === 'fader') return s.dry === 0 ? all.mix.grade : 'good';
    if (id === 'send') return s.dry === 0 ? 'good' : all.mix.grade;
    if (id === 'return') {
        const g = ['type', 'time', 'predelay'].map((k) => all[k].grade);
        return g.includes('poor') ? 'poor' : g.includes('partly') ? 'partly' : 'good';
    }
    return null;
}
// The return box holds the type, the time and the pre-delay: a touch judges
// whichever is at fault, or the time, the one number the spec names.
export function returnSection(state) {
    for (const id of ['type', 'time', 'predelay']) if (judgeSection(state, id).grade !== 'good') return id;
    return 'time';
}

// ---- the schemes' checks ---------------------------------------------------------------------
// One point per mark the scheme names; ok when every point lands.
export function schemePoints(state) {
    const t = state.task;
    const s = state;
    // id, the scheme's own point, met or not, and what to say either way
    const P = (id, name, ok, no, yes) => ({ id, name, ok, said: ok ? yes : no });
    const near = (want) => Math.abs(s.time - want) <= want * TIME_TOLERANCE;
    const timeSaid = (want) => (near(want) ? `a ${fmtSec(s.time)} reverb` : `a ${fmtSec(s.time)} reverb where the task sets ${want} second${want === 1 ? '' : 's'}`);
    const stereoSaid = s.stereo === 'stereo' ? 'in stereo' : 'in mono';
    if (t === 'as2019') {
        return [
            P('time', 'a 2 second reverb on the vocal', near(2) && s.source === 'vocal', s.source !== 'vocal' ? 'not on the vocal' : timeSaid(2), timeSaid(2)),
            P('level', 'a suitable send level, on the bench\'s own 12 to 40 per cent band', s.wet >= WET_LOW && s.wet <= WET_HIGH, s.wet < WET_LOW ? `${s.wet} % wet, too quiet to be clearly audible` : `${s.wet} % wet, past audible into swamping`, `${s.wet} % wet, clearly audible`),
            P('send', 'nothing else affected', s.routing === 'send', 'on an insert, so it belongs to that one channel', 'on a send, so nothing else is affected'),
            P('stereo', 'the reverb in stereo', s.stereo === 'stereo', stereoSaid, stereoSaid),
        ];
    }
    if (t === 'a2019') {
        return [
            P('time', 'a 3 second reverb', near(3), timeSaid(3), timeSaid(3)),
            P('blend', 'enough to blend the vocal with the guitar', s.wet >= 20 && s.wet <= WET_SWAMPED, s.wet < 20 ? `${s.wet} % wet, which the 2019 report calls "too dry" against a very reverberant guitar` : `${s.wet} % wet, past a blend into swamping`, `${s.wet} % wet, enough to blend with the guitar`),
            P('stereo', 'the reverb in stereo', s.stereo === 'stereo', stereoSaid, stereoSaid),
        ];
    }
    if (t === 'a2020') {
        return [
            P('time', 'a reverb time very long at approximately 5 seconds', near(5), timeSaid(5), timeSaid(5)),
            P('gate', 'the reverb gated', s.type === 'gated', `${TYPES[s.type].said}, with no gate across it`, 'gated'),
            P('send', 'the dry signal unaffected', s.routing === 'send', 'on an insert, so the gate would take the snare with it', 'on a send, so the dry signal is untouched'),
        ];
    }
    if (t === 'dials2019') {
        return [
            P('type', 'Type: Hall', s.type === 'hall', `${TYPES[s.type].label}, where the scheme accepts Hall alone`, 'Hall'),
            P('predelay', 'Pre-delay between 200 ms and 400 ms', s.predelay >= PREDELAY_BAND[0] && s.predelay <= PREDELAY_BAND[1], s.predelay < PREDELAY_BAND[0] ? `${fmtMs(s.predelay)}, short of 200 ms` : `${fmtMs(s.predelay)}, past 400 ms`, `${fmtMs(s.predelay)}, inside 200 to 400 ms`),
            P('time', 'Reverb time between 2.5 s and 4 s', s.time >= 2.5 && s.time <= 4, s.time < 2.5 ? `${fmtSec(s.time)}, short of 2.5 s` : `${fmtSec(s.time)}, past 4 s`, `${fmtSec(s.time)}, inside 2.5 to 4 s`),
        ];
    }
    return [];
}

// The task's key state, for the stage and the gate.
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

// ---- the stage's geometry -------------------------------------------------------------------
// Three pictures, one per level (law 18). Every point is rounded to four
// decimal places: Node and the browser disagree in the last digit of a log,
// and a polyline that hydrates differently is a React error.
export const DB_FLOOR = -72;
export const DB_RT60 = -60;

/**
 * Core, `data-stage=tail`: the tail as the spec asks it to be described.
 * dB against time, the dry event at zero, the pre-delay gap bracketed, the
 * first reflections as spikes, the tail falling to a named -60 dB floor.
 */
export function tailShape(state, box, imp, tWindow = null) {
    const { x0, y0, x1, y1 } = box;
    const pre = predelaySec(state);
    const len = imp ? imp.length : impulseLength(state.type, state.time);
    const tMax = tWindow || Math.max(0.6, (pre + len) * 1.06);
    const xOf = (t) => round4(x0 + (clamp(t, 0, tMax) / tMax) * (x1 - x0));
    const yOf = (db) => round4(y1 - (clamp(db, DB_FLOOR, 0) - DB_FLOOR) / (0 - DB_FLOOR) * (y1 - y0));
    const dbOfY = (y) => round4(DB_FLOOR + ((y1 - clamp(y, y0, y1)) / (y1 - y0)) * (0 - DB_FLOOR));
    const tOfX = (x) => round4((clamp(x, x0, x1) - x0) / (x1 - x0) * tMax);
    // A drag may run past the plot's right edge: the axis is scaled to the
    // tail it is drawing, so without this a single drag could only ever
    // lengthen the tail by the width of the plot it already fills.
    const tOfXFree = (x) => round4(((x - x0) / (x1 - x0)) * tMax);

    const wet = wetGain(state);
    const dry = dryGain(state);
    const bins = imp ? imp.envelope.length : 240;
    const points = [];
    for (let i = 0; i < bins; i += 1) {
        const t = (i / (bins - 1)) * len;
        const a = imp ? imp.envelope[i] : envelopeAt(state.type, state.time, t);
        points.push([xOf(pre + t), yOf(dbOfAmp(a * wet))]);
    }
    // The would-be tail behind a gate, so the student sees what was cut.
    const ghost = [];
    if (state.type === 'gated') {
        const full = Math.min(TIME_MAX, 1.2 * state.time);
        for (let i = 0; i < 120; i += 1) {
            const t = (i / 119) * full;
            ghost.push([xOf(pre + t), yOf(dbOfAmp(envelopeAt('room', state.time, t) * wet))]);
        }
    }
    const taps = (imp ? imp.earlyTaps : earlyTaps(state.type, state.time))
        .filter((tap) => tap.t <= len)
        .map((tap) => ({ x: xOf(pre + tap.t), y: yOf(dbOfAmp(tap.gain * envelopeAt(state.type, state.time, tap.t) * wet)), ms: Math.round(tap.t * 1000) }));

    const crossing = state.type === 'gated' ? GATE_HOLD : state.type === 'reversed' ? len : state.time;
    return {
        x0, y0, x1, y1, tMax, len, pre,
        xOf, yOf, dbOfY, tOfX, tOfXFree,
        points,
        ghost,
        taps,
        floorY: yOf(DB_RT60),
        baseY: yOf(DB_FLOOR),
        dryX: xOf(0),
        dryY: yOf(dbOfAmp(dry)),
        gapX0: xOf(0),
        gapX1: xOf(pre),
        // the handle law 26 drags: the end of the tail where it meets the floor
        handle: { x: xOf(pre + crossing), y: yOf(DB_RT60) },
        preHandle: { x: xOf(pre), y: round4(y0 + (y1 - y0) * 0.12) },
        crossing: round4(crossing),
    };
}

// The reverb time a drag to x asks for: the handle is the crossing, so the
// time is the crossing minus the pre-delay. The shape is taken once, at the
// start of the drag, and held: the plot's own span grows with the reverb
// time, so a live re-read would move the handle out from under the pointer.
export function timeFromShape(shape, state, x) {
    if (state.type === 'gated') return state.time;
    return clamp(sig3(shape.tOfXFree(x) - shape.pre), TIME_MIN, TIME_MAX);
}
export function predelayFromShape(shape, x) {
    return clamp(Math.round(shape.tOfXFree(x) * 1000), PREDELAY_MIN, PREDELAY_MAX);
}
export const timeAtX = (state, box, x, imp) => timeFromShape(tailShape(state, box, imp), state, x);
export const predelayAtX = (state, box, x, imp) => predelayFromShape(tailShape(state, box, imp), x);

/**
 * A-level, `data-stage=path`: the paper's own signal path.
 * The channel across the top, the send and the return beneath it, each box
 * carrying its verdict for the job (2020 C4 Q6's idiom).
 */
export function pathBoxes(state, box) {
    const { x0, y0, x1, y1 } = box;
    const w = x1 - x0;
    const h = y1 - y0;
    const bw = round4(Math.min(150, (w - 5 * 26) / 5));
    const bh = round4(Math.min(62, h * 0.2));
    // two rows, centred in the stage: the row gap, the return's box and its
    // width label beneath it, with the slack shared above and below
    const rowGap = round4(Math.min(130, Math.max(bh + 50, h * 0.5)));
    const topY = round4(y0 + Math.max(0, (h - (rowGap + bh + 18)) / 2));
    const botY = round4(topY + rowGap);
    const gap = round4((w - 5 * bw) / 4);
    const at = (i) => round4(x0 + i * (bw + gap));
    const top = [
        { id: 'channel', label: 'CHANNEL', sub: SOURCES[state.source].label.toUpperCase(), x: at(0), y: topY, w: bw, h: bh, section: null },
        { id: 'insert', label: 'INSERT', sub: state.routing === 'insert' ? `${TYPES[state.type].label.toUpperCase()} ${fmtSec(state.time)}` : 'empty', x: at(1), y: topY, w: bw, h: bh, section: 'routing' },
        { id: 'pan', label: 'PAN', sub: state.pan === 0 ? 'centre' : `${Math.abs(state.pan)} ${state.pan < 0 ? 'L' : 'R'}`, x: at(2), y: topY, w: bw, h: bh, section: 'routing' },
        { id: 'fader', label: 'FADER', sub: `DRY ${state.dry} %`, x: at(3), y: topY, w: bw, h: bh, section: 'mix' },
        { id: 'mix', label: 'MIX', sub: state.stereo === 'stereo' ? 'stereo' : 'mono', x: at(4), y: topY, w: bw, h: bh, section: 'routing' },
    ];
    const bottom = [
        { id: 'send', label: 'SEND', sub: `WET ${state.wet} %`, x: at(1), y: botY, w: bw, h: bh, section: 'mix' },
        { id: 'return', label: 'REVERB RETURN', sub: `${TYPES[state.type].label.toUpperCase()} · ${fmtSec(state.time)} · ${fmtMs(state.predelay)}`, x: at(2), y: botY, w: round4(bw * 2 + gap), h: bh, section: returnSection(state) },
    ];
    return { top, bottom, boxes: [...top, ...bottom], bw, bh, gap, topY, botY };
}

/**
 * Extension, `data-stage=machine`: three lanes in time.
 * DRY (the source's samples), THE ANSWER (the impulse response as its real
 * samples), WET (the dry convolved with the answer, what is heard).
 */
export function machineLanes(box) {
    const { x0, y0, x1, y1 } = box;
    const h = y1 - y0;
    const laneH = round4((h - 2 * 22) / 3);
    return {
        x0: round4(x0), x1: round4(x1),
        lanes: [
            { id: 'dry', label: 'DRY', title: 'the source, one event', top: round4(y0), bottom: round4(y0 + laneH) },
            { id: 'answer', label: 'THE ANSWER', title: 'the space\'s reply to one clap', top: round4(y0 + laneH + 22), bottom: round4(y0 + 2 * laneH + 22) },
            { id: 'wet', label: 'WET', title: 'every sample of the dry stamping a copy of the answer', top: round4(y0 + 2 * laneH + 44), bottom: round4(y1) },
        ],
        laneH,
    };
}

export const stageOf = (depth) => (depth === 'core' ? 'tail' : depth === 'alevel' ? 'path' : 'machine');
