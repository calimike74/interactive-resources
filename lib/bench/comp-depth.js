// The Dynamics bench's three levels, as three jobs (the pattern set on the
// Delay bench, 27 Aug 2026):
//
//   Core       the bench SHOWS: names what you hear and says what to try.
//   A-level    the bench JUDGES: the control you touched, the way the
//              paper does: setting, effect on this part, verdict, change,
//              each part tagged with the half of the mark it earns.
//   Extension  the bench OPENS THE MACHINE: the gain computer, the time
//              constants, why the numbers are the numbers. Not on the paper.
//
// Every examiner's sentence quoted here is from the 9MT0/04 Principal
// Examiner reports as held in the vault's per-question files (1.9 Dynamic
// Processing/05 - Assessment Tools/Past Paper Questions) and the C4
// examiner-report digest in Exemplar-Work. Pure functions over the model's
// numbers and the loop's stats; DynamicsBench renders them.

import { MODES, isDownward, hasRatio, hasKnee, ratioOf, ratioLabel, fmtDb, fmtMs, attackWord, releaseWord, GATE_RANGE, EXPANDER_RANGE } from './comp-model.js';

export const DEPTH_LINES = {
    core: 'the bench names what you are hearing and tells you what to try, one control at a time.',
    alevel: 'the bench now judges the control you touch the way the paper does: setting, effect on this part, verdict, change, with the half of the mark each part earns. Move a dial or drag the threshold line.',
    extension: 'the bench opens the machine: what the gain computer does to the signal and why the numbers are the numbers. Move a dial or drag the threshold line.',
};

export const DEPTH_TEACH = {
    alevel: 'Write it in that order in the exam. Defining the parameter and giving its setting is AO3; what it does to this part, whether it suits, and what you would change are AO4, and 15 of the 20 marks are AO4.',
    extension: "None of this is asked on the paper. It is why the A-level answers are true, and where a producer's ear starts.",
};

const seg = (ao, text) => ({ ao, text });
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const pct = (v) => `${Math.round(v)}%`;
const gr = (stats) => (stats ? stats.maxGr : 0);

// What the processor is set to, in the words the answer needs.
export function facts(state, stats = null) {
    const def = MODES[state.mode];
    return {
        mode: state.mode,
        def,
        on: state.on,
        down: isDownward(state.mode),
        T: state.threshold,
        R: ratioOf(state),
        ratio: ratioLabel(state),
        knee: hasKnee(state.mode) ? state.knee : 0,
        attack: state.attack,
        release: state.release,
        makeup: state.makeup,
        gr: gr(stats),
        over: stats ? stats.overPct : 0,
        stats,
    };
}

// ---- AO3: the setting, defined and named ---------------------------------
function nameThreshold(f, part) {
    const side = f.down ? 'below' : 'above';
    const work = f.down ? `${f.def.name === 'gate' ? 'shuts' : 'turns the level down'}` : 'starts to turn the level down';
    return `Threshold ${fmtDb(f.T)}: the level ${side} which the ${f.def.name} ${work}. On ${part} that is ${pct(f.over)} of the loop${f.down ? '' : `, up to ${fmtDb(-f.gr).replace('−', '')} of gain reduction`}.`;
}
function nameRatio(f) {
    if (f.mode === 'limiter') return 'Ratio ∞:1: a limiter. However far the input goes over the threshold, the output does not go over it at all.';
    if (f.mode === 'gate') return `Range ${GATE_RANGE} dB: a gate has no ratio. Under the threshold it shuts, ${GATE_RANGE} dB down here, which is silence.`;
    if (f.mode === 'expander') return `Ratio ${f.ratio}: for every 1 dB the input falls under the threshold, the output falls by ${f.R.toFixed(1).replace(/\.0$/, '')}, down to ${EXPANDER_RANGE} dB below.`;
    return `Ratio ${f.ratio}: for every ${f.R.toFixed(1).replace(/\.0$/, '')} dB the input goes over the threshold, the output goes over it by 1.`;
}
function nameAttack(f) {
    return `Attack ${fmtMs(f.attack)}, ${attackWord(f.attack)}: how long the ${f.def.name} takes to ${f.down ? 'open' : 'turn the level down'} once the signal crosses the threshold.`;
}
function nameRelease(f) {
    return `Release ${fmtMs(f.release)}, ${releaseWord(f.release)}: how long it takes to ${f.down ? 'close again' : 'let the level back up'} once the signal falls back.`;
}
function nameKnee(f) {
    if (!hasKnee(f.mode)) return `${cap(f.def.name)}: no knee. The ${f.def.name} is hard by nature: the corner is at the threshold exactly.`;
    return f.knee === 0
        ? 'Knee 0 dB, hard: the ratio takes over at the threshold exactly, a sharp corner on the curve.'
        : `Knee ${f.knee} dB, soft: the ratio comes in gradually across ${f.knee} dB centred on the threshold, a rounded corner.`;
}
function nameMakeup(f) {
    return `Make-up gain ${fmtDb(f.makeup)}: added after the ${f.def.name}, so the level it took away comes back. It changes the output, not the gain reduction.`;
}
function nameMode(f) {
    return `${cap(f.def.name)}: ${f.def.does}. ${f.down ? 'It works under the threshold.' : 'It works over the threshold.'}`;
}

