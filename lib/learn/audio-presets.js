// Live Web Audio presets for learn-chapter listening blocks.
// startPreset(id, params) builds a small graph and returns { stop, set }.
// One shared AudioContext, lazily created on first user gesture.

let ctx = null;

function getContext() {
    if (typeof window === 'undefined') return null;
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
}

const LEVEL = 0.15;
const RAMP = 0.015; // click-free fades

function master(ac) {
    const gain = ac.createGain();
    gain.gain.setValueAtTime(0, ac.currentTime);
    gain.gain.linearRampToValueAtTime(LEVEL, ac.currentTime + RAMP);
    gain.connect(ac.destination);
    return gain;
}

function stopper(ac, gain, nodes) {
    return () => {
        const t = ac.currentTime;
        gain.gain.cancelScheduledValues(t);
        gain.gain.setValueAtTime(gain.gain.value, t);
        gain.gain.linearRampToValueAtTime(0, t + RAMP);
        setTimeout(() => {
            nodes.forEach(n => { try { n.stop ? n.stop() : n.disconnect(); } catch { /* already stopped */ } });
            try { gain.disconnect(); } catch { /* already disconnected */ }
        }, RAMP * 1000 + 30);
    };
}

const presets = {
    'waveform-sine': { desc: 'A pure sine wave at 220 Hz — fundamental only, no harmonics.', build: waveform('sine') },
    'waveform-triangle': { desc: 'A triangle wave at 220 Hz — odd harmonics, falling away quickly. Soft and mellow.', build: waveform('triangle') },
    'waveform-sawtooth': { desc: 'A sawtooth wave at 220 Hz — every harmonic present. Bright and buzzy.', build: waveform('sawtooth') },
    'waveform-square': { desc: 'A square wave at 220 Hz — odd harmonics only. Hollow and reedy.', build: waveform('square') },
    'filter-sweep': {
        desc: 'A sawtooth wave through a low-pass filter whose cutoff sweeps up and down.',
        build: (ac, out) => {
            const osc = ac.createOscillator(); osc.type = 'sawtooth'; osc.frequency.value = 110;
            const filter = ac.createBiquadFilter(); filter.type = 'lowpass'; filter.Q.value = 6;
            const lfo = ac.createOscillator(); lfo.frequency.value = 0.25;
            const lfoGain = ac.createGain(); lfoGain.gain.value = 1800;
            filter.frequency.value = 2000;
            lfo.connect(lfoGain).connect(filter.frequency);
            osc.connect(filter).connect(out);
            osc.start(); lfo.start();
            return [osc, filter, lfo, lfoGain];
        },
    },
    'adsr-pluck': {
        desc: 'Instant attack, fast decay, no sustain — a percussive pluck.',
        build: envelope({ attack: 0.005, decay: 0.35, sustain: 0 }),
    },
    'adsr-swell': {
        desc: 'Slow attack into full sustain — a string-like swell.',
        build: envelope({ attack: 1.4, decay: 0.2, sustain: 0.85 }),
    },
    'lfo-vibrato': {
        desc: 'An LFO gently modulating pitch — vibrato.',
        build: lfoTo('frequency', { rate: 6, depth: 14, base: 330 }),
    },
    'lfo-tremolo': {
        desc: 'An LFO modulating volume — tremolo.',
        build: lfoTo('gain', { rate: 5, depth: 0.5, base: 330 }),
    },
    'lfo-wah': {
        desc: 'An LFO sweeping a filter cutoff — an automatic wah.',
        build: lfoTo('filter', { rate: 2, depth: 900, base: 110 }),
    },
    'fm-ratio': {
        desc: 'A modulator oscillator shaking a carrier’s frequency — frequency modulation. The ratio sets the character.',
        build: (ac, out, params = {}) => {
            const ratio = params.ratio ?? 2;
            const carrier = ac.createOscillator(); carrier.type = 'sine'; carrier.frequency.value = 220;
            const mod = ac.createOscillator(); mod.type = 'sine'; mod.frequency.value = 220 * ratio;
            const modGain = ac.createGain(); modGain.gain.value = params.index ?? 300;
            mod.connect(modGain).connect(carrier.frequency);
            carrier.connect(out);
            carrier.start(); mod.start();
            return [carrier, mod, modGain];
        },
    },
    'ctl-cutoff': {
        desc: 'A sawtooth wave through a low-pass filter — drag to sweep the cutoff live.',
        build: (ac, out) => {
            const osc = ac.createOscillator(); osc.type = 'sawtooth'; osc.frequency.value = 110;
            const filter = ac.createBiquadFilter(); filter.type = 'lowpass'; filter.Q.value = 4;
            filter.frequency.value = 2000;
            osc.connect(filter).connect(out);
            osc.start();
            return {
                nodes: [osc, filter],
                set: (hz) => { filter.frequency.setTargetAtTime(hz, ac.currentTime, 0.02); },
            };
        },
    },
    'ctl-resonance': {
        desc: 'A sawtooth wave through a resonant low-pass filter — drag to hear the resonance peak sharpen.',
        build: (ac, out) => {
            const osc = ac.createOscillator(); osc.type = 'sawtooth'; osc.frequency.value = 110;
            const filter = ac.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 900;
            filter.Q.value = 4;
            osc.connect(filter).connect(out);
            osc.start();
            return {
                nodes: [osc, filter],
                set: (q) => { filter.Q.setTargetAtTime(q, ac.currentTime, 0.02); },
            };
        },
    },
    'ctl-adsr': {
        desc: 'A retriggering sawtooth pluck — drag to morph the envelope from plucky to swelling.',
        build: (ac, out) => {
            let adsr = { attack: 0.005, decay: 0.35, sustain: 0, release: 0.2 };

            function trigger() {
                const { attack, decay, sustain, release } = adsr;
                const osc = ac.createOscillator(); osc.type = 'sawtooth'; osc.frequency.value = 220;
                const env = ac.createGain();
                const t = ac.currentTime;
                env.gain.setValueAtTime(0, t);
                env.gain.linearRampToValueAtTime(1, t + attack);
                env.gain.linearRampToValueAtTime(sustain, t + attack + decay);
                env.gain.linearRampToValueAtTime(0, t + attack + decay + release);
                osc.connect(env).connect(out);
                osc.start(t);
                osc.stop(t + attack + decay + release + 0.05);
            }

            trigger();
            const intervalId = setInterval(trigger, 900);
            const intervalNode = { stop() { clearInterval(intervalId); } };

            return {
                nodes: [intervalNode],
                set: (next) => { adsr = { ...adsr, ...next }; },
            };
        },
    },
    'ctl-lfo-depth': {
        desc: 'An LFO modulating pitch — drag to hear the vibrato deepen.',
        build: (ac, out) => {
            const osc = ac.createOscillator(); osc.type = 'sine'; osc.frequency.value = 330;
            const lfo = ac.createOscillator(); lfo.frequency.value = 6;
            const lfoGain = ac.createGain(); lfoGain.gain.value = 14;
            lfo.connect(lfoGain).connect(osc.frequency);
            osc.connect(out);
            osc.start(); lfo.start();
            return {
                nodes: [osc, lfo, lfoGain],
                set: (depth) => { lfoGain.gain.setTargetAtTime(depth, ac.currentTime, 0.02); },
            };
        },
    },
    'ctl-fm-ratio': {
        desc: 'A modulator oscillator shaking a carrier’s frequency — drag to hear the ratio cross from harmonic to inharmonic.',
        build: (ac, out) => {
            const carrier = ac.createOscillator(); carrier.type = 'sine'; carrier.frequency.value = 220;
            const mod = ac.createOscillator(); mod.type = 'sine'; mod.frequency.value = 440;
            const modGain = ac.createGain(); modGain.gain.value = 300;
            mod.connect(modGain).connect(carrier.frequency);
            carrier.connect(out);
            carrier.start(); mod.start();
            return {
                nodes: [carrier, mod, modGain],
                set: (ratio) => { mod.frequency.setTargetAtTime(220 * ratio, ac.currentTime, 0.02); },
            };
        },
    },
};

