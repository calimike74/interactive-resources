// The Compression Lab's single source of truth. Every surface in the lab —
// the SVG transfer curve, the live meter dot, the drawing bench's marking —
// reads from these functions, so what the student sees, hears and is scored
// against can never drift apart.
//
// Model: the standard feed-forward gain computer with a quadratic soft knee
// (the same shape Web Audio's DynamicsCompressorNode implements), expressed
// in dB in and dB out. Kept dependency-free and DOM-free so `node --test`
// exercises it directly (tests/compression-engine.test.mjs).

/** Marks available on the drawing bench — mirrors the 0-7 tariff of the
 *  2025 paper's compression-curve differentiation question. The BANDING
 *  below is ours; the tariff is the paper's. */
export const CURVE_QUESTION_MARKS = 7;

/**
 * Static gain computer: input level in, output level out (both dBFS).
 * `makeupDb` shifts the whole curve up after gain reduction; it is applied
 * here for the curve display but deliberately excluded from
 * `gainReductionDb`, because make-up gain does not change how much the
 * compressor is turning the signal down — the distinction the 2023
 * examiner's report says candidates kept fumbling.
 */
export function computeOutputDb(inDb, { thresholdDb, ratio, kneeDb = 0, makeupDb = 0 }) {
    const slope = 1 / ratio;
    const halfKnee = kneeDb / 2;
    let outDb;

    if (kneeDb > 0 && inDb > thresholdDb - halfKnee && inDb < thresholdDb + halfKnee) {
        // Inside the knee: quadratic interpolation between unity and the
        // ratio slope, continuous at both edges.
        const over = inDb - (thresholdDb - halfKnee);
        outDb = inDb + ((slope - 1) * over * over) / (2 * kneeDb);
    } else if (inDb <= thresholdDb) {
        outDb = inDb;
    } else {
        outDb = thresholdDb + (inDb - thresholdDb) * slope;
    }

    return outDb + makeupDb;
}

/** How much the compressor is turning the signal down at this input level,
 *  in dB. Never negative; unaffected by make-up gain (see above). */
export function gainReductionDb(inDb, params) {
    const reduction = inDb - computeOutputDb(inDb, { ...params, makeupDb: 0 });
    return reduction > 0 ? reduction : 0;
}

/** Sampled transfer curve for drawing. Returns [{inDb, outDb}, ...] from
 *  `fromDb` to `toDb` inclusive at `stepDb` spacing. */
export function curvePoints(params, fromDb, toDb, stepDb) {
    const pts = [];
    // Guard float drift so the final point lands exactly on toDb.
    for (let inDb = fromDb; inDb < toDb + stepDb / 2; inDb += stepDb) {
        const clamped = inDb > toDb ? toDb : inDb;
        pts.push({ inDb: clamped, outDb: computeOutputDb(clamped, params) });
    }
    return pts;
}

/**
 * Mark a student's drawn curve against the true curve for `params`.
 *
 * Marking is FEATURE-based, the way curve mark schemes actually award:
 *   - 2 marks: unity (1:1) line below the threshold
 *   - 2 marks: the kink placed at the threshold
 *   - 3 marks: the reduced slope above the threshold matching the ratio
 * A pure-deviation score was tried first and rejected by test: it hands a
 * unity line 3/7 because most of its LENGTH is technically correct, while
 * showing zero understanding of compression. Feature marking also lets the
 * bench say WHICH feature lost the marks.
 *
 * Drawn points may be sparse and unsorted (they come from drag handles);
 * they are sorted and linearly interpolated. Bench prompts keep
 * makeupDb = 0 and ratio >= 2 so the kink is genuinely detectable.
 * Returns { marks, meanAbsDb, breakdown: [{feature, earned, max, comment}] }.
 */
