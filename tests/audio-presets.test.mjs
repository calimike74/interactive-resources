import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PRESET_IDS, describePreset } from '../lib/learn/audio-presets.js';

test('all planned presets are registered and describable', () => {
    const required = [
        'waveform-sine', 'waveform-triangle', 'waveform-sawtooth', 'waveform-square',
        'filter-sweep', 'adsr-pluck', 'adsr-swell',
        'lfo-vibrato', 'lfo-tremolo', 'lfo-wah', 'fm-ratio',
        'ctl-cutoff', 'ctl-resonance', 'ctl-adsr', 'ctl-lfo-depth', 'ctl-fm-ratio',
    ];
    for (const id of required) {
        assert.ok(PRESET_IDS.includes(id), `missing preset ${id}`);
        assert.ok(describePreset(id).length > 0, `preset ${id} has no accessible description`);
    }
});
