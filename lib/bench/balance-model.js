// The Balance Desk (1.13): the model behind the faders.
//
// Five stems of one song arrive the way the exam supplies them: each file
// trimmed by the examiner to a deliberately wrong level, faders at unity. The
// student balances by ear. Everything here is pure arithmetic over the song's
// measured numbers (scratchpad cut.py, 29 Aug 2026: RMS and nine band levels
// per stem, from the samples that play), so the judge, the stage and the
// sound read one state. No audio node in this file; BalanceDesk.jsx plays it.
//
// Levels are "for the ear": band energies weighted the way the ear weights
// them (a coarse A-weighting), because the exam's "vocals sit on top" is a
// judgement of prominence, not of RMS. A released pop mix has the drums 8 dB
// over the vocal in RMS and the vocal still on top; the 2020 scheme says so
// in one line ("Vocals sit on top of mix and drums are equal or louder").

export const STEM_IDS = ['vocal', 'drums', 'bass', 'bvox', 'synth'];
export const STEMS = {
    vocal: { label: 'Vocal', short: 'Vocal', said: 'the vocal', colour: 'var(--gen-5)', role: 'lead' },
    drums: { label: 'Drums', short: 'Drums', said: 'the drums', colour: 'var(--gen-2)', role: 'drive' },
    bass: { label: 'Bass', short: 'Bass', said: 'the bass', colour: 'var(--gen-1)', role: 'foundation' },
    bvox: { label: 'Backing vocals', short: 'BVs', said: 'the backing vocals', colour: 'var(--gen-4)', role: 'support' },
    synth: { label: 'Synth', short: 'Synth', said: 'the synth', colour: 'var(--gen-3)', role: 'pad' },
};

// Nine bands, 40 Hz to 16 kHz, an octave each: the words the judge uses for
// them, the bandwidth correction that turns a density into an energy, and
// the ear's weighting at each band's centre.
export const BAND_EDGES = [40, 80, 160, 320, 640, 1280, 2560, 5120, 10240, 16000];
export const BAND_WORDS = ['the sub bass', 'the bass', 'the low mids', 'the low mids', 'the mids', 'the upper mids', 'the presence region', 'the highs', 'the air'];
const WIDTH_DB = [16, 19, 22, 25, 28, 31, 34, 37, 37.6];
export const EAR_DB = [-26, -17, -10, -4.5, -1, 1, 1.2, -0.5, -4];
// how much a band counts towards masking: the exam's masking is a mid-range
// fault (vocal, synth, guitar, backing vocals); kick and bass sharing the
// low end is how music works
const MASK_WEIGHT = [0.2, 0.35, 0.7, 1, 1, 1, 0.8, 0.5, 0.25];

export const FADER_MIN = -60;
export const FADER_MAX = 12;
export const FLOOR = FADER_MIN; // a fader at the floor is a part missing

// How far from the released balance a part can sit and still be "balanced",
// in dB, and where the paper's lower bands begin.
export const TOL = { balanced: 3, dominant: 10, buried: -10, vocalUnder: -6, maskExtra: 1.5, pan: 0.3 };

export const SONG_IDS = ['kites'];
export const SONGS = {
    kites: {
        id: 'kites',
        title: 'Paper Kites',
        said: 'Paper Kites',
        style: 'indie pop, female vocal, 100 bpm',
        bpm: 100,
        bars: 4,
        loopSec: 9.6,
        files: {
            vocal: '/bench-audio/balance/kites-vocal.mp3',
            drums: '/bench-audio/balance/kites-drums.mp3',
            bass: '/bench-audio/balance/kites-bass.mp3',
            bvox: '/bench-audio/balance/kites-bvox.mp3',
            synth: '/bench-audio/balance/kites-synth.mp3',
        },
        // measured from the cut, bars 22 to 25 of the generation: RMS of the
        // stem in dBFS, and the nine band densities (relative dB)
        stats: {
            vocal: { rms: -26.8, peak: -8.0, bands: [-24.7, -18.0, 24.2, 19.8, 3.9, 0.8, -10.7, -16.6, -16.2] },
            drums: { rms: -18.5, peak: -4.0, bands: [39.1, 32.1, 26.2, 14.9, 6.1, 5.6, 0.7, -1.3, -7.2] },
            bass: { rms: -20.2, peak: -7.2, bands: [35.5, 33.5, 22.6, 11.1, -4.6, -7.9, -20.5, -49.8, -63.6] },
            bvox: { rms: -34.9, peak: -12.8, bands: [-28.7, -22.5, 11.7, 14.0, 3.0, -6.1, -16.0, -26.8, -23.9] },
            synth: { rms: -40.2, peak: -18.2, bands: [-23.3, 8.4, 3.9, 8.6, -3.5, -20.4, -31.4, -61.4, -62.1] },
        },
        // what the examiner did to the files before you got them, in dB: the
        // 2025 paper's shape (bass mastered loud, vocal quiet), the drums
        // quiet as in 2018, 2020 and 2023, the backing vocals loud as on the
        // 2019 CD, the synth loud as in 2023 and 2025. Hidden until the
        // bench opens the machine.
        supplied: { vocal: -9, drums: -6, bass: 6, bvox: 5, synth: 9 },
        // the reference: the track as released, which the faders reach by
        // undoing the trims. Pans and sends at zero: the release's own image.
        // Mike's mix replaces this when he has made one on the bench.
        reference: {
            label: 'the track as released',
            fader: { vocal: 9, drums: 6, bass: -6, bvox: -5, synth: -9 },
            pan: { vocal: 0, drums: 0, bass: 0, bvox: 0, synth: 0 },
            send: { vocal: 0, drums: 0, bass: 0, bvox: 0, synth: 0 },
        },
        // puts the released mix's loudest part at -6 dB on the desk's scale
        norm: 50.6,
    },
};

