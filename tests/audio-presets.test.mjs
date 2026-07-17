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
            createdBuffers: [],
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
            createConvolver: () => makeNode({ buffer: null, normalize: true }),
            createBuffer: (channels, length) => {
                // Cache one Float32Array per channel so getChannelData() returns
                // the SAME array on every call, matching real AudioBuffer
                // behaviour — smp-reversed reads back what smp-forward wrote.
                const channelData = Array.from({ length: channels }, () => new Float32Array(length));
                const buf = {
                    length,
                    numberOfChannels: channels,
                    getChannelData: (channel = 0) => channelData[channel],
                };
                globalThis.__mockAudioContext?.createdBuffers.push(buf);
                return buf;
            },
            createBufferSource: () => makeNode({ buffer: null, loop: false, playbackRate: makeParam(1) }),
            createWaveShaper: () => {
                const node = makeNode({ curve: null, oversample: 'none' });
                globalThis.__mockAudioContext?.createdShapers.push(node);
                return node;
            },
            createdShapers: [],
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
        'verb-dry', 'verb-room', 'verb-hall', 'verb-predelay',
        'ctl-reverb-mix', 'ctl-reverb-decay',
        'smp-loop-click', 'smp-loop-clean', 'smp-forward', 'smp-reversed',
        'smp-full-depth', 'smp-crushed', 'ctl-bit-depth', 'ctl-repitch',
    ];
    for (const id of required) {
        assert.ok(PRESET_IDS.includes(id), `missing preset ${id}`);
        assert.ok(describePreset(id).length > 0, `preset ${id} has no accessible description`);
    }
});

test('every ctl- preset in the registry returns both stop and set (registry-wide shape guard)', () => {
    const ctlIds = PRESET_IDS.filter((id) => id.startsWith('ctl-'));
    // 5 pre-existing synthesis controls + 4 EQ/dynamics/delay controls + 2 reverb
    // controls + 2 new sampling controls (bit-depth, repitch).
    assert.equal(ctlIds.length, 13, `expected 13 ctl- presets, found ${ctlIds.length}: ${ctlIds.join(', ')}`);
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
        'verb-dry', 'verb-room', 'verb-hall', 'verb-predelay',
    ];
    for (const id of staticIds) {
        const controls = startPreset(id);
        assert.equal(typeof controls.stop, 'function', `${id} must return a stop function`);
        stopSafely(controls);
    }
});

