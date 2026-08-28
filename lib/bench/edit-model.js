// The Edit bench's model (1.6 Audio Editing), pure and tested. One take, one
// cut, one fade: the bench renders the edit from the decoded samples exactly
// as a DAW would bounce it, plays that render, and draws the same samples
// around the join. The click a student hears is the step these functions
// measure; the fade they hear is the gain curve these functions draw.
//
// Two kinds of edit, one code path:
//   splice  region A ends at the cut, region B comes in after a removed
//           section (the vocal: a held note shortened);
//   trim    region A ends at the cut and silence follows (the cymbal: a
//           tail cut off where the waveform looks finished).
// A crossfade on a splice is centred on the cut, using the material either
// side of the region edges, as a DAW's crossfade does. A fade on a trim sits
// inside the region and ends at the cut.

export const LENGTH_MAX = 500; // ms
export const PAD_SEC = 1.0; // silence booked after a trim, so the missing tail is heard as absence
export const PRE_SEC = 0.9; // how far before the join the loop starts
export const POST_SEC = 0.9; // how far after it the loop runs (splice)

export const SHAPE_IDS = ['linear', 'power', 'scurve'];
export const SHAPES = {
    linear: { label: 'Linear', name: 'linear', does: 'the gain changes by the same amount every millisecond' },
    power: { label: 'Equal power', name: 'equal power', does: 'the two gains are shaped so their power adds up to one all the way through' },
    scurve: { label: 'S-curve', name: 'S-curve', does: 'slow at both ends and quick in the middle, the shape that follows how loudness is heard' },
};

export const TAKE_IDS = ['vocal', 'cymbal'];
export const TAKES = {
    vocal: { label: 'Vocal', said: 'the vocal', file: 'vocal', kind: 'splice' },
    cymbal: { label: 'Cymbal', said: 'the cymbal', file: 'funk-openhat', kind: 'trim' },
};
export const isSplice = (take) => TAKES[take].kind === 'splice';

// The fade-in gain at t in [0, 1]. Fade-out is the mirror.
export function fadeIn(shape, t) {
    const x = Math.max(0, Math.min(1, t));
    if (shape === 'power') return Math.sin((Math.PI / 2) * x);
    if (shape === 'scurve') return (1 - Math.cos(Math.PI * x)) / 2;
    return x;
}
export function fadeOut(shape, t) { return fadeIn(shape, 1 - t); }

// The level through a crossfade of two unrelated sounds: their powers add.
export function sumDb(shape, t) {
    const o = fadeOut(shape, t);
    const i = fadeIn(shape, t);
    const p = o * o + i * i;
    return 10 * Math.log10(Math.max(1e-12, p));
}
// The deepest the level goes through the crossfade (0 for equal power).
export function dipDb(shape, n = 101) {
    let lo = 0;
    for (let k = 0; k <= n; k += 1) lo = Math.min(lo, sumDb(shape, k / n));
    return lo;
}
// The gain curves at n points, for drawing.
export function fadeCurve(shape, n = 65) {
    const pts = [];
    for (let k = 0; k <= n; k += 1) { const t = k / n; pts.push({ t, out: fadeOut(shape, t), in: fadeIn(shape, t), sumDb: sumDb(shape, t) }); }
    return pts;
}

// ---- the samples --------------------------------------------------------

// The nearest rising zero crossing to `idx` (the sample where the wave comes
// up through zero), within `span` samples either side; `idx` itself if none.
export function nearestRisingZero(ch, idx, span = 4410) {
    const lo = Math.max(1, idx - span);
    const hi = Math.min(ch.length - 1, idx + span);
    let best = null;
    for (let d = 0; d <= span; d += 1) {
        const r = idx + d;
        if (r <= hi && r >= 1 && ch[r - 1] <= 0 && ch[r] > 0) { best = r; break; }
        const l = idx - d;
        if (d > 0 && l >= lo && ch[l - 1] <= 0 && ch[l] > 0) { best = l; break; }
    }
    return best == null ? idx : best;
}

// The size of the jump a hard cut makes: the last sample of A against the
// first sample of B (or silence). In linear amplitude, 0 to 2.
export function stepAt(a, outIdx, b, inIdx) {
    const last = outIdx > 0 && outIdx <= a.length ? a[outIdx - 1] : 0;
    const first = b && inIdx >= 0 && inIdx < b.length ? b[inIdx] : 0;
    return Math.abs(last - first);
}

