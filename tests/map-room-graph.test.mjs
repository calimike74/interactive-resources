import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const graph = JSON.parse(readFileSync('lib/map-room/graph.json', 'utf8'));
const routes = JSON.parse(readFileSync('lib/map-room/routes/exam-routes.json', 'utf8'));
const tour = JSON.parse(readFileSync('lib/map-room/tours/whole-course.json', 'utf8'));

const ids = new Set(graph.nodes.map((n) => n.id));

test('no edge points at a node that does not exist', () => {
    for (const e of graph.edges) {
        assert.ok(ids.has(e.from), `edge from missing node: ${e.from}`);
        assert.ok(ids.has(e.to), `edge to missing node: ${e.to}`);
    }
});

test('every exam-route focus id exists in the graph', () => {
    for (const r of routes.routes) {
        for (const s of r.steps) {
            for (const id of s.focus) {
                assert.ok(ids.has(id), `route ${r.id} focuses missing node: ${id}`);
            }
        }
    }
});

test('every tour focus id exists in the graph', () => {
    for (const b of tour.beats) {
        for (const id of b.focus) {
            assert.ok(ids.has(id), `tour beat focuses missing node: ${id}`);
        }
    }
});

test('every concept node has at least one parent edge', () => {
    const hasParent = new Set(graph.edges.filter((e) => e.kind === 'parent').map((e) => e.from));
    for (const n of graph.nodes) {
        if (n.kind !== 'concept') continue;
        assert.ok(hasParent.has(n.id), `orphan concept node: ${n.id} (${n.label})`);
    }
});

// --- the curated swap (Task 2 onward) ---

const FURNITURE = [
    'recall', 'abbreviation expansion', 'evaluation/justification',
    'hardware identification from image', 'specification comparison',
    'mark allocation', 'technical skills', 'industry standards',
    'past paper scenarios', 'multiple lesson references',
    'how it works', 'what it does', 'result', 'typical use', 'purpose',
    'why it matters', 'settings', 'tool', 'detection',
];

test('no assessment furniture or prose headings survive as nodes', () => {
    const bad = graph.nodes
        .filter((n) => FURNITURE.includes(n.label.trim().toLowerCase()))
        .map((n) => n.label);
    assert.deepEqual(bad, [], `scraped furniture still present: ${bad.join(', ')}`);
});

test('concept nodes carry a blurb for the index card', () => {
    const missing = graph.nodes.filter((n) => n.kind === 'concept' && !n.blurb?.trim());
    assert.equal(missing.length, 0, `${missing.length} concept nodes have no blurb`);
});

test('genuine shared ideas are ONE node with parent edges to each home', () => {
    const parentsOf = (id) =>
        graph.edges.filter((e) => e.kind === 'parent' && e.from === id).map((e) => e.to);
    for (const label of ['Haas effect', 'Comb filtering', 'Early reflections',
                         'Time-stretching', 'Warp markers', 'Headroom',
                         'Low-pass filter', 'File size calculations']) {
        const hits = graph.nodes.filter((n) => n.label === label);
        assert.equal(hits.length, 1, `"${label}" should be one hub node, found ${hits.length}`);
        assert.ok(parentsOf(hits[0].id).length >= 2,
            `"${label}" should belong to 2+ topics`);
    }
});

test('false friends stay SEPARATE nodes — same word, different concept', () => {
    // The compiler's norm() strips parentheses, so these would auto-merge.
    const drivers = graph.nodes.filter((n) => n.label.toLowerCase().startsWith('drivers'));
    assert.equal(drivers.length, 2, 'ASIO drivers and speaker drivers must not merge');

    const phantom = graph.nodes.filter((n) => n.label.toLowerCase().startsWith('phantom'));
    assert.equal(phantom.length, 2, 'phantom power and phantom centre must not merge');

    const quant = graph.nodes.filter((n) => /quantis/i.test(n.label));
    assert.ok(quant.length >= 3, 'MIDI quantise and digital quantisation must not merge');
});

test('every topic keeps its curated children', () => {
    const curated = JSON.parse(readFileSync(
        '/Users/mikelehnert/Obsidian/Professional/Planning-and-Admin/Overnight-Runs/2026-08-04/topic-subtopics-curated.json',
        'utf8'));
    const labels = new Set(graph.nodes.map((n) => n.label));
    for (const [topicId, entry] of Object.entries(curated)) {
        for (const s of entry.subtopics) {
            assert.ok(labels.has(s.label), `${topicId}: missing curated subtopic "${s.label}"`);
        }
    }
});