// ---- AO4: the verdict, source-aware --------------------------------------
function judgeThreshold(f, source, part) {
    const g = f.gr;
    if (f.mode === 'gate') {
        if (source === 'drums' || source === 'electronic') {
            if (f.T >= -7) return seg(4, 'Above the snare: the gate stays shut through most of the bar and only the hardest kicks open it. The 2019 fault, the threshold too high: the part itself is cut, not just what you wanted gone.');
            if (f.T >= -13) return seg(4, 'Between the hats and the kick and snare: the hats are gone, the kit is tight, and every hit still opens it. This is what the reports call setting the threshold musically.');
            return seg(4, 'Below the hats: everything opens the gate, so it does nothing. The 2019 fault the other way, the threshold too low; bring it up until the hats stop opening it.');
        }
        if (source === 'vocal') {
            if (f.T >= -10) return seg(4, 'Only the loudest words open it: whole syllables are cut. Too high for a vocal; the 2020 report notes only the best candidates heard what a gate did to the breaths, and here it is doing worse than that.');
            if (f.T >= -25) return seg(4, 'The breaths and the ends of words are shut off, the singing stays. Right for cleaning up between phrases; listen to the ends of the words for the clipped tails.');
            return seg(4, 'Below the breaths: nothing is gated. A gate that never closes is not doing the job it is in for.');
        }
        return f.T >= -20
            ? seg(4, 'The tails of the stabs are cut short: right as a rhythmic effect, and the reason a gate has a release control.')
            : seg(4, 'Below the tails: the gate stays open and changes nothing.');
    }
    if (f.mode === 'expander') return seg(4, g < 3 ? 'The quiet parts are turned down a little: a gentle clean-up, the gate\'s soft cousin. Not on the paper by name, but expansion is on the spec\'s list.' : 'The quiet parts drop hard: this is close to a gate. Say why you chose the gentler tool if you are keeping it.');
    if (f.mode === 'limiter') {
        if (g < 1) return seg(4, 'Nothing reaches the threshold, so the limiter does nothing. Bring it down until the loudest hits just touch it: that is where a limiter lives.');
        if (g <= 6) return seg(4, 'The peaks are caught and nothing else is touched: overload protection, the limiter\'s job. Right.');
        return seg(4, 'The whole part is being held down, not just its peaks: that is heavy compression wearing a limiter\'s name. Raise the threshold, or use a compressor and say why.');
    }
    // compressor
    if (source === 'vocal') {
        if (g < 2) return seg(4, 'Barely working: the loud words are still loud and the quiet ones still quiet. The practical papers give no marks where there is no clearly audible change; bring the threshold down.');
        if (g <= 6) return seg(4, 'Right for a vocal: the loud words come down, the quiet ones come up once you make the level up, and it still sounds like singing. This is the evenness the practical papers mark.');
        if (g <= 12) return seg(4, 'Heavy: the peaks are flattened and the breaths and noise come up with the quiet words. The 2022 paper\'s own list of disadvantages, and a fair trade only if you say it is one.');
        return seg(4, 'The report\'s phrase for the 2023 paper: a heavily compressed vocal. Squashed and unnatural; raise the threshold until the gain reduction sits under about 6 dB.');
    }
    if (source === 'drums' || source === 'electronic') {
        if (g < 2) return seg(4, 'The kit goes through untouched. Fine as a bypass; not a setting to defend.');
        if (g <= 8) return seg(4, 'Right: the kick and snare are held and the hats and room come up in the gaps between them. The kit sits at one level.');
        return seg(4, 'The hits are flattened and the kit pumps: right only as an effect you can name, wrong as control. Raise the threshold.');
    }
    if (g < 2) return seg(4, 'The stabs pass untouched.');
    if (g <= 8) return seg(4, 'The front of each stab is held and its tail comes up behind it: the sustain the 2022 paper asked about, which most candidates put down to reverb.');
    return seg(4, 'The stab is crushed flat: no attack left to hear. Raise the threshold, or slow the attack so the front gets through.');
}