// The last sample the take is still sounding at (a 20 ms peak envelope over
// `floor`), so the bench can say how much tail a trim threw away.
export function tailEndIdx(ch, sr, floor = 0.001) {
    const bin = Math.max(1, Math.round(sr * 0.02));
    for (let i = ch.length - bin; i >= 0; i -= bin) {
        let m = 0;
        for (let j = i; j < Math.min(ch.length, i + bin); j += 1) { const v = Math.abs(ch[j]); if (v > m) m = v; }
        if (m > floor) return Math.min(ch.length, i + bin);
    }
    return 0;
}

// The edit, bounced. `a` and `b` are Float32Array channels (b null for a
// trim). Returns the output samples and where the join sits in them.
export function renderEdit({ a, b = null, outIdx, inIdx = 0, shape = 'power', lengthSamples = 0, padSamples = 0 }) {
    const L = Math.max(0, Math.round(lengthSamples));
    if (b) {
        const half = Math.floor(L / 2);
        const aStart = Math.max(0, outIdx - half);
        const bStart = Math.max(0, inIdx - half);
        const fadeLen = Math.min(L, a.length - aStart, b.length - bStart);
        const n = aStart + (b.length - bStart);
        const out = new Float32Array(n);
        out.set(a.subarray(0, aStart), 0);
        for (let k = 0; k < fadeLen; k += 1) {
            const t = fadeLen > 1 ? k / fadeLen : 1;
            out[aStart + k] = a[aStart + k] * fadeOut(shape, t) + b[bStart + k] * fadeIn(shape, t);
        }
        out.set(b.subarray(bStart + fadeLen), aStart + fadeLen);
        return { data: out, join: outIdx, fadeStart: aStart, fadeEnd: aStart + fadeLen, aEnd: aStart + fadeLen, bStart: aStart };
    }
    const end = Math.min(a.length, Math.max(0, outIdx));
    const n = end + Math.max(0, Math.round(padSamples));
    const out = new Float32Array(n);
    out.set(a.subarray(0, end), 0);
    const fadeLen = Math.min(L, end);
    const fadeStart = end - fadeLen;
    for (let k = 0; k < fadeLen; k += 1) {
        const t = fadeLen > 1 ? k / fadeLen : 1;
        out[fadeStart + k] = a[fadeStart + k] * fadeOut(shape, t);
    }
    return { data: out, join: end, fadeStart, fadeEnd: end, aEnd: end, bStart: end };
}

// ---- the state ----------------------------------------------------------

export const DEFAULT_STATE = Object.freeze({
    take: 'vocal',
    cut: 2500, // ms into the take
    gap: 500, // ms removed after the cut (splice only)
    snap: false, // snap the cut to zero crossings
    shape: 'power',
    length: 0, // ms; 0 is a hard cut
    level: 0.8,
    presetId: 'click',
});

// Where a cut may sit on a take of `durationMs`: never inside the first
// 100 ms, and on a splice there must be room for the removed section and
// a little of region B after it.
export function cutRange(take, durationMs, gapMs = 0) {
    const lo = 100;
    const hi = isSplice(take) ? Math.max(lo + 1, durationMs - gapMs - 200) : Math.max(lo + 1, durationMs - 20);
    return { lo, hi };
}

// The effective join, in samples: the out point on A and (for a splice) the
// in point on B. With snap on, both go to their nearest rising zero crossing.
export function joinPoints(state, sr, ch) {
    const outRaw = Math.round((state.cut / 1000) * sr);
    const out = state.snap && ch ? nearestRisingZero(ch, outRaw) : outRaw;
    if (!isSplice(state.take)) return { outIdx: out, inIdx: null };
    const inRaw = Math.round(((state.cut + state.gap) / 1000) * sr);
    const inn = state.snap && ch ? nearestRisingZero(ch, inRaw) : inRaw;
    return { outIdx: out, inIdx: inn };
}

// The cut, snapped, as the state stores it (ms). The state holds the snapped
// value so the dial, the stage and the sound all read one number.
export function snapCutMs(ch, sr, cutMs) {
    const idx = nearestRisingZero(ch, Math.round((cutMs / 1000) * sr));
    return (idx / sr) * 1000;
}

// Everything the console and the bench's line read, from one edit.
export function editStats(state, sr, ch) {
    const { outIdx, inIdx } = joinPoints(state, sr, ch);
    const splice = isSplice(state.take);
    const step = ch ? stepAt(ch, outIdx, splice ? ch : null, splice ? inIdx : 0) : 0;
    const lengthSamples = Math.round((state.length / 1000) * sr);
    const tailEnd = ch && !splice ? tailEndIdx(ch, sr) : 0;
    return {
        outIdx,
        inIdx,
        outSec: outIdx / sr,
        inSec: inIdx == null ? null : inIdx / sr,
        step,
        stepPct: Math.round(step * 100),
        atZero: step < 0.03, // under 3% of full scale: a join the ear reads as silent
        faded: state.length > 0,
        lengthMs: state.length,
        lengthSamples,
        dipDb: state.length > 0 ? dipDb(state.shape) : 0,
        removedSec: splice ? (inIdx - outIdx) / sr : 0,
        tailLostSec: !splice ? Math.max(0, tailEnd - outIdx) / sr : 0,
        tailEndSec: !splice ? tailEnd / sr : 0,
    };
}

