// The Acoustics bench (2.1): the model behind the three stations.
//
// What a room and an ear do to a sound, each with its own arithmetic
// and none of it asked of the student (BENCH-STANDARD §4: a bench never asks
// anyone to compute):
//
//   Loudness  the ear is not flat, and it is less flat when quiet. The
//             contours are ISO 226:2003's own formula with the standard's
//             table of af, Lu and Tf, so the drawing is the published curve
//             and not a sketch of one.
//   Masking   a masker raises the level a target needs to be heard. The
//             spreading is the two-slope model: 27 dB per Bark downward, and
//             upward a slope that flattens as the masker gets louder, which
//             is the upward spread of masking the EQ chapter names.
//   The Room  one reflection summed with the direct sound is a comb filter
//             whose first notch sits at 1/(2T); a tail is noise under an
//             exponential, three bands wide, because RT60 is not one number
//             across the spectrum.
//
// Nothing here touches the DOM or Web Audio. The same numbers make the
// picture and the sound (law 6): impulse() returns what the ConvolverNode
// holds and what the stage draws, and combDb() is the response the delay and
// the sum really have.
//
// Design record: docs/superpowers/specs/2026-09-12-acoustics-bench-design.md

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
export const clamp01 = (v) => clamp(v, 0, 1);
export const sig3 = (x) => Number(Number(x).toPrecision(3));
export const round4 = (x) => Math.round(x * 1e4) / 1e4;

export const RT60_LN = Math.log(1000);
export const MODEL_RATE = 48000;
export const BPM = 100;
export const BEATS_PER_BAR = 4;

// The bench's one assumption about how loud the listener has it: full scale
// is taken as 100 dB SPL, so a level in dBFS can be spoken about in the
// units the contours and the masking model use. Said on the bench, not hidden.
export const SPL_AT_FULL_SCALE = 100;
export const splOfDbfs = (dbfs) => dbfs + SPL_AT_FULL_SCALE;
export const dbfsOfSpl = (spl) => spl - SPL_AT_FULL_SCALE;

export const STATION_IDS = ['loudness', 'masking', 'room'];
export const STATIONS = {
    loudness: { label: 'Loudness', name: 'the ear', said: 'how loud a tone seems' },
    masking: { label: 'Masking', name: 'masking', said: 'one sound hiding another' },
    room: { label: 'The Room', name: 'the room', said: 'what a room does to a sound' },
};

// ---------------------------------------------------------------------------
// 1 · The ear: ISO 226:2003 equal-loudness contours
// ---------------------------------------------------------------------------
// The standard's table, 20 Hz to 12.5 kHz. af is the exponent of loudness
// perception, Lu the transfer from a free field to the ear, Tf the threshold
// of hearing at that frequency. Source: ISO 226:2003, Table 1.
export const ISO_F = [20, 25, 31.5, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000, 6300, 8000, 10000, 12500];
const ISO_AF = [0.532, 0.506, 0.480, 0.455, 0.432, 0.409, 0.387, 0.367, 0.349, 0.330, 0.315, 0.301, 0.288, 0.276, 0.267, 0.259, 0.253, 0.250, 0.246, 0.244, 0.243, 0.243, 0.243, 0.242, 0.242, 0.245, 0.254, 0.271, 0.301];
const ISO_LU = [-31.6, -27.2, -23.0, -19.1, -15.9, -13.0, -10.3, -8.1, -6.2, -4.5, -3.1, -2.0, -1.1, -0.4, 0.0, 0.3, 0.5, 0.0, -2.7, -4.1, -1.0, 1.7, 2.5, 1.2, -2.1, -7.1, -11.2, -10.7, -3.1];
const ISO_TF = [78.5, 68.7, 59.5, 51.1, 44.0, 37.5, 31.5, 26.5, 22.1, 17.9, 14.4, 11.4, 8.6, 6.2, 4.4, 3.0, 2.2, 2.4, 3.5, 1.7, -1.3, -4.2, -6.0, -5.4, -1.5, 6.0, 12.6, 13.9, 17.3];

export const HEARING_LOW = 20;
export const HEARING_HIGH = 20000;

/** The three table values at any frequency, interpolated in log frequency. */
export function isoParams(hz) {
    const f = clamp(hz, ISO_F[0], ISO_F[ISO_F.length - 1]);
    let i = 0;
    while (i < ISO_F.length - 2 && ISO_F[i + 1] < f) i += 1;
    const span = Math.log(ISO_F[i + 1] / ISO_F[i]);
    const k = span > 0 ? Math.log(f / ISO_F[i]) / span : 0;
    const mix = (a) => a[i] + k * (a[i + 1] - a[i]);
    return { af: mix(ISO_AF), lu: mix(ISO_LU), tf: mix(ISO_TF) };
}

/**
 * ISO 226:2003 §4.1: the sound pressure level, in dB SPL, that a tone at
 * `hz` must reach to sound as loud as a 1 kHz tone at `phon` dB SPL.
 * At 1 kHz this returns `phon` itself, which is the definition of the phon.
 */
export function splAt(hz, phon) {
    const { af, lu, tf } = isoParams(hz);
    const af4 = (0.4 * 10 ** ((tf + lu) / 10 - 9)) ** af;
    const a = 4.47e-3 * (10 ** (0.025 * phon) - 1.15) + af4;
    return (10 / af) * Math.log10(Math.max(a, 1e-12)) - lu + 94;
}

/** The threshold of hearing at a frequency: the contour at zero phon. */
export const thresholdAt = (hz) => splAt(hz, 0);

/**
 * The inverse: how loud, in phons, a tone at `hz` and `spl` dB SPL seems.
 * Bisection, because ISO 226 gives no closed form the other way round.
 * Below the threshold of hearing it returns 0: nothing is heard.
 */
export function phonAt(hz, spl) {
    if (spl <= thresholdAt(hz)) return 0;
    let lo = 0;
    let hi = 120;
    for (let i = 0; i < 40; i += 1) {
        const mid = (lo + hi) / 2;
        if (splAt(hz, mid) > spl) hi = mid; else lo = mid;
    }
    return (lo + hi) / 2;
}

// The tones on the chips. 3 kHz is here because the EQ chapter's claim is
// "human hearing is most sensitive in roughly the 2 kHz to 5 kHz region",
// and a bench that only offered 100 Hz, 1 kHz and 10 kHz could not show it.
export const TONE_IDS = [100, 1000, 3000, 10000];
export const TONES = {
    100: { label: '100 Hz', said: 'a 100 Hz tone', part: 'the bass' },
    1000: { label: '1 kHz', said: 'a 1 kHz tone', part: 'the reference' },
    3000: { label: '3 kHz', said: 'a 3 kHz tone', part: 'the ear\'s own peak' },
    10000: { label: '10 kHz', said: 'a 10 kHz tone', part: 'the top' },
};

// Two listening levels, named as the contour each sits on. The bench cannot
// know a listener's real level, so it says which one it is drawing.
export const LEVEL_IDS = ['quiet', 'loud'];
export const LEVELS = {
    quiet: { label: 'Quiet', phon: 40, said: 'quietly' },
    loud: { label: 'Loud', phon: 90, said: 'loudly' },
};
// The contours the stage draws. Both listening levels are among them, so
// the one in use can be picked out from the rest.
export const CONTOURS = [20, 40, 60, 90];

