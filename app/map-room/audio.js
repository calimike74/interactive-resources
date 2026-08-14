/* The map plays — a sound per sound-family topic, synthesised on demand.
 *
 * House law: the audio must literally demonstrate the node it hangs on, and
 * the caption shown while it plays must describe exactly what is heard.
 * Everything is built from oscillators, noise and standard nodes — no
 * samples, nothing fetched. The context is created on the sound toggle
 * (a user gesture), never on load.
 */

export const SOUND_CAPTIONS = {
    '1.11': 'noise with one boosted band sweeping upward (the boost moves, the tone follows)',
    '1.9': 'a pad ducking every time the kick lands (side-chain compression pumping)',
    '1.12d': 'one note, then echoes at a fixed gap, each quieter (feedback delay)',
    '1.12r': 'a dry clap, then the same clap inside a large room (the tail is reverb)',
    '1.3': 'a saw wave as the low-pass filter opens (brightness follows the cutoff)',
    '1.12x': 'a clean tone driven into clipping (added harmonics turn it to a rasp)',
    '1.12m': 'one voice made two, drifting apart and together (modulation in motion)',
    '1.10': 'the same note placed left, then right, then centre (panning is position)',
};

const noiseBuffer = (ctx, seconds) => {
    const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * seconds), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return buf;
};

const clapAt = (ctx, dest, t) => {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx, 0.09);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = 0.9;
    const g = ctx.createGain();
    g.gain.setValueAtTime(1, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    src.connect(bp).connect(g).connect(dest);
    src.start(t); src.stop(t + 0.1);
    return src;
};

export class RoomAudio {
    constructor() {
        this.ctx = null;
        this.voice = null;       // { master, stops: [] }
        this.currentKey = null;
    }

    /* Call from a user gesture (the sound toggle). */
    enable() {
        if (!this.ctx) {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return false;
            this.ctx = new AC();
        }
        if (this.ctx.state === 'suspended') this.ctx.resume();
        return true;
    }

    stop() {
        if (!this.voice) return;
        const { master, stops } = this.voice;
        const t = this.ctx.currentTime;
        master.gain.cancelScheduledValues(t);
        master.gain.setValueAtTime(master.gain.value, t);
        master.gain.linearRampToValueAtTime(0, t + 0.08);
        for (const s of stops) { try { s.stop(t + 0.1); } catch { /* already stopped */ } }
        setTimeout(() => master.disconnect(), 200);
        this.voice = null;
        this.currentKey = null;
    }

