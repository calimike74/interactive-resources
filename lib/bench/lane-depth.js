// The Automation Lane's three levels, as three jobs (the pattern set on the
// Delay bench, 27 Aug 2026):
//
//   Core       the bench SHOWS: names what the lane does and says what to try.
//   A-level    the bench JUDGES the way the paper does: the stem's shape
//              drawn to match, every check the scheme makes, the fix, each
//              part tagged with the half of the mark it earns.
//   Extension  the bench OPENS THE MACHINE: where in the channel the lane
//              writes, what the DAW stores against what the engine plays,
//              and recording a move by hand (Touch).
//
// Every examiner's sentence quoted here is from the 9MT0 mark schemes and
// Principal Examiner reports as held in the vault's per-question files
// (1.8 Automation/05 - Assessment Tools/Past Paper Questions): 2017 AS
// Q5(a), 2019 AS Q5(b), 2020 A Q5(a) and Q5(b), 2021 A Q5(a), 2022 AS
// Q2(c), 2023 A Q5(b). Pure functions over the model; AutomationLane
// renders them.

import { PARTS, TARGETS, SHAPES, GRIDS, TASKS, verdict, pointWords, movingBars, listBars, fmtValue, valueWord, UNITY } from './lane-model.js';

export const DEPTH_LINES = {
    core: 'the bench names what the lane is doing and tells you what to try. The stage is the part\'s clip with its automation lane beneath it, drawn the way your DAW draws it: drag a point, click the lane to add one, double-click one to remove it. Hold the button in the play column to hear the loop with the lane off.',
    alevel: 'the bench now marks the lane the way the paper does: the stem\'s own shape drawn dashed for you to match, the bars it names shaded, and every check the scheme makes read off your lane: on the barline, the right direction, full travel, one smooth rise, arriving at the level. Each part tagged with the half of the mark it earns.',
    extension: 'the bench opens the machine: where in the channel this lane writes (the fader, the pan pot, a parameter inside the insert, the send), what the DAW stores against what the engine plays, and Touch: grab the Value dial while the loop runs and the lane records your move.',
};

export const DEPTH_TEACH = {
    alevel: 'Write it in that order: what the lane does and where it fails is AO3; what the scheme asks and the fix are AO4, as is the practical mark.',
    extension: 'None of this is asked as a question. All of it is how the practical is done.',
};

const seg = (ao, text) => ({ ao, text });
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const said = (id) => PARTS[id].said;
const poss = (id) => PARTS[id].poss;

// ---- Core: the hearing line and the next move -----------------------------
export function hearingLine(state) {
    const v = verdict(state);
    const tg = TARGETS[state.target];
    if (state.points.length === 1) {
        return `You are hearing the loop with a flat lane: ${poss(state.part)} ${tg.noun} sits at ${valueWord(state.target, state.points[0].v)} all the way through, which is no automation at all. Click the lane to add a point.`;
    }
    const base = `You are hearing ${poss(state.part)} ${tg.noun} follow ${SHAPES[state.shape].said}: ${pointWords(state)}.`;
    if (v.key === 'free') return `${base} It moves in ${listBars(movingBars(state))}.`;
    if (v.ok) {
        const pass = v.checks.filter((c) => c.ok).map((c) => c.text);
        return `${base} ${cap(pass[0])}${pass[1] ? `, ${pass[1]}` : ''}.`;
    }
    return `${base} ${cap(v.faults[0].text)}.`;
}