const zeros = () => Object.fromEntries(STEM_IDS.map((id) => [id, 0]));

export const DEFAULT_STATE = {
    song: 'kites',
    fader: zeros(),
    pan: zeros(),
    send: zeros(),
    mono: false,
    level: 0.8,
    presetId: 'supplied',
};

// ---- levels --------------------------------------------------------------
const p10 = (db) => 10 ** (db / 10);
const lg = (p) => 10 * Math.log10(Math.max(p, 1e-12));

// A stem's band levels for the ear, at its current fader: density plus
// bandwidth plus the ear's weighting plus the trim plus the fader.
export function bandLevels(song, stem, faderDb) {
    const s = SONGS[song];
    const st = s.stats[stem];
    const off = s.supplied[stem] + faderDb - s.norm;
    return st.bands.map((b, k) => b + WIDTH_DB[k] + EAR_DB[k] + off);
}

// One number for a part: its level for the ear, on the desk's scale (the
// released mix's loudest part sits at -6 dB).
export function stemLevel(song, stem, faderDb) {
    return lg(bandLevels(song, stem, faderDb).reduce((acc, db) => acc + p10(db), 0));
}

// How far a part sits from the released balance, in dB: the fader plus the
// examiner's trim. Zero is the release.
export function delta(state, stem) {
    return state.fader[stem] + SONGS[state.song].supplied[stem];
}

export function levels(state) {
    return Object.fromEntries(STEM_IDS.map((id) => [id, stemLevel(state.song, id, state.fader[id])]));
}

// The parts in order, loudest first, with the vocal's standing.
export function hierarchy(state) {
    const lv = levels(state);
    const order = [...STEM_IDS].sort((a, b) => lv[b] - lv[a]);
    const top = order[0];
    const loudestOther = Math.max(...STEM_IDS.filter((id) => id !== 'vocal' && id !== 'drums').map((id) => lv[id]));
    // "on top" is prominence, not RMS: within 4 dB of the loudest part and
    // above every part but the drums (2020 scheme: "drums are equal or louder")
    const vocalOnTop = state.fader.vocal > FLOOR && lv.vocal >= lv[top] - 4 && lv.vocal > loudestOther;
    return { order, top, levels: lv, vocalOnTop, vocalGap: lv.vocal - lv[top] };
}

// ---- masking -------------------------------------------------------------
// Two pitched parts fight for a band when both are prominent there (within
// 10 dB of the loudest pitched part in that band) and close to each other
// (the score fades out over a 6 dB gap). The kit is left out: it is
// broadband and shares every band with everything, and the paper's masking
// is between pitched parts. Panning a pair apart relieves it.
const PITCHED = STEM_IDS.filter((id) => id !== 'drums');
export function masking(state) {
    const song = state.song;
    const live = PITCHED.filter((id) => state.fader[id] > FLOOR);
    const bl = Object.fromEntries(live.map((id) => [id, bandLevels(song, id, state.fader[id])]));
    const maxIn = BAND_EDGES.slice(0, -1).map((_, k) => (live.length ? Math.max(...live.map((id) => bl[id][k])) : -999));
    // a band counts for a part only where the part actually lives: within
    // 18 dB of its own loudest band
    const own = Object.fromEntries(live.map((id) => [id, Math.max(...bl[id])]));
    const pairs = [];
    for (let i = 0; i < live.length; i += 1) {
        for (let j = i + 1; j < live.length; j += 1) {
            const a = live[i]; const b = live[j];
            const bands = [];
            let raw = 0;
            for (let k = 0; k < maxIn.length; k += 1) {
                const la = bl[a][k]; const lb = bl[b][k];
                if (la < own[a] - 18 || lb < own[b] - 18) continue;
                if (Math.min(la, lb) < maxIn[k] - 10) continue;
                const close = 1 - Math.abs(la - lb) / 6;
                if (close <= 0) continue;
                bands.push(k);
                raw += MASK_WEIGHT[k] * close;
            }
            const apart = Math.abs(state.pan[a] - state.pan[b]);
            const relief = apart >= 0.6 ? 0.4 : apart >= 0.3 ? 0.7 : 1;
            pairs.push({ a, b, bands, raw, score: raw * relief, apart });
        }
    }
    pairs.sort((x, y) => y.score - x.score);
    const total = pairs.reduce((acc, p) => acc + p.score, 0);
    return { pairs, worst: pairs[0] || null, total };
}
// The pair a part is most in a fight with.
export function pairOf(state, stem) {
    return masking(state).pairs.find((p) => p.a === stem || p.b === stem) || null;
}

