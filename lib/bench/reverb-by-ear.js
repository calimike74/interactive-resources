// Reverb by ear (1.12): blind rounds on the Reverb bench's own vocal.
//
// Built 29 Sep 2026 for the Upper Sixth. A listening question played a pop
// vocal and asked for its reverb in a table (Type, Reverb time (s), Wet
// level %). The answer was a hall or a plate, 1.5 to 3 s, 10 to 30 per cent
// wet, and the whole class went too small and too wet. This file draws the
// hidden settings, marks an answer the way that table is marked, and works
// out which way a pupil leans. Nothing here touches the DOM or Web Audio:
// the sound is the Reverb bench's own impulse response and graph
// (lib/bench/reverb-model.js, components/resources/ReverbBench.jsx).

import { baseState } from './reverb-model.js';

// ---- what a round can be -----------------------------------------------------------
export const ROUND_TYPES = ['room', 'hall', 'plate'];
export const ROUND_TIMES = [0.6, 1, 1.5, 2, 2.5, 3];
// A round has to sound like a real mix, so the time follows the type: a room
// dies away inside a second, a vocal hall or plate runs 1.5 to 3 s. A 0.6 s
// hall would teach the opposite of the lesson.
export const TIMES_BY_TYPE = {
    room: [0.6, 1],
    hall: [1.5, 2, 2.5, 3],
    plate: [1.5, 2, 2.5, 3],
};
export const ROUND_WETS = [10, 20, 30, 45, 60];
export const ROUNDS_PER_SET = 5;

// Pre-delay is not asked for, so it is fixed by type (the bench's own
// presets: a room answers at once, a hall after a gap, a plate in between).
export const PREDELAY_BY_TYPE = { room: 10, hall: 40, plate: 20 };
// Damping is not asked for either: the bench's default.
export const ROUND_DAMPING = 30;

// ---- the marks ----------------------------------------------------------------------
// Type must match. Reverb time counts within 0.5 s, Wet level within 10 points.
export const TIME_TOL = 0.5;
export const WET_TOL = 10;
const EPS = 1e-9;

// ---- the answer sheet's ranges -------------------------------------------------------
export const ANSWER_TIME = { min: 0.2, max: 4, step: 0.1 };
export const ANSWER_WET = { min: 0, max: 100, step: 5 };

// ---- the calibration ladders ---------------------------------------------------------
// Every type a round can be, heard first, each at a length it has in a real
// mix and the same wet level, so the only thing that changes is the space.
export const TYPE_LADDER = [
    { id: 'room', type: 'room', time: 1, wet: 20 },
    { id: 'hall', type: 'hall', time: 2, wet: 20 },
    { id: 'plate', type: 'plate', time: 2, wet: 20 },
];
export const TIME_LADDER = [1, 2, 3].map((time) => ({ id: `t${time}`, type: 'hall', time, wet: 20 }));
export const WET_LADDER = [10, 30, 60].map((wet) => ({ id: `w${wet}`, type: 'hall', time: 2, wet }));
export const DRY_RUNG = { id: 'dry', type: 'hall', time: 2, wet: 0 };

// ---- the seeded draw ------------------------------------------------------------------
// FNV-1a over the code, then mulberry32: the same code on thirty screens
// gives the same five rounds, so a class can go through round 3 together.
export function hashCode(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i += 1) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
}

