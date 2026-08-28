// The Edit bench's three levels, as three jobs (the pattern set on the Delay
// bench, 27 Aug 2026):
//
//   Core       the bench SHOWS: names what you hear and says what to try.
//   A-level    the bench JUDGES: the control you touched, the way the paper
//              does: setting, effect on this take, verdict, change, each
//              part tagged with the half of the mark it earns.
//   Extension  the bench OPENS THE MACHINE: what a step in a waveform is,
//              why powers add through a crossfade, where a tail really ends.
//
// Every examiner's sentence quoted here is from the 9MT0 mark schemes and
// Principal Examiner reports as held in the vault's per-question files
// (1.6 Audio Editing/05 - Assessment Tools/Past Paper Questions): 2018 AS
// Q3(a), 2019 AS Q3(c), 2022 A Q2(b), 2024 A Q2(e), 2025 A Q1(c). Pure
// functions over the model's numbers; EditBench renders them.

import { TAKES, SHAPES, isSplice, fmtMs, fmtSec, fmtDb, lengthWord } from './edit-model.js';

export const DEPTH_LINES = {
    core: 'the bench names what you are hearing and tells you what to try, one control at a time. The stage is the join, zoomed until the cycles show: gold is the take up to the cut, blue is what follows it, and a jump between them is the click.',
    alevel: "the bench now judges the control you touch the way the paper does: setting, effect on this take, verdict, change, with the half of the mark each part earns. The paper's drawing opens under the join: the fade out and the fade in as gain, the crossfade bracketed. Drag inside it to read both gains off.",
    extension: 'the bench opens the machine: the level through the crossfade as the two powers add, the dip a linear fade makes, the zero crossings marked on the wave, and why a click sounds the same on every sound.',
};

export const DEPTH_TEACH = {
    alevel: 'Write it in that order in the exam. Naming the fault and its cause is AO3; what it does to this take, whether the edit is clean, and what you would change are AO4, and the practical marks are all AO4.',
    extension: 'None of this is asked on the paper. It is why the A-level answers are true, and where an editor\'s eye starts.',
};

const seg = (ao, text) => ({ ao, text });
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const pct = (v) => `${Math.round(v)}%`;
const sec2 = (s) => `${s.toFixed(2)} s`;

// What the edit is, in the words the answer needs.
export function facts(state, stats) {
    const splice = isSplice(state.take);
    return {
        take: state.take,
        splice,
        said: TAKES[state.take].said,
        cut: state.cut,
        gap: state.gap,
        snap: state.snap,
        shape: state.shape,
        shapeName: SHAPES[state.shape].name,
        length: state.length,
        step: stats ? stats.step : 0,
        stepPct: stats ? stats.stepPct : 0,
        atZero: stats ? stats.atZero : false,
        faded: state.length > 0,
        dip: stats ? stats.dipDb : 0,
        removed: stats ? stats.removedSec : 0,
        tailLost: stats ? stats.tailLostSec : 0,
        tailEnd: stats ? stats.tailEndSec : 0,
        samples: stats ? stats.lengthSamples : 0,
        outSec: stats ? stats.outSec : state.cut / 1000,
    };
}

// ---- Core: the hearing line and the next move -----------------------------
export function hearingLine(state, stats) {
    const f = facts(state, stats);
    if (!f.splice) {
        if (f.faded) return `You are hearing the cymbal cut at ${fmtSec(f.outSec)} with a ${fmtMs(f.length)} ${f.shapeName} fade out, so the tail is shaped to silence rather than chopped.`;
        return `You are hearing the cymbal cut dead at ${fmtSec(f.outSec)}. It was still ringing ${sec2(f.tailLost)} past that point; hold dry and the tail comes back.`;
    }
    if (f.faded) return `You are hearing the vocal with ${sec2(f.removed)} removed at ${fmtSec(f.outSec)}, joined by a ${fmtMs(f.length)} ${f.shapeName} crossfade.${f.length > 80 ? ` Two unrelated parts overlap for ${fmtMs(f.length)}; listen to the level through the middle.` : ' The join is silent.'}`;
    if (f.atZero) return `You are hearing the vocal with ${sec2(f.removed)} removed at ${fmtSec(f.outSec)}, both sides meeting at zero. No jump, so no click, even with no fade.`;
    return `You are hearing the vocal with ${sec2(f.removed)} removed at ${fmtSec(f.outSec)}. The two sides meet ${pct(f.stepPct)} of full scale apart, and that jump is the click on every pass.`;
}

