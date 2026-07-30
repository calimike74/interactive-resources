import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
    HARM,
    HARM_STAGE,
    HARMONIC_COUNT,
    SOUNDS,
    SOUND_ORDER,
    waveVal,
} from '../lib/additive-recipes.js';

/**
 * The Additive Synth Explorer tells a student that a hollow sound keeps only its
 * odd harmonics and that a buzzy one keeps them all, falling as they climb. Those
 * are exam claims. These tests hold the recipes to them, so a well-meaning tweak
 * to a slider default cannot quietly turn the page into a liar.
 */

const odd = (i) => (i + 1) % 2 === 1;

test('every recipe has eight harmonics and eight phases', () => {
    for (const [name, def] of Object.entries(SOUNDS)) {
        assert.equal(def.amp.length, HARMONIC_COUNT, `${name}: wrong number of harmonics`);
        assert.equal(def.sign.length, HARMONIC_COUNT, `${name}: wrong number of phases`);
        for (const a of def.amp) {
            assert.ok(a >= 0 && a <= 1, `${name}: amplitude ${a} is outside 0..1`);
        }
        for (const s of def.sign) {
            assert.ok(s === 1 || s === -1, `${name}: phase must be +1 or -1, got ${s}`);
        }
    }
});

test('every recipe sounds the note you played — H1 is always present', () => {
    // Without this, a recipe could produce a pitch nobody asked for: drop the
    // fundamental from the odd-harmonic stack and the ear hears the note an
    // octave and a fifth up. The pitch slider would then be lying.
    for (const [name, def] of Object.entries(SOUNDS)) {
        assert.equal(def.amp[0], 1, `${name}: the fundamental must be at full strength`);
    }
});

test('pure is the fundamental alone', () => {
    assert.deepEqual(SOUNDS.pure.amp.slice(1), [0, 0, 0, 0, 0, 0, 0]);
});

test('hollow is odd harmonics only, at 1/n — the square-wave claim on screen', () => {
    const { amp } = SOUNDS.hollow;
    for (let i = 0; i < HARMONIC_COUNT; i++) {
        if (odd(i)) {
            assert.ok(
                Math.abs(amp[i] - 1 / (i + 1)) < 1e-9,
                `H${i + 1} should be 1/${i + 1}, got ${amp[i]}`,
            );
        } else {
            assert.equal(amp[i], 0, `H${i + 1} is even and must be absent from a hollow sound`);
        }
    }
});

test('buzzy is every harmonic at 1/n — the sawtooth claim on screen', () => {
    const { amp } = SOUNDS.buzzy;
    for (let i = 0; i < HARMONIC_COUNT; i++) {
        assert.ok(
            Math.abs(amp[i] - 1 / (i + 1)) < 1e-9,
            `H${i + 1} should be 1/${i + 1}, got ${amp[i]}`,
        );
    }
});

test('every recipe falls as the harmonics climb, so none sounds thinner than its fundamental', () => {
    for (const [name, def] of Object.entries(SOUNDS)) {
        const present = def.amp.filter((a) => a > 0);
        for (let i = 1; i < present.length; i++) {
            assert.ok(
                present[i] <= present[i - 1] + 1e-9,
                `${name}: harmonic strengths must not rise as they climb`,
            );
        }
    }
});

test('bright really is brighter than warm', () => {
    // The two cards sit next to each other and claim opposite characters. If the
    // top four harmonics of "bright" were ever weaker than "warm"'s, the labels
    // would be back to front and nobody would notice by looking.
    const top = (a) => a.slice(4).reduce((n, x) => n + x, 0);
    assert.ok(
        top(SOUNDS.bright.amp) > top(SOUNDS.warm.amp),
        'bright must carry more energy in H5-H8 than warm',
    );
});

test('the waveform is centred — no recipe adds a DC offset', () => {
    // A sum of sines averages to zero over a cycle. If it did not, the drawn wave
    // would sit off the centre line and the scope on the sibling tool would
    // disagree with this one.
    for (const [name, def] of Object.entries(SOUNDS)) {
        const N = 2048;
        let mean = 0;
        for (let k = 0; k < N; k++) {
            mean += waveVal(def.amp, def.sign, (k / N) * 2 * Math.PI);
        }
        mean /= N;
        assert.ok(Math.abs(mean) < 1e-9, `${name}: waveform is offset from the centre line by ${mean}`);
    }
});

test('hollow repeats twice as often at half a cycle, as an odd-harmonic sound must', () => {
    // An odd-harmonic-only sound is antisymmetric: half a cycle later it is the
    // exact mirror of itself. This is what gives a square wave its shape, and it
    // is the property that would break first if an even harmonic crept in.
    const { amp, sign } = SOUNDS.hollow;
    for (let k = 0; k < 32; k++) {
        const p = (k / 32) * Math.PI;
        assert.ok(
            Math.abs(waveVal(amp, sign, p) + waveVal(amp, sign, p + Math.PI)) < 1e-9,
            'hollow must invert exactly half a cycle later',
        );
    }
});

test('every card in the display order is a real recipe, and none is orphaned', () => {
    assert.deepEqual(
        [...SOUND_ORDER].sort(),
        Object.keys(SOUNDS).sort(),
        'SOUND_ORDER and SOUNDS disagree — a card would render blank or a recipe would be unreachable',
    );
});

test('both palettes cover all eight harmonics with distinct colours', () => {
    for (const [name, palette] of [['HARM', HARM], ['HARM_STAGE', HARM_STAGE]]) {
        assert.equal(palette.length, HARMONIC_COUNT, `${name}: wrong length`);
        assert.equal(new Set(palette).size, HARMONIC_COUNT, `${name}: two harmonics share a colour`);
        for (const c of palette) {
            assert.match(c, /^#[0-9A-F]{6}$/i, `${name}: "${c}" is not a hex colour`);
        }
    }
});

test('H1 is the same colour on the additive and subtractive tools', () => {
    // The two tools now sit side by side under 1.3 Synthesis. A student who
    // learns that H3 is the green one on one page must find the same green on the
    // other, so HarmonicSpectrum's palette is pinned to this one. Read from the
    // source rather than imported, because that file is JSX.
    const src = readFileSync(new URL('../components/resources/HarmonicSpectrum.jsx', import.meta.url), 'utf8');
    const found = src.match(/#[0-9A-Fa-f]{6}/g) || [];
    for (const colour of HARM_STAGE) {
        assert.ok(
            found.some((c) => c.toUpperCase() === colour.toUpperCase()),
            `${colour} is in HARM_STAGE but not in HarmonicSpectrum.jsx — the two spectrum displays have drifted apart`,
        );
    }
});