/**
 * The station's whole reading. Every tone leaves the bench at the same gain,
 * so every tone arrives at the same SPL; what differs is how loud each one
 * seems, and the difference closes as the level rises.
 */
export function loudnessReading(state) {
    const spl = LEVELS[state.listen].phon;
    const phon = phonAt(state.tone, spl);
    const ref = phonAt(1000, spl);
    return {
        spl,
        phon,
        ref,
        gap: ref - phon,
        needs: splAt(state.tone, spl),
        extra: splAt(state.tone, spl) - spl,
        audible: spl > thresholdAt(state.tone),
        threshold: thresholdAt(state.tone),
    };
}

// ---------------------------------------------------------------------------
// 2 · Masking
// ---------------------------------------------------------------------------
// Zwicker and Terhardt's critical-band rate, 1980. One Bark is one critical
// band, which is the width the EQ chapter describes as "roughly 100 Hz wide
// below about 500 Hz, and roughly a fifth of the centre frequency above".
export const bark = (hz) => 13 * Math.atan(0.00076 * hz) + 3.5 * Math.atan((hz / 7500) ** 2);

/** Zwicker's critical bandwidth in Hz, used to set the noise band's width. */
export const criticalBandwidth = (hz) => 25 + 75 * (1 + 1.4 * (hz / 1000) ** 2) ** 0.69;

// The two slopes. Downward (a masker above the target) is steep and fixed.
// Upward (a masker below the target) flattens as the masker gets louder,
// which is why a loud low sound reaches so far up the spectrum.
export const MASK_SLOPE_DOWN = -27;
export const MASK_OFFSET = 5.5;
export const maskSlopeUp = (maskerHz, maskerSpl) => -(24 + 230 / maskerHz - 0.2 * maskerSpl);

/** The level, in dB SPL, a tone at `hz` must reach to be heard past the masker. */
export function maskThresholdSpl(hz, maskerHz, maskerSpl) {
    const dz = bark(hz) - bark(maskerHz);
    const slope = dz >= 0 ? maskSlopeUp(maskerHz, maskerSpl) : MASK_SLOPE_DOWN;
    return maskerSpl - MASK_OFFSET + slope * Math.abs(dz);
}
/** The same threshold in the units the console shows, dB below full scale. */
export const maskThresholdDbfs = (hz, maskerHz, maskerDbfs) => dbfsOfSpl(maskThresholdSpl(hz, maskerHz, splOfDbfs(maskerDbfs)));

export const TARGET_IDS = [1000, 2000];
export const TARGETS = { 1000: { label: '1 kHz' }, 2000: { label: '2 kHz' } };
export const TARGET_DBFS = -30;

// The masker sits below, on, or above the target, because the lesson is the
// asymmetry: from below it reaches the target, from above it barely does.
export const PLACE_IDS = ['below', 'on', 'above'];
export const PLACES = {
    below: { label: 'Below', ratio: 0.7, said: 'below it' },
    on: { label: 'On it', ratio: 1, said: 'on it' },
    above: { label: 'Above', ratio: 1.4, said: 'above it' },
};
export const maskerHzOf = (state) => Math.round(state.target * PLACES[state.place].ratio);

export const MASKER_MIN = -60;
export const MASKER_MAX = 0;

export function maskingReading(state) {
    const mHz = maskerHzOf(state);
    const thr = dbfsOfSpl(maskThresholdSpl(state.target, mHz, splOfDbfs(state.masker)));
    return {
        maskerHz: mHz,
        threshold: thr,
        target: TARGET_DBFS,
        margin: TARGET_DBFS - thr,
        masked: state.targetOn && TARGET_DBFS < thr,
        bandwidth: criticalBandwidth(mHz),
        barks: round4(bark(state.target) - bark(mHz)),
        upward: bark(state.target) > bark(mHz),
    };
}

// ---------------------------------------------------------------------------
// 3 · The room: one reflection, many cancellations
// ---------------------------------------------------------------------------
export const DELAY_MIN = 0.5;
export const DELAY_MAX = 40;
export const REFLECT_MIN = -24;
export const REFLECT_MAX = 0;
// Past about this delay the ear stops hearing the copy as a colouration of
// the same sound and hears a separate bounce (the acoustics chapter's own
// number, and the boundary its Check Your Understanding question turns on).
export const COLOUR_LIMIT_MS = 25;

export const dbOfAmp = (a) => (a <= 1e-6 ? -120 : 20 * Math.log10(a));
export const ampOfDb = (db) => 10 ** (db / 20);

/** The first notch of a comb filter: 1/(2T), in Hz, for a delay in ms. */
export const firstNotchHz = (delayMs) => 500 / Math.max(delayMs, 1e-6);

/** Every notch inside the audible range: the odd multiples of 1/(2T). */
export function notchesOf(delayMs, limit = HEARING_HIGH) {
    const f0 = firstNotchHz(delayMs);
    const out = [];
    for (let n = 1; f0 * (2 * n - 1) <= limit && out.length < 400; n += 1) out.push(f0 * (2 * n - 1));
    return out;
}

/** The peaks: the whole multiples of 1/T, starting at DC. */
export function peaksOf(delayMs, limit = HEARING_HIGH) {
    const f1 = 1000 / Math.max(delayMs, 1e-6);
    const out = [];
    for (let n = 1; f1 * n <= limit && out.length < 400; n += 1) out.push(f1 * n);
    return out;
}

/**
 * The response of a direct sound summed with one delayed copy, in dB.
 * |1 + a e^(-j 2 pi f T)| squared is 1 + a^2 + 2a cos(2 pi f T), which is what
 * the DelayNode and the sum really do, so the curve is the graph.
 */
export function combDb(hz, delayMs, reflectDb) {
    const a = ampOfDb(reflectDb);
    const w = 2 * Math.PI * hz * (delayMs / 1000);
    return 10 * Math.log10(Math.max(1 + a * a + 2 * a * Math.cos(w), 1e-9));
}
export const combPeakDb = (reflectDb) => dbOfAmp(1 + ampOfDb(reflectDb));
export const combNotchDb = (reflectDb) => dbOfAmp(Math.abs(1 - ampOfDb(reflectDb)));
/** How deep the notch sits under its neighbouring peaks. */
export const combDepthDb = (reflectDb) => combPeakDb(reflectDb) - combNotchDb(reflectDb);

// ---------------------------------------------------------------------------
// 4 · The room: the tail
// ---------------------------------------------------------------------------
export const RT60_MIN = 0.3;
export const RT60_MAX = 3;
export const ROOM_MIN = 0;
export const ROOM_MAX = 100;

// Three bands, because the acoustics chapter is explicit that RT60 is not
// one number for the whole spectrum: "High frequencies lose energy to the
// air itself and to soft furnishings far more readily than low frequencies
// do, so they decay faster in almost any room."
export const BAND_IDS = ['low', 'mid', 'high'];
export const BANDS = {
    low: { label: 'below 250 Hz', hz: 250, said: 'the low end' },
    mid: { label: '250 Hz to 2 kHz', hz: 2000, said: 'the middle' },
    high: { label: 'above 2 kHz', hz: 16000, said: 'the top' },
};