export function nextMove(state, stats) {
    const f = facts(state, stats);
    if (!f.splice) {
        if (!f.faded) return 'hold dry to hear how long the cymbal really rings, then turn Length up until the fade reaches the silence';
        if (f.length < 200) return 'hold dry against the fade: the tail is still there under the fade, shaped rather than cut';
        return 'switch to the vocal and press The click to hear the other fault an edit makes';
    }
    if (!f.faded && !f.atZero) return f.snap ? 'nudge the cut a few milliseconds and hear the click come and go with the jump' : 'switch Snap to Zero crossing and hear the click vanish without any fade';
    if (!f.faded && f.atZero) return 'turn Snap off and drag the cut a few milliseconds: watch the jump appear at the line';
    if (f.length <= 15) return 'turn Length up past 300 ms with Linear chosen and listen for the level dropping in the middle of the crossfade';
    if (f.shape === 'linear') return 'switch the shape to Equal power and hear the dip in the middle go';
    return 'press The tail: the other edit that goes wrong, a cymbal cut where it only looks finished';
}

// ---- AO3: the setting, named and defined ----------------------------------
function nameCut(f) {
    if (!f.splice) return `Cut at ${fmtSec(f.outSec)}: the region ends there and silence follows. The cymbal is still sounding for ${sec2(f.tailLost)} after it.`;
    return `Cut at ${fmtSec(f.outSec)}, with ${sec2(f.removed)} removed after it: region A ends at the cut and region B starts ${sec2(f.removed)} later in the take. The two sides meet ${pct(f.stepPct)} of full scale apart${f.atZero ? ', which is to say at zero' : ''}.`;
}
function nameSnap(f) {
    return f.snap
        ? 'Snap to zero crossing on: the cut lands where the waveform comes up through the centre line, on both sides of the join, so the two regions meet at the same value.'
        : 'Snap off: the cut lands wherever it is put, so the two sides of the join meet at whatever value the waveform had there.';
}
function nameShape(f) {
    return `${cap(f.shapeName)} fade: ${SHAPES[f.shape].does}.`;
}
function nameLength(f) {
    if (f.length === 0) return 'Length 0: a hard cut. Region A stops and region B starts on the same sample, with no fade on either.';
    if (!f.splice) return `Fade out ${fmtMs(f.length)}, ${f.shapeName}: the gain falls to zero across the last ${fmtMs(f.length)} of the region, ending at the cut.`;
    return `Crossfade ${fmtMs(f.length)}, ${f.shapeName}: region A fades down while region B fades up, across ${fmtMs(f.length)} centred on the cut.`;
}
function nameTake(f) {
    return f.splice
        ? 'A splice on a sung phrase: a held note shortened by removing a section and joining what is left.'
        : 'A trim on a cymbal: one region, ended where the waveform looks finished.';
}