function judgeRatio(f, source, part) {
    if (f.mode === 'limiter') return seg(4, 'Infinity is the limiter\'s ratio: on the transfer curve it is an almost flat line from the threshold. The 2023 AS paper asked for that line beside a 1:1 line and then asked which was limiting; very few could say. You can: the flat one.');
    if (f.mode === 'gate') return seg(4, 'A gate has no ratio to judge: under the threshold it is shut. The 2019 report: many confused a gate with limiting, compressing or filtering. It cuts level, not frequencies, and only under the threshold.');
    if (f.mode === 'expander') return seg(4, f.R <= 2 ? 'Gentle expansion: the quiet parts drop a little and nothing is switched off. Right when a gate would be too blunt.' : 'Steep expansion: nearly a gate. If you want the quiet parts gone, say gate; if you want them lower, say expander and give the ratio.');
    if (f.R < 2) return seg(4, 'Under 2:1: a tilt, not a squash. Right for gluing a mix or a light touch on a bus; on one part it is hard to hear working.');
    if (f.R <= 4) return seg(4, source === 'vocal' ? 'The vocal range: even without sounding processed. With the threshold set for a few dB of reduction, this is the setting the practical papers reward.' : 'Moderate: the hits are held without flattening them. The usual starting point on a kit or a bass.');
    if (f.R <= 8) return seg(4, source === 'vocal' ? 'Firm on a voice: the peaks are flattened and it starts to sound held. Defensible on a shouted or rap vocal; say why.' : 'Firm: right on drums and bass to hold the hits at one level.');
    return seg(4, 'The very high ratio the 2023 paper used, and the report\'s verdict: a heavily compressed vocal. This close to infinity it is limiting in all but name; if that is the job, say limiter.');
}

function judgeAttack(f, source, part) {
    const a = f.attack;
    if (f.mode === 'gate' || f.mode === 'expander') {
        if (a > 5) return seg(4, 'A slow opening: the front of each hit is clipped off before the gate gets there. The 2019 mark scheme names it: a long attack cuts the starts of notes.');
        return seg(4, 'Opens in time for the hit: the front is kept. Right; a gate wants the fastest attack that does not click.');
    }
    if (f.mode === 'limiter') return a > 1
        ? seg(4, 'A limiter with a slow attack is not a limiter: the peak is past before it acts. Set it as fast as it goes.')
        : seg(4, 'As fast as it goes: the peak is caught. Right; a limiter has no other setting.');
    if (source === 'vocal') {
        if (a > 30) return seg(4, 'Slow: the front of every word gets through before the compressor acts. The 2025 mark scheme\'s two-mark fault, "attack too long causing excessive transients".');
        if (a >= 5) return seg(4, 'Medium: the consonants keep their edge and the compressor catches the vowel. Right for a vocal.');
        return seg(4, 'Fast: every peak is caught and the front of each word softens. Right to tame a spiky take; wrong if the voice loses its diction.');
    }
    if (source === 'drums' || source === 'electronic') {
        if (a < 5) return seg(4, 'Fast: the click of the kick is caught and the kit goes soft. Right to tame a kit, wrong for punch.');
        if (a <= 30) return seg(4, 'The hit gets through and the ring behind it is held: punch. Right; this is why a drum compressor is set slower than a vocal one.');
        return seg(4, 'Slow: most of each hit is over before the compressor reacts, so it barely works on drums. Right only if you want the transients entirely alone.');
    }
    if (a < 5) return seg(4, 'Fast: the front of the stab is squashed and the tail is lifted by the make-up: sustain. Right; the 2022 paper\'s piano question, which most candidates answered with reverb.');
    return seg(4, 'Slow enough for the attack of the stab to get through: punchier, less sustain. A trade; say which you want.');
}

