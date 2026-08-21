'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Shared Web Audio plumbing for benches (BENCH-STANDARD §3 law 5):
// - no AudioContext before a deliberate gesture (begin()),
// - real files from /bench-audio/<bench>/, decoded once and cached,
// - a look-ahead scheduler with bar-aligned tempo changes,
// - a master chain with a safety limiter and an output level,
// - smoothed parameter writes (glide()) so nothing zips or clicks.
//
// The bench supplies the graph between `input` and `master` and a
// `onSchedule(bar, barStartTime, beatSec)` callback that books events for
// the coming bar through `playBuffer`. Every booked event is also pushed to
// `events` (time, duration, level, name) so the stage can draw exactly what
// was sent to the speakers.

const LOOKAHEAD_SEC = 0.12;
const TICK_MS = 25;
const GLIDE_SEC = 0.02;

export function glide(param, value, ctx, tc = GLIDE_SEC) {
    if (!param || !ctx) return;
    param.cancelScheduledValues(ctx.currentTime);
    param.setTargetAtTime(value, ctx.currentTime, tc);
}

export function useBenchAudio({ files, bpm, beatsPerBar = 4, onSchedule, buildGraph }) {
    const ctxRef = useRef(null);
    const nodesRef = useRef(null);
    const buffersRef = useRef({});
    const timerRef = useRef(null);
    const nextBarRef = useRef({ bar: 0, time: 0 });
    const bpmRef = useRef(bpm);
    const pendingBpmRef = useRef(null);
    const eventsRef = useRef([]);
    const onScheduleRef = useRef(onSchedule);
    const [ready, setReady] = useState(false);
    const [playing, setPlaying] = useState(false);
    const [began, setBegan] = useState(false);

    onScheduleRef.current = onSchedule;

    // Decode the files as soon as the bench mounts, with an offline context
    // (no gesture needed, nothing plays), so the stage can draw real
    // envelopes before Play is pressed. AudioBuffers work in any context.
    useEffect(() => {
        let cancelled = false;
        const Offline = window.OfflineAudioContext || window.webkitOfflineAudioContext;
        if (!Offline) return undefined;
        const off = new Offline(1, 1, 44100);
        Promise.all(
            Object.entries(files).map(async ([name, url]) => {
                if (buffersRef.current[name]) return;
                const res = await fetch(url);
                const arr = await res.arrayBuffer();
                const buf = await off.decodeAudioData(arr);
                if (!cancelled) buffersRef.current[name] = buf;
            }),
        ).then(() => { if (!cancelled) setReady(true); }).catch(() => {});
        return () => { cancelled = true; };
    }, [files]);

    // Tempo changes land on the next bar, never mid-pattern.
    useEffect(() => {
        if (!ctxRef.current) { bpmRef.current = bpm; return; }
        pendingBpmRef.current = bpm;
    }, [bpm]);

    const begin = useCallback(async () => {
        if (ctxRef.current) {
            if (ctxRef.current.state === 'suspended') await ctxRef.current.resume();
            return ctxRef.current;
        }
        const Ctx = window.AudioContext || window.webkitAudioContext;
        const ctx = new Ctx({ latencyHint: 'interactive' });
        ctxRef.current = ctx;
        // Counted so scripts/check-bench.mjs can assert "no context before a
        // gesture, one after Play".
        window.__benchAudioContexts = (window.__benchAudioContexts || 0) + 1;

        const input = ctx.createGain();
        const master = ctx.createGain();
        const limiter = ctx.createDynamicsCompressor();
        limiter.threshold.value = -3;
        limiter.knee.value = 0;
        limiter.ratio.value = 20;
        limiter.attack.value = 0.003;
        limiter.release.value = 0.12;
        const level = ctx.createGain();
        master.connect(limiter);
        limiter.connect(level);
        level.connect(ctx.destination);

        const graph = buildGraph ? buildGraph(ctx, input, master) : null;
        nodesRef.current = { input, master, limiter, level, graph };

        await Promise.all(
            Object.entries(files).map(async ([name, url]) => {
                if (buffersRef.current[name]) return;
                const res = await fetch(url);
                const arr = await res.arrayBuffer();
                buffersRef.current[name] = await ctx.decodeAudioData(arr);
            }),
        );
        setReady(true);
        setBegan(true);
        return ctx;
    }, [files, buildGraph]);

    const playBuffer = useCallback((name, when, { gain = 1, destination } = {}) => {
        const ctx = ctxRef.current;
        const buf = buffersRef.current[name];
        if (!ctx || !buf) return null;
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const g = ctx.createGain();
        g.gain.value = gain;
        src.connect(g);
        g.connect(destination || nodesRef.current.input);
        src.start(when);
        eventsRef.current.push({ name, time: when, duration: buf.duration, level: gain });
        // keep the last 12 seconds only
        const cutoff = ctx.currentTime - 12;
        if (eventsRef.current.length > 400) eventsRef.current = eventsRef.current.filter((e) => e.time > cutoff);
        return src;
    }, []);

    const tick = useCallback(() => {
        const ctx = ctxRef.current;
        if (!ctx) return;
        while (nextBarRef.current.time < ctx.currentTime + LOOKAHEAD_SEC) {
            if (pendingBpmRef.current != null) {
                bpmRef.current = pendingBpmRef.current;
                pendingBpmRef.current = null;
            }
            const beatSec = 60 / bpmRef.current;
            const { bar, time } = nextBarRef.current;
            onScheduleRef.current?.({ bar, barStart: time, beatSec, beatsPerBar, playBuffer, ctx });
            nextBarRef.current = { bar: bar + 1, time: time + beatSec * beatsPerBar };
        }
    }, [beatsPerBar, playBuffer]);

    const start = useCallback(async () => {
        const ctx = await begin();
        eventsRef.current = [];
        // Clear whatever the loop still holds from last time, then open up.
        nodesRef.current.graph?.clear?.();
        glide(nodesRef.current.master.gain, 1, ctx, 0.01);
        nextBarRef.current = { bar: 0, time: ctx.currentTime + 0.06 };
        if (pendingBpmRef.current != null) { bpmRef.current = pendingBpmRef.current; pendingBpmRef.current = null; }
        tick();
        timerRef.current = window.setInterval(tick, TICK_MS);
        setPlaying(true);
    }, [begin, tick]);

    const stop = useCallback(() => {
        if (timerRef.current) window.clearInterval(timerRef.current);
        timerRef.current = null;
        const ctx = ctxRef.current;
        if (ctx) {
            // Fade the master rather than suspend the context: a 100%
            // feedback loop would otherwise still be running when play is
            // pressed again, and a suspended context cannot fade anything.
            glide(nodesRef.current.master.gain, 0, ctx, 0.06);
        }
        setPlaying(false);
    }, []);

    useEffect(() => () => {
        if (timerRef.current) window.clearInterval(timerRef.current);
        ctxRef.current?.close?.();
    }, []);

    const getBuffer = useCallback((name) => buffersRef.current[name] || null, []);

    return {
        ctxRef,
        nodesRef,
        eventsRef,
        nextBarRef,
        bpmRef,
        ready,
        began,
        playing,
        begin,
        start,
        stop,
        playBuffer,
        getBuffer,
    };
}

// A buffer's amplitude envelope at `bins` points, for drawing a hit's
// shape on the stage. Cached on the buffer object.
export function envelopeOf(buffer, bins = 96) {
    if (!buffer) return null;
    if (buffer.__env && buffer.__env.length === bins) return buffer.__env;
    const ch = buffer.getChannelData(0);
    const step = Math.max(1, Math.floor(ch.length / bins));
    const env = new Float32Array(bins);
    let peak = 0;
    for (let i = 0; i < bins; i += 1) {
        let m = 0;
        const s = i * step;
        const e = Math.min(ch.length, s + step);
        for (let j = s; j < e; j += 1) { const a = Math.abs(ch[j]); if (a > m) m = a; }
        env[i] = m;
        if (m > peak) peak = m;
    }
    if (peak > 0) for (let i = 0; i < bins; i += 1) env[i] /= peak;
    buffer.__env = env;
    return env;
}