// ---- AO4: the verdict ---------------------------------------------------------
function judgeCut(f) {
    if (!f.splice) {
        if (f.faded && f.tailLost < 0.1) return seg(4, 'The fade reaches the silence: nothing audible is lost and nothing is chopped. Clean.');
        if (f.faded) return seg(4, `The fade ends while the cymbal is still ringing: ${sec2(f.tailLost)} of tail is faded away rather than cut, so there is no click, but the decay is shorter than the player made it. Say so if you meant it.`);
        if (f.tailLost > 0.3) return seg(4, `A hard cut through a ringing tail: the decay stops dead ${sec2(f.tailLost)} early, and the jump to silence at the cut is a click. The 2024 examiner's named error, "not fading/removing the glitch at the end". Fade it, or cut where the take is silent, not where it looks silent.`);
        return seg(4, 'The cut sits close to where the cymbal is actually silent, so little is lost. A short fade out would still take the last step to zero out.');
    }
    if (f.faded) return seg(4, `With a fade over it the jump does not play as a step, so where the cut sits is now a musical question: is the note the right length, and does region B come in on the beat? The click is not the issue.`);
    if (f.atZero) return seg(4, 'Both sides meet at zero: no step, no click, without a fade. That is the zero point the 2019 mark scheme names as what a fade creates; here the cut found one instead.');
    if (f.stepPct >= 20) return seg(4, `A ${pct(f.stepPct)} jump on a held note is a pop on every pass. The 2019 mark scheme's cause: "discontinuity/not zero point in audio signal at start or end of segment". Snap it to a zero crossing, or fade it: 5 to 15 ms is enough.`);
    return seg(4, `A small jump, ${pct(f.stepPct)} of full scale: a tick rather than a pop, and still a mark lost. The 2024 report: candidates "usually failed to create smooth edit points, therefore resulting in unprofessional clicks". Snap it or fade it.`);
}
function judgeSnap(f) {
    if (!f.splice) return seg(4, f.snap ? 'On a trim the snap puts the last sample at zero, so the jump to silence goes. The tail is still cut short; only a fade or a later cut fixes that.' : 'Off, the region ends on whatever value the cymbal had: a jump to silence, a click. Snap it or fade it.');
    if (f.snap) return seg(4, f.faded ? 'Snap and a fade together: belt and braces. Either alone would do at this length.' : 'Snapped, the two regions meet at the same value and the click is gone with no fade at all. The right first move on any cut; where no zero crossing sits where you need it, the fade does the same job.');
    return seg(4, f.atZero ? 'Off, and the cut still happens to sit at a zero crossing: clean by luck. Turn the snap on and it is clean by design.' : `Off, the join jumps ${pct(f.stepPct)}: the click. The 2018 report on a tight vocal edit: "expand the screen and use short fades to get a clean and complete edit". Snapping is the same idea by another route.`);
}
function judgeShape(f) {
    if (f.length === 0) return seg(4, 'With no fade the shape does nothing. Turn Length up and it decides the level through the join.');
    if (!f.splice) return seg(4, f.shape === 'linear' ? 'A linear fade out sounds abrupt at the start and lingers at the end: the ear hears level in dB, not in equal steps. For a musical fade choose the S-curve; the 2025 mark scheme wants the final fade "smooth".' : `${cap(f.shapeName)} on a fade out: the shape follows the ear, so the decay sounds like a decay. Right.`);
    if (f.length <= 15) return seg(4, 'At repair length the shape is inaudible: any of the three removes the click. Choose equal power and move on.');
    if (f.shape === 'power') return seg(4, `Equal power over ${fmtMs(f.length)}: the level holds through the middle of the crossfade because the two powers add up to one. Right for two unrelated parts, which is what an edit usually joins.`);
    if (f.shape === 'linear') return seg(4, `Linear over ${fmtMs(f.length)}: the level dips by 3 dB in the middle, because half of each amplitude is a quarter of each power. Audible at this length as the join going quiet. Choose equal power.`);
    return seg(4, `S-curve over ${fmtMs(f.length)}: it lingers at the ends and hurries in the middle, so the dip is as deep as linear but narrower. A fade-out shape wearing a crossfade's job; equal power is the crossfade shape.`);
}
function judgeLength(f) {
    if (f.length === 0) {
        if (!f.splice) return seg(4, f.tailLost > 0.3 ? 'A hard cut through the tail: the decay stops dead and the last sample jumps to silence. The end of a file needs a fade as much as any join.' : 'A hard cut near the silence: little lost, but the last step to zero is still a step.');
        return seg(4, f.atZero ? 'A hard cut that lands at zero on both sides is clean. It is also fragile: move it a millimetre and the click is back. A fade makes it clean wherever it lands.' : `A hard cut with a ${pct(f.stepPct)} jump: the click. The 2024 report, on copying phrases into place: candidates "usually failed to create smooth edit points... yielding 2 marks, the most common score".`);
    }
    if (!f.splice) {
        if (f.tailLost < 0.1) return seg(4, `${fmtMs(f.length)} takes the region to silence inside the fade: the tail is heard to its end and the file ends on zero. Clean.`);
        return seg(4, `${fmtMs(f.length)} takes the level down before the cymbal has finished: no click, but the decay is shortened by ${sec2(f.tailLost)}. Lengthen the fade, or move the cut later.`);
    }
    if (f.length <= 15) return seg(4, `${fmtMs(f.length)}: long enough to take the step out and short enough to hear nothing else. This is the repair the 2018 report asked for, "short fades to get a clean and complete edit", and the smooth edit point the 2024 report found missing.`);
    if (f.length <= 80) return seg(4, `${fmtMs(f.length)}: still a repair on a held note, but on a hit this long a crossfade would smear the front. Shorten it unless the join needs blending.`);
    if (f.length <= 250) return seg(4, `${fmtMs(f.length)}: two regions overlapping for that long is a transition you can hear, not a repair. Right for the 2019 scheme's case, sustaining sounds like a cymbal crash or a strummed chord that cannot butt-join; wrong for a straight cut in a phrase.`);
    return seg(4, `${fmtMs(f.length)}: a musical crossfade, the two parts overlapping for the best part of half a second. If that is the effect you want, say so; as a repair it is far too long, and the level through it is now the shape's business.`);
}
function judgeTake(f) {
    return f.splice
        ? seg(4, 'A sung note has cycles the eye can see and a level that carries: any jump at the cut is a click, and the fix is the zero crossing or a short crossfade.')
        : seg(4, 'A cymbal has no clean end: it decays for a second after it looks finished. The cut that looks right in the waveform throws the tail away; the fix is a fade that reaches the silence.');
}