function judgeRelease(f, source, part) {
    const r = f.release;
    if (f.mode === 'gate' || f.mode === 'expander') {
        if (r < 40) return seg(4, 'Closes almost at once: the ends of notes are cut and the gate chatters on the tails. The 2019 mark scheme: a short release cuts note ends.');
        if (r <= 300) return seg(4, 'Closes after the hit has rung: the tails are kept and the gaps are silent. Right.');
        return seg(4, 'Closes so slowly the gaps never go quiet: the 2019 mark scheme\'s other fault, a long release leaves the noise in.');
    }
    const heavy = f.gr >= 6;
    if (r < 60) return seg(4, heavy ? 'Fast, with this much reduction: the level swells back between hits, which is pumping. The 2023 AS paper lists pumping among the problems compression causes; right only as an effect you name.' : 'Fast: recovers between hits. With this little reduction it is hard to hear; fine.');
    if (r <= 500) return seg(4, 'Recovered before the next hit: the compressor works on each one and lets go in between. Right; the usual setting.');
    return seg(4, 'So slow it never lets go between hits: the whole part just sits lower, which is a fader move, not compression. Shorten it.');
}

function judgeKnee(f, source, part) {
    if (!hasKnee(f.mode)) return seg(4, `A ${f.def.name} has no knee to set. The corner is at the threshold, which is what makes it a ${f.def.name}.`);
    if (f.knee === 0) return seg(4, 'Hard: the corner the 2022 paper asked you to draw, one mark of the seven. You hear the compression switch on; on drums that is fine, on a voice a soft knee hides it.');
    return seg(4, `Soft: the ratio arrives gradually across ${f.knee} dB, so the compression is harder to hear coming in. Right on a vocal; if the paper asks for a hard knee, draw a hard knee.`);
}

function judgeMakeup(f, source, part) {
    if (f.makeup === 0) return seg(4, f.gr > 2 ? 'None: the part is quieter than it was by the gain reduction. Compare it dry and it will sound worse only because it is quieter; make the level up before you judge the compression. The 2024 practical lost marks where the volume was not matched.' : 'None, and none needed: there is little reduction to make up.');
    if (f.makeup > f.gr + 3) return seg(4, `More make-up than reduction: the part is louder than it was. The meter reads a gain, not a change in dynamic range; the 2019 report found a third of candidates confused the two. Bring it down to about ${fmtDb(f.gr).replace('−', '+')}.`);
    return seg(4, 'Brings back what the compression took: the loud parts sit where they were and the quiet parts are louder. That is the whole point, and the 2023 report says the function of make-up gain was often confused: it lifts the output, it does not change the reduction.');
}

function judgeMode(f, source, part) {
    switch (f.mode) {
        case 'limiter': return seg(4, 'Right where the job is stopping peaks and nothing else. The paper credits it as a ratio of infinity; a limiter with a low threshold is just heavy compression.');
        case 'gate': return seg(4, 'Right where the job is silence between sounds: hum, spill, tails. The 2019 report: candidates confused it with limiting, compressing or filtering, and vague answers scored nothing. A gate cuts the level under the threshold. Say under.');
        case 'expander': return seg(4, 'Right where a gate would be too blunt: the quiet parts go down, they are not switched off. Expansion is on the spec\'s list; name the ratio.');
        default: return seg(4, `Right for controlling ${part}: the loud parts come down, and with make-up the whole part sits at one level. The 2022 paper\'s reasons: control the peaks, keep the volume consistent, help the part sit in the mix.`);
    }
}