const FIXES = {
    placement: 'set the grid to Bar and drag the jump onto the barline',
    direction: 'swap the two positions: left first, then right',
    position: 'drag the point to the edge of the lane; hard means full travel',
    scope: 'bring the bars the stem does not name back to the rest line',
    smooth: 'switch the shape to Line and take out the point that turns back',
    start: 'lift the first point until the part can be heard, and start bar 2 where bar 1 sat',
    rate: 'drag the last point up: the rise has to be heard by the end of bar 3',
    arrival: 'drag the last point up to the original level',
};
const PRESET_MOVES = {
    pan: 'switch the shape to Line and hear the jumps become sweeps',
    late: 'set the grid to Bar and drag the first jump onto the barline',
    sweep: 'press Backwards and listen for what changed; nothing about the shape did',
    backwards: 'drag the two points in bar 3 to swap them, so the first is hard left',
    filter: 'switch the target to Send and hear the same rise open the room instead of the tone',
    slow: 'lift the first point until the keys can be heard in bar 1, then the last point to fully open',
    ramp: 'switch the shape to Curve and hear the rise ease into the level',
    short: 'drag the two middle points out of the way and the last one up to the original level',
};
export function nextMove(state) {
    if (state.presetId && PRESET_MOVES[state.presetId]) return PRESET_MOVES[state.presetId];
    const v = verdict(state);
    if (v.key === 'free') {
        if (state.points.length === 1) return 'click the lane at bar 2 to add a point, then drag it';
        return 'switch the target and hear the same shape do a different job';
    }
    if (v.ok) return 'hold the lane off and hear what the move added; then press the preset beside it and find the fault by ear';
    return FIXES[v.faults[0].id] || 'press the preset again to start from the stem';
}

// ---- A-level: the judge -----------------------------------------------------
const Q = {
    lr: '"L – R as directed"',
    sloppy2020: '"a little sloppy with the placement of automation so the transients were not hard panned properly" (2020)',
    smooth2023: '"L to R smoothly as directed" (2023)',
    inverted2023: '"a few who inverted the answer panning from right to left" (2023)',
    filter2020: '"the cut-off frequency of the low pass filter smoothly rises... the cut-off in bar 10 matches bar 9" (2020 scheme)',
    slow2020: '"the cut-off frequency either started too low, or was too slow to rise so the synth riff was not audible" (2020)',
    ramp2022: '"audible at the start (1), volume rises smoothly (1), volume at the end is the same as the original / no changes in volume elsewhere (1)" (2022 AS scheme)',
    uneven2022: '"uneven volume ramp and not reaching a suitable level by the end" (2022)',
};

