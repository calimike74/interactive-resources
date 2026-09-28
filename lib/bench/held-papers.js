// The held-paper switch for the benches.
//
// A past paper the school is sitting as an internal exam is held: its
// questions, schemes and answers stay out of every bench until it has been
// sat. The member site has its own switch (grades-dashboard,
// lib/held-papers.js); this is the same idea for the Explore benches.
//
// Each bench keeps its raw TASKS and PRESETS (ALL_TASKS, ALL_PRESETS) and
// exports the pupil-facing lists through `hideHeld`, so emptying HELD
// brings every held item back with no other edit.
//
// A row in HELD names a paper by year and level ('A' or 'AS') and, for
// the A level, its components (3 = 9MT0/03, 4 = 9MT0/04). An AS paper is a
// different paper and is never held by an A-level row.

export const HELD = [
    {
        year: 2019,
        level: 'A',
        components: [3, 4],
        why: 'Upper Sixth November internal exams, week of 3 Nov 2026',
        release: 'the day after each component is sat',
    },
];

// Held items that carry no parsable cite, named by bench and id, each with
// the paper it belongs to. A task id or a preset id; a preset whose task
// is held is hidden with it.
export const HELD_ITEMS = [
    // 9MT0/04 2019 Q2(c): the drum map on the wrong sounds. The task's
    // `source` reads '2019 Q2(c); ...', which parseCite reads too; listed
    // here as well so the hold does not rest on that string's wording.
    { bench: 'midi', id: 'map', paper: { year: 2019, level: 'A', component: 4 } },
    // 9MT0/04 2019 Q4(c)(ii): 294 Hz an octave up.
    { bench: 'scope', id: 'octave', paper: { year: 2019, level: 'A', component: 4 } },
    // 9MT0/04 2019 Q6: evaluate a pad patch, section by section. The
    // bench's own faulty pad patch rehearses that essay directly.
    { bench: 'synth', id: 'judgePad', paper: { year: 2019, level: 'A', component: 4 } },
    // 9MT0/04 2019 Q5(d): a gate that also cut the vocal's reverb, because
    // the reverb was an insert. The Reverb bench's Teacher tab tells it.
    { bench: 'reverb', id: 'gatedVocalAux', paper: { year: 2019, level: 'A', component: 4 } },
    // 9MT0/04 2019 Q1: the noise gate's threshold question, printed as a
    // practice prompt in the Dynamics bench's reading.
    { bench: 'comp', id: 'gateThresholdPrompt', paper: { year: 2019, level: 'A', component: 4 } },
];

// '2019 A Q5(a)' → { year: 2019, level: 'A', component: null }
// '2019 C3 Q3(a)' → { year: 2019, level: 'A', component: 3 }
// '2019 AS Q5(a)' → { year: 2019, level: 'AS', component: null }
// '2019 Q2(c); ...' → { year: 2019, level: 'A', component: null } (the 9MT0/04 style, no level)
// Only the leading cite counts; anything that does not start with a
// four-digit year (an audio source such as 'vocal') is not a cite.
export function parseCite(cite) {
    if (typeof cite !== 'string') return null;
    const m = cite.trim().match(/^((?:19|20)\d\d)\b\s*(AS|A|C3|C4)?\b\s*(.*)$/);
    if (!m) return null;
    const year = Number(m[1]);
    const tag = m[2] || null;
    const rest = m[3] || '';
    if (!tag && !/^Q\d/.test(rest)) return null;
    if (tag === 'AS') return { year, level: 'AS', component: null };
    if (tag === 'C3' || tag === 'C4') return { year, level: 'A', component: Number(tag[1]) };
    return { year, level: 'A', component: null };
}

// Is this paper held? An A-level paper with no component counts as held
// when any component of that year is held.
export function isPaperHeld(paper, held = HELD) {
    if (!paper) return false;
    return held.some((h) => {
        if (h.year !== paper.year || h.level !== paper.level) return false;
        if (h.level !== 'A') return true;
        if (paper.component == null) return true;
        return (h.components || []).includes(paper.component);
    });
}

export const isCiteHeld = (cite, held = HELD) => isPaperHeld(parseCite(cite), held);

const citeOf = (item) => (item ? (item.cite ?? item.source) : null);

// Is this item (a task, a preset, or a named piece of static text) held
// on this bench?
export function isHeld(bench, item, { tasks = {}, held = HELD, items = HELD_ITEMS } = {}) {
    if (!item) return false;
    const listed = (id) => items.some((x) => x.bench === bench && x.id === id && isPaperHeld(x.paper, held));
    if (listed(item.id)) return true;
    if (isCiteHeld(citeOf(item), held)) return true;
    const task = item.task && typeof item.task === 'string' ? tasks[item.task] : null;
    if (task && (listed(task.id ?? item.task) || isCiteHeld(citeOf(task), held))) return true;
    return false;
}

// A named piece of static text (an id in HELD_ITEMS) on a bench.
export const isTextHeld = (bench, id, held = HELD) => isHeld(bench, { id }, { held });

// The pupil-facing list: an array of presets, or an object of tasks.
export function hideHeld(bench, list, opts = {}) {
    if (Array.isArray(list)) return list.filter((item) => !isHeld(bench, item, opts));
    return Object.fromEntries(Object.entries(list).filter(([, item]) => !isHeld(bench, item, opts)));
}
