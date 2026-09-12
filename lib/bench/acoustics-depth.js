// The Acoustics bench's three levels, as three jobs (the pattern set on the
// Delay bench, 27 Aug 2026, restated by Mike on 2 Sep):
//
//   Core       the bench SHOWS: names what is heard at this station and says
//              what to try. No arithmetic anywhere.
//   A-level    the bench JUDGES the way the paper does: what is there tagged
//              AO3, what it does to the sound and whether it suits the job
//              tagged AO4, with the scheme's or the report's own line and its
//              year. The one number the paper wants sits beside it.
//   Extension  the bench OPENS THE MACHINE: the graph behind the station,
//              and the arithmetic the bench is running that no paper asks for.
//
// The evidence behind every quote: 8MT0/41 and 9MT0/04 question papers, mark
// schemes and Principal Examiner reports 2018 to 2026, swept for masking,
// comb filtering, reflection, absorption, RT60, treatment, soundproofing,
// standing waves and hearing range. What that sweep found, and did not find,
// is in the design record: there is no RT60 calculation and no equal-loudness
// question in nine years, so this bench never claims one.
//
// Pure functions over the model; AcousticsBench renders them.

import {
    STATIONS, TONES, LEVELS, ABSORB, SOURCES, TASKS, REPORTS, PLACES,
    SECTIONS, GRADE_WORD, GRADE_TAIL, TARGET_DBFS, TONE_DBFS, COLOUR_LIMIT_MS,
    HEARING_LOW, HEARING_HIGH, SPL_AT_FULL_SCALE, BANDS,
    fmtHz, fmtMs, fmtSec, fmtDb, readings, judgeAll, verdict,
    maskerHzOf, criticalBandwidth, firstNotchHz, combDepthDb, bandTimes, evenness,
} from './acoustics-model.js';

export const DEPTH_LINES = {
    core: 'the bench names what you are hearing at this station and says what to try next. The stage is the station\'s own picture: the contours of the ear, the masker over the target, or the room\'s comb and its tail. Nothing here asks you to work anything out.',
    alevel: 'the bench now judges what is set the way the paper does. What is there is AO3; what it does to the sound, and whether it suits the job, is AO4, in the scheme\'s or the report\'s own words with the year. The stage becomes the figure the paper prints.',
    extension: 'the bench opens the machine: the nodes behind this station in signal order, and the arithmetic running inside them. None of this is on the paper, and the bench says which numbers are its own.',
};

export const DEPTH_TEACH = {
    alevel: 'Write it in that order: name what is there (AO3), then what it does to the sound and whether it suits the job (AO4).',
    extension: 'The 2026 A report: candidates "continue to refer to \'soundproofing\' when answering questions about acoustics". A machine view is no defence against the wrong word.',
};

const seg = (ao, text) => ({ ao, text });
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// ---- Core: what you are hearing, and the next move -------------------------
export function hearingLine(state) {
    const r = readings(state);
    if (state.station === 'loudness') {
        if (!r.audible) return `${cap(TONES[state.tone].said)} at this level sits under the threshold of hearing, so nothing comes back at all.`;
        const same = state.tone === 1000;
        const where = state.tone === 3000 ? 'louder' : 'quieter';
        return `Every tone leaves at one level, so every tone arrives at one level. Heard ${LEVELS[state.listen].said}, ${TONES[state.tone].said} seems ${Math.round(r.phon)} phon${same ? ', which is the reference the others are read against' : ` against the 1 kHz tone's ${Math.round(r.ref)}: ${Math.round(Math.abs(r.gap))} phon ${where}`}.`;
    }
    if (state.station === 'masking') {
        if (!state.targetOn) return `The masker alone: a band of noise one critical band wide, ${Math.round(r.bandwidth)} Hz, at ${fmtHz(r.maskerHz)}. Press Target on and listen for the tone.`;
        return `A ${fmtHz(state.target)} tone with a band of noise ${PLACES[state.place].said} at ${fmtHz(r.maskerHz)}. ${r.masked ? `The noise has taken it: the tone is ${Math.abs(Math.round(r.margin))} dB under what it now needs.` : `The tone is still there, ${Math.round(r.margin)} dB clear of what the noise demands.`}`;
    }
    const t = r.times;
    const refl = r.depth < 6
        ? `The copy is ${fmtMs(state.delay)} behind and ${Math.abs(state.reflect)} dB down, too far under to colour anything.`
        : r.colouration
            ? `One reflection ${fmtMs(state.delay)} behind puts a notch at ${r.notchText} and another every ${fmtHz(2 * r.notch)} above it.`
            : `The copy is ${fmtMs(state.delay)} behind, far enough to hear as a separate bounce rather than a colouration.`;
    return `${cap(SOURCES[state.source].said)} in a room with ${ABSORB[state.absorb].said}. ${refl} The tail runs ${fmtSec(t.high)} in the top and ${fmtSec(t.low)} in the low end.`;
}

