import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PRESET_IDS, describePreset, startPreset } from '../lib/learn/audio-presets.js';

// Minimal Web Audio mock so startPreset() can build real graphs in Node.
// audio-presets.js checks `typeof window === 'undefined'` and no-ops without
// it, so we install a fake `window.AudioContext` before any preset runs.
// Every AudioParam scheduling call is recorded on the shared mock context so
// tests can assert on the values presets actually push (e.g. clamping).
installAudioMock();

function installAudioMock() {
    function makeParam(initial = 0) {
        return {
            value: initial,
            setValueAtTime(v) { this.value = v; recordCall('setValueAtTime', v); return this; },
            linearRampToValueAtTime(v) { this.value = v; recordCall('linearRampToValueAtTime', v); return this; },
            exponentialRampToValueAtTime(v) { this.value = v; recordCall('exponentialRampToValueAtTime', v); return this; },
            setTargetAtTime(v) { this.value = v; recordCall('setTargetAtTime', v); return this; },
            cancelScheduledValues() { return this; },
        };
    }

    function recordCall(method, value) {
        globalThis.__mockAudioContext?.paramCalls.push({ method, value });
    }

    function makeNode(extra = {}) {
        return {
            connect(destination) {
                return destination && typeof destination.connect === 'function' ? destination : undefined;
            },
            disconnect() {},
            start() {},
            stop() {},
            ...extra,
        };
    }

    function MockAudioContext() {
        const instance = {
            currentTime: 0,
            sampleRate: 44100,
            state: 'running',
            paramCalls: [],
            destination: makeNode(),
            resume() {},
            createOscillator: () => makeNode({ type: 'sine', frequency: makeParam(440), detune: makeParam(0) }),
            createGain: () => makeNode({ gain: makeParam(1) }),
            createBiquadFilter: () => makeNode({ type: 'lowpass', frequency: makeParam(350), Q: makeParam(1), gain: makeParam(0) }),
            createDynamicsCompressor: () => makeNode({
                threshold: makeParam(-24), knee: makeParam(30), ratio: makeParam(12),
                attack: makeParam(0.003), release: makeParam(0.25),
            }),
            createDelay: () => makeNode({ delayTime: makeParam(0) }),
            createStereoPanner: () => makeNode({ pan: makeParam(0) }),
            createBuffer: (channels, length) => ({
                length, numberOfChannels: channels,
                getChannelData: () => new Float32Array(length),
            }),
            createBufferSource: () => makeNode({ buffer: null, loop: false }),
        };
        globalThis.__mockAudioContext = instance;
        return instance;
    }

    globalThis.window = { AudioContext: MockAudioContext };
}

function stopSafely(controls) {
    try { controls.stop(); } catch { /* already stopped */ }
}

test('all planned presets are registered and describable', () => {
    const required = [
        'waveform-sine', 'waveform-triangle', 'waveform-sawtooth', 'waveform-square',
        'filter-sweep', 'adsr-pluck', 'adsr-swell',
        'lfo-vibrato', 'lfo-tremolo', 'lfo-wah', 'fm-ratio',
        'ctl-cutoff', 'ctl-resonance', 'ctl-adsr', 'ctl-lfo-depth', 'ctl-fm-ratio',
        'eq-tone-flat', 'eq-low-shelf-boost', 'eq-presence-boost', 'eq-highpass',
        'comp-drums-raw', 'comp-drums-squashed',
        'delay-single', 'delay-pingpong',
        'ctl-eq-sweep', 'ctl-threshold', 'ctl-delay-time', 'ctl-feedback',
    ];
    for (const id of required) {
        assert.ok(PRESET_IDS.includes(id), `missing preset ${id}`);
        assert.ok(describePreset(id).length > 0, `preset ${id} has no accessible description`);
    }
});

test('every ctl- preset in the registry returns both stop and set (registry-wide shape guard)', () => {
    const ctlIds = PRESET_IDS.filter((id) => id.startsWith('ctl-'));
    // 5 pre-existing synthesis controls + 4 new EQ/dynamics/delay controls.
    assert.equal(ctlIds.length, 9, `expected 9 ctl- presets, found ${ctlIds.length}: ${ctlIds.join(', ')}`);
    for (const id of ctlIds) {
        const controls = startPreset(id);
        assert.equal(typeof controls.stop, 'function', `${id} must return a stop function`);
        assert.equal(typeof controls.set, 'function', `${id} must return a set function`);
        stopSafely(controls);
    }
});

test('new static EQ/dynamics/delay presets build without throwing', () => {
    const staticIds = [
        'eq-tone-flat', 'eq-low-shelf-boost', 'eq-presence-boost', 'eq-highpass',
        'comp-drums-raw', 'comp-drums-squashed', 'delay-single', 'delay-pingpong',
    ];
    for (const id of staticIds) {
        const controls = startPreset(id);
        assert.equal(typeof controls.stop, 'function', `${id} must return a stop function`);
        stopSafely(controls);
    }
});

test('comp-drums-raw schedules with a lookahead interval timer that stop() clears', async () => {
    const originalSetInterval = global.setInterval;
    const originalClearInterval = global.clearInterval;
    const createdHandles = [];
    const clearedHandles = [];
    global.setInterval = (...args) => {
        const handle = originalSetInterval(...args);
        createdHandles.push(handle);
        return handle;
    };
    global.clearInterval = (handle) => {
        clearedHandles.push(handle);
        return originalClearInterval(handle);
    };

    try {
        const controls = startPreset('comp-drums-raw');
        assert.ok(createdHandles.length > 0, 'comp-drums-raw should schedule with setInterval');
        controls.stop();
        // Node teardown (including clearing the interval) runs inside the
        // stopper's setTimeout after the click-free fade — wait past it.
        await new Promise((resolve) => setTimeout(resolve, 60));
        assert.ok(
            clearedHandles.includes(createdHandles[createdHandles.length - 1]),
            'stop() should clear the lookahead interval it created',
        );
    } finally {
        global.setInterval = originalSetInterval;
        global.clearInterval = originalClearInterval;
    }
});

test('ctl-feedback clamps set({ feedback }) to 0-0.85', () => {
    const controls = startPreset('ctl-feedback');
    const mock = globalThis.__mockAudioContext;

    controls.set({ feedback: 5 });
    assert.equal(mock.paramCalls.at(-1).value, 0.85, 'feedback above range should clamp to 0.85');

    controls.set({ feedback: -3 });
    assert.equal(mock.paramCalls.at(-1).value, 0, 'feedback below range should clamp to 0');

    controls.set({ feedback: 0.5 });
    assert.equal(mock.paramCalls.at(-1).value, 0.5, 'feedback within range should pass through unclamped');

    stopSafely(controls);
});

test('ctl-threshold applies makeup gain compensation: gain = 1 + (-threshold)/60', () => {
    const controls = startPreset('ctl-threshold');
    const mock = globalThis.__mockAudioContext;

    controls.set({ threshold: -30 });
    const last = mock.paramCalls.at(-1);
    assert.ok(Math.abs(last.value - 1.5) < 1e-9, `expected makeup gain 1.5, got ${last.value}`);

    controls.set({ threshold: -90 }); // out of range, should clamp to -60 -> makeup gain 2
    const clampedMakeup = mock.paramCalls.at(-1);
    assert.ok(Math.abs(clampedMakeup.value - 2) < 1e-9, `expected clamped makeup gain 2, got ${clampedMakeup.value}`);

    stopSafely(controls);
});