// The three states of the walls. `rt60` is where the chip puts the dial;
// `low` and `high` are what that band's decay is as a fraction of the dial.
// The numbers say the chapter's law: a thin panel is "effective at mid and
// high frequencies ... and largely ineffective at low frequencies", so
// panels alone leave the bass ringing; bass traps are what bring it down.
export const ABSORB_IDS = ['bare', 'panels', 'treated'];
export const ABSORB = {
    bare: {
        label: 'Bare', rt60: 2.2, low: 1.05, high: 0.92,
        said: 'hard walls, nothing on them',
        mech: 'Every surface sends the sound back, so the room rings for about the same length at every frequency.',
    },
    panels: {
        label: 'Some panels', rt60: 1.1, low: 1.85, high: 0.42,
        said: 'a few thin panels on the walls',
        mech: 'Thin panels take the mid and high frequencies and leave the low ones, so the top goes dead while the bass rings on.',
    },
    treated: {
        label: 'Treated', rt60: 0.6, low: 1.15, high: 0.82,
        said: 'panels and bass traps',
        mech: 'Panels for the mid and high, bass traps in the corners for the low: the whole spectrum comes down together.',
    },
};
export const bandTime = (rt60, absorb, band) => sig3(Math.max(0.08, rt60 * (band === 'mid' ? 1 : ABSORB[absorb][band])));
export const bandTimes = (rt60, absorb) => ({
    low: bandTime(rt60, absorb, 'low'),
    mid: bandTime(rt60, absorb, 'mid'),
    high: bandTime(rt60, absorb, 'high'),
});
/** The widest gap between any two bands: how uneven the room is. */
export function evenness(rt60, absorb) {
    const t = bandTimes(rt60, absorb);
    const vals = [t.low, t.mid, t.high];
    return round4(Math.max(...vals) / Math.min(...vals));
}

/** A band's envelope at time t: exp(-ln(1000) t / T), which is -60 dB at T. */
export const envelopeAt = (t, time) => Math.exp((-RT60_LN * t) / Math.max(time, 1e-4));
export const envelopeDbAt = (t, time) => dbOfAmp(envelopeAt(t, time));
export const impulseLength = (rt60, absorb) => Math.max(...Object.values(bandTimes(rt60, absorb))) * 1.05;

// A one-pole low-pass, run over noise, is how the three bands are split. The
// coefficient for a corner frequency at a sample rate.
const poleOf = (hz, rate) => Math.exp((-2 * Math.PI * hz) / rate);

// Set by scripts/measure-acoustics.mjs, not from the model's own arithmetic
// (BENCH-STANDARD, 29 Aug 2026: a bench balance is measured).
export const IMPULSE_GAIN = 0.055;
// Every room starts at the same loudness, so the difference between them is
// entirely in how long each band lasts. Normalising to total energy instead
// would make a duller room LOUDER in the bass than a bright one, which is the
// opposite of what absorption does, and it is the fault the first listening
// pass found (12 Sep 2026).
export const ONSET_SEC = 0.02;

/** The RMS of the first 20 ms of an answer, both channels: how it starts. */
export function impulseOnset(imp) {
    const n = Math.min(imp.left.length, Math.round(ONSET_SEC * imp.sampleRate));
    let e = 0;
    for (const ch of [imp.left, imp.right]) for (let i = 0; i < n; i += 1) e += ch[i] * ch[i];
    return Math.sqrt(e / (n * 2));
}

/** The sum of squares of an answer, both channels: its energy. */
export function impulseEnergy(imp) {
    let e = 0;
    for (const ch of [imp.left, imp.right]) for (let i = 0; i < ch.length; i += 1) e += ch[i] * ch[i];
    return e;
}

/**
 * What the ConvolverNode holds and what the stage draws, from one call.
 * White noise split into three bands by one-pole filters, each band under
 * its own exponential, summed; two channels so the room is not in the middle
 * of the head. Seeded, so the test and the browser build the same answer.
 */
export function impulse({ rt60 = 1.2, absorb = 'bare' } = {}, sampleRate = MODEL_RATE) {
    const times = bandTimes(rt60, absorb);
    const len = Math.max(64, Math.round(impulseLength(rt60, absorb) * sampleRate));
    const aLow = poleOf(BANDS.low.hz, sampleRate);
    const aHigh = poleOf(BANDS.high.hz / 8, sampleRate);
    const chans = [];
    for (let c = 0; c < 2; c += 1) {
        const out = new Float32Array(len);
        let seed = 22695477 + c * 7919;
        let lp = 0;
        let lp2 = 0;
        for (let i = 0; i < len; i += 1) {
            seed = (seed * 1103515245 + 12345) & 0x7fffffff;
            const n = (seed / 0x3fffffff) - 1;
            lp = lp * aLow + n * (1 - aLow);
            lp2 = lp2 * aHigh + n * (1 - aHigh);
            const low = lp;
            const mid = lp2 - lp;
            const high = n - lp2;
            const t = i / sampleRate;
            out[i] = low * 3.4 * envelopeAt(t, times.low)
                + mid * 1.5 * envelopeAt(t, times.mid)
                + high * envelopeAt(t, times.high);
        }
        chans.push(out);
    }
    // One normalisation for both channels, so the width is not touched, and it
    // is taken from the FIRST 20 ms: every room answers the source at the same
    // loudness, and what differs between them is how long each band runs on.
    const onsetN = Math.min(len, Math.round(ONSET_SEC * sampleRate));
    let onset = 0;
    for (const ch of chans) for (let i = 0; i < onsetN; i += 1) onset += ch[i] * ch[i];
    onset = Math.sqrt(onset / (onsetN * 2));
    const k = onset > 0 ? IMPULSE_GAIN / onset : 1;
    for (const ch of chans) for (let i = 0; i < ch.length; i += 1) ch[i] *= k;
    // The envelope the stage draws, per band, at a fixed number of bins.
    const bins = 240;
    const span = impulseLength(rt60, absorb);
    const curves = {};
    for (const b of BAND_IDS) {
        const arr = new Float32Array(bins);
        for (let i = 0; i < bins; i += 1) arr[i] = envelopeAt((i / (bins - 1)) * span, times[b]);
        curves[b] = arr;
    }
    return { left: chans[0], right: chans[1], sampleRate, length: span, times, curves, bins };
}

// ---------------------------------------------------------------------------
// 5 · The sources
// ---------------------------------------------------------------------------
// Measured stems from the estate (docs/audio-credits.md). No new audio: the
// two the reverb folder already carries are the two a reflection shows on,
// a phrase for the colouration and a single hit for the bounce.
export const SOURCE_IDS = ['snare', 'vocal'];
export const SOURCES = {
    snare: { label: 'Snare', said: 'the snare', file: 'snare', bars: 2, beats: [0, 2], note: 'two hits, then three and a half seconds of room' },
    vocal: { label: 'Vocal', said: 'the vocal', file: 'vocal', bars: 3, beats: [0], note: 'a phrase, then the room on its own' },
};