const PRESET_MOVES = {
    quiet: 'press Turned up and hear the same tone at the same setting come back: the contours flatten as it gets louder',
    loud: 'press Turned down and listen to the bass tone give up 28 phon while nothing on the bench has moved',
    peak: 'switch to 100 Hz and back: the ear gives 3 kHz more than its level and 100 Hz much less',
    hidden: 'press Target off and on. If you cannot tell the difference, the noise has it',
    fromAbove: 'take the Masker level to the top and listen: from above the target it never reaches it',
    oneWall: 'drag Delay from 5 ms up past 25 and listen to the colouration turn into a separate bounce',
    bareRoom: 'press Treated and hear the whole room come down together instead of just the top',
    treatedRoom: 'press Some panels and listen to the top go dead while the low end keeps ringing',
    hearing2022: 'switch to 1 kHz and back: at the top of the range the same level buys far less loudness',
    masking2020: 'move the Masker to Above and raise it: the same noise no longer touches the tone',
    comb2021: 'drag the first notch on the stage to the right and watch Delay shorten with it',
    room2024: 'press Treated and watch the low end come down to meet the top',
    judgeProof: 'press Soundproofing off and on while it plays. Nothing changes, and that is the answer',
    judgeDead: 'take Reverb time back up to 0.8 s and read the line again',
};
export function nextMove(state) {
    if (state.presetId && PRESET_MOVES[state.presetId]) return PRESET_MOVES[state.presetId];
    if (state.station === 'loudness') return state.listen === 'quiet' ? 'press Loud and hear the ends of the spectrum come back' : 'press Quiet and hear them go again';
    if (state.station === 'masking') return state.targetOn ? 'press Target off and on to check the tone is really there' : 'press Target on and raise the Masker level until it goes';
    if (state.proof) return 'press Soundproofing off. Nothing changes, which is the whole of the point';
    if (state.delay <= COLOUR_LIMIT_MS) return `drag Delay past ${COLOUR_LIMIT_MS} ms and hear the colouration become a bounce`;
    return 'press Some panels and listen to the top go dead while the low end rings on';
}

// ---- A-level: the judge ----------------------------------------------------
const SECTION_OF_LAST = {
    preset: null, station: null, source: null, level: null,
    tone: 'tone', listen: 'listen',
    target: 'target', targetOn: 'target', place: 'masker', masker: 'masker',
    delay: 'reflection', reflect: 'reflection', stageComb: 'reflection',
    rt60: 'tail', room: 'tail', stageTail: 'tail',
    absorb: 'walls', proof: 'walls',
};
export const sectionOfLast = (last) => SECTION_OF_LAST[last] || null;

/**
 * The one number the paper wants at this station, named. Which number that is
 * follows the question: a comb question wants the first notch, a treatment
 * question wants the reverberation time.
 */
export function paperNumber(state, section) {
    const r = readings(state);
    const focus = section || (state.task ? TASKS[state.task].focus : null) || defaultSection(state);
    if (state.station === 'loudness') {
        return r.gap >= 0
            ? { value: `${Math.round(r.gap)} phon`, said: `how much ${TONES[state.tone].said} gives up against the 1 kHz tone here` }
            : { value: `${Math.round(-r.gap)} phon`, said: `how much ${TONES[state.tone].said} gains over the 1 kHz tone here` };
    }
    if (state.station === 'masking') return { value: `${Math.round(r.threshold)} dB`, said: 'the level the target now has to reach to be heard past the masker' };
    if (focus === 'reflection') return { value: r.notchText, said: 'the first notch the reflection puts in the response' };
    return { value: fmtSec(state.rt60), said: 'the reverberation time the room is set to' };
}

function settingOf(state, section) {
    const r = readings(state);
    if (section === 'tone') return `${TONES[state.tone].label} at ${fmtDb(TONE_DBFS)}, the same level as every other tone here`;
    if (section === 'listen') return `heard at ${LEVELS[state.listen].phon} dB SPL, the ${LEVELS[state.listen].label.toLowerCase()} contour`;
    if (section === 'target') return `a ${fmtHz(state.target)} tone at ${fmtDb(TARGET_DBFS)}, ${state.targetOn ? 'playing' : 'switched off'}`;
    if (section === 'masker') return `a noise band at ${fmtHz(r.maskerHz)}, ${PLACES[state.place].said}, at ${fmtDb(state.masker)}`;
    if (section === 'reflection') return `one copy ${fmtMs(state.delay)} behind at ${fmtDb(state.reflect)}, ${Math.round(r.depth)} dB between peak and notch`;
    if (section === 'tail') return `${fmtSec(state.rt60)} in the middle, ${state.room} per cent of the room in the mix`;
    return `${ABSORB[state.absorb].said}${state.proof ? ', and soundproofing asked for' : ''}`;
}

