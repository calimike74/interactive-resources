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