export function judge({ state, last }) {
    const id = state.presetId;
    if (id === 'pan') {
        return [
            seg(3, 'Hard pan by bar: the keys centred for bar 1, hard left through bar 2, hard right through bar 3, centred again for bar 4, every jump on its barline. The move the papers set most: a keyboard in 2019, a synth riff in 2020, a vocal phrase in 2017.'),
            seg(4, `${Q.lr}: the scheme is four words, so the marks live in the doing. Scope exact, both positions at full travel, left then right, the jumps on the transients.`),
        ];
    }
    if (id === 'late') {
        return [
            seg(3, 'Late step: the same lane, every jump 73 ms after its barline. The first note of bar 2 plays centred and then snaps left; the first of bar 3 plays left and snaps right.'),
            seg(4, `Not as directed: ${Q.sloppy2020}. Set the grid to Bar and drag each jump onto the line.`),
        ];
    }
    if (id === 'sweep') {
        return [
            seg(3, 'Sweep: the bass centred until bar 3, then one continuous ramp from hard left to hard right across the bar, back to centre for bar 4.'),
            seg(4, `${Q.lr} (2021); ${Q.smooth2023}: smoothly rules out a step. One ramp, full travel, the named bar only.`),
        ];
    }
    if (id === 'backwards') {
        return [
            seg(3, 'Backwards: the same ramp, the same bar, the same travel, run from hard right to hard left.'),
            seg(4, `Not as directed: ${Q.inverted2023}. The shape is perfect and the mark is gone. Swap the two points.`),
        ];
    }
    if (id === 'filter') {
        return [
            seg(3, 'Filter build: the keys half closed at 460 Hz through bar 1; from bar 2 the cut-off opens, fast at first then easing, fully open by the end of bar 4.'),
            seg(4, `${Q.filter2020}: two things, the join does not jump and the rise is heard.`),
        ];
    }
    if (id === 'slow') {
        return [
            seg(3, 'Slow to rise: bar 1 sits at 150 Hz, so the keys are a rumble; the rise reaches only 620 Hz by the end of bar 3 and 1.3 kHz at the end.'),
            seg(4, `Not as directed: ${Q.slow2020}. Lift the first point, then the last.`),
        ];
    }
    if (id === 'ramp') {
        return [
            seg(3, 'Ramp: the keys at the original level until bar 3 begins, drop to −17 dB, then one straight rise back to 0 dB by the end of the bar; nothing else moves.'),
            seg(4, `Three marks: ${Q.ramp2022}.`),
        ];
    }
    if (id === 'short') {
        return [
            seg(3, 'Falls short: the ramp starts right, then rises, dips and rises again, and ends 6 dB under the original level.'),
            seg(4, `Not as directed: ${Q.uneven2022}. Two of the three marks gone. Take out the dip, land the last point on the line.`),
        ];
    }
    // an edited lane
    const v = verdict(state);
    const tg = TARGETS[state.target];
    const what = `${cap(poss(state.part))} ${tg.noun} on ${SHAPES[state.shape].said}: ${pointWords(state)}.`;
    if (v.key === 'free') {
        return [
            seg(3, `${what} It moves in ${listBars(movingBars(state))}${last === 'target' ? ', the same shape on a new target' : ''}.`),
            seg(4, 'No stem set: the papers name the part, the bars and the positions. Press a preset to work to one, or hold the lane off and say what the move adds.'),
        ];
    }
    const task = TASKS[state.task];
    if (v.ok) {
        return [
            seg(3, `${what} ${cap(v.checks.map((c) => c.text).slice(0, 2).join('; '))}.`),
            seg(4, `As directed: ${task.scheme}. Hold the lane off and say what the move adds; that sentence is the written question.`),
        ];
    }
    const f = v.faults[0];
    return [
        seg(3, `${what} ${cap(f.text)}${v.faults[1] ? `; ${v.faults[1].text}` : ''}.`),
        seg(4, `Not as directed: ${task.scheme}. ${cap(FIXES[f.id] || 'start again from the preset')}.`),
    ];
}

// ---- Extension: the machine -----------------------------------------------
export function open({ state, last }) {
    const n = state.points.length;
    const stored = `The DAW keeps ${n} breakpoint${n === 1 ? '' : 's'}; the engine plays 9,320 values a pass, one a millisecond, booked ahead of the beat.`;
    if (last === 'write') {
        return `Touch: the dial wrote a point at every grid step it crossed, replacing what was there, and stopped when you let go. Latch keeps writing the last value to the end of the pass; Write erases as it passes; Read records nothing. ${stored}`;
    }
    if (last === 'shape') {
        return `${cap(SHAPES[state.shape].said)} ${SHAPES[state.shape].does}. The points are the same; the shape is the rule for the values between them, and the engine plays the rule. ${stored}`;
    }
    if (last === 'grid') {
        return `Grid ${GRIDS[state.grid].label.toLowerCase()}: ${state.grid === 'free' ? 'free-form, a point lands wherever you put it, as a hand-recorded pass does' : `grid-synchronised, every point snaps to ${GRIDS[state.grid].said}, which is how a step lands on a transient`}. The spec names both. ${stored}`;
    }
    const where = {
        vol: 'The lane writes to the fader: the channel\'s level after the filter and before the pan, so the post-fade send follows it into the room. Automation on the channel.',
        pan: 'The lane writes to the pan pot after the fader: two gains on an equal-power law, so the part holds its level as it crosses. Automation on the channel; nothing inside the sound changes.',
        filter: 'The lane writes inside the insert: the cut-off of a low-pass filter before the fader. Parameter automation, a lane on a plug-in rather than on the channel; the 2020 practical is this.',
        send: 'The lane writes to the send after the fader: the copy of the part into the shared room. More send is further back, not quieter; a send opening at a section boundary is the listening paper\'s automation.',
    }[state.target];
    return `${where} ${stored} Grab the ${TARGETS[state.target].dial} dial while the loop runs and the lane records the move: Touch.`;
}