// The released mix has its own overlap (a vocal and its backing vocals
// share a region by design); the judge only counts what the student added.
export function referenceState(song) {
    const s = SONGS[song];
    return { ...DEFAULT_STATE, song, fader: { ...s.reference.fader }, pan: { ...s.reference.pan }, send: { ...s.reference.send }, presetId: 'reference' };
}
export function maskingExtra(state) {
    return masking(state).total - masking(referenceState(state.song)).total;
}
// Pair by pair, how much more two parts fight than they did on the release;
// the worst is the fight the student added.
export function maskingAdded(state) {
    const now = masking(state).pairs;
    const ref = masking(referenceState(state.song)).pairs;
    const refScore = (a, b) => (ref.find((q) => q.a === a && q.b === b) || { score: 0 }).score;
    const pairs = now.map((q) => ({ ...q, added: q.score - refScore(q.a, q.b) })).sort((x, y) => y.added - x.added);
    return { pairs, worst: pairs[0] && pairs[0].added > 0.3 ? pairs[0] : null };
}

export function bandWords(bands) {
    if (!bands.length) return '';
    const lo = bands[0]; const hi = bands[bands.length - 1];
    const a = BAND_WORDS[lo]; const b = BAND_WORDS[hi];
    return a === b ? a : `${a} up to ${b}`;
}

// ---- the paper's band ----------------------------------------------------
// 2025 A Q5(e): 3, balanced and blended, vocals on top; 2, most parts
// balanced with some masking and a few misjudgements; 1, one track barely
// audible or too dominant; 0, not all tracks present. The desk reports
// the LINE the mix sits on, in the scheme's words, never a mark.
export const BAND_LINES = {
    3: 'Balanced and blended across all parts of the mix. Vocals sit on top of mix.',
    2: 'Most tracks are balanced with some masking. A few misjudgements.',
    1: 'Balanced so that one track is barely audible or is too dominant.',
    0: 'Not all tracks present.',
};
// the same lines, short enough for the bench's one line to the student
export const BAND_SHORT = {
    3: 'balanced and blended, vocals on top',
    2: 'most parts balanced, some masking, a few misjudgements',
    1: 'one track barely audible or too dominant',
    0: 'not all tracks present',
};

export function faults(state) {
    const s = SONGS[state.song];
    const out = [];
    const h = hierarchy(state);
    for (const id of STEM_IDS) {
        if (state.fader[id] <= FLOOR) { out.push({ stem: id, kind: 'missing', by: 0 }); continue; }
        const d = delta(state, id);
        if (d >= TOL.dominant) out.push({ stem: id, kind: 'dominant', by: d });
        else if (d <= TOL.buried) out.push({ stem: id, kind: 'buried', by: d });
        else if (Math.abs(d) > TOL.balanced) out.push({ stem: id, kind: d > 0 ? 'loud' : 'quiet', by: d });
    }
    if (!h.vocalOnTop && state.fader.vocal > FLOOR && !out.some((f) => f.stem === 'vocal' && (f.kind === 'buried' || f.kind === 'missing'))) {
        out.push({ stem: 'vocal', kind: 'under', by: h.vocalGap, over: h.top });
    }
    for (const id of ['vocal', 'bass']) {
        if (Math.abs(state.pan[id]) > TOL.pan) out.push({ stem: id, kind: 'offCentre', by: state.pan[id] });
    }
    const extra = maskingExtra(state);
    const added = maskingAdded(state).worst;
    if (extra > TOL.maskExtra && added) {
        out.push({ stem: added.a, kind: 'masking', with: added.b, bands: added.bands, by: extra });
    }
    if (state.send.vocal >= 0.6) out.push({ stem: 'vocal', kind: 'washed', by: state.send.vocal });
    void s;
    return out;
}