// A-level: judge the control the student touched last, the way the paper does.
export function judge({ state, last = 'threshold', part = 'the part', stats = null }) {
    const f = facts(state, stats);
    const source = state.source;
    switch (last) {
        case 'source':
            return [seg(4, `Now ${part}. The paper judges dynamics against the part: a vocal wants evenness without sounding processed, a kit wants its hits held and its punch kept, an 808 wants its weight and no pumping, a stab wants its front or its tail, whichever you say.`)];
        case 'preset':
            return judgePreset(state, f, part);
        case 'in':
            if (!f.on) return [seg(3, `${cap(f.def.name)} out.`), seg(4, 'The signal passes as recorded: the reference for every judgement. Press In and listen for what changes; the practical papers give nothing for a change nobody can hear.')];
            break;
        default:
            break;
    }
    if (!f.on) return [seg(3, `${cap(f.def.name)} is out.`), seg(4, `Press In to hear it: an answer about dynamics describes a setting that is doing something to ${part}.`)];
    switch (last) {
        case 'ratio': return [seg(3, nameRatio(f)), judgeRatio(f, source, part)];
        case 'attack': return [seg(3, nameAttack(f)), judgeAttack(f, source, part)];
        case 'release': return [seg(3, nameRelease(f)), judgeRelease(f, source, part)];
        case 'knee': return [seg(3, nameKnee(f)), judgeKnee(f, source, part)];
        case 'makeup': return [seg(3, nameMakeup(f)), judgeMakeup(f, source, part)];
        case 'mode': return [seg(3, nameMode(f)), judgeMode(f, source, part)];
        case 'threshold':
        default:
            return [seg(3, nameThreshold(f, part)), judgeThreshold(f, source, part)];
    }
}

function judgePreset(state, f, part) {
    switch (state.presetId) {
        case 'gentle':
            return [seg(3, 'Gentle: 3:1 at −12 dB, a 6 dB soft knee, 10 ms attack, 150 ms release, no make-up.'), seg(4, `A few dB off the loudest hits and nothing else touched: the starting point on almost anything. On ${part} it takes up to ${fmtDb(-f.gr).replace('−', '')} off. Hold dry against it, then make the level up.`)];
        case 'vocal':
            return [seg(3, 'Vocal level: 3:1 at −18 dB, soft knee, 10 ms in, 150 ms out, +4 dB make-up.'), seg(4, 'The loud words down, the quiet words up: the evenness every practical paper marks, from 2017 to 2025, always by ear against a reference file and never by the numbers. Hold dry against it and hear the phrase level out.')];
        case 'punch':
            return [seg(3, 'Drum punch: 4:1 at −10 dB, hard knee, 30 ms attack, 80 ms release, +3 dB make-up.'), seg(4, 'The slow attack lets the front of each hit through before the compressor acts; the fast release lets go before the next one. Louder-sounding hits at the same peak level. Turn the attack down to 1 ms and hear the punch go.')];
        case 'sustain':
            return [seg(3, 'Sustain: 6:1 at −24 dB, soft knee, 1 ms attack, 300 ms release, +8 dB make-up, on the stabs.'), seg(4, 'The fast attack squashes the front of the stab and the make-up lifts everything after it: the tail comes up and the note seems longer. The 2022 paper asked which processor gave a piano more sustain, and most candidates said reverb. It was this.')];
        case 'limiter':
            return [seg(3, 'Limiter: ratio infinity at −8 dB, as fast as it goes, +4 dB make-up, on the 808.'), seg(4, 'Nothing gets past −8 dB. Read the transfer curve: 1:1 up to the threshold, then flat. The 2023 AS paper asked for exactly those two lines and then which one was limiting; very few could label it. The flat one.')];
        case 'gatehats':
            return [seg(3, 'Gate the hats: a gate at −8 dB, 0.5 ms attack, 60 ms release, on the drums.'), seg(4, 'The hats sit about 9 dB under the kick and snare, so a threshold between them shuts the gate on the hats and opens it for every hit. Drag the threshold above the snare and the hits go too; below the hats and nothing is gated: the two 2019 faults, either side of the right answer.')];
        case 'paper2022':
            return [seg(3, "The 2022 paper's compressor, from its mark scheme: threshold −30 dB, 10:1, hard knee, and make-up so that −30 in comes out at −20."), seg(4, 'Seven marks: dB on both axes, 1:1 up to −30, a flatter 10:1 line to 0, a hard corner, the whole curve lifted by the make-up. The report: nearly everyone got the axes; the make-up was the mark fewest earned. Read it off the stage, then draw it.')];
        case 'paper2023':
            return [seg(3, "The 2023 paper's vocal compressor as the report describes it: a very high ratio at a low threshold, heavily compressed, with make-up gain."), seg(4, 'Most candidates saw that the very high ratio made a heavily compressed vocal; the make-up gain was often confused. It brings the level back after the compression, it does not compress. Hold dry against it, then bring the ratio down to 4:1 and say what came back.')];
        default:
            return judge({ state, last: 'threshold', part, stats: f.stats });
    }
}