// ---------------------------------------------------------------------------
// 6 · State
// ---------------------------------------------------------------------------
export function baseState() {
    return {
        station: 'room',
        // the ear
        tone: 100,
        listen: 'quiet',
        // masking
        target: 1000,
        place: 'below',
        masker: -14,
        targetOn: true,
        // the room
        source: 'snare',
        delay: 5,
        reflect: -2,
        rt60: 2.2,
        absorb: 'bare',
        room: 45,
        proof: false,
        // the frame
        task: null,
        presetId: null,
        level: 0.8,
    };
}

const drop = (state) => ({ ...state, presetId: null });
const one = (key, ids) => (state, v) => (ids.includes(v) && v !== state[key] ? { ...drop(state), [key]: v } : state);
const num = (key, lo, hi, round = Math.round) => (state, v) => {
    const n = clamp(round(v), lo, hi);
    return n === state[key] ? state : { ...drop(state), [key]: n };
};

export const setStation = one('station', STATION_IDS);
export const setTone = (state, v) => (TONE_IDS.includes(Number(v)) && Number(v) !== state.tone ? { ...drop(state), tone: Number(v) } : state);
export const setListen = one('listen', LEVEL_IDS);
export const setTarget = (state, v) => (TARGET_IDS.includes(Number(v)) && Number(v) !== state.target ? { ...drop(state), target: Number(v) } : state);
export const setPlace = one('place', PLACE_IDS);
export const setMasker = num('masker', MASKER_MIN, MASKER_MAX);
export const setTargetOn = (state, v) => ({ ...drop(state), targetOn: Boolean(v) });
export const setSource = (state, id) => (SOURCES[id] && id !== state.source ? { ...state, source: id } : state);
export const setDelay = num('delay', DELAY_MIN, DELAY_MAX, (v) => Math.round(v * 10) / 10);
export const setReflect = num('reflect', REFLECT_MIN, REFLECT_MAX);
export const setRt60 = num('rt60', RT60_MIN, RT60_MAX, (v) => Math.round(v * 100) / 100);
export const setRoom = num('room', ROOM_MIN, ROOM_MAX);
export const setAbsorb = (state, id) => (ABSORB[id] ? { ...drop(state), absorb: id, rt60: ABSORB[id].rt60 } : state);
export const setProof = (state, v) => ({ ...drop(state), proof: Boolean(v) });
export const setLevel = (state, level) => ({ ...state, level: clamp01(level) });

// ---------------------------------------------------------------------------
// 7 · What the graph is set to
// ---------------------------------------------------------------------------
export const roomGain = (state) => clamp(state.room, ROOM_MIN, ROOM_MAX) / 100;
export const directGain = () => 1;
export const reflectGain = (state) => ampOfDb(clamp(state.reflect, REFLECT_MIN, REFLECT_MAX));
export const delaySec = (state) => clamp(state.delay, DELAY_MIN, DELAY_MAX) / 1000;
export const maskerGain = (state) => ampOfDb(clamp(state.masker, MASKER_MIN, MASKER_MAX));
export const targetGain = (state) => (state.targetOn ? ampOfDb(TARGET_DBFS) : 0);
// Every tone leaves at one gain: the drawing tells the story, not the volume.
export const TONE_DBFS = -20;
export const toneGain = () => ampOfDb(TONE_DBFS);

export const fmtSec = (t) => `${t.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')} s`;
export const fmtMs = (ms) => `${ms >= 10 ? Math.round(ms) : Math.round(ms * 10) / 10} ms`;
export const fmtHz = (hz) => (hz >= 1000 ? `${sig3(hz / 1000)} kHz` : `${Math.round(hz)} Hz`);
export const fmtDb = (db) => `${db > 0 ? '+' : ''}${Math.round(db)} dB`;

/** Every number the console prints, from the state alone. */
export function readings(state) {
    if (state.station === 'loudness') {
        const r = loudnessReading(state);
        return {
            ...r,
            phonText: `${Math.round(r.phon)} phon`,
            gapText: `${Math.round(r.gap)} phon`,
            extraText: `${Math.round(r.extra)} dB`,
        };
    }
    if (state.station === 'masking') {
        const r = maskingReading(state);
        return { ...r, thresholdText: `${Math.round(r.threshold)} dB`, marginText: `${r.margin > 0 ? '+' : ''}${Math.round(r.margin)} dB` };
    }
    const notch = firstNotchHz(state.delay);
    const times = bandTimes(state.rt60, state.absorb);
    return {
        notch,
        notchText: fmtHz(notch),
        notches: notchesOf(state.delay).length,
        depth: combDepthDb(state.reflect),
        depthText: `${Math.round(combDepthDb(state.reflect))} dB`,
        colouration: state.delay <= COLOUR_LIMIT_MS,
        times,
        even: evenness(state.rt60, state.absorb),
        rt60Text: fmtSec(state.rt60),
    };
}

// ---------------------------------------------------------------------------
// 8 · The papers' tasks
// ---------------------------------------------------------------------------
// Every stem and every scheme line below is verbatim from the 9MT0/04,
// 9MT0/41 and 8MT0/41 papers, mark schemes and Principal Examiner reports as
// held in the vault. Acoustics is examined almost entirely inside the
// Section B evaluation, where it hides in the phrase "including the studio
// environment"; there is no RT60 calculation and no equal-loudness question
// in nine years, and the bench says so rather than inventing one.
export const TASKS = {
    hearing2022: {
        id: 'hearing2022', name: '2022 AS paper', station: 'loudness',
        stem: 'Give two reasons why the values on the x-axis start at 20 and finish at 20 k.',
        scheme: '"20Hz is lower end of human hearing range (1). 20kHz is upper end of hearing range. (1)"',
        cite: '2022 AS Q3(e)(iii)', focus: 'tone',
        report: 'The 2022 AS report: "Most said this is the human hearing range. Surprisingly few got the second mark".',
    },
    masking2020: {
        id: 'masking2020', name: '2020 paper', station: 'masking',
        stem: 'With reference to the graphs, evaluate the difference in sound quality between CD and AAC.',
        scheme: '"AAC noise will be mostly masked in electronic/pop music (1). With music with a wide dynamic range / acoustic music (1) the noise will be more audible (1)"',
        cite: '2020 A Q4(e)', focus: 'masker',
        report: 'The 2020 A report: "No marks were given for \'better sound quality\'; this was not precise enough".',
    },
    comb2021: {
        id: 'comb2021', name: '2021 paper', station: 'room',
        stem: 'Evaluate and compare the drum recording techniques for a rock recording.',
        scheme: '"The side mic is closer to the snare than the overhead mic. Mics should be equidistant from the snare. Delay between two mics. Phase problems. Comb filtering."',
        cite: '2021 A Q6', focus: 'reflection',
        report: '',
    },
    room2024: {
        id: 'room2024', name: '2024 AS paper', station: 'room',
        stem: 'Evaluate the recording set up including the studio environment.',
        scheme: '"Acoustic treatment on walls. Reduces reflections/reverb/ambience/absorbs sound energy. Only reduces mid and high frequency reflections. Too much acoustic treatment loses room character."',
        cite: '2024 AS Q6', focus: 'walls',
        report: '',
    },
    judge: {
        id: 'judge', name: 'Judge', station: 'room',
        stem: 'Evaluate the monitoring equipment and environment.',
        scheme: 'AO3 for naming what is there; AO4 for what it does to the sound and whether it suits the job',
        cite: '2022 AS Q6', focus: null,
        report: 'The 2022 AS report: "some students had clearly been taught to the word soundproofing which is meaningless".',
    },
};