/* A topic node used to ship with blurb: "" — clicking Sampling, one of the
 * 23 headings the whole course hangs off, raised a card with a name and a
 * link and nothing else. These guard the card's content. */

const topics = graph.nodes.filter((n) => n.kind === 'topic');

test('every topic says what it is and what it teaches', () => {
    for (const t of topics) {
        assert.ok(t.blurb && t.blurb.length > 40,
            `${t.parent} ${t.label} has no usable blurb`);
        assert.ok(Array.isArray(t.teaches) && t.teaches.length >= 3 && t.teaches.length <= 4,
            `${t.parent} ${t.label} should teach 3-4 things, got ${t.teaches?.length}`);
        for (const line of t.teaches) {
            assert.ok(line.length >= 12 && line.length <= 52,
                `${t.parent} bullet is the wrong length: "${line}"`);
        }
    }
});

test('no equations reach the screen', () => {
    // House rule: the tools teach sound first — the maths stays off the node.
    const maths = /[=×÷^√]|\d+\s*[+\-*/]\s*\d+/;
    for (const t of topics) {
        assert.ok(!maths.test(t.blurb), `${t.parent} blurb shows working: ${t.blurb}`);
        for (const line of t.teaches) {
            assert.ok(!maths.test(line), `${t.parent} bullet shows working: ${line}`);
        }
    }
});

test('topic copy is UK English', () => {
    const american = /\b\w*(?:analyz|coloriz|optimiz|normaliz|synthesiz|emphasiz)\w*\b|\bcolor\b|\bcenter\b|\bmeters\b(?! )/i;
    for (const t of topics) {
        for (const s of [t.blurb, ...t.teaches]) {
            assert.ok(!american.test(s), `${t.parent} uses US spelling: "${s}"`);
        }
    }
});

/* Every topic leads somewhere. A card that raises a name and no way out is
 * the state this replaced, so these guard the destinations rather than trust
 * a hand-kept list. */

const topicIds = new Set(
    [...readFileSync('lib/topics.js', 'utf8').matchAll(/id:\s*'([^']+)'/g)].map((m) => m[1]));
const resourceIds = new Set(
    readdirSync('lib/resources').filter((f) => f.endsWith('.js') && f !== 'index.js')
        .map((f) => f.replace(/\.js$/, '')));

test('every topic has a destination', () => {
    for (const t of topics) {
        assert.ok(t.destination, `${t.parent} ${t.label} has nowhere to go`);
        assert.ok(['topic', 'bench', 'members'].includes(t.destination.kind),
            `${t.parent} has an unknown destination kind: ${t.destination.kind}`);
    }
});

test('a link destination points at something this repo actually serves', () => {
    for (const t of topics) {
        const d = t.destination;
        if (d.kind === 'members') continue;
        assert.ok(d.href, `${t.parent} is a ${d.kind} with no href`);
        if (d.href.startsWith('http')) {
            assert.match(d.href, /^https:\/\//, `${t.parent} external link is not https`);
            continue;
        }
        const slug = d.href.replace(/^\//, '');
        if (slug.startsWith('topic/')) {
            assert.ok(topicIds.has(slug.slice('topic/'.length)),
                `${t.parent} points at /${slug}, which lib/topics.js does not define`);
        } else {
            assert.ok(resourceIds.has(slug),
                `${t.parent} points at /${slug}, which lib/resources has no file for`);
        }
    }
});

test('a bench says what it is, a members door says what is behind it', () => {
    for (const t of topics) {
        const d = t.destination;
        if (d.kind === 'bench') {
            assert.ok(d.label && d.verb, `${t.parent} bench needs a label and a verb`);
            assert.match(d.verb, /^(Open|Take)$/, `${t.parent} has an odd verb: ${d.verb}`);
        }
        if (d.kind === 'members') {
            for (const k of ['chapters', 'papers', 'traps']) {
                assert.ok(Number.isInteger(d[k]) && d[k] > 0,
                    `${t.parent} members door has no real ${k} count`);
            }
        }
    }
});
