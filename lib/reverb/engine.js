// The Reverb Lab's single source of truth. The decay-envelope plot, the
// generated impulse responses and the ear-bench marking all read from these
// functions, so what the student sees, hears and is scored against can
// never drift apart. Dependency-free and DOM-free for `node --test`
// (tests/reverb-engine.test.mjs).
//
// Model: a reverb tail as exponential decay, linear in dB — the RT60
// convention: the time for the tail to fall by 60 dB. Pre-delay is a clean
// gap before the tail begins; a gate truncates the tail after a hold time.

/** Marks per ear-bench round — decay 2 + pre-delay 2 + amount 2. Weight
 *  echoes the 2020 paper's 6-mark gated-reverb task; the banding is ours. */
export const MATCH_ROUND_MARKS = 6;

/** Level of the tail, in dB relative to its start, `tS` seconds into the
 *  decay. Linear in dB is exactly what "RT60" promises: −60 dB at rt60S. */
export function decayDbAt(tS, rt60S) {
    // `|| 0` normalises the -0 that (-60 * 0) produces.
    return ((-60 * tS) / rt60S) || 0;
}

/**
 * Amplitude envelope (0..1) of the impulse response at time `tS`:
 * silence until the pre-delay, then exponential decay; a gate cuts the
 * tail dead once `gateHoldS` has elapsed after the tail begins.
 */
export function irEnvelope(tS, { rt60S, preDelayS = 0, gated = false, gateHoldS = 0.25 }) {
    if (tS < preDelayS) return 0;
    const into = tS - preDelayS;
    if (gated && into > gateHoldS) return 0;
    return Math.pow(10, decayDbAt(into, rt60S) / 20);
}

/** Sampled envelope for plotting: [{tS, level}, ...] inclusive of both ends. */
export function envelopePoints(params, fromS, toS, stepS) {
    const pts = [];
    for (let tS = fromS; tS < toS + stepS / 2; tS += stepS) {
        const clamped = tS > toS ? toS : tS;
        pts.push({ tS: clamped, level: irEnvelope(clamped, params) });
    }
    return pts;
}

/** Equal-power wet/dry crossfade: mix 0 = fully dry, 1 = fully wet, with
 *  constant perceived loudness across the sweep (wet² + dry² = 1). */
export function wetDryLevels(mix) {
    const m = Math.max(0, Math.min(1, mix));
    return { wet: Math.sin((m * Math.PI) / 2), dry: Math.cos((m * Math.PI) / 2) };
}

/**
 * Mark an ear-bench guess against the round's hidden target. Each
 * parameter is judged independently so feedback can name WHICH dimension
 * of the space was misheard:
 *   - decay: by RATIO (0.4s vs 0.5s is the same miss as 4s vs 5s —
 *     perception of decay is proportional, not absolute)
 *   - pre-delay: by absolute milliseconds
 *   - amount (wet/dry): by absolute mix distance
 * Returns { marks, breakdown: [{feature, earned, max, comment}] }.
 */
export function scoreMatch(guess, target) {
    const ratio = Math.max(guess.rt60S / target.rt60S, target.rt60S / guess.rt60S);
    const decayMarks = ratio <= 1.3 ? 2 : ratio <= 1.8 ? 1 : 0;

    const pdOff = Math.abs(guess.preDelayMs - target.preDelayMs);
    const pdMarks = pdOff <= 15 ? 2 : pdOff <= 35 ? 1 : 0;

    const mixOff = Math.abs(guess.mix - target.mix);
    const mixMarks = mixOff <= 0.12 ? 2 : mixOff <= 0.25 ? 1 : 0;

    const breakdown = [
        {
            feature: 'Decay time',
            earned: decayMarks,
            max: 2,
            comment:
                decayMarks === 2
                    ? 'Your tail length matches the space.'
                    : guess.rt60S > target.rt60S
                      ? 'Your decay rings on longer than the reference — listen to where the tail disappears into silence.'
                      : 'Your decay dies away sooner than the reference — the space is bigger than you set.',
        },
        {
            feature: 'Pre-delay',
            earned: pdMarks,
            max: 2,
            comment:
                pdMarks === 2
                    ? 'You heard the gap between the dry sound and the start of the tail.'
                    : 'Listen for the moment the tail STARTS, separately from the hit itself — that gap is the pre-delay.',
        },
        {
            feature: 'Amount (wet/dry)',
            earned: mixMarks,
            max: 2,
            comment:
                mixMarks === 2
                    ? 'The balance of room to source matches.'
                    : guess.mix > target.mix
                      ? 'Your version sits further back in the room than the reference — too wet.'
                      : 'Your version is drier and closer than the reference.',
        },
    ];

    return { marks: decayMarks + pdMarks + mixMarks, breakdown };
}
