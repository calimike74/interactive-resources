import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readPassParam, verifyMemberPass } from '../lib/memberPass.js';

test('readPassParam extracts ?pass= from a URL', () => {
    assert.equal(
        readPassParam('https://resources.musictechstudio.co.uk/some-page?pass=abc123'),
        'abc123',
    );
});

test('readPassParam extracts ?pass= alongside other params, in any position', () => {
    assert.equal(
        readPassParam('https://resources.musictechstudio.co.uk/some-page?from=studio&pass=xyz'),
        'xyz',
    );
});

test('readPassParam returns null when pass is absent', () => {
    assert.equal(
        readPassParam('https://resources.musictechstudio.co.uk/some-page?from=studio'),
        null,
    );
});

test('readPassParam returns null for an unparseable href rather than throwing', () => {
    assert.equal(readPassParam('not a url'), null);
    assert.equal(readPassParam(''), null);
    assert.equal(readPassParam(undefined), null);
});

// Every test swaps global.fetch for a stub and restores whatever was there
// before, so these never leak into other test files sharing the process.
async function withFetch(impl, fn) {
    const original = global.fetch;
    global.fetch = impl;
    try {
        return await fn();
    } finally {
        global.fetch = original;
    }
}

test('verifyMemberPass resolves false without calling fetch when pass is empty', async () => {
    let called = false;
    await withFetch(
        async () => {
            called = true;
            return { ok: true, json: async () => ({ valid: true }) };
        },
        async () => {
            assert.equal(await verifyMemberPass(''), false);
            assert.equal(await verifyMemberPass(null), false);
            assert.equal(await verifyMemberPass(undefined), false);
        },
    );
    assert.equal(called, false, 'a falsy pass must never even attempt the network call');
});

test('verifyMemberPass posts to the dashboard verify endpoint and resolves true on {valid:true}', async () => {
    let capturedUrl;
    let capturedOptions;
    await withFetch(
        async (url, options) => {
            capturedUrl = url;
            capturedOptions = options;
            return { ok: true, json: async () => ({ valid: true }) };
        },
        async () => {
            const result = await verifyMemberPass('some-token.deadbeef');
            assert.equal(result, true);
        },
    );
    assert.equal(
        capturedUrl,
        'https://grades.musictechstudio.co.uk/api/member/resources-pass?action=verify',
    );
    assert.equal(capturedOptions.method, 'POST');
    assert.equal(capturedOptions.headers['Content-Type'], 'application/json');
    assert.deepEqual(JSON.parse(capturedOptions.body), { pass: 'some-token.deadbeef' });
});

test('verifyMemberPass resolves false on {valid:false}', async () => {
    await withFetch(
        async () => ({ ok: true, json: async () => ({ valid: false }) }),
        async () => {
            assert.equal(await verifyMemberPass('bad-token'), false);
        },
    );
});

test('verifyMemberPass resolves false on a non-OK HTTP response', async () => {
    await withFetch(
        async () => ({ ok: false, json: async () => ({ valid: true }) }),
        async () => {
            assert.equal(await verifyMemberPass('token'), false);
        },
    );
});

test('verifyMemberPass resolves false, never throws, on a network error', async () => {
    await withFetch(
        async () => {
            throw new Error('offline');
        },
        async () => {
            assert.equal(await verifyMemberPass('token'), false);
        },
    );
});

test('verifyMemberPass resolves false, never throws, on an unparseable JSON body', async () => {
    await withFetch(
        async () => ({
            ok: true,
            json: async () => {
                throw new SyntaxError('bad json');
            },
        }),
        async () => {
            assert.equal(await verifyMemberPass('token'), false);
        },
    );
});
