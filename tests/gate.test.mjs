import { test } from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import {
    isGateEnabled,
    getGateDigest,
    isGateActive,
    isResourceExempt,
    digestPasscode,
    checkPasscode,
    deriveToken,
    isTokenValid,
    SALT,
} from '../lib/gate.js';

const subtle = webcrypto.subtle;

// Every test that touches env vars saves and restores them, so tests can run
// in any order and never leak state into each other or into other test files
// sharing the same process.
// NB: fn's return value may be a pending Promise (most callers here are
// async). A plain try/finally restores the env synchronously as soon as
// fn() is *called*, not once its internal awaits resolve — which would
// undo the env change while checkPasscode/isTokenValid are still mid-flight
// and reading process.env after their own await points. So this only
// restores once any returned promise has actually settled.
function withEnv(vars, fn) {
    const saved = {};
    for (const key of Object.keys(vars)) saved[key] = process.env[key];
    for (const [key, value] of Object.entries(vars)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
    }
    const restore = () => {
        for (const key of Object.keys(vars)) {
            if (saved[key] === undefined) delete process.env[key];
            else process.env[key] = saved[key];
        }
    };

    let result;
    try {
        result = fn();
    } catch (err) {
        restore();
        throw err;
    }

    if (result && typeof result.then === 'function') {
        return result.then(
            (value) => { restore(); return value; },
            (err) => { restore(); throw err; },
        );
    }

    restore();
    return result;
}

test('gate is off by default — no env vars set', () => {
    withEnv({ NEXT_PUBLIC_GATE_ENABLED: undefined, NEXT_PUBLIC_GATE_DIGEST: undefined }, () => {
        assert.equal(isGateEnabled(), false);
        assert.equal(getGateDigest(), '');
        assert.equal(isGateActive(), false, 'a fresh checkout with no env vars must never gate anything');
    });
});

test('flag alone, with no digest configured, stays inert', () => {
    withEnv({ NEXT_PUBLIC_GATE_ENABLED: 'true', NEXT_PUBLIC_GATE_DIGEST: '' }, () => {
        assert.equal(isGateActive(), false, 'flipping the flag without a digest must not lock anyone out');
    });
});

test('digest alone, with the flag not set to "true", stays inert', () => {
    withEnv({ NEXT_PUBLIC_GATE_ENABLED: '', NEXT_PUBLIC_GATE_DIGEST: 'deadbeef' }, () => {
        assert.equal(isGateActive(), false, 'a stray digest without the flag must not lock anyone out');
    });
});

test('gate is active only when both the flag is exactly "true" and a digest is set', () => {
    withEnv({ NEXT_PUBLIC_GATE_ENABLED: 'true', NEXT_PUBLIC_GATE_DIGEST: 'deadbeef' }, () => {
        assert.equal(isGateActive(), true);
    });
});

test('the flag only reads the literal string "true" — not "1", "yes", truthy strings', () => {
    withEnv({ NEXT_PUBLIC_GATE_ENABLED: '1', NEXT_PUBLIC_GATE_DIGEST: 'deadbeef' }, () => {
        assert.equal(isGateEnabled(), false);
        assert.equal(isGateActive(), false);
    });
});

test('free-set resources are exempt from the gate', () => {
    // Cross-checked against lib/access.js FREE_RESOURCES — this file must
    // never fork its own copy of that list.
    assert.equal(isResourceExempt('octave-period-trainer'), true);
    assert.equal(isResourceExempt('subtractive-synth-explorer'), true);
});

test('non-free resources are not exempt', () => {
    assert.equal(isResourceExempt('patch-bay-simulator'), false);
    assert.equal(isResourceExempt('compressor-explorer'), false);
});

test('digestPasscode is deterministic and hex-encoded SHA-256 (64 hex chars)', async () => {
    const a = await digestPasscode('autumn-2026', subtle);
    const b = await digestPasscode('autumn-2026', subtle);
    assert.equal(a, b);
    assert.match(a, /^[0-9a-f]{64}$/);
});

test('digestPasscode is salted — differs from a bare SHA-256 of the passcode', async () => {
    const salted = await digestPasscode('autumn-2026', subtle);
    const bareBuf = await subtle.digest('SHA-256', new TextEncoder().encode('autumn-2026'));
    const bare = Array.from(new Uint8Array(bareBuf)).map((b) => b.toString(16).padStart(2, '0')).join('');
    assert.notEqual(salted, bare);
    assert.ok(SALT.length > 0);
});

test('checkPasscode always passes when the gate is inactive, even for an empty string', async () => {
    await withEnv({ NEXT_PUBLIC_GATE_ENABLED: '', NEXT_PUBLIC_GATE_DIGEST: '' }, async () => {
        assert.equal(await checkPasscode('', subtle), true);
        assert.equal(await checkPasscode('anything', subtle), true);
    });
});

test('checkPasscode rejects a wrong passcode and accepts the right one when active', async () => {
    const digest = await digestPasscode('autumn-2026', subtle);
    await withEnv({ NEXT_PUBLIC_GATE_ENABLED: 'true', NEXT_PUBLIC_GATE_DIGEST: digest }, async () => {
        assert.equal(await checkPasscode('wrong-guess', subtle), false);
        assert.equal(await checkPasscode('', subtle), false);
        assert.equal(await checkPasscode('autumn-2026', subtle), true);
    });
});

test('deriveToken is deterministic for a given digest, and changes if the digest changes', async () => {
    const digestA = await digestPasscode('autumn-2026', subtle);
    const digestB = await digestPasscode('spring-2027', subtle);

    const tokenA1 = await withEnv({ NEXT_PUBLIC_GATE_DIGEST: digestA }, () => deriveToken(subtle));
    const tokenA2 = await withEnv({ NEXT_PUBLIC_GATE_DIGEST: digestA }, () => deriveToken(subtle));
    const tokenB = await withEnv({ NEXT_PUBLIC_GATE_DIGEST: digestB }, () => deriveToken(subtle));

    assert.equal(tokenA1, tokenA2, 'same digest must derive the same token every time');
    assert.notEqual(tokenA1, tokenB, 'rotating the passcode must invalidate every previously stored token');
});

test('deriveToken never stores the passcode or the raw digest', async () => {
    const digest = await digestPasscode('autumn-2026', subtle);
    const token = await withEnv({ NEXT_PUBLIC_GATE_DIGEST: digest }, () => deriveToken(subtle));
    assert.notEqual(token, digest, 'the stored token must not equal the raw digest');
    assert.ok(!token.includes('autumn-2026'));
});

test('isTokenValid passes any token when the gate is inactive', async () => {
    await withEnv({ NEXT_PUBLIC_GATE_ENABLED: '', NEXT_PUBLIC_GATE_DIGEST: '' }, async () => {
        assert.equal(await isTokenValid('', subtle), true);
        assert.equal(await isTokenValid('forged-token', subtle), true);
    });
});

test('isTokenValid rejects a missing or forged token, accepts the derived one, when active', async () => {
    const digest = await digestPasscode('autumn-2026', subtle);
    await withEnv({ NEXT_PUBLIC_GATE_ENABLED: 'true', NEXT_PUBLIC_GATE_DIGEST: digest }, async () => {
        assert.equal(await isTokenValid(null, subtle), false);
        assert.equal(await isTokenValid('forged-token', subtle), false);
        const validToken = await deriveToken(subtle);
        assert.equal(await isTokenValid(validToken, subtle), true);
    });
});
