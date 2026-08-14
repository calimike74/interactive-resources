'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure: an "audible" band splits from an "LFO" band at ~20 Hz → the LFO's own
// slow sine trace draws inside its band → a playhead then loops continuously along that trace
// (never stopping, unlike an envelope's single pass) while a parameter dial below mirrors its
// value, showing the LFO moving a target rather than being heard itself.
// Parameterized (title/cycles/lfoAmp) so a second row (rate & depth) can reuse this diagram with
// a faster wobble and a wider swing instead of duplicating the whole canvas.
export default function LfoBasics({ title = 'What Is an LFO?', cycles = 2, lfoAmp = 0.32 } = {}) {
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

        const CYCLE = 640;
        let animId;

        const easeOut = (t) => 1 - Math.pow(1 - t, 3);
        const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
        const progress = (frame, start, dur) => clamp(easeOut(clamp((frame - start) / dur, 0, 1)), 0, 1);

        const VIOLET = '#7c3aed'; // reserved for the LFO control signal, never the audible result

        const draw = () => {
            frameRef.current = (frameRef.current + 1) % CYCLE;
            const f = frameRef.current;
            ctx.clearRect(0, 0, W, H);

            ctx.fillStyle = '#fafafa';
            ctx.fillRect(0, 0, W, H);

            // Title
            const titleP = progress(f, 0, 25);
            ctx.globalAlpha = titleP;
            ctx.fillStyle = '#1a1a6e';
            ctx.font = 'bold 11px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(title, W / 2, 18);
            ctx.globalAlpha = 1;

            const zoneLeft = 50;
            const zoneRight = W - 30;
            const zoneW = zoneRight - zoneLeft;
            const audibleTop = 34;
            const audibleH = 32;
            const dividerY = audibleTop + audibleH;
            const lfoTop = dividerY;
            const lfoH = 70;
            const lfoBase = lfoTop + lfoH;

            // --- Phase 1: audibility zone vs LFO zone, split at ~20 Hz ---
            const zoneP = progress(f, 25, 45);
            if (zoneP > 0) {
                ctx.globalAlpha = zoneP;

                ctx.fillStyle = 'rgba(107, 114, 128, 0.06)';
                ctx.fillRect(zoneLeft, audibleTop, zoneW, audibleH);
                ctx.fillStyle = '#6b7280';
                ctx.font = '8px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('Audible: heard as pitch (e.g. a 220 Hz oscillator)', zoneLeft + 6, audibleTop + 13);

                ctx.fillStyle = 'rgba(124, 58, 237, 0.06)';
                ctx.fillRect(zoneLeft, lfoTop, zoneW, lfoH);
                ctx.fillStyle = VIOLET;
                ctx.font = 'bold 8px -apple-system, sans-serif';
                ctx.fillText('LFO: under ~20 Hz, too slow to hear as pitch', zoneLeft + 6, lfoTop + 12);

                ctx.strokeStyle = '#9ca3af';
                ctx.setLineDash([3, 3]);
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(zoneLeft, dividerY);
                ctx.lineTo(zoneRight, dividerY);
                ctx.stroke();
                ctx.setLineDash([]);

                ctx.fillStyle = '#9ca3af';
                ctx.font = '7px -apple-system, sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText('~20 Hz', zoneRight, dividerY - 3);

                ctx.globalAlpha = 1;
            }

            // --- Phase 2: the LFO's own slow sine trace draws across its band ---
            const lfoMidY = lfoTop + lfoH / 2;
            const lfoAmpPx = lfoH * lfoAmp;
            const lfoValueAt = (nx) => Math.sin(nx * cycles * Math.PI * 2);

            const traceDraw = progress(f, 90, 90);
            if (traceDraw > 0) {
                ctx.globalAlpha = traceDraw;
                ctx.strokeStyle = VIOLET;
                ctx.lineWidth = 2;
                ctx.beginPath();
                const numPoints = Math.floor(zoneW * traceDraw);
                for (let px = 0; px <= numPoints; px++) {
                    const nx = px / zoneW;
                    const y = lfoMidY - lfoValueAt(nx) * lfoAmpPx;
                    if (px === 0) ctx.moveTo(zoneLeft + px, y);
                    else ctx.lineTo(zoneLeft + px, y);
                }
                ctx.stroke();
                ctx.globalAlpha = 1;
            }

            // --- Phase 3: target parameter dial appears below ---
            const dialP = progress(f, 200, 40);
            const dialY = lfoBase + 46;
            const dialTrackW = 200;
            const dialLeft = W / 2 - dialTrackW / 2;
            const dialRight = dialLeft + dialTrackW;

            if (dialP > 0) {
                ctx.globalAlpha = dialP;

                ctx.fillStyle = '#6b7280';
                ctx.font = '9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Target parameter: moved by the LFO, not heard itself', W / 2, dialY - 16);

                ctx.strokeStyle = '#d1d5db';
                ctx.lineWidth = 3;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(dialLeft, dialY);
                ctx.lineTo(dialRight, dialY);
                ctx.stroke();
                ctx.lineCap = 'butt';

                ctx.strokeStyle = '#9ca3af';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(W / 2, dialY - 6);
                ctx.lineTo(W / 2, dialY + 6);
                ctx.stroke();

                ctx.globalAlpha = 1;
            }

            // --- Phase 4: playhead loops continuously along the trace; dial marker mirrors it ---
            if (f >= 260) {
                const loopLen = 190;
                const loopT = ((f - 260) % loopLen) / loopLen;
                const playX = zoneLeft + loopT * zoneW;
                const val = lfoValueAt(loopT);
                const playY = lfoMidY - val * lfoAmpPx;
                const markerX = W / 2 + val * (dialTrackW / 2 - 8);

                ctx.fillStyle = VIOLET;
                ctx.beginPath();
                ctx.arc(playX, playY, 4, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = 'rgba(124, 58, 237, 0.3)';
                ctx.lineWidth = 1;
                ctx.setLineDash([2, 2]);
                ctx.beginPath();
                ctx.moveTo(playX, lfoBase);
                ctx.lineTo(markerX, dialY - 6);
                ctx.stroke();
                ctx.setLineDash([]);

                ctx.fillStyle = VIOLET;
                ctx.beginPath();
                ctx.arc(markerX, dialY, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }

            // Phase indicator
            const phase = f < 90 ? 'Zones' : f < 200 ? 'LFO trace' : f < 260 ? 'Dial' : 'Cycling';
            ctx.fillStyle = '#9ca3af';
            ctx.font = '8px -apple-system, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(phase, W - 20, H - 8);

            // Fade out
            if (f > CYCLE - 40) {
                const fadeOut = progress(f, CYCLE - 40, 40);
                ctx.fillStyle = `rgba(245, 244, 242, ${fadeOut * 0.9})`;
                ctx.fillRect(0, 0, W, H);
            }

            animId = requestAnimationFrame(draw);
        };

        draw();
        return () => cancelAnimationFrame(animId);
    }, [title, cycles, lfoAmp]);

    return (
        <canvas
            ref={canvasRef}
            style={{ width: '100%', height: '100%', borderRadius: '0.75rem' }}
        />
    );
}