test('new static sampling presets build without throwing', () => {
    const staticIds = [
        'smp-loop-click', 'smp-loop-clean', 'smp-forward', 'smp-reversed',
        'smp-full-depth', 'smp-crushed',
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

test('ctl-reverb-mix applies equal-power crossfade: dry = cos(mix*pi/2), wet = sin(mix*pi/2)', () => {
    const controls = startPreset('ctl-reverb-mix');
    const mock = globalThis.__mockAudioContext;
    // set() schedules dryGain then wetGain, in that order, so the two most
    // recent paramCalls after each set() are [dry, wet].

    controls.set({ mix: 1 }); // fully wet
    assert.ok(Math.abs(mock.paramCalls.at(-2).value - 0) < 1e-9, 'fully wet should drive dry gain to 0');
    assert.ok(Math.abs(mock.paramCalls.at(-1).value - 1) < 1e-9, 'fully wet should drive wet gain to 1');

    controls.set({ mix: 0 }); // fully dry
    assert.ok(Math.abs(mock.paramCalls.at(-2).value - 1) < 1e-9, 'fully dry should drive dry gain to 1');
    assert.ok(Math.abs(mock.paramCalls.at(-1).value - 0) < 1e-9, 'fully dry should drive wet gain to 0');

    controls.set({ mix: 1.5 }); // out of range, should clamp to 1
    assert.ok(Math.abs(mock.paramCalls.at(-2).value - 0) < 1e-9, 'mix above range should clamp dry gain to 0');
    assert.ok(Math.abs(mock.paramCalls.at(-1).value - 1) < 1e-9, 'mix above range should clamp wet gain to 1');

    stopSafely(controls);
});

test('ctl-reverb-decay clamps set({ decay }) and regenerates the IR to the clamped length', () => {
    const controls = startPreset('ctl-reverb-decay');
    const mock = globalThis.__mockAudioContext;

    controls.set({ decay: 0.1 }); // below range, should clamp to 0.3
    let ir = mock.createdBuffers.at(-1);
    assert.equal(ir.length, Math.floor(mock.sampleRate * 0.3), 'decay below range should clamp IR length to 0.3 s');

    controls.set({ decay: 99 }); // above range, should clamp to 3.0
    ir = mock.createdBuffers.at(-1);
    assert.equal(ir.length, Math.floor(mock.sampleRate * 3.0), 'decay above range should clamp IR length to 3.0 s');

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

test('ctl-bit-depth quantise curve step size is 1/L (L = 2^(bits-1)) and bits clamps to 2-16', () => {
    const controls = startPreset('ctl-bit-depth');
    const mock = globalThis.__mockAudioContext;
    const shaper = mock.createdShapers.at(-1);

    function stepSize() {
        const levels = [...new Set(Array.from(shaper.curve))].sort((a, b) => a - b);
        return levels[1] - levels[0];
    }

    controls.set({ bits: 3 });
    const expected3 = 1 / Math.pow(2, 3 - 1); // L = 4
    assert.ok(Math.abs(stepSize() - expected3) < 1e-9, `expected step size 1/4 at 3 bits, got ${stepSize()}`);

    controls.set({ bits: 0 }); // below range, should clamp to 2
    const expected2 = 1 / Math.pow(2, 2 - 1); // L = 2
    assert.ok(Math.abs(stepSize() - expected2) < 1e-9, `bits below range should clamp to 2 (step 1/2), got ${stepSize()}`);

    controls.set({ bits: 40 }); // above range, should clamp to 16
    const expected16 = 1 / Math.pow(2, 16 - 1); // L = 32768
    assert.ok(Math.abs(stepSize() - expected16) < 1e-9, `bits above range should clamp to 16 (step 1/32768), got ${stepSize()}`);

    stopSafely(controls);
});

test('ctl-repitch sets playbackRate = 2^(semitones/12) and clamps to -12..+12', () => {
    const controls = startPreset('ctl-repitch');
    const mock = globalThis.__mockAudioContext;

    controls.set({ semitones: 12 });
    assert.ok(Math.abs(mock.paramCalls.at(-1).value - 2) < 1e-9, `expected playbackRate 2.0 at +12 semitones, got ${mock.paramCalls.at(-1).value}`);

    controls.set({ semitones: -12 });
    assert.ok(Math.abs(mock.paramCalls.at(-1).value - 0.5) < 1e-9, `expected playbackRate 0.5 at -12 semitones, got ${mock.paramCalls.at(-1).value}`);

    controls.set({ semitones: 0 });
    assert.ok(Math.abs(mock.paramCalls.at(-1).value - 1) < 1e-9, `expected playbackRate 1.0 at 0 semitones, got ${mock.paramCalls.at(-1).value}`);

    controls.set({ semitones: 30 }); // above range, should clamp to +12 -> 2.0
    assert.ok(Math.abs(mock.paramCalls.at(-1).value - 2) < 1e-9, `semitones above range should clamp to +12, got ${mock.paramCalls.at(-1).value}`);

    controls.set({ semitones: -30 }); // below range, should clamp to -12 -> 0.5
    assert.ok(Math.abs(mock.paramCalls.at(-1).value - 0.5) < 1e-9, `semitones below range should clamp to -12, got ${mock.paramCalls.at(-1).value}`);

    stopSafely(controls);
});

test('smp-loop-clean buffer is an exact multiple of the period that smp-loop-click is a quarter-period off by', () => {
    const clean = startPreset('smp-loop-clean');
    const cleanLength = globalThis.__mockAudioContext.createdBuffers.at(-1).length;
    stopSafely(clean);

    const click = startPreset('smp-loop-click');
    const clickLength = globalThis.__mockAudioContext.createdBuffers.at(-1).length;
    stopSafely(click);

    const offset = clickLength - cleanLength;
    assert.ok(offset > 0, 'click buffer should be longer than the clean buffer');
    const period = offset * 4; // offset is a quarter-period by construction
    assert.equal(cleanLength % period, 0, 'clean buffer length should be an exact multiple of the wave period');
    assert.equal(clickLength % period, offset, 'click buffer length should land exactly one quarter-period past a multiple');
});
