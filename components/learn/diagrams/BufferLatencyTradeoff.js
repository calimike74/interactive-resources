'use client';

import { useEffect, useRef } from 'react';

// Two stacked panels — small buffer vs large buffer — each a growing/resetting
// fill bar (representing one buffer-fill cycle) plus a static latency figure
// and a qualitative CPU-load meter. Colour convention borrowed from the
// existing palette's own fast/slow pairing (AttackRelease.js: '#e85d75' =
// fast, '#2563EB' = slow) — small/fast buffer keeps that pink, large/slow
// buffer keeps that blue, so no new hex is introduced.
//
// Invented/illustrative values (disclosed here and in the task report):
// buffer sizes 64 and 1024 samples are real, commonly-offered DAW buffer
// settings (the usual dropdown runs 32/64/128/256/512/1024/2048 samples),
// not invented numbers. The LATENCY figures are computed, not invented,
// from the standard, defensible formula latency_ms = buffer_samples /
// sample_rate_Hz * 1000, assuming a stated 48,000 Hz sample rate (a
// standard DAW default): 64/48000*1000 ≈ 1.3 ms, 1024/48000*1000 ≈ 21.3 ms
// — both mentally tractable (roughly "divide by 48"). This is a simplified
// ONE-WAY figure for teaching the buffer/latency relationship, not a full
// round-trip system-latency measurement (which would also include converter
// and driver overhead) — that simplification is disclosed on-canvas via the
// "≈" and in the task report. CPU load is shown only qualitatively (a
// relative meter bar + "higher"/"lower" wording) — no specific CPU
// percentage is invented, since no defensible number exists for that.
// Fill-bar cycle SPEED is illustrative/exaggerated for visibility within one
// on-screen animation loop (same precedent as SampleRateGrid.js's CYCLES=6
// "illustrative shape, not a real frequency") — the small-buffer bar cycles
// roughly 4x faster than the large-buffer bar on screen, not the true 16x
// (1024/64) ratio, so both remain visible within the same loop length.
//
// Label-clearance: every rectangle below is STATIC across all frames — only
// fill widths / alphas animate, so these gaps hold at every animation state,
// not just steady state. Panel A: track rect y=[58,80]; header baseline
// y=44 (14px clear above track top); CPU-meter rect y=[88,96] (8px clear
// below track bottom 80); stats text baseline y=95 sits inside that same
// meter row, to its left, not above/below any rect; caption baseline y=112
// (16px clear below the meter rect's bottom, 96). Panel B: track rect
// y=[168,190]; header baseline y=154 (14px clear above); CPU-meter rect
// y=[198,206] (8px clear below track bottom 190); caption baseline y=222
// (16px clear below meter bottom 206). The direct-monitoring note sits at
// y=245 (23px clear below Panel B's caption baseline) and the phase
// indicator at y=272 (H-8, 27px further clear). No bar, tick or meter rect
// ever enters another element's y-band, so no crossing is possible at any
// animation state.
export default function BufferLatencyTradeoff() {
    const canvasRef = useRef(null);
    const frameRef = useRef(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const W = 480;
        const H = 280;
        canvas.width = W * 2;
        canvas.height = H * 2;
        ctx.scale(2, 2);

        const CYCLE = 680;
        let animId;

        const easeOut = (t) => 1 - Math.pow(1 - t, 3);
        const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
        const progress = (frame, start, dur) => clamp(easeOut(clamp((frame - start) / dur, 0, 1)), 0, 1);

        const TRACK_X = 60;
        const TRACK_W = 360;

        const PANELS = [
            {
                headerY: 44, trackY: 58, trackH: 22, statsY: 95, capY: 112,
                color: '#e85d75', period: 60,
                header: 'Small buffer: 64 samples', latency: 'Latency ≈ 1.3 ms',
                caption: 'More refills per second → higher CPU load', cpuFrac: 0.82,
                headerStart: 40, trackStart: 60, fillStart: 90, statsStart: 160, capStart: 190,
            },
            {
                headerY: 154, trackY: 168, trackH: 22, statsY: 205, capY: 222,
                color: '#2563EB', period: 240,
                header: 'Large buffer: 1024 samples', latency: 'Latency ≈ 21.3 ms',
                caption: 'Fewer refills per second → lower CPU load', cpuFrac: 0.22,
                headerStart: 220, trackStart: 240, fillStart: 270, statsStart: 340, capStart: 370,
            },
        ];

        const draw = () => {
            frameRef.current = (frameRef.current + 0.6) % CYCLE;
            const f = frameRef.current;
            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = '#fafafa';
            ctx.fillRect(0, 0, W, H);

            const titleP = progress(f, 0, 20);
            ctx.globalAlpha = titleP;
            ctx.fillStyle = '#1a1a2e';
            ctx.font = 'bold 11px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Buffer Size vs Latency', W / 2, 16);
            ctx.globalAlpha = 1;

            PANELS.forEach((p) => {
                const headerP = progress(f, p.headerStart, 25);
                if (headerP > 0) {
                    ctx.globalAlpha = headerP;
                    ctx.fillStyle = p.color;
                    ctx.font = 'bold 9px -apple-system, sans-serif';
                    ctx.textAlign = 'left';
                    ctx.fillText(p.header, TRACK_X, p.headerY);
                    ctx.globalAlpha = 1;
                }

                const trackP = progress(f, p.trackStart, 25);
                if (trackP > 0) {
                    ctx.globalAlpha = trackP;
                    ctx.strokeStyle = '#d1d5db';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(TRACK_X, p.trackY, TRACK_W, p.trackH);
                    ctx.globalAlpha = 1;
                }

                const fillP = progress(f, p.fillStart, 20);
                if (fillP > 0 && f >= p.fillStart) {
                    // Sawtooth fill-and-reset cycle: illustrates repeated
                    // buffer refill events, not an exact ms-timed animation.
                    const local = (f - p.fillStart) % p.period;
                    const cycleFrac = local / p.period;
                    ctx.globalAlpha = fillP;
                    ctx.fillStyle = p.color;
                    ctx.globalAlpha = fillP * 0.75;
                    ctx.fillRect(TRACK_X, p.trackY, TRACK_W * cycleFrac, p.trackH);
                    ctx.globalAlpha = 1;
                }

                const statsP = progress(f, p.statsStart, 20);
                if (statsP > 0) {
                    ctx.globalAlpha = statsP;
                    ctx.fillStyle = '#374151';
                    ctx.font = 'bold 9px -apple-system, sans-serif';
                    ctx.textAlign = 'left';
                    ctx.fillText(p.latency, TRACK_X, p.statsY);

                    // Qualitative CPU meter — relative bar length only, no
                    // invented percentage number.
                    const meterX = 300;
                    const meterW = 120;
                    const meterH = 8;
                    const meterY = p.statsY - 7;
                    ctx.strokeStyle = '#9ca3af';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(meterX, meterY, meterW, meterH);
                    ctx.fillStyle = p.color;
                    ctx.fillRect(meterX, meterY, meterW * p.cpuFrac, meterH);
                    ctx.fillStyle = '#6b7280';
                    ctx.font = '7px -apple-system, sans-serif';
                    ctx.textAlign = 'left';
                    ctx.fillText('CPU load', meterX, meterY - 3);
                    ctx.globalAlpha = 1;
                }

                const capP = progress(f, p.capStart, 25);
                if (capP > 0) {
                    ctx.globalAlpha = capP;
                    ctx.fillStyle = '#374151';
                    ctx.font = 'italic 8.5px -apple-system, sans-serif';
                    ctx.textAlign = 'left';
                    ctx.fillText(p.caption, TRACK_X, p.capY);
                    ctx.globalAlpha = 1;
                }
            });

            const dmP = progress(f, 410, 25);
            if (dmP > 0) {
                ctx.globalAlpha = dmP;
                ctx.fillStyle = '#374151';
                ctx.font = 'bold 8.5px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Direct monitoring bypasses the buffer entirely: input routed straight to your headphones', W / 2, 245);
                ctx.globalAlpha = 1;
            }

            const phase = f < 220 ? 'Small buffer' : f < 410 ? 'Large buffer' : f < 630 ? 'Direct monitoring' : 'Compare';
            ctx.fillStyle = '#9ca3af';
            ctx.font = '8px -apple-system, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(phase, W - 20, H - 8);

            if (f > CYCLE - 50) {
                const fadeOut = progress(f, CYCLE - 50, 50);
                ctx.fillStyle = `rgba(245, 244, 242, ${fadeOut * 0.9})`;
                ctx.fillRect(0, 0, W, H);
            }

            animId = requestAnimationFrame(draw);
        };

        draw();
        return () => cancelAnimationFrame(animId);
    }, []);

    return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', borderRadius: '0.75rem' }} />;
}
