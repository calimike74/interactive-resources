// The Reverb bench's three levels, as three jobs (the pattern set on the
// Delay bench, 27 Aug 2026, and re-stated by Mike on 2 Sep):
//
//   Core       the bench SHOWS: names the tail in the spec's own words
//              (type, pre-delay, reverb time, wet) and says what to try.
//   A-level    the bench JUDGES the way the paper does: the setting and its
//              effect tagged AO3, the verdict, the better setting and the
//              report that says so tagged AO4; a paper's task is judged
//              against the scheme's own points with its year.
//   Extension  the bench OPENS THE MACHINE: a reverb is a space's answer to
//              one clap, and the wet signal is every sample of the dry
//              stamping a copy of that answer.
//
// Every quote is verbatim from the 9MT0/03 and 9MT0/04 mark schemes and
// Principal Examiner reports as held in the vault (2018 AS 5(c), 2019 AS
// 5(a), 2019 A 5(a) and 5(d), 2019 C3 3(a), 2020 A 5(e) and Q6, 2021 C3
// 1(d), 2022 AS 1(c)(i) and 5(a), 2022 A 3(b), 2023 AS 5(d), 2023 A 5(f),
// 2023 C3 2(a), 2024 C3 1(c), 2025 A 5(d), 2025 C3 3(d)). Pure functions
// over the model; ReverbBench renders them.

import {
    TYPES, SOURCES, SECTIONS, SECTION_IDS, TASKS, GRADE_WORD, REPORTS,
    PREDELAY_BAND, WET_LOW, WET_HIGH, WET_SWAMPED, GATE_HOLD, GATE_CLOSE,
    fmtSec, fmtMs, readings, verdict, judgeAll, dampedTime, earlyTaps, impulseLength,
} from './reverb-model.js';

export const DEPTH_LINES = {
    core: 'the bench names the tail in the words the spec asks for and says what to try. The stage is the answer drawn in decibels against time: the gap, the first reflections, the tail falling to the named floor. Drag the tail\'s end and the Reverb time dial follows.',
    alevel: 'the bench now judges every setting the way the paper does. The path is drawn as a mixer has it: channel, send and return. Each setting and its effect is AO3; the verdict and the report that says so is AO4. Set a paper\'s task and the line is the scheme\'s own points.',
    extension: 'the bench opens the machine: three lanes in time. The dry source; the answer the space gives one clap; and the wet, every sample of the dry stamping a copy of that answer, all added up.',
};

export const DEPTH_TEACH = {
    alevel: 'Write it in that order: name the setting (AO3), then its effect on the sound and whether it suits the part (AO4).',
    extension: 'The 2020 C4 report: "Many students confused gating with compression". A gate opens and shuts; it never changes a level in between.',
};

const seg = (ao, text) => ({ ao, text });
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// ---- Core: what you are hearing, and the next move ------------------------------------
export function hearingLine(state) {
    const r = readings(state);
    const src = SOURCES[state.source];
    const type = TYPES[state.type];
    const shape = state.type === 'gated'
        ? `held open for 120 ms and then shut in 10, so it stops rather than fades`
        : state.type === 'reversed'
            ? `swelling over ${r.rt60Text} and stopping dead, the answer played backwards`
            : `falling ${r.tail === 'short' ? 'away in' : 'to nothing over'} ${r.rt60Text}`;
    const gap = state.type === 'reversed'
        ? (state.predelay === 0 ? 'It starts with the sound and grows' : `It starts ${fmtMs(state.predelay)} after the sound and grows`)
        : state.predelay === 0
            ? 'The answer starts with the sound'
            : `A gap of ${fmtMs(state.predelay)} comes first, then the answer`;
    const early = state.type === 'reversed'
        ? `The ${r.taps} first reflections come last, just before it stops`
        : r.taps === 0
        ? 'A plate has no walls, so there are no first reflections at all'
        : state.type === 'spring'
            ? `The coil answers as a pulse every 55 ms, each one smeared from high to low`
            : `${r.taps} first reflections arrive between ${r.firstTapMs} and ${Math.round(earlyTaps(state.type, state.time)[r.taps - 1].t * 1000)} ms`;
    return `You are hearing ${src.said} through ${type.said}, ${shape}. ${gap}. ${early}. At ${state.wet} per cent wet against ${state.dry} per cent dry it is ${r.amount}.`;
}