export function betterSetting(state, section, grade) {
    if (grade === 'good') return '';
    if (section === 'tone') return 'Compare it against the 1 kHz tone, which reads its own level.';
    if (section === 'listen') return 'Press Loud and read the same tone again.';
    if (section === 'target') return 'Press Target on so there is something to hide.';
    if (section === 'masker') return state.place === 'above' ? 'Move the masker Below the target and it will reach it.' : 'Raise the Masker level until the tone goes.';
    if (section === 'reflection') return state.delay <= COLOUR_LIMIT_MS ? 'Move the surface away, or take the copy further down.' : 'Bring Delay under 25 ms to hear it as a colouration again.';
    if (section === 'tail') return state.rt60 <= 0.45 ? 'Take Reverb time back to about 0.8 s: neutral, not dead.' : 'Bring Reverb time under 1.5 s, or put something absorbent on the walls.';
    if (state.proof) return 'Switch Soundproofing off and name absorption or diffusion instead.';
    return state.absorb === 'bare' ? 'Press Some panels, then Treated, and say what each one reaches.' : 'Add the bass traps: press Treated and watch the low end follow the top down.';
}

export function judge({ state, last }) {
    const task = state.task ? TASKS[state.task] : null;
    const v = verdict(state);
    const all = judgeAll(state);
    // A control belonging to another station was the last thing touched:
    // the line goes back to the summary rather than judging something that is
    // not on screen.
    const touched = sectionOfLast(last);
    const section = touched && all[touched] ? touched : null;

    // A paper's task: the scheme's own points, with its year.
    if (task && state.task !== 'judge') {
        const focus = section || (all[task.focus] ? task.focus : null) || defaultSection(state);
        const num = paperNumber(state, focus);
        const here = all[focus];
        return [
            seg(3, `${task.name}, as set: ${settingOf(state, focus)}. ${cap(num.said)}: ${num.value}.`),
            seg(4, `${v.ok ? 'As directed' : 'Not yet'}: ${task.scheme} (${task.cite}).${!v.ok && here && here.grade !== 'good' ? ` ${betterSetting(state, focus, here.grade)}` : ''}`),
        ];
    }

    // The Q6 idiom: one thing at this station, judged for the job. The summary
    // lists parts without a verb, so no count has to agree with anything.
    if (!section) {
        const ids = Object.keys(all);
        const names = (list) => (list.length < 2 ? SECTIONS[list[0]].name : `${list.slice(0, -1).map((id) => SECTIONS[id].name).join(', ')} and ${SECTIONS[list[list.length - 1]].name}`);
        const groups = ['poor', 'partly', 'good']
            .map((g) => ({ g, ids: ids.filter((id) => all[id].grade === g) }))
            .filter((x) => x.ids.length)
            .map((x) => `${names(x.ids)} ${GRADE_TAIL[x.g]}`);
        const worst = ids.find((id) => all[id].grade === 'poor') || ids.find((id) => all[id].grade === 'partly');
        return [
            seg(3, `${cap(STATIONS[state.station].said)}, part by part: ${groups.join(', ')}.`),
            seg(4, worst ? `${cap(SECTIONS[worst].name)} first: ${all[worst].why}. ${betterSetting(state, worst, all[worst].grade)}` : 'Every part of this station suits the job. Touch a control and the line judges that one.'),
        ];
    }
    const g = all[section];
    const better = betterSetting(state, section, g.grade);
    return [
        seg(3, `${SECTIONS[section].label}: ${settingOf(state, section)}.`),
        seg(4, `${cap(GRADE_WORD[g.grade])} the job: ${g.why}.${better ? ` ${better}` : ''}${g.cite ? ` ${g.cite}` : ''}`),
    ];
}

const defaultSection = (state) => (state.station === 'loudness' ? 'tone' : state.station === 'masking' ? 'masker' : 'walls');

// ---- Extension: the machine ------------------------------------------------
const CONVOLUTION = 'The tail is noise under an exponential, three bands wide, stamped on every sample of the source by a convolver.';

