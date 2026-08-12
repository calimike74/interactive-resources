import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    toBinary7,
    fromBinary7,
    split14,
    combine14,
    bendSemitones,
    divisionMs,
} from '../lib/midi/engine.js';

// The bench's marking reads exclusively from these functions. The 14-bit
// conventions MUST match components/resources/MIDIPitchBendController.jsx
// (the WO-06 flagship) exactly — one site, one set of MIDI maths.

test('7-bit binary round-trips across the whole 0-127 range', () => {
    assert.equal(toBinary7(0), '0000000');
    assert.equal(toBinary7(127), '1111111');
    assert.equal(toBinary7(100), '1100100');
    assert.equal(fromBinary7('1100100'), 100);
    for (const n of [1, 63, 64, 99, 126]) {
        assert.equal(fromBinary7(toBinary7(n)), n);
    }
});

test('14-bit split matches the flagship page: lsb = v & 0x7F, msb = v >> 7', () => {
    assert.deepEqual(split14(8192), { msb: 64, lsb: 0 });
    assert.deepEqual(split14(0), { msb: 0, lsb: 0 });
    assert.deepEqual(split14(16383), { msb: 127, lsb: 127 });
    assert.deepEqual(split14(8300), { msb: 64, lsb: 108 });
});

test('14-bit combine inverts the split', () => {
    for (const v of [0, 1, 8191, 8192, 8300, 16383]) {
        const { msb, lsb } = split14(v);
        assert.equal(combine14(msb, lsb), v);
    }
});

test('pitch-bend semitones match the flagship formula, both directions', () => {
    // Centre is silent
    assert.equal(bendSemitones(8192, 2), 0);
    // Full up = +range (denominator 8191 upward, per the flagship)
    assert.ok(Math.abs(bendSemitones(16383, 2) - 2) < 1e-9);
    // Full down = -range (denominator 8192 downward)
    assert.ok(Math.abs(bendSemitones(0, 2) - -2) < 1e-9);
    // Half up at range 12: (12287.5 → not integer) use 12288: (12288-8192)/8191*12
    assert.ok(Math.abs(bendSemitones(12288, 12) - ((12288 - 8192) / 8191) * 12) < 1e-9);
});

test('division milliseconds: straight, dotted and triplet at 120 BPM', () => {
    // At 120 BPM a crotchet is 500 ms
    assert.ok(Math.abs(divisionMs(120, 4, 'straight') - 500) < 1e-9);
    assert.ok(Math.abs(divisionMs(120, 8, 'straight') - 250) < 1e-9);
    assert.ok(Math.abs(divisionMs(120, 16, 'straight') - 125) < 1e-9);
    // Dotted = 1.5×, triplet = 2/3×
    assert.ok(Math.abs(divisionMs(120, 8, 'dotted') - 375) < 1e-9);
    assert.ok(Math.abs(divisionMs(120, 8, 'triplet') - 500 / 3) < 1e-9);
});