// The loop the transport plays: from a little before the join to a little
// after (or, on a trim, into the silence). In output samples.
export function loopWindow(state, render, sr) {
    const pre = Math.min(render.join, Math.round(PRE_SEC * sr));
    const start = render.join - pre;
    const post = isSplice(state.take)
        ? Math.min(render.data.length - render.join, Math.round(POST_SEC * sr) + Math.round((state.length / 2000) * sr))
        : Math.round(PAD_SEC * sr);
    return { start, length: pre + post };
}

// ---- presets --------------------------------------------------------------
// Cut points measured on the takes themselves (28 Aug 2026): the vocal at
// 2.500 s sits at +0.42 of full scale mid-cycle, and 3.000 s at −0.29, so a
// hard join there jumps 0.72: a pop. The hat's 20 ms peak falls under 0.05
// at 0.58 s but the tail rings to 1.48 s.
export const PRESETS = [
    { id: 'click', name: 'The click', blurb: 'A held note shortened by a hard cut that lands mid-cycle. Hear the pop.', patch: { take: 'vocal', cut: 2500, gap: 500, snap: false, shape: 'power', length: 0 } },
    { id: 'zero', name: 'Zero crossing', blurb: 'The same cut, snapped to the nearest zero crossings on both sides.', patch: { take: 'vocal', cut: 2500, gap: 500, snap: true, shape: 'power', length: 0 } },
    { id: 'repair', name: 'Repair fade', blurb: 'A 10 ms equal-power crossfade over the join: the click gone, nothing else changed.', patch: { take: 'vocal', cut: 2500, gap: 500, snap: false, shape: 'power', length: 10 } },
    { id: 'linear', name: 'Linear, long', blurb: 'A 400 ms linear crossfade. Listen for the level dipping in the middle of it.', patch: { take: 'vocal', cut: 2500, gap: 500, snap: false, shape: 'linear', length: 400 } },
    { id: 'power', name: 'Equal power, long', blurb: 'The same 400 ms, equal power: the level holds all the way through.', patch: { take: 'vocal', cut: 2500, gap: 500, snap: false, shape: 'power', length: 400 } },
    { id: 'tail', name: 'The tail', blurb: 'The cymbal cut where the waveform looks finished. Hold dry and hear what was still ringing.', patch: { take: 'cymbal', cut: 580, snap: false, shape: 'scurve', length: 0 } },
    { id: 'p2022', name: '2022 paper', blurb: "The paper's click: a waveform cut when it is not at zero displacement. Theirs came from a 0 ms release, this one from a cut; the same fault, and the mark scheme credits a drawing of it.", patch: { take: 'vocal', cut: 1000, gap: 700, snap: false, shape: 'power', length: 0 } },
    { id: 'p2024', name: '2024 paper', blurb: "The smooth edit point the 2024 examiner wanted at every join: a short equal-power crossfade. Most candidates left them out and scored 2 of 4.", patch: { take: 'vocal', cut: 2500, gap: 500, snap: true, shape: 'power', length: 15 } },
];

export function applyPreset(state, presetId) {
    const p = PRESETS.find((x) => x.id === presetId);
    if (!p) return state;
    return { ...state, ...p.patch, presetId };
}

// A change to any control leaves the preset behind.
export function setParam(state, patch) {
    return { ...state, ...patch, presetId: null };
}

// ---- words ------------------------------------------------------------------
export const fmtMs = (ms) => (ms < 1 ? `${ms.toFixed(1)} ms` : ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(2)} s`);
export const fmtSec = (sec) => `${sec.toFixed(3)} s`;
export const fmtDb = (raw) => { const db = Math.abs(raw) < 0.05 ? 0 : raw; return `${db > 0 ? '+' : db < 0 ? '−' : ''}${Math.abs(db).toFixed(1).replace(/\.0$/, '')} dB`; };
export function lengthWord(ms) { return ms === 0 ? 'a hard cut' : ms <= 15 ? 'a repair' : ms <= 80 ? 'short' : ms <= 250 ? 'medium' : 'a transition'; }
