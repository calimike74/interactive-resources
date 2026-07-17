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
    'eq-tone-flat': {
        desc: 'A harmonically rich tone through a gentle low-pass — no EQ applied. The A/B baseline.',
        build: eqTonePreset(null),
    },
    'eq-low-shelf-boost': {
        desc: 'The same tone with a low-shelf boost: +9 dB below 200 Hz. Warmer, thicker, closer to boomy.',
        build: eqTonePreset({ type: 'lowshelf', frequency: 200, gain: 9 }),
    },
    'eq-presence-boost': {
        desc: 'The same tone with a presence peak: +9 dB at 3 kHz, Q 1.2. Forward and edgy.',
        build: eqTonePreset({ type: 'peaking', frequency: 3000, gain: 9, Q: 1.2 }),
    },
    'eq-highpass': {
        desc: 'The same tone with everything below 300 Hz removed — a high-pass filter.',
        build: eqTonePreset({ type: 'highpass', frequency: 300 }),
    },
    'comp-drums-raw': {
        desc: 'A two-bar drum loop at 100 BPM — kick and snare, uncompressed, full dynamic range.',
        build: drumLoopPreset(false),
    },
    'comp-drums-squashed': {
        desc: 'The same drum loop through a compressor — threshold −35 dB, ratio 12:1 — audibly pumped and levelled.',
        build: drumLoopPreset(true),
    },
    'delay-single': {
        desc: 'A plucked tone into a single 0.35 s delay — one clean repeat, no feedback.',
        build: (ac, out) => {
            const { osc, env } = pluckNodes(ac);
            const delay = ac.createDelay(1); delay.delayTime.value = 0.35;
            const feedback = ac.createGain(); feedback.gain.value = 0;
            const wet = ac.createGain(); wet.gain.value = 0.5;
            const dry = ac.createGain(); dry.gain.value = 1;
            env.connect(dry).connect(out);
            env.connect(delay);
            delay.connect(feedback).connect(delay);
            delay.connect(wet).connect(out);
            return [osc, env, delay, feedback, wet, dry];
        },
    },
    'delay-pingpong': {
        desc: 'A plucked tone into two cross-fed delays panned hard left/right — feedback 0.45. Repeats bounce across the stereo field.',
        build: (ac, out) => {
            const { osc, env } = pluckNodes(ac);
            const delayL = ac.createDelay(1); delayL.delayTime.value = 0.3;
            const delayR = ac.createDelay(1); delayR.delayTime.value = 0.3;
            const panL = ac.createStereoPanner(); panL.pan.value = -1;
            const panR = ac.createStereoPanner(); panR.pan.value = 1;
            const fbLtoR = ac.createGain(); fbLtoR.gain.value = 0.45;
            const fbRtoL = ac.createGain(); fbRtoL.gain.value = 0.45;
            const dry = ac.createGain(); dry.gain.value = 0.6;
            env.connect(dry).connect(out);
            env.connect(delayL);
            delayL.connect(panL).connect(out);
            delayL.connect(fbLtoR).connect(delayR);
            delayR.connect(panR).connect(out);
            delayR.connect(fbRtoL).connect(delayL);
            return [osc, env, delayL, delayR, panL, panR, fbLtoR, fbRtoL, dry];
        },
    },
    'ctl-eq-sweep': {
        desc: 'A harmonically rich tone through a sweepable peaking filter (+10 dB, Q 1.5) — drag to hear the boost move across the spectrum.',
        build: (ac, out) => {
            const { osc, tail } = richTone(ac);
            const sweep = ac.createBiquadFilter();
            sweep.type = 'peaking'; sweep.frequency.value = 1000; sweep.Q.value = 1.5; sweep.gain.value = 10;
            tail.connect(sweep).connect(out);
            return {
                nodes: [osc, tail, sweep],
                set: ({ frequency }) => {
                    const hz = clampValue(frequency, 60, 12000);
                    sweep.frequency.setTargetAtTime(hz, ac.currentTime, 0.02);
                },
            };
        },
    },
    'ctl-threshold': {
        desc: 'The drum loop through a compressor — drag the threshold down to hear it squash, with makeup gain compensating.',
        build: (ac, out) => {
            const compressor = ac.createDynamicsCompressor();
            compressor.threshold.value = -24; compressor.ratio.value = 12;
            compressor.attack.value = 0.003; compressor.release.value = 0.25;
            const makeup = ac.createGain(); makeup.gain.value = 1;
            compressor.connect(makeup).connect(out);
            const loop = startDrumLoop(ac, compressor);
            return {
                nodes: [compressor, makeup, loop],
                set: ({ threshold }) => {
                    const db = clampValue(threshold, -60, 0);
                    compressor.threshold.setTargetAtTime(db, ac.currentTime, 0.02);
                    makeup.gain.setTargetAtTime(1 + (-db) / 60, ac.currentTime, 0.02);
                },
            };
        },
    },
    'ctl-delay-time': {
        desc: 'A repeating plucked tone through one delay — drag to hear the gap cross from doubling to slapback to echo.',
        build: (ac, out) => {
            const delay = ac.createDelay(1); delay.delayTime.value = 0.3;
            const feedback = ac.createGain(); feedback.gain.value = 0.35;
            const wet = ac.createGain(); wet.gain.value = 0.5;
            delay.connect(feedback).connect(delay);
            delay.connect(wet).connect(out);

            function trigger() {
                const { env } = pluckNodes(ac);
                env.connect(out);
                env.connect(delay);
            }
            trigger();
            const intervalId = setInterval(trigger, 1600);
            const intervalNode = { stop() { clearInterval(intervalId); } };

            return {
                nodes: [delay, feedback, wet, intervalNode],
                set: ({ time }) => {
                    const t = clampValue(time, 0.015, 0.45);
                    delay.delayTime.setTargetAtTime(t, ac.currentTime, 0.02);
                },
            };
        },
    },
    'ctl-feedback': {
        desc: 'A repeating plucked tone through a fixed 0.32 s delay — drag to hear the feedback tail lengthen.',
        build: (ac, out) => {
            const delay = ac.createDelay(1); delay.delayTime.value = 0.32;
            const feedback = ac.createGain(); feedback.gain.value = 0.3;
            const wet = ac.createGain(); wet.gain.value = 0.5;
            delay.connect(feedback).connect(delay);
            delay.connect(wet).connect(out);

            function trigger() {
                const { env } = pluckNodes(ac);
                env.connect(out);
                env.connect(delay);
            }
            trigger();
            const intervalId = setInterval(trigger, 1600);
            const intervalNode = { stop() { clearInterval(intervalId); } };

            return {
                nodes: [delay, feedback, wet, intervalNode],
                set: ({ feedback: amount }) => {
                    const clamped = clampValue(amount, 0, 0.85);
                    feedback.gain.setTargetAtTime(clamped, ac.currentTime, 0.02);
                },
            };
        },
    },
    'verb-dry': {
        desc: 'A repeating percussive tick with no reverb applied — the dry baseline for the A/B.',
        build: (ac, out) => {
            const { bus, ticker } = reverbTickBus(ac);
            bus.connect(out);
            return [bus, ticker];
        },
    },
    'verb-room': {
        desc: 'The same tick through a 0.4 s room impulse response — small and quick, reflections close behind the source.',
        build: reverbPreset(0.4),
    },
    'verb-hall': {
        desc: 'The same tick through a 1.8 s hall impulse response — long, spacious reflections trailing after each hit.',
        build: reverbPreset(1.8),
    },
    'verb-predelay': {
        desc: 'The hall impulse response with an 80 ms gap before the wet signal arrives — pre-delay opens space before the tail begins.',
        build: reverbPreset(1.8, { predelaySeconds: 0.08 }),
    },
    'ctl-reverb-mix': {
        desc: 'A repeating tick crossfaded between direct and a 1.8 s hall reverb — drag to hear distance grow.',
        build: (ac, out) => {
            const { bus, ticker } = reverbTickBus(ac);
            const convolver = ac.createConvolver();
            convolver.buffer = reverbBuffer(ac, 1.8);
            const start = equalPowerMix(0.3); // dry-leaning start so the crossfade has somewhere to go
            const dryGain = ac.createGain(); dryGain.gain.value = start.dry;
            const wetGain = ac.createGain(); wetGain.gain.value = start.wet;
            bus.connect(dryGain).connect(out);
            bus.connect(convolver).connect(wetGain).connect(out);
            return {
                nodes: [bus, ticker, convolver, dryGain, wetGain],
                set: ({ mix }) => {
                    const { dry, wet } = equalPowerMix(mix);
                    const t = ac.currentTime;
                    dryGain.gain.setTargetAtTime(dry, t, 0.02);
                    wetGain.gain.setTargetAtTime(wet, t, 0.02);
                },
            };
        },
    },
    'ctl-reverb-decay': {
        desc: 'A repeating tick through a reverb — drag to regenerate the impulse response and hear the tail change length.',
        build: (ac, out) => {
            const { bus, ticker } = reverbTickBus(ac);
            const convolver = ac.createConvolver();
            convolver.buffer = reverbBuffer(ac, 1.2); // starting point: edge of "live room" / "hall"
            const { dry, wet } = equalPowerMix(0.5);
            const dryGain = ac.createGain(); dryGain.gain.value = dry;
            const wetGain = ac.createGain(); wetGain.gain.value = wet;
            bus.connect(dryGain).connect(out);
            bus.connect(convolver).connect(wetGain).connect(out);
            return {
                nodes: [bus, ticker, convolver, dryGain, wetGain],
                set: ({ decay }) => {
                    convolver.buffer = reverbBuffer(ac, clampValue(decay, 0.3, 3.0));
                },
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

function clampValue(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function richTone(ac) {
    const osc = ac.createOscillator(); osc.type = 'sawtooth'; osc.frequency.value = 110;
    const gentle = ac.createBiquadFilter(); gentle.type = 'lowpass'; gentle.frequency.value = 8000; gentle.Q.value = 0.7;
    osc.connect(gentle);
    osc.start();
    return { osc, tail: gentle };
}

function eqTonePreset(filterConfig) {
    return (ac, out) => {
        const { osc, tail } = richTone(ac);
        const nodes = [osc, tail];
        let last = tail;
        if (filterConfig) {
            const eq = ac.createBiquadFilter();
            eq.type = filterConfig.type;
            eq.frequency.value = filterConfig.frequency;
            if (filterConfig.gain !== undefined) eq.gain.value = filterConfig.gain;
            if (filterConfig.Q !== undefined) eq.Q.value = filterConfig.Q;
            last.connect(eq);
            last = eq;
            nodes.push(eq);
        }
        last.connect(out);
        return nodes;
    };
}

function pluckNodes(ac) {
    const osc = ac.createOscillator(); osc.type = 'triangle'; osc.frequency.value = 220;
    const env = ac.createGain();
    const t = ac.currentTime;
    env.gain.setValueAtTime(1, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc.connect(env);
    osc.start(t); osc.stop(t + 0.42);
    return { osc, env };
}

function noiseBuffer(ac, duration) {
    const length = Math.max(1, Math.floor(ac.sampleRate * duration));
    const buffer = ac.createBuffer(1, length, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
}

// Classic lookahead scheduler (Chris Wilson pattern): a setInterval "ticks"
// every 25 ms and schedules any note starts that fall within a 100 ms
// lookahead window using ac.currentTime. Returns a stoppable handle so the
// caller's teardown can clear the interval — this is the one preset family
// with a persistent timer, everything else is fire-and-forget nodes.
function startDrumLoop(ac, dest) {
    const beatDur = 60 / 100; // 100 BPM
    const lookahead = 0.1;
    const scheduleMs = 25;

    function playKick(t) {
        const osc = ac.createOscillator(); osc.type = 'sine';
        const env = ac.createGain();
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(50, t + 0.15);
        env.gain.setValueAtTime(1, t);
        env.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.connect(env).connect(dest);
        osc.start(t); osc.stop(t + 0.32);
    }

    function playSnare(t) {
        const src = ac.createBufferSource(); src.buffer = noiseBuffer(ac, 0.08);
        const band = ac.createBiquadFilter(); band.type = 'bandpass'; band.frequency.value = 1800; band.Q.value = 1;
        const env = ac.createGain();
        env.gain.setValueAtTime(1, t);
        env.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        src.connect(band).connect(env).connect(dest);
        src.start(t); src.stop(t + 0.09);
    }

    let nextTime = ac.currentTime + 0.05;
    let beat = 0;

    function tick() {
        while (nextTime < ac.currentTime + lookahead) {
            const beatInBar = beat % 4;
            playKick(nextTime);
            if (beatInBar === 1 || beatInBar === 3) playSnare(nextTime); // snare on 2 and 4
            nextTime += beatDur;
            beat = (beat + 1) % 8; // two-bar loop
        }
    }

    tick();
    const intervalId = setInterval(tick, scheduleMs);
    return { stop() { clearInterval(intervalId); } };
}

function drumLoopPreset(withCompressor) {
    return (ac, out) => {
        let dest = out;
        const nodes = [];
        if (withCompressor) {
            const compressor = ac.createDynamicsCompressor();
            compressor.threshold.value = -35; compressor.ratio.value = 12;
            compressor.attack.value = 0.003; compressor.release.value = 0.25;
            const makeup = ac.createGain(); makeup.gain.value = 2;
            compressor.connect(makeup).connect(out);
            dest = compressor;
            nodes.push(compressor, makeup);
        }
        nodes.push(startDrumLoop(ac, dest));
        return nodes;
    };
}

// Synthetic impulse response: white noise shaped by an exponential decay
// envelope. envelope(t) = 10^(-3t/RT60) is -60 dB at exactly t = RT60.
function reverbBuffer(ac, rt60) {
    const length = Math.max(1, Math.floor(ac.sampleRate * rt60));
    const buffer = ac.createBuffer(1, length, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
        const t = i / ac.sampleRate;
        const envelope = Math.pow(10, (-3 * t) / rt60);
        data[i] = (Math.random() * 2 - 1) * envelope;
    }
    return buffer;
}

// Equal-power crossfade per the spec formula: dry = cos(mix*pi/2), wet = sin(mix*pi/2).
function equalPowerMix(mix) {
    const m = clampValue(mix, 0, 1);
    return { dry: Math.cos((m * Math.PI) / 2), wet: Math.sin((m * Math.PI) / 2) };
}

// Repeating percussive tick for reverb A/B comparisons: same lookahead-timer
// pattern as startDrumLoop, one short noise hit every 1.2 s so each impulse
// response's tail has room to be heard between hits.
function startReverbTicker(ac, dest) {
    const interval = 1.2;
    const lookahead = 0.1;
    const scheduleMs = 25;

    function playTick(t) {
        const src = ac.createBufferSource(); src.buffer = noiseBuffer(ac, 0.05);
        const band = ac.createBiquadFilter(); band.type = 'bandpass'; band.frequency.value = 2500; band.Q.value = 0.8;
        const env = ac.createGain();
        env.gain.setValueAtTime(1, t);
        env.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        src.connect(band).connect(env).connect(dest);
        src.start(t); src.stop(t + 0.06);
    }

    let nextTime = ac.currentTime + 0.05;

    function tick() {
        while (nextTime < ac.currentTime + lookahead) {
            playTick(nextTime);
            nextTime += interval;
        }
    }

    tick();
    const intervalId = setInterval(tick, scheduleMs);
    return { stop() { clearInterval(intervalId); } };
}

// Shared unity-gain fan-out point the ticker plays into; every reverb preset
// taps it for both the dry path and the pre-convolver wet path so all six
// presets share one tick source — fair A/B by construction.
function reverbTickBus(ac) {
    const bus = ac.createGain(); bus.gain.value = 1;
    const ticker = startReverbTicker(ac, bus);
    return { bus, ticker };
}

// Shared graph for the "through a convolver" presets: tick bus -> dry gain
// path, and tick bus -> (optional predelay ->) convolver -> wet gain path,
// both summing to out. mix is a fixed roughly-equal split per the spec note;
// only the ctl- presets crossfade or regenerate the IR live.
function reverbPreset(rt60, { predelaySeconds = 0, mix = 0.5 } = {}) {
    return (ac, out) => {
        const { bus, ticker } = reverbTickBus(ac);
        const nodes = [bus, ticker];

        const convolver = ac.createConvolver();
        convolver.buffer = reverbBuffer(ac, rt60);
        const { dry, wet } = equalPowerMix(mix);
        const dryGain = ac.createGain(); dryGain.gain.value = dry;
        const wetGain = ac.createGain(); wetGain.gain.value = wet;

        bus.connect(dryGain).connect(out);
        nodes.push(dryGain);

        let wetSource = bus;
        if (predelaySeconds > 0) {
            const predelay = ac.createDelay(1); predelay.delayTime.value = predelaySeconds;
            bus.connect(predelay);
            wetSource = predelay;
            nodes.push(predelay);
        }
        wetSource.connect(convolver).connect(wetGain).connect(out);
        nodes.push(convolver, wetGain);

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