// Extension: open the machine behind the control the student touched last.
export function open({ state, last = 'threshold', part = 'the part', stats = null }) {
    const f = facts(state, stats);
    switch (last) {
        case 'source':
            return `${cap(part)}: the bench reads its level every half millisecond as a peak, so the envelope on the stage is the loudest sample in each step. A peak detector follows transients; an RMS detector follows loudness and reacts later, which is why two compressors set the same can sound different.`;
        case 'preset':
            return openPreset(state, f, part);
        case 'in':
            return f.on
                ? `${cap(f.def.name)} in: the gain the stage draws is the gain the sound gets, because both come from the same series. The gain is computed once over the whole loop and played back to the gain node as a curve.`
                : `${cap(f.def.name)} out: a gain of 0 dB at every step, the identity. The signal goes through the same node and nothing changes.`;
        case 'ratio':
            if (f.mode === 'limiter') return 'Infinity is a slope of zero: output = threshold for every input above it. A real peak limiter looks ahead by a few milliseconds so the gain is down before the peak arrives; without look-ahead the first sample of every peak gets through, which is why the attack here cannot be 0.';
            if (f.mode === 'gate') return `A gate is an expander with an infinite ratio: under the threshold the slope of the transfer curve is vertical and the gain drops to the range, ${GATE_RANGE} dB here. Real gates add a hold time and a second, lower threshold (hysteresis) so a signal hovering at the threshold does not chatter.`;
            if (f.mode === 'expander') return `Under the threshold the output falls ${f.R.toFixed(1).replace(/\.0$/, '')} dB for every 1 dB the input falls: a slope of ${f.R.toFixed(1).replace(/\.0$/, '')} on the transfer curve, until the range (${EXPANDER_RANGE} dB) stops it. Compressor and expander are one machine with the slope on the other side of the threshold.`;
            return `Above the threshold the transfer curve has a slope of 1/${f.R.toFixed(1).replace(/\.0$/, '')}: ${f.R.toFixed(1).replace(/\.0$/, '')} dB in for every 1 dB out. Gain reduction is what the input is over the threshold times (1 − 1/R), so at ${fmtRatio(f.R)} a hit 12 dB over is turned down by ${(12 * (1 - 1 / f.R)).toFixed(1)} dB. Owsinski and Crich both put the border between compression and limiting at 8:1 to 10:1.`;
        case 'attack':
            return `Attack is a time constant, not a delay: ${fmtMs(f.attack)} is how long the gain takes to get 63% of the way to where the curve says it should be, smoothed in dB. After three attack times it is 95% there. A kick's transient is over in about 5 ms, so an attack slower than that lets the click through: the stage shows it as the gap between the ghost and the filled envelope at the front of each hit.`;
        case 'release':
            return `Release is the same time constant the other way: ${fmtMs(f.release)} to recover 63% of the reduction once the signal drops. Set it shorter than the gap between hits and the gain swings up and down with the beat, which you hear as pumping; longer than the gap and the reduction never fully lets go, so the part just sits lower. The coral band on the stage is that swing.`;
        case 'knee':
            if (!hasKnee(f.mode)) return `A ${f.def.name} has no knee because its slope is ${f.mode === 'limiter' ? 'zero' : 'vertical'} beyond the threshold: there is nothing to blend from 1:1 into. Its corner is a point.`;
            return f.knee === 0
                ? 'A hard knee is two straight lines meeting at the threshold. The gain computer switches from slope 1 to slope 1/R at one input level, which the ear hears as the compression clicking in on a signal hovering there.'
                : `A soft knee blends the two slopes with a quadratic across ${f.knee} dB centred on the threshold, so the slope goes smoothly from 1 to 1/R. At the threshold itself the reduction is already ${(-((1 / f.R - 1) * (f.knee / 2) ** 2) / (2 * f.knee)).toFixed(2)} dB. The curve is continuous and so is its slope, which is why it is harder to hear.`;
        case 'makeup':
            return `Make-up is a gain stage after the gain computer: it adds ${fmtDb(f.makeup)} to every sample whatever the level. It lifts the whole transfer curve, both the 1:1 part and the compressed part, which is the mark on the 2022 paper fewest candidates earned. Loudness goes up; dynamic range, the distance from loud to soft, does not change at all.`;
        case 'mode':
            return 'All four are one gain computer with a different static curve: a compressor has slope 1/R above the threshold; a limiter is that with slope 0; an expander has slope R below; a gate is that with the slope vertical, down to a floor. The attack and release smoothing is the same one-pole filter in dB for all of them, with attack and release swapped for the downward pair.';
        case 'threshold':
        default:
            return f.down
                ? `The threshold is where the static curve leaves the 1:1 line going down: ${pct(f.over)} of the loop is under it, and there the ${f.def.name} works. The stage draws that as the gap between the ghost envelope and the filled one. A gate's threshold is the only number that decides what is kept and what is cut, which is why every 2019 to 2024 practical was marked on it.`
                : `The threshold is where the static curve leaves the 1:1 line: ${pct(f.over)} of the loop is over it, and up to ${fmtDb(-f.gr).replace('−', '')} is taken off there. Gain reduction is the vertical distance between the curve and the 1:1 line at that input, which the coral band on the stage draws against time instead of against level.`;
    }
}

