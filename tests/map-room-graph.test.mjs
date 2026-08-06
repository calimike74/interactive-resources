import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

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