// The reports, cut to the words that name the fault, each carrying its year.
export const REPORTS = {
    proof2022: 'The 2022 AS report: "Many responses used the word \'sound proofing\' which is not correct in the context of acoustic treatment".',
    proof2022b: 'The 2022 AS report: soundproofing "refers to the reduction of transmission of sound through building structures".',
    proof2026: 'The 2026 A report: "candidates continue to refer to \'soundproofing\' when answering questions about acoustics ... This cannot be seen in the picture, and thus cannot be credited".',
    proof2018: 'The 2018 AS report: "Many referred to the acoustic treatment as \'sound proofing\' which is a completely different thing".',
    dead2022: 'The 2022 AS report: "a control room does not want to be completely acoustically dead as this is an uncomfortable environment for most people".',
    thin2018: 'The 2018 AS scheme: "Tiles not thick so will not reduce low frequencies".',
    panels2024: 'The 2024 AS scheme: "Only reduces mid and high frequency reflections".',
    comb2021: 'The 2021 A scheme: "Mics should be equidistant from the snare. Delay between two mics. Phase problems. Comb filtering".',
    wall2021: 'The 2021 A scheme: "The side mic is close to the wall ... Destructive interference/comb filtering from reflections".',
    cancel2024: 'The 2024 A scheme, on a wave added to its own inversion: "Silence / destructive interference / cancel out / cancellation (1)".',
    modes2026: 'The 2026 A scheme: "Square room. Could cause standing waves / flutter echoes / room modes / nodes".',
    balance2024: 'The 2024 AS scheme: "Combination of reflective wooden floor and absorbent walls gives a balanced acoustic".',
    hearing2022: 'The 2022 AS scheme: "20Hz is lower end of human hearing range (1). 20kHz is upper end of hearing range. (1)".',
    sensitive2020: 'The 2020 A scheme: noise above 8 kHz is "above where the ear is sensitive (1) so it may not be heard by most people (1)".',
    extremity2019: 'The 2019 A scheme: a dip above 16 kHz is "Right on the extremity of human hearing so may not even be audible (1)".',
    masked2020: 'The 2020 A scheme: "AAC noise will be mostly masked in electronic/pop music (1)".',
    wide2020: 'The 2020 A scheme: "With music with a wide dynamic range / acoustic music (1) the noise will be more audible (1)".',
};

// ---------------------------------------------------------------------------
// 9 · Presets
// ---------------------------------------------------------------------------
// Core shows the three stations doing the one thing each is for; A-level
// carries the papers and the two Judge patches (the Bench Standard's rule of
// 2 Sep 2026). The state carries across the levels.
export const PRESETS = [
    { id: 'quiet', name: 'Turned down', level: 'core', task: null, blurb: 'The same three tones at one level, heard quietly: the bass tone is the one that goes', set: { station: 'loudness', tone: 100, listen: 'quiet' } },
    { id: 'loud', name: 'Turned up', level: 'core', task: null, blurb: 'The same tone, heard loudly: the contours flatten and the bass comes back', set: { station: 'loudness', tone: 100, listen: 'loud' } },
    { id: 'peak', name: 'The ear\'s peak', level: 'core', task: null, blurb: 'A 3 kHz tone, in the region the ear is built to be most sensitive to', set: { station: 'loudness', tone: 3000, listen: 'quiet' } },
    { id: 'hidden', name: 'Hidden', level: 'core', task: null, blurb: 'A noise band below the target, loud enough to take the tone away: press Target off and on to check it is really there', set: { station: 'masking', target: 1000, place: 'below', masker: -8, targetOn: true } },
    { id: 'fromAbove', name: 'From above', level: 'core', task: null, blurb: 'The same noise band above the target instead: however loud it gets, the tone stays', set: { station: 'masking', target: 1000, place: 'above', masker: 0, targetOn: true } },
    { id: 'oneWall', name: 'One wall', level: 'core', task: null, blurb: 'A snare and one reflection five milliseconds later: a first notch at 100 Hz and a comb across the whole spectrum', set: { station: 'room', source: 'snare', delay: 5, reflect: -2, room: 45, rt60: 2.2, absorb: 'bare', proof: false } },
    { id: 'bareRoom', name: 'Bare room', level: 'core', task: null, blurb: 'Hard walls with nothing on them: a long tail at every frequency', set: { station: 'room', source: 'snare', delay: 20, reflect: -14, room: 70, rt60: 2.2, absorb: 'bare', proof: false } },
    { id: 'treatedRoom', name: 'Treated', level: 'core', task: null, blurb: 'Panels for the mid and high, bass traps for the low: the whole spectrum comes down together', set: { station: 'room', source: 'snare', delay: 20, reflect: -14, room: 70, rt60: 0.6, absorb: 'treated', proof: false } },

    { id: 'hearing2022', name: '2022 AS paper', level: 'alevel', task: 'hearing2022', blurb: 'The paper that asks why a graph\'s axis starts at 20 and stops at 20 k: a 10 kHz tone near the top of the range', set: { station: 'loudness', tone: 10000, listen: 'quiet' } },
    { id: 'masking2020', name: '2020 paper', level: 'alevel', task: 'masking2020', blurb: 'The scheme\'s own line about noise masked in pop music: the band on the target, loud enough to take it', set: { station: 'masking', target: 2000, place: 'on', masker: -10, targetOn: true } },
    { id: 'comb2021', name: '2021 paper', level: 'alevel', task: 'comb2021', blurb: 'The side mic closer to the snare than the overhead: three milliseconds between two mics on one source', set: { station: 'room', source: 'snare', delay: 3, reflect: -1, room: 30, rt60: 1.1, absorb: 'panels', proof: false } },
    { id: 'room2024', name: '2024 AS paper', level: 'alevel', task: 'room2024', blurb: 'Thin panels on the walls: the top goes dead and the bass rings on, which is the line the scheme wants', set: { station: 'room', source: 'vocal', delay: 12, reflect: -10, room: 60, rt60: 1.1, absorb: 'panels', proof: false } },
    { id: 'judgeProof', name: 'Judge: soundproofing', level: 'alevel', task: 'judge', blurb: 'The trap three reports name: bare walls, and soundproofing asked for instead of treatment. Nothing in the room changes', set: { station: 'room', source: 'snare', delay: 8, reflect: -6, room: 70, rt60: 2.2, absorb: 'bare', proof: true } },
    { id: 'judgeDead', name: 'Judge: too dead', level: 'alevel', task: 'judge', blurb: 'The other way the answer goes wrong: treated until nothing is left, which the report calls uncomfortable', set: { station: 'room', source: 'vocal', delay: 20, reflect: -20, room: 20, rt60: 0.3, absorb: 'treated', proof: false } },
];