const PRESET_MOVES = {
    room: 'push Reverb time to 2.5 s and hear the same close reflections turn into a hall the room cannot hold',
    hall: 'drag the tail\'s end handle left until the time reads 1 s, and hear the space shrink around the voice',
    plate: 'switch to Room and listen for the eight first reflections a plate does not have',
    spring: 'push Reverb time to 4 s and count the pulses: a spring answers every 55 ms whatever its length',
    gated: 'drag Reverb time from 4 s to 1 s: the answer gets thinner but never gets shorter, because the gate sets the length',
    reverse: 'take Pre-delay to 300 ms and hear the swell pull away from the word that caused it',
    as2019: 'raise Wet past 50 and hear the 2018 AS report\'s fault, then bring it back until the line says clearly audible',
    a2019: 'open More, switch Routing to Insert and pan the vocal hard left: the reverb goes with it',
    a2020: 'open More and switch Routing to Insert: that is the fault the 2019 report calls proof no aux was used',
    dials2019: 'drag Pre-delay to 0 and hear the space close on the voice, then take it back inside 200 to 400 ms',
    judgeWet: 'bring Wet down to 25 and read the line again: the same reverb, a different verdict',
    judgeInsert: 'open More and switch Routing to Send: the reverb stays centred while the vocal keeps its pan',
    judgeMono: 'open More and switch to Stereo: the same hall, and the mark the 2025 scheme withholds for mono',
};
export function nextMove(state) {
    if (state.presetId && PRESET_MOVES[state.presetId]) return PRESET_MOVES[state.presetId];
    if (state.wet > WET_SWAMPED) return 'bring Wet under 40 and listen to the part come back in front of its own reverb';
    if (state.wet < WET_LOW) return 'raise Wet to 25 and listen for the answer arriving behind the part';
    if (state.predelay === 0 && state.source === 'vocal') return 'take Pre-delay to 300 ms and hear the voice come forward while the space stays where it is';
    if (state.type !== 'gated') return 'press Gated and watch the tail stop dead at 120 ms instead of fading';
    return 'switch to A-level and read the verdict on each part of the path';
}

// ---- A-level: the judge -------------------------------------------------------------------
const SECTION_OF_LAST = {
    type: 'type', preset: null, source: null,
    time: 'time', predelay: 'predelay',
    wet: 'mix', dry: 'mix',
    damping: 'type', stereo: 'routing', routing: 'routing', pan: 'routing',
    stage: 'time', stagePre: 'predelay',
};
export const sectionOfLast = (last) => SECTION_OF_LAST[last] || null;

function settingOf(state, section) {
    const s = state;
    const r = readings(s);
    if (section === 'type') return `${TYPES[s.type].label}, ${r.reversed ? 'the hall\'s answer backwards' : r.taps === 0 ? 'no first reflections' : `${r.taps} first reflections from ${r.firstTapMs} ms`}, damping ${s.damping} %`;
    if (section === 'time') return `${r.rt60Text}${s.type === 'gated' ? `, gated at ${Math.round(GATE_HOLD * 1000)} ms` : ''}`;
    if (section === 'predelay') return `${fmtMs(s.predelay)} in front of the answer`;
    if (section === 'mix') return `${s.wet} % wet against ${s.dry} % dry`;
    return `${s.routing === 'send' ? 'a send and return' : 'a channel insert'}, ${s.stereo}, pan ${s.pan === 0 ? 'centre' : `${Math.abs(s.pan)} ${s.pan < 0 ? 'left' : 'right'}`}`;
}

export function betterSetting(state, section, grade) {
    if (grade === 'good') return '';
    const s = state;
    if (section === 'type') {
        if (s.source === 'vocal') return 'Choose Hall or Plate.';
        if (s.source === 'guitar') return 'Choose Spring.';
        return 'Choose Gated or Plate.';
    }
    if (section === 'time') {
        if (s.type === 'gated') return 'Take it past 2 s so the gate has a dense answer to hold open.';
        return 'Set it between 1.5 and 4 s.';
    }
    if (section === 'predelay') return s.predelay === 0 ? 'Take it to 200 ms or more.' : 'Take it past 20 ms so the gap can be heard.';
    if (section === 'mix') return s.wet > WET_HIGH ? `Bring Wet under ${WET_HIGH}.` : `Raise Wet to ${WET_LOW} or more.`;
    if (s.stereo === 'mono') return 'Switch Stereo on in the More row.';
    if (s.routing === 'insert') return 'Switch Routing to Send in the More row.';
    return 'Bring the Pan back to centre, or move the reverb to a send.';
}