export function scoreDrawnCurve(drawnPoints, params) {
    const { thresholdDb, ratio } = params;
    const sorted = [...drawnPoints].sort((a, b) => a.inDb - b.inDb);

    function drawnAt(inDb) {
        if (inDb <= sorted[0].inDb) return sorted[0].outDb;
        const last = sorted[sorted.length - 1];
        if (inDb >= last.inDb) return last.outDb;
        for (let i = 1; i < sorted.length; i++) {
            if (inDb <= sorted[i].inDb) {
                const a = sorted[i - 1];
                const b = sorted[i];
                const t = (inDb - a.inDb) / (b.inDb - a.inDb || 1);
                return a.outDb + (b.outDb - a.outDb) * t;
            }
        }
        return last.outDb;
    }

    let sum = 0;
    let n = 0;
    for (let inDb = -60; inDb <= 0; inDb += 1) {
        sum += Math.abs(drawnAt(inDb) - computeOutputDb(inDb, params));
        n += 1;
    }
    const meanAbsDb = sum / n;

    // Feature 1 (2 marks): unity below the threshold. Judged well clear of
    // the knee so a soft-knee prompt doesn't punish the region unfairly.
    const belowTop = thresholdDb - (params.kneeDb || 0) / 2 - 2;
    let belowSum = 0;
    let belowN = 0;
    for (let inDb = -60; inDb <= belowTop; inDb += 1) {
        belowSum += Math.abs(drawnAt(inDb) - inDb);
        belowN += 1;
    }
    const belowDev = belowN ? belowSum / belowN : 99;
    const belowMarks = belowDev <= 1 ? 2 : belowDev <= 3 ? 1 : 0;

    // Feature 2 (2 marks): the kink sits at the threshold. Estimated as the
    // first input level where the drawing departs from unity by > 0.75 dB —
    // that estimate lags the true kink slightly (the curve has to travel
    // before it clears the epsilon), hence the 2.5 dB full-mark tolerance.
    let kinkEst = null;
    for (let inDb = -59; inDb <= 0; inDb += 1) {
        if (Math.abs(drawnAt(inDb) - inDb) > 0.75) {
            kinkEst = inDb;
            break;
        }
    }
    const kinkOff = kinkEst === null ? 99 : Math.abs(kinkEst - thresholdDb);
    const kinkMarks = kinkOff <= 2.5 ? 2 : kinkOff <= 5.5 ? 1 : 0;

    // Feature 3 (3 marks): slope above the threshold matches 1/ratio.
    // Least-squares fit over the region clearly above the knee.
    const aboveFrom = thresholdDb + (params.kneeDb || 0) / 2 + 2;
    let sx = 0;
    let sy = 0;
    let sxx = 0;
    let sxy = 0;
    let m = 0;
    for (let inDb = aboveFrom; inDb <= 0; inDb += 1) {
        const y = drawnAt(inDb);
        sx += inDb;
        sy += y;
        sxx += inDb * inDb;
        sxy += inDb * y;
        m += 1;
    }
    const fitted = m >= 2 ? (m * sxy - sx * sy) / (m * sxx - sx * sx) : 99;
    const slopeOff = Math.abs(fitted - 1 / ratio);
    const slopeMarks = slopeOff <= 0.05 ? 3 : slopeOff <= 0.12 ? 2 : slopeOff <= 0.25 ? 1 : 0;

    const breakdown = [
        {
            feature: 'Unity below the threshold',
            earned: belowMarks,
            max: 2,
            comment:
                belowMarks === 2
                    ? 'Below the threshold your line follows input = output — exactly right.'
                    : 'Below the threshold a compressor does nothing: the line should follow input = output at 45°.',
        },
        {
            feature: 'Kink at the threshold',
            earned: kinkMarks,
            max: 2,
            comment:
                kinkMarks === 2
                    ? 'Your curve changes direction at the threshold — the defining landmark.'
                    : kinkEst === null
                      ? 'Your line never bends. The visible change of slope AT the threshold is what examiners look for first.'
                      : `Your bend sits about ${Math.round(kinkOff)} dB from the stated threshold — place the kink exactly on it.`,
        },
        {
            feature: 'Slope set by the ratio',
            earned: slopeMarks,
            max: 3,
            comment:
                slopeMarks === 3
                    ? `Above the threshold your slope matches ${ratio}:1 — every ${ratio} dB in becomes 1 dB out.`
                    : `At ${ratio}:1, every ${ratio} dB over the threshold should come out as just 1 dB — your line ${
                          fitted > 1 / ratio ? 'rises too steeply' : 'is too flat'
                      } up there.`,
        },
    ];

    const marks = belowMarks + kinkMarks + slopeMarks;
    return { marks, meanAbsDb, breakdown };
}