export function band(state) {
    const fs = faults(state);
    if (fs.some((f) => f.kind === 'missing')) return { band: 0, line: BAND_LINES[0], faults: fs };
    if (fs.some((f) => f.kind === 'dominant' || f.kind === 'buried' || (f.kind === 'under' && f.by <= TOL.vocalUnder))) return { band: 1, line: BAND_LINES[1], faults: fs };
    if (fs.length === 0) return { band: 3, line: BAND_LINES[3], faults: fs };
    return { band: 2, line: BAND_LINES[2], faults: fs };
}

// ---- presets: the paper's faults, as states to judge --------------------
const withRef = (song, over) => {
    const r = SONGS[song].reference;
    return { fader: { ...r.fader, ...(over.fader || {}) }, pan: { ...r.pan, ...(over.pan || {}) }, send: { ...r.send, ...(over.send || {}) } };
};
export const PRESETS = [
    { id: 'supplied', name: 'As supplied', blurb: 'The five files as the examiner sends them, faders at unity: the 2025 paper\'s shape. Listen, then balance', values: () => ({ fader: zeros(), pan: zeros(), send: zeros() }) },
    { id: 'drums', name: 'Drums too quiet', blurb: 'Everything balanced but the drums, left as they came: the most repeated deduction in nine years of reports', values: (song) => withRef(song, { fader: { drums: 0 } }) },
    { id: 'cd', name: 'As on the CD', blurb: 'Bass and backing vocals left loud, as they came: the 2019 report\'s fault', values: (song) => withRef(song, { fader: { bass: 0, bvox: 0 } }) },
    { id: 'synth', name: 'Synth over the vocal', blurb: 'The synth left as it came, well over the release, and the vocal a touch under: the 2025 scheme\'s two-mark example', values: (song) => withRef(song, { fader: { synth: 0, vocal: 7 } }) },
    { id: 'buried', name: 'Vocal buried', blurb: 'Everything else balanced, the vocal twelve decibels under where it was released: the one-mark line', values: (song) => withRef(song, { fader: { vocal: -3 } }) },
    { id: 'reference', name: 'The reference', blurb: 'The track as released: what "MS q5.wav" is in the marking', values: (song) => withRef(song, {}) },
];

export function applyPreset(state, id) {
    const p = PRESETS.find((x) => x.id === id);
    if (!p) return state;
    return { ...state, ...p.values(state.song), presetId: id };
}

export function setParam(state, patch) {
    return { ...state, ...patch, presetId: null };
}
export function setFader(state, stem, db) {
    const v = Math.max(FADER_MIN, Math.min(FADER_MAX, Math.round(db * 2) / 2));
    if (state.fader[stem] === v) return state;
    return setParam(state, { fader: { ...state.fader, [stem]: v } });
}
export function setPan(state, stem, pan) {
    const v = Math.max(-1, Math.min(1, Math.round(pan * 100) / 100));
    if (state.pan[stem] === v) return state;
    return setParam(state, { pan: { ...state.pan, [stem]: v } });
}
export function setSend(state, stem, send) {
    const v = Math.max(0, Math.min(1, Math.round(send * 100) / 100));
    if (state.send[stem] === v) return state;
    return setParam(state, { send: { ...state.send, [stem]: v } });
}

// ---- words ---------------------------------------------------------------
export const fmtDb = (raw) => { const db = Math.abs(raw) < 0.05 ? 0 : raw; return `${db > 0 ? '+' : db < 0 ? '−' : ''}${Math.abs(db).toFixed(1).replace(/\.0$/, '')} dB`; };
export const fmtPan = (p) => (Math.abs(p) < 0.03 ? 'C' : `${Math.round(Math.abs(p) * 100)}${p < 0 ? 'L' : 'R'}`);
export const fmtSend = (s) => (s <= 0.005 ? 'dry' : `${Math.round(s * 100)}%`);
export function panWord(p) {
    const a = Math.abs(p);
    if (a < 0.1) return 'in the centre';
    const side = p < 0 ? 'left' : 'right';
    return a < 0.4 ? `a little ${side}` : a < 0.8 ? `${side}` : `hard ${side}`;
}
export function sendWord(s) {
    return s < 0.05 ? 'dry, right at the front' : s < 0.3 ? 'a touch of room' : s < 0.6 ? 'set back in the reverb' : 'washed, far back';
}
export function deltaWord(d) {
    const a = Math.abs(d);
    if (a <= 1) return 'where it was released';
    const dir = d > 0 ? 'over' : 'under';
    return a <= 3 ? `a touch ${dir}` : a <= 6 ? `${dir} by a clear step` : a <= 10 ? `well ${dir}` : d > 0 ? 'dominating' : 'buried';
}