    /* Play the sound for a topic's spec code; returns its caption, or null. */
    play(key) {
        if (!this.ctx || !SOUND_CAPTIONS[key]) return null;
        if (this.currentKey === key) return SOUND_CAPTIONS[key];
        this.stop();
        const ctx = this.ctx;
        const t = ctx.currentTime + 0.02;
        const master = ctx.createGain();
        master.gain.setValueAtTime(0, t);
        master.gain.linearRampToValueAtTime(0.24, t + 0.03);
        master.connect(ctx.destination);
        const stops = [];
        const keep = (node) => { stops.push(node); return node; };
        let end = t + 1.8;

        if (key === '1.11') {
            // noise through a swept peaking boost
            const src = keep(ctx.createBufferSource());
            src.buffer = noiseBuffer(ctx, 2.0); src.loop = true;
            const lp = ctx.createBiquadFilter();
            lp.type = 'lowpass'; lp.frequency.value = 6500;
            const peak = ctx.createBiquadFilter();
            peak.type = 'peaking'; peak.Q.value = 5; peak.gain.value = 16;
            peak.frequency.setValueAtTime(180, t);
            peak.frequency.exponentialRampToValueAtTime(3800, t + 1.6);
            const g = ctx.createGain(); g.gain.value = 0.5;
            src.connect(lp).connect(peak).connect(g).connect(master);
            src.start(t); end = t + 1.7;
        } else if (key === '1.9') {
            // pad ducked by a kick, four beats
            const pad = ctx.createGain(); pad.gain.value = 0.5;
            for (const f of [110, 165.3]) {
                const o = keep(ctx.createOscillator());
                o.type = 'sawtooth'; o.frequency.value = f;
                o.connect(pad); o.start(t); o.stop(t + 2.1);
            }
            const lp = ctx.createBiquadFilter();
            lp.type = 'lowpass'; lp.frequency.value = 900;
            const duck = ctx.createGain(); duck.gain.value = 1;
            pad.connect(lp).connect(duck).connect(master);
            for (let i = 0; i < 4; i++) {
                const bt = t + i * 0.5;
                const kick = keep(ctx.createOscillator());
                kick.frequency.setValueAtTime(150, bt);
                kick.frequency.exponentialRampToValueAtTime(48, bt + 0.12);
                const kg = ctx.createGain();
                kg.gain.setValueAtTime(0.9, bt);
                kg.gain.exponentialRampToValueAtTime(0.001, bt + 0.18);
                kick.connect(kg).connect(master);
                kick.start(bt); kick.stop(bt + 0.2);
                duck.gain.setValueAtTime(1, bt);
                duck.gain.linearRampToValueAtTime(0.15, bt + 0.03);
                duck.gain.linearRampToValueAtTime(1, bt + 0.42);
            }
            end = t + 2.1;
        } else if (key === '1.12d') {
            // one pluck into a feedback delay
            const o = keep(ctx.createOscillator());
            o.type = 'triangle'; o.frequency.value = 440;
            const og = ctx.createGain();
            og.gain.setValueAtTime(0.9, t);
            og.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
            const delay = ctx.createDelay(1); delay.delayTime.value = 0.32;
            const fb = ctx.createGain(); fb.gain.value = 0.55;
            o.connect(og); og.connect(master);
            og.connect(delay); delay.connect(fb).connect(delay);
            delay.connect(master);
            o.start(t); o.stop(t + 0.16); end = t + 2.2;
        } else if (key === '1.12r') {
            // dry clap, then the wet one
            keep(clapAt(ctx, master, t));
            const conv = ctx.createConvolver();
            const ir = ctx.createBuffer(2, Math.ceil(ctx.sampleRate * 1.5), ctx.sampleRate);
            for (let ch = 0; ch < 2; ch++) {
                const d = ir.getChannelData(ch);
                for (let i = 0; i < d.length; i++) {
                    d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2.6);
                }
            }
            conv.buffer = ir;
            const wet = ctx.createGain(); wet.gain.value = 1.4;
            conv.connect(wet).connect(master);
            keep(clapAt(ctx, conv, t + 0.75));
            end = t + 2.4;
        } else if (key === '1.3') {
            // saw under an opening low-pass filter
            const o = keep(ctx.createOscillator());
            o.type = 'sawtooth'; o.frequency.value = 110;
            const lp = ctx.createBiquadFilter();
            lp.type = 'lowpass'; lp.Q.value = 7;
            lp.frequency.setValueAtTime(160, t);
            lp.frequency.exponentialRampToValueAtTime(5200, t + 1.5);
            const g = ctx.createGain(); g.gain.value = 0.5;
            o.connect(lp).connect(g).connect(master);
            o.start(t); o.stop(t + 1.7); end = t + 1.7;
        } else if (key === '1.12x') {
            // a clean tone driven into a waveshaper
            const o = keep(ctx.createOscillator());
            o.type = 'sine'; o.frequency.value = 220;
            const pre = ctx.createGain();
            pre.gain.setValueAtTime(0.4, t);
            pre.gain.linearRampToValueAtTime(14, t + 1.5);
            const shaper = ctx.createWaveShaper();
            const curve = new Float32Array(1024);
            for (let i = 0; i < 1024; i++) {
                const x = (i / 511.5) - 1;
                curve[i] = Math.tanh(2.2 * x);
            }
            shaper.curve = curve;
            const lp = ctx.createBiquadFilter();
            lp.type = 'lowpass'; lp.frequency.value = 3800;
            const g = ctx.createGain(); g.gain.value = 0.4;
            o.connect(pre).connect(shaper).connect(lp).connect(g).connect(master);
            o.start(t); o.stop(t + 1.7); end = t + 1.7;
        } else if (key === '1.12m') {
            // chorus: a voice plus its delay-modulated double
            const o = keep(ctx.createOscillator());
            o.type = 'triangle'; o.frequency.value = 220;
            const dry = ctx.createGain(); dry.gain.value = 0.5;
            const delay = ctx.createDelay(0.06); delay.delayTime.value = 0.016;
            const lfo = keep(ctx.createOscillator());
            lfo.frequency.value = 0.9;
            const depth = ctx.createGain(); depth.gain.value = 0.007;
            lfo.connect(depth).connect(delay.delayTime);
            const wet = ctx.createGain(); wet.gain.value = 0.5;
            o.connect(dry).connect(master);
            o.connect(delay).connect(wet).connect(master);
            o.start(t); o.stop(t + 2.1);
            lfo.start(t); lfo.stop(t + 2.1); end = t + 2.1;
        } else if (key === '1.10') {
            // the same pluck left, right, centre
            [[-0.9, 0], [0.9, 0.55], [0, 1.1]].forEach(([pan, dt]) => {
                const o = keep(ctx.createOscillator());
                o.type = 'triangle'; o.frequency.value = 330;
                const g = ctx.createGain();
                g.gain.setValueAtTime(0.8, t + dt);
                g.gain.exponentialRampToValueAtTime(0.001, t + dt + 0.4);
                const p = ctx.createStereoPanner ? ctx.createStereoPanner() : ctx.createGain();
                if (p.pan) p.pan.value = pan;
                o.connect(g).connect(p).connect(master);
                o.start(t + dt); o.stop(t + dt + 0.45);
            });
            end = t + 1.8;
        }

        master.gain.setValueAtTime(0.24, end - 0.15);
        master.gain.linearRampToValueAtTime(0, end);
        this.voice = { master, stops };
        this.currentKey = key;
        const played = key;
        setTimeout(() => {
            if (this.currentKey === played) { this.voice = null; this.currentKey = null; }
        }, (end - ctx.currentTime) * 1000 + 60);
        return SOUND_CAPTIONS[key];
    }
}
