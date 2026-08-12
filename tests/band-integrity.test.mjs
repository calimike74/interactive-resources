import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getAllTopicDefs, getTopic } from '../lib/topics.js';
import { getResource, getAllResources } from '../lib/resources/index.js';
import { SPEC_TOPICS, NON_SPEC_TOPICS, isValidTopic } from '../lib/spec-topics.js';

const NON_SPEC = new Set(NON_SPEC_TOPICS);

// WO-02: the defect this test exists to catch — lib/topics.js hand-typed its
// own specRef/name strings and hardcoded resourceIds arrays, so a band's
// display drifted from a resource's own (already-correct) `topic:` field and
// nobody noticed. Seven resources shipped silently mis-filed. This is the
// test that would have caught all seven.

test('every band resource\'s registry topic matches the band\'s own spec label', () => {
    for (const band of getAllTopicDefs()) {
        const bandLabel = `${band.specRef} ${band.name}`;
        // The 1.0 General Skills band is the deliberate shared UI home for
        // every cross-cutting, non-spec bucket (Exam Skills, Production
        // Analysis) — by design, not a mis-filing. Out of WO-02 scope, which
        // is the 26 real spec-numbered topics.
        if (NON_SPEC.has(bandLabel)) continue;
        for (const resourceId of band.resourceIds) {
            const resource = getResource(resourceId);
            if (!resource) continue; // unregistered id — a different concern
            const matchesOwnTopic = resource.topic === bandLabel;
            const matchesRelated = (resource.relatedTopics || []).includes(bandLabel);
            assert.ok(
                matchesOwnTopic || matchesRelated,
                `band "${band.id}" (${bandLabel}) lists resource "${resourceId}", but that resource's ` +
                `own registry topic is "${resource.topic}" — not this band and not a declared relatedTopics cross-listing.`
            );
        }
    }
});

// Cross-check the other direction too: a resource whose own topic field
// names a band should actually be reachable from that band (or explicitly
// cross-listed), not simply left in whatever band it historically sat in.
test('every resource is reachable from the band matching its own topic field', () => {
    const bandByLabel = new Map(
        getAllTopicDefs().map((band) => [`${band.specRef} ${band.name}`, band])
    );
    for (const resource of getAllResources()) {
        const home = bandByLabel.get(resource.topic);
        if (!home) continue; // no band models this label yet (e.g. an umbrella or 3.x label) — not this test's concern
        assert.ok(
            home.resourceIds.includes(resource.id),
            `resource "${resource.id}" has topic "${resource.topic}", but band "${home.id}" ` +
            `(which is exactly that spec label) does not list it in resourceIds.`
        );
    }
});

test('no band displays a name that differs from lib/spec-topics.js', () => {
    for (const band of getAllTopicDefs()) {
        const label = `${band.specRef} ${band.name}`;
        assert.ok(
            isValidTopic(label),
            `band "${band.id}" displays "${label}", which is not an exact spec-topics.js label — ` +
            `derive the band's specRef/name from spec-topics.js, don't hand-type a marketing variant.`
        );
    }
});

test('every C4 spec topic has a visible band (Mike\'s ruling 2026-08-12)', () => {
    const labels = new Set(getAllTopicDefs().map((b) => `${b.specRef} ${b.name}`));
    // 3.x (recording history / eras) is out of WO-02 scope — it ships as the
    // separate /recording-history playlist, not a topic band.
    const inScope = SPEC_TOPICS.filter((t) => !t.startsWith('3.'));
    for (const label of inScope) {
        assert.ok(labels.has(label), `no band displays spec topic "${label}" — every C4 spec topic must have a visible band`);
    }
});

test('the invented "Recording & Production" band is gone', () => {
    assert.equal(getTopic('recording'), undefined);
    for (const band of getAllTopicDefs()) {
        assert.notEqual(band.name, 'Recording & Production');
    }
});

test('the fake "1.1 Recording & Production" band is replaced by the real 1.1 Software and Hardware band', () => {
    const band = getAllTopicDefs().find((b) => b.specRef === '1.1');
    assert.ok(band, 'no band displays spec number 1.1');
    assert.equal(band.name, 'Software and Hardware');
});

test('stereo-panning is reachable under a 1.10 Stereo band', () => {
    const band = getAllTopicDefs().find((b) => b.specRef === '1.10' && b.name === 'Stereo');
    assert.ok(band, 'no "1.10 Stereo" band exists');
    assert.ok(band.resourceIds.includes('stereo-panning'), '1.10 Stereo band does not list stereo-panning');
});

test('every empty band carries an honest in-build state, not a silent hole', () => {
    for (const band of getAllTopicDefs()) {
        if (band.resourceIds.length > 0) continue;
        assert.equal(band.status, 'in-build', `band "${band.id}" has zero resources but no in-build status`);
        assert.ok(
            Array.isArray(band.specSummary) && band.specSummary.length > 0,
            `in-build band "${band.id}" has no specSummary — the honest empty state needs something to show`
        );
        assert.ok(
            typeof band.nearestLiveTopicId === 'string' && band.nearestLiveTopicId.length > 0,
            `in-build band "${band.id}" has no nearestLiveTopicId pointer`
        );
        const target = getTopic(band.nearestLiveTopicId);
        assert.ok(target, `in-build band "${band.id}" points at nearestLiveTopicId "${band.nearestLiveTopicId}", which does not exist`);
        assert.ok(
            target.resourceIds.length > 0,
            `in-build band "${band.id}" points at "${band.nearestLiveTopicId}", which is itself empty — the pointer must lead somewhere live`
        );
    }
});

test('no live band is mislabelled in-build', () => {
    for (const band of getAllTopicDefs()) {
        if (band.resourceIds.length > 0) {
            assert.notEqual(band.status, 'in-build', `band "${band.id}" has resources but is still marked in-build`);
        }
    }
});