// The bench's A-level line: the control you touched, judged.
export function judge({ state, last, stats }) {
    const f = facts(state, stats);
    switch (last) {
        case 'snap': return [seg(3, nameSnap(f)), judgeSnap(f)];
        case 'shape': return [seg(3, nameShape(f)), judgeShape(f)];
        case 'length': return [seg(3, nameLength(f)), judgeLength(f)];
        case 'take': return [seg(3, nameTake(f)), judgeTake(f)];
        case 'gap': return [seg(3, nameCut(f)), judgeCut(f)];
        case 'preset': {
            if (state.presetId === 'p2022') return [seg(3, `The 2022 paper's fault, drawn: ${nameCut(f)}`), seg(4, 'The mark scheme: "cuts waveform mid-cycle / cuts waveform when it\'s not at 0 displacement", and it credits a diagram showing exactly this. Theirs came from a release of 0 ms; the waveform does not care what made the cut.')];
            if (state.presetId === 'p2024') return [seg(3, nameLength(f)), seg(4, 'The smooth edit point the 2024 report wanted at every join, and the one most candidates left out: "yielding 2 marks, the most common score". This is what two of the four marks cost.')];
            if (state.presetId === 'tail') return [seg(3, nameCut(f)), judgeCut(f)];
            return [seg(3, `${nameCut(f)} ${nameLength(f)}`), f.faded ? judgeLength(f) : judgeCut(f)];
        }
        case 'cut':
        default: return [seg(3, nameCut(f)), judgeCut(f)];
    }
}

// ---- Extension: the machine opened ---------------------------------------
export function open({ state, last, stats }) {
    const f = facts(state, stats);
    switch (last) {
        case 'snap':
        case 'cut':
        case 'gap':
        case 'preset':
            if (!f.splice) return `Where the cymbal looks finished it is about 26 dB down, and it keeps decaying for another ${sec2(f.tailLost)} that the ear still follows; linear amplitude hides the bottom 60 dB of a tail. A dB view shows it, and so does holding dry. Cut where the take is silent, or fade to there.`;
            if (f.atZero) return 'Both sides meet at zero and both are rising, which is what this snap looks for: not just the same value but the same direction, so the corner goes as well as the step. A crossing where one side rises and the other falls still bends the wave, a smaller click.';
            return `A step of ${pct(f.stepPct)} at the join is not one frequency; it is every frequency at once, which is why a click sounds the same on a bass note and a cymbal and why no EQ removes it. The 2019 scheme's word for it, discontinuity, is exact: ${f.samples ? '' : 'the wave has no value between the two sides. '}Snapping puts the two sides at the same value; a fade takes both through zero.`;
        case 'take':
            return f.splice
                ? `Sung notes are periodic: at ${fmtSec(f.outSec)} the wave repeats every few milliseconds, so a zero crossing is never more than half a cycle away and the snap costs nothing you can hear.`
                : 'A cymbal is noise with a decay: no period, so there is no cycle to snap to and the zero crossings are wherever they fall. The fade is the only clean end it has.';
        case 'shape':
        case 'length':
        default: {
            if (f.length === 0) return 'A hard cut is a fade of zero samples: the gain goes from one to zero between two samples, 23 microseconds apart at 44.1 kHz. Everything a fade does is spreading that step over time until it is below what the ear resolves.';
            const samples = `${f.samples} samples at 44.1 kHz`;
            if (!f.splice) return `The fade out runs ${fmtMs(f.length)}, ${samples}. Linear is straight in amplitude and so curved in dB: it falls 6 dB in the first half and the rest in the second, all the way down to nothing, which the ear hears as the end arriving late then all at once. The S-curve spends its time at the two ends, where the ear is listening.`;
            if (f.shape === 'power') return `Equal power: gain out is the cosine and gain in the sine of the same angle, so the squares sum to one at every point and two unrelated sounds hold their level through the join (${samples}). Two copies of the same sound add in amplitude instead, and the same pair peaks 3 dB up in the middle; that is why a DAW also offers equal gain.`;
            if (f.shape === 'linear') return `Linear: at the middle both gains are a half, so each contributes a quarter of its power and the sum is a half, 3 dB down (${samples}). On two copies of the same sound the amplitudes add and it is flat; on the two different parts an edit joins, it dips.`;
            return `The S-curve is a raised cosine: its gains still sum to one in amplitude, so on unrelated sounds the power dips 3 dB at the middle just as linear does, only later and quicker (${samples}). It is a fade-out shape; the crossfade shape that holds power is the sine and cosine pair.`;
        }
    }
}