export function applyPreset(state, id) {
    const p = PRESETS.find((x) => x.id === id);
    if (!p) return state;
    return { ...baseState(), level: state.level, ...p.set, task: p.task, presetId: id };
}
export const presetsFor = (depth) => PRESETS.filter((p) => (p.level === 'core') === (depth === 'core'));
export const DEFAULT_STATE = applyPreset(baseState(), 'oneWall');

// ---------------------------------------------------------------------------
// 10 · The judge
// ---------------------------------------------------------------------------
// The Q6 idiom, applied station by station. Every band is either a scheme's
// own or is named on the bench as the bench's.
const V = (grade, why, cite = '') => ({ grade, why, cite });
export const GRADE_WORD = { good: 'suits', partly: 'partly', poor: 'does not suit' };
export const SECTION_IDS = ['tone', 'listen', 'target', 'masker', 'reflection', 'tail', 'walls'];
export const SECTIONS = {
    tone: { label: 'TONE', name: 'the tone', station: 'loudness' },
    listen: { label: 'LISTENING', name: 'the listening level', station: 'loudness' },
    target: { label: 'TARGET', name: 'the target', station: 'masking' },
    masker: { label: 'MASKER', name: 'the masker', station: 'masking' },
    reflection: { label: 'REFLECTION', name: 'the reflection', station: 'room' },
    tail: { label: 'TAIL', name: 'the tail', station: 'room' },
    walls: { label: 'WALLS', name: 'the walls', station: 'room' },
};
/** The judge's summary lists parts without a verb, so a count never has to agree. */
export const GRADE_TAIL = { good: 'in place', partly: 'partly', poor: 'not yet' };
export const sectionsOf = (station) => SECTION_IDS.filter((id) => SECTIONS[id].station === station);

export function judgeSection(state, section) {
    const r = readings(state);
    if (section === 'tone') {
        if (state.tone === 1000) return V('good', 'a 1 kHz tone is the reference the phon is defined against, so it reads its own level whatever the volume');
        if (state.tone === 3000) return V('good', 'near 3 kHz the ear canal resonates, so this tone sounds louder than its level, not quieter');
        if (state.tone === 10000) return V('partly', `at ${Math.round(r.gap)} phon under the 1 kHz tone this is the end of the range the paper asks about`, REPORTS.extremity2019);
        return V('partly', `a 100 Hz tone at the same level sounds ${Math.round(r.gap)} phon quieter, which is the fault a quiet mix hides`);
    }
    if (section === 'listen') {
        if (state.listen === 'loud') return V('good', 'heard loudly the contours flatten, so the ends of the spectrum report closer to their real level');
        if (r.gap <= 0) return V('good', `heard quietly this tone still gains ${Math.round(-r.gap)} phon, because the ear canal resonates near 3 kHz`);
        return V('partly', `heard quietly the ear under-reports the ends: this tone gives up ${Math.round(r.gap)} phon against the 1 kHz`);
    }
    if (section === 'target') {
        if (!state.targetOn) return V('partly', 'with the target off there is nothing to mask, so nothing is being tested');
        return V('good', `a ${fmtHz(state.target)} tone at ${TARGET_DBFS} dB is the thing the masker is being asked to hide`);
    }
    if (section === 'masker') {
        if (state.place === 'above') return V('poor', `from ${fmtHz(r.maskerHz)}, above the target, masking falls at 27 dB for every critical band, so the tone survives any level`, REPORTS.masked2020);
        const where = state.place === 'on' ? 'inside the same critical band' : `from ${fmtHz(r.maskerHz)}, below the target`;
        if (r.masked) return V('good', `${where} the masker reaches the tone: it is ${Math.abs(Math.round(r.margin))} dB under what it now needs`, REPORTS.masked2020);
        return V('partly', `${where} the masker is ${Math.round(r.margin)} dB short of taking the tone: raise it and listen`, REPORTS.wide2020);
    }
    if (section === 'reflection') {
        if (state.delay > COLOUR_LIMIT_MS) return V('partly', `at ${fmtMs(state.delay)} the copy is far enough behind to be heard as a separate bounce rather than a colouration`);
        if (r.depth >= 12) return V('poor', `one reflection ${fmtMs(state.delay)} behind puts a notch every ${fmtHz(2 * r.notch)} from ${r.notchText}, ${r.depthText} deep`, REPORTS.comb2021);
        return V('partly', `the copy is ${fmtMs(state.delay)} behind but ${Math.abs(state.reflect)} dB down, so the comb is only ${r.depthText} deep`, REPORTS.wall2021);
    }
    if (section === 'tail') {
        if (state.rt60 <= 0.45) return V('poor', `at ${r.rt60Text} there is almost nothing coming back, and a room with no reflected sound is not the goal`, REPORTS.dead2022);
        if (state.rt60 >= 2) return V('partly', `${r.rt60Text} is a long ring for a small room: everything played into it arrives on top of the last thing`);
        return V('good', `${r.rt60Text} leaves the room audible without the tail sitting on the next note`);
    }
    if (state.proof) return V('poor', 'soundproofing stops sound passing through a structure; it changes nothing about the reflections inside the room, and nothing here has changed', REPORTS.proof2022);
    if (state.absorb === 'bare') return V('partly', `hard walls everywhere: ${fmtSec(r.times.low)} in the low end and ${fmtSec(r.times.high)} in the top, so every reflection comes back`, REPORTS.modes2026);
    if (state.absorb === 'panels') return V('partly', `thin panels take the top down to ${fmtSec(r.times.high)} and leave the low end at ${fmtSec(r.times.low)}: dead in the highs and boomy in the bass`, REPORTS.panels2024);
    return V('good', `panels and bass traps together: ${fmtSec(r.times.low)} low against ${fmtSec(r.times.high)} high, which is one room rather than two`, REPORTS.balance2024);
}

export function judgeAll(state) {
    const out = {};
    for (const id of sectionsOf(state.station)) out[id] = judgeSection(state, id);
    return out;
}

/** The task's key state, for the stage and the gate. */
export function verdict(state) {
    if (state.station === 'room' && state.proof) {
        return { key: 'soundproofing', ok: false, note: 'nothing in the room changed' };
    }
    if (state.station === 'room') {
        if (state.rt60 <= 0.45 && state.absorb === 'treated') return { key: 'dead', ok: false };
        if (state.delay <= COLOUR_LIMIT_MS && combDepthDb(state.reflect) >= 12) return { key: 'comb', ok: state.task === 'comb2021' };
        if (state.absorb === 'panels') return { key: 'panels', ok: state.task === 'room2024' };
        if (state.absorb === 'treated') return { key: 'treated', ok: true };
        return { key: 'bare', ok: false };
    }
    if (state.station === 'masking') {
        const r = maskingReading(state);
        if (!state.targetOn) return { key: 'target-off', ok: null };
        return { key: r.masked ? 'masked' : 'audible', ok: state.task === 'masking2020' ? r.masked : null };
    }
    const r = loudnessReading(state);
    if (!r.audible) return { key: 'inaudible', ok: false };
    return { key: state.listen === 'quiet' ? 'quiet' : 'loud', ok: state.task === 'hearing2022' ? state.tone === 10000 : null };
}