export function mulberry32(seed) {
    let a = seed >>> 0;
    return function next() {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// A code a class can read off the board: capitals and digits, no O/0 or I/1.
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function normaliseCode(raw) {
    if (raw == null) return null;
    const code = String(raw).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
    return code || null;
}
export function randomCode(rand = Math.random) {
    let s = '';
    for (let i = 0; i < 4; i += 1) s += CODE_CHARS[Math.floor(rand() * CODE_CHARS.length)];
    return s;
}

const pick = (rand, list) => list[Math.floor(rand() * list.length)];

/**
 * The five hidden rounds for a code and a set number. Every set holds each
 * of the three types at least once, so no set is five halls. The same code
 * and set number always give the same rounds.
 */
export function drawSet(code, setNo = 1) {
    const rand = mulberry32(hashCode(`${normaliseCode(code) || ''}:${Math.max(1, Math.floor(setNo) || 1)}`));
    const types = [...ROUND_TYPES];
    while (types.length < ROUNDS_PER_SET) types.push(pick(rand, ROUND_TYPES));
    for (let i = types.length - 1; i > 0; i -= 1) {
        const j = Math.floor(rand() * (i + 1));
        [types[i], types[j]] = [types[j], types[i]];
    }
    return types.map((type, i) => ({
        n: i + 1,
        type,
        time: pick(rand, TIMES_BY_TYPE[type]),
        wet: pick(rand, ROUND_WETS),
        predelay: PREDELAY_BY_TYPE[type],
    }));
}

/** The bench's state for a round or a ladder rung: the vocal, on a stereo send. */
export function soundState({ type, time, wet, predelay }) {
    return {
        ...baseState(),
        source: 'vocal',
        type,
        time,
        wet,
        predelay: predelay ?? PREDELAY_BY_TYPE[type] ?? 40,
        damping: ROUND_DAMPING,
        dry: 100,
        stereo: 'stereo',
        routing: 'send',
        pan: 0,
    };
}

// ---- marking --------------------------------------------------------------------------
export const EMPTY_ANSWER = { type: null, time: null, wet: null };

/** One mark a row: type exact, time within 0.5 s, wet within 10 points. */
export function markRound(answer, truth) {
    const a = answer || EMPTY_ANSWER;
    const type = a.type != null && a.type === truth.type;
    const time = a.time != null && Math.abs(a.time - truth.time) <= TIME_TOL + EPS;
    const wet = a.wet != null && Math.abs(a.wet - truth.wet) <= WET_TOL + EPS;
    return { type, time, wet, total: Number(type) + Number(time) + Number(wet) };
}

const round1 = (x) => Math.round(x * 10) / 10;

/**
 * The lean over a set: the signed average of (answer minus truth) for time
 * and wet, over the rounds that row was answered in, and how often each
 * type was picked against how often it came up.
 */
export function leanOf(rounds, answers) {
    const dt = [];
    const dw = [];
    const picked = { room: 0, hall: 0, plate: 0 };
    const cameUp = { room: 0, hall: 0, plate: 0 };
    let score = 0;
    rounds.forEach((r, i) => {
        const a = answers[i] || EMPTY_ANSWER;
        cameUp[r.type] += 1;
        if (a.type && picked[a.type] != null) picked[a.type] += 1;
        if (a.time != null) dt.push(a.time - r.time);
        if (a.wet != null) dw.push(a.wet - r.wet);
        score += markRound(a, r).total;
    });
    const mean = (xs) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null);
    const t = mean(dt);
    const w = mean(dw);
    return {
        time: t == null ? null : round1(t),
        wet: w == null ? null : Math.round(w),
        timeCount: dt.length,
        wetCount: dw.length,
        picked,
        cameUp,
        score,
        outOf: rounds.length * 3,
    };
}

const fmtS = (x) => `${Number(x.toFixed(1))} s`;
const points = (n) => `${n} ${n === 1 ? 'point' : 'points'}`;

// Inside these the lean is too small to talk about.
export const TIME_EVEN = 0.2;
export const WET_EVEN = 3;

/** The lean in plain sentences, signed averages said as short/long and high/low. */
export function leanSentences(lean) {
    const out = [];
    if (lean.time == null) out.push('You did not set a reverb time, so there is no time lean to show.');
    else if (Math.abs(lean.time) < TIME_EVEN) out.push(`Your reverb times were about right on average (${lean.time >= 0 ? '+' : ''}${fmtS(lean.time)}).`);
    else out.push(`Your reverb times ran on average ${fmtS(Math.abs(lean.time))} ${lean.time < 0 ? 'short' : 'long'}.`);

    if (lean.wet == null) out.push('You did not set a wet level, so there is no wet lean to show.');
    else if (Math.abs(lean.wet) < WET_EVEN) out.push(`Your wet levels were about right on average (${lean.wet >= 0 ? '+' : ''}${points(lean.wet)}).`);
    else out.push(`Your wet levels ran ${points(Math.abs(lean.wet))} ${lean.wet > 0 ? 'high' : 'low'}.`);

    const over = ROUND_TYPES
        .map((id) => ({ id, d: lean.picked[id] - lean.cameUp[id] }))
        .filter((x) => x.d > 0)
        .sort((a, b) => b.d - a.d)[0];
    if (over) {
        const label = TYPE_LABEL[over.id];
        const times = (n) => (n === 1 ? 'once' : n === 2 ? 'twice' : `${n} times`);
        const came = lean.cameUp[over.id];
        out.push(`You picked ${label} ${times(lean.picked[over.id])}. It came up ${came === 0 ? 'no times' : times(came)}.`);
    }
    return out;
}

export const TYPE_LABEL = { room: 'Room', hall: 'Hall', plate: 'Plate' };

export const RULE_OF_THUMB = 'A vocal reverb you can clearly hear is usually still only 10 to 30% wet, and a pop vocal hall or plate usually runs 1.5 to 3 s.';