function openPreset(state, f, part) {
    switch (state.presetId) {
        case 'paper2022':
            return 'Read the curve: 1:1 from the floor to −30, then slope 1/10, so 0 dB in comes out at −27 before make-up; +10 dB of make-up lifts every point, so −30 in becomes −20 out and 0 in becomes −17. The hard knee is the single corner. That is the whole seven-mark drawing in four numbers.';
        case 'paper2023':
            return 'A ratio of 20:1 at −24 dB is a slope of 0.05: 24 dB of range over the threshold comes out as 1.2 dB. That is limiting in all but name, and the 10 dB of make-up puts the flattened vocal back up to level, louder in the quiet words by nearly the full 10 dB. Louder, not more dynamic: the two ideas the 2019 report found a third of candidates confusing.';
        case 'limiter':
            return 'Slope 0 above −8 dB: the curve is horizontal from the threshold, which is the line the 2023 AS paper wanted. With no look-ahead the first half-millisecond of each peak still gets through; a mastering limiter delays the signal a few milliseconds so the gain is already down when the peak arrives.';
        case 'gatehats':
            return 'The hats are booked at 0.35 of full gain, about 9 dB under the kick; the gate\'s threshold at −8 dB sits in that gap. Under it the gain drops to −80 dB with the release\'s time constant, so each hit opens the gate in half a millisecond and it closes about 60 ms after the hit falls under the line. The transfer curve is vertical at the threshold: infinite expansion.';
        case 'sustain':
            return 'A 1 ms attack catches the front of the stab within a few milliseconds, so the peak is turned down by the full reduction; the 300 ms release lets that reduction go slowly as the stab decays, so the tail is turned down less than the front was. Make-up lifts the whole thing: the front is back where it was and the tail is higher. Longer, at the same peak.';
        case 'punch':
            return 'A 30 ms attack means the gain is only 63% of the way down after 30 ms, and the kick\'s transient was over in 5. The front of each hit passes at full level and the ring behind it is held down; the 80 ms release recovers before the next hit. Same peak, less ring, so the hit stands out: punch is a ratio of front to body.';
        case 'vocal':
            return 'Three to one at −18 dB on a phrase peaking at −3: 15 dB over comes out as 5, so 10 dB of reduction on the loudest word and nothing on words under −18. The soft knee blends the reduction in across 6 dB, and 4 dB of make-up brings the quiet words up. The range from loud to soft has shrunk by about the reduction on the loudest word.';
        case 'gentle':
        default:
            return 'The static curve at 3:1 with a 6 dB knee: 1:1 to −15, a quadratic to −9, then a slope of a third. On the drums the kick and snare are the only hits over the line, so the gain reduction is a series of short dips, one per hit, each recovering over 150 ms.';
    }
}

