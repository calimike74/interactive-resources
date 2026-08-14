'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure: same kick pattern, same pad, two release settings — a short
// release (60 ms) snaps back into a tight rhythmic stab; a long release (400 ms) barely
// recovers before the next kick and holds the pad low almost permanently. Release time,
// not trigger or target, is the only thing that changes between the two lanes.
export default function SidechainPumpingRelease() {
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

        const CYCLE = 560;
        let animId;

        const easeOut = (t) => 1 - Math.pow(1 - t, 3);
        const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
        const progress = (frame, start, dur) => clamp(easeOut(clamp((frame - start) / dur, 0, 1)), 0, 1);

        const margin = { left: 24, right: 24 };
        const plotW = W - margin.left - margin.right;
        const KICKS = [0.08, 0.33, 0.58, 0.83];
        const DUCK_AMOUNT = 0.78;

        // Single duck model shared by both lanes — only tau (release time) differs.
        const levelAt = (t, tau) => {
            let dip = 0;
            for (const k of KICKS) {
                if (t >= k) dip += DUCK_AMOUNT * Math.exp(-(t - k) / tau);
            }
            return clamp(1 - dip, 0.06, 1);
        };

        const drawKicks = (laneTop, laneH, alpha) => {
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#374151';
            KICKS.forEach((k) => {
                const x = margin.left + k * plotW;
                ctx.beginPath();
                ctx.moveTo(x - 4, laneTop + laneH + 10);
                ctx.lineTo(x + 4, laneTop + laneH + 10);
                ctx.lineTo(x, laneTop + laneH + 2);
                ctx.fill();
            });
            ctx.globalAlpha = 1;
        };

        const drawLane = (laneTop, laneH, tau, drawP, color) => {
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            const steps = 140;
            const visible = Math.floor(steps * drawP);
            for (let i = 0; i <= visible; i++) {
                const t = i / steps;
                const y = laneTop + laneH - levelAt(t, tau) * laneH;
                const x = margin.left + t * plotW;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        };

        const draw = () => {
            frameRef.current = (frameRef.current + 1) % CYCLE;
            const f = frameRef.current;
            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = '#fafafa';
            ctx.fillRect(0, 0, W, H);

            const titleP = progress(f, 0, 20);
            ctx.globalAlpha = titleP;
            ctx.fillStyle = '#1a1a6e';
            ctx.font = 'bold 11px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Release Writes the Pump', W / 2, 16);
            ctx.globalAlpha = 1;

            const laneH = 62;
            const laneA_top = 44;
            const laneB_top = 166;

            // --- Lane A: short release ---
            const introP = progress(f, 20, 30);
            if (introP > 0) {
                ctx.globalAlpha = introP;
                ctx.fillStyle = '#16a34a';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('Short release: 60 ms', margin.left, laneA_top - 8);
                ctx.globalAlpha = 1;
                drawKicks(laneA_top, laneH, introP);
            }
            const laneAP = progress(f, 50, 70);
            if (laneAP > 0) drawLane(laneA_top, laneH, 0.055, laneAP, '#16a34a');
            const capAP = progress(f, 150, 30);
            if (capAP > 0) {
                ctx.globalAlpha = capAP;
                ctx.fillStyle = '#16a34a';
                ctx.font = '8px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('tight, rhythmic stab', margin.left, laneA_top + laneH + 26);
                ctx.globalAlpha = 1;
            }

            // --- Lane B: long release ---
            const introBP = progress(f, 210, 30);
            if (introBP > 0) {
                ctx.globalAlpha = introBP;
                ctx.fillStyle = '#DC2626';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('Long release: 400 ms', margin.left, laneB_top - 8);
                ctx.globalAlpha = 1;
                drawKicks(laneB_top, laneH, introBP);
            }
            const laneBP = progress(f, 240, 70);
            if (laneBP > 0) drawLane(laneB_top, laneH, 0.38, laneBP, '#DC2626');
            const capBP = progress(f, 340, 30);
            if (capBP > 0) {
                ctx.globalAlpha = capBP;
                ctx.fillStyle = '#DC2626';
                ctx.font = '8px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('barely recovers: holds low almost permanently', margin.left, laneB_top + laneH + 26);
                ctx.globalAlpha = 1;
            }

            const closingP = progress(f, 420, 40);
            if (closingP > 0) {
                ctx.globalAlpha = closingP;
                ctx.fillStyle = '#374151';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Same trigger, same target: the release dial writes the groove', W / 2, 272);
                ctx.globalAlpha = 1;
            }

            const phase = f < 210 ? 'Short' : f < 420 ? 'Long' : 'Compare';
            ctx.fillStyle = '#9ca3af';
            ctx.font = '8px -apple-system, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(phase, W - margin.right, 16);

            if (f > CYCLE - 40) {
                const fadeOut = progress(f, CYCLE - 40, 40);
                ctx.fillStyle = `rgba(245, 244, 242, ${fadeOut * 0.9})`;
                ctx.fillRect(0, 0, W, H);
            }

            animId = requestAnimationFrame(draw);
        };

        draw();
        return () => cancelAnimationFrame(animId);
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{ width: '100%', height: '100%', borderRadius: '0.75rem' }}
        />
    );
}