function waveform(type) {
    return (ac, out) => {
        const osc = ac.createOscillator();
        osc.type = type; osc.frequency.value = 220;
        osc.connect(out); osc.start();
        return [osc];
    };
}

function envelope({ attack, decay, sustain }) {
    return (ac, out) => {
        const osc = ac.createOscillator(); osc.type = 'sawtooth'; osc.frequency.value = 220;
        const env = ac.createGain();
        const t = ac.currentTime;
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(1, t + attack);
        env.gain.linearRampToValueAtTime(sustain, t + attack + decay);
        osc.connect(env).connect(out); osc.start();
        return [osc, env];
    };
}

function lfoTo(target, { rate, depth, base }) {
    return (ac, out) => {
        const osc = ac.createOscillator();
        osc.type = target === 'filter' ? 'sawtooth' : 'sine';
        osc.frequency.value = base;
        const lfo = ac.createOscillator(); lfo.frequency.value = rate;
        const lfoGain = ac.createGain(); lfoGain.gain.value = target === 'gain' ? depth / 2 : depth;
        const nodes = [osc, lfo, lfoGain];

        if (target === 'frequency') {
            lfo.connect(lfoGain).connect(osc.frequency);
            osc.connect(out);
        } else if (target === 'gain') {
            const amp = ac.createGain(); amp.gain.value = 1 - depth / 2;
            lfo.connect(lfoGain).connect(amp.gain);
            osc.connect(amp).connect(out);
            nodes.push(amp);
        } else {
            const filter = ac.createBiquadFilter();
            filter.type = 'lowpass'; filter.frequency.value = 1200; filter.Q.value = 8;
            lfo.connect(lfoGain).connect(filter.frequency);
            osc.connect(filter).connect(out);
            nodes.push(filter);
        }
        osc.start(); lfo.start();
        return nodes;
    };
}

export const PRESET_IDS = Object.keys(presets);

export function describePreset(id) {
    return presets[id]?.desc ?? '';
}

export function startPreset(id, params) {
    const ac = getContext();
    const preset = presets[id];
    if (!ac || !preset) return { stop: () => {}, set: () => {} };
    const out = master(ac);
    const built = preset.build(ac, out, params);
    const nodes = Array.isArray(built) ? built : built.nodes;
    const set = Array.isArray(built) ? () => {} : built.set;
    return { stop: stopper(ac, out, nodes), set };
}