// ---------------------------------------------------------------------------
// 11 · The stage's geometry
// ---------------------------------------------------------------------------
export const stageOf = (depth) => (depth === 'core' ? 'ear' : depth === 'alevel' ? 'paper' : 'machine');
export const SPL_FLOOR = -10;
export const SPL_CEIL = 120;
export const DB_FLOOR = -72;
export const DB_RT60 = -60;

const logX = (hz, lo, hi, x0, x1) => x0 + (Math.log(clamp(hz, lo, hi) / lo) / Math.log(hi / lo)) * (x1 - x0);
const logHzAt = (x, lo, hi, x0, x1) => lo * (hi / lo) ** clamp((x - x0) / (x1 - x0), 0, 1);

/** Core, the Loudness station: the contours with the tone as a dot on them. */
export function contourShape(state, box) {
    const { x0, y0, x1, y1 } = box;
    const xOf = (hz) => round4(logX(hz, HEARING_LOW, HEARING_HIGH, x0, x1));
    const yOf = (spl) => round4(y1 - ((clamp(spl, SPL_FLOOR, SPL_CEIL) - SPL_FLOOR) / (SPL_CEIL - SPL_FLOOR)) * (y1 - y0));
    const curves = CONTOURS.map((phon) => ({
        phon,
        points: ISO_F.map((f) => [xOf(f), yOf(splAt(f, phon))]),
    }));
    const threshold = ISO_F.map((f) => [xOf(f), yOf(thresholdAt(f))]);
    const r = loudnessReading(state);
    return {
        xOf, yOf, curves, threshold,
        dot: { x: xOf(state.tone), y: yOf(r.spl) },
        needs: { x: xOf(state.tone), y: yOf(r.needs) },
        line: yOf(r.spl),
        box,
    };
}

/** Core, the Masking station: the spectrum with the masker's skirt over it. */
export function maskShape(state, box) {
    const { x0, y0, x1, y1 } = box;
    const lo = 100;
    const hi = HEARING_HIGH;
    const top = 0;
    const bottom = -90;
    const xOf = (hz) => round4(logX(hz, lo, hi, x0, x1));
    const yOf = (db) => round4(y1 - ((clamp(db, bottom, top) - bottom) / (top - bottom)) * (y1 - y0));
    const r = maskingReading(state);
    const skirt = [];
    for (let i = 0; i <= 160; i += 1) {
        const hz = lo * (hi / lo) ** (i / 160);
        skirt.push([xOf(hz), yOf(dbfsOfSpl(maskThresholdSpl(hz, r.maskerHz, splOfDbfs(state.masker))))]);
    }
    return {
        xOf, yOf, lo, hi, top, bottom, skirt,
        masker: { x: xOf(r.maskerHz), y: yOf(state.masker), hz: r.maskerHz },
        target: { x: xOf(state.target), y: yOf(TARGET_DBFS), threshold: yOf(r.threshold) },
        box,
    };
}

/** Core, the Room station, upper half: the comb the reflection makes. */
export function combShape(state, box) {
    const { x0, y0, x1, y1 } = box;
    const lo = 20;
    const hi = HEARING_HIGH;
    const top = 8;
    const bottom = -30;
    const xOf = (hz) => round4(logX(hz, lo, hi, x0, x1));
    const hzAt = (x) => logHzAt(x, lo, hi, x0, x1);
    const yOf = (db) => round4(y1 - ((clamp(db, bottom, top) - bottom) / (top - bottom)) * (y1 - y0));
    const points = [];
    const n = 520;
    for (let i = 0; i <= n; i += 1) {
        const hz = lo * (hi / lo) ** (i / n);
        points.push([xOf(hz), yOf(combDb(hz, state.delay, state.reflect))]);
    }
    // Past a few kHz a 5 ms comb has more notches than the stage has pixels, so
    // the curve is drawn as a band: the highest and lowest the response reaches
    // inside each column. Where the notches are further apart than a pixel the
    // two edges meet and it reads as one line, which is what an analyser does.
    const cols = Math.max(60, Math.round(x1 - x0));
    const band = [];
    for (let i = 0; i <= cols; i += 1) {
        const f0 = lo * (hi / lo) ** (i / cols);
        const f1 = lo * (hi / lo) ** ((i + 1) / cols);
        let mn = Infinity;
        let mx = -Infinity;
        for (let k = 0; k <= 8; k += 1) {
            const v = combDb(f0 + ((f1 - f0) * k) / 8, state.delay, state.reflect);
            if (v < mn) mn = v;
            if (v > mx) mx = v;
        }
        band.push([round4(xOf(f0)), yOf(mx), yOf(mn)]);
    }
    const first = firstNotchHz(state.delay);
    const marks = notchesOf(state.delay).slice(0, 60).map((hz) => ({ hz, x: xOf(hz) }));
    return {
        xOf, yOf, hzAt, lo, hi, top, bottom, points, band, marks,
        first,
        handle: { x: xOf(clamp(first, lo, hi)), y: yOf(combNotchDb(state.reflect)) },
        box,
    };
}

/** Core, the Room station, lower half: the three bands falling to the floor. */
export function decayShape(state, box) {
    const { x0, y0, x1, y1 } = box;
    const times = bandTimes(state.rt60, state.absorb);
    const tMax = Math.max(0.6, Math.max(...Object.values(times)) * 1.15);
    const xOf = (t) => round4(x0 + (clamp(t, 0, tMax) / tMax) * (x1 - x0));
    const yOf = (db) => round4(y1 - ((clamp(db, DB_FLOOR, 0) - DB_FLOOR) / (0 - DB_FLOOR)) * (y1 - y0));
    const tAt = (x) => clamp(((x - x0) / (x1 - x0)) * tMax, 0, tMax);
    const lines = BAND_IDS.map((id) => {
        const pts = [];
        for (let i = 0; i <= 90; i += 1) {
            const t = (i / 90) * tMax;
            pts.push([xOf(t), yOf(envelopeDbAt(t, times[id]))]);
        }
        return { id, time: times[id], points: pts, end: { x: xOf(times[id]), y: yOf(DB_RT60) } };
    });
    return {
        xOf, yOf, tAt, tMax, times, lines,
        floorY: yOf(DB_RT60),
        handle: { x: xOf(times.mid), y: yOf(DB_RT60) },
        box,
    };
}

/** The Delay dial, from the notch marker's x on the comb plot. */
export function delayFromComb(shape, x) {
    const hz = clamp(shape.hzAt(x), 12.5, 20000);
    return clamp(Math.round((500 / hz) * 10) / 10, DELAY_MIN, DELAY_MAX);
}
/** The RT60 dial, from the tail's end on the decay plot. */
export function rt60FromDecay(shape, x) {
    return clamp(Math.round(shape.tAt(x) * 100) / 100, RT60_MIN, RT60_MAX);
}

/**
 * A-level, `data-stage=paper`: the paper's own figure for this station, laid
 * out as boxes the judge can grade. The room is the Q6 photograph read as a
 * plan; the other two are the graphs the written papers print.
 *
 * Every size comes from the box, because the stage is only about 140 px of
 * usable height at 1280 by 700 and a fixed box height runs one row into the
 * next (the fault the first contact sheet found, 12 Sep 2026).
 */