// Core, Teacher on: what the student is hearing, from the settings and the loop.
export function hearingLine(state, part = 'the part', stats = null) {
    const f = facts(state, stats);
    if (!f.on) return `You are hearing ${part} with the ${f.def.name} out: the signal as recorded.`;
    if (f.mode === 'gate') return `You are hearing ${part} through a gate at ${fmtDb(f.T)}, open ${pct(100 - f.over)} of the loop: everything quieter than the threshold is shut off, opening in ${fmtMs(f.attack)} and closing over ${fmtMs(f.release)}.`;
    if (f.mode === 'expander') return `You are hearing ${part} through an expander at ${fmtDb(f.T)}, ${f.ratio}: the quiet parts, ${pct(f.over)} of the loop, are pushed further down, by up to ${fmtDb(-f.gr).replace('−', '')}.`;
    if (f.mode === 'limiter') return `You are hearing ${part} through a limiter at ${fmtDb(f.T)}: nothing gets past that level, the loudest hits are held back by up to ${fmtDb(-f.gr).replace('−', '')}${f.makeup ? `, and the level is made up by ${fmtDb(f.makeup)}` : ''}.`;
    return `You are hearing ${part} through a compressor at ${fmtDb(f.T)}, ${f.ratio}, ${fmtMs(f.attack)} in and ${fmtMs(f.release)} out: the loudest hits are turned down by up to ${fmtDb(-f.gr).replace('−', '')}${f.makeup ? ` and the level is made up by ${fmtDb(f.makeup)}` : ''}, and ${pct(f.over)} of the loop is over the threshold.`;
}

// Core: the next thing to try, from where the student is.
export function nextMove(state, stats = null) {
    const g = gr(stats);
    if (state.mode === 'comp' && g < 1) return 'drag the threshold line down until the loudest hits start to come down: the coral band is what is being taken off';
    if (state.mode === 'comp' && state.ratio < 6) return 'turn the ratio up to 10:1 and hold dry against it: hear the hits flatten and the quiet parts come up';
    if (state.mode === 'comp' && state.attack < 20) return 'choose the drums, set the attack to 30 ms, and listen for the click of the kick getting through before the compressor catches it';
    if (state.mode !== 'gate') return 'switch the processor to Gate on the drums and drag the threshold until only the kick and snare open it';
    if (state.mode === 'gate' && state.release < 40) return 'lengthen the release until the snare keeps its tail';
    return 'press 2022 paper and draw the transfer curve on paper from the stage: axes in dB, 1:1 to the threshold, the flatter line, the corner, the lift';
}

const fmtRatio = (r) => (r === Infinity ? '∞:1' : `${Number(r.toFixed(1)).toString()}:1`);
