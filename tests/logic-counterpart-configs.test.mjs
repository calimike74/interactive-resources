import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import gateConfig from '../lib/image-explorer-configs/gate.js';

// WO-10: Logic Pro counterparts. This guards the per-DAW config model —
// each `logic` block must be a complete, renderable peer of the Ableton
// default: real screenshot on disk (lowercase path — Vercel is
// case-sensitive, macOS isn't), unique hotspot ids, sane non-overlapping
// zone strips, and full teaching content per hotspot.

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function assertDawBlock(block, label) {
    assert.ok(block.imageSrc, `${label}: imageSrc`);
    assert.equal(block.imageSrc, block.imageSrc.toLowerCase(), `${label}: imageSrc must be lowercase`);
    assert.ok(existsSync(join(root, 'public', block.imageSrc)), `${label}: screenshot ${block.imageSrc} must exist in public/`);
    assert.ok(block.imageAlt && block.imageAlt.length > 20, `${label}: descriptive imageAlt`);
    assert.ok(block.daw, `${label}: daw name`);
    assert.ok(block.dawNote, `${label}: dawNote`);

    const ids = block.hotspots.map((h) => h.id);
    assert.equal(new Set(ids).size, ids.length, `${label}: hotspot ids unique`);

    const sorted = [...block.hotspots].sort((a, b) => a.zone.left - b.zone.left);
    let prevEnd = -1;
    for (const h of sorted) {
        assert.ok(h.zone.left >= 0 && h.zone.left + h.zone.width <= 100, `${label}/${h.id}: zone within 0-100`);
        assert.ok(h.zone.left > prevEnd, `${label}/${h.id}: zones must not overlap`);
        prevEnd = h.zone.left + h.zone.width;
        assert.ok(h.name && h.matchClue && h.description, `${label}/${h.id}: name/matchClue/description`);
        assert.ok(Array.isArray(h.questions) && h.questions.length >= 2, `${label}/${h.id}: at least two Q&As`);
        for (const qa of h.questions) {
            assert.ok(qa.q && qa.a && qa.a.length > 60, `${label}/${h.id}: substantive answers`);
        }
    }
}

test('the Ableton gate block still stands (no regression)', () => {
    assertDawBlock(gateConfig, 'gate/ableton');
});

test('the gate has a complete Logic Pro counterpart block', () => {
    assert.ok(gateConfig.logic, 'gate config must carry a logic block');
    assertDawBlock(gateConfig.logic, 'gate/logic');
    assert.equal(gateConfig.logic.daw, 'Logic Pro');
});

test('the Logic gate teaches the differences, not device sameness', () => {
    const text = JSON.stringify(gateConfig.logic);
    assert.ok(/[Hh]ysteresis/.test(text), 'Hysteresis (Logic naming for Return) must be taught');
    assert.ok(/[Dd]ucker/.test(text), "Logic's Ducker mode must be named");
    assert.ok(/[Ll]ookahead/.test(text), "Logic's Lookahead must be taught");
    assert.ok(/chatter/.test(text), 'the anti-chatter teaching point survives');
});

test('every {{X}} cross-reference in the Logic block resolves to a real label', () => {
    const labels = new Set(gateConfig.logic.hotspots.map((h) => h.label));
    const refs = JSON.stringify(gateConfig.logic).match(/\{\{([A-Z])\}\}/g) || [];
    for (const r of refs) {
        const letter = r.slice(2, 3);
        assert.ok(labels.has(letter), `cross-reference ${r} must point at an existing hotspot label`);
    }
});