export function open({ state, last }) {
    const section = sectionOfLast(last);
    const r = readings(state);
    if (state.station === 'loudness') {
        if (section === 'listen') {
            return `One oscillator, one gain, one output. The contours are ISO 226's own formula, and its af exponent is what closes the gap as the level rises: ${Math.round(r.gap)} phon here against the 1 kHz tone.`;
        }
        return `One oscillator into one gain into the destination, at ${fmtDb(TONE_DBFS)} whatever the chip says. The bench reads full scale as ${SPL_AT_FULL_SCALE} dB SPL so a level can be spoken about in the units the contours use: ${fmtHz(state.tone)} lands at ${Math.round(r.phon)} phon.`;
    }
    if (state.station === 'masking') {
        if (section === 'masker') {
            return `White noise through a band-pass ${Math.round(r.bandwidth)} Hz wide, which is one critical band at ${fmtHz(r.maskerHz)}. The spread is 27 dB per Bark downward and ${Math.abs(Math.round((r.threshold - state.masker) / Math.max(Math.abs(r.barks), 0.01)))} dB per Bark upward at this level, which is why loud and low travels furthest.`;
        }
        return `Two sources into one output: noise through a band-pass ${Math.round(r.bandwidth)} Hz wide, and an oscillator at ${fmtHz(state.target)}. The bench never removes the tone; it only raises what the tone has to beat, to ${Math.round(r.threshold)} dB.`;
    }
    if (section === 'reflection') {
        return `The stem splits: one path straight through, one through a delay of ${fmtMs(state.delay)}, and they are summed. One plus a copy at ${fmtDb(state.reflect)} cancels wherever the copy is half a cycle late, so notches land at ${r.notchText} and every ${fmtHz(2 * r.notch)} above it.`;
    }
    if (section === 'tail') {
        const t = bandTimes(state.rt60, state.absorb);
        return `${CONVOLUTION} Each band runs under exp(-ln 1000 t / T), which is exactly 60 dB down at T: ${fmtSec(t.low)} below ${fmtHz(BANDS.low.hz)}, ${fmtSec(t.mid)} in the middle, ${fmtSec(t.high)} above ${fmtHz(2000)}.`;
    }
    if (section === 'walls') {
        if (state.proof) return `${CONVOLUTION} Soundproofing writes nothing to this graph at all: no node is added, no coefficient changes. It is not modelled because it is not an acoustic treatment.`;
        return `${CONVOLUTION} The walls chip sets three decay times at once, and the widest gap between them is ${evenness(state.rt60, state.absorb).toFixed(1)} to one: one room when that number is near one, two rooms when it is not.`;
    }
    return `${CONVOLUTION} Before it, a DelayNode ${fmtMs(state.delay)} long and a sum: that is the reflection. After it, ${fmtSec(state.rt60)} of answer in the convolver. Same stem, two jobs, and only the first can cancel anything.`;
}

// ---- the picture's own name ------------------------------------------------
// Mike, 12 September 2026, looking at this bench for the first time: "The
// visuals, as far as the graphs are concerned, I don't really follow what
// that is." The three station pictures are the textbook figures, and nothing
// on the stage said so. Each picture now carries a plain-words title and one
// line saying how to read it, drawn above the picture itself rather than in
// the drawer or a tooltip, with the axes named in words at Core. The Room at
// Core is two pictures, so it carries two of these.
//
// Law 24's bar applies: every line here reads whole at 1280, so none runs
// past 107 characters, and the depth test pins each one.
export const PICTURES = {
    loudness: {
        core: [{
            title: 'Equal-loudness curves',
            caption: 'Frequency across, level up the side. Each curve joins the levels that sound equally loud.',
        }],
        alevel: [{
            title: 'Your answer in parts: the tone, the level it is played at, how loud it seems',
            caption: 'One box for each thing the examiner can see, with a bar saying how well it suits the job.',
        }],
        extension: [{
            title: 'The signal path: one oscillator, one gain, one output, then the ear',
            caption: 'Each box is one step in the order the sound takes. The last one is not a node, it is you.',
        }],
    },
    masking: {
        core: [{
            title: 'The masker\'s skirt: what the noise hides',
            caption: 'Frequency across, level up the side. Under the skirt nothing is heard. The upright line is your tone.',
        }],
        alevel: [{
            title: 'Your answer in parts: the target, the masker, and what is heard',
            caption: 'One box for each thing the examiner can see, with a bar saying how well it suits the job.',
        }],
        extension: [{
            title: 'The signal path: a band of noise, a tone, and one output',
            caption: 'Each box is one node in the graph, drawn in the order the sound passes through them.',
        }],
    },
    room: {
        core: [
            {
                title: 'The comb: what one reflection takes out of the sound',
                caption: 'Frequency across, level up the side. Each dip is a frequency the late copy cancels.',
            },
            {
                title: 'How each band of the room dies away',
                caption: 'Time across, level up the side. Each line is one band falling to the marked floor.',
            },
        ],
        alevel: [{
            title: 'The session as a plan: the source, the mic, the walls, the room next door',
            caption: 'One box for each thing the examiner can see, with a bar saying how well it suits the job.',
        }],
        extension: [{
            title: 'The signal path: split and summed for the comb, then into the convolver',
            caption: 'Each box is one node, and the tail drawn beneath is the answer the convolver holds.',
        }],
    },
};

/** The picture or pictures on the stage at this station and this level. */
export const pictures = (station, depth) => PICTURES[station]?.[depth] || PICTURES[station]?.core || [];