export function judge({ state, last }) {
    const s = state;
    const task = s.task ? TASKS[s.task] : null;
    const job = SOURCES[s.source].job;
    const v = verdict(s);
    // a paper's task: the scheme's own points, with its year
    if (task && s.task !== 'judge') {
        const set = v.points.map((p) => p.said).join('; ');
        if (v.ok) {
            return [
                seg(3, `${cap(SOURCES[s.source].said)} as set: ${set}.`),
                seg(4, `As directed: ${task.scheme} (${task.cite}).`),
            ];
        }
        const m = v.missed[0];
        return [
            seg(3, `${cap(SOURCES[s.source].said)} as set: ${set}.`),
            seg(4, `Not yet: ${m.said}, where the scheme wants ${m.name}. ${task.scheme} (${task.cite}).`),
        ];
    }
    // the Q6 idiom: one part of the path, judged for the job
    const all = judgeAll(s);
    const section = sectionOfLast(last);
    if (!section) {
        const names = (ids) => ids.map((id) => SECTIONS[id].name).join(', ');
        const poor = SECTION_IDS.filter((id) => all[id].grade === 'poor');
        const partly = SECTION_IDS.filter((id) => all[id].grade === 'partly');
        const good = SECTION_IDS.filter((id) => all[id].grade === 'good');
        const worst = poor[0] || partly[0];
        return [
            seg(3, `${cap(job)}, judged part by part: ${good.length ? `the ${names(good)} suit${good.length === 1 ? 's' : ''} it` : 'no part of the path suits it'}${partly.length ? `; the ${names(partly)} partly` : ''}${poor.length ? `; the ${names(poor)} ${poor.length === 1 ? 'does' : 'do'} not` : ''}.`),
            seg(4, worst ? `${cap(SECTIONS[worst].name)} first: ${all[worst].why}. ${betterSetting(s, worst, all[worst].grade)}` : `Every part of the path suits ${job}. Touch a control and the line judges that one.`),
        ];
    }
    const g = all[section];
    const better = betterSetting(s, section, g.grade);
    return [
        seg(3, `${SECTIONS[section].label}: ${settingOf(s, section)}.`),
        seg(4, `${cap(GRADE_WORD[g.grade])} ${job}: ${g.why}.${better ? ` ${better}` : ''}${g.cite ? ` ${g.cite}` : ''}`),
    ];
}

// ---- Extension: the machine ---------------------------------------------------------------
const CONVOLUTION = 'A reverb is a space\'s answer to one clap. The wet is a copy of that answer stamped by every sample of the dry, all added up.';

export function open({ state, last }) {
    const s = state;
    const section = sectionOfLast(last);
    const r = readings(s);
    if (section === 'predelay') return `${CONVOLUTION} Pre-delay holds each copy back ${fmtMs(s.predelay)} before it is stamped, so a gap opens in front of a tail that has not otherwise changed.`;
    if (section === 'time') {
        if (s.type === 'gated') return `${CONVOLUTION} A gate cuts this answer at ${fmtMs((GATE_HOLD + GATE_CLOSE) * 1000)}; the ${r.rt60Text} sets how dense it is before the cut, not how long.`;
        return `${CONVOLUTION} This answer runs ${r.lengthText}, falling 60 dB in ${r.rt60Text}, which is what RT60 means: noise under an exp curve, one channel per side.`;
    }
    if (section === 'mix') return `${CONVOLUTION} Wet scales the copies and dry scales the original: at 0 % dry only the copies are left, which is the 2023 question on Funkytown\'s cowbells.`;
    if (section === 'routing') return `${CONVOLUTION} On a send the copies go to their own channel and stay stereo; on an insert they sit in the part's channel and go wherever it goes.`;
    if (s.damping > 0 && section === 'type') return `${CONVOLUTION} Damping splits the answer at 2 kHz and runs its top band out in ${fmtSec(dampedTime(s.time, s.damping))} instead of ${r.rt60Text}, so the tail darkens as it falls.`;
    return `${TYPES[s.type].mech} ${CONVOLUTION}`;
}