export function paperBoxes(state, box) {
    const { x0, y0, x1, y1 } = box;
    const w = x1 - x0;
    const h = y1 - y0;
    const bh = Math.max(38, Math.min(58, Math.round(h * 0.29)));
    const words = bh >= 54;
    const spread = (defs, y, wid) => {
        const gap = (w - defs.length * wid) / (defs.length + 1);
        return defs.map((d, i) => ({ ...d, x: round4(x0 + gap * (i + 1) + i * wid), y: round4(y), w: wid, h: bh, words }));
    };
    if (state.station === 'room') {
        // Three rows: what the walls are, the path from source to mic, and what
        // the room sends after it. The dividing wall and what is on the other
        // side of it sit to the right, because that is the soundproofing line.
        const rowGap = Math.max(6, Math.round((h - 3 * bh) / 4));
        const rowA = round4(y0 + rowGap);
        const rowB = round4(rowA + bh + rowGap);
        const rowC = round4(rowB + bh + rowGap);
        const divide = round4(x0 + w * 0.72);
        const bw = Math.min(150, Math.round((divide - x0) / 2.4));
        const wall = { x: round4(x0 + (divide - x0) * 0.34), y: rowA, w: bw, h: bh, words, id: 'walls', section: 'walls', label: 'WALLS', sub: ABSORB[state.absorb].label };
        const src = { x: round4(x0 + 10), y: rowB, w: bw, h: bh, words, id: 'source', section: null, label: 'SOURCE', sub: SOURCES[state.source].label };
        const mic = { x: round4(divide - bw - 16), y: rowB, w: bw, h: bh, words, id: 'mic', section: 'reflection', label: 'MIC', sub: `${fmtMs(state.delay)} bounce` };
        const room = { x: round4(x0 + (divide - x0) * 0.34), y: rowC, w: bw, h: bh, words, id: 'room', section: 'tail', label: 'ROOM', sub: fmtSec(state.rt60) };
        const outside = { x: round4(divide + 26), y: rowB, w: Math.min(bw, x1 - divide - 32), h: bh, words, id: 'outside', section: 'walls', label: 'NEXT DOOR', sub: state.proof ? 'quieter' : 'unchanged' };
        return { boxes: [wall, src, mic, room, outside], wall, src, mic, room, outside, divide, bh };
    }
    const y = round4(y0 + (h - bh) * 0.42);
    const wid = Math.min(180, Math.round((w - 80) / 3));
    if (state.station === 'masking') {
        const r = maskingReading(state);
        const boxes = spread([
            { id: 'target', section: 'target', label: 'TARGET', sub: `${fmtHz(state.target)} at ${TARGET_DBFS} dB` },
            { id: 'masker', section: 'masker', label: 'MASKER', sub: `${fmtHz(r.maskerHz)} at ${Math.round(state.masker)} dB` },
            { id: 'heard', section: 'masker', label: 'HEARD', sub: r.masked ? 'the masker only' : 'both of them' },
        ], y, wid);
        return { boxes, a: boxes[0], b: boxes[1], c: boxes[2], bh };
    }
    const lr = loudnessReading(state);
    const boxes = spread([
        { id: 'tone', section: 'tone', label: 'TONE', sub: `${TONES[state.tone].label} at ${TONE_DBFS} dB` },
        { id: 'listen', section: 'listen', label: 'LEVEL', sub: `${LEVELS[state.listen].phon} dB SPL` },
        { id: 'seems', section: 'tone', label: 'SEEMS', sub: `${Math.round(lr.phon)} phon` },
    ], y, wid);
    return { boxes, a: boxes[0], b: boxes[1], c: boxes[2], bh };
}

/**
 * Extension, `data-stage=machine`: the station's signal graph, in order, with
 * the answer the convolver holds drawn to scale in the band beneath it. Sized
 * from the box for the same reason as the figure above.
 */
export function machineBoxes(state, box) {
    const { x0, y0, x1, y1 } = box;
    const h = y1 - y0;
    const twoRows = state.station !== 'loudness';
    const lane = state.station === 'room';
    const bh = Math.max(38, Math.min(54, Math.round(h * (twoRows ? 0.30 : 0.34))));
    const laneH = lane ? Math.max(26, Math.round(h * 0.22)) : 0;
    const free = h - (twoRows ? 2 * bh : bh) - laneH;
    const gap = Math.max(6, Math.round(free / (twoRows ? 3 : 2)));
    const rowA = round4(y0 + gap);
    const rowB = round4(rowA + bh + gap);
    const row = (names, y, wid) => {
        const g = ((x1 - x0) - names.length * wid) / (names.length + 1);
        return names.map((n, i) => ({ ...n, x: round4(x0 + g * (i + 1) + i * wid), y: round4(y), w: wid, h: bh }));
    };
    const laneBox = { x0: round4(x0 + 40), x1: round4(x1 - 40), y: round4(y1 - 12), h: laneH };
    if (state.station === 'room') {
        const top = row([
            { id: 'stem', label: 'STEM', sub: SOURCES[state.source].label },
            { id: 'split', label: 'SPLIT', sub: 'direct and copy' },
            { id: 'delay', label: 'DELAY', sub: fmtMs(state.delay) },
            { id: 'sum', label: 'SUM', sub: `notch ${fmtHz(firstNotchHz(state.delay))}` },
        ], rowA, 140);
        const low = row([
            { id: 'send', label: 'SEND', sub: `${state.room} %` },
            { id: 'conv', label: 'CONVOLVER', sub: fmtSec(state.rt60) },
            { id: 'out', label: 'OUT', sub: 'the room' },
        ], rowB, 150);
        return { boxes: [...top, ...low], top, low, lane: laneBox, bh };
    }
    if (state.station === 'masking') {
        const top = row([
            { id: 'noise', label: 'NOISE', sub: `${fmtHz(maskerHzOf(state))} band` },
            { id: 'band', label: 'BAND-PASS', sub: `${Math.round(criticalBandwidth(maskerHzOf(state)))} Hz wide` },
            { id: 'mgain', label: 'GAIN', sub: fmtDb(state.masker) },
        ], rowA, 172);
        const low = row([
            { id: 'osc', label: 'OSCILLATOR', sub: fmtHz(state.target) },
            { id: 'tgain', label: 'GAIN', sub: state.targetOn ? fmtDb(TARGET_DBFS) : 'off' },
            { id: 'sum', label: 'SUM', sub: 'one output' },
        ], rowB, 172);
        return { boxes: [...top, ...low], top, low, lane: laneBox, bh };
    }
    const top = row([
        { id: 'osc', label: 'OSCILLATOR', sub: fmtHz(state.tone) },
        { id: 'gain', label: 'GAIN', sub: fmtDb(TONE_DBFS) },
        { id: 'out', label: 'OUT', sub: `${LEVELS[state.listen].phon} dB SPL` },
        { id: 'ear', label: 'THE EAR', sub: `${Math.round(loudnessReading(state).phon)} phon` },
    ], round4(y0 + (h - bh) * 0.38), 140);
    return { boxes: top, top, low: [], lane: laneBox, bh };
}
